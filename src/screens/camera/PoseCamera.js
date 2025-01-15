import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, PermissionsAndroid, Platform } from 'react-native';
import { Camera, useCameraDevice } from 'react-native-vision-camera';
import { useFrameProcessor } from 'react-native-vision-camera';
import runOnJS from 'react-native-reanimated';

const PoseCamera = () => {
  const [cameraPermission, setCameraPermission] = useState(false);
  const device = useCameraDevice('front');
  // const frameProcessor = useFrameProcessor((frame) => {
  //   'worklet'
  //   console.log(`Frame: ${frame.width}x${frame.height} (${frame.pixelFormat})`)
  // }, [])

  useEffect(() => {
    const requestPermissions = async () => {
      let hasPermission = false;

      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'Kamera İzni Gerekli',
            message: 'Bu uygulama kameraya erişim gerektiriyor.',
            buttonNeutral: 'Daha Sonra',
            buttonNegative: 'İptal',
            buttonPositive: 'Tamam',
          }
        );
        hasPermission = granted === PermissionsAndroid.RESULTS.GRANTED;
      } else {
        const status = await Camera.requestCameraPermission();
        hasPermission = status === 'authorized';
      }

      setCameraPermission(hasPermission);
    };

    requestPermissions();
  }, []);

  if (!cameraPermission) {
    return (
      <View style={styles.container}>
        <Text style={styles.warningText}>Kamera izni verilmedi. Lütfen izin verin.</Text>
      </View>
    );
  }

  if (!device) {
    return (
      <View style={styles.container}>
        <Text style={styles.warningText}>Kamera bulunamadı veya yükleniyor...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera 
        style={StyleSheet.absoluteFill} 
        device={device} 
        isActive={true} 
        // frameProcessor={frameProcessor}
        // frameProcessorFps={5}
        />
      <View style={styles.overlay}>
        <Text style={styles.infoText}>Kamera Aktif</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  warningText: {
    color: 'red',
    fontSize: 18,
    textAlign: 'center',
  },
  overlay: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  infoText: {
    color: 'white',
    fontSize: 18,
  },
});

export default PoseCamera;