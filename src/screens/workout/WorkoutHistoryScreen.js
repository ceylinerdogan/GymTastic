import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Image,
  FlatList,
  ActivityIndicator,
  TextInput
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

// Mock workout history data
const WORKOUT_HISTORY = [
  {
    id: '1',
    name: 'Full Body Workout',
    date: '2023-06-15',
    duration: 45,
    calories: 320,
    exercises: [
      { name: 'Squat', sets: 3, reps: 12, weight: '60kg' },
      { name: 'Push-up', sets: 3, reps: 15, weight: 'Body' },
      { name: 'Plank', sets: 3, duration: '60s', weight: 'Body' },
    ],
    completed: true,
    intensity: 'High',
    image: require('../../../assets/images/squat.png')
  },
  {
    id: '2',
    name: 'Upper Body Focus',
    date: '2023-06-12',
    duration: 35,
    calories: 250,
    exercises: [
      { name: 'Push-up', sets: 4, reps: 12, weight: 'Body' },
      { name: 'Dumbbell Curl', sets: 3, reps: 10, weight: '8kg' },
    ],
    completed: true,
    intensity: 'Medium',
    image: require('../../../assets/images/plank.png')
  },
  {
    id: '3',
    name: 'Leg Day',
    date: '2023-06-10',
    duration: 50,
    calories: 380,
    exercises: [
      { name: 'Squat', sets: 4, reps: 15, weight: '50kg' },
      { name: 'Lunge', sets: 3, reps: 12, weight: '30kg' },
    ],
    completed: true,
    intensity: 'High',
    image: require('../../../assets/images/lunge.jpg')
  },
  {
    id: '4',
    name: 'Core Strength',
    date: '2023-06-08',
    duration: 30,
    calories: 210,
    exercises: [
      { name: 'Plank', sets: 3, duration: '60s', weight: 'Body' },
      { name: 'Sit-ups', sets: 3, reps: 20, weight: 'Body' },
    ],
    completed: true,
    intensity: 'Medium',
    image: require('../../../assets/images/plank.png')
  },
  {
    id: '5',
    name: 'Full Body Workout',
    date: '2023-06-05',
    duration: 45,
    calories: 340,
    exercises: [
      { name: 'Squat', sets: 3, reps: 12, weight: '55kg' },
      { name: 'Push-up', sets: 3, reps: 15, weight: 'Body' },
      { name: 'Plank', sets: 3, duration: '60s', weight: 'Body' },
    ],
    completed: true,
    intensity: 'High',
    image: require('../../../assets/images/squat.png')
  },
];

