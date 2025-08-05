import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Plus, 
  Users, 
  Share2, 
  UserPlus, 
  Copy,
  Flame,
  Crown,
  Clock
} from 'lucide-react-native';

interface Group {
  id: string;
  name: string;
  members: string[];
  streak: number;
  inviteCode: string;
  lastActivity: Date;
  isAdmin: boolean;
}

export default function GroupsScreen() {
  const [groups, setGroups] = useState<Group[]>([
    {
      id: '1',
      name: 'Grupo Aventureros',
      members: ['Ana', 'Carlos', 'María', 'Tú'],
      streak: 7,
      inviteCode: 'ADV2024',
      lastActivity: new Date(),
      isAdmin: true,
    },
    {
      id: '2',
      name: 'Familia López',
      members: ['Mamá', 'Papá', 'Luis', 'Tú'],
      streak: 15,
      inviteCode: 'FAM789',
      lastActivity: new Date(Date.now() - 3600000),
      isAdmin: false,
    },
  ]);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [joinCode, setJoinCode] = useState('');

  const createGroup = () => {
    if (newGroupName.trim()) {
      const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      const newGroup: Group = {
        id: Date.now().toString(),
        name: newGroupName,
        members: ['Tú'],
        streak: 0,
        inviteCode,
        lastActivity: new Date(),
        isAdmin: true,
      };
      setGroups([...groups, newGroup]);
      setNewGroupName('');
      setShowCreateModal(false);
      Alert.alert(
        '¡Grupo Creado!',
        `Tu grupo "${newGroupName}" ha sido creado. Código de invitación: ${inviteCode}`
      );
    }
  };

  const joinGroup = () => {
    if (joinCode.trim()) {
      // Simulamos encontrar un grupo
      Alert.alert('¡Éxito!', `Te has unido al grupo con código: ${joinCode}`);
      setJoinCode('');
      setShowJoinModal(false);
    }
  };

  const copyInviteCode = (code: string) => {
    Alert.alert('Código Copiado', `El código ${code} ha sido copiado al portapapeles`);
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 1) return 'Hace unos minutos';
    if (hours < 24) return `Hace ${hours} horas`;
    return `Hace ${Math.floor(hours / 24)} días`;
  };

  return (
    <LinearGradient
      colors={['#1F2937', '#111827']}
      style={styles.container}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mis Grupos</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setShowJoinModal(true)}
          >
            <UserPlus size={20} color="white" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setShowCreateModal(true)}
          >
            <Plus size={20} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.groupsList} showsVerticalScrollIndicator={false}>
        {groups.map((group) => (
          <TouchableOpacity key={group.id} style={styles.groupCard}>
            <LinearGradient
              colors={['rgba(139, 92, 246, 0.1)', 'rgba(6, 182, 212, 0.1)']}
              style={styles.groupGradient}
            >
              <View style={styles.groupHeader}>
                <View style={styles.groupInfo}>
                  <View style={styles.groupNameRow}>
                    <Text style={styles.groupName}>{group.name}</Text>
                    {group.isAdmin && <Crown size={16} color="#F59E0B" />}
                  </View>
                  <Text style={styles.memberCount}>
                    {group.members.length} miembros
                  </Text>
                </View>
                <View style={styles.streakBadge}>
                  <Flame size={16} color="#FF6B35" />
                  <Text style={styles.streakCount}>{group.streak}</Text>
                </View>
              </View>

              <View style={styles.groupMembers}>
                {group.members.slice(0, 3).map((member, index) => (
                  <View key={index} style={styles.memberBadge}>
                    <Text style={styles.memberName}>{member}</Text>
                  </View>
                ))}
                {group.members.length > 3 && (
                  <View style={styles.memberBadge}>
                    <Text style={styles.memberName}>+{group.members.length - 3}</Text>
                  </View>
                )}
              </View>

              <View style={styles.groupFooter}>
                <View style={styles.lastActivity}>
                  <Clock size={12} color="#9CA3AF" />
                  <Text style={styles.activityText}>
                    {formatTime(group.lastActivity)}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.inviteButton}
                  onPress={() => copyInviteCode(group.inviteCode)}
                >
                  <Share2 size={14} color="#8B5CF6" />
                  <Text style={styles.inviteCode}>{group.inviteCode}</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Modal para crear grupo */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        transparent
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Crear Nuevo Grupo</Text>
            <TextInput
              style={styles.modalInput}
              value={newGroupName}
              onChangeText={setNewGroupName}
              placeholder="Nombre del grupo"
              placeholderTextColor="#9CA3AF"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setShowCreateModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={createGroup}
              >
                <LinearGradient
                  colors={['#8B5CF6', '#06B6D4']}
                  style={styles.createButtonGradient}
                >
                  <Text style={styles.createButtonText}>Crear</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal para unirse a grupo */}
      <Modal
        visible={showJoinModal}
        animationType="slide"
        transparent
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Unirse a Grupo</Text>
            <TextInput
              style={styles.modalInput}
              value={joinCode}
              onChangeText={setJoinCode}
              placeholder="Código de invitación"
              placeholderTextColor="#9CA3AF"
              autoCapitalize="characters"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setShowJoinModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={joinGroup}
              >
                <LinearGradient
                  colors={['#8B5CF6', '#06B6D4']}
                  style={styles.createButtonGradient}
                >
                  <Text style={styles.createButtonText}>Unirse</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  headerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  groupsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  groupCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  groupGradient: {
    padding: 20,
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  groupInfo: {
    flex: 1,
  },
  groupNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  groupName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  memberCount: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 107, 53, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  streakCount: {
    color: '#FF6B35',
    fontWeight: '600',
    marginLeft: 4,
  },
  groupMembers: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  memberBadge: {
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  memberName: {
    color: '#8B5CF6',
    fontSize: 12,
    fontWeight: '500',
  },
  groupFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastActivity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  activityText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  inviteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  inviteCode: {
    color: '#8B5CF6',
    fontSize: 12,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1F2937',
    borderRadius: 20,
    padding: 24,
    width: '85%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalInput: {
    backgroundColor: 'rgba(55, 65, 81, 0.8)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: 'white',
    fontSize: 16,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
  },
  cancelButtonText: {
    color: '#9CA3AF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    paddingVertical: 12,
  },
  createButtonGradient: {
    paddingVertical: 12,
    borderRadius: 12,
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});