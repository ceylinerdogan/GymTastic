import { apiClient, handleApiError } from './apiConfig';
import { saveUserToStorage } from './authService';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Create a new user profile
export const createProfile = async (profileData) => {
  try {
    console.log('Creating profile with data:', {
      ...profileData,
      profilepic: profileData.profilepic ? '(Base64 image data present)' : '(No image data)'
    });
    
    // Ensure all required fields are present
    const requiredFields = ['userID', 'gender', 'height', 'weight', 'birth_date', 'fitness_goal', 'activity_level'];
    const missingFields = requiredFields.filter(field => !profileData[field]);
    
    if (missingFields.length > 0) {
      return {
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`
      };
    }
    
    // Make sure height and weight are numeric
    const numericData = {
      ...profileData,
      height: parseFloat(profileData.height),
      weight: parseFloat(profileData.weight)
    };
    
    // Verify base64 image format if present
    if (profileData.profilepic && typeof profileData.profilepic === 'string') {
      // Check if it's a valid base64 data URL
      if (!profileData.profilepic.startsWith('data:image')) {
        console.error('Invalid profile image format. Expected data:image format');
        // Don't include the image if it's not in the right format
        delete numericData.profilepic;
      }
    }
    
    const response = await apiClient.post('/createProfile', numericData);
    
    if (response.status === 201) {
      console.log('Profile created successfully:', response.data);
      
      // Update user data in storage with profile info
      await saveUserToStorage({
        userID: profileData.userID,
        hasProfile: true
      });
      
      return {
        success: true,
        message: response.data.message || 'Profile created successfully',
        profile: response.data.profile
      };
    }
    
    return {
      success: false,
      message: response.data.error || 'Failed to create profile'
    };
  } catch (error) {
    console.error('Create profile error:', error.response?.data || error.message);
    return handleApiError(error);
  }
};

// Get a user's profile details
export const getProfile = async (userId) => {
  try {
    if (!userId) {
      throw new Error('User ID is required to fetch profile');
    }
    
    console.log(`Fetching profile from /userProfile/${userId}`);
    const response = await apiClient.get(`/userProfile/${userId}`);
    
    if (response.status === 200) {
      console.log('Profile API response:', response.data);
      
      // Extract user data from response
      const userData = response.data;
      
      // Process profile picture if it exists
      let profilePic = null;
      if (userData.profilepic) {
        // Check if it's already a data URL
        if (userData.profilepic.startsWith('data:image')) {
          profilePic = userData.profilepic;
        } else {
          // Assume it's a base64 string without the prefix
          profilePic = userData.profilepic;
        }
        console.log('Profile picture received from API, length:', userData.profilepic.length);
      }
      
      // The API returns height in meters and weight in kg as numbers
      const height = userData.height !== null && userData.height !== undefined ? userData.height : 0;
      const weight = userData.weight !== null && userData.weight !== undefined ? userData.weight : 0;
      
      // Calculate BMI
      let bmi = 0;
      if (height > 0 && weight > 0) {
        // Check if height is in meters (less than 3) or cm (greater than 3)
        const heightInMeters = height < 3 ? height : height / 100;
        bmi = weight / (heightInMeters * heightInMeters);
      }
      
      console.log('Processed profile values:', { 
        height, 
        weight, 
        bmi: bmi.toFixed(1)
      });
      
      // Ensure all fields are properly extracted, with fallbacks to avoid null values
      return {
        success: true,
        profile: {
          userID: userData.userID || 0,
          full_name: userData.full_name || '',
          username: userData.username || '',
          email: userData.email || '',
          gender: userData.gender || '',
          height: height,
          weight: weight,
          bmi: bmi > 0 ? bmi.toFixed(1) : 0,
          profilepic: profilePic,
          birth_date: userData.birth_date || '',
          fitness_goal: userData.fitness_goal || '',
          activity_level: userData.activity_level || '',
          isActive: userData.isActive !== undefined ? userData.isActive : true
        }
      };
    }
    
    return {
      success: false,
      message: response.data.error || 'Failed to fetch profile'
    };
  } catch (error) {
    console.error('Get profile error:', error.response?.data || error.message);
    return handleApiError(error);
  }
};

// Update an existing user profile
export const updateProfile = async (userId, profileData) => {
  try {
    if (!userId) {
      throw new Error('User ID is required to update profile');
    }
    
    console.log('Updating profile with data:', {
      ...profileData,
      profilepic: profileData.profilepic ? '(Base64 image data present)' : '(No image data)'
    });
    
    // Make sure numeric fields are properly formatted
    const numericData = { ...profileData };
    
    if (profileData.height) {
      numericData.height = parseFloat(profileData.height);
    }
    
    if (profileData.weight) {
      numericData.weight = parseFloat(profileData.weight);
    }
    
    // Verify base64 image format if present and check size
    if (profileData.profilepic && typeof profileData.profilepic === 'string') {
      // Check if it's a valid base64 data URL
      if (!profileData.profilepic.startsWith('data:image')) {
        console.error('Invalid profile image format. Expected data:image format');
        // Don't include the image if it's not in the right format
        delete numericData.profilepic;
      } else {
        // Check image size - server has a 32MB limit now
        const base64Length = profileData.profilepic.length;
        const sizeInBytes = (base64Length - 22) * 0.75; // Rough estimate
        const sizeInMB = sizeInBytes / (1024 * 1024);
        
        console.log(`Profile image size: ~${sizeInMB.toFixed(2)}MB (${sizeInBytes} bytes)`);
        
        // Server has been upgraded to a 32MB limit
        const SERVER_SIZE_LIMIT = 32 * 1024 * 1024; // 32MB
        if (sizeInBytes > SERVER_SIZE_LIMIT) {
          console.warn('Profile image exceeds server limit, removing from request');
          delete numericData.profilepic;
        }
      }
    }
    
    // Use the proper endpoint /api/users/profile with increased timeout
    const response = await apiClient.put('/api/users/profile', {
      ...numericData,
      user_id: userId
    }, {
      timeout: 30000 // Increase timeout to 30 seconds
    });
    
    if (response.status === 200) {
      console.log('Profile updated successfully:', response.data);
      return {
        success: true,
        message: response.data.message || 'Profile updated successfully',
        profile: response.data.user || response.data
      };
    }
    
    return {
      success: false,
      message: response.data.error || 'Failed to update profile'
    };
  } catch (error) {
    console.error('Update profile error:', error.message);
    
    // More specific error handling
    if (error.message === 'Network Error') {
      console.error('Network error occurred. Possible causes: timeout, large profile image, or server unavailable');
      return {
        success: false,
        message: 'Connection timed out. Try uploading a smaller profile image or try again later.'
      };
    }
    
    // Special handling for server size limit errors
    if (error.response?.data?.message?.includes('longer than')) {
      return {
        success: false,
        message: 'Profile image is too large. Please use a smaller image (maximum 32MB).'
      };
    }
    
    return handleApiError(error);
  }
};

// Get current user profile from API
export const getCurrentUserProfile = async () => {
  try {
    const response = await apiClient.get('/api/users/profile');
    console.log('Profile response:', JSON.stringify(response.data));
    
    if (response.status === 200) {
      // The API response seems to have nested profile data
      let profileData = response.data;
      
      // Check if the data has a nested profile structure
      if (profileData.profile && typeof profileData.profile === 'object') {
        profileData = profileData.profile;
      }
      
      // Extract role from the response (may be at different levels in the structure)
      const role = profileData.role || response.data.role || 'user';
      
      // Store the user role in AsyncStorage for easy access
      await AsyncStorage.setItem('userRole', role);
      
      // Also store in user_data
      try {
        const userData = await AsyncStorage.getItem('user_data');
        if (userData) {
          const parsedUserData = JSON.parse(userData);
          parsedUserData.role = role;
          await AsyncStorage.setItem('user_data', JSON.stringify(parsedUserData));
        }
      } catch (err) {
        console.error('Error updating user data with role:', err);
      }
      
      return {
        success: true,
        profile: profileData
      };
    }
    
    return {
      success: false,
      message: 'Failed to fetch user profile'
    };
  } catch (error) {
    console.error('Get user profile error:', error.response?.data || error.message);
    return handleApiError(error);
  }
};

// Update current user profile
export const updateUserProfile = async (profileData) => {
  try {
    // First try to get the user ID from various sources
    // (similar to what we did in MainScreen.js)
    let userId = null;

    // Try to get user ID directly first
    userId = await AsyncStorage.getItem('userId');
    
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
    
    // Make sure we have a user ID
    if (!userId) {
      throw new Error('User ID not found in stored data');
    }

    console.log('Updating profile with userId:', userId);
    
    // Now make the API call with the user ID included
    const response = await apiClient.put('/api/users/profile', {
      ...profileData,
      user_id: userId
    });
    
    if (response.status === 200) {
      return {
        success: true,
        message: 'Profile updated successfully',
        profile: response.data
      };
    }
    
    return {
      success: false,
      message: 'Failed to update profile'
    };
  } catch (error) {
    console.error('Update user profile error:', error.response?.data || error.message);
    return handleApiError(error);
  }
};

// Check if the current user is an admin
export const isUserAdmin = async () => {
  try {
    // First try to get the role from AsyncStorage for better performance
    const role = await AsyncStorage.getItem('userRole');
    
    if (role) {
      return role.toLowerCase() === 'admin';
    }
    
    // If role is not in AsyncStorage, fetch it from the API
    const profileResponse = await getCurrentUserProfile();
    if (profileResponse.success && profileResponse.profile.role) {
      return profileResponse.profile.role.toLowerCase() === 'admin';
    }
    
    return false;
  } catch (error) {
    console.error('Error checking if user is admin:', error);
    return false;
  }
};

export default {
  createProfile,
  getProfile,
  updateProfile,
  getCurrentUserProfile,
  updateUserProfile,
  isUserAdmin
}; 