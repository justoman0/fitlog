import {
  Workout,
  Run,
  WeightEntry,
  Profile,
  Strain,
  CoachMemory,
} from "@/lib/types";

export const runtime = "nodejs";

type Ctx = {
  workouts: Workout[];
  runs: Run[];
  weights: WeightEntry[];
  profile?: Profile;
  strains?: Strain[];
  coachMemory?: CoachMemory;
};

const GOAL_LABEL: Record<string, string> = {
  recomp: "Body recomposition (lose fat + build muscle simultaneously)",
  fatloss: "Fat loss / lean down",
  muscle: "Build muscle (hypertrophy)",
  strength: "Maximise strength",
};

// Shared coaching persona — analytical, elite, concise, recomp-aware.
const PERSONA =
  "You are FitLog Coach — an elite, analytical strength & conditioning coach for a serious lifter, " +
  "the kind of data-driven coach behind a world-class physique. You are precise, evidence-based and CONCISE. " +
  "Lead with the key data insight (a real number from their logs), then the call to action. Hold STRONG, " +
  "specific opinions grounded in the numbers — no fluff, no hedging, no emojis. " +
  "Account for BOTH lifting and cardio when judging fatigue, recovery and fat-loss. Frame bodyweight against their target. " +
  "CRITICAL: respect every ACTIVE injury/strain — never program movements that load an injured area; route around it intelligently " +
  "(e.g. wrist pain -> avoid heavy pressing/gripping, prefer machines/straps or train a different region; ankle -> avoid impact/heavy legs). " +
  "If the profile is empty, give solid general advice but gently note that filling in goals/injuries will sharpen your recommendations.";

