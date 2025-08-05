import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Flame, 
  Trophy, 
  Calendar, 
  Users,
  TrendingUp,
  Target,
  Award,
  Star
} from 'lucide-react-native';
import StreakWidget from '@/components/StreakWidget';
import NotificationWidget from '@/components/NotificationWidget';

interface StreakData {
  groupName: string;
  currentStreak: number;
  bestStreak: number;
  totalDays: number;
  participants: string[];
  todayContributed: boolean;
}

export default function StreaksScreen() {
  const [streaks] = useState<StreakData[]>([
    {
      groupName: 'Grupo Aventureros',
      currentStreak: 7,
      bestStreak: 12,
      totalDays: 45,
      participants: ['Ana', 'Carlos', 'María', 'Tú'],
      todayContributed: true,
    },
    {
      groupName: 'Familia López',
      currentStreak: 15,
      bestStreak: 21,
      totalDays: 89,
      participants: ['Mamá', 'Papá', 'Luis', 'Tú'],
      todayContributed: false,
    },
  ]);

  const totalStreaks = streaks.reduce((sum, streak) => sum + streak.currentStreak, 0);
  const longestStreak = Math.max(...streaks.map(s => s.bestStreak));

  const getStreakLevel = (streak: number) => {
    if (streak >= 30) return { level: 'Legendario', color: '#F59E0B', icon: '👑' };
    if (streak >= 20) return { level: 'Maestro', color: '#8B5CF6', icon: '🏆' };
    if (streak >= 10) return { level: 'Experto', color: '#06B6D4', icon: '⭐' };
    if (streak >= 5) return { level: 'Avanzado', color: '#10B981', icon: '🚀' };
    return { level: 'Principiante', color: '#6B7280', icon: '🌱' };
  };

  return (
    <LinearGradient
      colors={['#1F2937', '#111827']}
      style={styles.container}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Rachas</Text>
        <View style={styles.headerRight}>
          <NotificationWidget />
          <View style={styles.headerStats}>
            <View style={styles.statItem}>
              <Flame size={16} color="#FF6B35" />
              <Text style={styles.statNumber}>{totalStreaks}</Text>
            </View>
          </View>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Widgets de Rachas Activas */}
        <View style={styles.activeStreaks}>
          <Text style={styles.sectionTitle}>Rachas Activas</Text>
          {streaks.map((streak, index) => (
            <StreakWidget
              key={index}
              groupId={streak.groupName}
              groupName={streak.groupName}
              currentStreak={streak.currentStreak}
              membersContributed={streak.todayContributed ? streak.participants.length : streak.participants.length - 1}
              totalMembers={streak.participants.length}
            />
          ))}
        </View>

        {/* Estadísticas Globales */}
        <View style={styles.globalStats}>
          <LinearGradient
            colors={['rgba(139, 92, 246, 0.2)', 'rgba(6, 182, 212, 0.2)']}
            style={styles.statsCard}
          >
            <Text style={styles.statsTitle}>Resumen Global</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statBox}>
                <Trophy size={24} color="#F59E0B" />
                <Text style={styles.statValue}>{longestStreak}</Text>
                <Text style={styles.statLabel}>Mejor Racha</Text>
              </View>
              <View style={styles.statBox}>
                <Target size={24} color="#10B981" />
                <Text style={styles.statValue}>{totalStreaks}</Text>
                <Text style={styles.statLabel}>Días Activos</Text>
              </View>
              <View style={styles.statBox}>
                <Users size={24} color="#06B6D4" />
                <Text style={styles.statValue}>{streaks.length}</Text>
                <Text style={styles.statLabel}>Grupos</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Lista de Rachas por Grupo */}
        <View style={styles.streaksList}>
          <Text style={styles.sectionTitle}>Rachas por Grupo</Text>
          {streaks.map((streak, index) => {
            const level = getStreakLevel(streak.currentStreak);
            return (
              <TouchableOpacity key={index} style={styles.streakCard}>
                <LinearGradient
                  colors={['rgba(55, 65, 81, 0.8)', 'rgba(31, 41, 55, 0.8)']}
                  style={styles.streakGradient}
                >
                  <View style={styles.streakHeader}>
                    <View style={styles.streakInfo}>
                      <Text style={styles.streakGroupName}>{streak.groupName}</Text>
                      <View style={styles.levelBadge} style={[styles.levelBadge, { backgroundColor: `${level.color}20` }]}>
                        <Text style={styles.levelEmoji}>{level.icon}</Text>
                        <Text style={[styles.levelText, { color: level.color }]}>
                          {level.level}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.streakNumber}>
                      <Flame size={20} color="#FF6B35" />
                      <Text style={styles.streakCount}>{streak.currentStreak}</Text>
                    </View>
                  </View>

                  <View style={styles.streakProgress}>
                    <View style={styles.progressBar}>
                      <View 
                        style={[
                          styles.progressFill, 
                          { 
                            width: `${Math.min((streak.currentStreak / streak.bestStreak) * 100, 100)}%`,
                            backgroundColor: level.color 
                          }
                        ]} 
                      />
                    </View>
                    <Text style={styles.progressText}>
                      {streak.currentStreak} / {streak.bestStreak} mejor racha
                    </Text>
                  </View>

                  <View style={styles.streakDetails}>
                    <View style={styles.detailItem}>
                      <Calendar size={16} color="#9CA3AF" />
                      <Text style={styles.detailText}>{streak.totalDays} días totales</Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Users size={16} color="#9CA3AF" />
                      <Text style={styles.detailText}>
                        {streak.participants.length} participantes
                      </Text>
                    </View>
                  </View>

                  <View style={styles.todayStatus}>
                    <View style={[
                      styles.statusDot, 
                      { backgroundColor: streak.todayContributed ? '#10B981' : '#EF4444' }
                    ]} />
                    <Text style={styles.statusText}>
                      {streak.todayContributed ? 
                        '¡Ya contribuiste hoy!' : 
                        'Falta tu aporte de hoy'
                      }
                    </Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Logros */}
        <View style={styles.achievements}>
          <Text style={styles.sectionTitle}>Logros</Text>
          <View style={styles.achievementsList}>
            <View style={styles.achievementItem}>
              <Award size={20} color="#F59E0B" />
              <Text style={styles.achievementText}>Primera Racha</Text>
              <Text style={styles.achievementDate}>Desbloqueado</Text>
            </View>
            <View style={styles.achievementItem}>
              <Star size={20} color="#8B5CF6" />
              <Text style={styles.achievementText}>Racha de 7 días</Text>
              <Text style={styles.achievementDate}>Desbloqueado</Text>
            </View>
            <View style={[styles.achievementItem, styles.lockedAchievement]}>
              <Trophy size={20} color="#6B7280" />
              <Text style={[styles.achievementText, styles.lockedText]}>
                Racha de 30 días
              </Text>
              <Text style={[styles.achievementDate, styles.lockedText]}>Bloqueado</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerStats: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 107, 53, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statNumber: {
    color: '#FF6B35',
    fontWeight: 'bold',
    fontSize: 16,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  activeStreaks: {
    marginBottom: 24,
  },
  globalStats: {
    marginBottom: 24,
  },
  statsCard: {
    padding: 20,
    borderRadius: 16,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 16,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statBox: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  streaksList: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 16,
  },
  streakCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  streakGradient: {
    padding: 20,
  },
  streakHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  streakInfo: {
    flex: 1,
  },
  streakGroupName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  levelEmoji: {
    marginRight: 6,
  },
  levelText: {
    fontSize: 12,
    fontWeight: '600',
  },
  streakNumber: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 107, 53, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  streakCount: {
    color: '#FF6B35',
    fontWeight: 'bold',
    fontSize: 18,
    marginLeft: 6,
  },
  streakProgress: {
    marginBottom: 16,
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(156, 163, 175, 0.3)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  streakDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  todayStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 14,
    color: 'white',
    fontWeight: '500',
  },
  achievements: {
    marginBottom: 40,
  },
  achievementsList: {
    gap: 12,
  },
  achievementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(55, 65, 81, 0.5)',
    padding: 16,
    borderRadius: 12,
  },
  achievementText: {
    flex: 1,
    fontSize: 16,
    color: 'white',
    marginLeft: 12,
  },
  achievementDate: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '500',
  },
  lockedAchievement: {
    opacity: 0.6,
  },
  lockedText: {
    color: '#6B7280',
  },
});