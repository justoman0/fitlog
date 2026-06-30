"use client";

import { Workout, Run } from "@/lib/types";
import { fmtDate, epley1RM, pace } from "@/lib/format";
import { IconDumbbell, IconRun } from "./Icons";

function PlannedTag() {
  return (
    <span className="rounded-md bg-accent2/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-accent2 font-display">
      Planned
    </span>
  );
}

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
      className="group w-full overflow-hidden rounded-2xl border border-line bg-card text-left transition active:scale-[0.99]"
    >
      <div className="flex items-stretch">
        <div className="flex w-14 shrink-0 items-center justify-center bg-accent/10 text-accent">
          <IconDumbbell width={24} height={24} />
        </div>
        <div className="min-w-0 flex-1 p-4">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-accent font-display">
              Strength
            </span>
            {w.planned && <PlannedTag />}
          </div>
          <h3 className="mt-0.5 truncate text-lg font-bold uppercase leading-tight">
            {w.title}
          </h3>
          <p className="text-xs text-muted">{fmtDate(w.date)}</p>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
            <span>
              <b className="font-display text-sm text-foreground">
                {w.exercises.length}
              </b>{" "}
              exercises
            </span>
            <span>
              <b className="font-display text-sm text-foreground">
                {totalSets}
              </b>{" "}
              sets
            </span>
            {best > 0 && (
              <span>
                <b className="font-display text-sm text-accent">{best}kg</b>{" "}
                top e1RM
              </span>
            )}
          </div>
        </div>
        {w.bodyweight && (
          <div className="flex flex-col items-end justify-center pr-4 text-right">
            <div className="font-display text-lg font-bold tabular-nums">
              {w.bodyweight}
            </div>
            <div className="text-[9px] uppercase tracking-wider text-muted">
              kg BW
            </div>
          </div>
        )}
      </div>
    </button>
  );
}

export function RunCard({ r, onClick }: { r: Run; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full overflow-hidden rounded-2xl border border-line bg-card text-left transition active:scale-[0.99]"
    >
      <div className="flex items-stretch">
        <div className="flex w-14 shrink-0 items-center justify-center bg-accent2/10 text-accent2">
          <IconRun width={24} height={24} />
        </div>
        <div className="min-w-0 flex-1 p-4">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-accent2 font-display">
              Cardio
            </span>
            {r.planned && <PlannedTag />}
          </div>
          <h3 className="mt-0.5 truncate text-lg font-bold uppercase leading-tight">
            {r.activity}
          </h3>
          <p className="text-xs text-muted">{fmtDate(r.date)}</p>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
            {r.distanceKm != null && (
              <span>
                <b className="font-display text-sm text-foreground">
                  {r.distanceKm}
                </b>{" "}
                km
              </span>
            )}
            {r.durationMin != null && (
              <span>
                <b className="font-display text-sm text-foreground">
                  {r.durationMin}
                </b>{" "}
                min
              </span>
            )}
            {r.distanceKm && r.durationMin && (
              <span className="text-accent2">{pace(r.distanceKm, r.durationMin)}</span>
            )}
          </div>
        </div>
        {r.bodyweight && (
          <div className="flex flex-col items-end justify-center pr-4 text-right">
            <div className="font-display text-lg font-bold tabular-nums">
              {r.bodyweight}
            </div>
            <div className="text-[9px] uppercase tracking-wider text-muted">
              kg BW
            </div>
          </div>
        )}
      </div>
    </button>
  );
}
