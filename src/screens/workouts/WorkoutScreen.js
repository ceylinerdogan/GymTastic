import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, Image, TouchableOpacity, ActivityIndicator, Alert, Modal } from 'react-native';
import { workoutService } from '../../services';
import { profileService } from '../../services';

const WorkoutsScreen = ({ navigation }) => {
  const [workouts, setWorkouts] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);

  // Fetch workout types and check if user is admin
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Check if user is admin
        const adminStatus = await profileService.isUserAdmin();
        setIsAdmin(adminStatus);
        
        // Fetch workout types
        const response = await workoutService.getWorkoutTypes();
        if (response.success) {
          setWorkouts(response.data);
        } else {
          // Fallback to hardcoded data if API fails
          setWorkouts([
            { id: '1', name: 'Squat', description: 'Legs Workout' },
            { id: '2', name: 'Plank', description: 'Core Workout' },
            { id: '3', name: 'Lunge', description: 'Legs Workout' },
          ]);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        Alert.alert('Error', 'Failed to load workouts');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    
    // Refresh data when screen comes into focus
    const unsubscribe = navigation.addListener('focus', fetchData);
    return unsubscribe;
  }, [navigation]);
  
  // Filter workouts based on search text
  const filteredWorkouts = workouts.filter(workout => 
    workout.name.toLowerCase().includes(searchText.toLowerCase()) ||
    (workout.description && workout.description.toLowerCase().includes(searchText.toLowerCase()))
  );
  
  // Navigate to workout details or exercises
  const handleWorkoutPress = (workout) => {
    navigation.navigate('WorkoutVideo', { workout });
  };
  
  // Admin function to add a new workout type
  const handleAddWorkout = async (name, description) => {
    try {
      setIsLoading(true);
      const response = await workoutService.createWorkoutType({ name, description });
      if (response.success) {
        Alert.alert('Success', 'Workout type created successfully');
        // Refresh the workout list
        const updatedWorkouts = await workoutService.getWorkoutTypes();
        if (updatedWorkouts.success) {
          setWorkouts(updatedWorkouts.data);
        }
      } else {
        Alert.alert('Error', response.message || 'Failed to create workout type');
      }
    } catch (error) {
      console.error('Error adding workout:', error);
      Alert.alert('Error', 'Failed to create workout type');
    } finally {
      setIsLoading(false);
      setIsAddModalVisible(false);
    }
  };
  
  // Admin function to add exercise to workout type
  const handleAddExerciseToWorkout = (workout) => {
    navigation.navigate('AddExercise', { workoutTypeId: workout.id });
  };

  // Render workout item
  const renderWorkout = ({ item }) => {
    // Determine the image source based on workout name
    let imageSource;
    if (item.name.toLowerCase().includes('squat')) {
      imageSource = require('../../../assets/images/squat.png');
    } else if (item.name.toLowerCase().includes('plank')) {
      imageSource = require('../../../assets/images/plank.png');
    } else if (item.name.toLowerCase().includes('lunge')) {
      imageSource = require('../../../assets/images/lunge.jpg');
    } else {
      // Default image
      imageSource = require('../../../assets/images/squat.png');
    }

    return (
      <TouchableOpacity 
        style={styles.workoutCard}
        onPress={() => handleWorkoutPress(item)}
      >
        <Image source={imageSource} style={styles.workoutImage} />
        <View style={styles.workoutDetails}>
          <Text style={styles.workoutTitle}>{item.name}</Text>
          <Text style={styles.workoutCategory}>{item.description}</Text>
        </View>
        
        {isAdmin && (
          <TouchableOpacity 
            style={styles.adminButton}
            onPress={() => handleAddExerciseToWorkout(item)}
          >
            <Text style={styles.adminButtonText}>+</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centeredContent]}>
        <ActivityIndicator size="large" color="#A95CF1" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Search and Filter Section */}
      <View style={styles.searchContainer}>
        <TextInput 
          style={styles.searchInput} 
          placeholder="Search exercise" 
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>

      {/* Admin Add Workout Button */}
      {isAdmin && (
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => setIsAddModalVisible(true)}
        >
          <Text style={styles.addButtonText}>Add New Workout Type</Text>
        </TouchableOpacity>
      )}

      {/* Workout List */}
      {filteredWorkouts.length > 0 ? (
        <FlatList
          data={filteredWorkouts}
          renderItem={renderWorkout}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.workoutList}
        />
      ) : (
        <View style={styles.noWorkoutsContainer}>
          <Text style={styles.noWorkoutsText}>No workouts found</Text>
        </View>
      )}
      
      {/* Add Workout Modal for Admin */}
      {/* This would be a proper form component with TextInput fields */}
      {/* Simplified for brevity */}
      <Modal
        visible={isAddModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsAddModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add New Workout Type</Text>
            
            {/* Form would go here */}
            <TouchableOpacity 
              style={styles.modalButton}
              onPress={() => {
                handleAddWorkout("New Workout", "Workout description");
              }}
            >
              <Text style={styles.modalButtonText}>Add Workout</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setIsAddModalVisible(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F5F5F5',
  },
  centeredContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    marginBottom: 20,
  },
  searchInput: {
    height: 40,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 10,
  },
  workoutList: {
    marginTop: 10,
  },
  workoutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
  },
  workoutImage: {
    width: 50,
    height: 50,
    marginRight: 15,
    borderRadius: 25,
  },
  workoutDetails: {
    flex: 1,
  },
  workoutTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  workoutCategory: {
    fontSize: 12,
    color: '#666666',
  },
  addButton: {
    backgroundColor: '#A95CF1',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  adminButton: {
    width: 30,
    height: 30,
    backgroundColor: '#A95CF1',
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  adminButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  noWorkoutsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noWorkoutsText: {
    fontSize: 16,
    color: '#666',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  modalButton: {
    backgroundColor: '#A95CF1',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    width: '100%',
    marginBottom: 10,
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: '#f8f8f8',
  },
  cancelButtonText: {
    color: '#333',
  },
});

export default WorkoutsScreen;
