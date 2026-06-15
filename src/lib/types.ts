export type SetEntry = { weight: number; reps: number };

export type Exercise = {
  id: string;
  name: string;
  sets: SetEntry[];
  notes?: string;
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

export type AppData = {
  workouts: Workout[];
  runs: Run[];
  weights: WeightEntry[];
};

export const emptyData: AppData = { workouts: [], runs: [], weights: [] };
