export type SetEntry = { weight: number; reps: number };

export type Exercise = {
  id: string;
  name: string;
  sets: SetEntry[];
  notes?: string;
  perSide?: boolean; // weight logged is per arm/leg (unilateral)
  superset?: boolean; // grouped as a superset with the exercise above
};

export type Rating = { effort?: number; strength?: number; pump?: number };

export type Workout = {
  id: string;
  kind: "strength";
  date: string; // ISO date (yyyy-mm-dd)
  title: string;
  bodyweight?: number;
  exercises: Exercise[];
  feeling?: string;
  food?: string;
  rating?: Rating;
  notes?: string;
  planned?: boolean; // AI-proposed, not yet performed
  createdAt: number;
};

export type Run = {
  id: string;
  kind: "cardio";
  date: string;
  activity: string; // Run, Stairmaster, Bike, Walk...
  distanceKm?: number;
  durationMin?: number;
  bodyweight?: number;
  feeling?: string;
  notes?: string;
  planned?: boolean; // AI-proposed, not yet performed
  createdAt: number;
};

export type WeightEntry = {
  id: string;
  date: string;
  weight: number;
  notes?: string;
  createdAt: number;
};

export type Goal = "recomp" | "fatloss" | "muscle" | "strength";

export type Profile = {
  goals?: Goal[];
  targetWeight?: number;
  daysPerWeek?: number;
  experience?: "beginner" | "intermediate" | "advanced";
  equipment?: string; // gym / home / what they have access to
  notes?: string; // anything else they want the coach to know
  onboarded?: boolean;
};

export type Strain = {
  id: string;
  area: string; // Ankle, Wrist, Shoulder, Knee, Lower back...
  severity?: "niggle" | "sore" | "painful";
  note?: string;
  date: string;
  active: boolean;
  createdAt: number;
};

export type CoachMemory = {
  notes: string; // running notes the AI maintains about the athlete
  updatedAt?: number;
};

export type AppData = {
  workouts: Workout[];
  runs: Run[];
  weights: WeightEntry[];
  profile?: Profile;
  strains?: Strain[];
  coachMemory?: CoachMemory;
};

export const emptyData: AppData = {
  workouts: [],
  runs: [],
  weights: [],
  profile: {},
  strains: [],
  coachMemory: { notes: "" },
};
