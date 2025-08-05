export interface User {
  id: string;
  username: string;
  email: string;
  avatar_url?: string;
  push_token?: string;
  created_at: string;
  updated_at: string;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  invite_code: string;
  created_by: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
  member_count?: number;
  current_streak?: number;
  best_streak?: number;
  is_admin?: boolean;
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  joined_at: string;
  is_admin: boolean;
}

export interface Message {
  id: string;
  group_id: string;
  user_id: string;
  content?: string;
  image_url?: string;
  image_filename?: string;
  image_size?: number;
  message_type: 'text' | 'image';
  reply_to_message_id?: string;
  created_at: string;
  updated_at: string;
  username?: string;
  user_avatar?: string;
}

export interface WallPhoto {
  id: string;
  group_id: string;
  message_id: string;
  user_id: string;
  image_url: string;
  image_filename?: string;
  caption?: string;
  likes_count: number;
  created_at: string;
  username?: string;
  user_avatar?: string;
  message_created_at?: string;
}

export interface Streak {
  id: string;
  group_id: string;
  current_streak: number;
  best_streak: number;
  last_activity_date?: string;
  created_at: string;
  updated_at: string;
  group_name?: string;
  total_members?: number;
}

export interface DailyContribution {
  id: string;
  group_id: string;
  user_id: string;
  contribution_date: string;
  contribution_type: 'message' | 'photo';
  message_id?: string;
  created_at: string;
  username?: string;
}

export interface Notification {
  id: string;
  user_id: string;
  group_id: string;
  title: string;
  body: string;
  data?: any;
  read_at?: string;
  created_at: string;
}