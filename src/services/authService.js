import { apiClient, handleApiError } from './apiConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
export const googleAuth = async (googleData) => {
  try {
    console.log('Starting Google auth process with backend', googleData);
    
    // Validate that we have the required data
    if (!googleData) {
      console.error('GoogleData is undefined');
      return { success: false, message: 'Invalid Google authentication data' };
    }
    
    // Extract the token - ensure we have it
    const idToken = googleData.idToken;
    if (!idToken) {
      console.error('Missing required idToken in Google auth data');
      return { success: false, message: 'Invalid Google authentication data (missing idToken)' };
    }
    
    // Log token type and partial value for debugging
    const isPseudoToken = idToken.startsWith('pseudo-token');
    console.log('Token type:', isPseudoToken ? 'Using pseudo-token' : 'Using real token');
    console.log('Token value (partial):', isPseudoToken ? idToken : (idToken.substring(0, 10) + '...'));
    
    // For development: if using pseudo-token, create mock user data
    if (isPseudoToken) {
      console.log('Using pseudo-token - creating mock user data without backend call');
      
      // Extract user ID from pseudo-token if possible
      const userId = idToken.split('-').pop() || '12345';
      
      // Create a fake user response as if it came from the backend
      const mockUser = {
        userID: userId,
        username: googleData.email ? googleData.email.split('@')[0] : 'googleuser',
        email: googleData.email || 'user@example.com',
        hasProfile: false,
        isGoogleUser: true
      };
      
      // Save the mock user to storage
      await saveUserToStorage(mockUser);
      
      return {
        success: true,
        user: mockUser,
        isNewUser: true
      };
    }
    
    // Regular flow with real token - prepare data for backend
    const safeGoogleData = {
      id_token: idToken,
      email: googleData.email || '',
      name: googleData.name || 'Google User',
      photo: googleData.photo || '',
      // Add a random secure password for Google users to satisfy database constraints
      password: `Google_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`
    };
    
    console.log('Sending data to backend:', JSON.stringify({...safeGoogleData, password: '****HIDDEN****'}));
    
    // Log the API endpoint we're trying to reach
    const endpoint = '/google-auth';
    console.log('Making API request to:', endpoint);
    
    // Call our API endpoint for Google authentication using apiClient
    const response = await apiClient.post(endpoint, safeGoogleData);
    
    if (response.status === 200 || response.status === 201) {
      console.log('Google auth successful with backend, storing user data');
      
      // Is this a new or existing user?
      const isNewUser = response.status === 201;
      
      // Extract user data from response
      const user = {
        userID: response.data.userID,
        username: response.data.username || safeGoogleData.email.split('@')[0],
        email: safeGoogleData.email,
        hasProfile: response.data.hasProfile || false,
        isGoogleUser: true
      };
      
      // Save to storage
      await saveUserToStorage(user);
      
      return {
        success: true,
        user,
        isNewUser
      };
    } else {
      console.error('Google auth failed with backend:', response.data);
      return {
        success: false,
        message: response.data.error || 'Failed to authenticate with Google'
      };
    }
  } catch (error) {
    console.error('Error during Google auth with backend:', error);
    console.error('Error details:', error.message);
    
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
      
      if (error.response.status === 404) {
        return {
          success: false,
          message: 'Server endpoint not found. Please check your API configuration.'
        };
      }
      if (error.response.status === 403) {
        return {
          success: false,
          message: 'Account is inactive. Please contact support.'
        };
      }
      if (error.response.status === 500) {
        return {
          success: false,
          message: 'Server error occurred. Please try again later.'
        };
      }
    }
    
    // Network errors
    if (error.message.includes('Network Error')) {
      return {
        success: false,
        message: 'Network connection error. Please check your internet connection.'
      };
    }
    
    return {
      success: false,
      message: 'Error connecting to the server. Please try again.'
    };
  }
};

// Auth service functions
export const register = async (userData) => {
  try {
    const { full_name, username, password, email } = userData;
    
    if (!full_name || !username || !password || !email) {
      return {
        success: false,
        message: 'All fields (full name, username, password, and email) are required.'
      };
    }
    
    console.log('Registering user:', username);
    
    const response = await apiClient.post('/register', {
      full_name,
      username,
      password,
      email
    });
    
    if (response.status === 201) {
      console.log('Registration successful:', response.data);
      
      // The Flask backend doesn't return a userID in the response,
      // so we need to log in to get it
      const loginResponse = await login({ username, password });
      
      if (loginResponse.success) {
        return {
          success: true,
          message: response.data.message || 'Registration successful!',
          user: loginResponse.user
        };
      }
      
      return {
        success: true,
        message: response.data.message || 'Registration successful!',
        nextStep: 'login'
      };
    }
    
    return {
      success: false,
      message: response.data.error || 'Registration failed'
    };
  } catch (error) {
    console.error('Registration error:', error.response?.data || error.message);
    return handleApiError(error);
  }
};

export const login = async (credentials) => {
  try {
    const { username, password } = credentials;
    
    if (!username || !password) {
      return {
        success: false,
        message: 'Username and password are required.'
      };
    }
    
    console.log('Logging in user:', username);
    
    const response = await apiClient.post('/login', { username, password });
    
    if (response.status === 200) {
      console.log('Login successful:', response.data);
      
      // Save user data to storage
      const user = {
        userID: response.data.userID,
        username: username,
        // Check if user has a profile by attempting to fetch it
        hasProfile: false // We'll update this after checking profile
      };
      
      // Check if the user has a profile by querying the updateUserProfile endpoint
      try {
        const profileResponse = await apiClient.get(`/updateUserProfile/${user.userID}`);
        
        if (profileResponse.status === 200 && 
            profileResponse.data?.user?.gender) {
          user.hasProfile = true;
        }
      } catch (profileError) {
        // If we get a 404 or any other error, user might not have a profile
        user.hasProfile = false;
      }
      
      await saveUserToStorage(user);
      
      return {
        success: true,
        message: response.data.message || 'Login successful!',
        user
      };
    }
    
    return {
      success: false,
      message: response.data.error || 'Login failed'
    };
  } catch (error) {
    console.error('Login error:', error.response?.data || error.message);
    
    // Handle specific error cases from the Flask backend
    if (error.response) {
      if (error.response.status === 404) {
        return {
          success: false,
          message: 'Username not found. Please check your username and try again.'
        };
      }
      if (error.response.status === 401) {
        return {
          success: false,
          message: 'Incorrect password. Please try again.'
        };
      }
      if (error.response.status === 403) {
        return {
          success: false,
          message: 'Account is inactive. Please contact support.'
        };
      }
    }
    
    return handleApiError(error);
  }
};

export const logout = async () => {
  try {
    // Get current user data
    const userData = await getUserFromStorage();
    console.log('Logging out user:', userData?.username);
    
    // Clear user data from storage
    await clearUserFromStorage();
    
    return {
      success: true,
      message: 'Logged out successfully'
    };
  } catch (error) {
    console.error('Logout error:', error);
    return {
      success: false,
      message: 'Failed to logout'
    };
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
  register,
  login,
  logout,
  checkAuthStatus,
  getUserFromStorage,
  saveUserToStorage,
  clearUserFromStorage,
  checkUserExists,
  googleAuth
}; 