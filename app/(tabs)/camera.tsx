import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
  Modal,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Camera, 
  RotateCcw, 
  Circle, 
  X, 
  Send, 
  Users 
} from 'lucide-react-native';
import NotificationService from '@/lib/notifications';

export default function CameraScreen() {
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  if (!permission) {
    return (
      <View style={styles.permissionContainer}>
        <Camera size={64} color="#8B5CF6" />
        <Text style={styles.permissionText}>Cargando cámara...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Camera size={64} color="#8B5CF6" />
        <Text style={styles.permissionTitle}>Acceso a la Cámara</Text>
        <Text style={styles.permissionText}>
          Necesitamos acceso a tu cámara para compartir fotos con tus amigos
        </Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <LinearGradient
            colors={['#8B5CF6', '#06B6D4']}
            style={styles.permissionGradient}
          >
            <Text style={styles.permissionButtonText}>Permitir Acceso</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  }

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: false,
        });
        setCapturedPhoto(photo.uri);
        setShowPreview(true);
      } catch (error) {
        Alert.alert('Error', 'No se pudo tomar la foto');
      }
    }
  };

  const sendPhoto = () => {
    setShowPreview(false);
    setCapturedPhoto(null);
    
    // Send notification to group members
    const notificationService = NotificationService.getInstance();
    notificationService.addNotification({
      groupId: '1',
      groupName: 'Grupo Aventureros',
      senderName: 'Tú',
      type: 'photo',
    });
    
    Alert.alert('¡Enviado!', 'Tu foto ha sido compartida con el grupo');
  };

  const discardPhoto = () => {
    setShowPreview(false);
    setCapturedPhoto(null);
  };

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={facing}
      >
        <View style={styles.cameraOverlay}>
          <View style={styles.topControls}>
            <Text style={styles.groupName}>Grupo Aventureros</Text>
            <View style={styles.streakInfo}>
              <Text style={styles.streakText}>🔥 7 días</Text>
            </View>
          </View>

          <View style={styles.bottomControls}>
            <TouchableOpacity
              style={styles.groupButton}
              onPress={() => Alert.alert('Grupos', 'Seleccionar grupo para enviar')}
            >
              <Users size={24} color="white" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.captureButton}
              onPress={takePicture}
            >
              <View style={styles.captureButtonInner}>
                <Circle size={64} color="white" strokeWidth={4} />
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.flipButton}
              onPress={toggleCameraFacing}
            >
              <RotateCcw size={24} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </CameraView>

      <Modal
        visible={showPreview}
        animationType="slide"
        statusBarTranslucent
      >
        <View style={styles.previewContainer}>
          {capturedPhoto && (
            <Image
              source={{ uri: capturedPhoto }}
              style={styles.previewImage}
            />
          )}
          
          <View style={styles.previewControls}>
            <TouchableOpacity
              style={styles.previewButton}
              onPress={discardPhoto}
            >
              <X size={24} color="white" />
              <Text style={styles.previewButtonText}>Descartar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.previewButton}
              onPress={sendPhoto}
            >
              <LinearGradient
                colors={['#8B5CF6', '#06B6D4']}
                style={styles.sendButtonGradient}
              >
                <Send size={20} color="white" />
                <Text style={styles.sendButtonText}>Enviar</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#111827',
    paddingHorizontal: 40,
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 20,
    marginBottom: 10,
  },
  permissionText: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  permissionButton: {
    marginTop: 20,
  },
  permissionGradient: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 25,
  },
  permissionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    justifyContent: 'space-between',
  },
  topControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  groupName: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  streakInfo: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  streakText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  bottomControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingBottom: 50,
  },
  groupButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonInner: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  flipButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewContainer: {
    flex: 1,
    backgroundColor: 'black',
  },
  previewImage: {
    flex: 1,
    width: '100%',
  },
  previewControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  previewButton: {
    alignItems: 'center',
  },
  previewButtonText: {
    color: 'white',
    fontSize: 14,
    marginTop: 8,
  },
  sendButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  sendButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});