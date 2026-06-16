"use client";

import { useState } from "react";
import { Workout, Exercise } from "@/lib/types";
import { uid } from "@/lib/store";
import { todayISO } from "@/lib/format";
import { Field, Input, Textarea, Button, DecimalInput, Toggle } from "./ui";

function blankExercise(): Exercise {
  return { id: uid(), name: "", sets: [{ weight: 0, reps: 0 }] };
}

export function WorkoutForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Workout;
  onSave: (w: Workout) => void;
  onCancel: () => void;
}) {
  const [date, setDate] = useState(initial?.date ?? todayISO());
  const [title, setTitle] = useState(initial?.title ?? "");
  const [bodyweight, setBodyweight] = useState<number>(
    initial?.bodyweight ?? 0
  );
  const [fixingNames, setFixingNames] = useState(false);
  const [feeling, setFeeling] = useState(initial?.feeling ?? "");
  const [food, setFood] = useState(initial?.food ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [effort, setEffort] = useState(initial?.rating?.effort ?? 0);
  const [strength, setStrength] = useState(initial?.rating?.strength ?? 0);
  const [pump, setPump] = useState(initial?.rating?.pump ?? 0);
  const [exercises, setExercises] = useState<Exercise[]>(
    initial?.exercises?.length ? initial.exercises : [blankExercise()]
  );

  const updateEx = (id: string, patch: Partial<Exercise>) =>
    setExercises((xs) => xs.map((x) => (x.id === id ? { ...x, ...patch } : x)));

  const updateSet = (
    exId: string,
    idx: number,
    patch: Partial<{ weight: number; reps: number }>
  ) =>
    setExercises((xs) =>
      xs.map((x) =>
        x.id === exId
          ? {
              ...x,
              sets: x.sets.map((s, i) => (i === idx ? { ...s, ...patch } : s)),
            }
          : x
      )
    );

  const addSet = (exId: string) =>
    setExercises((xs) =>
      xs.map((x) => {
        if (x.id !== exId) return x;
        const last = x.sets[x.sets.length - 1] ?? { weight: 0, reps: 0 };
        return { ...x, sets: [...x.sets, { ...last }] };
      })
    );

  const removeSet = (exId: string, idx: number) =>
    setExercises((xs) =>
      xs.map((x) =>
        x.id === exId
          ? { ...x, sets: x.sets.filter((_, i) => i !== idx) }
          : x
      )
    );

  const fixNames = async () => {
    const names = exercises.map((x) => x.name.trim());
    if (!names.some(Boolean)) return;
    setFixingNames(true);
    try {
      const res = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "fixnames", names }),
      });
      const json = await res.json();
      if (Array.isArray(json.names)) {
        setExercises((xs) =>
          xs.map((x, i) =>
            json.names[i] ? { ...x, name: json.names[i] } : x
          )
        );
      }
    } catch {
      /* ignore — keep typed names */
    } finally {
      setFixingNames(false);
    }
  };

  const save = () => {
    const cleaned = exercises
      .map((x) => ({
        ...x,
        name: x.name.trim(),
        sets: x.sets.filter((s) => s.weight > 0 || s.reps > 0),
      }))
      .filter((x) => x.name);
    const w: Workout = {
      id: initial?.id ?? uid(),
      kind: "strength",
      date,
      title: title.trim() || "Workout",
      bodyweight: bodyweight || undefined,
      exercises: cleaned,
      feeling: feeling.trim() || undefined,
      food: food.trim() || undefined,
      notes: notes.trim() || undefined,
      rating:
        effort || strength || pump
          ? { effort, strength, pump }
          : undefined,
      createdAt: initial?.createdAt ?? Date.now(),
    };
    onSave(w);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Date">
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </Field>
        <Field label="Bodyweight (kg)">
          <DecimalInput
            placeholder="103"
            value={bodyweight}
            onChange={setBodyweight}
          />
        </Field>
      </div>
      <Field label="Session title">
        <Input
          placeholder="Shoulder & Abs"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </Field>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-xs font-medium uppercase tracking-wide text-muted">
            Exercises
          </div>
          <button
            type="button"
            onClick={fixNames}
            disabled={fixingNames || !exercises.some((x) => x.name.trim())}
            className="rounded-full border border-line bg-card2 px-3 py-1 text-xs text-accent2 active:opacity-70 disabled:opacity-40"
          >
            {fixingNames ? "Fixing…" : "✨ Fix names"}
          </button>
        </div>
        {exercises.map((ex, exIdx) => (
          <div
            key={ex.id}
            className="rounded-2xl bg-card2 border border-line p-3 space-y-2 pop"
          >
            <div className="flex items-center gap-2">
              <Input
                placeholder={`Exercise ${exIdx + 1}`}
                value={ex.name}
                onChange={(e) => updateEx(ex.id, { name: e.target.value })}
              />
              {exercises.length > 1 && (
                <button
                  onClick={() =>
                    setExercises((xs) => xs.filter((x) => x.id !== ex.id))
                  }
                  className="shrink-0 rounded-lg px-2 py-2 text-red-400"
                  aria-label="Remove exercise"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="grid grid-cols-[1.5rem_1fr_0.6rem_1fr_1.75rem] gap-2 px-1 text-[10px] uppercase text-muted">
                <span>Set</span>
                <span>Kg{ex.perSide ? "/side" : ""}</span>
                <span />
                <span>Reps</span>
                <span />
              </div>
              {ex.sets.map((s, i) => (
                <div
                  key={i}
                  className="grid grid-cols-[1.5rem_1fr_0.6rem_1fr_1.75rem] items-center gap-2"
                >
                  <span className="text-center text-sm font-semibold text-muted">
                    {i + 1}
                  </span>
                  <DecimalInput
                    value={s.weight}
                    placeholder="0"
                    onChange={(n) => updateSet(ex.id, i, { weight: n })}
                  />
                  <span className="text-center text-muted">×</span>
                  <Input
                    type="number"
                    inputMode="numeric"
                    value={s.reps || ""}
                    placeholder="0"
                    onChange={(e) =>
                      updateSet(ex.id, i, {
                        reps: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                  <button
                    onClick={() => removeSet(ex.id, i)}
                    disabled={ex.sets.length === 1}
                    className="text-muted disabled:opacity-20"
                    aria-label="Remove set"
                  >
                    −
                  </button>
                </div>
              ))}
              <button
                onClick={() => addSet(ex.id)}
                className="mt-1 w-full rounded-lg border border-line py-1.5 text-xs text-accent active:opacity-70"
              >
                + Add set
              </button>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-1">
                <Toggle
                  checked={!!ex.perSide}
                  onChange={(v) => updateEx(ex.id, { perSide: v })}
                  label="Per side (1 arm/leg)"
                />
                {exIdx > 0 && (
                  <Toggle
                    checked={!!ex.superset}
                    onChange={(v) => updateEx(ex.id, { superset: v })}
                    label="Superset w/ above"
                  />
                )}
              </div>
              {ex.perSide && (
                <p className="text-[11px] text-muted">
                  Enter the weight on <b>one</b> side — each arm/leg is counted
                  separately.
                </p>
              )}
            </div>
          </div>
        ))}
        <button
          onClick={() => setExercises((xs) => [...xs, blankExercise()])}
          className="w-full rounded-xl border border-dashed border-line py-2.5 text-sm text-accent active:opacity-70"
        >
          + Add exercise
        </button>
      </div>

      <Field label="How are you feeling?">
        <Textarea
          rows={2}
          placeholder="Feeling good, no water during training, skipped cardio..."
          value={feeling}
          onChange={(e) => setFeeling(e.target.value)}
        />
      </Field>
      <Field label="Food / nutrition">
        <Input
          placeholder="Food wasn't very lean"
          value={food}
          onChange={(e) => setFood(e.target.value)}
        />
      </Field>

      <div className="grid grid-cols-3 gap-3">
        {(
          [
            ["Effort", effort, setEffort],
            ["Strength", strength, setStrength],
            ["Pump", pump, setPump],
          ] as const
        ).map(([label, val, setter]) => (
          <Field key={label} label={label}>
            <DecimalInput
              placeholder="0–10"
              value={val}
              onChange={(n) => setter(n)}
            />
          </Field>
        ))}
      </div>

      <Field label="Notes / thoughts">
        <Textarea
          rows={3}
          placeholder="Progression notes, what to try next session..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </Field>

      <div className="flex gap-3 pt-1">
        <Button variant="ghost" className="flex-1" onClick={onCancel}>
          Cancel
        </Button>
        <Button className="flex-1" onClick={save}>
          Save workout
        </Button>
      </div>
    </div>
  );
}
