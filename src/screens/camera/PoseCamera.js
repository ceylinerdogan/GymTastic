import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, Button, StyleSheet, Platform, Alert, ActivityIndicator } from 'react-native';
import { Camera, useCameraDevices } from 'react-native-vision-camera';

const PoseCamera = ({ onFrameProcessed, onCameraReady, onError }) => {
  const [hasPermission, setHasPermission] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [isEmulator, setIsEmulator] = useState(false);
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const devices = useCameraDevices();
  const cameraRef = useRef(null);

  // Set a timeout for camera device loading
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (!devices.back && !devices.front) {
        console.log('[PoseCamera] Camera devices loading timeout reached');
        setLoadingTimeout(true);
        // Notify ready anyway after timeout to prevent app from hanging
        if (onCameraReady) {
          onCameraReady();
        }
      }
    }, 10000); // 10 seconds timeout

    return () => clearTimeout(timeoutId);
  }, [devices, onCameraReady]);

  // Debug logging for devices
  useEffect(() => {
    console.log('[PoseCamera] Available devices:', JSON.stringify(devices));
    if (devices.back) {
      console.log('[PoseCamera] Back camera available');
    } else {
      console.log('[PoseCamera] Back camera NOT available');
    }
    if (devices.front) {
      console.log('[PoseCamera] Front camera available');
    } else {
      console.log('[PoseCamera] Front camera NOT available');
    }
  }, [devices]);

  // Check if running on an emulator
  useEffect(() => {
    const checkIfEmulator = async () => {
      try {
        // Check common emulator characteristics
        const isEmu = Platform.OS === 'android' && (
          Platform.constants.Brand?.includes('google') ||
          Platform.constants.Model?.includes('sdk') ||
          Platform.constants.Model?.includes('Emulator') ||
          Platform.constants.Model?.includes('Android SDK')
        );
        
        console.log('[PoseCamera] Is emulator:', isEmu);
        console.log('[PoseCamera] Device info:', JSON.stringify(Platform.constants));
        setIsEmulator(isEmu);
        
        // If it's an emulator, we'll notify readiness right away
        if (isEmu && onCameraReady) {
          setTimeout(() => onCameraReady(), 500);
        }
      } catch (error) {
        console.error('[PoseCamera] Error checking emulator:', error);
      }
    };
    
    checkIfEmulator();
  }, [onCameraReady]);

  // Request camera permissions
  useEffect(() => {
    (async () => {
      if (isEmulator) return;
      
      try {
        console.log('[PoseCamera] Requesting camera permission...');
        const status = await Camera.requestCameraPermission();
        console.log('[PoseCamera] Camera permission status:', status);
        setHasPermission(status === 'granted');
        
        if (status === 'granted' && onCameraReady) {
          console.log('[PoseCamera] Camera ready callback triggered');
          onCameraReady();
        } else if (status !== 'granted' && onError) {
          const error = new Error('Camera permission not granted');
          console.error('[PoseCamera] Permission error:', error);
          onError(error);
        }
      } catch (err) {
        console.error('[PoseCamera] Error requesting permission:', err);
        if (onError) onError(err);
      }
    })();
  }, [isEmulator, onCameraReady, onError]);

  // Take photo and process it
  const takePhoto = useCallback(async () => {
    if (!cameraRef.current || isEmulator) return;
    
    try {
      console.log('[PoseCamera] Taking photo...');
      const photo = await cameraRef.current.takePhoto({
        flash: 'off',
      });
      console.log('[PoseCamera] Photo taken:', photo.path);
      if (onFrameProcessed) onFrameProcessed(photo.path);
    } catch (err) {
      console.error('[PoseCamera] Error taking photo:', err);
    }
  }, [isEmulator, onFrameProcessed]);

  // Take photos periodically
  useEffect(() => {
    // Check if we have any camera device available
    const cameraDevice = devices.back || devices.front;
    
    if (isEmulator || !cameraDevice || !hasPermission || !isActive) {
      console.log('[PoseCamera] Photo interval not set. Emulator:', isEmulator, 
                  'Device available:', !!cameraDevice, 
                  'Has permission:', hasPermission,
                  'Is active:', isActive);
      return;
    }
    
    console.log('[PoseCamera] Setting up photo interval');
    const interval = setInterval(takePhoto, 2000);
    return () => clearInterval(interval);
  }, [isEmulator, devices, hasPermission, isActive, takePhoto]);

  // Simulate frame processing for emulators or fallback
  useEffect(() => {
    if ((!isEmulator && !loadingTimeout) || !onFrameProcessed) return;
    
    console.log('[PoseCamera] Setting up simulation for emulator or fallback mode');
    const interval = setInterval(() => {
      console.log('[PoseCamera] Simulating frame processing');
      onFrameProcessed('simulated_dummy_frame');
    }, 2000);
    
    return () => clearInterval(interval);
  }, [isEmulator, loadingTimeout, onFrameProcessed]);

  // Show permission request UI
  if (!isEmulator && !hasPermission) {
    console.log('[PoseCamera] Rendering permission request UI');
    return (
      <View style={styles.container}>
        <Text style={styles.warningText}>Camera permission is required for pose analysis</Text>
        <Button 
          title="Grant Camera Permission" 
          onPress={async () => {
            const status = await Camera.requestCameraPermission();
            setHasPermission(status === 'granted');
          }} 
        />
      </View>
    );
  }

  // Show loading state while waiting for camera
  if (!isEmulator && !devices.back && !devices.front && !loadingTimeout) {
    console.log('[PoseCamera] Rendering loading UI - No cameras available');
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#FFFFFF" style={styles.loader} />
        <Text style={styles.loadingText}>Initializing camera...</Text>
      </View>
    );
  }

  // Show fallback UI if camera initialization times out
  if (!isEmulator && loadingTimeout) {
    console.log('[PoseCamera] Rendering fallback UI due to camera initialization timeout');
    return (
      <View style={styles.container}>
        <View style={styles.mockCamera}>
          <Text style={styles.mockCameraText}>Camera Preview</Text>
          <Text style={styles.mockCameraSubtext}>(Camera unavailable - using fallback)</Text>
        </View>
        <View style={styles.overlay}>
          <Text style={styles.infoText}>Pose Detection Active</Text>
          <Text style={styles.infoSubtext}>Using simulated data</Text>
        </View>
      </View>
    );
  }

  // Show mock camera for emulators
  if (isEmulator) {
    console.log('[PoseCamera] Rendering emulator mock UI');
    return (
      <View style={styles.container}>
        <View style={styles.mockCamera}>
          <Text style={styles.mockCameraText}>Camera Preview</Text>
          <Text style={styles.mockCameraSubtext}>(Emulator detected - using mock camera)</Text>
        </View>
        <View style={styles.overlay}>
          <Text style={styles.infoText}>Mock Camera Active</Text>
        </View>
      </View>
    );
  }

  // Determine which camera to use (prefer back, fallback to front)
  const cameraDevice = devices.back || devices.front;
  
  // Real camera view
  console.log('[PoseCamera] Rendering camera view with device:', cameraDevice ? 'available' : 'unavailable');
  return (
    <View style={styles.container}>
      {cameraDevice && (
        <Camera
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          device={cameraDevice}
          isActive={isActive}
          photo={true}
          enableZoomGesture={false}
        />
      )}
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
    margin: 20,
    marginBottom: 30,
  },
  loadingText: {
    color: 'white',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 15,
  },
  loader: {
    marginBottom: 10,
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
  infoSubtext: {
    color: '#ccc',
    fontSize: 14,
    marginTop: 5,
  },
  mockCamera: {
    flex: 1,
    width: '100%',
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mockCameraText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  mockCameraSubtext: {
    color: '#aaa',
    fontSize: 14,
    marginTop: 10,
  },
});

export default PoseCamera;
