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
    
    // Get messages with user info
    const [messages] = await conn.execute(`
      SELECT 
        m.*,
        u.username
      FROM messages m
      JOIN users u ON m.user_id = u.id
      WHERE m.group_id = ?
      ORDER BY m.created_at ASC
      LIMIT 100
    `, [groupId]) as any;

    return new Response(
      JSON.stringify({ messages }),
      { 
        status: 200, 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        } 
      }
    );
  } catch (error) {
    console.error('Get messages error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}