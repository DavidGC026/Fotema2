import { getConnection } from '@/lib/database';
import { saveImage } from '@/lib/imageUpload';
import type { Message } from '@/types/database';

export async function POST(request: Request) {
  try {
    const { groupId, userId, content, imageData, messageType, imageFilename } = await request.json();

    if (!groupId || !userId || !messageType) {
      return new Response(
        JSON.stringify({ error: 'Group ID, user ID, and message type are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (messageType === 'text' && !content) {
      return new Response(
        JSON.stringify({ error: 'Content is required for text messages' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (messageType === 'image' && !imageData) {
      return new Response(
        JSON.stringify({ error: 'Image data is required for image messages' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const conn = await getConnection();
    
    // Verify user is member of the group
    const [members] = await conn.execute(
      'SELECT id FROM group_members WHERE group_id = ? AND user_id = ?',
      [groupId, userId]
    ) as any;

    if (members.length === 0) {
      return new Response(
        JSON.stringify({ error: 'User is not a member of this group' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    let imageUrl = null;
    let finalImageFilename = null;
    let imageSize = null;

    if (messageType === 'image' && imageData) {
      const filename = imageFilename || `message_${Date.now()}.jpg`;
      imageUrl = await saveImage(imageData, filename);
      finalImageFilename = filename;
      
      // Calculate approximate image size from base64
      const base64Data = imageData.replace(/^data:image\/[a-z]+;base64,/, '');
      imageSize = Math.round((base64Data.length * 3) / 4);
    }

    // Insert message
    const [result] = await conn.execute(
      'INSERT INTO messages (group_id, user_id, content, image_url, image_filename, image_size, message_type) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [groupId, userId, content || null, imageUrl, finalImageFilename, imageSize, messageType]
    ) as any;

    const messageId = result.insertId;

    // If it's an image message, add to wall
    if (messageType === 'image' && imageUrl) {
      await conn.execute(
        'INSERT INTO wall_photos (group_id, message_id, user_id, image_url, image_filename, caption) VALUES (?, ?, ?, ?, ?, ?)',
        [groupId, messageId, userId, imageUrl, finalImageFilename, content || null]
      );
    }

    // Record daily contribution
    const today = new Date().toISOString().split('T')[0];
    await conn.execute(
      'INSERT IGNORE INTO daily_contributions (group_id, user_id, contribution_date, contribution_type, message_id) VALUES (?, ?, ?, ?, ?)',
      [groupId, userId, today, messageType === 'image' ? 'photo' : 'message', messageId]
    );

    // Update streak
    await updateGroupStreak(groupId);

    // Get the created message with user info
    const [messages] = await conn.execute(`
      SELECT m.*, u.username, u.avatar_url as user_avatar
      FROM messages m 
      JOIN users u ON m.user_id = u.id 
      WHERE m.id = ?
    `, [messageId]) as any;

    const message = messages[0] as Message & { username: string; user_avatar?: string };

    return new Response(
      JSON.stringify({ message }),
      { 
        status: 201, 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        } 
      }
    );
  } catch (error) {
    console.error('Send message error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

async function updateGroupStreak(groupId: number) {
  try {
    const conn = await getConnection();
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Get total members in group
    const [memberCount] = await conn.execute(
      'SELECT COUNT(*) as count FROM group_members WHERE group_id = ?',
      [groupId]
    ) as any;

    const totalMembers = memberCount[0].count;

    // Get contributions for today
    const [todayContributions] = await conn.execute(
      'SELECT COUNT(*) as count FROM daily_contributions WHERE group_id = ? AND contribution_date = ?',
      [groupId, today]
    ) as any;

    const todayCount = todayContributions[0].count;

    // Get current streak info
    const [streakInfo] = await conn.execute(
      'SELECT * FROM streaks WHERE group_id = ?',
      [groupId]
    ) as any;

    let currentStreak = streakInfo[0]?.current_streak || 0;
    let bestStreak = streakInfo[0]?.best_streak || 0;
    const lastActivityDate = streakInfo[0]?.last_activity_date;

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
      await conn.execute(
        'UPDATE streaks SET current_streak = ?, best_streak = ?, last_activity_date = ? WHERE group_id = ?',
        [currentStreak, bestStreak, today, groupId]
      );
    }
  } catch (error) {
    console.error('Error updating streak:', error);
  }
}