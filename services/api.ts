import { supabase } from '@/lib/supabase';
import type { Database } from '@/lib/supabase';

type Tables = Database['public']['Tables'];

export class ApiService {
  // Auth
  static async registerUser(username: string, email: string) {
    // First create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password: Math.random().toString(36).substring(2, 15), // Temporary password
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('Failed to create user');

    // Then create user profile
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        username,
        email,
      })
      .select()
      .single();

    if (userError) throw userError;

    return { user };
  }

  static async signInUser(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data;
  }

  static async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    
    if (!user) return null;

    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) throw profileError;
    return profile;
  }

  // Groups
  static async createGroup(name: string, userId: string) {
    const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    const { data: group, error: groupError } = await supabase
      .from('groups')
      .insert({
        name,
        invite_code: inviteCode,
        created_by: userId,
      })
      .select()
      .single();

    if (groupError) throw groupError;

    // Add creator as admin member
    const { error: memberError } = await supabase
      .from('group_members')
      .insert({
        group_id: group.id,
        user_id: userId,
        is_admin: true,
      });

    if (memberError) throw memberError;

    // Initialize streak
    const { error: streakError } = await supabase
      .from('streaks')
      .insert({
        group_id: group.id,
      });

    if (streakError) throw streakError;

    return { group };
  }

  static async joinGroup(inviteCode: string, userId: string) {
    // Find group by invite code
    const { data: group, error: groupError } = await supabase
      .from('groups')
      .select('*')
      .eq('invite_code', inviteCode)
      .single();

    if (groupError) throw groupError;
    if (!group) throw new Error('Invalid invite code');

    // Check if user is already a member
    const { data: existingMember } = await supabase
      .from('group_members')
      .select('id')
      .eq('group_id', group.id)
      .eq('user_id', userId)
      .single();

    if (existingMember) {
      throw new Error('User is already a member of this group');
    }

    // Add user to group
    const { error: memberError } = await supabase
      .from('group_members')
      .insert({
        group_id: group.id,
        user_id: userId,
      });

    if (memberError) throw memberError;

    return { group, message: 'Successfully joined group' };
  }

  static async getUserGroups(userId: string) {
    const { data: groups, error } = await supabase
      .from('group_members')
      .select(`
        groups (
          *,
          streaks (current_streak, best_streak)
        )
      `)
      .eq('user_id', userId);

    if (error) throw error;

    // Get member counts for each group
    const groupsWithCounts = await Promise.all(
      groups.map(async (item: any) => {
        const group = item.groups;
        
        const { count } = await supabase
          .from('group_members')
          .select('*', { count: 'exact', head: true })
          .eq('group_id', group.id);

        const { data: adminData } = await supabase
          .from('group_members')
          .select('is_admin')
          .eq('group_id', group.id)
          .eq('user_id', userId)
          .single();

        return {
          ...group,
          member_count: count || 0,
          current_streak: group.streaks?.[0]?.current_streak || 0,
          best_streak: group.streaks?.[0]?.best_streak || 0,
          is_admin: adminData?.is_admin || false,
        };
      })
    );

    return { groups: groupsWithCounts };
  }

  // Messages
  static async sendMessage(
    groupId: string,
    userId: string,
    content?: string,
    imageData?: string,
    messageType: 'text' | 'image' = 'text',
    imageFilename?: string
  ) {
    let imageUrl = null;
    let finalImageFilename = null;
    let imageSize = null;

    if (messageType === 'image' && imageData) {
      // For now, we'll store the base64 data directly
      // In production, you'd upload to Supabase Storage
      imageUrl = imageData;
      finalImageFilename = imageFilename || `message_${Date.now()}.jpg`;
      
      // Calculate approximate image size from base64
      const base64Data = imageData.replace(/^data:image\/[a-z]+;base64,/, '');
      imageSize = Math.round((base64Data.length * 3) / 4);
    }

    const { data: message, error: messageError } = await supabase
      .from('messages')
      .insert({
        group_id: groupId,
        user_id: userId,
        content: content || null,
        image_url: imageUrl,
        image_filename: finalImageFilename,
        image_size: imageSize,
        message_type: messageType,
      })
      .select(`
        *,
        users (username, avatar_url)
      `)
      .single();

    if (messageError) throw messageError;

    // If it's an image message, add to wall
    if (messageType === 'image' && imageUrl) {
      const { error: wallError } = await supabase
        .from('wall_photos')
        .insert({
          group_id: groupId,
          message_id: message.id,
          user_id: userId,
          image_url: imageUrl,
          image_filename: finalImageFilename,
          caption: content || null,
        });

      if (wallError) console.error('Error adding to wall:', wallError);
    }

    // Record daily contribution
    const today = new Date().toISOString().split('T')[0];
    const { error: contributionError } = await supabase
      .from('daily_contributions')
      .upsert({
        group_id: groupId,
        user_id: userId,
        contribution_date: today,
        contribution_type: messageType === 'image' ? 'photo' : 'message',
        message_id: message.id,
      });

    if (contributionError) console.error('Error recording contribution:', contributionError);

    // Update streak
    await this.updateGroupStreak(groupId);

    return { message };
  }

  static async getMessages(groupId: string) {
    const { data: messages, error } = await supabase
      .from('messages')
      .select(`
        *,
        users (username, avatar_url)
      `)
      .eq('group_id', groupId)
      .order('created_at', { ascending: true })
      .limit(100);

    if (error) throw error;

    return { messages };
  }

  // Streaks
  static async getStreak(groupId: string) {
    const { data: streak, error: streakError } = await supabase
      .from('streaks')
      .select(`
        *,
        groups (name)
      `)
      .eq('group_id', groupId)
      .single();

    if (streakError) throw streakError;

    // Get member count
    const { count: totalMembers } = await supabase
      .from('group_members')
      .select('*', { count: 'exact', head: true })
      .eq('group_id', groupId);

    // Get today's contributions
    const today = new Date().toISOString().split('T')[0];
    const { data: todayContributions, error: contributionsError } = await supabase
      .from('daily_contributions')
      .select(`
        *,
        users (username)
      `)
      .eq('group_id', groupId)
      .eq('contribution_date', today);

    if (contributionsError) throw contributionsError;

    return {
      streak: {
        ...streak,
        group_name: streak.groups?.name,
        total_members: totalMembers || 0,
      },
      todayContributions,
    };
  }

  // Wall
  static async getWallPhotos(groupId: string) {
    const { data: wallPhotos, error } = await supabase
      .from('wall_photos')
      .select(`
        *,
        users (username, avatar_url),
        messages (created_at)
      `)
      .eq('group_id', groupId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    return { wallPhotos };
  }

  static async likeWallPhoto(wallPhotoId: string, userId: string) {
    // Check if already liked
    const { data: existingLike } = await supabase
      .from('wall_photo_likes')
      .select('id')
      .eq('wall_photo_id', wallPhotoId)
      .eq('user_id', userId)
      .single();

    if (existingLike) {
      // Unlike
      const { error: deleteError } = await supabase
        .from('wall_photo_likes')
        .delete()
        .eq('wall_photo_id', wallPhotoId)
        .eq('user_id', userId);

      if (deleteError) throw deleteError;

      // Decrement likes count
      const { error: updateError } = await supabase.rpc('decrement_likes', {
        photo_id: wallPhotoId,
      });

      if (updateError) throw updateError;

      return { liked: false, message: 'Photo unliked' };
    } else {
      // Like
      const { error: insertError } = await supabase
        .from('wall_photo_likes')
        .insert({
          wall_photo_id: wallPhotoId,
          user_id: userId,
        });

      if (insertError) throw insertError;

      // Increment likes count
      const { error: updateError } = await supabase.rpc('increment_likes', {
        photo_id: wallPhotoId,
      });

      if (updateError) throw updateError;

      return { liked: true, message: 'Photo liked' };
    }
  }

  // Helper method to update group streak
  private static async updateGroupStreak(groupId: string) {
    try {
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      // Get total members in group
      const { count: totalMembers } = await supabase
        .from('group_members')
        .select('*', { count: 'exact', head: true })
        .eq('group_id', groupId);

      // Get contributions for today
      const { count: todayCount } = await supabase
        .from('daily_contributions')
        .select('*', { count: 'exact', head: true })
        .eq('group_id', groupId)
        .eq('contribution_date', today);

      // Get current streak info
      const { data: streakInfo } = await supabase
        .from('streaks')
        .select('*')
        .eq('group_id', groupId)
        .single();

      if (!streakInfo) return;

      let currentStreak = streakInfo.current_streak || 0;
      let bestStreak = streakInfo.best_streak || 0;
      const lastActivityDate = streakInfo.last_activity_date;

      // Check if all members contributed today
      if (todayCount === totalMembers) {
        // Check if streak should continue
        if (lastActivityDate === yesterday) {
          currentStreak += 1;
        } else if (lastActivityDate !== today) {
          currentStreak = 1; // Start new streak
        }

        if (currentStreak > bestStreak) {
          bestStreak = currentStreak;
        }

        // Update streak
        const { error } = await supabase
          .from('streaks')
          .update({
            current_streak: currentStreak,
            best_streak: bestStreak,
            last_activity_date: today,
          })
          .eq('group_id', groupId);

        if (error) console.error('Error updating streak:', error);
      }
    } catch (error) {
      console.error('Error updating streak:', error);
    }
  }

  // Initialize database (for compatibility)
  static async initializeDatabase() {
    // Supabase handles database initialization through migrations
    return {
      message: 'Supabase database is ready',
      success: true,
      timestamp: new Date().toISOString(),
    };
  }

  // Test database connection
  static async testDatabaseConnection() {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('count', { count: 'exact', head: true });

      if (error) throw error;

      return {
        success: true,
        message: 'Conexión exitosa a Supabase',
        details: {
          host: 'Supabase',
          database: 'PostgreSQL',
          usersCount: data || 0,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error: any) {
      return {
        success: false,
        message: 'Error de conexión a Supabase',
        error: {
          message: error.message,
          code: error.code || 'SUPABASE_ERROR',
        },
      };
    }
  }
}