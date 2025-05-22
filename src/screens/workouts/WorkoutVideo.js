import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, SafeAreaView } from 'react-native';
import Video from 'react-native-video'; 

// Mapping of workout names to video sources
const videoSources = {
  squat: require('../../../assets/videos/squat.mp4'),
  lunge: require('../../../assets/videos/lunge.mp4'),
  plank: require('../../../assets/videos/plank.mp4'),
};

const WorkoutVideo = ({ route, navigation }) => {
  const { workout } = route.params;
  const videoKey = workout.name.toLowerCase();
  const videoSource = videoSources[videoKey];
  
  return (
    <SafeAreaView style={styles.container}>
      {/* Workout Title */}
      <Text style={styles.title}>{workout.name} Workout</Text>

      {/* Workout Video/Image */}
      <View style={styles.videoContainer}>
        <Video
          source={videoSource}
          style={styles.video}
          resizeMode="cover"
          repeat
          controls
        />
      </View>

      {/* Workout Description */}
      <Text style={styles.description}>Legs and Glutes</Text>
      
      {/* Start Pose Detection Button */}
      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('PoseFeedback')}
      >
        <Text style={styles.buttonText}>Start Pose Detection</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f8f8f8',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#A95CF1',
    textAlign: 'center',
    marginVertical: 20,
  },
  videoContainer: {
    width: '100%',
    height: 400,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#000',
    marginBottom: 20,
  },
  video: {
    width: '100%',
    height: '100%',
  },
  description: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  button: {
    backgroundColor: '#A95CF1',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default WorkoutVideo;
