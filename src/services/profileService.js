import { apiClient, handleApiError } from './apiConfig';
import { saveUserToStorage } from './authService';

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
      
      // Ensure all fields are properly extracted, with fallbacks to avoid null values
      return {
        success: true,
        profile: {
          userID: userData.userID || 0,
          full_name: userData.full_name || '',
          username: userData.username || '',
          email: userData.email || '',
          gender: userData.gender || '',
          height: userData.height !== null ? userData.height : 0,
          weight: userData.weight !== null ? userData.weight : 0,
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
    
    // Verify base64 image format if present
    if (profileData.profilepic && typeof profileData.profilepic === 'string') {
      // Check if it's a valid base64 data URL
      if (!profileData.profilepic.startsWith('data:image')) {
        console.error('Invalid profile image format. Expected data:image format');
        // Don't include the image if it's not in the right format
        delete numericData.profilepic;
      }
    }
    
    // We still use updateUserProfile for updating since userProfile is just for fetching
    const response = await apiClient.put(`/updateUserProfile/${userId}`, numericData);
    
    if (response.status === 200) {
      console.log('Profile updated successfully:', response.data);
      return {
        success: true,
        message: response.data.message || 'Profile updated successfully',
        profile: response.data.user
      };
    }
    
    return {
      success: false,
      message: response.data.error || 'Failed to update profile'
    };
  } catch (error) {
    console.error('Update profile error:', error.response?.data || error.message);
    return handleApiError(error);
  }
};

export default {
  createProfile,
  getProfile,
  updateProfile
}; 