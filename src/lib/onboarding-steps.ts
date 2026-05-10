export interface TourStep {
  id: string;
  target: string;
  title: string;
  description: string;
  page: string;
}

export const tourSteps: TourStep[] = [
  {
    id: "dashboard-weekly-plan",
    target: '[data-tour="weekly-plan"]',
    title: "Your Weekly Plan",
    description:
      "See your workout schedule at a glance. Each card shows your planned workout or rest day.",
    page: "/dashboard",
  },
  {
    id: "dashboard-start-workout",
    target: '[data-tour="start-workout"]',
    title: "Start a Workout",
    description:
      "Tap here to begin logging a new workout session. Pick a template or start from scratch.",
    page: "/dashboard",
  },
  {
    id: "templates-list",
    target: '[data-tour="template-list"]',
    title: "Workout Templates",
    description:
      "Templates define your workout routines. Each template holds a list of exercises you can reuse.",
    page: "/templates",
  },
  {
    id: "templates-create",
    target: '[data-tour="create-template"]',
    title: "Create a Template",
    description:
      "Tap here to create a new workout template. Add exercises, assign a weekday, and set a muscle group.",
    page: "/templates",
  },
  {
    id: "calendar-grid",
    target: '[data-tour="calendar-grid"]',
    title: "Calendar View",
    description:
      "Track your training consistency. Tap any day to mark it as a workout or rest day.",
    page: "/calendar",
  },
  {
    id: "stats-charts",
    target: '[data-tour="stats-charts"]',
    title: "Your Progress",
    description:
      "Charts and personal records live here. Track your strength gains over time.",
    page: "/stats",
  },
];
