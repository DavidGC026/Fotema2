# Aplicación de Compartir Fotos y Rachas

Una aplicación móvil desarrollada en React Native con Expo Router que permite a grupos de amigos compartir fotos y mensajes mientras mantienen rachas diarias.

## Características

- 📱 **Chat Grupal**: Envía mensajes de texto y fotos en tiempo real
- 📸 **Cámara Integrada**: Toma fotos directamente desde la app
- 👥 **Sistema de Grupos**: Crea grupos e invita amigos con códigos únicos
- 🔥 **Rachas Diarias**: Mantén rachas cuando todos los miembros participan
- 📊 **Estadísticas**: Visualiza el progreso y logros del grupo
- 🎨 **Diseño Moderno**: Interfaz atractiva con gradientes y animaciones

## Configuración de Base de Datos

### Requisitos
- Servidor MySQL remoto
- Node.js 18+
- Expo CLI

### Variables de Entorno

Crea un archivo `.env` basado en `.env.example`:

```env
EXPO_PUBLIC_DB_HOST=tu-servidor-mysql.com
EXPO_PUBLIC_DB_USER=tu-usuario
EXPO_PUBLIC_DB_PASSWORD=tu-contraseña
EXPO_PUBLIC_DB_NAME=streak_app
EXPO_PUBLIC_DB_PORT=3306
EXPO_PUBLIC_DB_SSL=true
EXPO_PUBLIC_API_URL=http://localhost:8081
```

### Estructura de Base de Datos

La aplicación creará automáticamente las siguientes tablas:

- **users**: Información de usuarios
- **groups**: Grupos de chat
- **group_members**: Relación usuarios-grupos
- **messages**: Mensajes y fotos
- **streaks**: Información de rachas
- **daily_contributions**: Contribuciones diarias

### Inicialización

1. Configura tus variables de entorno
2. Ejecuta la app: `npm run dev`
3. Llama al endpoint `/api/init` para crear las tablas

## API Endpoints

### Autenticación
- `POST /api/auth/register` - Registrar usuario

### Grupos
- `POST /api/groups/create` - Crear grupo
- `POST /api/groups/join` - Unirse a grupo

### Mensajes
- `POST /api/messages/send` - Enviar mensaje/foto
- `GET /api/messages/[groupId]` - Obtener mensajes

### Rachas
- `GET /api/streaks/[groupId]` - Obtener información de racha

## Funcionalidades Principales

### Sistema de Rachas
- Las rachas se mantienen cuando **todos** los miembros del grupo contribuyen en un día
- Se reinicia si algún miembro no participa
- Registra la mejor racha histórica del grupo

### Subida de Imágenes
- Las imágenes se guardan en el servidor como archivos base64
- Se generan URLs únicas para cada imagen
- Optimización automática de tamaño

### Invitaciones
- Códigos únicos de 6 caracteres
- Verificación automática de duplicados
- Unión instantánea a grupos

## Tecnologías Utilizadas

- **React Native** con Expo Router
- **MySQL** para base de datos
- **TypeScript** para tipado estático
- **Lucide React Native** para iconos
- **Expo Camera** para funcionalidad de cámara
- **Linear Gradient** para efectos visuales

## Instalación y Desarrollo

```bash
# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales

# Ejecutar en desarrollo
npm run dev

# Construir para producción
npm run build:web
```

## Estructura del Proyecto

```
├── app/
│   ├── (tabs)/          # Pantallas principales
│   ├── api/             # API routes
│   └── _layout.tsx      # Layout principal
├── lib/
│   ├── database.ts      # Conexión MySQL
│   └── imageUpload.ts   # Manejo de imágenes
├── services/
│   └── api.ts           # Cliente API
├── types/
│   └── database.ts      # Tipos TypeScript
└── README.md
```

## Contribución

1. Fork el proyecto
2. Crea una rama para tu feature
3. Commit tus cambios
4. Push a la rama
5. Abre un Pull Request

## Licencia

MIT License - ver archivo LICENSE para detalles.