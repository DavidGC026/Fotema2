import { testDatabaseConnection } from '@/lib/database';

export async function GET(request: Request) {
  try {
    console.log('🧪 Iniciando test de conexión desde API...');
    const result = await testDatabaseConnection();
    
    return new Response(
      JSON.stringify({
        success: result.success,
        message: result.message,
        details: result.details || null,
        error: result.error || null,
        timestamp: new Date().toISOString()
      }),
      { 
        status: result.success ? 200 : 500,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        } 
      }
    );
  } catch (error) {
    console.error('❌ Error en test de conexión API:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido',
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        } 
      }
    );
  }
}

export async function POST(request: Request) {
  return GET(request);
}
