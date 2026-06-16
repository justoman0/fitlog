"use client";

import { useState } from "react";
import { WeightEntry } from "@/lib/types";
import { uid } from "@/lib/store";
import { todayISO } from "@/lib/format";
import { Field, Input, Textarea, Button, DecimalInput } from "./ui";

export function WeightForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: WeightEntry;
  onSave: (w: WeightEntry) => void;
  onCancel: () => void;
}) {
  const [date, setDate] = useState(initial?.date ?? todayISO());
  const [weight, setWeight] = useState<number>(initial?.weight ?? 0);
  const [notes, setNotes] = useState(initial?.notes ?? "");

  const save = () => {
    if (!weight) return;
    onSave({
      id: initial?.id ?? uid(),
      date,
      weight,
      notes: notes.trim() || undefined,
      createdAt: initial?.createdAt ?? Date.now(),
    });
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
        <Field label="Weight (kg)">
          <DecimalInput
            placeholder="103.0"
            value={weight}
            onChange={setWeight}
            autoFocus
          />
        </Field>
      </div>
      <Field label="Notes">
        <Textarea
          rows={2}
          placeholder="Morning, fasted..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </Field>
      <div className="flex gap-3 pt-1">
        <Button variant="ghost" className="flex-1" onClick={onCancel}>
          Cancel
        </Button>
        <Button className="flex-1" onClick={save} disabled={!weight}>
          Save weight
        </Button>
      </div>
    </div>
  );
}
