import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Send, 
  Heart, 
  Flame, 
  ChevronDown, 
  Users,
  Camera,
  Paperclip,
  X,
  Wifi,
  WifiOff
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { ApiService } from '@/services/api';

interface Message {
  id: string;
  content?: string;
  image_url?: string;
  sender: string;
  username: string;
  user_avatar?: string;
  timestamp: Date;
  message_type: 'text' | 'image';
  created_at: string;
}

interface Group {
  id: number;
  name: string;
  member_count: number;
  current_streak: number;
  best_streak: number;
  is_admin: boolean;
}

export default function ChatScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [showGroupSelector, setShowGroupSelector] = useState(false);
  const [inputText, setInputText] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [dbConnected, setDbConnected] = useState<boolean | null>(null);
  const [showConnectionStatus, setShowConnectionStatus] = useState(true);
  const scrollViewRef = useRef<ScrollView>(null);

  // Mock user ID - In real app, get from auth context
  const currentUserId = 1;

  useEffect(() => {
    checkDatabaseConnection();
    loadGroups();
  }, []);

  useEffect(() => {
    if (selectedGroup) {
      loadMessages(selectedGroup.id);
    }
  }, [selectedGroup]);

  const checkDatabaseConnection = async () => {
    try {
      await ApiService.initializeDatabase();
      setDbConnected(true);
      // Hide connection status after 3 seconds if successful
      setTimeout(() => setShowConnectionStatus(false), 3000);
    } catch (error) {
      console.error('Database connection failed:', error);
      setDbConnected(false);
    }
  };

  const loadGroups = async () => {
    try {
      const response = await ApiService.getUserGroups(currentUserId);
      setGroups(response.groups);
      if (response.groups.length > 0 && !selectedGroup) {
        setSelectedGroup(response.groups[0]);
      }
    } catch (error) {
      console.error('Error loading groups:', error);
      Alert.alert('Error', 'No se pudieron cargar los grupos');
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (groupId: number) => {
    try {
      const response = await ApiService.getMessages(groupId);
      const formattedMessages = response.messages.map((msg: any) => ({
        ...msg,
        id: msg.id.toString(),
        sender: msg.user_id === currentUserId ? 'Tú' : msg.username,
        timestamp: new Date(msg.created_at),
      }));
      setMessages(formattedMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!selectedGroup) {
      Alert.alert('Error', 'Selecciona un grupo primero');
      return;
    }

    if (!inputText.trim() && !selectedImage) {
      return;
    }

    setSending(true);
    try {
      const messageType = selectedImage ? 'image' : 'text';
      const response = await ApiService.sendMessage(
        selectedGroup.id,
        currentUserId,
        inputText.trim() || undefined,
        selectedImage || undefined,
        messageType
      );

      const newMessage: Message = {
        ...response.message,
        id: response.message.id.toString(),
        sender: 'Tú',
        timestamp: new Date(response.message.created_at),
      };

      setMessages(prev => [...prev, newMessage]);
      setInputText('');
      setSelectedImage(null);
      setShowImagePreview(false);
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'No se pudo enviar el mensaje');
    } finally {
      setSending(false);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permisos', 'Se necesitan permisos para acceder a las fotos');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      if (asset.base64) {
        const imageData = `data:image/jpeg;base64,${asset.base64}`;
        setSelectedImage(imageData);
        setShowImagePreview(true);
      }
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permisos', 'Se necesitan permisos para usar la cámara');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      if (asset.base64) {
        const imageData = `data:image/jpeg;base64,${asset.base64}`;
        setSelectedImage(imageData);
        setShowImagePreview(true);
      }
    }
  };

  const showImageOptions = () => {
    Alert.alert(
      'Seleccionar imagen',
      'Elige una opción',
      [
        { text: 'Cámara', onPress: takePhoto },
        { text: 'Galería', onPress: pickImage },
        { text: 'Cancelar', style: 'cancel' },
      ]
    );
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  if (loading) {
    return (
      <LinearGradient colors={['#1F2937', '#111827']} style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B5CF6" />
          <Text style={styles.loadingText}>Cargando chat...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#1F2937', '#111827']} style={styles.container}>
      {/* Database Connection Status */}
      {showConnectionStatus && dbConnected !== null && (
        <View style={[
          styles.connectionStatus,
          dbConnected ? styles.connectionSuccess : styles.connectionError
        ]}>
          <View style={styles.connectionContent}>
            {dbConnected ? (
              <>
                <Wifi size={16} color="#10B981" />
                <Text style={styles.connectionText}>Base de datos conectada</Text>
              </>
            ) : (
              <>
                <WifiOff size={16} color="#EF4444" />
                <Text style={[styles.connectionText, styles.connectionErrorText]}>
                  Error de conexión a la base de datos
                </Text>
              </>
            )}
            <TouchableOpacity
              style={styles.closeConnectionStatus}
              onPress={() => setShowConnectionStatus(false)}
            >
              <X size={14} color={dbConnected ? "#10B981" : "#EF4444"} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.groupSelector}
          onPress={() => setShowGroupSelector(true)}
        >
          <Text style={styles.headerTitle}>
            {selectedGroup?.name || 'Seleccionar grupo'}
          </Text>
          <ChevronDown size={20} color="white" />
        </TouchableOpacity>
        
        <View style={styles.headerRight}>
          <View style={styles.memberCount}>
            <Users size={16} color="#8B5CF6" />
            <Text style={styles.memberCountText}>
              {selectedGroup?.member_count || 0}
            </Text>
          </View>
          {selectedGroup && selectedGroup.current_streak > 0 && (
            <View style={styles.streakBadge}>
              <Flame size={16} color="#FF6B35" />
              <Text style={styles.streakText}>{selectedGroup.current_streak}</Text>
            </View>
          )}
        </View>
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
      >
        {!selectedGroup ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Selecciona un grupo para comenzar a chatear</Text>
          </View>
        ) : messages.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No hay mensajes aún. ¡Sé el primero en escribir!</Text>
          </View>
        ) : (
          messages.map((message) => (
            <View
              key={message.id}
              style={[
                styles.messageContainer,
                message.sender === 'Tú' ? styles.ownMessage : styles.otherMessage,
              ]}
            >
              <View style={styles.messageHeader}>
                <Text style={styles.senderName}>{message.sender}</Text>
                <Text style={styles.timestamp}>{formatTime(message.timestamp)}</Text>
              </View>
              
              {message.message_type === 'text' ? (
                <Text style={styles.messageText}>{message.content}</Text>
              ) : (
                <View style={styles.imageContainer}>
                  <Image source={{ uri: message.image_url }} style={styles.messageImage} />
                  {message.content && (
                    <Text style={styles.imageCaption}>{message.content}</Text>
                  )}
                </View>
              )}
              
              <TouchableOpacity style={styles.heartButton}>
                <Heart size={16} color="#FF6B6B" />
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>

      <KeyboardAvoidingView
        style={styles.inputContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.inputRow}>
          <TouchableOpacity
            style={styles.attachButton}
            onPress={showImageOptions}
          >
            <Paperclip size={20} color="#8B5CF6" />
          </TouchableOpacity>
          
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Escribe un mensaje..."
            placeholderTextColor="#9CA3AF"
            multiline
            maxLength={500}
          />
          
          <TouchableOpacity
            style={[styles.sendButton, sending && styles.sendButtonDisabled]}
            onPress={sendMessage}
            disabled={sending || (!inputText.trim() && !selectedImage)}
          >
            <LinearGradient
              colors={['#8B5CF6', '#06B6D4']}
              style={styles.sendGradient}
            >
              {sending ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Send size={20} color="white" />
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
        
        {selectedImage && (
          <View style={styles.imagePreview}>
            <Image source={{ uri: selectedImage }} style={styles.previewImage} />
            <TouchableOpacity
              style={styles.removeImageButton}
              onPress={() => {
                setSelectedImage(null);
                setShowImagePreview(false);
              }}
            >
              <X size={16} color="white" />
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>

      {/* Group Selector Modal */}
      <Modal
        visible={showGroupSelector}
        animationType="slide"
        transparent
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seleccionar Grupo</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowGroupSelector(false)}
              >
                <X size={24} color="white" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.groupsList}>
              {groups.map((group) => (
                <TouchableOpacity
                  key={group.id}
                  style={[
                    styles.groupItem,
                    selectedGroup?.id === group.id && styles.selectedGroupItem
                  ]}
                  onPress={() => {
                    setSelectedGroup(group);
                    setShowGroupSelector(false);
                  }}
                >
                  <View style={styles.groupInfo}>
                    <Text style={styles.groupName}>{group.name}</Text>
                    <Text style={styles.groupMembers}>
                      {group.member_count} miembros
                    </Text>
                  </View>
                  
                  <View style={styles.groupStats}>
                    {group.current_streak > 0 && (
                      <View style={styles.groupStreak}>
                        <Flame size={16} color="#FF6B35" />
                        <Text style={styles.groupStreakText}>
                          {group.current_streak}
                        </Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
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
    marginTop: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  groupSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginRight: 8,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  memberCount: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    gap: 4,
  },
  memberCountText: {
    color: '#8B5CF6',
    fontWeight: '600',
    fontSize: 12,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 107, 53, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  streakText: {
    color: '#FF6B35',
    fontWeight: '600',
    marginLeft: 4,
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  messagesContent: {
    paddingBottom: 20,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    color: '#9CA3AF',
    fontSize: 16,
    textAlign: 'center',
  },
  messageContainer: {
    marginBottom: 16,
    padding: 16,
    borderRadius: 16,
    maxWidth: '85%',
    position: 'relative',
  },
  ownMessage: {
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    borderBottomRightRadius: 4,
  },
  otherMessage: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(55, 65, 81, 0.8)',
    borderBottomLeftRadius: 4,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  senderName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8B5CF6',
  },
  timestamp: {
    fontSize: 10,
    color: '#9CA3AF',
  },
  messageText: {
    fontSize: 16,
    color: 'white',
    lineHeight: 22,
  },
  imageContainer: {
    marginTop: 4,
  },
  messageImage: {
    width: 200,
    height: 150,
    borderRadius: 12,
  },
  imageCaption: {
    fontSize: 14,
    color: 'white',
    marginTop: 8,
    lineHeight: 20,
  },
  heartButton: {
    position: 'absolute',
    bottom: -8,
    right: -8,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 12,
    padding: 6,
  },
  inputContainer: {
    backgroundColor: 'rgba(31, 41, 55, 0.9)',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  attachButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    backgroundColor: 'rgba(55, 65, 81, 0.8)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: 'white',
    fontSize: 16,
    maxHeight: 100,
  },
  sendButton: {
    marginLeft: 12,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendGradient: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePreview: {
    marginTop: 12,
    position: 'relative',
    alignSelf: 'flex-start',
  },
  previewImage: {
    width: 100,
    height: 75,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    borderRadius: 12,
    padding: 4,
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
    maxHeight: '70%',
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
  closeButton: {
    padding: 4,
  },
  groupsList: {
    flex: 1,
  },
  groupItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(55, 65, 81, 0.3)',
  },
  selectedGroupItem: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 4,
  },
  groupMembers: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  groupStats: {
    alignItems: 'flex-end',
  },
  groupStreak: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 107, 53, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  groupStreakText: {
    color: '#FF6B35',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  connectionStatus: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    zIndex: 1000,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  connectionSuccess: {
    backgroundColor: 'rgba(16, 185, 129, 0.9)',
  },
  connectionError: {
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
  },
  connectionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  connectionText: {
    flex: 1,
    color: '#10B981',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  connectionErrorText: {
    color: '#EF4444',
  },
  closeConnectionStatus: {
    padding: 4,
  },
});