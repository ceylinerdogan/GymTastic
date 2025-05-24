/**
 * @format
 * Unit Tests for WorkoutService
 * Tests workout data management, exercise tracking, and API integration
 */

import {
  getWorkoutLibrary,
  getExerciseVideos,
  startWorkout,
  getWorkoutHistory,
  getWorkoutStatistics,
  getWeeklyProgress,
  getMonthlyProgress,
  getRecentWorkouts
} from '../../src/services/workoutService';
import { apiClient } from '../../src/services/apiConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock dependencies
jest.mock('../../src/services/apiConfig', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    defaults: {
      headers: {
        common: {},
      },
    },
  },
  handleApiError: jest.fn((error) => ({
    success: false,
    error: error.message || 'Mock API Error',
    statusCode: error.response?.status || 500
  })),
}));

describe('WorkoutService Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    AsyncStorage.clear();
    
    // Mock user data for tests that need logged-in user
    AsyncStorage.getItem.mockImplementation((key) => {
      if (key === 'user_data') {
        return Promise.resolve(JSON.stringify({ userID: 123, username: 'testuser' }));
      }
      return Promise.resolve(null);
    });
  });

  describe('Workout Library', () => {
    describe('getWorkoutLibrary', () => {
      it('should fetch workout library successfully', async () => {
        const mockExercises = [
          {
            id: 1,
            name: 'squats',
            category: 'legs',
            difficulty: 'beginner'
          },
          {
            id: 2,
            name: 'push-ups',
            category: 'chest',
            difficulty: 'beginner'
          }
        ];

        apiClient.get.mockResolvedValueOnce({
          status: 200,
          data: { exercises: mockExercises }
        });

        const result = await getWorkoutLibrary();

        expect(apiClient.get).toHaveBeenCalledWith('/workoutLibrary');
        expect(result.success).toBe(true);
        expect(result.exercises).toEqual(mockExercises);
        expect(result.exercises).toHaveLength(2);
      });

      it('should handle empty exercise library', async () => {
        apiClient.get.mockResolvedValueOnce({
          status: 200,
          data: { exercises: [] }
        });

        const result = await getWorkoutLibrary();

        expect(result.success).toBe(true);
        expect(result.exercises).toEqual([]);
      });

      it('should handle fetch errors', async () => {
        apiClient.get.mockRejectedValueOnce(new Error('Network error'));

        const result = await getWorkoutLibrary();

        expect(result.success).toBe(false);
        expect(result.message).toContain('Error fetching workout library');
        expect(result.exercises).toEqual([]);
      });
    });
  });

  describe('Exercise Videos', () => {
    describe('getExerciseVideos', () => {
      it('should fetch exercise videos successfully', async () => {
        const mockVideos = [
          {
            id: 1,
            exerciseName: 'squats',
            videoUrl: 'https://example.com/squats.mp4',
            duration: 120
          },
          {
            id: 2,
            exerciseName: 'push-ups',
            videoUrl: 'https://example.com/pushups.mp4',
            duration: 90
          }
        ];

        apiClient.get.mockResolvedValueOnce({
          status: 200,
          data: { exerciseVideos: mockVideos }
        });

        const result = await getExerciseVideos();

        expect(apiClient.get).toHaveBeenCalledWith('/exerciseVideos');
        expect(result.success).toBe(true);
        expect(result.videos).toEqual(mockVideos);
        expect(result.videos).toHaveLength(2);
      });

      it('should handle fetch errors', async () => {
        apiClient.get.mockRejectedValueOnce(new Error('Network error'));

        const result = await getExerciseVideos();

        expect(result.success).toBe(false);
        expect(result.message).toContain('Error fetching exercise videos');
        expect(result.videos).toEqual([]);
      });
    });
  });

  describe('Workout Sessions', () => {
    describe('startWorkout', () => {
      it('should start a workout session successfully', async () => {
        const exerciseId = 1;
        const duration = 1800; // 30 minutes

        const mockResponse = {
          status: 201,
          data: {
            message: 'Workout started successfully',
            sessionId: 456,
            userID: 123,
            exerciseID: exerciseId,
            startTime: new Date().toISOString()
          }
        };

        apiClient.post.mockResolvedValueOnce(mockResponse);

        const result = await startWorkout(exerciseId, duration);

        expect(apiClient.post).toHaveBeenCalledWith('/startWorkout', {
          userID: 123,
          exerciseID: exerciseId,
          duration: duration
        });
        expect(result.success).toBe(true);
        expect(result.message).toBe('Workout started successfully');
        expect(result.sessionData).toBeDefined();
      });

      it('should handle workout start errors', async () => {
        const exerciseId = 1;
        const duration = 1800;
        apiClient.post.mockRejectedValueOnce(new Error('Session start failed'));
        const result = await startWorkout(exerciseId, duration);
        expect(result).toBeDefined();
        expect(result.success).toBe(false);
      });

      it('should handle inactive user account', async () => {
        const exerciseId = 1;
        const duration = 1800;

        const mockError = {
          response: {
            status: 403,
            data: { error: 'Account inactive' }
          }
        };

        apiClient.post.mockRejectedValueOnce(mockError);

        const result = await startWorkout(exerciseId, duration);

        expect(result.success).toBe(false);
        expect(result.message).toBe('Your account is inactive. Please contact support.');
      });
    });
  });

  describe('Workout History and Analytics', () => {
    describe('getWorkoutHistory', () => {
      it('should fetch workout history successfully', async () => {
        const mockHistory = [
          {
            id: 1,
            exerciseName: 'squats',
            date: '2024-01-01',
            duration: 1800,
            postureAccuracy: 85
          },
          {
            id: 2,
            exerciseName: 'push-ups',
            date: '2024-01-02',
            duration: 1500,
            postureAccuracy: 90
          }
        ];

        apiClient.get.mockResolvedValueOnce({
          status: 200,
          data: { workoutHistory: mockHistory }
        });

        const result = await getWorkoutHistory();

        expect(apiClient.get).toHaveBeenCalledWith('/workoutHistory/123');
        expect(result.success).toBe(true);
        expect(result.history).toHaveLength(2);
        expect(result.history).toEqual(mockHistory);
      });

      it('should handle empty workout history', async () => {
        const mockError = {
          response: {
            status: 404,
            data: { error: 'No workout sessions found for this user' }
          }
        };

        apiClient.get.mockRejectedValueOnce(mockError);

        const result = await getWorkoutHistory();

        expect(result.success).toBe(true);
        expect(result.history).toEqual([]);
        expect(result.message).toBe('No workout history found');
      });

      it('should handle inactive user account', async () => {
        const mockError = {
          response: {
            status: 403,
            data: { error: 'Account inactive' }
          }
        };

        apiClient.get.mockRejectedValueOnce(mockError);

        const result = await getWorkoutHistory();

        expect(result.success).toBe(false);
        expect(result.message).toBe('Your account is inactive. Please contact support.');
        expect(result.history).toEqual([]);
      });

      it('should handle network errors', async () => {
        apiClient.get.mockRejectedValueOnce(new Error('Network error'));

        const result = await getWorkoutHistory();

        expect(result.success).toBe(false);
        expect(result.message).toContain('Error fetching workout history');
        expect(result.history).toEqual([]);
      });
    });

    describe('getWorkoutStatistics', () => {
      it('should calculate workout statistics from history', async () => {
        const mockHistory = [
          {
            id: 1,
            exerciseName: 'squats',
            duration: 1800,
            postureAccuracy: 85
          },
          {
            id: 2,
            exerciseName: 'push-ups',
            duration: 1500,
            postureAccuracy: 90
          }
        ];

        // Mock the getWorkoutHistory function call within getWorkoutStatistics
        apiClient.get.mockResolvedValueOnce({
          status: 200,
          data: { workoutHistory: mockHistory }
        });

        const result = await getWorkoutStatistics();

        expect(result.success).toBe(true);
        expect(result.stats.totalWorkouts).toBe(2);
        expect(result.stats.totalDuration).toBe(3300); // 1800 + 1500
        expect(result.stats.avgPostureAccuracy).toBe(87.5); // (85 + 90) / 2
      });

      it('should handle empty workout history for statistics', async () => {
        // Mock empty history response
        const mockError = {
          response: {
            status: 404,
            data: { error: 'No workout sessions found for this user' }
          }
        };

        apiClient.get.mockRejectedValueOnce(mockError);

        const result = await getWorkoutStatistics();

        expect(result.success).toBe(true);
        expect(result.stats.totalWorkouts).toBe(0);
        expect(result.stats.totalDuration).toBe(0);
        expect(result.stats.avgPostureAccuracy).toBe(0);
      });
    });
  });

  describe('Progress Tracking', () => {
    describe('getWeeklyProgress', () => {
      it('should calculate weekly progress data from workout history', async () => {
        const mockHistory = [
          {
            id: 1,
            exerciseName: 'squats',
            date: new Date().toISOString(), // Today
            duration: 1800
          },
          {
            id: 2,
            exerciseName: 'push-ups',
            date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Yesterday
            duration: 1500
          }
        ];

        apiClient.get.mockResolvedValueOnce({
          status: 200,
          data: { workoutHistory: mockHistory }
        });

        const result = await getWeeklyProgress();

        expect(apiClient.get).toHaveBeenCalledWith('/workoutHistory/123');
        expect(result.success).toBe(true);
        expect(result.weeklyData).toHaveLength(7);
        expect(Array.isArray(result.weeklyData)).toBe(true);
      });
    });

    describe('getMonthlyProgress', () => {
      it('should calculate monthly progress data from workout history', async () => {
        const mockHistory = [
          {
            id: 1,
            exerciseName: 'squats',
            date: new Date().toISOString(),
            duration: 1800
          },
          {
            id: 2,
            exerciseName: 'push-ups',
            date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
            duration: 1500
          }
        ];

        apiClient.get.mockResolvedValueOnce({
          status: 200,
          data: { workoutHistory: mockHistory }
        });

        const result = await getMonthlyProgress();

        expect(apiClient.get).toHaveBeenCalledWith('/workoutHistory/123');
        expect(result.success).toBe(true);
        expect(result.monthlyData).toHaveLength(12);
        expect(Array.isArray(result.monthlyData)).toBe(true);
      });
    });

    describe('getRecentWorkouts', () => {
      it('should get recent workouts from workout history with default limit', async () => {
        const mockHistory = [
          { id: 1, exerciseName: 'squats', date: '2024-01-05' },
          { id: 2, exerciseName: 'push-ups', date: '2024-01-04' },
          { id: 3, exerciseName: 'planks', date: '2024-01-03' }
        ];

        apiClient.get.mockResolvedValueOnce({
          status: 200,
          data: { workoutHistory: mockHistory }
        });

        const result = await getRecentWorkouts();

        expect(apiClient.get).toHaveBeenCalledWith('/workoutHistory/123');
        expect(result.success).toBe(true);
        expect(result.recentWorkouts).toHaveLength(3);
      });

      it('should get recent workouts from workout history with custom limit', async () => {
        const mockHistory = [
          { id: 1, exerciseName: 'squats', date: '2024-01-05' },
          { id: 2, exerciseName: 'push-ups', date: '2024-01-04' }
        ];

        apiClient.get.mockResolvedValueOnce({
          status: 200,
          data: { workoutHistory: mockHistory }
        });

        const result = await getRecentWorkouts(1);

        expect(apiClient.get).toHaveBeenCalledWith('/workoutHistory/123');
        expect(result.success).toBe(true);
        expect(result.recentWorkouts).toHaveLength(1); // Limited to 1 item as requested
      });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle missing user data', async () => {
      // Mock no user data
      AsyncStorage.getItem.mockResolvedValueOnce(null);
      const result = await startWorkout(1, 1800);
      expect(result).toBeDefined();
      expect(result.success).toBe(false);
    });

    it('should handle network timeout errors', async () => {
      const timeoutError = new Error('NETWORK_TIMEOUT');
      timeoutError.code = 'NETWORK_TIMEOUT';

      apiClient.get.mockRejectedValueOnce(timeoutError);

      const result = await getWorkoutLibrary();

      expect(result.success).toBe(false);
      expect(result.message).toContain('Error fetching workout library');
    });

    it('should handle server errors gracefully', async () => {
      const serverError = {
        response: {
          status: 500,
          data: { message: 'Internal server error' }
        }
      };

      apiClient.get.mockRejectedValueOnce(serverError);

      const result = await getWorkoutHistory();

      expect(result.success).toBe(false);
      expect(result.message).toContain('Error fetching workout history');
    });

    it('should handle malformed API responses', async () => {
      apiClient.get.mockResolvedValueOnce({ 
        status: 200,
        data: null 
      });

      const result = await getWorkoutLibrary();

      expect(result.success).toBe(true);
      expect(result.exercises).toEqual([]);
    });
  });
});
