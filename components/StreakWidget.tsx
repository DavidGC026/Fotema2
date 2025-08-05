import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Flame, Users, Calendar } from 'lucide-react-native';
import NotificationService from '@/lib/notifications';

interface StreakWidgetProps {
  groupId: string;
  groupName: string;
  currentStreak: number;
  membersContributed: number;
  totalMembers: number;
  onPress?: () => void;
}

export default function StreakWidget({
  groupId,
  groupName,
  currentStreak,
  membersContributed,
  totalMembers,
  onPress,
}: StreakWidgetProps) {
  const [pulseAnimation] = useState(new Animated.Value(1));
  const [showCelebration, setShowCelebration] = useState(false);

  const progress = totalMembers > 0 ? membersContributed / totalMembers : 0;
  const isComplete = membersContributed === totalMembers;

  useEffect(() => {
    if (isComplete && !showCelebration) {
      setShowCelebration(true);
      
      // Send streak notification
      try {
        const notificationService = NotificationService.getInstance();
        notificationService.addNotification({
          groupId,
          groupName,
          senderName: 'Sistema',
          type: 'streak',
        });
      } catch (error) {
        console.error('Error sending streak notification:', error);
      }

      // Celebration animation
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 1.2,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Reset celebration flag after animation
      setTimeout(() => setShowCelebration(false), 2000);
    }
  }, [isComplete, showCelebration]);

  const getStreakColor = () => {
    if (currentStreak >= 30) return '#F59E0B'; // Gold
    if (currentStreak >= 14) return '#8B5CF6'; // Purple
    if (currentStreak >= 7) return '#06B6D4';  // Cyan
    if (currentStreak >= 3) return '#10B981';  // Green
    return '#FF6B35'; // Orange
  };

  const getStreakEmoji = () => {
    if (currentStreak >= 30) return '👑';
    if (currentStreak >= 14) return '🏆';
    if (currentStreak >= 7) return '⭐';
    if (currentStreak >= 3) return '🚀';
    return '🔥';
  };

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <LinearGradient
        colors={[
          `${getStreakColor()}20`,
          `${getStreakColor()}10`,
        ]}
        style={styles.gradient}
      >
        <Animated.View 
          style={[
            styles.content,
            { transform: [{ scale: pulseAnimation }] }
          ]}
        >
          <View style={styles.header}>
            <View style={styles.streakInfo}>
              <Text style={styles.streakEmoji}>{getStreakEmoji()}</Text>
              <Text style={[styles.streakNumber, { color: getStreakColor() }]}>
                {currentStreak}
              </Text>
            </View>
            <Text style={styles.streakLabel}>días</Text>
          </View>

          <View style={styles.progressSection}>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill,
                  { 
                    width: `${progress * 100}%`,
                    backgroundColor: getStreakColor(),
                  }
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {membersContributed}/{totalMembers} contribuyeron hoy
            </Text>
          </View>

          {isComplete && (
            <View style={styles.completeBadge}>
              <Text style={styles.completeText}>¡Racha mantenida! 🎉</Text>
            </View>
          )}

          {showCelebration && (
            <View style={styles.celebration}>
              <Text style={styles.celebrationText}>🎊 ¡INCREÍBLE! 🎊</Text>
            </View>
          )}
        </Animated.View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
    borderRadius: 16,
    overflow: 'hidden',
  },
  gradient: {
    padding: 16,
  },
  content: {
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  streakInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  streakEmoji: {
    fontSize: 24,
    marginRight: 8,
  },
  streakNumber: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  streakLabel: {
    fontSize: 16,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  progressSection: {
    width: '100%',
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: 'rgba(156, 163, 175, 0.3)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  completeBadge: {
    marginTop: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  completeText: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '600',
  },
  celebration: {
    position: 'absolute',
    top: -10,
    alignItems: 'center',
  },
  celebrationText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F59E0B',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});