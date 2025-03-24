import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  FlatList,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Dimensions,
  TextInput,
  Alert
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { workoutService } from '../../services';

const { width } = Dimensions.get('window');

// Mock workout data
const WORKOUT_DATA = {
  categories: [
    { id: 'all', name: 'All Workouts' },
    { id: 'beginner', name: 'Beginner' },
    { id: 'intermediate', name: 'Intermediate' },
    { id: 'advanced', name: 'Advanced' },
    { id: 'strength', name: 'Strength' },
    { id: 'cardio', name: 'Cardio' },
    { id: 'flexibility', name: 'Flexibility' }
  ],
  workouts: [
    {
      id: '1',
      name: 'Full Body Workout',
      description: 'Complete workout targeting all major muscle groups',
      duration: 45,
      level: 'beginner',
      calories: 320,
      image: require('../../../assets/images/squat.png'),
      category: ['beginner', 'strength'],
      exercises: [
        { name: 'Squat', sets: 3, reps: 12, restTime: 60 },
        { name: 'Push-up', sets: 3, reps: 15, restTime: 60 },
        { name: 'Plank', sets: 3, duration: '60s', restTime: 60 },
      ]
    },
    {
      id: '2',
      name: 'Core Blaster',
      description: 'Strengthen your core muscles with this targeted workout',
      duration: 30,
      level: 'intermediate',
      calories: 250,
      image: require('../../../assets/images/plank.png'),
      category: ['intermediate', 'strength'],
      exercises: [
        { name: 'Plank', sets: 3, duration: '60s', restTime: 45 },
        { name: 'Sit-ups', sets: 3, reps: 20, restTime: 45 },
        { name: 'Mountain Climbers', sets: 3, duration: '45s', restTime: 45 },
      ]
    },
    {
      id: '3',
      name: 'Leg Day',
      description: 'Focus on building strong legs with this intense workout',
      duration: 50,
      level: 'advanced',
      calories: 400,
      image: require('../../../assets/images/lunge.jpg'),
      category: ['advanced', 'strength'],
      exercises: [
        { name: 'Squat', sets: 4, reps: 15, restTime: 60 },
        { name: 'Lunge', sets: 3, reps: 12, restTime: 60 },
        { name: 'Calf Raises', sets: 3, reps: 20, restTime: 45 },
      ]
    },
    {
      id: '4',
      name: 'Quick Cardio',
      description: 'Short but effective cardio workout to get your heart pumping',
      duration: 20,
      level: 'beginner',
      calories: 180,
      image: require('../../../assets/images/gym.jpg'),
      category: ['beginner', 'cardio'],
      exercises: [
        { name: 'Jumping Jacks', sets: 3, duration: '45s', restTime: 30 },
        { name: 'High Knees', sets: 3, duration: '30s', restTime: 30 },
        { name: 'Burpees', sets: 2, reps: 10, restTime: 45 },
      ]
    },
    {
      id: '5',
      name: 'Stretching Routine',
      description: 'Improve flexibility and prevent injuries with these stretches',
      duration: 15,
      level: 'beginner',
      calories: 80,
      image: require('../../../assets/images/gym_icon.png'),
      category: ['beginner', 'flexibility'],
      exercises: [
        { name: 'Hamstring Stretch', sets: 2, duration: '30s', restTime: 15 },
        { name: 'Quad Stretch', sets: 2, duration: '30s', restTime: 15 },
        { name: 'Shoulder Stretch', sets: 2, duration: '30s', restTime: 15 },
      ]
    },
    {
      id: '6',
      name: 'HIIT Challenge',
      description: 'High intensity interval training for maximum calorie burn',
      duration: 25,
      level: 'advanced',
      calories: 300,
      image: require('../../../assets/images/main_image.png'),
      category: ['advanced', 'cardio'],
      exercises: [
        { name: 'Burpees', sets: 4, reps: 10, restTime: 30 },
        { name: 'Mountain Climbers', sets: 4, duration: '30s', restTime: 30 },
        { name: 'Jump Squats', sets: 4, reps: 15, restTime: 30 },
      ]
    }
  ]
};

