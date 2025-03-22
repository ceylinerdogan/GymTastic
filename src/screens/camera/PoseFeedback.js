import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Button, Alert } from 'react-native';
import PoseCamera from './PoseCamera';

const PoseFeedback = ({ navigation }) => {
  const [feedback, setFeedback] = useState('Perfect your posture!');
  const [cameraReady, setCameraReady] = useState(false);

  const sendFrameToBackend = async (frameData) => {
    console.log('[PoseFeedback] Received frame data:', typeof frameData);
    
    try {
      // In a real app, you would send the frame to your backend
      // For now, we'll simulate a response
      const feedbackOptions = [
        'Great posture! Keep it up.',
        'Lower your hips more for proper form.',
        'Keep your back straight.',
        'Perfect form!',
        'Knees should not extend beyond toes.',
      ];
      
      const randomFeedback = feedbackOptions[Math.floor(Math.random() * feedbackOptions.length)];
      setFeedback(randomFeedback);
    } catch (error) {
      console.error('[PoseFeedback] Error processing frame:', error);
    }
  };

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
      <PoseCamera 
        onFrameProcessed={sendFrameToBackend}
        onCameraReady={() => setCameraReady(true)}
        onError={handleCameraError}
      />
      <View style={styles.feedbackContainer}>
        <Text style={styles.feedbackText}>
          {cameraReady ? feedback : 'Initializing camera...'}
        </Text>
        {!cameraReady && (
          <Button
            title="Go Back"
            onPress={() => navigation && navigation.goBack()}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1,
    backgroundColor: '#000',
  },
  feedbackContainer: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 10,
    borderRadius: 10,
    width: '90%',
  },
  feedbackText: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 10,
  },
});

export default PoseFeedback;
