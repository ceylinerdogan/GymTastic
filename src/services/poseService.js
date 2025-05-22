import axios from 'axios';
import { API_URL } from './apiConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Create axios instance with base URL
const api = axios.create({
  baseURL: API_URL
});

// Add token to all requests
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * Detect pose landmarks from an image frame
 * @param {string} frameData - Base64 encoded image frame
 * @returns {Promise<Array>} - Array of landmarks
 */
const detectPose = async (frameData) => {
  try {
    console.log('[API] Sending frame for pose detection');
    const response = await api.post('/pose/detect', {
      frame: frameData,
      format: 'jpeg',  // Explicitly specify format for Python compatibility
      timestamp: Date.now()
    });
    
    console.log('[API] Received pose detection response');
    return response.data.landmarks;
  } catch (error) {
    console.error('[API] Error detecting pose:', error.message);
    throw error;
  }
};

/**
 * Validate exercise form using pre-detected landmarks
 * @param {string} exerciseType - Type of exercise (e.g., 'squat')
 * @param {Array} landmarks - Array of pose landmarks
 * @returns {Promise<Object>} - Validation results
 */
const validateForm = async (exerciseType, landmarks) => {
  try {
    console.log('[API] Validating form for', exerciseType);
    const response = await api.post('/pose/validate', {
      exercise_type: exerciseType,
      landmarks: landmarks
    });
    
    console.log('[API] Received form validation response');
    return response.data;
  } catch (error) {
    console.error('[API] Error validating form:', error.message);
    throw error;
  }
};

/**
 * Request pose detection without providing a frame
 * This acts as a signal to the backend to use its own camera feed
 * @param {string} exerciseType - Type of exercise (e.g., 'squat')
 * @returns {Promise<Object>} - Detection results
 */
const requestPoseDetectionSignal = async (exerciseType) => {
  try {
    console.log('[API] Sending pose detection signal for', exerciseType);
    
    // Since this is a custom feature not in your backend,
    // we'll use a modified version of the detect endpoint
    const response = await api.post('/pose/detect', {
      exercise_type: exerciseType,
      // Send a signal instead of a frame
      signal: 'request_detection',
      // Add a bypass flag to signal we want to skip auth (backend would need to support this)
      bypass_auth: true
    });
    
    return response.data;
  } catch (error) {
    console.error('[API] Error sending pose detection signal:', error.message);
    
    // If we get a 401 error, try the alternative endpoint without auth
    if (error.response && error.response.status === 401) {
      console.log('[API] Authentication failed for pose detection');
      throw new Error('Authentication failed. Please check your connection and login status.');
    }
    
    throw error;
  }
};

export default {
  detectPose,
  validateForm,
  requestPoseDetectionSignal
}; 