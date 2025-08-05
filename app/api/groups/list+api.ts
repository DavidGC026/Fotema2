import { getConnection } from '@/lib/database';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS(request: Request) {
  return new Response(null, {
    status: 200,
    headers: corsHeaders,
  });
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'User ID is required' }),
        { 
          status: 400, 
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders
          } 
        }
      );
    }

    const conn = await getConnection();
    
    // Get user's groups with member count and latest message
    const [groups] = await conn.execute(`
      SELECT 
        g.*,
        COUNT(DISTINCT gm.user_id) as member_count,
        MAX(m.created_at) as last_message_at,
        s.current_streak,
        s.best_streak,
        (SELECT gm2.is_admin FROM group_members gm2 WHERE gm2.group_id = g.id AND gm2.user_id = ?) as is_admin
      FROM groups g
      JOIN group_members gm ON g.id = gm.group_id
      LEFT JOIN messages m ON g.id = m.group_id
      LEFT JOIN streaks s ON g.id = s.group_id
      WHERE gm.user_id = ?
      GROUP BY g.id
      ORDER BY last_message_at DESC, g.created_at DESC
    `, [userId, userId]) as any;

    return new Response(
      JSON.stringify({ groups }),
      { 
        status: 200, 
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        } 
      }
    );
  } catch (error) {
    console.error('Get groups error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        } 
      }
    );
  }
}