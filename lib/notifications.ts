import { Platform } from 'react-native';

export interface NotificationData {
  id: string;
  groupId: string;
  groupName: string;
  senderName: string;
  type: 'photo' | 'message' | 'streak';
  content?: string;
  timestamp: Date;
  read: boolean;
}

class NotificationService {
  private static instance: NotificationService;
  private notifications: NotificationData[] = [];
  private listeners: ((notifications: NotificationData[]) => void)[] = [];

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  async initialize() {
    console.log('Notification service initialized (mock mode)');
    // Load stored notifications
    await this.loadNotifications();
  }

  async addNotification(notification: Omit<NotificationData, 'id' | 'timestamp' | 'read'>) {
    const newNotification: NotificationData = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date(),
      read: false,
    };

    this.notifications.unshift(newNotification);
    await this.saveNotifications();
    this.notifyListeners();

    // Log notification instead of sending push notification
    console.log('New notification:', newNotification);
  }

  getNotifications(): NotificationData[] {
    return this.notifications;
  }

  getUnreadCount(): number {
    return this.notifications.filter(n => !n.read).length;
  }

  async markAsRead(notificationId: string) {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
      await this.saveNotifications();
      this.notifyListeners();
    }
  }

  async markAllAsRead() {
    this.notifications.forEach(n => n.read = true);
    await this.saveNotifications();
    this.notifyListeners();
  }

  async clearNotifications() {
    this.notifications = [];
    await this.saveNotifications();
    this.notifyListeners();
  }

  subscribe(listener: (notifications: NotificationData[]) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.notifications));
  }

  private async saveNotifications() {
    try {
      // For web compatibility, use localStorage
      if (Platform.OS === 'web') {
        localStorage.setItem('notifications', JSON.stringify(this.notifications));
      } else {
        // Use AsyncStorage for mobile
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        await AsyncStorage.setItem('notifications', JSON.stringify(this.notifications));
      }
    } catch (error) {
      console.error('Error saving notifications:', error);
    }
  }

  private async loadNotifications() {
    try {
      let stored = null;
      if (Platform.OS === 'web') {
        stored = localStorage.getItem('notifications');
      } else {
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        stored = await AsyncStorage.getItem('notifications');
      }
      
      if (stored) {
        try {
          this.notifications = JSON.parse(stored).map((n: any) => ({
            ...n,
            timestamp: new Date(n.timestamp),
          }));
        } catch (parseError) {
          console.error('Error parsing stored notifications:', parseError);
          this.notifications = [];
        }
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  }
}

export default NotificationService;