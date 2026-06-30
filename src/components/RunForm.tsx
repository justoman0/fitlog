"use client";

import { useState } from "react";
import { Run } from "@/lib/types";
import { uid } from "@/lib/store";
import { todayISO, pace } from "@/lib/format";
import { Field, Input, Textarea, Button, DecimalInput } from "./ui";

const ACTIVITIES = ["Run", "Stairmaster", "Bike", "Walk", "Row", "Swim"];

export function RunForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Run;
  onSave: (r: Run) => void;
  onCancel: () => void;
}) {
  const [date, setDate] = useState(initial?.date ?? todayISO());
  const [activity, setActivity] = useState(initial?.activity ?? "Run");
  const [km, setKm] = useState<number>(initial?.distanceKm ?? 0);
  const [min, setMin] = useState<number>(initial?.durationMin ?? 0);
  const [bodyweight, setBodyweight] = useState<number>(
    initial?.bodyweight ?? 0
  );
  const [feeling, setFeeling] = useState(initial?.feeling ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");

  const save = () => {
    const r: Run = {
      id: initial?.id ?? uid(),
      kind: "cardio",
      date,
      activity,
      distanceKm: km || undefined,
      durationMin: min || undefined,
      bodyweight: bodyweight || undefined,
      feeling: feeling.trim() || undefined,
      notes: notes.trim() || undefined,
      createdAt: initial?.createdAt ?? Date.now(),
    };
    onSave(r);
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

      <Field label="Activity">
        <div className="flex flex-wrap gap-2">
          {ACTIVITIES.map((a) => (
            <button
              key={a}
              onClick={() => setActivity(a)}
              className={`rounded-full px-3.5 py-1.5 text-sm transition ${
                activity === a
                  ? "bg-accent text-[#1a0f04] font-bold"
                  : "bg-card2 border border-line text-muted"
              }`}
            >
              {a}
            </button>
          ))}
        </div>
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Distance (km)">
          <DecimalInput placeholder="5.0" value={km} onChange={setKm} />
        </Field>
        <Field label="Duration (min)">
          <DecimalInput placeholder="30" value={min} onChange={setMin} />
        </Field>
      </div>

      {km > 0 && min > 0 && (
        <div className="rounded-xl bg-card2 border border-line px-4 py-3 text-sm">
          <span className="text-muted">Pace: </span>
          <span className="font-semibold text-accent">{pace(km, min)}</span>
        </div>
      )}

      <Field label="How did it feel?">
        <Textarea
          rows={2}
          placeholder="Legs felt heavy, knees ok..."
          value={feeling}
          onChange={(e) => setFeeling(e.target.value)}
        />
      </Field>
      <Field label="Notes">
        <Textarea
          rows={2}
          placeholder="Anything to remember"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </Field>

      <div className="flex gap-3 pt-1">
        <Button variant="ghost" className="flex-1" onClick={onCancel}>
          Cancel
        </Button>
        <Button className="flex-1" onClick={save}>
          Save cardio
        </Button>
      </div>
    </div>
  );
}
