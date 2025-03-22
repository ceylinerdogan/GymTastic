import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configuration
const USE_MOCK_API = true; // Set to false when you have a real backend

// Base API URL - replace with your actual API endpoint in production
const API_BASE_URL = 'http://10.0.2.2:3000/api';  // 10.0.2.2 is the special IP for Android emulator to access host machine
const AUTH_TOKEN_KEY = 'auth_token';
const USER_DATA_KEY_PREFIX = 'user_data_'; // Changed from USER_DATA_KEY to USER_DATA_KEY_PREFIX

// Mock data for development
const MOCK_USERS = {};
const MOCK_PROFILES = {};
const MOCK_WORKOUTS = [
  {
    id: '1',
    name: 'Full Body Workout',
    description: 'Complete workout targeting all major muscle groups',
    duration: 45,
    level: 'beginner',
    calories: 320,
    image: require('../../assets/images/squat.png'),
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
    image: require('../../assets/images/plank.png'),
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
    image: require('../../assets/images/lunge.jpg'),
    category: ['advanced', 'strength'],
    exercises: [
      { name: 'Squat', sets: 4, reps: 15, restTime: 60 },
      { name: 'Lunge', sets: 3, reps: 12, restTime: 60 },
      { name: 'Calf Raises', sets: 3, reps: 20, restTime: 45 },
    ]
  }
];
const MOCK_WORKOUT_LOGS = [];

