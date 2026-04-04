ALTER TABLE "habits" ADD COLUMN "metric_type" text NOT NULL DEFAULT 'boolean';--> statement-breakpoint
ALTER TABLE "habits" ADD COLUMN "target_value" integer NOT NULL DEFAULT 1;--> statement-breakpoint
ALTER TABLE "habits" ADD COLUMN "unit" text;
