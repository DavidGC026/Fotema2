import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Database types
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          username: string;
          email: string;
          avatar_url: string | null;
          push_token: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          username: string;
          email: string;
          avatar_url?: string | null;
          push_token?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          email?: string;
          avatar_url?: string | null;
          push_token?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      groups: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          invite_code: string;
          created_by: string;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          invite_code: string;
          created_by: string;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          invite_code?: string;
          created_by?: string;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      group_members: {
        Row: {
          id: string;
          group_id: string;
          user_id: string;
          joined_at: string;
          is_admin: boolean;
        };
        Insert: {
          id?: string;
          group_id: string;
          user_id: string;
          joined_at?: string;
          is_admin?: boolean;
        };
        Update: {
          id?: string;
          group_id?: string;
          user_id?: string;
          joined_at?: string;
          is_admin?: boolean;
        };
      };
      messages: {
        Row: {
          id: string;
          group_id: string;
          user_id: string;
          content: string | null;
          image_url: string | null;
          image_filename: string | null;
          image_size: number | null;
          message_type: 'text' | 'image';
          reply_to_message_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          group_id: string;
          user_id: string;
          content?: string | null;
          image_url?: string | null;
          image_filename?: string | null;
          image_size?: number | null;
          message_type: 'text' | 'image';
          reply_to_message_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          group_id?: string;
          user_id?: string;
          content?: string | null;
          image_url?: string | null;
          image_filename?: string | null;
          image_size?: number | null;
          message_type?: 'text' | 'image';
          reply_to_message_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      wall_photos: {
        Row: {
          id: string;
          group_id: string;
          message_id: string;
          user_id: string;
          image_url: string;
          image_filename: string | null;
          caption: string | null;
          likes_count: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          group_id: string;
          message_id: string;
          user_id: string;
          image_url: string;
          image_filename?: string | null;
          caption?: string | null;
          likes_count?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          group_id?: string;
          message_id?: string;
          user_id?: string;
          image_url?: string;
          image_filename?: string | null;
          caption?: string | null;
          likes_count?: number;
          created_at?: string;
        };
      };
      wall_photo_likes: {
        Row: {
          id: string;
          wall_photo_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          wall_photo_id: string;
          user_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          wall_photo_id?: string;
          user_id?: string;
          created_at?: string;
        };
      };
      streaks: {
        Row: {
          id: string;
          group_id: string;
          current_streak: number;
          best_streak: number;
          last_activity_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          group_id: string;
          current_streak?: number;
          best_streak?: number;
          last_activity_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          group_id?: string;
          current_streak?: number;
          best_streak?: number;
          last_activity_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      daily_contributions: {
        Row: {
          id: string;
          group_id: string;
          user_id: string;
          contribution_date: string;
          contribution_type: 'message' | 'photo';
          message_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          group_id: string;
          user_id: string;
          contribution_date: string;
          contribution_type?: 'message' | 'photo';
          message_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          group_id?: string;
          user_id?: string;
          contribution_date?: string;
          contribution_type?: 'message' | 'photo';
          message_id?: string | null;
          created_at?: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          group_id: string;
          title: string;
          body: string;
          data: any | null;
          read_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          group_id: string;
          title: string;
          body: string;
          data?: any | null;
          read_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          group_id?: string;
          title?: string;
          body?: string;
          data?: any | null;
          read_at?: string | null;
          created_at?: string;
        };
      };
    };
  };
}