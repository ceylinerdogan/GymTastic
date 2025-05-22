import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Image, 
  SafeAreaView, 
  ScrollView,
  Dimensions,
  ActivityIndicator
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LinearGradient from 'react-native-linear-gradient';
import profileService from '../../services/profileService';
import workoutService from '../../services/workoutService';
import { apiClient } from '../../services/apiConfig';

const MainScreen = ({ route, navigation }) => {
  // User profile data
  const [userData, setUserData] = useState({
    fullName: '',
    gender: '',
    dob: '',
    weight: 0,
    height: 0,
    bmi: '',
    dailyCalories: '',
    goal: '',
    activityLevel: '',
    profileImageUri: null
  });

  // Workout statistics data
  const [workoutData, setWorkoutData] = useState({
    completedWorkouts: 0,
    inProgressWorkouts: 0,
    minutesSpent: 0,
    caloriesBurned: 0,
    streakDays: 0,
    todaysProgress: 0,
  });

  // Weekly and monthly progress data
  const [weeklyWorkoutData, setWeeklyWorkoutData] = useState([]);
  const [monthlyProgress, setMonthlyProgress] = useState([]);
  
  // Recent workouts
  const [recentWorkouts, setRecentWorkouts] = useState([]);
  
  const [isLoading, setIsLoading] = useState(true);
  
  // Fetch user data from API
  useEffect(() => {
    const fetchUserData = async () => {
      setIsLoading(true);
      try {
        // Try to get user ID directly first (more reliable)
        let userId = await AsyncStorage.getItem('userId');
        
        // If not found, try the alternate key
        if (!userId) {
          userId = await AsyncStorage.getItem('userID');
        }
        
        // If still not found, try getting it from user_data
        if (!userId) {
          const userData = await AsyncStorage.getItem('user_data');
          if (userData) {
            const user = JSON.parse(userData);
            userId = user.userID || user.userId;
          }
        }
        
        // If we still don't have a user ID, we can't proceed
        if (!userId) {
          throw new Error('User ID not found in any storage location');
        }
        
        console.log('Found user ID:', userId);
        
        // Get user profile
        const profileResponse = await profileService.getProfile(userId);
        console.log('Profile response in MainScreen:', profileResponse);
        
        if (profileResponse.success && profileResponse.profile) {
          const profile = profileResponse.profile;
          
          // Fix for profile data parsing - ensure values are properly parsed
          const height = profile.height ? parseFloat(profile.height) : 0;
          const weight = profile.weight ? parseFloat(profile.weight) : 0;
          
          // Calculate BMI if height and weight are available
          let bmi = '0';
          if (height > 0 && weight > 0) {
            const heightInMeters = height / 100;
            bmi = (weight / (heightInMeters * heightInMeters)).toFixed(1);
          }
          
          // Calculate daily calorie needs based on Harris-Benedict formula
          let dailyCalories = '0';
          if (profile.gender && height > 0 && weight > 0 && profile.birth_date) {
            try {
              // Parse birth date to calculate age
              let birthDate;
              if (profile.birth_date.includes('T')) {
                // ISO format
                birthDate = new Date(profile.birth_date.split('T')[0]);
              } else if (profile.birth_date.includes('.')) {
                // DD.MM.YYYY format
                const parts = profile.birth_date.split('.');
                birthDate = new Date(parts[2], parts[1] - 1, parts[0]);
              } else if (profile.birth_date.includes('-')) {
                // YYYY-MM-DD format
                birthDate = new Date(profile.birth_date);
              }
              
              const today = new Date();
              let age = today.getFullYear() - birthDate.getFullYear();
              
              // Adjust age if birthday hasn't occurred yet this year
              const monthDiff = today.getMonth() - birthDate.getMonth();
              if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                age--;
              }
              
              // Harris-Benedict formula for BMR
              let bmr = 0;
              
              if (profile.gender.toLowerCase() === 'male') {
                bmr = 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age);
              } else if (profile.gender.toLowerCase() === 'female') {
                bmr = 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);
              }
              
              // Apply activity multiplier
              let activityMultiplier = 1.2; // Default: sedentary
              const activityLevel = profile.activity_level ? profile.activity_level.toLowerCase() : '';
              
              if (activityLevel.includes('sedentary')) {
                activityMultiplier = 1.2;
              } else if (activityLevel.includes('light') || activityLevel.includes('beginner')) {
                activityMultiplier = 1.375;
              } else if (activityLevel.includes('moderate')) {
                activityMultiplier = 1.55;
              } else if (activityLevel.includes('very')) {
                activityMultiplier = 1.725;
              } else if (activityLevel.includes('extra')) {
                activityMultiplier = 1.9;
              }
              
              dailyCalories = Math.round(bmr * activityMultiplier).toString();
            } catch (error) {
              console.error('Error calculating daily calories:', error);
              dailyCalories = '0';
            }
          }
          
          // Split full name into first name and surname
          let firstName = '';
          let surname = '';
          if (profile.full_name) {
            const nameParts = profile.full_name.split(' ');
            firstName = nameParts[0] || '';
            surname = nameParts.slice(1).join(' ') || '';
          }
          
          // Process profile picture
          let profilePic = null;
          if (profile.profilepic) {
            profilePic = profile.profilepic;
            console.log('Profile picture available in MainScreen, length:', profile.profilepic.length);
          }
          
          setUserData({
            fullName : profile.full_name || '',
            gender: profile.gender || '',
            dob: profile.birth_date || '',
            weight: weight ,
            height: height ,
            bmi: bmi,
            dailyCalories: dailyCalories,
            goal: profile.fitness_goal || '',
            activityLevel: profile.activity_level || '',
            profileImageUri: profilePic
          });
          
          console.log('User data set:', {
            fullName: profile.full_name || '',
            gender: profile.gender || '',
            weight: weight ,
            height: height ,
            bmi: bmi,
            dailyCalories: dailyCalories
          });
        } else if (route.params) {
          // Fallback to route params
          setUserData({
            fullName: route.params.name || '',
            surname: route.params.surname || '',
            gender: route.params.gender || '',
            dob: route.params.dob || '',
            weight: route.params.weight ? String(route.params.weight) : '0',
            height: route.params.height ? String(route.params.height) : '0',
            bmi: '0',
            dailyCalories: '0',
            goal: route.params.goal || '',
            activityLevel: route.params.activityLevel || '',
            profileImageUri: route.params.profileImageUri || null
          });
        }
        
        // Fetch workout data - continue even if profile fetch failed
        try {
          await fetchWorkoutStatistics();
        } catch (error) {
          console.error('Error in fetchWorkoutStatistics:', error);
        }
        
        try {
          await fetchWeeklyProgress();
        } catch (error) {
          console.error('Error in fetchWeeklyProgress:', error);
        }
        
        try {
          await fetchMonthlyProgress();
        } catch (error) {
          console.error('Error in fetchMonthlyProgress:', error);
        }
        
        try {
          await fetchRecentWorkouts();
        } catch (error) {
          console.error('Error in fetchRecentWorkouts:', error);
        }
        
      } catch (error) {
        console.error('Error in fetchUserData:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    // API functions for fetching different data types
    const fetchWorkoutStatistics = async () => {
      try {
        // Call API to get workout statistics
        const response = await workoutService.getWorkoutStatistics();
        if (response.success && response.stats) {
          // Map API response to our state format
          setWorkoutData({
            completedWorkouts: response.stats.totalWorkouts || 0,
            inProgressWorkouts: 0, // No in-progress state in API
            minutesSpent: Math.round(response.stats.totalDuration / 60) || 0, // Convert seconds to minutes
            caloriesBurned: 0, // Not tracked in API yet
            streakDays: 0, // Not tracked in API yet
            todaysProgress: 0, // Not tracked in API yet
          });
        }
      } catch (error) {
        console.error('Error fetching workout statistics:', error);
        // Initialize with empty values if there's an error
        setWorkoutData({
          completedWorkouts: 0,
          inProgressWorkouts: 0,
          minutesSpent: 0,
          caloriesBurned: 0,
          streakDays: 0,
          todaysProgress: 0,
        });
      }
    };
    
    const fetchWeeklyProgress = async () => {
      try {
        // Call API to get weekly progress
        const response = await workoutService.getWeeklyProgress();
        if (response.success && response.weeklyData) {
          // Convert seconds to minutes for display
          const dataInMinutes = response.weeklyData.map(seconds => 
            Math.round(seconds / 60)
          );
          setWeeklyWorkoutData(dataInMinutes);
        }
      } catch (error) {
        console.error('Error fetching weekly progress:', error);
        setWeeklyWorkoutData([0, 0, 0, 0, 0, 0, 0]); // Fallback to empty data
      }
    };
    
    const fetchMonthlyProgress = async () => {
      try {
        // Call API to get monthly progress
        const response = await workoutService.getMonthlyProgress();
        if (response.success && response.monthlyData) {
          // Convert seconds to minutes for display
          const dataInMinutes = response.monthlyData.map(seconds => 
            Math.round(seconds / 60)
          );
          setMonthlyProgress(dataInMinutes);
        }
      } catch (error) {
        console.error('Error fetching monthly progress:', error);
        setMonthlyProgress(Array(12).fill(0)); // Fallback to empty data for 12 months
      }
    };
    
    const fetchRecentWorkouts = async () => {
      try {
        // Call API to get recent workouts
        const response = await workoutService.getRecentWorkouts();
        if (response.success && response.recentWorkouts) {
          setRecentWorkouts(response.recentWorkouts);
        }
      } catch (error) {
        console.error('Error fetching recent workouts:', error);
        setRecentWorkouts([]); // Fallback to empty data
      }
    };
    
    fetchUserData();
    
    // Add focus listener to refresh data when screen comes into focus
    const unsubscribe = navigation.addListener('focus', () => {
      console.log('MainScreen focused - refreshing user data');
      fetchUserData();
    });
    
    return unsubscribe;
  }, [route.params, navigation]);

  // Calculate streak text based on streak days
  const getStreakText = () => {
    if (workoutData.streakDays === 0) return "Start your streak today!";
    return `${workoutData.streakDays} day streak! Keep it up!`;
  };

  // Get goal-based recommendation
  const getRecommendation = () => {
    switch(userData.goal) {
      case 'lose_weight':
        return "Focus on cardio and maintain a calorie deficit";
      case 'build_muscle':
        return "Increase protein intake and focus on strength training";
      case 'improve_fitness':
        return "Mix cardio and resistance training for overall fitness";
      case 'maintain_health':
        return "Maintain balanced workouts and healthy nutrition";
      default:
        return "Keep the progress! You're improving every day!";
    }
  };

  // Simple progress chart component
  const WeeklyProgressChart = () => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const maxValue = Math.max(...weeklyWorkoutData) || 1;
    
    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Weekly Activity</Text>
        <View style={styles.chart}>
          {weeklyWorkoutData.map((value, index) => (
            <View key={index} style={styles.chartColumn}>
              <View style={styles.barContainer}>
                <View 
                  style={[
                    styles.bar, 
                    { 
                      height: `${(value / maxValue) * 100}%`,
                      backgroundColor: value > 0 ? '#FFFFFF' : 'rgba(255, 255, 255, 0.3)'
                    }
                  ]} 
                />
              </View>
              <Text style={styles.dayLabel}>{days[index]}</Text>
              <Text style={styles.barValue}>{value}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };
  
  // Monthly progress component
  const MonthlyProgress = () => {
    return (
      <View style={styles.monthlyContainer}>
        <Text style={styles.chartTitle}>Monthly Progress</Text>
        <View style={styles.progressContainer}>
          {monthlyProgress.map((value, index) => (
            <View key={index} style={styles.progressWeek}>
              <Text style={styles.weekLabel}>Week {index + 1}</Text>
              <View style={styles.progressBarContainer}>
                <View 
                  style={[
                    styles.progressBar, 
                    { width: `${value}%` }
                  ]} 
                />
              </View>
              <Text style={styles.progressValue}>{value}%</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  // Add new NoWorkoutsMessage component
  const NoWorkoutsMessage = () => {
    return (
      <View style={styles.noWorkoutsContainer}>
        <Text style={styles.noWorkoutsText}>You haven't completed any workouts yet.</Text>
        <Text style={styles.noWorkoutsSubtext}>Start a new workout to see your history here!</Text>
        <TouchableOpacity 
          style={styles.startWorkoutButton}
          onPress={() => navigation.navigate('StartWorkout')}
        >
          <Text style={styles.startWorkoutButtonText}>Start a Workout</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Add a direct API call to fetch profile when component mounts
  useEffect(() => {
    const fetchDirectProfile = async () => {
      try {
        // Get the auth token
        const token = await AsyncStorage.getItem('authToken');
        if (token) {
          // Set the Authorization header
          apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        }
        
        console.log("Attempting direct API call to fetch profile...");
        // Make a direct API call to fetch the profile
        const response = await apiClient.get('/api/users/profile');
        console.log("Direct API response:", JSON.stringify(response.data, null, 2));
        
        if (response.data && response.data.profile) {
          const profile = response.data.profile;
          console.log("Direct profile data:", JSON.stringify(profile, null, 2));
          
          // Calculate BMI
          let bmi = '0';
          if (profile.height && profile.weight) {
            const heightInMeters = profile.height < 3 ? profile.height : profile.height / 100;
            bmi = (profile.weight / (heightInMeters * heightInMeters)).toFixed(1);
          }
          
          // Update state with the profile data
          setUserData({
            fullName: profile.full_name || '',
            gender: profile.gender || '',
            dob: profile.birth_date || '',
            weight: profile.weight || 0,
            height: profile.height || 0,
            bmi: bmi,
            dailyCalories: '2000', // Default value for now
            goal: profile.fitness_goal || '',
            activityLevel: profile.activity_level || '',
            profileImageUri: profile.profilepic || null
          });
          
          console.log("Updated userData state with:", {
            fullName: profile.full_name,
            weight: profile.weight,
            height: profile.height
          });
        } else if (response.data) {
          // If API returns different format, try to extract from top level
          const profile = response.data;
          console.log("Alternative profile data structure:", JSON.stringify(profile, null, 2));
          
          // Calculate BMI
          let bmi = '0';
          if (profile.height && profile.weight) {
            const heightInMeters = profile.height < 3 ? profile.height : profile.height / 100;
            bmi = (profile.weight / (heightInMeters * heightInMeters)).toFixed(1);
          }
          
          // Update state with the profile data from top level
          setUserData({
            fullName: profile.full_name || '',
            gender: profile.gender || '',
            dob: profile.birth_date || '',
            weight: profile.weight || 0,
            height: profile.height || 0,
            bmi: bmi,
            dailyCalories: '2000', // Default value for now
            goal: profile.fitness_goal || '',
            activityLevel: profile.activity_level || '',
            profileImageUri: profile.profilepic || null
          });
        }
      } catch (error) {
        console.error("Error in direct API call:", error);
        console.log("Error details:", error.response?.data || error.message);
        
        // Attempt to fall back to profile service method
        try {
          console.log("Falling back to profileService method...");
          const userId = await AsyncStorage.getItem('userId') || await AsyncStorage.getItem('userID');
          if (userId) {
            const profileResponse = await profileService.getProfile(userId);
            console.log("Profile service response:", JSON.stringify(profileResponse, null, 2));
            
            if (profileResponse.success && profileResponse.profile) {
              const profile = profileResponse.profile;
              
              setUserData({
                fullName: profile.full_name || '',
                gender: profile.gender || '',
                dob: profile.birth_date || '',
                weight: profile.weight || 0,
                height: profile.height || 0,
                bmi: profileResponse.profile.bmi || '0',
                dailyCalories: '2000',
                goal: profile.fitness_goal || '',
                activityLevel: profile.activity_level || '',
                profileImageUri: profile.profilepic || null
              });
            }
          }
        } catch (fallbackError) {
          console.error("Fallback attempt failed:", fallbackError);
        }
      }
    };
    
    fetchDirectProfile();
  }, []);

  // Add logging to see what userData contains when rendering
  useEffect(() => {
    console.log("Current userData in render:", JSON.stringify(userData));
  }, [userData]);

  return (
    <LinearGradient colors={['#A95CF1', '#DB6FDF']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.loadingText}>Loading your fitness data...</Text>
          </View>
        ) : (
          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            {/* Welcome Section */}
            <View style={styles.header}>
              <View>
                <Text style={styles.greeting}>Hi, {userData.fullName || 'User'}</Text>
                <Text style={styles.subtitle}>Let's check your activity</Text>
              </View>
              <TouchableOpacity 
                style={styles.profileButton}
                onPress={() => navigation.navigate('Profile', { 
                  fullName: userData.fullName,
                  gender: userData.gender, 
                  dob: userData.dob, 
                  weight: userData.weight, 
                  height: userData.height, 
                  goal: userData.goal, 
                  activityLevel: userData.activityLevel,
                  profileImageUri: userData.profileImageUri
                })}
              >
                {userData.profileImageUri ? (
                  <Image
                    source={{ 
                      uri: userData.profileImageUri.startsWith('data:image') 
                        ? userData.profileImageUri 
                        : `data:image/jpeg;base64,${userData.profileImageUri}` 
                    }}
                    style={styles.profileImage}
                  />
                ) : (
                  <Image
                    source={require('../../../assets/images/emptyProfilePic.jpg')}
                    style={styles.profileImage}
                  />
                )}
              </TouchableOpacity>
            </View>

            {/* Today's Progress */}
            <View style={styles.progressSection}>
              <Text style={styles.sectionTitle}>Today's Progress</Text>
              <View style={styles.progressCircleContainer}>
                <View style={styles.progressCircle}>
                  <Text style={styles.progressPercentage}>{workoutData.todaysProgress}%</Text>
                </View>
                <View style={styles.progressStats}>
                  <View style={styles.progressStat}>
                    <Text style={styles.statValue}>{workoutData.completedWorkouts}</Text>
                    <Text style={styles.statLabel}>Workouts</Text>
                  </View>
                  <View style={styles.progressStat}>
                    <Text style={styles.statValue}>{workoutData.minutesSpent}</Text>
                    <Text style={styles.statLabel}>Minutes</Text>
                  </View>
                  <View style={styles.progressStat}>
                    <Text style={styles.statValue}>{workoutData.caloriesBurned}</Text>
                    <Text style={styles.statLabel}>Calories</Text>
                  </View>
                </View>
              </View>
              <TouchableOpacity 
                style={styles.continueButton}
                onPress={() => navigation.navigate('Workouts')}
              >
                <Text style={styles.continueButtonText}>Continue Exercise</Text>
              </TouchableOpacity>
            </View>
            
            {/* Activity Charts */}
            {weeklyWorkoutData.length > 0 && <WeeklyProgressChart />}
            {monthlyProgress.length > 0 && <MonthlyProgress />}
            
            {/* Health Metrics */}
            <View style={styles.metricsContainer}>
              <Text style={styles.sectionTitle}>Health Metrics</Text>
              <View style={styles.metricsRow}>
                <View style={styles.metricCard}>
                  <Text style={styles.metricValue}>
                    {userData.weight ? `${userData.weight} kg` : 'N/A'}
                  </Text>
                  <Text style={styles.metricLabel}>Weight</Text>
                </View>
                <View style={styles.metricCard}>
                  <Text style={styles.metricValue}>
                    {userData.height ? 
                      `${userData.height < 3 ? Math.round(userData.height * 100) : userData.height} cm` 
                      : 'N/A'}
                  </Text>
                  <Text style={styles.metricLabel}>Height</Text>
                </View>
                <View style={styles.metricCard}>
                  <Text style={styles.metricValue}>
                    {userData.bmi && parseFloat(userData.bmi) > 0 ? userData.bmi : 'N/A'}
                  </Text>
                  <Text style={styles.metricLabel}>BMI</Text>
                </View>
              </View>
              <View style={styles.metricsRow}>
                <View style={[styles.metricCard, styles.wideMetricCard]}>
                  <Text style={styles.metricValue}>
                    {userData.dailyCalories && parseFloat(userData.dailyCalories) > 0 ? `${userData.dailyCalories} kcal` : 'N/A'}
                  </Text>
                  <Text style={styles.metricLabel}>Daily Calorie Need</Text>
                </View>
              </View>
            </View>
            
            {/* Recent Workouts */}
            <View style={styles.recentContainer}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Recent Workouts</Text>
                <TouchableOpacity onPress={() => navigation.navigate('History')}>
                  <Text style={styles.seeAllText}>See All</Text>
                </TouchableOpacity>
              </View>
              
              {recentWorkouts.length > 0 ? (
                recentWorkouts.map((workout, index) => (
                  <TouchableOpacity 
                    key={workout.id || index}
                    style={styles.workoutCard}
                    onPress={() => navigation.navigate('WorkoutVideo', { workout })}
                  >
                    <Image 
                      source={workout.image ? { uri: workout.image } : require('../../../assets/images/gym.jpg')} 
                      style={styles.workoutCardImage}
                    />
                    <View style={styles.workoutCardContent}>
                      <Text style={styles.workoutCardTitle}>{workout.name}</Text>
                      <Text style={styles.workoutCardDetails}>{workout.duration} min • {workout.intensity} Intensity</Text>
                      <Text style={styles.workoutCardCalories}>{workout.calories} calories</Text>
                    </View>
                  </TouchableOpacity>
                ))
              ) : (
                <NoWorkoutsMessage />
              )}
            </View>
            
            {/* Recommendations */}
            <View style={styles.recommendationsContainer}>
              <Text style={styles.sectionTitle}>Recommended For You</Text>
              <View style={styles.recommendationCard}>
                <Image 
                  source={require('../../../assets/images/gym_icon2.png')}
                  style={styles.recommendationIcon}
                />
                <Text style={styles.recommendationText}>{getRecommendation()}</Text>
              </View>
            </View>
            
            <View style={styles.streakContainer}>
              <Text style={styles.streakText}>{getStreakText()}</Text>
            </View>
            
            {/* Adding bottom padding for tab navigation */}
            <View style={{ height: 30 }} />
          </ScrollView>
        )}
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
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 5,
  },
  profileButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#fff',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  progressSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
  },
  progressCircleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  progressCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 8,
    borderColor: '#fff',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressPercentage: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  progressStats: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginLeft: 20,
  },
  progressStat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  statLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 5,
    fontWeight: '500',
  },
  continueButton: {
    backgroundColor: '#8E44AD',
    borderRadius: 30,
    paddingVertical: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  chartContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 25,
  },
  chartTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
  },
  chart: {
    height: 150,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 10,
  },
  chartColumn: {
    alignItems: 'center',
    width: (width - 100) / 7, // Divide available space by 7 days
  },
  barContainer: {
    height: 100,
    width: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  bar: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 8,
  },
  dayLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 8,
  },
  barValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#fff',
    marginTop: 4,
  },
  monthlyContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 25,
  },
  progressContainer: {
    marginTop: 10,
  },
  progressWeek: {
    marginBottom: 15,
  },
  weekLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
    marginBottom: 8,
  },
  progressBarContainer: {
    height: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 5,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 6,
  },
  progressValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#fff',
    alignSelf: 'flex-end',
  },
  metricsContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 25,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  metricCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    width: (width - 100) / 3, // Divide available space by 3
  },
  wideMetricCard: {
    width: '100%',
  },
  metricValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  metricLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  recentContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 25,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  seeAllText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  workoutCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  workoutCardImage: {
    width: '100%',
    height: 130,
  },
  workoutCardContent: {
    padding: 15,
  },
  workoutCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  workoutCardDetails: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 5,
  },
  workoutCardCalories: {
    fontSize: 14,
    fontWeight: '500',
    color: '#fff',
  },
  recommendationsContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 25,
  },
  recommendationCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  recommendationIcon: {
    width: 40,
    height: 40,
    marginRight: 15,
  },
  recommendationText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
    lineHeight: 22,
  },
  streakContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 30,
    alignItems: 'center',
  },
  streakText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '600',
  },
  noDataText: {
    fontSize: 16,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 10,
    textAlign: 'center',
  },
  noWorkoutsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noWorkoutsText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  noWorkoutsSubtext: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  startWorkoutButton: {
    backgroundColor: '#8E44AD',
    borderRadius: 30,
    paddingVertical: 15,
    paddingHorizontal: 30,
    alignItems: 'center',
  },
  startWorkoutButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
});

export default MainScreen;
