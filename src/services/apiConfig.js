import axios from 'axios';

// Development machine IP - Update this to your current IP address
export const DEV_MACHINE_IP = '10.0.2.2';

// API URL Configuration
// Using same server base URL for API and sockets
export const API_URL = 'http://10.0.2.2:5000';  // Special IP to access host from Android emulator

// Socket URL for legacy code
export const SOCKET_URL = API_URL;

// Create axios instance
export const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 30000,  // Increase default timeout to 30 seconds for handling image uploads
  headers: {
    'Content-Type': 'application/json',
  },
});

// Error handler function
export const handleApiError = (error) => {
  console.error('API Error:', error);
  
  // Handle different types of errors
  if (error.response) {
    // Server responded with an error status code
    console.log('Error data:', error.response.data);
    return { 
      success: false, 
      error: error.response.data.message || 'Server returned an error',
      statusCode: error.response.status 
    };
  } else if (error.request) {
    // Request was made but no response received
    console.log('No response received:', error.request);
    return { 
      success: false, 
      error: 'No response from server. Check your network connection.',
      statusCode: 0 
    };
  } else {
    // Something else went wrong
    return { 
      success: false, 
      error: error.message || 'Unknown error occurred',
      statusCode: 0 
    };
  }
};

export default {
  apiClient,
  handleApiError,
  API_URL,
}; 