import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, SafeAreaView, ActivityIndicator, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LinearGradient from 'react-native-linear-gradient';
import { authService } from '../../services/api';

const ProfileScreen = ({ navigation, route }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [profileData, setProfileData] = useState({
    name: '',
    surname: '',
    gender: '',
    dob: '',
    weight: '',
    height: '',
    goal: '',
    activityLevel: '',
    profileImageUri: null
  });
  
  // Extract data from profile or route params
  const { 
    name, 
    surname, 
    gender, 
    dob, 
    weight, 
    height,
    goal,
    activityLevel,
    profileImageUri
  } = profileData;

  // Fetch profile data when screen loads or comes into focus
  useEffect(() => {
    const fetchProfileData = async () => {
      setIsLoading(true);
      try {
        const response = await authService.getProfile();
        
        if (response && response.profile) {
          // If the API returns profile data, use it
          const profile = response.profile;
          setProfileData({
            name: profile.firstName || '',
            surname: profile.lastName || '',
            gender: profile.gender || '',
            dob: profile.dateOfBirth || '',
            weight: profile.weight ? String(profile.weight) : '',
            height: profile.height ? String(profile.height) : '',
            goal: profile.fitnessGoal || '',
            activityLevel: profile.activityLevel || '',
            profileImageUri: profile.profileImageUri || null
          });
        } else if (route.params) {
          // Fallback to route params if available
          setProfileData({
            name: route.params.name || '',
            surname: route.params.surname || '',
            gender: route.params.gender || '',
            dob: route.params.dob || '',
            weight: route.params.weight ? String(route.params.weight) : '',
            height: route.params.height ? String(route.params.height) : '',
            goal: route.params.goal || '',
            activityLevel: route.params.activityLevel || '',
            profileImageUri: route.params.profileImageUri || null
          });
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        
        // If there's an error but we have route params, use those
        if (route.params) {
          setProfileData({
            name: route.params.name || '',
            surname: route.params.surname || '',
            gender: route.params.gender || '',
            dob: route.params.dob || '',
            weight: route.params.weight ? String(route.params.weight) : '',
            height: route.params.height ? String(route.params.height) : '',
            goal: route.params.goal || '',
            activityLevel: route.params.activityLevel || '',
            profileImageUri: route.params.profileImageUri || null
          });
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProfileData();
    
    // Add focus listener to refresh profile when screen comes into focus
    const unsubscribe = navigation.addListener('focus', () => {
      console.log('ProfileScreen focused - refreshing data');
      fetchProfileData();
    });
    
    // Clean up the listener when component unmounts
    return unsubscribe;
  }, [route.params, navigation]);

  // Calculate BMI
  const calculateBMI = () => {
    const weightInKg = parseFloat(weight);
    const heightInMeters = parseFloat(height) / 100;
    
    if (isNaN(weightInKg) || isNaN(heightInMeters) || heightInMeters === 0) {
      return 'N/A';
    }
    
    return (weightInKg / (heightInMeters * heightInMeters)).toFixed(2);
  };

  // Format activity level for display
  const formatActivityLevel = (level) => {
    switch(level) {
      case 'sedentary': return 'Sedentary';
      case 'light': return 'Lightly Active';
      case 'moderate': return 'Moderately Active';
      case 'very_active': return 'Very Active';
      case 'extra_active': return 'Extra Active';
      default: return level;
    }
  };

  // Format fitness goal for display
  const formatGoal = (goal) => {
    switch(goal) {
      case 'lose_weight': return 'Lose Weight';
      case 'build_muscle': return 'Build Muscle';
      case 'improve_fitness': return 'Improve Fitness';
      case 'maintain_health': return 'Maintain Health';
      default: return goal;
    }
  };

  const handleEditProfile = () => {
    navigation.navigate('EditProfile', profileData);
  };
  
  const handleLogout = async () => {
    try {
      setIsLoading(true);
      const result = await authService.logout();
      setIsLoading(false);
      
      if (result.success) {
        console.log('Logout successful');
        // Navigate to login screen
        navigation.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        });
      } else {
        Alert.alert('Logout Failed', 'Unable to log out. Please try again.');
      }
    } catch (error) {
      setIsLoading(false);
      console.error('Logout error:', error);
      Alert.alert('Logout Error', 'An error occurred while logging out.');
    }
  };

  if (isLoading) {
    return (
      <LinearGradient colors={['#A95CF1', '#DB6FDF']} style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#fff" />
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#A95CF1', '#DB6FDF']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.screenTitle}>Profile</Text>
          </View>
          
          <View style={styles.profileSection}>
            <View style={styles.profileImageContainer}>
              {profileImageUri ? (
                <Image
                  source={{ uri: profileImageUri }}
                  style={styles.profileImage}
                />
              ) : (
                <Image
                  source={require('../../../assets/images/profile_pic.jpg')}
                  style={styles.profileImage}
                />
              )}
            </View>
            
            <Text style={styles.name}>{name} {surname}</Text>
            
            <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
              <Text style={styles.editButtonText}>Edit Profile</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}>Personal Information</Text>
            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Gender</Text>
                <Text style={styles.infoValue}>{gender}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Date of Birth</Text>
                <Text style={styles.infoValue}>{dob}</Text>
              </View>
            </View>
          </View>
          
          <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}>Body Metrics</Text>
            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Weight</Text>
                <Text style={styles.infoValue}>{weight} kg</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Height</Text>
                <Text style={styles.infoValue}>{height} cm</Text>
              </View>
            </View>
            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>BMI</Text>
                <Text style={styles.infoValue}>{calculateBMI()}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}></Text>
                <Text style={styles.infoValue}></Text>
              </View>
            </View>
          </View>
          
          <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}>Fitness Goals</Text>
            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Goal</Text>
                <Text style={styles.infoValue}>{formatGoal(goal)}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Activity Level</Text>
                <Text style={styles.infoValue}>{formatActivityLevel(activityLevel)}</Text>
              </View>
            </View>
          </View>
          
          <View style={styles.buttonsContainer}>
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Text style={styles.logoutButtonText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  profileImageContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    marginBottom: 10,
    borderWidth: 3,
    borderColor: '#fff',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
  },
  editButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginBottom: 10,
  },
  editButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  infoSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  infoItem: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
  },
  buttonsContainer: {
    marginHorizontal: 16,
    marginBottom: 30,
  },
  logoutButton: {
    backgroundColor: '#8E44AD',
    borderRadius: 30,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ProfileScreen;
