import { apiClient, handleApiError } from './apiConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Helper function to get the current user ID
const getLoggedInUserId = async () => {
  try {
    const userData = await AsyncStorage.getItem('user_data');
    if (!userData) {
      throw new Error('No user data found');
    }
    const user = JSON.parse(userData);
    if (!user.userID) {
      throw new Error('User ID not found in stored data');
    }
    return user.userID;
  } catch (error) {
    console.error('Error getting logged in user ID:', error);
    throw error;
  }
};

// Get all available exercises from the workout library
export const getWorkoutLibrary = async () => {
  try {
    const response = await apiClient.get('/workoutLibrary');
    
    if (response.status === 200) {
      return {
        success: true,
        exercises: response.data?.exercises || []
      };
    }
    
    return {
      success: false,
      message: response.data?.error || 'Failed to fetch workout library',
      exercises: []
    };
  } catch (error) {
    console.error('Error fetching workout library:', error.response?.data || error.message);
    return {
      success: false,
      message: 'Error fetching workout library. Please try again later.',
      exercises: []
    };
  }
};

// Get all exercise videos with details
export const getExerciseVideos = async () => {
  try {
    const response = await apiClient.get('/exerciseVideos');
    
    if (response.status === 200) {
      return {
        success: true,
        videos: response.data?.exerciseVideos || []
      };
    }
    
    return {
      success: false,
      message: response.data?.error || 'Failed to fetch exercise videos',
      videos: []
    };
  } catch (error) {
    console.error('Error fetching exercise videos:', error.response?.data || error.message);
    return {
      success: false,
      message: 'Error fetching exercise videos. Please try again later.',
      videos: []
    };
  }
};

// Start a new workout session
export const startWorkout = async (exerciseId, duration) => {
  try {
    const userId = await getLoggedInUserId();
    
    const workoutData = {
      userID: userId,
      exerciseID: exerciseId,
      duration: duration // duration in seconds
    };
    
    const response = await apiClient.post('/startWorkout', workoutData);
    
    if (response.status === 201) {
      return {
        success: true,
        message: response.data.message || 'Workout started successfully',
        sessionData: response.data
      };
    }
    
    return {
      success: false,
      message: response.data.error || 'Failed to start workout'
    };
  } catch (error) {
    console.error('Error starting workout:', error.response?.data || error.message);
    
    // Handle missing user data specifically
    if (error.message && (error.message.includes('No user data found') || error.message.includes('User ID not found'))) {
      return {
        success: false,
        message: 'User not logged in. Please log in to start a workout.'
      };
    }
    
    if (error.response && error.response.status === 403) {
      return {
        success: false,
        message: 'Your account is inactive. Please contact support.'
      };
    }
    
    return handleApiError(error);
  }
};

// Get workout history for the current user
export const getWorkoutHistory = async (userId = null) => {
  try {
    // If userId is not provided, get the logged-in user's ID
    const userIdToUse = userId || await getLoggedInUserId();
    
    const response = await apiClient.get(`/workoutHistory/${userIdToUse}`);
    
    if (response.status === 200) {
      return {
        success: true,
        history: response.data.workoutHistory || []
      };
    }
    
    return {
      success: false,
      message: response.data.error || 'Failed to fetch workout history',
      history: []
    };
  } catch (error) {
    console.error('Error fetching workout history:', error.response?.data || error.message);
    
    // Handle specific error cases
    if (error.response) {
      if (error.response.status === 403) {
        return {
          success: false,
          message: 'Your account is inactive. Please contact support.',
          history: []
        };
      }
      
      // Handle the case where no workout sessions are found
      if (error.response.status === 404) {
        // Check if the error message specifically mentions no workout sessions found
        const errorMessage = error.response.data?.error || '';
        if (errorMessage.includes('No workout sessions found')) {
          console.log('No workout history found for user. Returning empty array.');
          return {
            success: true, // Consider this a success case with empty data
            message: 'No workout history found',
            history: []
          };
        }
        
        return {
          success: false,
          message: 'No workout history found.',
          history: []
        };
      }
    }
    
    return {
      success: false,
      message: 'Error fetching workout history. Please try again later.',
      history: []
    };
  }
};

