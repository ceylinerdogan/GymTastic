import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

const MainScreen = ({ route, navigation }) => {
  const { name = 'User', surname = '' } = route.params || {}; // Retrieve name and surname from route.params
  const [activeTab, setActiveTab] = useState('Main');

  const renderContent = () => {
    switch (activeTab) {
      case 'Main':
        return (
          <View style={styles.gridContainer}>
            {/* Start Workout */}
            <TouchableOpacity
              style={styles.card}
              onPress={() => navigation.navigate('StartWorkout')}
            >
              <Image
                source={require('../../../assets/images/gym_icon.png')}
                style={styles.icon}
              />
              <Text style={styles.cardText}>Start Workout</Text>
            </TouchableOpacity>

            {/* Workout History */}
            <TouchableOpacity
              style={styles.card}
              onPress={() => navigation.navigate('WorkoutHistory')}
            >
              <Image
                source={require('../../../assets/images/gym_icon.png')}
                style={styles.icon}
              />
              <Text style={styles.cardText}>Workout History</Text>
            </TouchableOpacity>

            {/* Profile */}
            <TouchableOpacity
              style={styles.card}
              onPress={() => navigation.navigate('Profile')}
            >
              <Image
                source={require('../../../assets/images/gym_icon.png')}
                style={styles.icon}
              />
              <Text style={styles.cardText}>My Profile</Text>
            </TouchableOpacity>

            {/* Workout Library */}
            <TouchableOpacity
              style={styles.card}
              onPress={() => navigation.navigate('WorkoutLibrary')}
            >
              <Image
                source={require('../../../assets/images/gym_icon.png')}
                style={styles.icon}
              />
              <Text style={styles.cardText}>Workout Library</Text>
            </TouchableOpacity>
          </View>
        );
      case 'WorkoutLibrary':
        return <Text style={styles.content}>Workout Library Page</Text>;
      case 'WorkoutHistory':
        return <Text style={styles.content}>Workout History Page</Text>;
      case 'Profile':
        return <Text style={styles.content}>Profile Page</Text>;
      default:
        return null;
    }
  };

  return (
    <LinearGradient colors={['#A95CF1', '#DB6FDF']} style={styles.container}>
      {/* Welcome User */}
      <Text style={styles.title}>
        Welcome, {name} {surname}!
      </Text>

      {/* Main Content */}
      <View style={styles.contentContainer}>{renderContent()}</View>

      {/* Bottom Navigation Bar */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setActiveTab('Main')}
        >
          <Text style={activeTab === 'Main' ? styles.navTextActive : styles.navText}>
            Main
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setActiveTab('WorkoutLibrary')}
        >
          <Text
            style={activeTab === 'WorkoutLibrary' ? styles.navTextActive : styles.navText}
          >
            Library
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setActiveTab('WorkoutHistory')}
        >
          <Text
            style={activeTab === 'WorkoutHistory' ? styles.navTextActive : styles.navText}
          >
            History
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setActiveTab('Profile')}
        >
          <Text style={activeTab === 'Profile' ? styles.navTextActive : styles.navText}>
            Profile
          </Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
  },
  contentContainer: {
    flex: 1,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    width: '48%',
    height: 150,
    backgroundColor: '#fff',
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
    elevation: 5,
  },
  icon: {
    width: 60,
    height: 60,
    marginBottom: 10,
  },
  cardText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    fontSize: 18,
    color: '#fff',
    textAlign: 'center',
    marginTop: 20,
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    height: 60,
    backgroundColor: '#8E44AD',
    borderRadius: 30,
    marginBottom: 25,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navText: {
    color: '#fff',
    fontSize: 16,
  },
  navTextActive: {
    color: '#A95CF1',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default MainScreen;
