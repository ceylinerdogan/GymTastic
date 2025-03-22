import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import PoseCamera from './PoseCamera';

const PoseFeedback = ({ navigation }) => {
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
        onError={handleCameraError}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1,
    backgroundColor: '#000',
  },
});

export default PoseFeedback;
