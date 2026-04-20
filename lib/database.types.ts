// Mirrors supabase/migrations/0001_init.sql + 0002_locale.sql + 0003_reminders.sql.
// Hand-written for now; swap to `supabase gen types typescript` output once the
// Supabase CLI is wired up (see docs/MEMORY.md).

import type { Locale } from "./i18n/config";

export type ReminderChannel = "email" | "none";
export type ReminderStatus = "pending" | "sent" | "failed" | "rejected";

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          timezone: string;
          locale: Locale;
          subscription_tier: "free" | "pro";
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          preferred_reminder_channel: ReminderChannel;
          quiet_hours_start: string | null;
          quiet_hours_end: string | null;
          unsubscribed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          timezone?: string;
          locale?: Locale;
          subscription_tier?: "free" | "pro";
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          preferred_reminder_channel?: ReminderChannel;
          quiet_hours_start?: string | null;
          quiet_hours_end?: string | null;
          unsubscribed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          display_name?: string | null;
          timezone?: string;
          locale?: Locale;
          subscription_tier?: "free" | "pro";
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          preferred_reminder_channel?: ReminderChannel;
          quiet_hours_start?: string | null;
          quiet_hours_end?: string | null;
          unsubscribed_at?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      habits: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          emoji: string | null;
          cadence: "daily" | "weekly";
          target_days_of_week: number[];
          reminder_time: string | null;
          archived_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          emoji?: string | null;
          cadence?: "daily" | "weekly";
          target_days_of_week?: number[];
          reminder_time?: string | null;
          archived_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          emoji?: string | null;
          cadence?: "daily" | "weekly";
          target_days_of_week?: number[];
          reminder_time?: string | null;
          archived_at?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      check_ins: {
        Row: {
          id: string;
          habit_id: string;
          user_id: string;
          local_date: string;
          checked_in_at: string;
        };
        Insert: {
          id?: string;
          habit_id: string;
          user_id: string;
          local_date: string;
          checked_in_at?: string;
        };
        Update: {
          local_date?: string;
          checked_in_at?: string;
        };
        Relationships: [];
      };
      reminder_sends: {
        Row: {
          id: string;
          user_id: string;
          habit_id: string;
          local_date: string;
          channel: "email";
          status: ReminderStatus;
          provider_id: string | null;
          error_message: string | null;
          sent_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          habit_id: string;
          local_date: string;
          channel: "email";
          status?: ReminderStatus;
          provider_id?: string | null;
          error_message?: string | null;
          sent_at?: string;
        };
        Update: {
          status?: ReminderStatus;
          provider_id?: string | null;
          error_message?: string | null;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Habit = Database["public"]["Tables"]["habits"]["Row"];
export type CheckIn = Database["public"]["Tables"]["check_ins"]["Row"];
export type ReminderSend = Database["public"]["Tables"]["reminder_sends"]["Row"];