const WorkoutHistoryScreen = ({ navigation }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [workouts, setWorkouts] = useState([]);
  const [filteredWorkouts, setFilteredWorkouts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedWorkout, setSelectedWorkout] = useState(null);
  
  // Stats derived from workout data
  const [stats, setStats] = useState({
    totalWorkouts: 0,
    totalCalories: 0,
    totalDuration: 0,
    averageIntensity: '',
    mostFrequentWorkout: '',
  });
  
  useEffect(() => {
    // Simulate data loading
    setTimeout(() => {
      setWorkouts(WORKOUT_HISTORY);
      setFilteredWorkouts(WORKOUT_HISTORY);
      calculateStats(WORKOUT_HISTORY);
      setIsLoading(false);
    }, 1000);
  }, []);
  
  // Calculate workout stats
  const calculateStats = (workouts) => {
    const totalWorkouts = workouts.length;
    const totalCalories = workouts.reduce((sum, workout) => sum + workout.calories, 0);
    const totalDuration = workouts.reduce((sum, workout) => sum + workout.duration, 0);
    
    // Calculate most frequent workout
    const workoutCounts = {};
    workouts.forEach(workout => {
      workoutCounts[workout.name] = (workoutCounts[workout.name] || 0) + 1;
    });
    
    let mostFrequentWorkout = '';
    let maxCount = 0;
    Object.keys(workoutCounts).forEach(name => {
      if (workoutCounts[name] > maxCount) {
        maxCount = workoutCounts[name];
        mostFrequentWorkout = name;
      }
    });
    
    // Calculate average intensity
    const intensityMap = { 'Low': 1, 'Medium': 2, 'High': 3 };
    const totalIntensity = workouts.reduce((sum, workout) => sum + intensityMap[workout.intensity], 0);
    const avgIntensity = totalIntensity / totalWorkouts;
    let averageIntensity = 'Medium';
    
    if (avgIntensity <= 1.5) averageIntensity = 'Low';
    else if (avgIntensity >= 2.5) averageIntensity = 'High';
    
    setStats({
      totalWorkouts,
      totalCalories,
      totalDuration,
      averageIntensity,
      mostFrequentWorkout,
    });
  };
  
  // Filter workouts by type
  const filterWorkoutsByType = useCallback((type) => {
    setSelectedFilter(type);
    
    if (type === 'all') {
      setFilteredWorkouts(workouts);
    } else if (type === 'high') {
      setFilteredWorkouts(workouts.filter(workout => workout.intensity === 'High'));
    } else if (type === 'medium') {
      setFilteredWorkouts(workouts.filter(workout => workout.intensity === 'Medium'));
    } else if (type === 'low') {
      setFilteredWorkouts(workouts.filter(workout => workout.intensity === 'Low'));
    }
  }, [workouts]);
  
  // Filter workouts by search query
  useEffect(() => {
    if (searchQuery) {
      const filtered = workouts.filter(workout => 
        workout.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        workout.exercises.some(ex => ex.name.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setFilteredWorkouts(filtered);
    } else {
      filterWorkoutsByType(selectedFilter);
    }
  }, [searchQuery, workouts, selectedFilter, filterWorkoutsByType]);
  
  // Format date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  // Render workout item
  const renderWorkoutItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.workoutItem}
      onPress={() => setSelectedWorkout(item)}
    >
      <View style={styles.workoutHeader}>
        <View style={styles.workoutIconContainer}>
          <Image source={item.image} style={styles.workoutIcon} />
        </View>
        <View style={styles.workoutInfo}>
          <Text style={styles.workoutName}>{item.name}</Text>
          <Text style={styles.workoutDate}>{formatDate(item.date)}</Text>
        </View>
        <View style={styles.workoutStats}>
          <Text style={styles.statLabel}>{item.duration} min</Text>
          <Text style={styles.statLabel}>{item.calories} cal</Text>
        </View>
      </View>
      
      {selectedWorkout && selectedWorkout.id === item.id && (
        <View style={styles.exerciseList}>
          <Text style={styles.exerciseListTitle}>Exercises:</Text>
          {item.exercises.map((exercise, index) => (
            <View key={index} style={styles.exerciseItem}>
              <Text style={styles.exerciseName}>{exercise.name}</Text>
              <Text style={styles.exerciseDetail}>
                {exercise.sets} sets • 
                {exercise.reps ? ` ${exercise.reps} reps` : ` ${exercise.duration}`} • 
                {exercise.weight}
              </Text>
            </View>
          ))}
          <View style={styles.intensityContainer}>
            <Text style={styles.intensityLabel}>Intensity:</Text>
            <View style={[
              styles.intensityIndicator, 
              { backgroundColor: 
                item.intensity === 'High' ? '#FF4757' : 
                item.intensity === 'Medium' ? '#FFA502' : '#2ED573'
              }
            ]} />
            <Text style={styles.intensityText}>{item.intensity}</Text>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <LinearGradient colors={['#A95CF1', '#DB6FDF']} style={styles.container}>
      <SafeAreaView style={styles.safeContainer}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.loadingText}>Loading your workout history...</Text>
          </View>
        ) : (
          <>
            <View style={styles.header}>
              <TouchableOpacity onPress={() => navigation.goBack()}>
                <Text style={styles.backButton}>←</Text>
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Workout History</Text>
              <View style={{ width: 30 }} />
            </View>
            
            {/* Statistics Summary */}
            <View style={styles.statsContainer}>
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{stats.totalWorkouts}</Text>
                  <Text style={styles.statTitle}>Workouts</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{stats.totalCalories}</Text>
                  <Text style={styles.statTitle}>Calories</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{stats.totalDuration}</Text>
                  <Text style={styles.statTitle}>Minutes</Text>
                </View>
              </View>
              <View style={styles.statsRow}>
                <View style={styles.wideStatItem}>
                  <Text style={styles.statTitle}>Most Frequent: </Text>
                  <Text style={styles.statValue}>{stats.mostFrequentWorkout}</Text>
                </View>
                <View style={styles.wideStatItem}>
                  <Text style={styles.statTitle}>Avg. Intensity: </Text>
                  <Text style={styles.statValue}>{stats.averageIntensity}</Text>
                </View>
              </View>
            </View>
            
            {/* Search Bar */}
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search workouts"
                placeholderTextColor="#999"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
            
            {/* Filter Tabs */}
            <View style={styles.filterContainer}>
              <TouchableOpacity 
                style={[styles.filterTab, selectedFilter === 'all' && styles.activeFilterTab]} 
                onPress={() => filterWorkoutsByType('all')}
              >
                <Text style={[styles.filterText, selectedFilter === 'all' && styles.activeFilterText]}>All</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.filterTab, selectedFilter === 'high' && styles.activeFilterTab]} 
                onPress={() => filterWorkoutsByType('high')}
              >
                <Text style={[styles.filterText, selectedFilter === 'high' && styles.activeFilterText]}>High Intensity</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.filterTab, selectedFilter === 'medium' && styles.activeFilterTab]} 
                onPress={() => filterWorkoutsByType('medium')}
              >
                <Text style={[styles.filterText, selectedFilter === 'medium' && styles.activeFilterText]}>Medium</Text>
              </TouchableOpacity>
            </View>
            
            {/* Workout List */}
            {filteredWorkouts.length > 0 ? (
              <FlatList
                data={filteredWorkouts}
                renderItem={renderWorkoutItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.workoutList}
                showsVerticalScrollIndicator={false}
              />
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No workouts found</Text>
              </View>
            )}
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
  statsContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    margin: 15,
    padding: 15,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  statItem: {
    alignItems: 'center',
  },
  wideStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  statTitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  searchContainer: {
    paddingHorizontal: 15,
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
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    marginBottom: 10,
  },
  filterTab: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    marginRight: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  activeFilterTab: {
    backgroundColor: '#8E44AD',
  },
  filterText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500',
  },
  activeFilterText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  workoutList: {
    paddingHorizontal: 15,
    paddingBottom: 20,
  },
  workoutItem: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 15,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  workoutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  workoutIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f2e6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  workoutIcon: {
    width: 30,
    height: 30,
  },
  workoutInfo: {
    flex: 1,
  },
  workoutName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  workoutDate: {
    fontSize: 14,
    color: '#666',
  },
  workoutStats: {
    alignItems: 'flex-end',
  },
  statLabel: {
    fontSize: 14,
    color: '#A95CF1',
    fontWeight: '500',
  },
  exerciseList: {
    marginTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 15,
  },
  exerciseListTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  exerciseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  exerciseName: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  exerciseDetail: {
    fontSize: 14,
    color: '#666',
  },
  intensityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  intensityLabel: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    marginRight: 10,
  },
  intensityIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 5,
  },
  intensityText: {
    fontSize: 14,
    color: '#333',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    color: '#fff',
    marginTop: 20,
  },
});

export default WorkoutHistoryScreen; 