import { getConnection } from '@/lib/database';
import type { Group } from '@/types/database';

function generateInviteCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export async function POST(request: Request) {
  try {
    const { name, userId } = await request.json();

    if (!name || !userId) {
      return new Response(
        JSON.stringify({ error: 'Group name and user ID are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const conn = await getConnection();
    let inviteCode = generateInviteCode();
    
    // Ensure invite code is unique
    let codeExists = true;
    while (codeExists) {
      const [existing] = await conn.execute(
        'SELECT id FROM groups WHERE invite_code = ?',
        [inviteCode]
      ) as any;
      
      if (existing.length === 0) {
        codeExists = false;
      } else {
        inviteCode = generateInviteCode();
      }
    }

    // Create group
    const [result] = await conn.execute(
      'INSERT INTO groups (name, invite_code, created_by) VALUES (?, ?, ?)',
      [name, inviteCode, userId]
    ) as any;

    const groupId = result.insertId;

    // Add creator as admin member
    await conn.execute(
      'INSERT INTO group_members (group_id, user_id, is_admin) VALUES (?, ?, TRUE)',
      [groupId, userId]
    );

    // Initialize streak for the group
    await conn.execute(
      'INSERT INTO streaks (group_id) VALUES (?)',
      [groupId]
    );

    // Get the created group
    const [groups] = await conn.execute(
      'SELECT * FROM groups WHERE id = ?',
      [groupId]
    ) as any;

    const group = groups[0] as Group;

    return new Response(
      JSON.stringify({ group }),
      { 
        status: 201, 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        } 
      }
    );
  } catch (error) {
    console.error('Group creation error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}