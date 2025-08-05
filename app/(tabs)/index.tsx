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
  id: string;
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
  const [connectionError, setConnectionError] = useState<any>(null);
  const [showDiagnosticModal, setShowDiagnosticModal] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  // Mock user ID - In real app, get from auth context  
  const currentUserId = '550e8400-e29b-41d4-a716-446655440000'; // UUID format

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
      setConnectionError(null);
      // Hide connection status after 3 seconds if successful
      setTimeout(() => setShowConnectionStatus(false), 3000);
    } catch (error) {
      console.error('Database connection failed:', error);
      setDbConnected(false);
      setConnectionError(error);
    }
  };

  const runDatabaseDiagnostic = async () => {
    setShowDiagnosticModal(true);
    try {
      const result = await ApiService.testDatabaseConnection();
      setConnectionError(result);
    } catch (error) {
      console.error('Diagnostic failed:', error);
      setConnectionError({
        success: false,
        message: 'Error al ejecutar el diagnóstico',
        error: { 
          message: error instanceof Error ? error.message : 'Error desconocido',
          code: (error as any).code || 'UNKNOWN_ERROR'
        }
      });
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
      const response = await ApiService.getMessages(groupId.toString());
      const formattedMessages = response.messages.map((msg: any) => ({
        ...msg,
        id: msg.id,
        sender: msg.user_id === currentUserId ? 'Tú' : msg.users?.username || 'Usuario',
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
        selectedGroup.id.toString(),
        currentUserId,
        inputText.trim() || undefined,
        selectedImage || undefined,
        messageType
      );

      const newMessage: Message = {
        ...response.message,
        id: response.message.id,
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
                <TouchableOpacity
                  style={styles.diagnosticButton}
                  onPress={runDatabaseDiagnostic}
                >
                  <Text style={styles.diagnosticButtonText}>Diagnóstico</Text>
                </TouchableOpacity>
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

      {/* Database Diagnostic Modal */}
      <Modal
        visible={showDiagnosticModal}
        animationType="slide"
        transparent
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '80%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>🔍 Diagnóstico de Conexión</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowDiagnosticModal(false)}
              >
                <X size={24} color="white" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.diagnosticContent}>
              {connectionError ? (
                <View>
                  {/* Status */}
                  <View style={styles.diagnosticSection}>
                    <View style={[
                      styles.statusBadge,
                      connectionError.success ? styles.statusSuccess : styles.statusError
                    ]}>
                      <Text style={[
                        styles.statusText,
                        connectionError.success ? styles.statusSuccessText : styles.statusErrorText
                      ]}>
                        {connectionError.success ? '✅ CONEXIÓN EXITOSA' : '❌ ERROR DE CONEXIÓN'}
                      </Text>
                    </View>
                    <Text style={styles.diagnosticMessage}>{connectionError.message}</Text>
                  </View>

                  {/* Success Details */}
                  {connectionError.success && connectionError.details && (
                    <View style={styles.diagnosticSection}>
                      <Text style={styles.sectionTitle}>📊 Detalles de la Conexión</Text>
                      <View style={styles.detailsContainer}>
                        <Text style={styles.detailItem}>🏠 Host: {connectionError.details.host}</Text>
                        <Text style={styles.detailItem}>🗄️ Base de datos: {connectionError.details.database}</Text>
                        <Text style={styles.detailItem}>⚡ Versión MySQL: {connectionError.details.version}</Text>
                        <Text style={styles.detailItem}>📋 Tablas: {connectionError.details.tablesCount}</Text>
                        <Text style={styles.detailItem}>👥 Usuarios: {connectionError.details.usersCount}</Text>
                        <Text style={styles.detailItem}>🕐 Timestamp: {new Date(connectionError.details.timestamp).toLocaleString('es-ES')}</Text>
                      </View>
                    </View>
                  )}

                  {/* Error Details */}
                  {!connectionError.success && connectionError.error && (
                    <View>
                      <View style={styles.diagnosticSection}>
                        <Text style={styles.sectionTitle}>🚨 Información del Error</Text>
                        <View style={styles.errorContainer}>
                          {connectionError.error.code && (
                            <Text style={styles.errorItem}>
                              <Text style={styles.errorLabel}>Código:</Text> {connectionError.error.code}
                            </Text>
                          )}
                          {connectionError.error.message && (
                            <Text style={styles.errorItem}>
                              <Text style={styles.errorLabel}>Mensaje:</Text> {connectionError.error.message}
                            </Text>
                          )}
                          {connectionError.error.sqlMessage && (
                            <Text style={styles.errorItem}>
                              <Text style={styles.errorLabel}>SQL Error:</Text> {connectionError.error.sqlMessage}
                            </Text>
                          )}
                        </View>
                      </View>

                      {/* Diagnostic and Solutions */}
                      <View style={styles.diagnosticSection}>
                        <Text style={styles.sectionTitle}>🔍 Diagnóstico</Text>
                        <View style={styles.diagnosticText}>
                          {connectionError.error.code === 'ENOTFOUND' && (
                            <>
                              <Text style={styles.diagnosisItem}>• El host de la base de datos no se pudo resolver</Text>
                              <Text style={styles.diagnosisItem}>• Verifica que el host sea correcto y esté accesible</Text>
                            </>
                          )}
                          {connectionError.error.code === 'ECONNREFUSED' && (
                            <>
                              <Text style={styles.diagnosisItem}>• La conexión fue rechazada</Text>
                              <Text style={styles.diagnosisItem}>• Verifica que el puerto sea correcto y el servidor esté ejecutándose</Text>
                            </>
                          )}
                          {connectionError.error.code === 'ER_ACCESS_DENIED_ERROR' && (
                            <>
                              <Text style={styles.diagnosisItem}>• Acceso denegado</Text>
                              <Text style={styles.diagnosisItem}>• Verifica el usuario y contraseña</Text>
                            </>
                          )}
                          {connectionError.error.code === 'ER_BAD_DB_ERROR' && (
                            <>
                              <Text style={styles.diagnosisItem}>• Base de datos no encontrada</Text>
                              <Text style={styles.diagnosisItem}>• Verifica que el nombre de la base de datos sea correcto</Text>
                            </>
                          )}
                          {connectionError.error.code === 'ETIMEDOUT' && (
                            <>
                              <Text style={styles.diagnosisItem}>• Timeout de conexión</Text>
                              <Text style={styles.diagnosisItem}>• El servidor puede estar sobrecargado o la red es lenta</Text>
                            </>
                          )}
                          {connectionError.error.code === 'ECONNRESET' && (
                            <>
                              <Text style={styles.diagnosisItem}>• Conexión reiniciada por el servidor</Text>
                              <Text style={styles.diagnosisItem}>• Puede ser un problema de configuración SSL o firewall</Text>
                            </>
                          )}
                          {!['ENOTFOUND', 'ECONNREFUSED', 'ER_ACCESS_DENIED_ERROR', 'ER_BAD_DB_ERROR', 'ETIMEDOUT', 'ECONNRESET'].includes(connectionError.error.code) && (
                            <Text style={styles.diagnosisItem}>• Error no reconocido, revisa los logs para más detalles</Text>
                          )}
                        </View>
                      </View>

                      <View style={styles.diagnosticSection}>
                        <Text style={styles.sectionTitle}>💡 Posibles Soluciones</Text>
                        <View style={styles.solutionsContainer}>
                          <Text style={styles.solutionItem}>1. Verifica las credenciales de la base de datos</Text>
                          <Text style={styles.solutionItem}>2. Confirma que el servidor MySQL esté ejecutándose</Text>
                          <Text style={styles.solutionItem}>3. Revisa la configuración de firewall</Text>
                          <Text style={styles.solutionItem}>4. Verifica la configuración SSL si es necesaria</Text>
                          <Text style={styles.solutionItem}>5. Confirma que la base de datos existe</Text>
                        </View>
                      </View>
                    </View>
                  )}

                  {/* Retry Button */}
                  <View style={styles.diagnosticSection}>
                    <TouchableOpacity
                      style={styles.retryButton}
                      onPress={() => {
                        setShowDiagnosticModal(false);
                        checkDatabaseConnection();
                      }}
                    >
                      <LinearGradient
                        colors={['#8B5CF6', '#06B6D4']}
                        style={styles.retryGradient}
                      >
                        <Text style={styles.retryButtonText}>🔄 Reintentar Conexión</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View style={styles.diagnosticSection}>
                  <ActivityIndicator size="large" color="#8B5CF6" />
                  <Text style={styles.loadingDiagnosticText}>Ejecutando diagnóstico...</Text>
                </View>
              )}
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
  diagnosticButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 8,
  },
  diagnosticButtonText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '600',
  },
  diagnosticContent: {
    flex: 1,
    padding: 20,
  },
  diagnosticSection: {
    marginBottom: 20,
  },
  statusBadge: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  statusSuccess: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },
  statusError: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  statusText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  statusSuccessText: {
    color: '#10B981',
  },
  statusErrorText: {
    color: '#EF4444',
  },
  diagnosticMessage: {
    color: '#D1D5DB',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  sectionTitle: {
    color: '#8B5CF6',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  detailsContainer: {
    backgroundColor: 'rgba(55, 65, 81, 0.5)',
    borderRadius: 12,
    padding: 16,
  },
  detailItem: {
    color: '#D1D5DB',
    fontSize: 14,
    marginBottom: 8,
    lineHeight: 20,
  },
  errorContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  errorItem: {
    color: '#FCA5A5',
    fontSize: 14,
    marginBottom: 8,
    lineHeight: 20,
  },
  errorLabel: {
    fontWeight: 'bold',
    color: '#EF4444',
  },
  diagnosticText: {
    backgroundColor: 'rgba(55, 65, 81, 0.5)',
    borderRadius: 12,
    padding: 16,
  },
  diagnosisItem: {
    color: '#FCD34D',
    fontSize: 14,
    marginBottom: 6,
    lineHeight: 20,
  },
  solutionsContainer: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  solutionItem: {
    color: '#C4B5FD',
    fontSize: 14,
    marginBottom: 8,
    lineHeight: 20,
  },
  retryButton: {
    marginTop: 8,
  },
  retryGradient: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingDiagnosticText: {
    color: '#D1D5DB',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 12,
  },
});
