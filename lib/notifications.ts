import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

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
    // Request permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return;
    }

    // Get push token
    if (Platform.OS !== 'web') {
      const token = (await Notifications.getExpoPushTokenAsync()).data;
      console.log('Push token:', token);
      // Here you would typically send this token to your backend
    }

    // Load stored notifications
    await this.loadNotifications();

    // Set up notification listeners
    this.setupNotificationListeners();
  }

  private setupNotificationListeners() {
    // Handle notifications when app is in foreground
    Notifications.addNotificationReceivedListener((notification) => {
      console.log('Notification received:', notification);
    });

    // Handle notification taps
    Notifications.addNotificationResponseReceivedListener((response) => {
      console.log('Notification tapped:', response);
      const data = response.notification.request.content.data;
      // Navigate to specific group or screen based on notification data
    });
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

    // Send local notification
    await this.sendLocalNotification(newNotification);
  }

  private async sendLocalNotification(notification: NotificationData) {
    let title = '';
    let body = '';

    switch (notification.type) {
      case 'photo':
        title = `📸 ${notification.groupName}`;
        body = `${notification.senderName} compartió una foto`;
        break;
      case 'message':
        title = `💬 ${notification.groupName}`;
        body = `${notification.senderName}: ${notification.content?.substring(0, 50)}${notification.content && notification.content.length > 50 ? '...' : ''}`;
        break;
      case 'streak':
        title = `🔥 ¡Racha mantenida!`;
        body = `${notification.groupName} mantiene la racha`;
        break;
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: {
          groupId: notification.groupId,
          type: notification.type,
        },
      },
      trigger: null, // Show immediately
    });
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
      await AsyncStorage.setItem('notifications', JSON.stringify(this.notifications));
    } catch (error) {
      console.error('Error saving notifications:', error);
    }
  }

  private async loadNotifications() {
    try {
      const stored = await AsyncStorage.getItem('notifications');
      if (stored) {
        this.notifications = JSON.parse(stored).map((n: any) => ({
          ...n,
          timestamp: new Date(n.timestamp),
        }));
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  }
}

export default NotificationService;