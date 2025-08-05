/*
  # Esquema inicial para aplicación de fotos y rachas

  1. Nuevas Tablas
    - `users` - Información de usuarios
    - `groups` - Grupos de chat
    - `group_members` - Relación usuarios-grupos
    - `messages` - Mensajes y fotos
    - `wall_photos` - Fotos para el muro
    - `wall_photo_likes` - Likes en fotos del muro
    - `streaks` - Información de rachas
    - `daily_contributions` - Contribuciones diarias
    - `notifications` - Notificaciones persistentes

  2. Seguridad
    - Habilitar RLS en todas las tablas
    - Políticas para usuarios autenticados
    - Acceso basado en membresía de grupos
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  email text UNIQUE NOT NULL,
  avatar_url text,
  push_token text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Groups table
CREATE TABLE IF NOT EXISTS groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  invite_code text UNIQUE NOT NULL,
  created_by uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read groups they belong to"
  ON groups
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM group_members 
      WHERE group_id = groups.id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create groups"
  ON groups
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Group admins can update groups"
  ON groups
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM group_members 
      WHERE group_id = groups.id AND user_id = auth.uid() AND is_admin = true
    )
  );

-- Group members table
CREATE TABLE IF NOT EXISTS group_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at timestamptz DEFAULT now(),
  is_admin boolean DEFAULT false,
  UNIQUE(group_id, user_id)
);

ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read group memberships for their groups"
  ON group_members
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM group_members gm2 
      WHERE gm2.group_id = group_members.group_id AND gm2.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can join groups"
  ON group_members
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Group admins can manage members"
  ON group_members
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM group_members gm2 
      WHERE gm2.group_id = group_members.group_id AND gm2.user_id = auth.uid() AND gm2.is_admin = true
    )
  );

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content text,
  image_url text,
  image_filename text,
  image_size integer,
  message_type text NOT NULL CHECK (message_type IN ('text', 'image')),
  reply_to_message_id uuid REFERENCES messages(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_messages_group_created ON messages(group_id, created_at);
CREATE INDEX idx_messages_type ON messages(message_type);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read messages from their groups"
  ON messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM group_members 
      WHERE group_id = messages.group_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can send messages to their groups"
  ON messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM group_members 
      WHERE group_id = messages.group_id AND user_id = auth.uid()
    )
  );

-- Wall photos table
CREATE TABLE IF NOT EXISTS wall_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  message_id uuid NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  image_filename text,
  caption text,
  likes_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(group_id, message_id)
);

CREATE INDEX idx_wall_photos_group_created ON wall_photos(group_id, created_at DESC);

ALTER TABLE wall_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read wall photos from their groups"
  ON wall_photos
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM group_members 
      WHERE group_id = wall_photos.group_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can add wall photos to their groups"
  ON wall_photos
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM group_members 
      WHERE group_id = wall_photos.group_id AND user_id = auth.uid()
    )
  );

-- Wall photo likes table
CREATE TABLE IF NOT EXISTS wall_photo_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wall_photo_id uuid NOT NULL REFERENCES wall_photos(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(wall_photo_id, user_id)
);

ALTER TABLE wall_photo_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read likes on photos from their groups"
  ON wall_photo_likes
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM wall_photos wp
      JOIN group_members gm ON wp.group_id = gm.group_id
      WHERE wp.id = wall_photo_likes.wall_photo_id AND gm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can like photos in their groups"
  ON wall_photo_likes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM wall_photos wp
      JOIN group_members gm ON wp.group_id = gm.group_id
      WHERE wp.id = wall_photo_likes.wall_photo_id AND gm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can unlike their own likes"
  ON wall_photo_likes
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Streaks table
CREATE TABLE IF NOT EXISTS streaks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid UNIQUE NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  current_streak integer DEFAULT 0,
  best_streak integer DEFAULT 0,
  last_activity_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE streaks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read streaks from their groups"
  ON streaks
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM group_members 
      WHERE group_id = streaks.group_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "System can manage streaks"
  ON streaks
  FOR ALL
  TO authenticated
  USING (true);

-- Daily contributions table
CREATE TABLE IF NOT EXISTS daily_contributions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  contribution_date date NOT NULL,
  contribution_type text DEFAULT 'message' CHECK (contribution_type IN ('message', 'photo')),
  message_id uuid REFERENCES messages(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(group_id, user_id, contribution_date)
);

CREATE INDEX idx_daily_contributions_date ON daily_contributions(contribution_date);
CREATE INDEX idx_daily_contributions_group_date ON daily_contributions(group_id, contribution_date);

ALTER TABLE daily_contributions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read contributions from their groups"
  ON daily_contributions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM group_members 
      WHERE group_id = daily_contributions.group_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can add their own contributions"
  ON daily_contributions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM group_members 
      WHERE group_id = daily_contributions.group_id AND user_id = auth.uid()
    )
  );

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  group_id uuid NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text NOT NULL,
  data jsonb,
  read_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_notifications_user_unread ON notifications(user_id, read_at);
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own notifications"
  ON notifications
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications"
  ON notifications
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_groups_updated_at BEFORE UPDATE ON groups
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON messages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_streaks_updated_at BEFORE UPDATE ON streaks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();