const StartWorkout = ({ navigation }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [filteredWorkouts, setFilteredWorkouts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWorkout, setSelectedWorkout] = useState(null);

  // Load workout data from API
  useEffect(() => {
    const fetchWorkouts = async () => {
      setIsLoading(true);
      
      try {
        const response = await workoutService.getWorkouts();
        
        if (response && response.workouts) {
          setFilteredWorkouts(response.workouts);
        } else {
          // Fallback to mock data if API doesn't return expected format
          console.warn('API did not return expected data format, using fallback data');
          setFilteredWorkouts(WORKOUT_DATA.workouts);
        }
      } catch (error) {
        console.error('Error fetching workouts:', error);
        // Show error message to user
        Alert.alert(
          'Error Loading Workouts',
          'Failed to fetch workouts. Using demo data instead.',
          [{ text: 'OK' }]
        );
        // Use mock data as fallback
        setFilteredWorkouts(WORKOUT_DATA.workouts);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchWorkouts();
  }, []);

  // Filter workouts when category changes
  useEffect(() => {
    // Get source data - either from API or mock data
    const sourceData = filteredWorkouts.length > 0 
      ? filteredWorkouts 
      : WORKOUT_DATA.workouts;
    
    if (selectedCategory === 'all') {
      setFilteredWorkouts(
        searchQuery
          ? sourceData.filter(workout =>
              workout.name.toLowerCase().includes(searchQuery.toLowerCase())
            )
          : sourceData
      );
    } else {
      const filtered = sourceData.filter(workout =>
        workout.category.includes(selectedCategory)
      );
      setFilteredWorkouts(
        searchQuery
          ? filtered.filter(workout =>
              workout.name.toLowerCase().includes(searchQuery.toLowerCase())
            )
          : filtered
      );
    }
  }, [selectedCategory, searchQuery, filteredWorkouts]);

  // Handle search input change
  const handleSearch = (text) => {
    setSearchQuery(text);
  };

  // Handle workout selection
  const handleWorkoutSelect = (workout) => {
    setSelectedWorkout(workout.id === selectedWorkout?.id ? null : workout);
  };

  // Start the selected workout
  const startSelectedWorkout = (exercise) => {
    const selectedExercise = selectedWorkout.exercises.find(ex => ex.name === exercise.name);
    navigation.navigate('WorkoutVideo', {
      workout: {
        name: exercise.name,
        description: `${exercise.sets} sets of ${exercise.reps || exercise.duration}`,
        videoUrl: null
      },
      shouldStartCamera: true
    });
  };

  // Render category item
  const renderCategoryItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.categoryItem,
        selectedCategory === item.id && styles.categoryItemSelected
      ]}
      onPress={() => setSelectedCategory(item.id)}
    >
      <Text
        style={[
          styles.categoryText,
          selectedCategory === item.id && styles.categoryTextSelected
        ]}
      >
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  // Render workout item
  const renderWorkoutItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.workoutItem,
        selectedWorkout?.id === item.id && styles.workoutItemSelected
      ]}
      onPress={() => handleWorkoutSelect(item)}
    >
      <Image source={item.image} style={styles.workoutImage} />
      <View style={styles.workoutContent}>
        <View style={styles.workoutHeader}>
          <Text style={styles.workoutName}>{item.name}</Text>
          <View style={styles.levelBadge}>
            <Text style={styles.levelText}>
              {item.level.charAt(0).toUpperCase() + item.level.slice(1)}
            </Text>
          </View>
        </View>
        <Text style={styles.workoutDescription} numberOfLines={2}>
          {item.description}
        </Text>
        <View style={styles.workoutDetails}>
          <View style={styles.workoutDetail}>
            <Text style={styles.detailValue}>{item.duration}</Text>
            <Text style={styles.detailLabel}>min</Text>
          </View>
          <View style={styles.workoutDetail}>
            <Text style={styles.detailValue}>{item.exercises.length}</Text>
            <Text style={styles.detailLabel}>exercises</Text>
          </View>
          <View style={styles.workoutDetail}>
            <Text style={styles.detailValue}>{item.calories}</Text>
            <Text style={styles.detailLabel}>kcal</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  // Render exercise item
  const renderExerciseItem = ({ item }) => (
    <TouchableOpacity
      style={styles.exerciseItem}
      onPress={() => startSelectedWorkout(item)}
    >
      <View style={styles.exerciseIconContainer}>
        <Text style={styles.exerciseIcon}>
          {item.name.charAt(0).toUpperCase()}
        </Text>
      </View>
      <View style={styles.exerciseContent}>
        <Text style={styles.exerciseName}>{item.name}</Text>
        <Text style={styles.exerciseDetails}>
          {item.sets} sets • {item.reps ? `${item.reps} reps` : item.duration}
        </Text>
      </View>
      <Text style={styles.exerciseArrow}>›</Text>
    </TouchableOpacity>
  );

  return (
    <LinearGradient colors={['#A95CF1', '#DB6FDF']} style={styles.container}>
      <SafeAreaView style={styles.safeContainer}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.loadingText}>Loading workouts...</Text>
          </View>
        ) : (
          <>
            <View style={styles.header}>
              <TouchableOpacity onPress={() => navigation.goBack()}>
                <Text style={styles.backButton}>←</Text>
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Choose Workout</Text>
              <View style={{ width: 30 }} />
            </View>

            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search workouts"
                placeholderTextColor="#999"
                value={searchQuery}
                onChangeText={handleSearch}
              />
            </View>

            <View style={styles.categoriesContainer}>
              <FlatList
                data={WORKOUT_DATA.categories}
                renderItem={renderCategoryItem}
                keyExtractor={(item) => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoriesList}
              />
            </View>

            <View style={styles.mainContent}>
              {selectedWorkout ? (
                <ScrollView style={styles.detailsContainer}>
                  <View style={styles.selectedWorkoutHeader}>
                    <Image
                      source={selectedWorkout.image}
                      style={styles.selectedWorkoutImage}
                    />
                    <View style={styles.selectedWorkoutOverlay}>
                      <TouchableOpacity
                        style={styles.backToList}
                        onPress={() => setSelectedWorkout(null)}
                      >
                        <Text style={styles.backToListText}>← Back</Text>
                      </TouchableOpacity>
                      <Text style={styles.selectedWorkoutName}>
                        {selectedWorkout.name}
                      </Text>
                      <View style={styles.selectedWorkoutStats}>
                        <View style={styles.selectedWorkoutStat}>
                          <Text style={styles.selectedWorkoutStatValue}>
                            {selectedWorkout.duration}
                          </Text>
                          <Text style={styles.selectedWorkoutStatLabel}>
                            min
                          </Text>
                        </View>
                        <View style={styles.selectedWorkoutStat}>
                          <Text style={styles.selectedWorkoutStatValue}>
                            {selectedWorkout.exercises.length}
                          </Text>
                          <Text style={styles.selectedWorkoutStatLabel}>
                            exercises
                          </Text>
                        </View>
                        <View style={styles.selectedWorkoutStat}>
                          <Text style={styles.selectedWorkoutStatValue}>
                            {selectedWorkout.calories}
                          </Text>
                          <Text style={styles.selectedWorkoutStatLabel}>
                            kcal
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  <View style={styles.workoutInfoContainer}>
                    <Text style={styles.workoutInfoTitle}>Description</Text>
                    <Text style={styles.workoutInfoText}>
                      {selectedWorkout.description}
                    </Text>

                    <Text style={styles.exercisesTitle}>Exercises</Text>
                    <FlatList
                      data={selectedWorkout.exercises}
                      renderItem={renderExerciseItem}
                      keyExtractor={(item, index) => `${item.name}-${index}`}
                      scrollEnabled={false}
                    />

                    <TouchableOpacity
                      style={styles.startFullWorkoutButton}
                      onPress={() =>
                        navigation.navigate('WorkoutVideo', {
                          workout: {
                            name: selectedWorkout.exercises[0].name,
                            description: selectedWorkout.description,
                            videoUrl: null
                          },
                          shouldStartCamera: true
                        })
                      }
                    >
                      <Text style={styles.startFullWorkoutText}>
                        Start Full Workout
                      </Text>
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              ) : (
                <FlatList
                  data={filteredWorkouts}
                  renderItem={renderWorkoutItem}
                  keyExtractor={(item) => item.id}
                  contentContainerStyle={styles.workoutsList}
                  showsVerticalScrollIndicator={false}
                  ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                      <Text style={styles.emptyText}>
                        No workouts found for this category.
                      </Text>
                    </View>
                  }
                />
              )}
            </View>
          </>
        )}
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    marginTop: 10,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  backButton: {
    fontSize: 28,
    color: '#fff',
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  searchInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 30,
    paddingHorizontal: 20,
    paddingVertical: 10,
    color: '#fff',
    fontSize: 16,
  },
  categoriesContainer: {
    marginBottom: 10,
  },
  categoriesList: {
    paddingHorizontal: 20,
  },
  categoryItem: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 30,
    marginRight: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  categoryItemSelected: {
    backgroundColor: '#8E44AD',
  },
  categoryText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500',
  },
  categoryTextSelected: {
    color: '#fff',
    fontWeight: 'bold',
  },
  mainContent: {
    flex: 1,
  },
  workoutsList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  workoutItem: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  workoutItemSelected: {
    borderWidth: 2,
    borderColor: '#8E44AD',
  },
  workoutImage: {
    width: '100%',
    height: 120,
    resizeMode: 'cover',
  },
  workoutContent: {
    padding: 15,
  },
  workoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  workoutName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  levelBadge: {
    backgroundColor: '#F2E6FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  levelText: {
    color: '#A95CF1',
    fontSize: 12,
    fontWeight: '500',
  },
  workoutDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  workoutDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  workoutDetail: {
    alignItems: 'center',
  },
  detailValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#A95CF1',
  },
  detailLabel: {
    fontSize: 12,
    color: '#999',
  },
  detailsContainer: {
    flex: 1,
  },
  selectedWorkoutHeader: {
    height: 200,
    position: 'relative',
  },
  selectedWorkoutImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  selectedWorkoutOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  backToList: {
    position: 'absolute',
    top: -160,
    left: 20,
  },
  backToListText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  selectedWorkoutName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  selectedWorkoutStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '80%',
  },
  selectedWorkoutStat: {
    alignItems: 'center',
  },
  selectedWorkoutStatValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  selectedWorkoutStatLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  workoutInfoContainer: {
    padding: 20,
    backgroundColor: '#fff',
    flex: 1,
  },
  workoutInfoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  workoutInfoText: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
    marginBottom: 20,
  },
  exercisesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  exerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  exerciseIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F2E6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  exerciseIcon: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#A95CF1',
  },
  exerciseContent: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  exerciseDetails: {
    fontSize: 14,
    color: '#666',
  },
  exerciseArrow: {
    fontSize: 24,
    color: '#ccc',
  },
  startFullWorkoutButton: {
    backgroundColor: '#A95CF1',
    borderRadius: 30,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  startFullWorkoutText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
  },
});

export default StartWorkout; 