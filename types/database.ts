export interface User {
  id: number;
  username: string;
  email: string;
  avatar_url?: string;
  created_at: Date;
  updated_at: Date;
}

export interface Group {
  id: number;
  name: string;
  invite_code: string;
  created_by: number;
  created_at: Date;
  updated_at: Date;
}

export interface GroupMember {
  id: number;
  group_id: number;
  user_id: number;
  joined_at: Date;
  is_admin: boolean;
}

export interface Message {
  id: number;
  group_id: number;
  user_id: number;
  content?: string;
  image_url?: string;
  message_type: 'text' | 'image';
  created_at: Date;
}

export interface Streak {
  id: number;
  group_id: number;
  current_streak: number;
  best_streak: number;
  last_activity_date: Date;
  created_at: Date;
  updated_at: Date;
}

export interface DailyContribution {
  id: number;
  group_id: number;
  user_id: number;
  contribution_date: Date;
  created_at: Date;
}