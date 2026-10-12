ALTER TABLE "habits" ADD COLUMN "kind" text NOT NULL DEFAULT 'good';--> statement-breakpoint
ALTER TABLE "habits" ADD COLUMN "difficulty" text NOT NULL DEFAULT 'easy';--> statement-breakpoint
ALTER TABLE "habits" ADD COLUMN "attribute" text;--> statement-breakpoint
ALTER TABLE "habits" ADD COLUMN "custom_xp" integer;--> statement-breakpoint
ALTER TABLE "habits" ADD COLUMN "custom_gold" integer;--> statement-breakpoint
ALTER TABLE "habits" ADD COLUMN "custom_hp" integer;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "game_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" text NOT NULL,
	"source_id" uuid,
	"date" date NOT NULL,
	"xp" integer DEFAULT 0 NOT NULL,
	"gold" integer DEFAULT 0 NOT NULL,
	"hp" integer DEFAULT 0 NOT NULL,
	"attribute" text,
	"label" text,
	"meta" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "game_events_source_unique" ON "game_events" ("type", "source_id", "date") WHERE "type" IN ('habit', 'habit_goal', 'bad_habit', 'quest', 'quest_step', 'overdue');--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "game_events_daily_unique" ON "game_events" ("type", "date") WHERE "type" IN ('perfect_day', 'judgment');--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "game_events_source_idx" ON "game_events" ("type", "source_id");--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "player" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"hp" integer DEFAULT 100 NOT NULL,
	"combo" integer DEFAULT 0 NOT NULL,
	"shields" integer DEFAULT 0 NOT NULL,
	"difficulty_mode" text DEFAULT 'normal' NOT NULL,
	"last_judged_date" date,
	"created_at" timestamp DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "rewards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"emoji" text DEFAULT '🎁' NOT NULL,
	"cost" integer NOT NULL,
	"note" text,
	"archived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "quests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"notes" text,
	"size" text DEFAULT 'small' NOT NULL,
	"attribute" text,
	"deadline" date,
	"custom_xp" integer,
	"custom_gold" integer,
	"penalize_overdue" boolean DEFAULT false NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"completed_at" date,
	"created_at" timestamp DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "quest_steps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"quest_id" uuid NOT NULL REFERENCES "quests"("id") ON DELETE CASCADE,
	"title" text NOT NULL,
	"done" boolean DEFAULT false NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
