"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "./supabase";
import { AppData } from "./types";

export type SyncStatus = "offline" | "syncing" | "synced" | "error";

function unionById<T extends { id: string }>(a: T[], b: T[]): T[] {
  const map = new Map<string, T>();
  for (const x of [...a, ...b]) if (x && x.id) map.set(x.id, x);
  return [...map.values()];
}

function mergeData(a: AppData, b: AppData): AppData {
  return {
    workouts: unionById(a.workouts, b.workouts),
    runs: unionById(a.runs, b.runs),
    weights: unionById(a.weights, b.weights),
  };
}

export function useAuthSync(
  data: AppData,
  update: (fn: (d: AppData) => AppData) => void,
  loaded: boolean
) {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<SyncStatus>("offline");
  const didInitialSync = useRef(false);
  const pushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Track auth session
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
      if (!session) {
        didInitialSync.current = false;
        setStatus("offline");
      }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  // On login: pull cloud, merge with local, push merged back
  useEffect(() => {
    if (!user || !loaded || didInitialSync.current) return;
    didInitialSync.current = true;
    (async () => {
      setStatus("syncing");
      try {
        const { data: row, error } = await supabase
          .from("app_data")
          .select("data")
          .eq("user_id", user.id)
          .maybeSingle();
        if (error) throw error;
        const cloud: AppData =
          (row?.data as AppData) ?? { workouts: [], runs: [], weights: [] };
        update((local) => {
          const merged = mergeData(local, cloud);
          void supabase.from("app_data").upsert({
            user_id: user.id,
            data: merged,
            updated_at: new Date().toISOString(),
          });
          return merged;
        });
        setStatus("synced");
      } catch {
        setStatus("error");
      }
    })();
  }, [user, loaded, update]);

  // Push on every change (debounced) once synced
  useEffect(() => {
    if (!user || !didInitialSync.current) return;
    if (pushTimer.current) clearTimeout(pushTimer.current);
    setStatus("syncing");
    pushTimer.current = setTimeout(() => {
      supabase
        .from("app_data")
        .upsert({
          user_id: user.id,
          data,
          updated_at: new Date().toISOString(),
        })
        .then(({ error }) => setStatus(error ? "error" : "synced"));
    }, 1200);
  }, [data, user]);

  const signIn = useCallback(async (email: string) => {
    const redirect =
      typeof window !== "undefined" ? window.location.origin : undefined;
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: redirect },
    });
    return error?.message ?? null;
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  return { user, status, signIn, signOut };
}
