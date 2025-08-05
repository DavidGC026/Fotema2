import { getConnection } from '@/lib/database';

export async function GET(request: Request, { groupId }: { groupId: string }) {
  try {
    if (!groupId) {
      return new Response(
        JSON.stringify({ error: 'Group ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const conn = await getConnection();
    
    // Get wall photos with user info and likes
    const [wallPhotos] = await conn.execute(`
      SELECT 
        wp.*,
        u.username,
        u.avatar_url as user_avatar,
        m.created_at as message_created_at
      FROM wall_photos wp
      JOIN users u ON wp.user_id = u.id
      JOIN messages m ON wp.message_id = m.id
      WHERE wp.group_id = ?
      ORDER BY wp.created_at DESC
      LIMIT 50
    `, [groupId]) as any;

    return new Response(
      JSON.stringify({ wallPhotos }),
      { 
        status: 200, 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        } 
      }
    );
  } catch (error) {
    console.error('Get wall photos error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}