import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Image, ScrollView, Dimensions } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

const StartWorkout = ({ navigation }) => {
  const workoutTypes = [
    {
      id: 1,
      name: 'Squat',
      description: 'Legs and Glutes',
      videoUrl: require('../videos/squat.mp4'),
      image: require('../../../assets/images/squat.png'),
      benefits: 'Builds lower body strength',
    },
    {
      id: 2,
      name: 'Plank',
      description: 'Full Body',
      videoUrl: require('../videos/plank.mp4'),
      image: require('../../../assets/images/plank.png'),
      benefits: 'Improves core stability',
    },
    {
      id: 3,
      name: 'Lunge',
      description: 'Leg Muscles',
      videoUrl: require('../videos/lunge.mp4'),
      image: require('../../../assets/images/lunge.jpg'),
      benefits: 'Enhances balance and coordination',
    },
  ];

  return (
    <LinearGradient colors={['#A95CF1', '#DB6FDF']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Banner Image */}
          <View style={styles.bannerContainer}>
            <Image 
              source={require('../../../assets/images/gym.jpg')} 
              style={styles.bannerImage}
              resizeMode="cover"
            />
            <View style={styles.bannerOverlay}>
              <Text style={styles.title}>Choose a Workout Type</Text>
            </View>
          </View>

          {/* Workout Type List */}
          <View style={styles.workoutList}>
            {workoutTypes.map((workout) => (
              <TouchableOpacity
                key={workout.id}
                style={styles.workoutCard}
                onPress={() => navigation.navigate('WorkoutVideo', { workout })}
              >
                <View style={styles.workoutCardContent}>
                  <View style={styles.workoutTextContainer}>
                    <Text style={styles.workoutName}>{workout.name}</Text>
                    <Text style={styles.workoutDescription}>{workout.description}</Text>
                    <Text style={styles.workoutBenefits}>{workout.benefits}</Text>
                    <View style={styles.startButtonContainer}>
                      <Text style={styles.startButton}>START →</Text>
                    </View>
                  </View>
                  <View style={styles.workoutImageContainer}>
                    <Image source={workout.image} style={styles.workoutImage} />
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
          
          {/* Add space at the bottom for tab navigation */}
          <View style={{ height: 20 }} />
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  bannerContainer: {
    height: 180,
    position: 'relative',
    marginBottom: 20,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  bannerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 5,
  },
  workoutList: {
    paddingHorizontal: 20,
  },
  workoutCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    overflow: 'hidden',
  },
  workoutCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  workoutTextContainer: {
    flex: 1,
    padding: 20,
  },
  workoutName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#8E44AD',
    marginBottom: 6,
  },
  workoutDescription: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  workoutBenefits: {
    fontSize: 14,
    color: '#888',
    fontStyle: 'italic',
    marginBottom: 12,
  },
  startButtonContainer: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(169, 92, 241, 0.15)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  startButton: {
    color: '#8E44AD',
    fontWeight: 'bold',
    fontSize: 14,
  },
  workoutImageContainer: {
    width: 120,
    height: 120,
    backgroundColor: 'rgba(169, 92, 241, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderTopLeftRadius: 60,
    borderBottomLeftRadius: 60,
  },
  workoutImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
});

export default StartWorkout;
