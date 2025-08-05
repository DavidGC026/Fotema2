const mysql = require('mysql2/promise');

const dbConfig = {
  host: process.env.EXPO_PUBLIC_DB_HOST || 'srv449.hstgr.io',
  user: process.env.EXPO_PUBLIC_DB_USER || 'u437141408_fotema',
  password: process.env.EXPO_PUBLIC_DB_PASSWORD || '@Aguila01126',
  database: process.env.EXPO_PUBLIC_DB_NAME || 'u437141408_fotema',
  port: parseInt(process.env.EXPO_PUBLIC_DB_PORT || '3306'),
  ssl: process.env.EXPO_PUBLIC_DB_SSL === 'true' ? {
    rejectUnauthorized: false
  } : false,
  connectTimeout: 60000,
};

async function testConnection() {
  console.log('🔍 Iniciando diagnóstico de conexión a la base de datos...\n');
  
  // Mostrar configuración
  console.log('🔧 Configuración actual:');
  console.log(`  - Host: ${dbConfig.host}`);
  console.log(`  - Usuario: ${dbConfig.user}`);
  console.log(`  - Base de datos: ${dbConfig.database}`);
  console.log(`  - Puerto: ${dbConfig.port}`);
  console.log(`  - SSL: ${dbConfig.ssl ? 'Habilitado' : 'Deshabilitado'}`);
  console.log(`  - Timeout: ${dbConfig.connectTimeout}ms\n`);
  
  let connection = null;
  
  try {
    console.log('🔌 Intentando conectar...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conexión establecida exitosamente\n');
    
    // Test básico
    console.log('🧪 Ejecutando pruebas...');
    const [basicResult] = await connection.execute('SELECT 1 as test, NOW() as timestamp, VERSION() as version');
    console.log('✅ Consulta básica exitosa');
    console.log(`   - Versión MySQL: ${basicResult[0].version}`);
    console.log(`   - Timestamp: ${basicResult[0].timestamp}\n`);
    
    // Verificar base de datos
    const [dbResult] = await connection.execute('SELECT DATABASE() as current_db');
    console.log(`✅ Base de datos actual: ${dbResult[0].current_db}\n`);
    
    // Listar tablas
    const [tables] = await connection.execute('SHOW TABLES');
    console.log(`📋 Tablas encontradas: ${tables.length}`);
    if (tables.length > 0) {
      console.log('   Tablas:');
      tables.forEach((table, index) => {
        const tableName = Object.values(table)[0];
        console.log(`   ${index + 1}. ${tableName}`);
      });
    }
    console.log();
    
    // Test de tabla users
    try {
      const [userCount] = await connection.execute('SELECT COUNT(*) as count FROM users');
      console.log(`👥 Registros en tabla users: ${userCount[0].count}`);
    } catch (tableError) {
      console.log('⚠️ No se pudo acceder a la tabla users (puede no existir aún)');
    }
    
    console.log('\n🎉 Diagnóstico completado exitosamente');
    
  } catch (error) {
    console.error('\n❌ ERROR DE CONEXIÓN DETECTADO:\n');
    
    // Información del error
    if (error.code) {
      console.error(`🔴 Código de error: ${error.code}`);
    }
    
    if (error.message) {
      console.error(`📝 Mensaje: ${error.message}`);
    }
    
    if (error.sqlMessage) {
      console.error(`🗄️ SQL Error: ${error.sqlMessage}`);
    }
    
    // Diagnóstico específico por tipo de error
    console.error('\n🔍 DIAGNÓSTICO DEL ERROR:');
    
    switch (error.code) {
      case 'ENOTFOUND':
        console.error('   → El host de la base de datos no se pudo resolver');
        console.error('   → Verifica que el host sea correcto y esté accesible');
        break;
        
      case 'ECONNREFUSED':
        console.error('   → La conexión fue rechazada');
        console.error('   → Verifica que el puerto sea correcto y el servidor esté ejecutándose');
        break;
        
      case 'ER_ACCESS_DENIED_ERROR':
        console.error('   → Acceso denegado');
        console.error('   → Verifica el usuario y contraseña');
        break;
        
      case 'ER_BAD_DB_ERROR':
        console.error('   → Base de datos no encontrada');
        console.error('   → Verifica que el nombre de la base de datos sea correcto');
        break;
        
      case 'ETIMEDOUT':
        console.error('   → Timeout de conexión');
        console.error('   → El servidor puede estar sobrecargado o la red es lenta');
        break;
        
      case 'ECONNRESET':
        console.error('   → Conexión reiniciada por el servidor');
        console.error('   → Puede ser un problema de configuración SSL o firewall');
        break;
        
      default:
        console.error('   → Error no reconocido, revisa los logs para más detalles');
    }
    
    console.error('\n💡 POSIBLES SOLUCIONES:');
    console.error('   1. Verifica las credenciales de la base de datos');
    console.error('   2. Confirma que el servidor MySQL esté ejecutándose');
    console.error('   3. Revisa la configuración de firewall');
    console.error('   4. Verifica la configuración SSL si es necesaria');
    console.error('   5. Confirma que la base de datos existe');
    
    if (error.stack) {
      console.error('\n📚 Stack trace completo:');
      console.error(error.stack);
    }
    
  } finally {
    if (connection) {
      try {
        await connection.end();
        console.log('\n🔒 Conexión cerrada correctamente');
      } catch (closeError) {
        console.error('⚠️ Error al cerrar la conexión:', closeError.message);
      }
    }
  }
}

// Ejecutar el test
testConnection().catch(console.error);
