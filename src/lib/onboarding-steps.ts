export interface TourStep {
  id: string;
  target: string;
  titleKey: string;
  descriptionKey: string;
  page: string;
}

export const tourSteps: TourStep[] = [
  {
    id: "dashboard-weekly-plan",
    target: '[data-tour="weekly-plan"]',
    titleKey: "dashboardWeeklyPlanTitle",
    descriptionKey: "dashboardWeeklyPlanDescription",
    page: "/dashboard",
  },
  {
    id: "dashboard-start-workout",
    target: '[data-tour="start-workout"]',
    titleKey: "dashboardStartWorkoutTitle",
    descriptionKey: "dashboardStartWorkoutDescription",
    page: "/dashboard",
  },
  {
    id: "templates-list",
    target: '[data-tour="template-list"]',
    titleKey: "templatesListTitle",
    descriptionKey: "templatesListDescription",
    page: "/templates",
  },
  {
    id: "templates-create",
    target: '[data-tour="create-template"]',
    titleKey: "templatesCreateTitle",
    descriptionKey: "templatesCreateDescription",
    page: "/templates",
  },
  {
    id: "calendar-grid",
    target: '[data-tour="calendar-grid"]',
    titleKey: "calendarGridTitle",
    descriptionKey: "calendarGridDescription",
    page: "/calendar",
  },
  {
    id: "stats-charts",
    target: '[data-tour="stats-charts"]',
    titleKey: "statsChartsTitle",
    descriptionKey: "statsChartsDescription",
    page: "/stats",
  },
];
