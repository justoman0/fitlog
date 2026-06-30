"use client";

import { useState } from "react";
import { Strain } from "@/lib/types";
import { uid } from "@/lib/store";
import { todayISO } from "@/lib/format";
import { Field, Input, Textarea, Button } from "./ui";

const AREAS = [
  "Shoulder",
  "Wrist",
  "Elbow",
  "Lower back",
  "Knee",
  "Ankle",
  "Hip",
  "Neck",
  "Hamstring",
  "Other",
];

const SEVERITIES: Strain["severity"][] = ["minor", "sore", "painful"];

export function StrainForm({
  onSave,
  onCancel,
}: {
  onSave: (s: Strain) => void;
  onCancel: () => void;
}) {
  const [area, setArea] = useState("");
  const [custom, setCustom] = useState("");
  const [severity, setSeverity] = useState<Strain["severity"]>("minor");
  const [note, setNote] = useState("");

  const finalArea = area === "Other" ? custom.trim() : area;

  const save = () => {
    if (!finalArea) return;
    onSave({
      id: uid(),
      area: finalArea,
      severity,
      note: note.trim() || undefined,
      date: todayISO(),
      active: true,
      createdAt: Date.now(),
    });
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold uppercase tracking-wide">
          Flag an injury
        </h2>
        <p className="mt-1 text-sm text-muted">
          Tell your coach what&apos;s bothering you — it&apos;ll route your
          training around it until you mark it healed.
        </p>
      </div>

      <Field label="Where?">
        <div className="flex flex-wrap gap-2">
          {AREAS.map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => setArea(a)}
              className={`rounded-full px-3.5 py-2 text-sm transition active:scale-95 ${
                area === a
                  ? "bg-accent text-[#1a0f04] font-bold"
                  : "bg-card2 border border-line text-muted"
              }`}
            >
              {a}
            </button>
          ))}
        </div>
      </Field>

      {area === "Other" && (
        <Field label="Specify">
          <Input
            placeholder="e.g. Achilles"
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            autoFocus
          />
        </Field>
      )}

      <Field label="How bad?">
        <div className="flex gap-2">
          {SEVERITIES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSeverity(s)}
              className={`flex-1 rounded-xl px-3 py-2.5 text-sm capitalize transition active:scale-95 ${
                severity === s
                  ? "bg-accent text-[#1a0f04] font-bold"
                  : "bg-card2 border border-line text-muted"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </Field>

      <Field label="Notes (optional)">
        <Textarea
          rows={2}
          placeholder="Flared up during squats, sharp on the way down..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </Field>

      <div className="flex gap-3 pt-1">
        <Button variant="ghost" className="flex-1" onClick={onCancel}>
          Cancel
        </Button>
        <Button className="flex-1" onClick={save} disabled={!finalArea}>
          Save injury
        </Button>
      </div>
    </div>
  );
}
