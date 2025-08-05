const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8081';

export class ApiService {
  private static async request(endpoint: string, options: RequestInit = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const error = await response.json().catch(() => ({ error: 'Request failed' }));
          throw new Error(error.error || 'Request failed');
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        try {
          return await response.json();
        } catch (jsonError) {
          const text = await response.text().catch(() => 'Unable to read response');
          throw new Error(`Server returned invalid JSON. Response: ${text.substring(0, 200)}...`);
        }
      } else {
        throw new Error('Server returned non-JSON response');
      }
    } catch (error) {
      if (error instanceof TypeError && error.message === 'Network request failed') {
        throw new Error('No se pudo conectar al servidor. Verifica que el servidor esté ejecutándose.');
      }
      if (error instanceof Error && error.message.includes('fetch')) {
        throw new Error('Error de red. Verifica tu conexión a internet.');
      }
      throw error;
    }
  }

  // Auth
  static async registerUser(username: string, email: string) {
    return this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email }),
    });
  }

  // Groups
  static async createGroup(name: string, userId: number) {
    return this.request('/api/groups/create', {
      method: 'POST',
      body: JSON.stringify({ name, userId }),
    });
  }

  static async joinGroup(inviteCode: string, userId: number) {
    return this.request('/api/groups/join', {
      method: 'POST',
      body: JSON.stringify({ inviteCode, userId }),
    });
  }

  static async getUserGroups(userId: number) {
    return this.request(`/api/groups/list?userId=${userId}`);
  }

  // Messages
  static async sendMessage(
    groupId: number, 
    userId: number, 
    content?: string, 
    imageData?: string, 
    messageType: 'text' | 'image' = 'text',
    imageFilename?: string
  ) {
    return this.request('/api/messages/send', {
      method: 'POST',
      body: JSON.stringify({ 
        groupId, 
        userId, 
        content, 
        imageData, 
        messageType,
        imageFilename 
      }),
    });
  }

  static async getMessages(groupId: number) {
    return this.request(`/api/messages/${groupId}`);
  }

  // Streaks
  static async getStreak(groupId: number) {
    return this.request(`/api/streaks/${groupId}`);
  }

  // Wall
  static async getWallPhotos(groupId: number) {
    return this.request(`/api/wall/${groupId}`);
  }

  static async likeWallPhoto(wallPhotoId: number, userId: number) {
    return this.request('/api/wall/like', {
      method: 'POST',
      body: JSON.stringify({ wallPhotoId, userId }),
    });
  }

  // Initialize database
  static async initializeDatabase() {
    return this.request('/api/init', {
      method: 'POST',
    });
  }

  // Test database connection
  static async testDatabaseConnection() {
    return this.request('/api/test-connection', {
      method: 'GET',
    });
  }
}