// Calculate workout statistics from workout history
export const getWorkoutStatistics = async () => {
  try {
    const historyResponse = await getWorkoutHistory();
    
    if (!historyResponse.success) {
      return {
        success: false,
        message: historyResponse.message,
        stats: {
          totalWorkouts: 0,
          totalDuration: 0,
          avgPostureAccuracy: 0,
          lastWorkout: null
        }
      };
    }
    
    const history = historyResponse.history;
    
    if (history.length === 0) {
      return {
        success: true,
        stats: {
          totalWorkouts: 0,
          totalDuration: 0,
          avgPostureAccuracy: 0,
          lastWorkout: null
        }
      };
    }
    
    // Calculate statistics from workout history
    const totalWorkouts = history.length;
    const totalDuration = history.reduce((sum, session) => sum + session.duration, 0);
    const totalAccuracy = history.reduce((sum, session) => sum + (session.postureAccuracy || 0), 0);
    const avgPostureAccuracy = totalAccuracy / totalWorkouts;
    
    // Sort history by date to find the most recent workout
    const sortedHistory = [...history].sort((a, b) => {
      return new Date(b.date) - new Date(a.date);
    });
    const lastWorkout = sortedHistory[0];
    
    return {
      success: true,
      stats: {
        totalWorkouts,
        totalDuration,
        avgPostureAccuracy,
        lastWorkout
      }
    };
  } catch (error) {
    console.error('Error calculating workout statistics:', error);
    return {
      success: false,
      message: 'Error calculating workout statistics',
      stats: {
        totalWorkouts: 0,
        totalDuration: 0,
        avgPostureAccuracy: 0,
        lastWorkout: null
      }
    };
  }
};

// Get weekly progress data (calculated from workout history)
export const getWeeklyProgress = async () => {
  try {
    const historyResponse = await getWorkoutHistory();
    
    if (!historyResponse.success) {
      return {
        success: false,
        message: historyResponse.message,
        weeklyData: []
      };
    }
    
    const history = historyResponse.history;
    
    if (history.length === 0) {
      return {
        success: true,
        weeklyData: Array(7).fill(0)
      };
    }
    
    // Create a map for the days of the week
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const weeklyData = Array(7).fill(0);
    
    // Get the current date and calculate the start of the week (Sunday)
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay()); // Go back to Sunday
    startOfWeek.setHours(0, 0, 0, 0); // Start of the day
    
    // Filter workouts from this week and group by day
    history.forEach(session => {
      const sessionDate = new Date(session.date);
      
      // Check if this session is from the current week
      if (sessionDate >= startOfWeek) {
        const dayOfWeek = sessionDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
        weeklyData[dayOfWeek] += session.duration;
      }
    });
    
    return {
      success: true,
      weeklyData
    };
  } catch (error) {
    console.error('Error calculating weekly progress:', error);
    return {
      success: false,
      message: 'Error calculating weekly progress',
      weeklyData: Array(7).fill(0)
    };
  }
};

// Get monthly progress data (calculated from workout history)
export const getMonthlyProgress = async () => {
  try {
    const historyResponse = await getWorkoutHistory();
    
    if (!historyResponse.success) {
      return {
        success: false,
        message: historyResponse.message,
        monthlyData: []
      };
    }
    
    const history = historyResponse.history;
    
    if (history.length === 0) {
      return {
        success: true,
        monthlyData: Array(12).fill(0)
      };
    }
    
    // Create an array for the months
    const monthlyData = Array(12).fill(0);
    
    // Get the current year
    const currentYear = new Date().getFullYear();
    
    // Filter workouts from this year and group by month
    history.forEach(session => {
      const sessionDate = new Date(session.date);
      
      // Check if this session is from the current year
      if (sessionDate.getFullYear() === currentYear) {
        const month = sessionDate.getMonth(); // 0 = January, 1 = February, etc.
        monthlyData[month] += session.duration;
      }
    });
    
    return {
      success: true,
      monthlyData
    };
  } catch (error) {
    console.error('Error calculating monthly progress:', error);
    return {
      success: false,
      message: 'Error calculating monthly progress',
      monthlyData: Array(12).fill(0)
    };
  }
};

