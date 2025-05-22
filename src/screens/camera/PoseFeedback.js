import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, Text, ActivityIndicator } from 'react-native';
import PoseCamera from './PoseCamera';
import socketService from '../../services/socketService';

const PoseFeedback = ({ navigation, route }) => {
  // Get exercise type from route params or default to 'squat'
  const exerciseType = route.params?.exerciseType || 'squat';
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  
  useEffect(() => {
    // Check server connection status
    const checkConnection = async () => {
      try {
        setConnectionStatus('connecting');
        const socket = socketService.initSocket();
        const connected = socketService.isSocketConnected();
        
        if (!connected) {
          // Try to authenticate
          const authSuccess = await socketService.authenticateSocket();
          if (authSuccess) {
            setConnectionStatus('connected');
          } else {
            setConnectionStatus('error');
          }
        } else {
          setConnectionStatus('connected');
        }
      } catch (error) {
        console.error('[PoseFeedback] Connection error:', error);
        setConnectionStatus('error');
      }
    };
    
    checkConnection();
    
    // Show information alert when the screen loads
    Alert.alert(
      "Real-time Pose Analysis",
      "This feature requires a stable connection to the backend server. Your poses will be analyzed in real-time using the backend's pose detection model. Please ensure you're visible in the camera frame.",
      [
        { text: "Continue", style: "default" }
      ]
    );
    
    return () => {
      // Cleanup if needed
    };
  }, []);
  
  // Handle camera errors
  const handleCameraError = (error) => {
    console.error('[PoseFeedback] Camera error:', error);
    Alert.alert(
      "Camera Error",
      "There was a problem with the camera. Please try again or use a different device.",
      [{ text: "OK", onPress: () => navigation && navigation.goBack() }]
    );
  };

  return (
    <View style={styles.container}>
      {connectionStatus === 'error' && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>
            Connection error - Please verify the backend server is running and accessible at {socketService.getServerInfo().url}
          </Text>
        </View>
      )}
      
      {connectionStatus === 'connecting' && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.loadingText}>Connecting to pose detection backend...</Text>
          <Text style={styles.subText}>Landmarks will appear when connection is established</Text>
        </View>
      )}
      
      <PoseCamera 
        exerciseType={exerciseType}
        onError={handleCameraError}
        navigation={navigation}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1,
    backgroundColor: '#000',
  },
  errorBanner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 0, 0, 0.7)',
    padding: 10,
    zIndex: 1000,
  },
  errorText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  loadingText: {
    color: 'white',
    marginTop: 10,
    fontSize: 16,
  },
  subText: {
    color: 'white',
    marginTop: 10,
    fontSize: 14,
  }
});

export default PoseFeedback;
