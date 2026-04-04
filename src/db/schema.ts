import { pgTable, text, timestamp, integer, boolean, uuid, date, pgEnum } from "drizzle-orm/pg-core";

export const priorityEnum = pgEnum('priority', ['none', 'low', 'medium', 'high']);
export const statusEnum = pgEnum('status', ['pending', 'completed']);

export const habits = pgTable("habits", {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    category: text("category").notNull(),
    frequency: text("frequency").notNull(), // 'daily' | 'weekly'
    goal: integer("goal").notNull(),
    metricType: text("metric_type").notNull().default("boolean"), // 'boolean' | 'numeric'
    targetValue: integer("target_value").notNull().default(1),
    unit: text("unit"),
    archived: boolean("archived").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const habitLogs = pgTable("habit_logs", {
    id: uuid("id").defaultRandom().primaryKey(),
    habitId: uuid("habit_id").references(() => habits.id).notNull(),
    date: date("date").notNull(), // YYYY-MM-DD
    value: integer("value").notNull(),
    timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const tasks = pgTable("tasks", {
    id: uuid("id").defaultRandom().primaryKey(),
    title: text("title").notNull(),
    description: text("description"),
    priority: priorityEnum("priority").default('none').notNull(),
    estimatedPomodoros: integer("estimated_pomodoros").default(1).notNull(),
    completedPomodoros: integer("completed_pomodoros").default(0).notNull(),
    status: statusEnum("status").default('pending').notNull(),
    deadline: date("deadline"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});
