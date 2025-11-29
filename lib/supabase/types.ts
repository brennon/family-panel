/**
 * TypeScript types for Supabase database schema
 * Generated based on the database schema defined in migrations
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = 'parent' | 'kid';
export type RewardType = 'money' | 'screen_time' | 'both';

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string;
          role: UserRole;
          screen_time_daily_minutes: number;
          pin_hash: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          name: string;
          role: UserRole;
          screen_time_daily_minutes?: number;
          pin_hash?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          role?: UserRole;
          screen_time_daily_minutes?: number;
          pin_hash?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      chores: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          monetary_value_cents: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          monetary_value_cents?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          monetary_value_cents?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      chore_assignments: {
        Row: {
          id: string;
          chore_id: string;
          user_id: string;
          assigned_date: string;
          completed: boolean;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          chore_id: string;
          user_id: string;
          assigned_date?: string;
          completed?: boolean;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          chore_id?: string;
          user_id?: string;
          assigned_date?: string;
          completed?: boolean;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      incentive_types: {
        Row: {
          id: string;
          name: string;
          unit: string;
          reward_cents_per_unit: number;
          reward_minutes_per_unit: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          unit: string;
          reward_cents_per_unit?: number;
          reward_minutes_per_unit?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          unit?: string;
          reward_cents_per_unit?: number;
          reward_minutes_per_unit?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      incentive_logs: {
        Row: {
          id: string;
          user_id: string;
          incentive_type_id: string;
          date: string;
          units_completed: number;
          reward_type: RewardType;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          incentive_type_id: string;
          date?: string;
          units_completed: number;
          reward_type: RewardType;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          incentive_type_id?: string;
          date?: string;
          units_completed?: number;
          reward_type?: RewardType;
          created_at?: string;
          updated_at?: string;
        };
      };
      screen_time_sessions: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          start_time: string;
          end_time: string | null;
          duration_seconds: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          date?: string;
          start_time?: string;
          end_time?: string | null;
          duration_seconds?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          date?: string;
          start_time?: string;
          end_time?: string | null;
          duration_seconds?: number | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_user_role: {
        Args: { user_id: string };
        Returns: string;
      };
      is_parent: {
        Args: { user_id: string };
        Returns: boolean;
      };
      validate_kid_pin: {
        Args: { p_user_id: string; p_pin: string };
        Returns: boolean;
      };
      set_kid_pin: {
        Args: { p_user_id: string; p_pin: string };
        Returns: boolean;
      };
    };
    Enums: Record<string, never>;
  };
}
