"use client";

import { Workout, Run } from "@/lib/types";
import { fmtDate, epley1RM, pace } from "@/lib/format";
import { Button } from "./ui";

function Section({ title, body }: { title: string; body?: string }) {
  if (!body) return null;
  return (
    <div>
      <div className="text-[10px] font-bold uppercase tracking-wider text-muted">
        {title}
      </div>
      <p className="mt-0.5 whitespace-pre-wrap text-sm">{body}</p>
    </div>
  );
}

export function WorkoutDetail({
  w,
  onEdit,
  onDelete,
}: {
  w: Workout;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="space-y-5">
      <div>
        <span className="text-[10px] font-bold uppercase tracking-wider text-accent">
          Strength · {fmtDate(w.date)}
        </span>
        <h2 className="mt-1 text-2xl font-bold">{w.title}</h2>
        {w.bodyweight != null && (
          <p className="text-sm text-muted">Bodyweight {w.bodyweight} kg</p>
        )}
      </div>

      <div className="space-y-3">
        {w.exercises.map((ex) => {
          const best = ex.sets
            .map((s) => epley1RM(s.weight, s.reps))
            .reduce((a, b) => Math.max(a, b), 0);
          return (
            <div
              key={ex.id}
              className="rounded-2xl bg-card2 border border-line p-3"
            >
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">{ex.name}</h4>
                {best > 0 && (
                  <span className="text-xs text-muted">e1RM {best}kg</span>
                )}
              </div>
              <div className="mt-2 space-y-1">
                {ex.sets.map((s, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 text-sm tabular-nums"
                  >
                    <span className="w-5 text-muted">{i + 1}</span>
                    <span className="font-semibold">{s.weight} kg</span>
                    <span className="text-muted">×</span>
                    <span className="font-semibold">{s.reps}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {w.rating && (
        <div className="grid grid-cols-3 gap-3">
          {(
            [
              ["Effort", w.rating.effort],
              ["Strength", w.rating.strength],
              ["Pump", w.rating.pump],
            ] as const
          ).map(([l, v]) =>
            v ? (
              <div
                key={l}
                className="rounded-xl bg-card2 border border-line p-3 text-center"
              >
                <div className="text-lg font-bold text-accent">{v}/10</div>
                <div className="text-[10px] uppercase text-muted">{l}</div>
              </div>
            ) : null
          )}
        </div>
      )}

      <Section title="Feeling" body={w.feeling} />
      <Section title="Food" body={w.food} />
      <Section title="Notes" body={w.notes} />

      <div className="flex gap-3 pt-2">
        <Button variant="ghost" className="flex-1" onClick={onEdit}>
          Edit
        </Button>
        <Button variant="danger" className="flex-1" onClick={onDelete}>
          Delete
        </Button>
      </div>
    </div>
  );
}

export function RunDetail({
  r,
  onEdit,
  onDelete,
}: {
  r: Run;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="space-y-5">
      <div>
        <span className="text-[10px] font-bold uppercase tracking-wider text-accent2">
          Cardio · {fmtDate(r.date)}
        </span>
        <h2 className="mt-1 text-2xl font-bold">{r.activity}</h2>
        {r.bodyweight != null && (
          <p className="text-sm text-muted">Bodyweight {r.bodyweight} kg</p>
        )}
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl bg-card2 border border-line p-3 text-center">
          <div className="text-lg font-bold tabular-nums">
            {r.distanceKm ?? "—"}
          </div>
          <div className="text-[10px] uppercase text-muted">km</div>
        </div>
        <div className="rounded-xl bg-card2 border border-line p-3 text-center">
          <div className="text-lg font-bold tabular-nums">
            {r.durationMin ?? "—"}
          </div>
          <div className="text-[10px] uppercase text-muted">min</div>
        </div>
        <div className="rounded-xl bg-card2 border border-line p-3 text-center">
          <div className="text-lg font-bold text-accent2">
            {pace(r.distanceKm, r.durationMin)}
          </div>
          <div className="text-[10px] uppercase text-muted">pace</div>
        </div>
      </div>
      <Section title="Feeling" body={r.feeling} />
      <Section title="Notes" body={r.notes} />
      <div className="flex gap-3 pt-2">
        <Button variant="ghost" className="flex-1" onClick={onEdit}>
          Edit
        </Button>
        <Button variant="danger" className="flex-1" onClick={onDelete}>
          Delete
        </Button>
      </div>
    </div>
  );
}
