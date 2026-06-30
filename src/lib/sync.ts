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

  // One smart action: sign in if the account exists, otherwise create it.
  const authenticate = useCallback(
    async (emailRaw: string, password: string) => {
      const email = emailRaw.trim();
      const signInRes = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (!signInRes.error) return null;

      const msg = signInRes.error.message.toLowerCase();
      // Likely a brand-new account → create it.
      if (msg.includes("invalid") || msg.includes("credentials")) {
        const signUpRes = await supabase.auth.signUp({ email, password });
        if (!signUpRes.error) {
          if (!signUpRes.data.session) {
            return "Account created — now tap Sign in again to log in.";
          }
          return null;
        }
        const upMsg = signUpRes.error.message.toLowerCase();
        if (upMsg.includes("already") || upMsg.includes("registered")) {
          return "Wrong password for this email.";
        }
        return signUpRes.error.message;
      }
      return signInRes.error.message;
    },
    []
  );

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  return { user, status, authenticate, signOut };
}
