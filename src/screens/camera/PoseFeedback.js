import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import PoseCamera from './PoseCamera';

const PoseFeedback = () => {
  const [feedback, setFeedback] = useState('Perfect your posture!');

  const sendFrameToBackend = async (base64Frame) => {
    try {
      console.log('[PoseFeedback] Sending frame to backend...');
      const response = await fetch('https://your-backend-url/analyze-pose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ frame: base64Frame }),
      });

      const { feedbackMessage } = await response.json();
      console.log('[PoseFeedback] Feedback received:', feedbackMessage);
      setFeedback(feedbackMessage);
    } catch (error) {
      console.error('[PoseFeedback] Error sending frame to backend:', error);
    }
  };

  return (
    <View style={styles.container}>
      <PoseCamera onFrameProcessed={sendFrameToBackend} />
      <View style={styles.feedbackContainer}>
        <Text style={styles.feedbackText}>{feedback}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  feedbackContainer: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 10,
    borderRadius: 10,
  },
  feedbackText: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
  },
});

export default PoseFeedback;
