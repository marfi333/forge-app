export const WEEKDAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

export type Weekday = (typeof WEEKDAYS)[number];

export const MUSCLE_GROUPS = [
  "Chest",
  "Back",
  "Shoulders",
  "Legs",
  "Arms",
  "Core",
  "Quads",
  "Hamstrings",
  "Glutes",
  "Biceps",
  "Triceps",
  "Calves",
  "Forearms",
  "Upper Back",
  "Lower Back",
] as const;

export type MuscleGroup = (typeof MUSCLE_GROUPS)[number];

export const SYSTEM_MUSCLE_GROUP_KEYS = [
  "chest",
  "back",
  "shoulders",
  "biceps",
  "triceps",
  "quads",
  "hamstrings",
  "glutes",
  "core",
  "calves",
  "forearms",
] as const;

export type SystemMuscleGroupKey = (typeof SYSTEM_MUSCLE_GROUP_KEYS)[number];
