import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Video from 'react-native-video'; // Import Video from react-native-video

const WorkoutVideo = ({ route }) => {
  const { workout } = route.params; // Retrieve workout from navigation parameters

  return (
    <View style={styles.container}>
      {/* Workout Title */}
      <Text style={styles.title}>{workout.name} Workout</Text>

      {/* Workout Video */}
      <Video
        source={workout.videoUrl} // Use the videoUrl passed from StartWorkout
        style={styles.video}
        controls // Enable default video controls (play, pause, etc.)
        resizeMode="contain" // Maintain aspect ratio within container
        paused={false} // Start playing automatically
      />

      {/* Workout Description */}
      <Text style={styles.description}>{workout.description}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f8f8f8',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#A95CF1',
    textAlign: 'center',
    marginBottom: 20,
  },
  video: {
    width: '100%',
    height: 300,
    backgroundColor: '#000',
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
  },
});

export default WorkoutVideo;