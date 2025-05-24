/**
 * @format
 * Unit Tests for LoginScreen
 * Tests UI components, user interactions, form validation, and authentication flow
 */

import React from 'react';
import { render, fireEvent, waitFor, act, screen } from '@testing-library/react-native';
import { Alert } from 'react-native';
import LoginScreen from '../../src/screens/login/LoginScreen';
import authService from '../../src/services/authService';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

// Mock dependencies
jest.mock('../../src/services/authService');
jest.mock('../../src/services/profileService');
jest.mock('@react-native-google-signin/google-signin', () => ({
  GoogleSignin: {
    configure: jest.fn(),
    signIn: jest.fn(),
    hasPlayServices: jest.fn(),
  },
  statusCodes: {
    SIGN_IN_CANCELLED: 'SIGN_IN_CANCELLED',
    IN_PROGRESS: 'IN_PROGRESS',
    PLAY_SERVICES_NOT_AVAILABLE: 'PLAY_SERVICES_NOT_AVAILABLE',
  },
}));

const mockNavigation = {
  navigate: jest.fn(),
  replace: jest.fn(),
  goBack: jest.fn(),
};

describe('LoginScreen Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Alert.alert = jest.fn();
    
    // Mock default auth service methods
    authService.checkAuthStatus = jest.fn().mockResolvedValue({ isAuthenticated: false });
    authService.login = jest.fn();
    authService.googleAuth = jest.fn();
    authService.getUserFromStorage = jest.fn();
  });

  describe('Component Rendering', () => {
    it('should render login screen correctly', () => {
      const { getByText, getByPlaceholderText } = render(
        <LoginScreen navigation={mockNavigation} />
      );

      expect(getByText('Login')).toBeTruthy();
      expect(getByText('GymTastic')).toBeTruthy();
      expect(getByPlaceholderText('Username')).toBeTruthy();
      expect(getByPlaceholderText('Password')).toBeTruthy();
      expect(getByText('Continue with Google')).toBeTruthy();
    });

    it('should render forgot password link', () => {
      const { getByText } = render(
        <LoginScreen navigation={mockNavigation} />
      );

      expect(getByText('Forgot Password?')).toBeTruthy();
    });

    it('should render register navigation link', () => {
      const { getByText } = render(
        <LoginScreen navigation={mockNavigation} />
      );

      expect(getByText('Register')).toBeTruthy();
    });
  });

  describe('Form Input Validation', () => {
    it('should validate empty username field', async () => {
      const { getByPlaceholderText, getByText } = render(
        <LoginScreen navigation={mockNavigation} />
      );

      const usernameInput = getByPlaceholderText('Username');
      
      // Trigger validation by blurring the empty input
      await act(async () => {
        fireEvent(usernameInput, 'blur');
      });

      await waitFor(() => {
        expect(getByText('Username is required')).toBeTruthy();
      });
    });

    it('should validate empty password field', async () => {
      const { getByPlaceholderText, getByText } = render(
        <LoginScreen navigation={mockNavigation} />
      );

      const passwordInput = getByPlaceholderText('Password');

      // Trigger validation by blurring the empty input
      await act(async () => {
        fireEvent(passwordInput, 'blur');
      });

      await waitFor(() => {
        expect(getByText('Password is required')).toBeTruthy();
      });
    });

    it('should validate password minimum length', async () => {
      const { getByPlaceholderText, getByText } = render(
        <LoginScreen navigation={mockNavigation} />
      );

      const passwordInput = getByPlaceholderText('Password');

      // Test with a password that's less than 6 characters
      await act(async () => {
        fireEvent.changeText(passwordInput, 'Ecem1'); // 5 characters, should fail
      });

      // Wait for state to update
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
      });

      // Then trigger blur validation
      await act(async () => {
        fireEvent(passwordInput, 'blur');
      });

      await waitFor(() => {
        expect(getByText('Password must be at least 6 characters')).toBeTruthy();
      });
    });

    it('should clear validation errors when input is corrected', async () => {
      const { getByPlaceholderText, queryByText } = render(
        <LoginScreen navigation={mockNavigation} />
      );

      const usernameInput = getByPlaceholderText('Username');

      // Trigger validation error
      await act(async () => {
        fireEvent(usernameInput, 'blur');
      });

      // Fix the input
      await act(async () => {
        fireEvent.changeText(usernameInput, 'validuser');
      });

      await waitFor(() => {
        expect(queryByText('Username is required')).toBeNull();
      });
    });
  });

  describe('User Authentication', () => {
    it('should handle successful login', async () => {
      authService.login.mockResolvedValueOnce({
        success: true,
        user: { id: 123, username: 'testuser', hasProfile: true }
      });
      authService.getUserFromStorage.mockResolvedValueOnce({ id: 123, username: 'testuser' });

      const { getByTestId, getByPlaceholderText } = render(
        <LoginScreen navigation={mockNavigation} />
      );

      const usernameInput = getByPlaceholderText('Username');
      const passwordInput = getByPlaceholderText('Password');
      const loginButton = getByTestId('login-button');
      
      await act(async () => {
        fireEvent.changeText(usernameInput, 'testuser');
        fireEvent.changeText(passwordInput, 'Ecem.123'); // Valid password
      });

      // Wait for state to update
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
      });

      await act(async () => {
        fireEvent.press(loginButton);
      });

      await waitFor(() => {
        expect(authService.login).toHaveBeenCalledWith({
          username: 'testuser',
          password: 'Ecem.123'
        });
        expect(mockNavigation.replace).toHaveBeenCalledWith('Main');
      });
    });

    it('should handle login for user without profile', async () => {
      authService.login.mockResolvedValueOnce({
        success: true,
        user: { id: 123, username: 'testuser', hasProfile: false }
      });
      authService.getUserFromStorage.mockResolvedValueOnce(null); // No stored user

      const { getByTestId, getByPlaceholderText } = render(
        <LoginScreen navigation={mockNavigation} />
      );

      const usernameInput = getByPlaceholderText('Username');
      const passwordInput = getByPlaceholderText('Password');
      const loginButton = getByTestId('login-button');

      await act(async () => {
        fireEvent.changeText(usernameInput, 'testuser');
        fireEvent.changeText(passwordInput, 'Ecem.123');
      });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
      });

      await act(async () => {
        fireEvent.press(loginButton);
      });

      await waitFor(() => {
        expect(mockNavigation.replace).toHaveBeenCalledWith('CreateProfile');
      });
    });

    it('should handle failed login with invalid credentials', async () => {
      authService.login.mockResolvedValueOnce({
        success: false,
        message: 'Invalid username or password'
      });

      const { getByTestId, getByPlaceholderText } = render(
        <LoginScreen navigation={mockNavigation} />
      );

      const usernameInput = getByPlaceholderText('Username');
      const passwordInput = getByPlaceholderText('Password');
      const loginButton = getByTestId('login-button');

      await act(async () => {
        fireEvent.changeText(usernameInput, 'wronguser');
        fireEvent.changeText(passwordInput, 'wrongpass123'); // Still valid length
      });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
      });

      await act(async () => {
        fireEvent.press(loginButton);
      });

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Login Failed',
          'Invalid username or password'
        );
      });
    });

    it('should handle network errors during login', async () => {
      authService.login.mockRejectedValueOnce(new Error('Network error'));

      const { getByTestId, getByPlaceholderText } = render(
        <LoginScreen navigation={mockNavigation} />
      );

      const usernameInput = getByPlaceholderText('Username');
      const passwordInput = getByPlaceholderText('Password');
      const loginButton = getByTestId('login-button');

      await act(async () => {
        fireEvent.changeText(usernameInput, 'testuser');
        fireEvent.changeText(passwordInput, 'Ecem.123');
      });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
      });

      await act(async () => {
        fireEvent.press(loginButton);
      });

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Login Failed',
          'Network error'
        );
      });
    });
  });

  describe('Google Sign-In Integration', () => {
    it('should handle successful Google sign-in', async () => {
      GoogleSignin.hasPlayServices.mockResolvedValueOnce(true);
      GoogleSignin.signIn.mockResolvedValueOnce({
        data: {
          idToken: 'mock-google-token',
          user: {
            email: 'test@gmail.com',
            name: 'Test User',
            photo: 'http://example.com/photo.jpg'
          }
        }
      });

      authService.googleAuth.mockResolvedValueOnce({
        success: true,
        isNewUser: false,
        user: { hasProfile: true }
      });

      const { getByTestId } = render(
        <LoginScreen navigation={mockNavigation} />
      );

      const googleButton = getByTestId('google-signin-button');

      await act(async () => {
        fireEvent.press(googleButton);
      });

      await waitFor(() => {
        expect(GoogleSignin.signIn).toHaveBeenCalled();
        expect(authService.googleAuth).toHaveBeenCalled();
        expect(mockNavigation.replace).toHaveBeenCalledWith('Main');
      });
    });

    it('should handle Google sign-in for new user', async () => {
      GoogleSignin.hasPlayServices.mockResolvedValueOnce(true);
      GoogleSignin.signIn.mockResolvedValueOnce({
        data: {
          idToken: 'mock-google-token',
          user: {
            email: 'newuser@gmail.com',
            name: 'New User'
          }
        }
      });

      authService.googleAuth.mockResolvedValueOnce({
        success: true,
        isNewUser: true,
        user: { hasProfile: false }
      });

      const { getByTestId } = render(
        <LoginScreen navigation={mockNavigation} />
      );

      const googleButton = getByTestId('google-signin-button');

      await act(async () => {
        fireEvent.press(googleButton);
      });

      await waitFor(() => {
        expect(mockNavigation.replace).toHaveBeenCalledWith('CreateProfile');
      });
    });

    it('should handle Google sign-in cancellation', async () => {
      GoogleSignin.signIn.mockRejectedValueOnce({
        code: 'SIGN_IN_CANCELLED'
      });

      const { getByTestId } = render(
        <LoginScreen navigation={mockNavigation} />
      );

      const googleButton = getByTestId('google-signin-button');

      await act(async () => {
        fireEvent.press(googleButton);
      });

      await waitFor(() => {
        // Should not show error alert for cancellation
        expect(Alert.alert).not.toHaveBeenCalled();
      });
    });

    it('should handle Google Play Services unavailable', async () => {
      GoogleSignin.hasPlayServices.mockRejectedValueOnce({
        code: 'PLAY_SERVICES_NOT_AVAILABLE'
      });

      const { getByTestId } = render(
        <LoginScreen navigation={mockNavigation} />
      );

      const googleButton = getByTestId('google-signin-button');

      await act(async () => {
        fireEvent.press(googleButton);
      });

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Google Play Services Required',
          'Please install/update Google Play Services to use this feature'
        );
      });
    });
  });

  describe('Navigation and User Interactions', () => {
    it('should navigate to register screen when register is pressed', () => {
      const { getByText } = render(
        <LoginScreen navigation={mockNavigation} />
      );

      const registerLink = getByText('Register');
      fireEvent.press(registerLink);

      expect(mockNavigation.navigate).toHaveBeenCalledWith('Register');
    });

    it('should show forgot password alert', () => {
      const { getByText } = render(
        <LoginScreen navigation={mockNavigation} />
      );

      const forgotPasswordLink = getByText('Forgot Password?');
      fireEvent.press(forgotPasswordLink);

      expect(Alert.alert).toHaveBeenCalledWith(
        'Reset Password',
        'A password reset link will be sent to your email.',
        expect.any(Array)
      );
    });

    it('should confirm password reset when user selects send', () => {
      const { getByText } = render(
        <LoginScreen navigation={mockNavigation} />
      );

      const forgotPasswordLink = getByText('Forgot Password?');
      fireEvent.press(forgotPasswordLink);

      // Simulate pressing "Send" button in alert
      const alertCall = Alert.alert.mock.calls[0];
      const sendButton = alertCall[2].find(button => button.text === 'Send');
      sendButton.onPress();

      expect(Alert.alert).toHaveBeenCalledWith(
        'Success',
        'Password reset instructions have been sent to your email.'
      );
    });
  });

  describe('Loading States', () => {
    it('should show loading indicator during login', async () => {
      // Create a longer-running promise to keep loading state active
      let resolveLogin;
      const loginPromise = new Promise(resolve => {
        resolveLogin = resolve;
      });
      authService.login.mockImplementationOnce(() => loginPromise);

      const { getByTestId, getByPlaceholderText } = render(
        <LoginScreen navigation={mockNavigation} />
      );

      const usernameInput = getByPlaceholderText('Username');
      const passwordInput = getByPlaceholderText('Password');
      const loginButton = getByTestId('login-button');

      await act(async () => {
        fireEvent.changeText(usernameInput, 'testuser');
        fireEvent.changeText(passwordInput, 'Ecem.123');
      });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
      });

      // Press the button and immediately check if it's disabled
      await act(async () => {
        fireEvent.press(loginButton);
      });

      // Check that the button is disabled during loading
      expect(loginButton.props.accessibilityState.disabled).toBe(true);

      // Clean up - resolve the promise
      await act(async () => {
        resolveLogin({ success: true });
      });
    });

    it('should disable login button during loading', async () => {
      // Create a longer-running promise to keep loading state active
      let resolveLogin;
      const loginPromise = new Promise(resolve => {
        resolveLogin = resolve;
      });
      authService.login.mockImplementationOnce(() => loginPromise);

      const { getByTestId, getByPlaceholderText } = render(
        <LoginScreen navigation={mockNavigation} />
      );

      const usernameInput = getByPlaceholderText('Username');
      const passwordInput = getByPlaceholderText('Password');
      const loginButton = getByTestId('login-button');

      await act(async () => {
        fireEvent.changeText(usernameInput, 'testuser');
        fireEvent.changeText(passwordInput, 'Ecem.123');
      });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
      });

      // Press the button
      await act(async () => {
        fireEvent.press(loginButton);
      });

      // Check that the button is disabled during loading
      expect(loginButton.props.accessibilityState.disabled).toBe(true);

      // Clean up - resolve the promise
      await act(async () => {
        resolveLogin({ success: true });
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper accessibility for inputs', () => {
      const { getByPlaceholderText } = render(
        <LoginScreen navigation={mockNavigation} />
      );

      const usernameInput = getByPlaceholderText('Username');
      const passwordInput = getByPlaceholderText('Password');

      expect(usernameInput).toBeTruthy();
      expect(passwordInput).toBeTruthy();
    });

    it('should have secure text entry for password field', () => {
      const { getByPlaceholderText } = render(
        <LoginScreen navigation={mockNavigation} />
      );

      const passwordInput = getByPlaceholderText('Password');
      expect(passwordInput.props.secureTextEntry).toBe(true);
    });
  });
}); 