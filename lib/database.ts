let mysql: any = null;

// Dynamically import mysql2 only on server side
async function getMysql() {
  if (!mysql) {
    try {
      mysql = await import('mysql2/promise');
    } catch (error) {
      console.error('Failed to import mysql2:', error);
      throw new Error('Database module not available in this environment');
    }
  }
  return mysql;
}

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

let connection: any = null;

export async function getConnection() {
  if (!connection) {
    try {
      const mysql = await getMysql();
      connection = await mysql.createConnection(dbConfig);
      console.log('✅ Conectado exitosamente a la base de datos MySQL');
      console.log(`📍 Host: ${dbConfig.host}`);
      console.log(`🗄️ Base de datos: ${dbConfig.database}`);
    } catch (error: any) {
      console.error('❌ Error al conectar con la base de datos:');
      console.error('Código de error:', error.code);
      console.error('Mensaje:', error.message);
      if (error.sqlMessage) {
        console.error('SQL Error:', error.sqlMessage);
      }
      console.error('Stack:', error.stack);
      throw error;
    }
  }
  return connection;
}

export async function closeConnection() {
  if (connection) {
    await connection.end();
    connection = null;
  }
}

// Initialize database tables
export async function initializeDatabase() {
  const conn = await getConnection();
  
  try {
    console.log('🔧 Inicializando tablas de la base de datos...');
    
    // Users table
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        avatar_url TEXT,
        push_token VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Groups table
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS \`groups\` (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        invite_code VARCHAR(10) UNIQUE NOT NULL,
        created_by INT NOT NULL,
        avatar_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Group members table
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS group_members (
        id INT AUTO_INCREMENT PRIMARY KEY,
        group_id INT NOT NULL,
        user_id INT NOT NULL,
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_admin BOOLEAN DEFAULT FALSE,
        UNIQUE KEY unique_member (group_id, user_id),
        FOREIGN KEY (group_id) REFERENCES \`groups\`(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Messages table - Enhanced for better image handling
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        group_id INT NOT NULL,
        user_id INT NOT NULL,
        content TEXT,
        image_url TEXT,
        image_filename VARCHAR(255),
        image_size INT,
        message_type ENUM('text', 'image') NOT NULL,
        reply_to_message_id INT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (group_id) REFERENCES \`groups\`(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (reply_to_message_id) REFERENCES messages(id) ON DELETE SET NULL,
        INDEX idx_group_created (group_id, created_at),
        INDEX idx_message_type (message_type),
        INDEX idx_image_messages (group_id, message_type, created_at)
      )
    `);

    // Wall photos table - For the photo collage feature
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS wall_photos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        group_id INT NOT NULL,
        message_id INT NOT NULL,
        user_id INT NOT NULL,
        image_url TEXT NOT NULL,
        image_filename VARCHAR(255),
        caption TEXT,
        likes_count INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_wall_photo (group_id, message_id),
        FOREIGN KEY (group_id) REFERENCES \`groups\`(id) ON DELETE CASCADE,
        FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_group_created (group_id, created_at DESC)
      )
    `);

    // Wall photo likes table
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS wall_photo_likes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        wall_photo_id INT NOT NULL,
        user_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_like (wall_photo_id, user_id),
        FOREIGN KEY (wall_photo_id) REFERENCES wall_photos(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Streaks table
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS streaks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        group_id INT UNIQUE NOT NULL,
        current_streak INT DEFAULT 0,
        best_streak INT DEFAULT 0,
        last_activity_date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (group_id) REFERENCES \`groups\`(id) ON DELETE CASCADE
      )
    `);

    // Daily contributions table
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS daily_contributions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        group_id INT NOT NULL,
        user_id INT NOT NULL,
        contribution_date DATE NOT NULL,
        contribution_type ENUM('message', 'photo') DEFAULT 'message',
        message_id INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_daily_contribution (group_id, user_id, contribution_date),
        FOREIGN KEY (group_id) REFERENCES \`groups\`(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE SET NULL,
        INDEX idx_contribution_date (contribution_date),
        INDEX idx_group_date (group_id, contribution_date)
      )
    `);

    // Notifications table for persistence
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        group_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        body TEXT NOT NULL,
        data JSON,
        read_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (group_id) REFERENCES \`groups\`(id) ON DELETE CASCADE,
        INDEX idx_user_unread (user_id, read_at),
        INDEX idx_created (created_at DESC)
      )
    `);

    // User sessions table for authentication
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS user_sessions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        session_token VARCHAR(255) UNIQUE NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_token (session_token),
        INDEX idx_expires (expires_at)
      )
    `);

    console.log('✅ Tablas de la base de datos inicializadas correctamente');
    
    // Test the connection with a simple query
    const [result] = await conn.execute('SELECT 1 as test') as any;
    if (result && result.length > 0) {
      console.log('🔍 Prueba de conexión exitosa');
    }
    
  } catch (error) {
    console.error('❌ Error al inicializar la base de datos:', error);
    throw error;
  }
}

// Test database connection with detailed logging
export async function testDatabaseConnection() {
  console.log('🔍 Iniciando prueba de conexión a la base de datos...');
  console.log('🔧 Configuración actual:');
  console.log(`  - Host: ${dbConfig.host}`);
  console.log(`  - Usuario: ${dbConfig.user}`);
  console.log(`  - Base de datos: ${dbConfig.database}`);
  console.log(`  - Puerto: ${dbConfig.port}`);
  console.log(`  - SSL: ${dbConfig.ssl ? 'Habilitado' : 'Deshabilitado'}`);
  
  let testConnection = null;
  
  try {
    const mysql = await getMysql();
    // Create a new connection for testing
    testConnection = await mysql.createConnection(dbConfig);
    console.log('✅ Conexión establecida exitosamente');
    
    // Test basic query
    const [result] = await testConnection.execute('SELECT 1 as test, NOW() as timestamp, VERSION() as version') as any;
    console.log('🔍 Consulta de prueba exitosa:', result[0]);
    
    // Test database access
    const [tables] = await testConnection.execute('SHOW TABLES') as any;
    console.log(`📋 Tablas encontradas: ${tables.length}`);
    
    // Test specific table
    const [userCount] = await testConnection.execute('SELECT COUNT(*) as count FROM users') as any;
    console.log(`👥 Registros en tabla users: ${userCount[0].count}`);
    
    return {
      success: true,
      message: 'Conexión exitosa',
      details: {
        host: dbConfig.host,
        database: dbConfig.database,
        version: result[0].version,
        tablesCount: tables.length,
        usersCount: userCount[0].count,
        timestamp: result[0].timestamp
      }
    };
    
  } catch (error: any) {
    console.error('❌ Error en la prueba de conexión:');
    
    const errorDetails = {
      code: error.code,
      message: error.message,
      sqlMessage: error.sqlMessage,
      stack: error.stack,
    };

    console.error('Código:', errorDetails.code);
    console.error('Mensaje:', errorDetails.message);
    if (errorDetails.sqlMessage) {
      console.error('SQL Error:', errorDetails.sqlMessage);
    }
    
    return {
      success: false,
      message: 'Error de conexión',
      error: errorDetails
    };
    
  } finally {
    if (testConnection) {
      try {
        await testConnection.end();
        console.log('🔒 Conexión de prueba cerrada');
      } catch (closeError) {
        console.error('Error cerrando conexión de prueba:', closeError);
      }
    }
  }
}
