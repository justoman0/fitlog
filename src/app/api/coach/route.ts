import { Workout, Run, WeightEntry } from "@/lib/types";

export const runtime = "nodejs";

type Ctx = {
  workouts: Workout[];
  runs: Run[];
  weights: WeightEntry[];
};

function buildSummary({ workouts, runs, weights }: Ctx): string {
  const recentW = [...workouts]
    .filter((w) => !w.planned)
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, 6);
  const recentR = [...runs]
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, 4);
  const w = [...weights].sort((a, b) => (a.date < b.date ? -1 : 1));

  const lines: string[] = [];
  const latestBw = w[w.length - 1];
  if (latestBw) {
    lines.push(
      `Current bodyweight: ${latestBw.weight} kg (as of ${latestBw.date}).`
    );
    if (w.length > 1) {
      const delta = latestBw.weight - w[0].weight;
      lines.push(
        `Bodyweight change over ${w.length} weigh-ins: ${
          delta >= 0 ? "+" : ""
        }${delta.toFixed(1)} kg.`
      );
    }
  } else {
    lines.push("No bodyweight logged yet.");
  }

  lines.push("\nRecent strength sessions (most recent first):");
  if (recentW.length === 0) lines.push("(none logged yet)");
  for (const s of recentW) {
    const exs = s.exercises
      .map(
        (e) =>
          `${e.name}: ${e.sets.map((st) => `${st.weight}kg×${st.reps}`).join(", ")}`
      )
      .join(" | ");
    lines.push(
      `- ${s.date} "${s.title}"${
        s.bodyweight ? ` @${s.bodyweight}kg` : ""
      } — ${exs || "no sets"}${s.feeling ? ` — felt: ${s.feeling}` : ""}${
        s.notes ? ` — notes: ${s.notes}` : ""
      }`
    );
  }

  if (recentR.length) {
    lines.push("\nRecent cardio:");
    for (const r of recentR)
      lines.push(
        `- ${r.date} ${r.activity} ${r.distanceKm ?? "?"}km / ${
          r.durationMin ?? "?"
        }min`
      );
  }
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
      temperature: 0.7,
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
    };
    const summary = buildSummary(ctx);

    if (body.mode === "suggest") {
      const result = await callOpenAI(
        [
          {
            role: "system",
            content:
              "You are an elite, no-nonsense strength & conditioning coach. " +
              "You write like a knowledgeable gym coach texting a client: warm, specific, honest. " +
              "Reference the athlete's actual numbers and what they trained MOST RECENTLY. " +
              "Then give them EXACTLY 3 options for tomorrow and let them choose. " +
              "Options should suit what they last did (e.g. if they just trained shoulders, suggest legs, pull, or rest; " +
              "mix in a cardio option like 'Cardio' or 'Stairmaster' when it fits their fat-loss goal; always allow 'Rest' when recovery is wise). " +
              'Respond ONLY as JSON: {"feedback": string (2-4 sentences on their most recent session and overall trend), ' +
              '"recommendation": string (your single top pick, must be one of the options), ' +
              '"question": string — phrase it referencing what they just did, e.g. "Seeing as you trained shoulders today, what do you want to do tomorrow?", ' +
              '"options": string[] (EXACTLY 3 short choices, ordered with your recommendation first)}',
          },
          { role: "user", content: `Athlete data:\n${summary}` },
        ],
        "Expected feedback/recommendation/question/options."
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
              "You are an elite strength & conditioning coach building TOMORROW's session based on the athlete's choice. " +
              "Decide the session kind: 'strength', 'cardio', or 'rest'. " +
              "For STRENGTH: base exercise selection, weights (kg) and reps on the athlete's recent logged numbers and bodyweight — " +
              "apply sensible progression (small increases where reps were strong, hold or deload where they struggled or noted pain). " +
              "Give 4-6 exercises with concrete per-set weight and reps. " +
              "For CARDIO (e.g. Stairmaster, Run, Bike): set a realistic activity, duration in minutes, and distance in km if relevant. " +
              "For REST: explain the recovery rationale, no exercises. " +
              'Respond ONLY as JSON: {"kind": "strength"|"cardio"|"rest", ' +
              '"title": string (e.g. "Chest & Triceps" or "Stairmaster Cardio"), ' +
              '"rationale": string (1-3 sentences explaining the plan and key progression), ' +
              '"exercises": [{"name": string, "sets": [{"weight": number, "reps": number}]}] (only for strength, else []), ' +
              '"cardio": {"activity": string, "durationMin": number, "distanceKm": number} (only for cardio, else null)}',
          },
          {
            role: "user",
            content: `Athlete data:\n${summary}\n\nThe athlete chose: ${choice}. Build that session.`,
          },
        ],
        "Expected title/rationale/exercises."
      );
      return Response.json(result);
    }

    if (body.mode === "recap") {
      const w = body.workout as Workout | undefined;
      if (!w) return Response.json({ error: "No workout provided" }, { status: 400 });
      const exLines = w.exercises
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
              "You are a hype but knowledgeable gym coach. The athlete just FINISHED this workout. " +
              "Give a short, punchy, celebratory recap (2-3 sentences max). Call out their best/standout set, " +
              "acknowledge the effort, and drop one quick tip for next time. Sound genuinely stoked. " +
              'Respond ONLY as JSON: {"recap": string}',
          },
          {
            role: "user",
            content: `Just completed "${w.title}"${
              w.bodyweight ? ` at ${w.bodyweight}kg bodyweight` : ""
            }:\n${exLines}\n\nContext of recent training:\n${summary}`,
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
              "The user is bad with names and may write shorthand, typos, or vague descriptions. " +
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
      // guard: same length
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