function buildSummary(ctx: Ctx): string {
  const { workouts, runs, weights, profile, strains, coachMemory } = ctx;
  const recentW = [...workouts]
    .filter((w) => !w.planned)
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, 6);
  const recentR = [...runs]
    .filter((r) => !r.planned)
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, 5);
  const w = [...weights].sort((a, b) => (a.date < b.date ? -1 : 1));
  const lines: string[] = [];

  // Profile / goals
  lines.push("=== ATHLETE PROFILE ===");
  if (profile && (profile.goals?.length || profile.targetWeight || profile.experience)) {
    if (profile.goals?.length)
      lines.push(
        `Goal: ${profile.goals.map((g) => GOAL_LABEL[g] ?? g).join(" + ")}`
      );
    if (profile.experience) lines.push(`Experience: ${profile.experience}`);
    if (profile.daysPerWeek)
      lines.push(`Trains ~${profile.daysPerWeek} days/week`);
    if (profile.equipment) lines.push(`Equipment/access: ${profile.equipment}`);
    if (profile.notes) lines.push(`Notes from athlete: ${profile.notes}`);
  } else {
    lines.push("(Profile not filled in yet — encourage setup.)");
  }

  // Bodyweight vs target
  lines.push("\n=== BODYWEIGHT ===");
  const latestBw = w[w.length - 1];
  if (latestBw) {
    lines.push(`Current: ${latestBw.weight} kg (as of ${latestBw.date}).`);
    if (w.length > 1) {
      const delta = latestBw.weight - w[0].weight;
      lines.push(
        `Trend over ${w.length} weigh-ins: ${delta >= 0 ? "+" : ""}${delta.toFixed(
          1
        )} kg.`
      );
    }
    if (profile?.targetWeight) {
      const togo = latestBw.weight - profile.targetWeight;
      lines.push(
        `Target: ${profile.targetWeight} kg — ${Math.abs(togo).toFixed(1)} kg ${
          togo > 0 ? "to lose" : togo < 0 ? "to gain" : "— at target"
        }.`
      );
    }
  } else {
    lines.push("No bodyweight logged yet.");
  }

  // Active strains / injuries
  const active = (strains ?? []).filter((s) => s.active);
  lines.push("\n=== ACTIVE INJURIES / STRAINS ===");
  if (active.length) {
    for (const s of active)
      lines.push(
        `- ${s.area}${s.severity ? ` (${s.severity})` : ""}${
          s.note ? ` — ${s.note}` : ""
        } [since ${s.date}]`
      );
    lines.push("MUST work around these today.");
  } else {
    lines.push("None reported. Cleared to train normally.");
  }

  // Coach memory
  if (coachMemory?.notes?.trim()) {
    lines.push("\n=== YOUR PRIOR COACH NOTES ON THIS ATHLETE ===");
    lines.push(coachMemory.notes.trim());
  }

  // Recent training
  lines.push("\n=== RECENT STRENGTH SESSIONS (most recent first) ===");
  if (recentW.length === 0) lines.push("(none logged yet)");
  for (const s of recentW) {
    const exs = s.exercises
      .map(
        (e) =>
          `${e.name}${e.perSide ? " (per side)" : ""}: ${e.sets
            .map((st) => `${st.weight}kg×${st.reps}`)
            .join(", ")}`
      )
      .join(" | ");
    const rt = s.rating
      ? ` — effort ${s.rating.effort ?? "?"}/10`
      : "";
    lines.push(
      `- ${s.date} "${s.title}"${s.bodyweight ? ` @${s.bodyweight}kg` : ""}${rt} — ${
        exs || "no sets"
      }${s.feeling ? ` — felt: ${s.feeling}` : ""}${
        s.notes ? ` — notes: ${s.notes}` : ""
      }`
    );
  }

  lines.push("\n=== RECENT CARDIO (most recent first) ===");
  if (recentR.length === 0) lines.push("(none logged yet)");
  for (const r of recentR)
    lines.push(
      `- ${r.date} ${r.activity} — ${r.durationMin ?? "?"}min${
        r.distanceKm ? `, ${r.distanceKm}km` : ""
      }${r.feeling ? ` — felt: ${r.feeling}` : ""}`
    );

  // Weekly load snapshot
  const today = new Date();
  const within7 = (iso: string) =>
    (today.getTime() - new Date(iso + "T00:00:00").getTime()) /
      86400000 <=
    7;
  const liftsThisWeek = workouts.filter((x) => !x.planned && within7(x.date)).length;
  const cardioThisWeek = runs.filter((x) => !x.planned && within7(x.date)).length;
  lines.push(
    `\n=== LAST 7 DAYS: ${liftsThisWeek} lifting + ${cardioThisWeek} cardio sessions ===`
  );

  return lines.join("\n");
}

