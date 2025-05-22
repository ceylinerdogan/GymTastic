import { apiClient, handleApiError } from './apiConfig';

/**
 * Get available exercise types
 * @returns {Object} - { success: boolean, data?: Array }
 */
export const getExerciseTypes = async () => {
  try {
    const response = await apiClient.get('/exercises/types');
    return { success: true, data: response.data };
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Get exercise by ID
 * @param {string|number} exerciseId - Exercise ID
 * @returns {Object} - { success: boolean, data?: Object }
 */
export const getExerciseById = async (exerciseId) => {
  try {
    const response = await apiClient.get(`/exercises/${exerciseId}`);
    return { success: true, data: response.data };
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Start a workout session
 * @param {Object} sessionData - { exerciseType, userId }
 * @returns {Object} - { success: boolean, data?: Object }
 */
export const startWorkoutSession = async (sessionData) => {
  try {
    const response = await apiClient.post('/sessions/start', sessionData);
    return { success: true, data: response.data };
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * End a workout session
 * @param {string|number} sessionId - Session ID
 * @returns {Object} - { success: boolean, data?: Object }
 */
export const endWorkoutSession = async (sessionId) => {
  try {
    const response = await apiClient.post(`/sessions/${sessionId}/end`);
    return { success: true, data: response.data };
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Get workout history for a user
 * @param {string|number} userId - User ID
 * @returns {Object} - { success: boolean, data?: Array }
 */
export const getWorkoutHistory = async (userId) => {
  try {
    const response = await apiClient.get(`/users/${userId}/workout-history`);
    return { success: true, data: response.data };
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Get exercise statistics for a user
 * @param {string|number} userId - User ID
 * @param {string} exerciseType - Exercise type
 * @returns {Object} - { success: boolean, data?: Object }
 */
export const getExerciseStats = async (userId, exerciseType) => {
  try {
    const response = await apiClient.get(`/users/${userId}/exercise-stats`, {
      params: { exercise_type: exerciseType }
    });
    return { success: true, data: response.data };
  } catch (error) {
    return handleApiError(error);
  }
};

export default {
  getExerciseTypes,
  getExerciseById,
  startWorkoutSession,
  endWorkoutSession,
  getWorkoutHistory,
  getExerciseStats
}; 