"use client";

import { useState } from "react";
import { AppData, Workout } from "@/lib/types";
import { uid } from "@/lib/store";
import { todayISO, fmtDate, epley1RM } from "@/lib/format";
import { Button, Empty } from "./ui";

type Suggestion = {
  feedback: string;
  recommendation: string;
  question: string;
  options: string[];
};

type Plan = {
  title: string;
  rationale: string;
  exercises: { name: string; sets: { weight: number; reps: number }[] }[];
};

function tomorrowISO() {
  const d = new Date(todayISO() + "T00:00:00");
  d.setDate(d.getDate() + 1);
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10);
}

export function Coach({
  data,
  onSavePlan,
}: {
  data: AppData;
  onSavePlan: (w: Workout) => void;
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
    try {
      const s = (await call({ mode: "suggest", ...data })) as Suggestion;
      setSug(s);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

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

  const accept = () => {
    if (!plan) return;
    const w: Workout = {
      id: uid(),
      kind: "strength",
      date: tomorrowISO(),
      title: plan.title,
      exercises: plan.exercises.map((e) => ({
        id: uid(),
        name: e.name,
        sets: e.sets,
      })),
      notes: plan.rationale,
      planned: true,
      createdAt: Date.now(),
    };
    onSavePlan(w);
    setDecision("saved");
  };

  const isRest =
    plan && (!plan.exercises || plan.exercises.length === 0);

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

      {!hasData && (
        <Empty>
          Log a workout or two first, then your coach can give feedback and plan
          tomorrow&apos;s session.
        </Empty>
      )}

      {hasData && !sug && !loading && !error && (
        <div className="rounded-2xl bg-card border border-line p-5 text-center space-y-4">
          <div className="text-4xl">🤖</div>
          <p className="text-sm text-muted">
            Get feedback on your latest session and a plan for tomorrow, built
            from your real numbers.
          </p>
          <Button className="w-full" onClick={getSuggestion}>
            Coach me
          </Button>
        </div>
      )}

      {loading && (
        <div className="rounded-2xl bg-card border border-line p-6 text-center">
          <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-line border-t-accent" />
          <p className="mt-3 text-sm text-muted">
            {plan === null && choice
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
                        ? "bg-accent text-black font-semibold"
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

          {!isRest && (
            <div className="space-y-2">
              {plan.exercises.map((e, i) => {
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
          <p className="text-sm text-muted">Discarded. </p>
          <Button variant="ghost" className="mt-2" onClick={getSuggestion}>
            Get another plan
          </Button>
        </div>
      )}
    </div>
  );
}
