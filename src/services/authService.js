import { apiClient, handleApiError } from './apiConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
import socketService from './socketService';

// Storage helpers
export const saveUserToStorage = async (userData) => {
  try {
    await AsyncStorage.setItem('user_data', JSON.stringify(userData));
    return userData;
  } catch (error) {
    console.error('Error saving user data:', error);
    throw error;
  }
};

export const getUserFromStorage = async () => {
  try {
    const userData = await AsyncStorage.getItem('user_data');
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error('Error getting user data:', error);
    return null;
  }
};

export const clearUserFromStorage = async () => {
  try {
    await AsyncStorage.removeItem('user_data');
    return true;
  } catch (error) {
    console.error('Error clearing user data:', error);
    return false;
  }
};

// Check if user exists and is active in database
export const checkUserExists = async (userId) => {
  try {
    if (!userId) {
      throw new Error('User ID is required to check user existence');
    }
    
    // Use the new dedicated endpoint to check user existence and active status
    const response = await apiClient.get(`/checkUser/${userId}`);
    
    if (response.status === 200) {
      return {
        exists: response.data.exists,
        active: response.data.active,
        message: response.data.active 
          ? 'User exists and is active' 
          : 'User account is inactive. Please contact support.'
      };
    }
    
    return {
      exists: false,
      active: false,
      message: 'Unable to verify user existence'
    };
  } catch (error) {
    console.error('Error checking user existence:', error);
    return {
      exists: false,
      active: false,
      message: 'Unable to verify user existence'
    };
  }
};