// Load stored users and profiles from AsyncStorage
(async () => {
  try {
    // Load users
    const storedUsers = await AsyncStorage.getItem('MOCK_USERS');
    if (storedUsers) {
      const parsedUsers = JSON.parse(storedUsers);
      Object.assign(MOCK_USERS, parsedUsers);
      console.log('Loaded users from AsyncStorage:', MOCK_USERS);
    }

    // Load profiles
    const storedProfiles = await AsyncStorage.getItem('MOCK_PROFILES');
    if (storedProfiles) {
      const parsedProfiles = JSON.parse(storedProfiles);
      Object.assign(MOCK_PROFILES, parsedProfiles);
      console.log('Loaded profiles from AsyncStorage:', MOCK_PROFILES);
    }
  } catch (error) {
    console.error('Error loading stored user data:', error);
  }
})();

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Add request interceptor to include auth token in requests
apiClient.interceptors.request.use(
  async (config) => {
    const token = await getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Token management with AsyncStorage
const storeAuthToken = async (token) => {
  try {
    await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
  } catch (error) {
    console.error('Error storing auth token:', error);
  }
};

const getAuthToken = async () => {
  try {
    return await AsyncStorage.getItem(AUTH_TOKEN_KEY);
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

const clearAuthToken = async () => {
  try {
    await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
  } catch (error) {
    console.error('Error clearing auth token:', error);
  }
};

// Error handler for API responses
const handleApiError = (error) => {
  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    const { status, data } = error.response;
    
    if (status === 401) {
      // Unauthorized - clear token and redirect to login
      clearAuthToken();
      // You would typically navigate to login screen here
      return Promise.reject({
        type: 'auth',
        message: 'Your session has expired. Please log in again.',
        details: data
      });
    }
    
    return Promise.reject({
      type: 'server',
      message: data.message || 'Server error occurred',
      status,
      details: data
    });
  } else if (error.request) {
    // The request was made but no response was received
    return Promise.reject({
      type: 'network',
      message: 'Network error. Please check your connection.',
      details: error.request
    });
  } else {
    // Something happened in setting up the request
    return Promise.reject({
      type: 'setup',
      message: error.message || 'An error occurred while setting up the request',
      details: error
    });
  }
};

// Mock API Implementation
const mockAuthService = {
  register: async (userData) => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const { email, password, name, surname } = userData;
    
    // Check if email already exists
    if (MOCK_USERS[email]) {
      return Promise.reject({
        type: 'server',
        status: 409,
        message: 'A user with this email already exists',
      });
    }
    
    // Create new user
    const userId = `user_${Date.now()}`;
    MOCK_USERS[email] = { userId, email, password };
    
    // Store user data in AsyncStorage so it persists between app runs
    try {
      await AsyncStorage.setItem('MOCK_USERS', JSON.stringify(MOCK_USERS));
      console.log('Stored users:', MOCK_USERS);
    } catch (error) {
      console.error('Error storing user data:', error);
    }
    
    // Create initial profile
    MOCK_PROFILES[userId] = {
      userId,
      email,
      firstName: name || '',
      lastName: surname || '',
      gender: '',
      dateOfBirth: '',
      weight: 70,
      height: 170,
      fitnessGoal: 'lose_weight',
      activityLevel: 'moderate',
      createdAt: new Date().toISOString()
    };
    
    // Store profiles in AsyncStorage
    try {
      await AsyncStorage.setItem('MOCK_PROFILES', JSON.stringify(MOCK_PROFILES));
      console.log('Stored profiles:', MOCK_PROFILES);
    } catch (error) {
      console.error('Error storing profile data:', error);
    }
    
    // Clear any existing user data
    await AsyncStorage.removeItem('current_user_id');
    await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
    
    // Store the current user ID after registration
    await AsyncStorage.setItem('current_user_id', userId);
    
    // Generate token
    const token = `mock_token_${userId}`;
    await storeAuthToken(token);
    
    // Store user data with a unique key
    const userKey = `${USER_DATA_KEY_PREFIX}${userId}`;
    await AsyncStorage.setItem(userKey, JSON.stringify(MOCK_PROFILES[userId]));
    
    return {
      success: true,
      user: { id: userId, email, name, surname }
    };
  },
  
  login: async (credentials) => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const { email, password } = credentials;
    
    // Try to load users again in case they were registered on another session
    try {
      const storedUsers = await AsyncStorage.getItem('MOCK_USERS');
      if (storedUsers) {
        const parsedUsers = JSON.parse(storedUsers);
        Object.assign(MOCK_USERS, parsedUsers);
      }
    } catch (error) {
      console.error('Error loading stored users during login:', error);
    }
    
    // Check credentials
    const user = MOCK_USERS[email];
    if (!user || user.password !== password) {
      return Promise.reject({
        type: 'server',
        status: 401,
        message: 'Invalid email or password',
      });
    }
    
    // Check if we have profile data for this user
    if (!MOCK_PROFILES[user.userId]) {
      try {
        // Try to find profile in AsyncStorage
        const userKey = `${USER_DATA_KEY_PREFIX}${user.userId}`;
        const userProfile = await AsyncStorage.getItem(userKey);
        
        if (userProfile) {
          // Load it into MOCK_PROFILES
          MOCK_PROFILES[user.userId] = JSON.parse(userProfile);
          console.log(`Loaded profile for user ${user.userId} from AsyncStorage`);
          
          // Also save to shared profiles storage
          await AsyncStorage.setItem('MOCK_PROFILES', JSON.stringify(MOCK_PROFILES));
        } else {
          // Create default profile if none exists
          MOCK_PROFILES[user.userId] = {
            userId: user.userId,
            email: email,
            firstName: '',
            lastName: '',
            gender: '',
            dateOfBirth: '',
            weight: 70,
            height: 170,
            fitnessGoal: 'lose_weight',
            activityLevel: 'moderate',
            createdAt: new Date().toISOString()
          };
          
          // Save profile to user's storage key
          await AsyncStorage.setItem(userKey, JSON.stringify(MOCK_PROFILES[user.userId]));
          
          // Also save to shared profiles storage
          await AsyncStorage.setItem('MOCK_PROFILES', JSON.stringify(MOCK_PROFILES));
        }
      } catch (error) {
        console.error('Error handling profile during login:', error);
      }
    }
    
    // Store current user ID
    await AsyncStorage.setItem('current_user_id', user.userId);
    
    // Generate token
    const token = `mock_token_${user.userId}`;
    await storeAuthToken(token);
    
    return {
      token,
      user: { id: user.userId, email: user.email }
    };
  },
  
  createProfile: async (profileData) => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const { userId, email } = profileData;
    
    // Store profile data
    MOCK_PROFILES[userId] = { ...profileData, createdAt: new Date().toISOString() };
    
    // Store user data with a unique key for each user
    const userKey = `${USER_DATA_KEY_PREFIX}${userId}`;
    await AsyncStorage.setItem(userKey, JSON.stringify(MOCK_PROFILES[userId]));
    
    // Also store which user is currently logged in
    await AsyncStorage.setItem('current_user_id', userId);
    
    return {
      success: true,
      profile: MOCK_PROFILES[userId]
    };
  },
  
  getProfile: async () => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Get the current user ID
    const currentUserId = await AsyncStorage.getItem('current_user_id');
    
    if (!currentUserId) {
      return Promise.reject({
        type: 'auth',
        status: 401,
        message: 'No user is currently logged in',
      });
    }
    
    // Try to get user data from storage using the unique key
    const userKey = `${USER_DATA_KEY_PREFIX}${currentUserId}`;
    console.log('Fetching user profile with key:', userKey);
    const userData = await AsyncStorage.getItem(userKey);
    
    if (userData) {
      const parsedData = JSON.parse(userData);
      console.log('Retrieved profile:', parsedData);
      return { profile: parsedData };
    }
    
    // If we can't find the data with the key, check if this user has a profile in MOCK_PROFILES
    if (MOCK_PROFILES[currentUserId]) {
      console.log('Found profile in MOCK_PROFILES');
      // Store it in AsyncStorage for future retrieval
      await AsyncStorage.setItem(userKey, JSON.stringify(MOCK_PROFILES[currentUserId]));
      return { profile: MOCK_PROFILES[currentUserId] };
    }
    
    return Promise.reject({
      type: 'server',
      status: 404,
      message: 'Profile not found',
    });
  },
  
  updateProfile: async (profileData) => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const { userId } = profileData;
    
    if (!userId || !MOCK_PROFILES[userId]) {
      return Promise.reject({
        type: 'server',
        status: 404,
        message: 'Profile not found',
      });
    }
    
    // Update profile
    MOCK_PROFILES[userId] = { ...MOCK_PROFILES[userId], ...profileData, updatedAt: new Date().toISOString() };
    
    // Update stored user data with the unique key
    const userKey = `${USER_DATA_KEY_PREFIX}${userId}`;
    await AsyncStorage.setItem(userKey, JSON.stringify(MOCK_PROFILES[userId]));
    
    return {
      success: true,
      profile: MOCK_PROFILES[userId]
    };
  },
  
  logout: async () => {
    try {
      // Get current user ID before clearing
      const currentUserId = await AsyncStorage.getItem('current_user_id');
      
      // Clear auth token
      await clearAuthToken();
      
      // Clear current user ID
      await AsyncStorage.removeItem('current_user_id');
      
      // We no longer delete the user's data when logging out
      // This allows the data to persist between sessions
      
      console.log('Logout successful, session cleared but user data preserved');
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      return { success: false, error };
    }
  }
};

