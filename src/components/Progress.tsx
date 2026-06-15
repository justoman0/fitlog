"use client";

import { useMemo, useState } from "react";
import { AppData, WeightEntry } from "@/lib/types";
import { epley1RM, fmtDateShort } from "@/lib/format";
import { LineChart } from "./LineChart";
import { Button, Empty } from "./ui";

export function Progress({
  data,
  onAddWeight,
  onDeleteWeight,
}: {
  data: AppData;
  onAddWeight: () => void;
  onDeleteWeight: (id: string) => void;
}) {
  const weights = useMemo(
    () => [...data.weights].sort((a, b) => (a.date < b.date ? -1 : 1)),
    [data.weights]
  );

  // performed (non-planned) strength sessions, chronological
  const sessions = useMemo(
    () =>
      [...data.workouts]
        .filter((w) => !w.planned && w.exercises.length)
        .sort((a, b) => (a.date < b.date ? -1 : 1)),
    [data.workouts]
  );

  const e1rmSeries = useMemo(
    () =>
      sessions
        .map((s) => ({
          x: s.date,
          y: s.exercises
            .flatMap((e) => e.sets.map((st) => epley1RM(st.weight, st.reps)))
            .reduce((a, b) => Math.max(a, b), 0),
        }))
        .filter((p) => p.y > 0),
    [sessions]
  );

  const volumeSeries = useMemo(
    () =>
      sessions
        .map((s) => ({
          x: s.date,
          y: s.exercises
            .flatMap((e) => e.sets.map((st) => st.weight * st.reps))
            .reduce((a, b) => a + b, 0),
        }))
        .filter((p) => p.y > 0),
    [sessions]
  );

  // per-exercise e1RM progression
  const exerciseNames = useMemo(() => {
    const counts = new Map<string, number>();
    for (const s of sessions)
      for (const e of s.exercises)
        counts.set(e.name, (counts.get(e.name) ?? 0) + 1);
    return [...counts.entries()]
      .filter(([, n]) => n >= 2)
      .sort((a, b) => b[1] - a[1])
      .map(([name]) => name);
  }, [sessions]);

  const [selected, setSelected] = useState<string | null>(null);
  const exName = selected ?? exerciseNames[0] ?? null;

  const exerciseSeries = useMemo(() => {
    if (!exName) return [];
    return sessions
      .map((s) => {
        const ex = s.exercises.find((e) => e.name === exName);
        if (!ex) return null;
        const best = ex.sets
          .map((st) => epley1RM(st.weight, st.reps))
          .reduce((a, b) => Math.max(a, b), 0);
        return best > 0 ? { x: s.date, y: best } : null;
      })
      .filter((p): p is { x: string; y: number } => p !== null);
  }, [sessions, exName]);

  return (
    <div className="space-y-5">
      {/* Bodyweight */}
      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-lg font-bold">Bodyweight</h2>
          <Button onClick={onAddWeight}>+ Log</Button>
        </div>
        {weights.length >= 2 ? (
          <Card>
            <LineChart
              points={weights.map((w) => ({ x: w.date, y: w.weight }))}
              unit="kg"
              height={180}
            />
          </Card>
        ) : (
          <Empty>Log at least 2 weigh-ins to see your trend.</Empty>
        )}
      </section>

      {/* Strength e1RM */}
      <section>
        <h2 className="mb-2 text-lg font-bold">Strength trend</h2>
        {e1rmSeries.length >= 2 ? (
          <Card>
            <div className="mb-1 text-xs text-muted">
              Best estimated 1RM per session (kg)
            </div>
            <LineChart points={e1rmSeries} unit="kg" height={160} />
          </Card>
        ) : (
          <Empty>Log 2+ strength sessions to track your strength.</Empty>
        )}
      </section>

      {/* Volume */}
      {volumeSeries.length >= 2 && (
        <section>
          <h2 className="mb-2 text-lg font-bold">Total volume</h2>
          <Card>
            <div className="mb-1 text-xs text-muted">
              Total kg lifted per session (weight × reps)
            </div>
            <LineChart points={volumeSeries} unit="" height={160} />
          </Card>
        </section>
      )}

      {/* Per exercise */}
      {exerciseNames.length > 0 && exName && (
        <section>
          <h2 className="mb-2 text-lg font-bold">By exercise</h2>
          <div className="mb-2 flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {exerciseNames.map((n) => (
              <button
                key={n}
                onClick={() => setSelected(n)}
                className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm transition ${
                  n === exName
                    ? "bg-accent text-black font-semibold"
                    : "bg-card border border-line text-muted"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
          {exerciseSeries.length >= 2 ? (
            <Card>
              <div className="mb-1 text-xs text-muted">{exName} — e1RM (kg)</div>
              <LineChart points={exerciseSeries} unit="kg" height={150} />
            </Card>
          ) : (
            <Empty>Not enough data for {exName} yet.</Empty>
          )}
        </section>
      )}

      {/* Weight log list */}
      {weights.length > 0 && (
        <section>
          <h3 className="mb-2 text-sm font-semibold text-muted">
            Weigh-in history
          </h3>
          <div className="space-y-2">
            {[...weights].reverse().map((w: WeightEntry) => (
              <div
                key={w.id}
                className="flex items-center justify-between rounded-xl bg-card border border-line px-4 py-2.5"
              >
                <div>
                  <span className="font-semibold tabular-nums">
                    {w.weight} kg
                  </span>
                  <span className="ml-2 text-xs text-muted">
                    {fmtDateShort(w.date)}
                    {w.notes ? ` · ${w.notes}` : ""}
                  </span>
                </div>
                <button
                  onClick={() => onDeleteWeight(w.id)}
                  className="text-xs text-red-400/80 active:opacity-60"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-card border border-line p-4">{children}</div>
  );
}
