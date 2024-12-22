import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

const MainScreen = ({ route, navigation }) => {
  const { name = 'Ecem', surname = 'Kaynar' } = route.params || {};

  return (
    <LinearGradient colors={['#A95CF1', '#DB6FDF']} style={styles.container}>
      {/* Welcome Section */}
      <View style={styles.header}>
        <Text style={styles.greeting}>Hi, {name} {surname}</Text>
        <Text style={styles.subtitle}>Let's check your activity</Text>
      </View>

      {/* Statistics Section */}
      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>5</Text>
          <Text style={styles.statLabel}>Completed Workouts</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>1</Text>
          <Text style={styles.statLabel}>Workouts in Progress</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>30</Text>
          <Text style={styles.statLabel}>Minutes Spent</Text>
        </View>
      </View>

      {/* Discover New Workouts Section */}
      <View style={styles.workoutsContainer}>
        <TouchableOpacity style={styles.workoutCard}>
          <Image source={require('../../../assets/images/squat.png')} style={styles.workoutImage} />
          <Text style={styles.workoutTitle}>Squat</Text>
          <Text style={styles.workoutDetails}>10 Reps • 3 Sets</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.workoutCard}>
          <Image source={require('../../../assets/images/plank.png')} style={styles.workoutImage} />
          <Text style={styles.workoutTitle}>Plank</Text>
          <Text style={styles.workoutDetails}>Hold for 60s • 3 Sets</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.workoutCard}>
          <Image source={require('../../../assets/images/lunge.jpg')} style={styles.workoutImage} />
          <Text style={styles.workoutTitle}>Lunge</Text>
          <Text style={styles.workoutDetails}>10 Reps • 3 Sets</Text>
        </TouchableOpacity>
      </View>

      {/* Main Image with Start Workout Button */}
      <View style={styles.mainImageContainer}>
        <Image
          source={require('../../../assets/images/main_image2.png')} // Replace with your main image
          style={styles.mainImage}
        />
        <TouchableOpacity
          style={styles.startWorkoutButton}
          onPress={() => navigation.navigate('StartWorkout')}
        >
          <Text style={styles.startWorkoutText}>Start Workout</Text>
        </TouchableOpacity>
      </View>

      {/* Progress Section */}
      <View style={styles.progressContainer}>
        <Text style={styles.progressText}>
          Keep the progress! You're improving every day!
        </Text>
      </View>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity onPress={() => navigation.navigate('Main')}>
          <Text style={styles.navText}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('WorkoutsScreen')}>
          <Text style={styles.navText}>Workouts</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('WorkoutHistory')}>
          <Text style={styles.navText}>History</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
          <Text style={styles.navText}>Profile</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  header: {
    marginBottom: 20,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 18,
    color: '#fff',
    marginTop: 5,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 20,
  },
  statBox: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#A95CF1',
  },
  statLabel: {
    fontSize: 12,
    color: '#333',
    textAlign: 'center',
    marginTop: 5,
  },
  workoutsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  workoutCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    width: '30%', // Adjust the width to make all cards equal
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    height: 130, // Fixed height for consistency
  },
  workoutImage: {
    width: 50,
    height: 50,
    marginBottom: 10,
  },
  workoutTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  workoutDetails: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  mainImageContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    alignItems: 'center',
    padding: 15,
    marginTop: 30,
    marginBottom: 20,
  },
  mainImage: {
    width: '80%',
    height: 150,
    resizeMode: 'contain',
    marginBottom: 10,
  },
  startWorkoutButton: {
    backgroundColor: '#8E44AD',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 100,
  },
  startWorkoutText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
  },
  progressContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginBottom: 20,
  },
  progressText: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    backgroundColor: '#8E44AD',
    borderRadius: 25,
    position: 'absolute',
    bottom: 10,
    left: 10,
    right: 10,
  },
  navText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default MainScreen;
