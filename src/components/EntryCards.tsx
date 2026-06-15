"use client";

import { Workout, Run } from "@/lib/types";
import { fmtDate, epley1RM, pace } from "@/lib/format";

export function WorkoutCard({
  w,
  onClick,
}: {
  w: Workout;
  onClick?: () => void;
}) {
  const totalSets = w.exercises.reduce((n, e) => n + e.sets.length, 0);
  const best = w.exercises
    .flatMap((e) => e.sets.map((s) => epley1RM(s.weight, s.reps)))
    .reduce((a, b) => Math.max(a, b), 0);
  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-2xl bg-card border border-line p-4 active:opacity-80 transition"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-accent">
              Strength
            </span>
          </div>
          <h3 className="mt-0.5 font-semibold">{w.title}</h3>
          <p className="text-xs text-muted">{fmtDate(w.date)}</p>
        </div>
        {w.bodyweight && (
          <div className="text-right">
            <div className="text-sm font-semibold tabular-nums">
              {w.bodyweight}kg
            </div>
            <div className="text-[10px] text-muted">bodyweight</div>
          </div>
        )}
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {w.exercises.slice(0, 4).map((e) => (
          <span
            key={e.id}
            className="rounded-full bg-card2 border border-line px-2.5 py-1 text-xs text-muted"
          >
            {e.name}
          </span>
        ))}
        {w.exercises.length > 4 && (
          <span className="rounded-full bg-card2 border border-line px-2.5 py-1 text-xs text-muted">
            +{w.exercises.length - 4}
          </span>
        )}
      </div>
      <div className="mt-3 flex gap-4 text-xs text-muted">
        <span>{w.exercises.length} exercises</span>
        <span>{totalSets} sets</span>
        {best > 0 && <span>best e1RM {best}kg</span>}
      </div>
    </button>
  );
}

export function RunCard({ r, onClick }: { r: Run; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-2xl bg-card border border-line p-4 active:opacity-80 transition"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-accent2">
            Cardio
          </span>
          <h3 className="mt-0.5 font-semibold">{r.activity}</h3>
          <p className="text-xs text-muted">{fmtDate(r.date)}</p>
        </div>
        {r.bodyweight && (
          <div className="text-right">
            <div className="text-sm font-semibold tabular-nums">
              {r.bodyweight}kg
            </div>
            <div className="text-[10px] text-muted">bodyweight</div>
          </div>
        )}
      </div>
      <div className="mt-3 flex gap-4 text-sm">
        {r.distanceKm != null && (
          <div>
            <span className="font-semibold tabular-nums">{r.distanceKm}</span>
            <span className="text-muted text-xs"> km</span>
          </div>
        )}
        {r.durationMin != null && (
          <div>
            <span className="font-semibold tabular-nums">{r.durationMin}</span>
            <span className="text-muted text-xs"> min</span>
          </div>
        )}
        {r.distanceKm && r.durationMin && (
          <div className="text-accent2 text-xs self-center">
            {pace(r.distanceKm, r.durationMin)}
          </div>
        )}
      </div>
    </button>
  );
}