// Google Authentication
export const googleAuth = async (tokenData) => {
  try {
    const response = await apiClient.post('/api/auth/google', {
      token: tokenData.token
    });
    
    console.log('Google auth response:', JSON.stringify(response.data));
    
    // Extract token data
    const token = response.data.token;
    const refresh_token = response.data.refresh_token;
    const user_id = response.data.user_id;
    
    // Store authentication data
    await AsyncStorage.setItem('authToken', token);
    await AsyncStorage.setItem('refreshToken', refresh_token);
    await AsyncStorage.setItem('userId', user_id.toString());
    
    // Update API client authorization header
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    
    // Authenticate socket if needed
    socketService.authenticateSocket();
    
    return { 
      success: true, 
      data: { 
        token, 
        refresh_token,
        user: {
          id: user_id
        }
      }
    };
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Authentication with Firebase token
 * @param {Object} tokenData 
 * @param {string} tokenData.token - Firebase auth token
 * @returns {Object} - { success: boolean, data?: Object, error?: string }
 */
export const firebaseAuth = async (tokenData) => {
  try {
    const response = await apiClient.post('/api/auth/firebase', {
      token: tokenData.token
    });
    
    console.log('Firebase auth response:', JSON.stringify(response.data));
    
    // Extract token data
    const token = response.data.token;
    const refresh_token = response.data.refresh_token;
    const user_id = response.data.user_id;
    
    // Store authentication data
    await AsyncStorage.setItem('authToken', token);
    await AsyncStorage.setItem('refreshToken', refresh_token);
    await AsyncStorage.setItem('userId', user_id.toString());
    
    // Update API client authorization header
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    
    // Authenticate socket if needed
    socketService.authenticateSocket();
    
    return { 
      success: true, 
      data: { 
        token, 
        refresh_token,
        user: {
          id: user_id
        }
      }
    };
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Login user with email and password
 * @param {Object} credentials - User credentials object
 * @param {string} credentials.username - User username
 * @param {string} credentials.password - User password
 * @returns {Object} - { success: boolean, data?: Object, error?: string }
 */
export const login = async (credentials) => {
  try {
    const { username, password } = credentials;
    const response = await apiClient.post('/api/auth/login', {
      username,
      password
    });
    
    console.log('Login response:', JSON.stringify(response.data));
    
    // Extract user data and token from response
    const token = response.data.token;
    const refresh_token = response.data.refresh_token;
    const user_id = response.data.user_id;
    
    // Store authentication data
    await AsyncStorage.setItem('authToken', token);
    await AsyncStorage.setItem('refreshToken', refresh_token);
    await AsyncStorage.setItem('userId', user_id.toString());
    
    // Update API client authorization header
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    
    // Authenticate socket with token
    socketService.authenticateSocket();
    
    return { 
      success: true, 
      data: { 
        token, 
        refresh_token,
        user: {
          id: user_id
        } 
      } 
    };
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Register a new user
 * @param {Object} userData - User data object
 * @returns {Object} - { success: boolean, data?: Object, error?: string }
 */
export const register = async (userData) => {
  try {
    // Map the userData to match the expected API format
    const payload = {
      full_name: userData.fullName,
      username: userData.username,
      password: userData.password,
      email: userData.email,
      gender: userData.gender || "",
      height: userData.height || 0,
      weight: userData.weight || 0,
      birth_date: userData.birthDate || "",
      fitness_goal: userData.fitnessGoal || "",
      activity_level: userData.activityLevel || "",
      role: userData.role || "user"
    };

    const response = await apiClient.post('/api/auth/register', payload);
    
    console.log('Registration successful:', response.data);
    
    // If auto-login after registration is desired,
    // you can call login here with the username and password
    
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Logout current user
 * @returns {Promise<void>}
 */
export const logout = async () => {
  try {
    // Close socket connection
    socketService.disconnectSocket();
    
    // Remove stored auth data
    await AsyncStorage.removeItem('authToken');
    await AsyncStorage.removeItem('refreshToken');
    await AsyncStorage.removeItem('userId');
    
    // Remove authorization header
    delete apiClient.defaults.headers.common['Authorization'];
    
    return { success: true };
  } catch (error) {
    console.error('Logout error:', error);
    return { success: false, error: 'Failed to logout properly' };
  }
};

/**
 * Check if user is authenticated
 * @returns {Promise<boolean>}
 */
export const isAuthenticated = async () => {
  try {
    const token = await AsyncStorage.getItem('authToken');
    return !!token;
  } catch (error) {
    console.error('Auth check error:', error);
    return false;
  }
};

/**
 * Get current user ID
 * @returns {Promise<string|null>}
 */
export const getCurrentUserId = async () => {
  try {
    return await AsyncStorage.getItem('userId');
  } catch (error) {
    console.error('Get user ID error:', error);
    return null;
  }
};

// Initialize auth state on app load
export const initializeAuth = async () => {
  try {
    const token = await AsyncStorage.getItem('authToken');
    if (token) {
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      return true;
    }
    return false;
  } catch (error) {
    console.error('Initialize auth error:', error);
    return false;
  }
};

export const checkAuthStatus = async () => {
  try {
    const userData = await getUserFromStorage();
    
    if (!userData || !userData.userID) {
      return {
        isAuthenticated: false,
        message: 'No user data found'
      };
    }
    
    // Optionally verify the user exists and is active
    try {
      const userStatus = await checkUserExists(userData.userID);
      
      if (!userStatus.exists) {
        // User no longer exists in the database
        await clearUserFromStorage();
        return {
          isAuthenticated: false,
          message: 'User account no longer exists'
        };
      }
      
      if (!userStatus.active) {
        // User account is inactive
        await clearUserFromStorage();
        return {
          isAuthenticated: false,
          message: 'User account is inactive. Please contact support.'
        };
      }
    } catch (error) {
      // If we can't verify the user status, continue with local data
      console.warn('Could not verify user status:', error);
    }
    
    return {
      isAuthenticated: true,
      user: userData
    };
  } catch (error) {
    console.error('Auth status check error:', error);
    return {
      isAuthenticated: false,
      message: 'Failed to check authentication status'
    };
  }
};

export default {
  login,
  register,
  logout,
  isAuthenticated,
  getCurrentUserId,
  initializeAuth,
  checkAuthStatus,
  getUserFromStorage,
  saveUserToStorage,
  clearUserFromStorage,
  checkUserExists,
  googleAuth,
  firebaseAuth
}; 