import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

const StartWorkout = ({ navigation }) => {
  const workoutTypes = [
    {
      id: 1,
      name: 'Squat',
      description: 'Legs and Glutes',
      videoUrl: require('../videos/squat.mp4'),
    },
    {
      id: 2,
      name: 'Plank',
      description: 'Full Body',
      videoUrl: require('../videos/plank.mp4'),
    },
    {
      id: 3,
      name: 'Lunge',
      description: 'Leg Muscles',
      videoUrl: require('../videos/lunge.mp4'),
    },
  ];

  return (
    <LinearGradient colors={['#A95CF1', '#DB6FDF']} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Choose a Workout Type</Text>
      </View>

      {/* Workout Type List */}
      <View style={styles.workoutList}>
        {workoutTypes.map((workout) => (
          <TouchableOpacity
            key={workout.id}
            style={styles.workoutCard}
            onPress={() => navigation.navigate('WorkoutVideo', { workout })} // Pass workout to WorkoutVideo
          >
            <Text style={styles.workoutName}>{workout.name}</Text>
            <Text style={styles.workoutDescription}>{workout.description}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  workoutList: {
    flex: 1,
    marginTop: 20,
  },
  workoutCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    alignItems: 'center',
    elevation: 3,
  },
  workoutName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#A95CF1',
    marginBottom: 5,
  },
  workoutDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});

export default StartWorkout;