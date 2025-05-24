/**
 * @format
 * Unit Tests for AuthService
 * Tests authentication functionality, user management, and data storage operations
 */

import authService, {
  saveUserToStorage,
  getUserFromStorage,
  clearUserFromStorage,
  checkUserExists,
  googleAuth,
  firebaseAuth,
  login,
  register,
  logout,
  isAuthenticated,
  getCurrentUserId,
  initializeAuth,
  checkAuthStatus
} from '../../src/services/authService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from '../../src/services/apiConfig';
import socketService from '../../src/services/socketService';

// Mock dependencies
jest.mock('../../src/services/apiConfig', () => ({
  apiClient: {
    post: jest.fn(),
    get: jest.fn(),
    defaults: {
      headers: {
        common: {},
      },
    },
  },
  handleApiError: jest.fn((error) => ({
    success: false,
    error: error.message || 'Test API Error',
    statusCode: error.response?.status || 500
  })),
}));
jest.mock('../../src/services/socketService', () => ({
  disconnectSocket: jest.fn(),
  authenticateSocket: jest.fn(),
  initSocket: jest.fn(),
  getSocket: jest.fn(),
}));

describe('AuthService Unit Tests', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    AsyncStorage.clear();
  });

  describe('Storage Operations', () => {
    describe('saveUserToStorage', () => {
      it('should save user data to AsyncStorage successfully', async () => {
        const userData = { id: 1, username: 'testuser', email: 'test@example.com' };
        
        const result = await saveUserToStorage(userData);
        
        expect(AsyncStorage.setItem).toHaveBeenCalledWith('user_data', JSON.stringify(userData));
        expect(result).toEqual(userData);
      });

      it('should handle storage errors gracefully', async () => {
        const userData = { id: 1, username: 'testuser' };
        AsyncStorage.setItem.mockRejectedValueOnce(new Error('Storage error'));
        
        await expect(saveUserToStorage(userData)).rejects.toThrow('Storage error');
      });
    });

    describe('getUserFromStorage', () => {
      it('should retrieve user data from AsyncStorage', async () => {
        const userData = { id: 1, username: 'testuser' };
        AsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(userData));
        
        const result = await getUserFromStorage();
        
        expect(AsyncStorage.getItem).toHaveBeenCalledWith('user_data');
        expect(result).toEqual(userData);
      });

      it('should return null when no user data exists', async () => {
        AsyncStorage.getItem.mockResolvedValueOnce(null);
        
        const result = await getUserFromStorage();
        
        expect(result).toBeNull();
      });

      it('should return null on storage error', async () => {
        AsyncStorage.getItem.mockRejectedValueOnce(new Error('Storage error'));
        
        const result = await getUserFromStorage();
        
        expect(result).toBeNull();
      });
    });

    describe('clearUserFromStorage', () => {
      it('should clear user data from AsyncStorage', async () => {
        const result = await clearUserFromStorage();
        
        expect(AsyncStorage.removeItem).toHaveBeenCalledWith('user_data');
        expect(result).toBe(true);
      });

      it('should handle clear operation errors', async () => {
        AsyncStorage.removeItem.mockRejectedValueOnce(new Error('Clear error'));
        
        const result = await clearUserFromStorage();
        
        expect(result).toBe(false);
      });
    });
  });

  describe('User Existence Check', () => {
    describe('checkUserExists', () => {
      it('should check if user exists and is active', async () => {
        const mockResponse = {
          status: 200,
          data: { exists: true, active: true }
        };
        apiClient.get.mockResolvedValueOnce(mockResponse);
        
        const result = await checkUserExists('123');
        
        expect(apiClient.get).toHaveBeenCalledWith('/checkUser/123');
        expect(result).toEqual({
          exists: true,
          active: true,
          message: 'User exists and is active'
        });
      });

      it('should handle inactive user accounts', async () => {
        const mockResponse = {
          status: 200,
          data: { exists: true, active: false }
        };
        apiClient.get.mockResolvedValueOnce(mockResponse);
        
        const result = await checkUserExists('123');
        
        expect(result).toEqual({
          exists: true,
          active: false,
          message: 'User account is inactive. Please contact support.'
        });
      });

      it('should handle missing user ID', async () => {
        const result = await checkUserExists();
        
        expect(result).toEqual({
          exists: false,
          active: false,
          message: 'Unable to verify user existence'
        });
      });

      it('should handle API errors', async () => {
        apiClient.get.mockRejectedValueOnce(new Error('Network error'));
        
        const result = await checkUserExists('123');
        
        expect(result).toEqual({
          exists: false,
          active: false,
          message: 'Unable to verify user existence'
        });
      });
    });
  });

  describe('Authentication Methods', () => {
    describe('login', () => {
      it('should login user successfully with valid credentials', async () => {
        const credentials = { username: 'testuser', password: 'password123' };
        const mockResponse = {
          data: {
            token: 'mock-jwt-token',
            refresh_token: 'mock-refresh-token',
            user_id: 123
          }
        };
        apiClient.post.mockResolvedValueOnce(mockResponse);
        socketService.authenticateSocket.mockResolvedValueOnce();
        
        const result = await login(credentials);
        
        expect(apiClient.post).toHaveBeenCalledWith('/api/auth/login', credentials);
        expect(AsyncStorage.setItem).toHaveBeenCalledWith('authToken', 'mock-jwt-token');
        expect(AsyncStorage.setItem).toHaveBeenCalledWith('refreshToken', 'mock-refresh-token');
        expect(AsyncStorage.setItem).toHaveBeenCalledWith('userId', '123');
        expect(AsyncStorage.setItem).toHaveBeenCalledWith('userID', '123');
        expect(socketService.authenticateSocket).toHaveBeenCalled();
        expect(result.success).toBe(true);
      });

      it('should handle login failure with invalid credentials', async () => {
        const credentials = { username: 'testuser', password: 'wrongpassword' };
        const mockError = {
          response: {
            status: 401,
            data: { message: 'Invalid credentials' }
          }
        };
        
        apiClient.post.mockRejectedValueOnce(mockError);
        
        const result = await login(credentials);
        
        expect(result.success).toBe(false);
        expect(AsyncStorage.setItem).not.toHaveBeenCalled();
      });
    });

    describe('googleAuth', () => {
      it('should authenticate user with Google token successfully', async () => {
        const tokenData = { token: 'google-token' };
        const mockResponse = {
          data: {
            token: 'jwt-token',
            refresh_token: 'refresh-token',
            user_id: 456
          }
        };
        apiClient.post.mockResolvedValueOnce(mockResponse);
        socketService.authenticateSocket.mockResolvedValueOnce();
        
        const result = await googleAuth(tokenData);
        
        expect(apiClient.post).toHaveBeenCalledWith('/api/auth/google', tokenData);
        expect(result.success).toBe(true);
        expect(result.data.user.id).toBe(456);
      });

      it('should handle Google authentication errors', async () => {
        const tokenData = { token: 'invalid-token' };
        
        apiClient.post.mockRejectedValueOnce(new Error('Invalid token'));
        
        const result = await googleAuth(tokenData);
        
        expect(result.success).toBe(false);
      });
    });

    describe('firebaseAuth', () => {
      it('should authenticate user with Firebase token successfully', async () => {
        const tokenData = { token: 'firebase-token' };
        const mockResponse = {
          data: {
            token: 'jwt-token',
            refresh_token: 'refresh-token',
            user_id: 789
          }
        };
        apiClient.post.mockResolvedValueOnce(mockResponse);
        
        const result = await firebaseAuth(tokenData);
        
        expect(apiClient.post).toHaveBeenCalledWith('/api/auth/firebase', tokenData);
        expect(result.success).toBe(true);
      });
    });

    describe('register', () => {
      it('should register new user successfully', async () => {
        const userData = {
          fullName: 'New User',
          username: 'newuser',
          email: 'new@example.com',
          password: 'password123',
          gender: 'male',
          height: 180,
          weight: 75,
          birth_date: '01.01.1990',
          fitness_goal: 'weight_loss',
          activity_level: 'moderate'
        };
        const mockResponse = {
          status: 201,
          data: {
            success: true,
            user_id: 999,
            token: 'new-token',
            refresh_token: 'new-refresh-token'
          }
        };
        apiClient.post.mockResolvedValueOnce(mockResponse);
        
        const result = await register(userData);
        
        expect(apiClient.post).toHaveBeenCalledWith('/api/auth/register', expect.objectContaining({
          full_name: 'New User',
          username: 'newuser',
          email: 'new@example.com'
        }));
        expect(result.success).toBe(true);
      });

      it('should handle registration with existing username', async () => {
        const userData = { 
          fullName: 'Test User',
          username: 'existinguser', 
          email: 'test@example.com', 
          password: 'password',
          gender: 'male',
          height: 180,
          weight: 75,
          birth_date: '01.01.1990',
          fitness_goal: 'weight_loss',
          activity_level: 'moderate'
        };
        const mockError = {
          response: {
            status: 409,
            data: { message: 'Username already exists' }
          }
        };
        
        apiClient.post.mockRejectedValueOnce(mockError);
        
        const result = await register(userData);
        
        expect(result.success).toBe(false);
      });
    });

    describe('logout', () => {
      it('should logout user and clear all stored data', async () => {
        const result = await logout();
        
        expect(AsyncStorage.removeItem).toHaveBeenCalledWith('authToken');
        expect(AsyncStorage.removeItem).toHaveBeenCalledWith('refreshToken');
        expect(AsyncStorage.removeItem).toHaveBeenCalledWith('userId');
        expect(socketService.disconnectSocket).toHaveBeenCalled();
        expect(result.success).toBe(true);
      });
    });
  });

  describe('Authentication State Management', () => {
    describe('isAuthenticated', () => {
      it('should return true when valid token exists', async () => {
        AsyncStorage.getItem.mockResolvedValueOnce('valid-token');
        
        const result = await isAuthenticated();
        
        expect(result).toBe(true);
      });

      it('should return false when no token exists', async () => {
        AsyncStorage.getItem.mockResolvedValueOnce(null);
        
        const result = await isAuthenticated();
        
        expect(result).toBe(false);
      });
    });

    describe('getCurrentUserId', () => {
      it('should return current user ID', async () => {
        AsyncStorage.getItem.mockResolvedValueOnce('123');
        
        const result = await getCurrentUserId();
        
        expect(result).toBe('123');
      });

      it('should return null when no user ID exists', async () => {
        AsyncStorage.getItem.mockResolvedValueOnce(null);
        
        const result = await getCurrentUserId();
        
        expect(result).toBeNull();
      });
    });

    describe('initializeAuth', () => {
      it('should initialize authentication state successfully', async () => {
        AsyncStorage.getItem.mockResolvedValueOnce('valid-token');
        
        const result = await initializeAuth();
        
        expect(result).toBe(true);
      });

      it('should handle initialization without token', async () => {
        AsyncStorage.getItem.mockResolvedValueOnce(null);
        
        const result = await initializeAuth();
        
        expect(result).toBe(false);
      });
    });

    describe('checkAuthStatus', () => {
      it('should return authenticated status with user data', async () => {
        const userData = { userID: 123, username: 'testuser' };
        AsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(userData));
        
        // Mock checkUserExists to return active user
        apiClient.get.mockResolvedValueOnce({
          status: 200,
          data: { exists: true, active: true }
        });
        
        const result = await checkAuthStatus();
        
        expect(result.isAuthenticated).toBe(true);
        expect(result.user).toEqual(userData);
      });

      it('should return unauthenticated status when no user data', async () => {
        AsyncStorage.getItem.mockResolvedValueOnce(null);
        
        const result = await checkAuthStatus();
        
        expect(result.isAuthenticated).toBe(false);
        expect(result.message).toBe('No user data found');
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle network timeout errors', async () => {
      const credentials = { username: 'testuser', password: 'password' };
      const timeoutError = new Error('NETWORK_TIMEOUT');
      timeoutError.code = 'NETWORK_TIMEOUT';
      
      apiClient.post.mockRejectedValueOnce(timeoutError);
      
      const result = await login(credentials);
      
      expect(result.success).toBe(false);
    });

    it('should handle server errors gracefully', async () => {
      const credentials = { username: 'testuser', password: 'password' };
      const serverError = {
        response: {
          status: 500,
          data: { message: 'Internal server error' }
        }
      };
      
      apiClient.post.mockRejectedValueOnce(serverError);
      
      const result = await login(credentials);
      
      expect(result.success).toBe(false);
    });
  });
}); 