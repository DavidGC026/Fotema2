const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8081';

export class ApiService {
  private static async request(endpoint: string, options: RequestInit = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(error.error || 'Request failed');
    }

    return response.json();
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

  // Messages
  static async sendMessage(groupId: number, userId: number, content?: string, imageData?: string, messageType: 'text' | 'image' = 'text') {
    return this.request('/api/messages/send', {
      method: 'POST',
      body: JSON.stringify({ groupId, userId, content, imageData, messageType }),
    });
  }

  static async getMessages(groupId: number) {
    return this.request(`/api/messages/${groupId}`);
  }

  // Streaks
  static async getStreak(groupId: number) {
    return this.request(`/api/streaks/${groupId}`);
  }

  // Initialize database
  static async initializeDatabase() {
    return this.request('/api/init', {
      method: 'POST',
    });
  }
}