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
    
    // Get streak info with group details
    const [streakData] = await conn.execute(`
      SELECT 
        s.*,
        g.name as group_name,
        COUNT(gm.user_id) as total_members
      FROM streaks s
      JOIN groups g ON s.group_id = g.id
      JOIN group_members gm ON g.id = gm.group_id
      WHERE s.group_id = ?
      GROUP BY s.id, g.id
    `, [groupId]) as any;

    if (streakData.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Streak not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const streak = streakData[0];

    // Get today's contributions
    const today = new Date().toISOString().split('T')[0];
    const [todayContributions] = await conn.execute(`
      SELECT 
        dc.*,
        u.username
      FROM daily_contributions dc
      JOIN users u ON dc.user_id = u.id
      WHERE dc.group_id = ? AND dc.contribution_date = ?
    `, [groupId, today]) as any;

    return new Response(
      JSON.stringify({ 
        streak,
        todayContributions
      }),
      { 
        status: 200, 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        } 
      }
    );
  } catch (error) {
    console.error('Get streak error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}