const mockWorkoutService = {
  getWorkouts: async () => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 700));
    
    return {
      workouts: MOCK_WORKOUTS,
      categories: [
        { id: 'all', name: 'All Workouts' },
        { id: 'beginner', name: 'Beginner' },
        { id: 'intermediate', name: 'Intermediate' },
        { id: 'advanced', name: 'Advanced' },
        { id: 'strength', name: 'Strength' }
      ]
    };
  },
  
  getWorkoutById: async (id) => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const workout = MOCK_WORKOUTS.find(w => w.id === id);
    
    if (!workout) {
      return Promise.reject({
        type: 'server',
        status: 404,
        message: 'Workout not found',
      });
    }
    
    return { workout };
  },
  
  logWorkout: async (workoutData) => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const logId = `log_${Date.now()}`;
    const newLog = {
      id: logId,
      ...workoutData,
      completedAt: new Date().toISOString()
    };
    
    MOCK_WORKOUT_LOGS.push(newLog);
    
    return {
      success: true,
      workoutLog: newLog
    };
  },
  
  getWorkoutHistory: async () => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 600));
    
    return {
      logs: MOCK_WORKOUT_LOGS
    };
  }
};

// Export the appropriate service based on configuration
export const authService = USE_MOCK_API ? mockAuthService : {
  // Register a new user
  register: async (userData) => {
    try {
      const response = await apiClient.post('/auth/register', userData);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  // Login a user
  login: async (credentials) => {
    try {
      const response = await apiClient.post('/auth/login', credentials);
      const { token, user } = response.data;
      
      // Store the auth token
      await storeAuthToken(token);
      
      return { token, user };
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  // Create user profile
  createProfile: async (profileData) => {
    try {
      const response = await apiClient.post('/profile', profileData);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  // Get user profile
  getProfile: async () => {
    try {
      const response = await apiClient.get('/profile');
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  // Update user profile
  updateProfile: async (profileData) => {
    try {
      const response = await apiClient.put('/profile', profileData);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  // Log out user
  logout: async () => {
    try {
      await clearAuthToken();
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      return { success: false, error };
    }
  }
};

// Workout Service
export const workoutService = USE_MOCK_API ? mockWorkoutService : {
  // Get all workouts
  getWorkouts: async () => {
    try {
      const response = await apiClient.get('/workouts');
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  // Get workout by id
  getWorkoutById: async (id) => {
    try {
      const response = await apiClient.get(`/workouts/${id}`);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  // Log a completed workout
  logWorkout: async (workoutData) => {
    try {
      const response = await apiClient.post('/workout-logs', workoutData);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  // Get workout history
  getWorkoutHistory: async () => {
    try {
      const response = await apiClient.get('/workout-logs');
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  }
};

export default {
  authService,
  workoutService
}; 