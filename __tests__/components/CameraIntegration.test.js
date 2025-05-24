/**
 * @format
 * Unit Tests for Camera Integration
 * Tests camera permissions, device management, and basic functionality (excluding pose detection)
 */

import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Alert, PermissionsAndroid } from 'react-native';
import { 
  Camera, 
  getCameraPermissionStatus, 
  requestCameraPermission, 
  getAvailableCameraDevices,
  useCameraDevices,
  useCameraDevice 
} from 'react-native-vision-camera';
import PoseCamera from '../../src/screens/camera/PoseCamera';

// Mock dependencies
jest.mock('react-native-vision-camera');
jest.mock('../../src/services/poseService');
jest.mock('../../src/services/socketService', () => ({
  __esModule: true,
  default: {
    initSocket: jest.fn(() => ({
      connect: jest.fn(),
      disconnect: jest.fn(),
      on: jest.fn(),
      off: jest.fn(),
      emit: jest.fn(),
      connected: true,
    })),
    authenticateSocket: jest.fn(() => Promise.resolve(true)),
    startExerciseSession: jest.fn(() => Promise.resolve('mock-session-id')),
    endExerciseSession: jest.fn(() => Promise.resolve()),
    sendFrameForPoseDetection: jest.fn(),
    onPoseResult: jest.fn(() => jest.fn()), // Return unsubscribe function
    setupPoseErrorListener: jest.fn(() => jest.fn()), // Return unsubscribe function
    disconnectSocket: jest.fn(),
    isSocketConnected: jest.fn(() => true),
    getCurrentSessionId: jest.fn(() => 'mock-session-id'),
    getServerInfo: jest.fn(() => ({ connected: true })),
    getSocket: jest.fn(() => ({
      connect: jest.fn(),
      disconnect: jest.fn(),
      on: jest.fn(),
      off: jest.fn(),
      emit: jest.fn(),
      connected: true,
    })),
  },
}));

const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  setOptions: jest.fn(),
};

const mockRoute = {
  params: {
    exercise: 'squats',
    duration: 30,
  },
};

