import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, Button, StyleSheet, Platform } from 'react-native';
import { Camera, useCameraDevices } from 'react-native-vision-camera';

const PoseCamera = ({ onFrameProcessed, onCameraReady, onError }) => {
  const [hasPermission, setHasPermission] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [isEmulator, setIsEmulator] = useState(false);
  const [loading, setLoading] = useState(true);
  const devices = useCameraDevices();
  const cameraRef = useRef(null);
  const initTimeoutRef = useRef(null);

  // Check if running on an emulator
  useEffect(() => {
    try {
      // Check common emulator characteristics
      const isEmu = Platform.OS === 'android' && (
        Platform.constants.Brand?.includes('google') ||
        Platform.constants.Model?.includes('sdk') ||
        Platform.constants.Model?.includes('Emulator') ||
        Platform.constants.Model?.includes('Android SDK')
      );
      
      setIsEmulator(isEmu);
      
      // If it's an emulator, we'll notify readiness right away
      if (isEmu && onCameraReady) {
        setTimeout(() => {
          console.log('[PoseCamera] Emulator detected, simulating camera ready');
          onCameraReady();
        }, 500);
      }
    } catch (error) {
      console.error('[PoseCamera] Error detecting emulator:', error);
    }
  }, [onCameraReady]);

  // Request camera permissions
  useEffect(() => {
    if (isEmulator) return;
    
    (async () => {
      try {
        console.log('[PoseCamera] Requesting camera permission');
        const status = await Camera.requestCameraPermission();
        console.log('[PoseCamera] Camera permission status:', status);
        setHasPermission(status === 'granted');
        
        if (status === 'granted' && onCameraReady) {
          // Only call onCameraReady if we also have a device available
          if (devices.back || devices.front) {
            console.log('[PoseCamera] Camera ready with permission and device');
            onCameraReady();
          }
        } else if (status !== 'granted' && onError) {
          onError(new Error('Camera permission not granted'));
        }
      } catch (err) {
        console.error('[PoseCamera] Error requesting permission:', err);
        if (onError) onError(err);
      }
    })();
  }, [isEmulator, devices, onCameraReady, onError]);

  // Setup simulation for emulators
  useEffect(() => {
    if (!isEmulator || !onFrameProcessed) return;
    
    console.log('[PoseCamera] Setting up emulator simulation');
    const interval = setInterval(() => {
      onFrameProcessed('emulator_dummy_frame');
    }, 2000);
    
    return () => clearInterval(interval);
  }, [isEmulator, onFrameProcessed]);

  // Handle camera device loading timeout
  useEffect(() => {
    if (isEmulator) return;
    
    // Set a timeout to prevent infinite loading state
    initTimeoutRef.current = setTimeout(() => {
      console.log('[PoseCamera] Camera initialization timed out');
      setLoading(false);
      if (!devices.back && !devices.front && onError) {
        onError(new Error('No camera device detected'));
      }
    }, 10000); // 10 seconds timeout
    
    return () => {
      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current);
      }
    };
  }, [isEmulator, devices, onError]);

  // Effect to detect when camera devices become available
  useEffect(() => {
    if (isEmulator) return;
    
    if (devices.back || devices.front) {
      console.log('[PoseCamera] Camera device available:', 
        devices.back ? 'back' : 'front');
      setLoading(false);
      
      // Clear timeout as device is now available
      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current);
      }
    }
  }, [isEmulator, devices]);

  // Take photo and process it
  const takePhoto = useCallback(async () => {
    if (!cameraRef.current) {
      console.log('[PoseCamera] Camera ref not available');
      return;
    }
    
    try {
      console.log('[PoseCamera] Taking photo');
      const photo = await cameraRef.current.takePhoto({
        flash: 'off',
      });
      console.log('[PoseCamera] Photo taken:', photo.path);
      if (onFrameProcessed) onFrameProcessed(photo.path);
    } catch (err) {
      console.error('[PoseCamera] Error taking photo:', err);
    }
  }, [onFrameProcessed]);

  // Take photos periodically
  useEffect(() => {
    if (!hasPermission || !isActive || isEmulator) return;
    
    const cameraDevice = devices.back || devices.front;
    if (!cameraDevice) {
      console.log('[PoseCamera] No camera device available for photo interval');
      return;
    }
    
    console.log('[PoseCamera] Starting photo interval');
    const interval = setInterval(takePhoto, 2000);
    return () => {
      console.log('[PoseCamera] Clearing photo interval');
      clearInterval(interval);
    };
  }, [devices, hasPermission, isActive, takePhoto, isEmulator]);

  // Show permission request UI
  if (!isEmulator && !hasPermission) {
    return (
      <View style={styles.container}>
        <Text style={styles.warningText}>Camera permission is required</Text>
        <Button 
          title="Grant Camera Permission" 
          onPress={async () => {
            try {
              const status = await Camera.requestCameraPermission();
              setHasPermission(status === 'granted');
            } catch (err) {
              console.error('[PoseCamera] Error:', err);
            }
          }} 
        />
      </View>
    );
  }

  // Show loading state while waiting for camera
  if (!isEmulator && loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Initializing camera...</Text>
      </View>
    );
  }

  // Show error state if no camera is available after loading
  if (!isEmulator && !loading && !devices.back && !devices.front) {
    return (
      <View style={styles.container}>
        <Text style={styles.warningText}>No camera detected</Text>
        <Text style={styles.loadingText}>Please restart the app or check your device</Text>
      </View>
    );
  }

  // Show mock camera for emulators
  if (isEmulator) {
    return (
      <View style={styles.container}>
        <View style={styles.mockCamera}>
          <Text style={styles.mockCameraText}>Camera Preview</Text>
          <Text style={styles.mockCameraSubtext}>(Emulator detected)</Text>
        </View>
      </View>
    );
  }

  // Determine which camera to use (prefer back, fallback to front)
  const cameraDevice = devices.back || devices.front;
  
  // Real camera view
  return (
    <View style={styles.container}>
      {cameraDevice && (
        <Camera
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          device={cameraDevice}
          isActive={isActive}
          photo={true}
        />
      )}
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
  },
  loadingText: {
    color: 'white',
    fontSize: 18,
    textAlign: 'center',
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
