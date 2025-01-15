import React, { useEffect, useState } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { Camera, useCameraDevices } from 'react-native-vision-camera';
import { PermissionsAndroid } from 'react-native';

const PoseCamera = () => {
  const [permissionsGranted, setPermissionsGranted] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const devices = useCameraDevices();

  useEffect(() => {
    async function requestPermissions() {
      console.log('[PoseCamera] Requesting camera and microphone permissions...');
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.CAMERA,
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      ]);

      // Check if permissions are granted
      const cameraPermission = granted[PermissionsAndroid.PERMISSIONS.CAMERA];
      const audioPermission = granted[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO];

      if (cameraPermission === PermissionsAndroid.RESULTS.GRANTED && audioPermission === PermissionsAndroid.RESULTS.GRANTED) {
        console.log('[PoseCamera] Permissions granted for both camera and microphone.');
        setPermissionsGranted(true);
      } else {
        // Log which permission was denied
        if (cameraPermission !== PermissionsAndroid.RESULTS.GRANTED) {
          console.warn('[PoseCamera] Camera permission not granted.');
        }
        if (audioPermission !== PermissionsAndroid.RESULTS.GRANTED) {
          console.warn('[PoseCamera] Audio permission not granted.');
        }
        setPermissionsGranted(false);
      }
    }

    requestPermissions();
  }, []);

  useEffect(() => {
    if (permissionsGranted && devices) {
      console.log('[PoseCamera] Available devices:', devices);

      // Select the back camera as default
      const backCamera = devices.back;
      if (backCamera) {
        console.log('[PoseCamera] Back camera selected:', backCamera);
        setSelectedDevice(backCamera);
      } else {
        console.warn('[PoseCamera] No back camera found.');
      }
    }
  }, [permissionsGranted, devices]);

  useEffect(() => {
    initializeCamera();
  }, []);

  async function initializeCamera() {
    try {
      const devices = await Camera.getAvailableCameraDevices();
      console.log('[PoseCamera] Available devices:', devices);

      if (devices.length === 0) {
        console.warn('[PoseCamera] No camera devices found.');
        return;
      }

      // Proceed with camera setup
      const backCamera = devices.find(device => device.position === 'back');
      if (!backCamera) {
        console.warn('[PoseCamera] No back camera found.');
        return;
      }

      // Initialize camera with backCamera
      // ... camera initialization code ...
    } catch (error) {
      console.error('[PoseCamera] Error initializing camera:', error);
    }
  }

  if (!permissionsGranted) {
    return (
      <View style={styles.container}>
        <Text style={styles.warningText}>Permissions not granted. Please enable camera and microphone permissions.</Text>
      </View>
    );
  }

  if (!selectedDevice) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>No camera devices found. Please check your device.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera
        style={StyleSheet.absoluteFill}
        device={selectedDevice}
        isActive={true}
      />
      <View style={styles.overlay}>
        <Text style={styles.infoText}>Camera is active</Text>
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
  loadingText: {
    color: 'white',
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