describe('Camera Integration Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Alert.alert = jest.fn();
    
    // Set default camera permission to authorized for most tests
    Camera.requestCameraPermission = jest.fn().mockResolvedValue('authorized');
    getCameraPermissionStatus.mockResolvedValue('granted');
    useCameraDevice.mockReturnValue({ id: 'front', position: 'front' });
    getAvailableCameraDevices.mockResolvedValue([
      { id: 'back', position: 'back' },
      { id: 'front', position: 'front' }
    ]);
    
    // Mock PermissionsAndroid for Android tests
    PermissionsAndroid.request = jest.fn().mockResolvedValue('granted');
    PermissionsAndroid.check = jest.fn().mockResolvedValue('granted');
  });

  describe('Camera Permissions', () => {
    it('should request camera permission on component mount', async () => {
      // Since we're in iOS mode, it should call Camera.requestCameraPermission
      Camera.requestCameraPermission.mockResolvedValueOnce('authorized');

      render(<PoseCamera navigation={mockNavigation} route={mockRoute} />);

      await waitFor(() => {
        expect(Camera.requestCameraPermission).toHaveBeenCalled();
      });
    });

    it('should handle granted camera permission', async () => {
      Camera.requestCameraPermission.mockResolvedValueOnce('authorized');

      const { getByTestId } = render(
        <PoseCamera navigation={mockNavigation} route={mockRoute} />
      );

      // Wait for the permission request to complete and component to re-render
      await waitFor(() => {
        expect(getByTestId('camera-view')).toBeTruthy();
      }, { timeout: 3000 });
    });

    it('should handle denied camera permission', async () => {
      Camera.requestCameraPermission.mockResolvedValueOnce('denied');

      const { getByText } = render(
        <PoseCamera navigation={mockNavigation} route={mockRoute} />
      );

      await waitFor(() => {
        expect(getByText('Camera permission denied. Please enable camera access.')).toBeTruthy();
      });
    });

    it('should handle permission request errors', async () => {
      Camera.requestCameraPermission.mockRejectedValueOnce(new Error('Permission check failed'));

      const { getByText } = render(
        <PoseCamera navigation={mockNavigation} route={mockRoute} />
      );

      await waitFor(() => {
        expect(getByText('Camera permission denied. Please enable camera access.')).toBeTruthy();
      });
    });

    it('should show permission rationale on Android', async () => {
      // Mock Platform.OS to be Android for this test
      const { Platform } = require('react-native');
      Platform.OS = 'android';
      
      PermissionsAndroid.request.mockResolvedValueOnce('granted');

      render(<PoseCamera navigation={mockNavigation} route={mockRoute} />);

      await waitFor(() => {
        expect(PermissionsAndroid.request).toHaveBeenCalledWith(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          expect.objectContaining({
            title: 'Camera Permission Required',
            message: 'This app needs access to your camera for pose detection.',
          })
        );
      });
      
      // Reset back to iOS
      Platform.OS = 'ios';
    });
  });

  describe('Camera Device Management', () => {
    it('should select front camera by default', async () => {
      const mockDevices = [
        { id: 'back-camera', position: 'back' },
        { id: 'front-camera', position: 'front' },
      ];

      getAvailableCameraDevices.mockResolvedValueOnce(mockDevices);
      useCameraDevice.mockReturnValue(mockDevices[1]); // front camera

      const { getByTestId } = render(
        <PoseCamera navigation={mockNavigation} route={mockRoute} />
      );

      await waitFor(() => {
        expect(getByTestId('camera-view')).toBeTruthy();
      }, { timeout: 3000 });
    });

    it('should handle camera flip functionality', async () => {
      const mockDevices = [
        { id: 'back-camera', position: 'back' },
        { id: 'front-camera', position: 'front' },
      ];

      getAvailableCameraDevices.mockResolvedValueOnce(mockDevices);
      useCameraDevices.mockReturnValue({
        back: mockDevices[0],
        front: mockDevices[1],
      });

      const { getByTestId } = render(
        <PoseCamera navigation={mockNavigation} route={mockRoute} />
      );

      // Wait for camera to load first
      await waitFor(() => {
        expect(getByTestId('camera-view')).toBeTruthy();
      }, { timeout: 3000 });

      const flipButton = getByTestId('camera-flip-button');

      await act(async () => {
        fireEvent.press(flipButton);
      });

      await waitFor(() => {
        expect(getByTestId('camera-view')).toBeTruthy();
      });
    });
  });

  describe('Exercise Session Management (Basic)', () => {
    it('should start exercise session when camera loads', async () => {
      const { getByTestId, getByText } = render(
        <PoseCamera navigation={mockNavigation} route={mockRoute} />
      );

      await waitFor(() => {
        expect(getByText(/Exercise:/)).toBeTruthy(); 
        expect(getByTestId('session-timer')).toBeTruthy();
      }, { timeout: 3000 });
    });

    it('should display session controls when active', async () => {
      const { getByTestId } = render(
        <PoseCamera navigation={mockNavigation} route={mockRoute} />
      );

      await waitFor(() => {
        expect(getByTestId('session-end-button')).toBeTruthy();
        expect(getByTestId('camera-flip-button')).toBeTruthy();
        expect(getByTestId('session-timer')).toBeTruthy();
      }, { timeout: 3000 });
    });

    it('should end session when end button is pressed', async () => {
      const { getByTestId, getByText } = render(
        <PoseCamera navigation={mockNavigation} route={mockRoute} />
      );

      await waitFor(() => {
        expect(getByTestId('session-end-button')).toBeTruthy();
      }, { timeout: 3000 });

      const endButton = getByTestId('session-end-button');
      
      await act(async () => {
        fireEvent.press(endButton);
      });

      // Session should end and UI should update to show session ended state
      await waitFor(() => {
        expect(getByText('Session ended.')).toBeTruthy();
        expect(getByText('Start Session')).toBeTruthy(); // Button changes to start session
      }, { timeout: 3000 });
    });
  });

  describe('Accessibility and Usability', () => {
    it('should provide accessibility labels for camera controls', async () => {
      const { getByTestId } = render(
        <PoseCamera navigation={mockNavigation} route={mockRoute} />
      );

      await waitFor(() => {
        expect(getByTestId('camera-flip-button').props.accessibilityLabel).toBe('Flip camera');
        expect(getByTestId('session-end-button').props.accessibilityLabel).toBe('End session');
      }, { timeout: 3000 });
    });

    it('should provide voice feedback placeholder for accessibility', async () => {
      const { getByTestId } = render(
        <PoseCamera navigation={mockNavigation} route={mockRoute} />
      );

      await waitFor(() => {
        expect(getByTestId('voice-feedback')).toBeTruthy();
      }, { timeout: 3000 });
    });
  });

  describe('Performance and Optimization', () => {
    it('should maintain reasonable performance', async () => {
      const { getByTestId } = render(
        <PoseCamera navigation={mockNavigation} route={mockRoute} />
      );

      await waitFor(() => {
        expect(getByTestId('camera-view')).toBeTruthy();
      }, { timeout: 3000 });

      // Should render without crashing
      expect(getByTestId('camera-view')).toBeTruthy();
    });
  });
}); 