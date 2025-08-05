import { initializeDatabase } from '@/lib/database';

export async function POST(request: Request) {
  try {
    await initializeDatabase();
    
    return new Response(
      JSON.stringify({ message: 'Database initialized successfully' }),
      { 
        status: 200, 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        } 
      }
    );
  } catch (error) {
    console.error('Database initialization error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to initialize database' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}