// Get recent workouts data
export const getRecentWorkouts = async (limit = 5) => {
  try {
    const historyResponse = await getWorkoutHistory();
    
    if (!historyResponse.success) {
      return {
        success: false,
        message: historyResponse.message,
        recentWorkouts: []
      };
    }
    
    const history = historyResponse.history;
    
    if (history.length === 0) {
      return {
        success: true,
        recentWorkouts: []
      };
    }
    
    // Sort history by date to find the most recent workouts
    const sortedHistory = [...history].sort((a, b) => {
      return new Date(b.date) - new Date(a.date);
    });
    
    // Take just the most recent workouts
    const recentWorkouts = sortedHistory.slice(0, limit);
    
    return {
      success: true,
      recentWorkouts
    };
  } catch (error) {
    console.error('Error getting recent workouts:', error);
    return {
      success: false,
      message: 'Error getting recent workouts',
      recentWorkouts: []
    };
  }
};

// Get all workout types
export const getWorkoutTypes = async () => {
  try {
    const response = await apiClient.get('/api/workouts/types');
    
    if (response.status === 200) {
      return {
        success: true,
        data: response.data
      };
    }
    
    return {
      success: false,
      message: 'Failed to fetch workout types'
    };
  } catch (error) {
    return handleApiError(error);
  }
};

// Create a new workout type (admin only)
export const createWorkoutType = async (workoutTypeData) => {
  try {
    const response = await apiClient.post('/api/workouts/types', {
      name: workoutTypeData.name,
      description: workoutTypeData.description
    });
    
    if (response.status === 201) {
      return {
        success: true,
        data: response.data,
        message: 'Workout type created successfully'
      };
    }
    
    return {
      success: false,
      message: 'Failed to create workout type'
    };
  } catch (error) {
    return handleApiError(error);
  }
};

// Get exercises for a specific workout type
export const getWorkoutTypeExercises = async (workoutTypeId) => {
  try {
    const response = await apiClient.get(`/api/workouts/types/${workoutTypeId}/exercises`);
    
    if (response.status === 200) {
      return {
        success: true,
        data: response.data
      };
    }
    
    return {
      success: false,
      message: 'Failed to fetch exercises'
    };
  } catch (error) {
    return handleApiError(error);
  }
};

// Add an exercise to a workout type (admin only)
export const addExerciseToWorkoutType = async (workoutTypeId, exerciseData) => {
  try {
    const response = await apiClient.post(`/api/workouts/types/${workoutTypeId}/exercises`, {
      name: exerciseData.name,
      type: exerciseData.type,
      targetedBodyParts: exerciseData.targetedBodyParts,
      description: exerciseData.description,
      difficulty_level: exerciseData.difficulty_level
    });
    
    if (response.status === 201) {
      return {
        success: true,
        data: response.data,
        message: 'Exercise added to workout type successfully'
      };
    }
    
    return {
      success: false,
      message: 'Failed to add exercise to workout type'
    };
  } catch (error) {
    return handleApiError(error);
  }
};

// Get all exercises
export const getAllExercises = async () => {
  try {
    const response = await apiClient.get('/api/exercises/');
    
    if (response.status === 200) {
      return {
        success: true,
        data: response.data
      };
    }
    
    return {
      success: false,
      message: 'Failed to fetch exercises'
    };
  } catch (error) {
    return handleApiError(error);
  }
};

// Get exercise details
export const getExerciseDetails = async (exerciseId) => {
  try {
    const response = await apiClient.get(`/api/exercises/${exerciseId}`);
    
    if (response.status === 200) {
      return {
        success: true,
        data: response.data
      };
    }
    
    return {
      success: false,
      message: 'Failed to fetch exercise details'
    };
  } catch (error) {
    return handleApiError(error);
  }
};

export default {
  getWorkoutLibrary,
  getExerciseVideos,
  startWorkout,
  getWorkoutHistory,
  getWorkoutStatistics,
  getWeeklyProgress,
  getMonthlyProgress,
  getRecentWorkouts,
  getWorkoutTypes,
  createWorkoutType,
  getWorkoutTypeExercises,
  addExerciseToWorkoutType,
  getAllExercises,
  getExerciseDetails
}; 