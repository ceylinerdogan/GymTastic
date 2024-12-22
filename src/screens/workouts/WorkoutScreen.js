import React from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, Image, TouchableOpacity } from 'react-native';

const workouts = [
  { id: '1', title: 'Squat', category: 'Legs', image: require('../../../assets/images/squat.png') },
  { id: '2', title: 'Plank', category: 'Core', image: require('../../../assets/images/plank.png') },
  { id: '3', title: 'Lunge', category: 'Legs', image: require('../../../assets/images/lunge.jpg') },
];

const WorkoutsScreen = ({ navigation }) => {
  const renderWorkout = ({ item }) => (
    <TouchableOpacity style={styles.workoutCard}>
      <Image source={item.image} style={styles.workoutImage} />
      <View style={styles.workoutDetails}>
        <Text style={styles.workoutTitle}>{item.title}</Text>
        <Text style={styles.workoutCategory}>{item.category}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Search and Filter Section */}
      <View style={styles.searchContainer}>
        <TextInput style={styles.searchInput} placeholder="Search exercise" />
        <View style={styles.filters}>
          <TouchableOpacity style={styles.filterButton}>
            <Text style={styles.filterText}>All Equipment</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.filterButton}>
            <Text style={styles.filterText}>Chest</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Workout List */}
      <FlatList
        data={workouts}
        renderItem={renderWorkout}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.workoutList}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F5F5F5',
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
  filters: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  filterButton: {
    backgroundColor: '#A95CF1',
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 20,
  },
  filterText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
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
});

export default WorkoutsScreen;
