import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Animated,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Bell, 
  X, 
  Camera, 
  MessageCircle, 
  Flame,
  Check,
  Trash2
} from 'lucide-react-native';
import NotificationService, { NotificationData } from '@/lib/notifications';

interface NotificationWidgetProps {
  onNotificationPress?: (groupId: string) => void;
}

export default function NotificationWidget({ onNotificationPress }: NotificationWidgetProps) {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const bellAnimation = new Animated.Value(0);

  useEffect(() => {
    const notificationService = NotificationService.getInstance();
    
    // Initialize notifications only if not on web or if service is available
    try {
      setNotifications(notificationService.getNotifications());
      setUnreadCount(notificationService.getUnreadCount());

      // Subscribe to updates
      const unsubscribe = notificationService.subscribe((newNotifications) => {
        setNotifications(newNotifications);
        const newUnreadCount = notificationService.getUnreadCount();
        
        // Animate bell if new notifications
        if (newUnreadCount > unreadCount) {
          Animated.sequence([
            Animated.timing(bellAnimation, {
              toValue: 1,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(bellAnimation, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }),
          ]).start();
        }
        
        setUnreadCount(newUnreadCount);
      });

      return unsubscribe;
    } catch (error) {
      console.error('Error initializing notifications:', error);
    }
  }, [unreadCount]);

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'Ahora';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    return `${days}d`;
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'photo':
        return <Camera size={20} color="#8B5CF6" />;
      case 'message':
        return <MessageCircle size={20} color="#06B6D4" />;
      case 'streak':
        return <Flame size={20} color="#FF6B35" />;
      default:
        return <Bell size={20} color="#9CA3AF" />;
    }
  };

  const handleNotificationPress = async (notification: NotificationData) => {
    const notificationService = NotificationService.getInstance();
    await notificationService.markAsRead(notification.id);
    
    if (onNotificationPress) {
      onNotificationPress(notification.groupId);
    }
    
    setShowModal(false);
  };

  const markAllAsRead = async () => {
    const notificationService = NotificationService.getInstance();
    await notificationService.markAllAsRead();
  };

  const clearAll = async () => {
    const notificationService = NotificationService.getInstance();
    await notificationService.clearNotifications();
  };

  const bellRotation = bellAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '15deg'],
  });

  return (
    <>
      <TouchableOpacity
        style={styles.bellButton}
        onPress={() => setShowModal(true)}
      >
        <Animated.View style={{ transform: [{ rotate: bellRotation }] }}>
          <Bell size={24} color="white" />
        </Animated.View>
        {unreadCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      <Modal
        visible={showModal}
        animationType="slide"
        transparent
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Notificaciones</Text>
              <View style={styles.headerButtons}>
                {unreadCount > 0 && (
                  <TouchableOpacity
                    style={styles.headerButton}
                    onPress={markAllAsRead}
                  >
                    <Check size={20} color="#10B981" />
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={styles.headerButton}
                  onPress={clearAll}
                >
                  <Trash2 size={20} color="#EF4444" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.headerButton}
                  onPress={() => setShowModal(false)}
                >
                  <X size={20} color="white" />
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView style={styles.notificationsList}>
              {notifications.length === 0 ? (
                <View style={styles.emptyState}>
                  <Bell size={48} color="#6B7280" />
                  <Text style={styles.emptyText}>No hay notificaciones</Text>
                </View>
              ) : (
                notifications.map((notification) => (
                  <TouchableOpacity
                    key={notification.id}
                    style={[
                      styles.notificationItem,
                      !notification.read && styles.unreadNotification,
                    ]}
                    onPress={() => handleNotificationPress(notification)}
                  >
                    <View style={styles.notificationIcon}>
                      {getNotificationIcon(notification.type)}
                    </View>
                    
                    <View style={styles.notificationContent}>
                      <View style={styles.notificationHeader}>
                        <Text style={styles.groupName}>
                          {notification.groupName}
                        </Text>
                        <Text style={styles.timestamp}>
                          {formatTime(notification.timestamp)}
                        </Text>
                      </View>
                      
                      <Text style={styles.notificationText}>
                        {notification.type === 'photo' && 
                          `${notification.senderName} compartió una foto`
                        }
                        {notification.type === 'message' && 
                          `${notification.senderName}: ${notification.content}`
                        }
                        {notification.type === 'streak' && 
                          `¡Racha mantenida por ${notification.senderName}!`
                        }
                      </Text>
                    </View>

                    {!notification.read && (
                      <View style={styles.unreadDot} />
                    )}
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  bellButton: {
    position: 'relative',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1F2937',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    minHeight: '50%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(55, 65, 81, 0.5)',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  headerButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(55, 65, 81, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationsList: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    color: '#6B7280',
    fontSize: 16,
    marginTop: 16,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(55, 65, 81, 0.3)',
  },
  unreadNotification: {
    backgroundColor: 'rgba(139, 92, 246, 0.05)',
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(55, 65, 81, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  groupName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8B5CF6',
  },
  timestamp: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  notificationText: {
    fontSize: 14,
    color: 'white',
    lineHeight: 20,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#8B5CF6',
    marginLeft: 8,
    marginTop: 6,
  },
});