import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, SafeAreaView, ActivityIndicator, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LinearGradient from 'react-native-linear-gradient';
import { profileService, authService } from '../../services';

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
    profileImageUri: null,
    role: ''
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
    profileImageUri,
    role
  } = profileData;

  // Fetch profile data when screen loads or comes into focus
  useEffect(() => {
    const fetchProfileData = async () => {
      setIsLoading(true);
      try {
        // Get profile from new API endpoint
        const response = await profileService.getCurrentUserProfile();
        console.log('Profile response in ProfileScreen:', response);
        
        if (response.success && response.profile) {
          // If the API returns profile data, use it
          const profile = response.profile;
          console.log('Processing profile data:', profile);
          
          // Split full name into first name and surname
          let firstName = '';
          let lastName = '';
          if (profile.full_name) {
            const nameParts = profile.full_name.split(' ');
            firstName = nameParts[0] || '';
            lastName = nameParts.slice(1).join(' ') || '';
          }
          
          // Handle profile picture
          let profilePic = null;
          if (profile.profilepic) {
            profilePic = profile.profilepic;
            console.log('Profile picture found, length:', profile.profilepic.length);
          }
          
          setProfileData({
            name: firstName,
            surname: lastName,
            gender: profile.gender || '',
            dob: profile.birth_date || '',
            weight: profile.weight ? String(profile.weight) : '0',
            height: profile.height ? String(profile.height) : '0',
            goal: profile.fitness_goal || '',
            activityLevel: profile.activity_level || '',
            profileImageUri: profilePic,
            role: profile.role || 'user'
          });
          
          console.log('Profile data set:', {
            name: firstName,
            surname: lastName,
            gender: profile.gender || '',
            weight: profile.weight,
            height: profile.height,
            role: profile.role || 'user',
            hasProfileImage: !!profilePic
          });
        } else if (route.params) {
          // Fallback to route params if available
          console.log('No profile data from API, using route params:', route.params);
          setProfileData({
            name: route.params.name || '',
            surname: route.params.surname || '',
            gender: route.params.gender || '',
            dob: route.params.dob || '',
            weight: route.params.weight ? String(route.params.weight) : '0',
            height: route.params.height ? String(route.params.height) : '0',
            goal: route.params.goal || '',
            activityLevel: route.params.activityLevel || '',
            profileImageUri: route.params.profileImageUri || null,
            role: route.params.role || 'user'
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
            weight: route.params.weight ? String(route.params.weight) : '0',
            height: route.params.height ? String(route.params.height) : '0',
            goal: route.params.goal || '',
            activityLevel: route.params.activityLevel || '',
            profileImageUri: route.params.profileImageUri || null,
            role: route.params.role || 'user'
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
    
    return (weightInKg / (heightInMeters * heightInMeters)).toFixed(1);
  };

  // Get BMI category and color
  const getBMICategory = (bmi) => {
    if (bmi === 'N/A') return { category: 'N/A', color: '#808080' };
    
    const bmiValue = parseFloat(bmi);
    
    if (bmiValue < 18.5) return { category: 'Underweight', color: '#3498DB' };
    if (bmiValue < 25) return { category: 'Normal', color: '#2ECC71' };
    if (bmiValue < 30) return { category: 'Overweight', color: '#F39C12' };
    return { category: 'Obese', color: '#E74C3C' };
  };

  // Get the position for the BMI marker on the scale (0-100%)
  const getBMIPosition = (bmi) => {
    if (bmi === 'N/A') return 50; // Middle if N/A
    
    const bmiValue = parseFloat(bmi);
    // Map BMI from range [15-40] to [0-100]
    let position = ((bmiValue - 15) / (40 - 15)) * 100;
    
    // Clamp value between 0 and 100
    position = Math.max(0, Math.min(100, position));
    return position;
  };

  // Format activity level for display
  const formatActivityLevel = (level) => {
    if (!level) return 'Not specified';
    
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
    if (!goal) return 'Not specified';
    
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
                  source={{ 
                    uri: profileImageUri.startsWith('data:image') 
                      ? profileImageUri 
                      : `data:image/jpeg;base64,${profileImageUri}`
                  }}
                  style={styles.profileImage}
                />
              ) : (
                <Image
                  source={require('../../../assets/images/emptyProfilePic.jpg')}
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
                <Text style={styles.infoValue}>{weight ? `${weight} kg` : 'Not specified'}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Height</Text>
                <Text style={styles.infoValue}>{height ? `${height} cm` : 'Not specified'}</Text>
              </View>
            </View>

            {/* Enhanced BMI Display */}
            <View style={styles.bmiContainer}>
              <View style={styles.bmiHeaderRow}>
                <Text style={styles.bmiLabel}>Body Mass Index (BMI)</Text>
                <Text style={styles.bmiValue}>{calculateBMI()}</Text>
              </View>
              
              {calculateBMI() !== 'N/A' && (
                <>
                  {/* BMI Category Labels */}
                  <View style={styles.bmiCategoryLabels}>
                    <Text style={[styles.bmiCategoryText, {color: '#3498DB'}]}>Underweight</Text>
                    <Text style={[styles.bmiCategoryText, {color: '#2ECC71'}]}>Normal</Text>
                    <Text style={[styles.bmiCategoryText, {color: '#F39C12'}]}>Overweight</Text>
                    <Text style={[styles.bmiCategoryText, {color: '#E74C3C'}]}>Obese</Text>
                  </View>
                
                  {/* BMI Scale */}
                  <View style={styles.bmiScaleContainer}>
                    <View style={styles.bmiScale}>
                      <View style={[styles.bmiScaleSection, { flex: 18.5, backgroundColor: '#3498DB' }]} />
                      <View style={[styles.bmiScaleSection, { flex: 6.5, backgroundColor: '#2ECC71' }]} />
                      <View style={[styles.bmiScaleSection, { flex: 5, backgroundColor: '#F39C12' }]} />
                      <View style={[styles.bmiScaleSection, { flex: 10, backgroundColor: '#E74C3C' }]} />
                    </View>
                    
                    {/* BMI Marker */}
                    <View 
                      style={[
                        styles.bmiMarker, 
                        { left: `${getBMIPosition(calculateBMI())}%` }
                      ]}
                    />
                  </View>
                  
                  {/* BMI Scale Labels */}
                  <View style={styles.bmiScaleLabels}>
                    <Text style={styles.bmiScaleLabel}>15</Text>
                    <Text style={styles.bmiScaleLabel}>18.5</Text>
                    <Text style={styles.bmiScaleLabel}>25</Text>
                    <Text style={styles.bmiScaleLabel}>30</Text>
                    <Text style={styles.bmiScaleLabel}>40</Text>
                  </View>
                  
                  {/* BMI Category */}
                  <View style={styles.bmiResultContainer}>
                    <Text style={styles.bmiResultLabel}>Your BMI Category: </Text>
                    <Text 
                      style={[
                        styles.bmiResultValue, 
                        { color: getBMICategory(calculateBMI()).color }
                      ]}
                    >
                      {getBMICategory(calculateBMI()).category}
                    </Text>
                  </View>

                  {/* BMI Information */}
                  <View style={styles.bmiInfoContainer}>
                    <Text style={styles.bmiInfoText}>
                      BMI provides a simple numeric measure of your weight relative to height, and is widely used to identify weight categories that may lead to health problems.
                    </Text>
                  </View>
                </>
              )}
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
          
          {/* Admin Features Section - Only visible to admin users */}
          {role === 'admin' && (
            <View style={styles.adminSection}>
              <Text style={styles.adminSectionTitle}>Admin Features</Text>
              
              <TouchableOpacity 
                style={styles.adminButton}
                onPress={() => navigation.navigate('ManageWorkouts')}
              >
                <Text style={styles.adminButtonText}>Manage Workouts</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.adminButton}
                onPress={() => navigation.navigate('ManageUsers')}
              >
                <Text style={styles.adminButtonText}>Manage Users</Text>
              </TouchableOpacity>
            </View>
          )}
          
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
  bmiContainer: {
    marginBottom: 16,
  },
  bmiHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  bmiLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  bmiValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
  },
  bmiScaleContainer: {
    height: 20,
    position: 'relative', 
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 10,
    overflow: 'hidden',
    marginVertical: 12,
  },
  bmiScale: {
    flexDirection: 'row',
    height: '100%',
  },
  bmiScaleSection: {
    height: '100%',
  },
  bmiMarker: {
    position: 'absolute',
    top: -5,
    width: 8,
    height: 30,
    backgroundColor: '#fff',
    borderRadius: 4,
    marginLeft: -4, // Centers the marker
  },
  bmiScaleLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  bmiScaleLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  bmiCategoryLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
    paddingHorizontal: 4,
  },
  bmiCategoryText: {
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
    paddingHorizontal: 2,
  },
  bmiResultContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  bmiResultLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginRight: 8,
  },
  bmiResultValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
  },
  bmiInfoContainer: {
    marginTop: 8,
  },
  bmiInfoText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  adminSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  adminSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
    color: '#A95CF1',
  },
  adminButton: {
    backgroundColor: '#A95CF1',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginBottom: 10,
    alignItems: 'center',
  },
  adminButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default ProfileScreen;
