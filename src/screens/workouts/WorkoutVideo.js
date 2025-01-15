import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Video from 'react-native-video'; 

const WorkoutVideo = ({ route,navigation }) => {
  const { workout } = route.params;
  return (
    <View style={styles.container}>
      {/* Workout Title */}
      <Text style={styles.title}>{workout.name} Workout</Text>

      {/* Workout Video */}
      <Video
        source={workout.videoUrl}
        style={styles.video}
        controls
        resizeMode="contain"
        paused={false}
      />

      {/* Workout Description */}
      <Text style={styles.description}>{workout.description}</Text>
       {/* Start Pose Detection Button */}
       <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('PoseFeedback')}
      >
        <Text style={styles.buttonText}>Start Pose Detection</Text>
      </TouchableOpacity>
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
  button: {
    backgroundColor: '#8E44AD',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default WorkoutVideo;
