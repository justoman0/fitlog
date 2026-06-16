"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { Workout, Run, WeightEntry, AppData } from "@/lib/types";
import { fmtDate, todayISO } from "@/lib/format";
import { Stat, Empty, Button } from "./ui";
import { Sheet } from "./Sheet";
import { WorkoutForm } from "./WorkoutForm";
import { RunForm } from "./RunForm";
import { WeightForm } from "./WeightForm";
import { WorkoutCard, RunCard } from "./EntryCards";
import { WorkoutDetail, RunDetail } from "./Detail";
import { LineChart } from "./LineChart";
import { Coach } from "./Coach";
import { Progress } from "./Progress";
import { Celebrate } from "./Celebrate";

type Tab = "home" | "history" | "progress" | "coach";
type SheetState =
  | { type: "none" }
  | { type: "newWorkout" }
  | { type: "newRun" }
  | { type: "newWeight" }
  | { type: "editWorkout"; w: Workout }
  | { type: "editRun"; r: Run }
  | { type: "viewWorkout"; w: Workout }
  | { type: "viewRun"; r: Run }
  | { type: "celebrate"; w: Workout }
  | { type: "menu" };

function startOfWeek() {
  const d = new Date();
  const day = (d.getDay() + 6) % 7; // Monday start
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function App() {
  const { data, update, loaded } = useStore();
  const [tab, setTab] = useState<Tab>("home");
  const [sheet, setSheet] = useState<SheetState>({ type: "none" });
  const [coachSignal, setCoachSignal] = useState(0);
  const close = () => setSheet({ type: "none" });

  // combined timeline
  const timeline = useMemo(() => {
    const items: ({ t: "w"; d: Workout } | { t: "r"; d: Run })[] = [
      ...data.workouts.map((d) => ({ t: "w" as const, d })),
      ...data.runs.map((d) => ({ t: "r" as const, d })),
    ];
    items.sort((a, b) =>
      a.d.date === b.d.date
        ? b.d.createdAt - a.d.createdAt
        : a.d.date < b.d.date
        ? 1
        : -1
    );
    return items;
  }, [data]);

  const weightsSorted = useMemo(
    () =>
      [...data.weights].sort((a, b) => (a.date < b.date ? -1 : 1)),
    [data.weights]
  );

  const stats = useMemo(() => {
    const wkStart = startOfWeek().getTime();
    const inWeek = (iso: string) =>
      new Date(iso + "T00:00:00").getTime() >= wkStart;
    const workoutsThisWeek = data.workouts.filter(
      (w) => !w.planned && inWeek(w.date)
    ).length;
    const runsThisWeek = data.runs.filter(
      (r) => !r.planned && inWeek(r.date)
    ).length;
    const latestWeight = weightsSorted[weightsSorted.length - 1]?.weight;
    const firstWeight = weightsSorted[0]?.weight;
    const delta =
      latestWeight != null && firstWeight != null
        ? latestWeight - firstWeight
        : undefined;
    return { workoutsThisWeek, runsThisWeek, latestWeight, delta };
  }, [data, weightsSorted]);

  // mutations
  const saveWorkout = (w: Workout) =>
    update((d) => upsert(d, "workouts", w));
  const saveRun = (r: Run) => update((d) => upsert(d, "runs", r));
  const saveWeight = (w: WeightEntry) =>
    update((d) => upsert(d, "weights", w));
  const delWorkout = (id: string) =>
    update((d) => ({ ...d, workouts: d.workouts.filter((x) => x.id !== id) }));
  const delRun = (id: string) =>
    update((d) => ({ ...d, runs: d.runs.filter((x) => x.id !== id) }));
  const delWeight = (id: string) =>
    update((d) => ({ ...d, weights: d.weights.filter((x) => x.id !== id) }));

  if (!loaded)
    return <div className="min-h-screen bg-background" aria-hidden />;

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col bg-background">
      {/* header */}
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-line bg-background/90 px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 backdrop-blur">
        <div>
          <h1 className="text-xl font-bold tracking-tight">FitLog</h1>
          <p className="text-xs text-muted">{fmtDate(todayISO())}</p>
        </div>
        <button
          onClick={() => setSheet({ type: "menu" })}
          className="rounded-xl bg-card border border-line px-3 py-2 text-sm"
        >
          ⋯
        </button>
      </header>

      <main className="flex-1 px-4 pb-32 pt-4">
        {tab === "home" && (
          <HomeView
            stats={stats}
            timeline={timeline}
            weights={weightsSorted}
            onView={(s) => setSheet(s)}
          />
        )}
        {tab === "history" && (
          <HistoryView timeline={timeline} onView={(s) => setSheet(s)} />
        )}
        {tab === "progress" && (
          <Progress
            data={data}
            onAddWeight={() => setSheet({ type: "newWeight" })}
            onDeleteWeight={delWeight}
          />
        )}
        {tab === "coach" && (
          <Coach
            data={data}
            onSaveWorkout={saveWorkout}
            onSaveRun={saveRun}
            runSignal={coachSignal}
          />
        )}
      </main>

      {/* FAB */}
      <div className="pointer-events-none fixed inset-x-0 bottom-24 z-30 mx-auto flex max-w-md justify-end px-4">
        <button
          onClick={() => setSheet({ type: "menu" })}
          className="pointer-events-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent text-3xl font-light text-black shadow-lg shadow-accent/20 active:scale-95"
          aria-label="Add entry"
        >
          +
        </button>
      </div>

      {/* bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-20 mx-auto flex max-w-md justify-around border-t border-line bg-background/95 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur">
        {(
          [
            ["home", "Home", "🏠"],
            ["history", "History", "📋"],
            ["progress", "Progress", "📈"],
            ["coach", "Coach", "🤖"],
          ] as const
        ).map(([id, label, icon]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex flex-1 flex-col items-center gap-0.5 py-1.5 text-[10px] ${
              tab === id ? "text-accent" : "text-muted"
            }`}
          >
            <span className="text-lg">{icon}</span>
            {label}
          </button>
        ))}
      </nav>

      {/* sheets */}
      <Sheet open={sheet.type !== "none"} onClose={close}>
        {sheet.type === "menu" && (
          <div className="space-y-3 pb-2">
            <h2 className="text-lg font-bold">Log an entry</h2>
            <Button
              className="w-full"
              onClick={() => setSheet({ type: "newWorkout" })}
            >
              🏋️ Strength workout
            </Button>
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => setSheet({ type: "newRun" })}
            >
              🏃 Run / cardio
            </Button>
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => setSheet({ type: "newWeight" })}
            >
              ⚖️ Bodyweight
            </Button>
            <div className="pt-1">
              <Button
                className="w-full"
                variant="ghost"
                onClick={() => {
                  close();
                  setTab("coach");
                  setCoachSignal((n) => n + 1);
                }}
              >
                🤖 Coach recommendation
              </Button>
            </div>
          </div>
        )}

        {sheet.type === "newWorkout" && (
          <FormWrap title="New workout">
            <WorkoutForm
              onSave={(w) => {
                saveWorkout(w);
                if (w.exercises.length) setSheet({ type: "celebrate", w });
                else close();
              }}
              onCancel={close}
            />
          </FormWrap>
        )}
        {sheet.type === "editWorkout" && (
          <FormWrap title="Edit workout">
            <WorkoutForm
              initial={sheet.w}
              onSave={(w) => {
                saveWorkout(w);
                close();
              }}
              onCancel={close}
            />
          </FormWrap>
        )}
        {sheet.type === "newRun" && (
          <FormWrap title="New cardio">
            <RunForm
              onSave={(r) => {
                saveRun(r);
                close();
              }}
              onCancel={close}
            />
          </FormWrap>
        )}
        {sheet.type === "editRun" && (
          <FormWrap title="Edit cardio">
            <RunForm
              initial={sheet.r}
              onSave={(r) => {
                saveRun(r);
                close();
              }}
              onCancel={close}
            />
          </FormWrap>
        )}
        {sheet.type === "newWeight" && (
          <FormWrap title="Log bodyweight">
            <WeightForm
              onSave={(w) => {
                saveWeight(w);
                close();
              }}
              onCancel={close}
            />
          </FormWrap>
        )}
        {sheet.type === "celebrate" && (
          <Celebrate workout={sheet.w} data={data} onDone={close} />
        )}
        {sheet.type === "viewWorkout" && (
          <WorkoutDetail
            w={sheet.w}
            onEdit={() => setSheet({ type: "editWorkout", w: sheet.w })}
            onDelete={() => {
              delWorkout(sheet.w.id);
              close();
            }}
          />
        )}
        {sheet.type === "viewRun" && (
          <RunDetail
            r={sheet.r}
            onEdit={() => setSheet({ type: "editRun", r: sheet.r })}
            onDelete={() => {
              delRun(sheet.r.id);
              close();
            }}
          />
        )}
      </Sheet>
    </div>
  );
}

