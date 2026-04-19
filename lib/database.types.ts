// Mirrors supabase/migrations/0001_init.sql.
// Hand-written for now; swap to `supabase gen types typescript` output once the
// Supabase CLI is wired up (see docs/MEMORY.md).

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          timezone: string;
          subscription_tier: "free" | "pro";
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          timezone?: string;
          subscription_tier?: "free" | "pro";
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          display_name?: string | null;
          timezone?: string;
          subscription_tier?: "free" | "pro";
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
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