async function callOpenAI(messages: object[], schemaHint: string) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY is not set on the server.");
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.6,
      response_format: { type: "json_object" },
      messages,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenAI error ${res.status}: ${text.slice(0, 300)}`);
  }
  const json = await res.json();
  const content = json.choices?.[0]?.message?.content ?? "{}";
  try {
    return JSON.parse(content);
  } catch {
    throw new Error("Model returned invalid JSON. " + schemaHint);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const ctx: Ctx = {
      workouts: body.workouts ?? [],
      runs: body.runs ?? [],
      weights: body.weights ?? [],
      profile: body.profile,
      strains: body.strains,
      coachMemory: body.coachMemory,
    };
    const summary = buildSummary(ctx);

    if (body.mode === "suggest") {
      const result = await callOpenAI(
        [
          {
            role: "system",
            content:
              PERSONA +
              " The athlete wants a read on their recent training and a plan for TOMORROW. " +
              "Give EXACTLY 3 options for tomorrow that fit their goal, recent split, recovery and ANY active injuries " +
              "(if an area is injured, do not offer a session that loads it). Include a cardio or rest option when it serves recomp/recovery. " +
              "Also MAINTAIN a running notes log about this athlete: update it with durable facts (PRs, stalls, injuries, what works, " +
              "bodyweight progress vs target) and return the FULL updated notes (max ~600 chars, terse bullet style). " +
              'Respond ONLY as JSON: {"feedback": string (2-3 sentences, lead with a specific number from their data, analytical tone), ' +
              '"recommendation": string (your single top pick, must equal one of the options), ' +
              '"question": string (reference what they just did, e.g. "You trained shoulders + 15min cardio today — what tomorrow?"), ' +
              '"options": string[] (EXACTLY 3 short choices, recommendation first), ' +
              '"memoryUpdate": string (the full updated coach notes)}',
          },
          { role: "user", content: summary },
        ],
        "Expected feedback/recommendation/question/options/memoryUpdate."
      );
      return Response.json(result);
    }

    if (body.mode === "plan") {
      const choice: string = body.choice ?? "";
      const result = await callOpenAI(
        [
          {
            role: "system",
            content:
              PERSONA +
              " Build TOMORROW's session for the athlete's chosen focus. Decide kind: 'strength', 'cardio' or 'rest'. " +
              "STRENGTH: pick 4-6 exercises with concrete per-set weight (kg) and reps based on their recent logged numbers and bodyweight; " +
              "apply progression (nudge up where reps were strong, hold/deload where they struggled or flagged pain). Avoid loading injured areas. " +
              "CARDIO: set activity, durationMin and distanceKm if relevant, sized for recomp/recovery. REST: explain the recovery rationale. " +
              'Respond ONLY as JSON: {"kind": "strength"|"cardio"|"rest", "title": string, ' +
              '"rationale": string (1-3 sentences, analytical, cite a number or the progression logic), ' +
              '"exercises": [{"name": string, "sets": [{"weight": number, "reps": number}]}] (only for strength, else []), ' +
              '"cardio": {"activity": string, "durationMin": number, "distanceKm": number} (only for cardio, else null)}',
          },
          {
            role: "user",
            content: `${summary}\n\nThe athlete chose: ${choice}. Build that session.`,
          },
        ],
        "Expected title/rationale/exercises."
      );
      return Response.json(result);
    }

    if (body.mode === "recap") {
      const wk = body.workout as Workout | undefined;
      if (!wk)
        return Response.json({ error: "No workout provided" }, { status: 400 });
      const exLines = wk.exercises
        .map(
          (e) =>
            `${e.name}${e.perSide ? " (per side)" : ""}: ${e.sets
              .map((s) => `${s.weight}kg×${s.reps}`)
              .join(", ")}`
        )
        .join("\n");
      const result = await callOpenAI(
        [
          {
            role: "system",
            content:
              PERSONA +
              " The athlete just FINISHED this workout. Give a short, sharp recap (2-3 sentences): call out the standout set with its number, " +
              "note what it means for their goal/progression, and one precise cue for next time. Confident and analytical, not gushy. " +
              'Respond ONLY as JSON: {"recap": string}',
          },
          {
            role: "user",
            content: `Just completed "${wk.title}"${
              wk.bodyweight ? ` at ${wk.bodyweight}kg bodyweight` : ""
            }:\n${exLines}\n\nContext:\n${summary}`,
          },
        ],
        "Expected recap."
      );
      return Response.json(result);
    }

    if (body.mode === "fixnames") {
      const names: string[] = body.names ?? [];
      const result = await callOpenAI(
        [
          {
            role: "system",
            content:
              "You correct gym exercise names to their standard, recognisable form. " +
              "The user may write shorthand, typos, or vague descriptions. " +
              "Return the cleaned official name for each (e.g. 'lat raise cable' -> 'Side Lateral Cable Raise', " +
              "'mil press' -> 'Standing Military Press'). Keep it concise and conventional. " +
              "If an entry is empty or you truly can't tell, return it unchanged. " +
              "Return EXACTLY the same number of items in the same order. " +
              'Respond ONLY as JSON: {"names": string[]}',
          },
          { role: "user", content: JSON.stringify({ names }) },
        ],
        "Expected names array."
      );
      if (!Array.isArray(result.names) || result.names.length !== names.length)
        return Response.json({ names });
      return Response.json(result);
    }

    return Response.json({ error: "Unknown mode" }, { status: 400 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return Response.json({ error: msg }, { status: 500 });
  }
}
