import axios from 'axios';

// Development machine IP - Update this to your current IP address
export const DEV_MACHINE_IP = '10.144.228.166';

// API base URL
const API_URL = `http://${DEV_MACHINE_IP}:5000`;

// Create axios instance
export const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Handle API error in a consistent way
export const handleApiError = (error) => {
  console.log('API error details:', error);
  
  // Handle network errors
  if (!error.response) {
    return {
      success: false,
      type: 'network',
      message: 'Network error. Please check your internet connection and try again.',
    };
  }
  
  // Handle authentication errors
  if (error.response.status === 401) {
    return {
      success: false,
      type: 'auth',
      message: 'Authentication failed. Please log in again.',
    };
  }
  
  // Handle user not found errors
  if (error.response.status === 404) {
    // Check if this is a user-related endpoint
    const userEndpoints = ['/profile', '/createProfile', '/updateProfile', '/user'];
    const isUserEndpoint = userEndpoints.some(endpoint => 
      error.config && error.config.url && error.config.url.includes(endpoint)
    );
    
    if (isUserEndpoint) {
      return {
        success: false,
        type: 'user_deleted',
        message: 'Your account no longer exists in our system. Please register again.',
      };
    }
    
    return {
      success: false,
      type: 'not_found',
      message: error.response.data?.message || 'Resource not found.',
    };
  }
  
  // Handle validation errors
  if (error.response.status === 400 || error.response.status === 422) {
    return {
      success: false,
      type: 'validation',
      message: error.response.data?.message || 'Invalid data provided.',
      errors: error.response.data?.errors,
    };
  }
  
  // Handle server errors
  if (error.response.status >= 500) {
    return {
      success: false,
      type: 'server',
      message: 'Server error. Please try again later.',
    };
  }
  
  // Default error handling
  return {
    success: false,
    type: 'unknown',
    message: error.response.data?.message || error.message || 'An unexpected error occurred.',
  };
};

export default {
  apiClient,
  handleApiError,
  API_URL,
}; 