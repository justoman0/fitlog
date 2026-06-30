"use client";

import { useState } from "react";
import { Profile, Goal } from "@/lib/types";
import { Field, Input, Textarea, Button, DecimalInput } from "./ui";

const GOALS: { id: Goal; label: string }[] = [
  { id: "recomp", label: "Recomp / look good" },
  { id: "fatloss", label: "Fat loss" },
  { id: "muscle", label: "Build muscle" },
  { id: "strength", label: "Get stronger" },
];

const LEVELS: Profile["experience"][] = [
  "beginner",
  "intermediate",
  "advanced",
];

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3.5 py-2 text-sm capitalize transition active:scale-95 ${
        active
          ? "bg-accent text-[#1a0f04] font-bold"
          : "bg-card2 border border-line text-muted"
      }`}
    >
      {children}
    </button>
  );
}

export function OnboardingForm({
  initial,
  onSave,
  onSkip,
}: {
  initial?: Profile;
  onSave: (p: Profile) => void;
  onSkip?: () => void;
}) {
  const [goals, setGoals] = useState<Goal[]>(initial?.goals ?? ["recomp"]);
  const [targetWeight, setTargetWeight] = useState<number>(
    initial?.targetWeight ?? 0
  );
  const [daysPerWeek, setDaysPerWeek] = useState<number>(
    initial?.daysPerWeek ?? 0
  );
  const [experience, setExperience] = useState<Profile["experience"]>(
    initial?.experience
  );
  const [equipment, setEquipment] = useState(initial?.equipment ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");

  const toggleGoal = (g: Goal) =>
    setGoals((xs) => (xs.includes(g) ? xs.filter((x) => x !== g) : [...xs, g]));

  const save = () =>
    onSave({
      goals,
      targetWeight: targetWeight || undefined,
      daysPerWeek: daysPerWeek || undefined,
      experience,
      equipment: equipment.trim() || undefined,
      notes: notes.trim() || undefined,
      onboarded: true,
    });

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold uppercase tracking-wide">
          Set up your coach
        </h2>
        <p className="mt-1 text-sm text-muted">
          A few quick answers so your coach tailors every recommendation to you.
          You can change these anytime.
        </p>
      </div>

      <Field label="Your goal(s)">
        <div className="flex flex-wrap gap-2">
          {GOALS.map((g) => (
            <Chip
              key={g.id}
              active={goals.includes(g.id)}
              onClick={() => toggleGoal(g.id)}
            >
              {g.label}
            </Chip>
          ))}
        </div>
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Target weight (kg)">
          <DecimalInput
            placeholder="98"
            value={targetWeight}
            onChange={setTargetWeight}
          />
        </Field>
        <Field label="Days / week">
          <div className="flex flex-wrap gap-1.5">
            {[2, 3, 4, 5, 6].map((n) => (
              <Chip
                key={n}
                active={daysPerWeek === n}
                onClick={() => setDaysPerWeek(n)}
              >
                {n}
              </Chip>
            ))}
          </div>
        </Field>
      </div>

      <Field label="Experience">
        <div className="flex flex-wrap gap-2">
          {LEVELS.map((l) => (
            <Chip
              key={l}
              active={experience === l}
              onClick={() => setExperience(l)}
            >
              {l}
            </Chip>
          ))}
        </div>
      </Field>

      <Field label="Equipment / gym access">
        <Input
          placeholder="Full commercial gym"
          value={equipment}
          onChange={(e) => setEquipment(e.target.value)}
        />
      </Field>

      <Field label="Anything else the coach should know?">
        <Textarea
          rows={2}
          placeholder="Old shoulder injury, play rugby on weekends, prefer free weights..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </Field>

      <div className="flex gap-3 pt-1">
        {onSkip && (
          <Button variant="ghost" className="flex-1" onClick={onSkip}>
            Skip for now
          </Button>
        )}
        <Button className="flex-1" onClick={save}>
          Save profile
        </Button>
      </div>
    </div>
  );
}
