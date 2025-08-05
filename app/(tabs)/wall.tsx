import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  X,
  Users,
  Calendar
} from 'lucide-react-native';
import { ApiService } from '@/services/api';

interface WallPhoto {
  id: string;
  group_id: string;
  message_id: string;
  user_id: string;
  image_url: string;
  image_filename: string;
  caption?: string;
  likes_count: number;
  username: string;
  user_avatar?: string;
  created_at: string;
  message_created_at: string;
}

interface Group {
  id: string;
  name: string;
  member_count: number;
  current_streak: number;
}

const { width } = Dimensions.get('window');
const PHOTO_SIZE = (width - 60) / 3; // 3 columns with margins

export default function WallScreen() {
  const [wallPhotos, setWallPhotos] = useState<WallPhoto[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<WallPhoto | null>(null);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Mock user ID - In real app, get from auth context  
  const currentUserId = '550e8400-e29b-41d4-a716-446655440000'; // UUID format

  useEffect(() => {
    loadGroups();
  }, []);

  useEffect(() => {
    if (selectedGroup) {
      loadWallPhotos(selectedGroup.id);
    }
  }, [selectedGroup]);

  const loadGroups = async () => {
    try {
      const response = await ApiService.getUserGroups(currentUserId);
      setGroups(response.groups);
      if (response.groups.length > 0 && !selectedGroup) {
        setSelectedGroup(response.groups[0]);
      }
    } catch (error) {
      console.error('Error loading groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadWallPhotos = async (groupId: number) => {
    try {
      const response = await ApiService.getWallPhotos(groupId.toString());
      setWallPhotos(response.wallPhotos);
    } catch (error) {
      console.error('Error loading wall photos:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    if (selectedGroup) {
      await loadWallPhotos(selectedGroup.id.toString());
    }
    setRefreshing(false);
  };

  const handlePhotoPress = (photo: WallPhoto) => {
    setSelectedPhoto(photo);
    setShowPhotoModal(true);
  };

  const handleLikePhoto = async (photo: WallPhoto) => {
    try {
      await ApiService.likeWallPhoto(photo.id.toString(), currentUserId);
      // Update local state
      setWallPhotos(prev => prev.map(p => 
        p.id === photo.id 
          ? { ...p, likes_count: p.likes_count + 1 }
          : p
      ));
      if (selectedPhoto?.id === photo.id) {
        setSelectedPhoto({ ...photo, likes_count: photo.likes_count + 1 });
      }
    } catch (error) {
      console.error('Error liking photo:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <LinearGradient colors={['#1F2937', '#111827']} style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Cargando muro...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#1F2937', '#111827']} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Muro de Fotos</Text>
        <View style={styles.headerRight}>
          <Users size={20} color="#8B5CF6" />
          <Text style={styles.memberCount}>
            {selectedGroup?.member_count || 0}
          </Text>
        </View>
      </View>

      {/* Group Selector */}
      <ScrollView 
        horizontal 
        style={styles.groupSelector}
        showsHorizontalScrollIndicator={false}
      >
        {groups.map((group) => (
          <TouchableOpacity
            key={group.id}
            style={[
              styles.groupChip,
              selectedGroup?.id === group.id && styles.selectedGroupChip
            ]}
            onPress={() => setSelectedGroup(group)}
          >
            <Text style={[
              styles.groupChipText,
              selectedGroup?.id === group.id && styles.selectedGroupChipText
            ]}>
              {group.name}
            </Text>
            {group.current_streak > 0 && (
              <View style={styles.streakBadge}>
                <Text style={styles.streakText}>🔥{group.current_streak}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Photo Grid */}
      <ScrollView
        style={styles.photoGrid}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {wallPhotos.length === 0 ? (
          <View style={styles.emptyState}>
            <Image size={64} color="#6B7280" />
            <Text style={styles.emptyText}>
              {selectedGroup ? 
                `No hay fotos en ${selectedGroup.name} aún` : 
                'Selecciona un grupo para ver las fotos'
              }
            </Text>
          </View>
        ) : (
          <View style={styles.photosContainer}>
            {wallPhotos.map((photo, index) => (
              <TouchableOpacity
                key={photo.id}
                style={[
                  styles.photoItem,
                  { marginRight: (index + 1) % 3 === 0 ? 0 : 10 }
                ]}
                onPress={() => handlePhotoPress(photo)}
              >
                <Image
                  source={{ uri: photo.image_url }}
                  style={styles.photoImage}
                />
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.8)']}
                  style={styles.photoOverlay}
                >
                  <View style={styles.photoInfo}>
                    <Text style={styles.photoUsername}>{photo.username}</Text>
                    <View style={styles.photoStats}>
                      <Heart size={12} color="#FF6B6B" />
                      <Text style={styles.photoLikes}>{photo.likes_count}</Text>
                    </View>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Photo Detail Modal */}
      <Modal
        visible={showPhotoModal}
        animationType="fade"
        transparent
        onRequestClose={() => setShowPhotoModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowPhotoModal(false)}
            >
              <X size={24} color="white" />
            </TouchableOpacity>

            {selectedPhoto && (
              <>
                <Image
                  source={{ uri: selectedPhoto.image_url }}
                  style={styles.modalImage}
                  resizeMode="contain"
                />
                
                <View style={styles.modalInfo}>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalUsername}>
                      {selectedPhoto.username}
                    </Text>
                    <View style={styles.modalDate}>
                      <Calendar size={14} color="#9CA3AF" />
                      <Text style={styles.modalDateText}>
                        {formatDate(selectedPhoto.created_at)}
                      </Text>
                    </View>
                  </View>

                  {selectedPhoto.caption && (
                    <Text style={styles.modalCaption}>
                      {selectedPhoto.caption}
                    </Text>
                  )}

                  <View style={styles.modalActions}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleLikePhoto(selectedPhoto)}
                    >
                      <Heart size={20} color="#FF6B6B" />
                      <Text style={styles.actionText}>
                        {selectedPhoto.likes_count}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionButton}>
                      <MessageCircle size={20} color="#06B6D4" />
                      <Text style={styles.actionText}>Comentar</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionButton}>
                      <Share2 size={20} color="#8B5CF6" />
                      <Text style={styles.actionText}>Compartir</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </>
            )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: 'white',
    fontSize: 16,
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
    gap: 6,
  },
  memberCount: {
    color: '#8B5CF6',
    fontWeight: '600',
  },
  groupSelector: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  groupChip: {
    backgroundColor: 'rgba(55, 65, 81, 0.8)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedGroupChip: {
    backgroundColor: 'rgba(139, 92, 246, 0.3)',
  },
  groupChipText: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '500',
  },
  selectedGroupChipText: {
    color: '#8B5CF6',
  },
  streakBadge: {
    marginLeft: 8,
  },
  streakText: {
    fontSize: 12,
  },
  photoGrid: {
    flex: 1,
    paddingHorizontal: 20,
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
    textAlign: 'center',
    marginTop: 16,
  },
  photosContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingBottom: 20,
  },
  photoItem: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    marginBottom: 10,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  photoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
    justifyContent: 'flex-end',
    padding: 8,
  },
  photoInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  photoUsername: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  photoStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  photoLikes: {
    color: 'white',
    fontSize: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: '#1F2937',
    borderRadius: 20,
    overflow: 'hidden',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    padding: 8,
  },
  modalImage: {
    width: '100%',
    height: 300,
  },
  modalInfo: {
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalUsername: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalDate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  modalDateText: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  modalCaption: {
    color: 'white',
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(55, 65, 81, 0.5)',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  actionText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
});