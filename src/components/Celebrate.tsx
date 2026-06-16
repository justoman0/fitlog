"use client";

import { useEffect, useState } from "react";
import { AppData, Workout } from "@/lib/types";
import { epley1RM } from "@/lib/format";
import { Button } from "./ui";
import { Confetti } from "./Confetti";

export function Celebrate({
  workout,
  data,
  onDone,
}: {
  workout: Workout;
  data: AppData;
  onDone: () => void;
}) {
  const [recap, setRecap] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  const totalSets = workout.exercises.reduce((n, e) => n + e.sets.length, 0);
  const totalVolume = workout.exercises
    .flatMap((e) =>
      e.sets.map((s) => s.weight * s.reps * (e.perSide ? 2 : 1))
    )
    .reduce((a, b) => a + b, 0);
  const bestE1RM = workout.exercises
    .flatMap((e) => e.sets.map((s) => epley1RM(s.weight, s.reps)))
    .reduce((a, b) => Math.max(a, b), 0);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/coach", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mode: "recap", workout, ...data }),
        });
        const json = await res.json();
        if (!alive) return;
        if (json.recap) setRecap(json.recap);
        else setFailed(true);
      } catch {
        if (alive) setFailed(true);
      }
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="relative">
      <Confetti />
      <div className="relative space-y-5 py-2 text-center">
        <div>
          <div className="text-5xl">🎉</div>
          <h2 className="mt-2 text-2xl font-bold">Workout complete!</h2>
          <p className="text-sm text-muted">{workout.title}</p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Mini label="Exercises" value={workout.exercises.length} />
          <Mini label="Total sets" value={totalSets} />
          <Mini
            label="Volume"
            value={`${Math.round(totalVolume).toLocaleString()}kg`}
          />
        </div>

        <div className="rounded-2xl bg-card border border-line p-4 text-left min-h-[88px]">
          <div className="text-[10px] font-bold uppercase tracking-wider text-accent">
            Coach recap
          </div>
          {recap ? (
            <p className="mt-1.5 text-sm leading-relaxed">{recap}</p>
          ) : failed ? (
            <p className="mt-1.5 text-sm text-muted">
              Logged! {bestE1RM > 0 ? `Top set ≈ ${bestE1RM}kg e1RM. ` : ""}
              Solid work — keep stacking sessions. 💪
            </p>
          ) : (
            <div className="mt-3 flex items-center gap-2 text-sm text-muted">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-line border-t-accent" />
              Coach is writing your recap…
            </div>
          )}
        </div>

        <Button className="w-full" onClick={onDone}>
          Let&apos;s go 🔥
        </Button>
      </div>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl bg-card2 border border-line p-3">
      <div className="text-lg font-bold tabular-nums text-accent">{value}</div>
      <div className="text-[10px] uppercase text-muted">{label}</div>
    </div>
  );
}