function FormWrap({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h2 className="mb-4 text-lg font-bold">{title}</h2>
      {children}
    </div>
  );
}

function HomeView({
  stats,
  timeline,
  weights,
  onView,
}: {
  stats: {
    workoutsThisWeek: number;
    runsThisWeek: number;
    latestWeight?: number;
    delta?: number;
  };
  timeline: ({ t: "w"; d: Workout } | { t: "r"; d: Run })[];
  weights: WeightEntry[];
  onView: (s: SheetState) => void;
}) {
  const recent = timeline.slice(0, 6);
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        <Stat
          label="This week"
          value={stats.workoutsThisWeek + stats.runsThisWeek}
          sub={`${stats.workoutsThisWeek} lifts · ${stats.runsThisWeek} cardio`}
          accent
        />
        <Stat
          label="Bodyweight"
          value={stats.latestWeight != null ? `${stats.latestWeight}kg` : "—"}
          sub={
            stats.delta != null
              ? `${stats.delta > 0 ? "+" : ""}${stats.delta.toFixed(
                  1
                )}kg overall`
              : "no data yet"
          }
        />
      </div>

      {weights.length >= 2 && (
        <div className="rounded-2xl bg-card border border-line p-4">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold">Weight trend</h3>
            <span className="text-xs text-muted">
              {weights.length} entries
            </span>
          </div>
          <LineChart
            points={weights.map((w) => ({ x: w.date, y: w.weight }))}
            unit="kg"
          />
        </div>
      )}

      <div>
        <h3 className="mb-3 text-sm font-semibold">Recent activity</h3>
        {recent.length === 0 ? (
          <Empty>
            No entries yet. Tap the <span className="text-accent">+</span> to log
            your first workout.
          </Empty>
        ) : (
          <div className="space-y-3">
            {recent.map((it) =>
              it.t === "w" ? (
                <WorkoutCard
                  key={it.d.id}
                  w={it.d}
                  onClick={() => onView({ type: "viewWorkout", w: it.d })}
                />
              ) : (
                <RunCard
                  key={it.d.id}
                  r={it.d}
                  onClick={() => onView({ type: "viewRun", r: it.d })}
                />
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function HistoryView({
  timeline,
  onView,
}: {
  timeline: ({ t: "w"; d: Workout } | { t: "r"; d: Run })[];
  onView: (s: SheetState) => void;
}) {
  const [filter, setFilter] = useState<"all" | "w" | "r">("all");
  const items = timeline.filter((it) => filter === "all" || it.t === filter);
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {(
          [
            ["all", "All"],
            ["w", "Strength"],
            ["r", "Cardio"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setFilter(id)}
            className={`rounded-full px-3.5 py-1.5 text-sm transition ${
              filter === id
                ? "bg-accent text-black font-semibold"
                : "bg-card border border-line text-muted"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      {items.length === 0 ? (
        <Empty>Nothing logged here yet.</Empty>
      ) : (
        <div className="space-y-3">
          {items.map((it) =>
            it.t === "w" ? (
              <WorkoutCard
                key={it.d.id}
                w={it.d}
                onClick={() => onView({ type: "viewWorkout", w: it.d })}
              />
            ) : (
              <RunCard
                key={it.d.id}
                r={it.d}
                onClick={() => onView({ type: "viewRun", r: it.d })}
              />
            )
          )}
        </div>
      )}
    </div>
  );
}

function upsert<K extends keyof AppData>(
  d: AppData,
  key: K,
  item: AppData[K][number]
): AppData {
  const list = d[key] as { id: string }[];
  const exists = list.some((x) => x.id === item.id);
  const next = exists
    ? list.map((x) => (x.id === item.id ? item : x))
    : [...list, item];
  return { ...d, [key]: next };
}
