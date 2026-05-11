import {
  integer,
  primaryKey,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "timestamp" }),
  image: text("image"),
  locale: text("locale"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const accounts = sqliteTable(
  "accounts",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => [
    primaryKey({ columns: [account.provider, account.providerAccountId] }),
  ],
);

export const sessions = sqliteTable("sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: integer("expires", { mode: "timestamp" }).notNull(),
});

export const verificationTokens = sqliteTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: integer("expires", { mode: "timestamp" }).notNull(),
  },
  (vt) => [primaryKey({ columns: [vt.identifier, vt.token] })],
);

export const workoutTemplates = sqliteTable("workout_templates", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  weekday: text("weekday"),
  muscleGroup: text("muscle_group"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const templateExercises = sqliteTable("template_exercises", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  templateId: text("template_id")
    .notNull()
    .references(() => workoutTemplates.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  imageUrl: text("image_url"),
  youtubeUrl: text("youtube_url"),
  order: integer("order").notNull(),
});

export const calendarDays = sqliteTable("calendar_days", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  date: text("date").notNull(),
  type: text("type", { enum: ["workout", "rest"] }).notNull(),
});

export const workoutSessions = sqliteTable("workout_sessions", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  date: text("date").notNull(),
  templateId: text("template_id").references(() => workoutTemplates.id, {
    onDelete: "set null",
  }),
  status: text("status", { enum: ["in_progress", "completed"] })
    .notNull()
    .default("in_progress"),
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const sessionExercises = sqliteTable("session_exercises", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  sessionId: text("session_id")
    .notNull()
    .references(() => workoutSessions.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  order: integer("order").notNull(),
});

export const exerciseSets = sqliteTable("exercise_sets", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  sessionExerciseId: text("session_exercise_id")
    .notNull()
    .references(() => sessionExercises.id, { onDelete: "cascade" }),
  setNumber: integer("set_number").notNull(),
  reps: integer("reps"),
  weight: integer("weight"),
  completed: integer("completed", { mode: "boolean" }).notNull().default(false),
});
