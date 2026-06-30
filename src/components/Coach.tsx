"use client";

import { useEffect, useState } from "react";
import { AppData, Workout, Run, Strain } from "@/lib/types";
import { uid } from "@/lib/store";
import { todayISO, fmtDate, epley1RM, pace } from "@/lib/format";
import { Button, Empty } from "./ui";
import { IconCoach } from "./Icons";

type Suggestion = {
  feedback: string;
  recommendation: string;
  question: string;
  options: string[];
  memoryUpdate?: string;
};

type Plan = {
  kind?: "strength" | "cardio" | "rest";
  title: string;
  rationale: string;
  exercises?: { name: string; sets: { weight: number; reps: number }[] }[];
  cardio?: {
    activity: string;
    durationMin?: number;
    distanceKm?: number;
  } | null;
};

function tomorrowISO() {
  const d = new Date(todayISO() + "T00:00:00");
  d.setDate(d.getDate() + 1);
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10);
}

export function Coach({
  data,
  onSaveWorkout,
  onSaveRun,
  onMemory,
  activeStrains,
  onResolveStrain,
  onAddStrain,
  runSignal,
}: {
  data: AppData;
  onSaveWorkout: (w: Workout) => void;
  onSaveRun: (r: Run) => void;
  onMemory: (notes: string) => void;
  activeStrains: Strain[];
  onResolveStrain: (id: string) => void;
  onAddStrain: () => void;
  runSignal: number;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sug, setSug] = useState<Suggestion | null>(null);
  const [choice, setChoice] = useState<string | null>(null);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [decision, setDecision] = useState<"saved" | "discarded" | null>(null);

  const hasData =
    data.workouts.some((w) => !w.planned) || data.weights.length > 0;

  const reset = () => {
    setSug(null);
    setChoice(null);
    setPlan(null);
    setDecision(null);
    setError(null);
  };

  const call = async (payload: object) => {
    const res = await fetch("/api/coach", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok || json.error) throw new Error(json.error || "Request failed");
    return json;
  };

  const getSuggestion = async () => {
    setLoading(true);
    setError(null);
    setDecision(null);
    setPlan(null);
    setChoice(null);
    setSug(null);
    try {
      const s = (await call({ mode: "suggest", ...data })) as Suggestion;
      setSug(s);
      if (s.memoryUpdate && s.memoryUpdate.trim()) onMemory(s.memoryUpdate.trim());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // auto-start when triggered from the + menu
  useEffect(() => {
    if (runSignal > 0 && hasData) getSuggestion();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runSignal]);

  const pickChoice = async (opt: string) => {
    setChoice(opt);
    setLoading(true);
    setError(null);
    try {
      const p = (await call({ mode: "plan", choice: opt, ...data })) as Plan;
      setPlan(p);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setChoice(null);
    } finally {
      setLoading(false);
    }
  };

  const isRest =
    plan?.kind === "rest" ||
    (plan && plan.kind !== "cardio" && !(plan.exercises?.length) && !plan.cardio);
  const isCardio = plan?.kind === "cardio" || (!!plan?.cardio && !isRest);

  const accept = () => {
    if (!plan) return;
    if (isCardio && plan.cardio) {
      const r: Run = {
        id: uid(),
        kind: "cardio",
        date: tomorrowISO(),
        activity: plan.cardio.activity || "Cardio",
        durationMin: plan.cardio.durationMin,
        distanceKm: plan.cardio.distanceKm,
        notes: plan.rationale,
        planned: true,
        createdAt: Date.now(),
      };
      onSaveRun(r);
    } else {
      const w: Workout = {
        id: uid(),
        kind: "strength",
        date: tomorrowISO(),
        title: plan.title,
        exercises: (plan.exercises ?? []).map((e) => ({
          id: uid(),
          name: e.name,
          sets: e.sets,
        })),
        notes: plan.rationale,
        planned: true,
        createdAt: Date.now(),
      };
      onSaveWorkout(w);
    }
    setDecision("saved");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">AI Coach</h2>
        {(sug || plan || error) && (
          <button onClick={reset} className="text-xs text-muted active:opacity-60">
            Reset
          </button>
        )}
      </div>

      {/* Active injuries — the coach trains around these */}
      <div className="rounded-2xl border border-line bg-card p-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted font-display">
            Active injuries
          </span>
          <button
            onClick={onAddStrain}
            className="rounded-full border border-red-400/40 bg-red-400/10 px-2.5 py-1 text-xs font-semibold text-red-400 active:opacity-70"
          >
            + Flag an injury
          </button>
        </div>
        {activeStrains.length === 0 ? (
          <p className="mt-1.5 text-xs text-muted">
            None — coach is training you at full send. Flag any pain and it&apos;ll
            route around it.
          </p>
        ) : (
          <div className="mt-2 flex flex-wrap gap-2">
            {activeStrains.map((s) => (
              <button
                key={s.id}
                onClick={() => onResolveStrain(s.id)}
                className="flex items-center gap-1.5 rounded-full bg-red-400/15 px-3 py-1.5 text-xs text-red-300 active:opacity-70"
                title="Tap when healed"
              >
                <span className="font-semibold">{s.area}</span>
                {s.severity && <span className="opacity-70">· {s.severity}</span>}
                <span className="opacity-60">✓ healed?</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {!hasData && (
        <Empty>
          Log a workout or two first, then your coach can give feedback and plan
          tomorrow&apos;s session.
        </Empty>
      )}

      {hasData && !sug && !loading && !error && (
        <div className="rounded-2xl bg-card border border-line p-6 text-center space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10 text-accent">
            <IconCoach width={34} height={34} />
          </div>
          <p className="text-sm text-muted">
            Get feedback on your latest session and a recommendation for
            tomorrow, built from your real numbers.
          </p>
          <Button className="w-full" onClick={getSuggestion}>
            Get recommendation
          </Button>
        </div>
      )}

      {loading && (
        <div className="rounded-2xl bg-card border border-line p-6 text-center">
          <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-line border-t-accent" />
          <p className="mt-3 text-sm text-muted">
            {choice
              ? `Building your ${choice} session...`
              : "Your coach is reviewing your training..."}
          </p>
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-red-500/40 bg-red-500/10 p-4 text-sm">
          <p className="font-semibold text-red-400">Couldn&apos;t reach coach</p>
          <p className="mt-1 text-muted break-words">{error}</p>
          <Button variant="ghost" className="mt-3" onClick={getSuggestion}>
            Try again
          </Button>
        </div>
      )}

      {sug && !loading && (
        <div className="space-y-4">
          <div className="rounded-2xl bg-card border border-line p-4">
            <div className="text-[10px] font-bold uppercase tracking-wider text-accent">
              Coach feedback
            </div>
            <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed">
              {sug.feedback}
            </p>
          </div>

          {!plan && (
            <div className="rounded-2xl bg-card border border-line p-4">
              <p className="text-sm font-medium">{sug.question}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {sug.options.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => pickChoice(opt)}
                    disabled={loading}
                    className={`rounded-full px-4 py-2 text-sm transition active:scale-95 ${
                      choice === opt
                        ? "bg-accent text-[#1a0f04] font-bold"
                        : "bg-card2 border border-line"
                    }`}
                  >
                    {opt}
                    {opt === sug.recommendation && (
                      <span className="ml-1 text-xs opacity-70">★</span>
                    )}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs text-muted">
                ★ = coach&apos;s recommendation
              </p>
            </div>
          )}
        </div>
      )}

      {plan && !loading && decision === null && (
        <div className="rounded-2xl bg-card border border-line p-4 space-y-3 pop">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-accent2">
              Proposed · {fmtDate(tomorrowISO())}
            </div>
            <h3 className="mt-0.5 text-xl font-bold">{plan.title}</h3>
            <p className="mt-1 text-sm text-muted">{plan.rationale}</p>
          </div>

          {isCardio && plan.cardio && (
            <div className="grid grid-cols-3 gap-2">
              <Box label="Activity" value={plan.cardio.activity} />
              <Box
                label="Duration"
                value={
                  plan.cardio.durationMin ? `${plan.cardio.durationMin}m` : "—"
                }
              />
              <Box
                label={plan.cardio.distanceKm ? "Distance" : "Pace"}
                value={
                  plan.cardio.distanceKm
                    ? `${plan.cardio.distanceKm}km`
                    : pace(plan.cardio.distanceKm, plan.cardio.durationMin)
                }
              />
            </div>
          )}

          {!isRest && !isCardio && (
            <div className="space-y-2">
              {(plan.exercises ?? []).map((e, i) => {
                const best = e.sets
                  .map((s) => epley1RM(s.weight, s.reps))
                  .reduce((a, b) => Math.max(a, b), 0);
                return (
                  <div
                    key={i}
                    className="rounded-xl bg-card2 border border-line p-3"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold">{e.name}</h4>
                      {best > 0 && (
                        <span className="text-xs text-muted">e1RM {best}kg</span>
                      )}
                    </div>
                    <div className="mt-1.5 space-y-0.5">
                      {e.sets.map((s, j) => (
                        <div
                          key={j}
                          className="flex gap-3 text-sm tabular-nums text-muted"
                        >
                          <span className="w-4">{j + 1}</span>
                          <span className="text-foreground font-medium">
                            {s.weight}kg
                          </span>
                          <span>×</span>
                          <span className="text-foreground font-medium">
                            {s.reps}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {isRest ? (
            <Button variant="ghost" className="w-full" onClick={reset}>
              Got it — rest day
            </Button>
          ) : (
            <div className="flex gap-3 pt-1">
              <Button
                variant="ghost"
                className="flex-1"
                onClick={() => setDecision("discarded")}
              >
                No, discard
              </Button>
              <Button className="flex-1" onClick={accept}>
                Yes, save for tomorrow
              </Button>
            </div>
          )}
        </div>
      )}

      {decision === "saved" && (
        <div className="rounded-2xl border border-accent/40 bg-accent/10 p-4 text-center">
          <div className="text-2xl">✅</div>
          <p className="mt-1 text-sm font-semibold text-accent">
            Saved to {fmtDate(tomorrowISO())}
          </p>
          <p className="text-xs text-muted">
            Find it in History — log your actual numbers as you train.
          </p>
        </div>
      )}
      {decision === "discarded" && (
        <div className="rounded-2xl border border-line bg-card p-4 text-center">
          <p className="text-sm text-muted">Discarded.</p>
          <Button variant="ghost" className="mt-2" onClick={getSuggestion}>
            Get another plan
          </Button>
        </div>
      )}
    </div>
  );
}

function Box({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-card2 border border-line p-3 text-center">
      <div className="text-sm font-bold">{value}</div>
      <div className="text-[10px] uppercase text-muted">{label}</div>
    </div>
  );
}
