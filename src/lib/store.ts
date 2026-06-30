"use client";

import { useEffect, useState, useCallback } from "react";
import { AppData, emptyData } from "./types";

const KEY = "fitlog-v1";

export function loadData(): AppData {
  if (typeof window === "undefined") return emptyData;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return emptyData;
    const parsed = JSON.parse(raw);
    return {
      workouts: parsed.workouts ?? [],
      runs: parsed.runs ?? [],
      weights: parsed.weights ?? [],
      profile: parsed.profile ?? {},
      strains: parsed.strains ?? [],
      coachMemory: parsed.coachMemory ?? { notes: "" },
    };
  } catch {
    return emptyData;
  }
}

export function saveData(data: AppData) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(data));
}

export function useStore() {
  const [data, setData] = useState<AppData>(emptyData);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setData(loadData());
    setLoaded(true);
  }, []);

  const update = useCallback((fn: (d: AppData) => AppData) => {
    setData((prev) => {
      const next = fn(prev);
      saveData(next);
      return next;
    });
  }, []);

  return { data, update, loaded };
}

export const uid = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
