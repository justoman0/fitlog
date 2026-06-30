"use client";

import { useMemo, useRef, useState } from "react";
import { useStore } from "@/lib/store";
import { useAuthSync } from "@/lib/sync";
import { Workout, Run, WeightEntry, AppData } from "@/lib/types";
import { fmtDate, todayISO } from "@/lib/format";
import { Stat, Empty, Button, Input } from "./ui";
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
import {
  IconHome,
  IconHistory,
  IconChart,
  IconCoach,
  IconPlus,
  IconDots,
  IconDumbbell,
  IconRun,
  IconScale,
} from "./Icons";

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
  | { type: "settings" }
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [authBusy, setAuthBusy] = useState(false);
  const { user, status, authenticate, signOut } = useAuthSync(
    data,
    update,
    loaded
  );
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

  const totalLogs =
    data.workouts.length + data.runs.length + data.weights.length;

  const exportData = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fitlog-backup-${todayISO()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importData = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        const inW = Array.isArray(parsed.workouts) ? parsed.workouts : [];
        const inR = Array.isArray(parsed.runs) ? parsed.runs : [];
        const inWt = Array.isArray(parsed.weights) ? parsed.weights : [];
        let added = 0;
        update((d) => {
          const mergeById = <T extends { id: string }>(cur: T[], inc: T[]) => {
            const ids = new Set(cur.map((x) => x.id));
            const fresh = inc.filter((x) => x && x.id && !ids.has(x.id));
            added += fresh.length;
            return [...cur, ...fresh];
          };
          return {
            workouts: mergeById(d.workouts, inW),
            runs: mergeById(d.runs, inR),
            weights: mergeById(d.weights, inWt),
          };
        });
        alert(
          `Backup restored ✓ Added ${added} new ${
            added === 1 ? "entry" : "entries"
          } (existing logs were kept).`
        );
        close();
      } catch {
        alert("Couldn't read that file — make sure it's a FitLog backup.");
      }
    };
    reader.readAsText(file);
  };

  if (!loaded)
    return <div className="min-h-screen bg-background" aria-hidden />;

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col bg-background">
      {/* header */}
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-line bg-background/85 px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 backdrop-blur-md">
        <div>
          <h1 className="text-2xl font-bold uppercase leading-none tracking-wide">
            Fit<span className="text-accent">Log</span>
          </h1>
          <p className="mt-0.5 text-xs font-medium uppercase tracking-wider text-muted">
            {fmtDate(todayISO())}
          </p>
        </div>
        <button
          onClick={() => setSheet({ type: "settings" })}
          className="flex h-11 w-11 items-center justify-center rounded-xl bg-card border border-line text-muted active:bg-card2"
          aria-label="Settings & backup"
        >
          <IconDots width={20} height={20} />
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
      <div className="pointer-events-none fixed inset-x-0 bottom-[5.5rem] z-30 mx-auto flex max-w-md justify-end px-4">
        <button
          onClick={() => setSheet({ type: "menu" })}
          className="pointer-events-auto flex h-15 w-15 items-center justify-center rounded-2xl bg-gradient-to-b from-accent to-accent-deep text-[#1a0f04] shadow-xl shadow-accent/30 active:scale-95"
          style={{ height: 60, width: 60 }}
          aria-label="Add entry"
        >
          <IconPlus width={28} height={28} strokeWidth={2.5} />
        </button>
      </div>

      {/* bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-20 mx-auto flex max-w-md justify-around border-t border-line bg-background/90 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-md">
        {(
          [
            ["home", "Home", IconHome],
            ["history", "History", IconHistory],
            ["progress", "Progress", IconChart],
            ["coach", "Coach", IconCoach],
          ] as const
        ).map(([id, label, Icon]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex min-h-[48px] flex-1 flex-col items-center justify-center gap-1 text-[10px] font-semibold uppercase tracking-wider transition-colors ${
              tab === id ? "text-accent" : "text-muted"
            }`}
          >
            <Icon width={22} height={22} strokeWidth={tab === id ? 2.4 : 2} />
            {label}
          </button>
        ))}
      </nav>

      {/* sheets */}
      <Sheet open={sheet.type !== "none"} onClose={close}>
        {sheet.type === "settings" && (
          <div className="space-y-5 pb-2">
            <div>
              <h2 className="text-2xl font-bold uppercase tracking-wide">
                Settings & backup
              </h2>
              <p className="mt-1 text-sm text-muted">
                You have{" "}
                <b className="text-foreground">{totalLogs}</b> logs saved (
                {data.workouts.length} workouts · {data.runs.length} cardio ·{" "}
                {data.weights.length} weigh-ins).
              </p>
            </div>

            <div className="rounded-2xl border border-line bg-card p-4">
              <h3 className="text-base font-bold uppercase tracking-wide">
                Back up your data
              </h3>
              <p className="mt-1 text-xs text-muted">
                Your logs are stored on this device. Save a backup file you can
                keep safe or restore later.
              </p>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <Button onClick={exportData}>Export backup</Button>
                <Button
                  variant="ghost"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Restore backup
                </Button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/json,.json"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) importData(f);
                  e.target.value = "";
                }}
              />
            </div>

            <div className="rounded-2xl border border-line bg-card p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold uppercase tracking-wide">
                  Cloud account
                </h3>
                {user && (
                  <span
                    className={`flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider ${
                      status === "error" ? "text-red-400" : "text-success"
                    }`}
                  >
                    <span
                      className={`h-2 w-2 rounded-full ${
                        status === "syncing"
                          ? "bg-accent animate-pulse"
                          : status === "error"
                          ? "bg-red-400"
                          : "bg-success"
                      }`}
                    />
                    {status === "syncing"
                      ? "Syncing"
                      : status === "error"
                      ? "Error"
                      : "Synced"}
                  </span>
                )}
              </div>

              {user ? (
                <div className="mt-2">
                  <p className="text-sm">
                    Signed in as{" "}
                    <b className="break-all">{user.email}</b>
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    Your logs sync to the cloud automatically and are safe
                    across devices.
                  </p>
                  <Button
                    variant="ghost"
                    className="mt-3 w-full"
                    onClick={() => signOut()}
                  >
                    Sign out
                  </Button>
                </div>
              ) : (
                <div className="mt-2">
                  <p className="text-xs text-muted">
                    Log in to sync your data across devices so it can never be
                    lost. First time? Just pick a password — your account is
                    created automatically.
                  </p>
                  <div className="mt-3 space-y-2">
                    <Input
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      placeholder="you@email.com"
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                    />
                    <Input
                      type="password"
                      autoComplete="current-password"
                      placeholder="Password (min 6 characters)"
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                    />
                    {authError && (
                      <p className="text-xs text-red-400">{authError}</p>
                    )}
                    <Button
                      className="w-full"
                      disabled={
                        !authEmail.includes("@") ||
                        authPassword.length < 6 ||
                        authBusy
                      }
                      onClick={async () => {
                        setAuthBusy(true);
                        setAuthError(null);
                        const err = await authenticate(authEmail, authPassword);
                        setAuthBusy(false);
                        if (err) setAuthError(err);
                        else setAuthPassword("");
                      }}
                    >
                      {authBusy ? "…" : "Sign in / Create account"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {sheet.type === "menu" && (
          <div className="pb-2">
            <h2 className="mb-4 text-2xl font-bold uppercase tracking-wide">
              Log an entry
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <MenuTile
                icon={<IconDumbbell width={26} height={26} />}
                label="Strength"
                accent="accent"
                onClick={() => setSheet({ type: "newWorkout" })}
              />
              <MenuTile
                icon={<IconRun width={26} height={26} />}
                label="Cardio"
                accent="accent2"
                onClick={() => setSheet({ type: "newRun" })}
              />
              <MenuTile
                icon={<IconScale width={26} height={26} />}
                label="Bodyweight"
                accent="success"
                onClick={() => setSheet({ type: "newWeight" })}
              />
              <MenuTile
                icon={<IconCoach width={26} height={26} />}
                label="Coach plan"
                accent="accent"
                onClick={() => {
                  close();
                  setTab("coach");
                  setCoachSignal((n) => n + 1);
                }}
              />
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
            <h3 className="text-base font-bold uppercase tracking-wide">
              Weight trend
            </h3>
            <span className="text-xs text-muted">
              {weights.length} entries
            </span>
          </div>
          <LineChart
            points={weights.map((w) => ({ x: w.date, y: w.weight }))}
            unit="kg"
            color="var(--success)"
          />
        </div>
      )}

      <div>
        <h3 className="mb-3 text-base font-bold uppercase tracking-wide text-muted">
          Recent activity
        </h3>
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
                ? "bg-accent text-[#1a0f04] font-bold"
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

function MenuTile({
  icon,
  label,
  accent,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  accent: "accent" | "accent2" | "success";
  onClick: () => void;
}) {
  const ring = {
    accent: "text-accent",
    accent2: "text-accent2",
    success: "text-success",
  }[accent];
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-start gap-6 rounded-2xl border border-line bg-card2 p-4 text-left transition active:scale-[0.98] active:bg-card"
    >
      <span className={ring}>{icon}</span>
      <span className="font-display text-lg font-semibold uppercase tracking-wide">
        {label}
      </span>
    </button>
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
