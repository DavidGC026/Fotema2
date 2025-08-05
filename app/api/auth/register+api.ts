import { getConnection } from '@/lib/database';
import type { User } from '@/types/database';

export async function POST(request: Request) {
  try {
    const { username, email } = await request.json();

    if (!username || !email) {
      return new Response(
        JSON.stringify({ error: 'Username and email are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const conn = await getConnection();
    
    // Check if user already exists
    const [existingUsers] = await conn.execute(
      'SELECT id FROM users WHERE username = ? OR email = ?',
      [username, email]
    );

    if (Array.isArray(existingUsers) && existingUsers.length > 0) {
      return new Response(
        JSON.stringify({ error: 'User already exists' }),
        { status: 409, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Create new user
    const [result] = await conn.execute(
      'INSERT INTO users (username, email) VALUES (?, ?)',
      [username, email]
    ) as any;

    const userId = result.insertId;

    // Get the created user
    const [users] = await conn.execute(
      'SELECT * FROM users WHERE id = ?',
      [userId]
    ) as any;

    const user = users[0] as User;

    return new Response(
      JSON.stringify({ user }),
      { 
        status: 201, 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        } 
      }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}