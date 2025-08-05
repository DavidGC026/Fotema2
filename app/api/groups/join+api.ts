import { getConnection } from '@/lib/database';

export async function POST(request: Request) {
  try {
    const { inviteCode, userId } = await request.json();

    if (!inviteCode || !userId) {
      return new Response(
        JSON.stringify({ error: 'Invite code and user ID are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const conn = await getConnection();
    
    // Find group by invite code
    const [groups] = await conn.execute(
      'SELECT * FROM groups WHERE invite_code = ?',
      [inviteCode]
    ) as any;

    if (groups.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid invite code' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const group = groups[0];

    // Check if user is already a member
    const [existingMembers] = await conn.execute(
      'SELECT id FROM group_members WHERE group_id = ? AND user_id = ?',
      [group.id, userId]
    ) as any;

    if (existingMembers.length > 0) {
      return new Response(
        JSON.stringify({ error: 'User is already a member of this group' }),
        { status: 409, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Add user to group
    await conn.execute(
      'INSERT INTO group_members (group_id, user_id) VALUES (?, ?)',
      [group.id, userId]
    );

    return new Response(
      JSON.stringify({ group, message: 'Successfully joined group' }),
      { 
        status: 200, 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        } 
      }
    );
  } catch (error) {
    console.error('Group join error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}