import { pgTable, text, timestamp, integer, boolean, uuid, date, pgEnum, jsonb } from "drizzle-orm/pg-core";

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
    order: integer("order").notNull().default(0),
    kind: text("kind").notNull().default("good"), // 'good' | 'bad'
    difficulty: text("difficulty").notNull().default("easy"), // good: trivial|easy|medium|hard, bad: light|medium|severe
    attribute: text("attribute"), // null = inferred from category
    customXp: integer("custom_xp"),
    customGold: integer("custom_gold"),
    customHp: integer("custom_hp"),
    minValue: integer("min_value"), // numeric habits: "minimum viable" value that keeps the streak (no reward)
    activeDays: text("active_days"), // daily habits: comma-separated weekdays (0=Sun..6=Sat); null = every day
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

// --- Gamification ---

// Ledger: every XP / gold / HP change is an event. Totals are the sum of events.
export const gameEvents = pgTable("game_events", {
    id: uuid("id").defaultRandom().primaryKey(),
    type: text("type").notNull(),
    sourceId: uuid("source_id"),
    date: date("date").notNull(), // YYYY-MM-DD
    xp: integer("xp").notNull().default(0),
    gold: integer("gold").notNull().default(0),
    hp: integer("hp").notNull().default(0),
    attribute: text("attribute"),
    label: text("label"),
    meta: jsonb("meta"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const player = pgTable("player", {
    id: uuid("id").defaultRandom().primaryKey(),
    hp: integer("hp").notNull().default(100),
    combo: integer("combo").notNull().default(0),
    shields: integer("shields").notNull().default(0),
    difficultyMode: text("difficulty_mode").notNull().default("normal"),
    lastJudgedDate: date("last_judged_date"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const rewards = pgTable("rewards", {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    emoji: text("emoji").notNull().default("🎁"),
    cost: integer("cost").notNull(),
    note: text("note"),
    archived: boolean("archived").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const quests = pgTable("quests", {
    id: uuid("id").defaultRandom().primaryKey(),
    title: text("title").notNull(),
    notes: text("notes"),
    size: text("size").notNull().default("small"), // small|medium|large|epic
    attribute: text("attribute"),
    deadline: date("deadline"),
    customXp: integer("custom_xp"),
    customGold: integer("custom_gold"),
    penalizeOverdue: boolean("penalize_overdue").default(false).notNull(),
    status: text("status").notNull().default("open"), // open|done
    completedAt: date("completed_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const questSteps = pgTable("quest_steps", {
    id: uuid("id").defaultRandom().primaryKey(),
    questId: uuid("quest_id").references(() => quests.id, { onDelete: 'cascade' }).notNull(),
    title: text("title").notNull(),
    done: boolean("done").default(false).notNull(),
    order: integer("order").notNull().default(0),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});
