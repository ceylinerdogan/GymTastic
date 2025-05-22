import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LinearGradient from 'react-native-linear-gradient';
import { GoogleSignin, GoogleSigninButton, statusCodes } from '@react-native-google-signin/google-signin';
import authService from '../../services/authService';
import profileService from '../../services/profileService';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  React.useEffect(() => {
    GoogleSignin.configure({
      // Web client ID from Google Cloud Console
      webClientId: '192945878015-c7ck03vqeduqhnln1a9eslb085on44te.apps.googleusercontent.com',
      offlineAccess: true,
    });
  }, []);

  const validateEmail = (email) => {
    if (!email.trim()) {
      setEmailError('Email is required');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError('Invalid email format');
      return false;
    }
    setEmailError('');
    return true;
  };

  const validatePassword = (password) => {
    if (!password.trim()) {
      setPasswordError('Password is required');
      return false;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return false;
    }
    setPasswordError('');
    return true;
  };

  const handleForgotPassword = () => {
    Alert.alert(
      'Reset Password',
      'A password reset link will be sent to your email.',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Send',
          onPress: () => {
            // In a real app, you would call a password reset API here
            Alert.alert('Success', 'Password reset instructions have been sent to your email.');
          }
        }
      ]
    );
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      
      // Check if Google Play Services are available
      await GoogleSignin.hasPlayServices();
      
      // Sign in with Google - this will show the Google account picker
      const userInfo = await GoogleSignin.signIn();
      console.log('Google Sign-In raw response:', JSON.stringify(userInfo));
      
      // Print all top-level keys in the response to debug
      console.log('Google response keys:', Object.keys(userInfo));
      
      // Extract idToken correctly from the nested data structure
      let idToken = null;
      
      // Check for the token in the data field first (which is what we see in the logs)
      if (userInfo.data && userInfo.data.idToken) {
        idToken = userInfo.data.idToken;
        console.log('Found idToken in userInfo.data');
      } else if (userInfo.idToken) {
        idToken = userInfo.idToken;
        console.log('Found idToken in userInfo (top level)');
      } else if (userInfo.data && userInfo.data.serverAuthCode) {
        idToken = userInfo.data.serverAuthCode;
        console.log('Using serverAuthCode from data as fallback');
      } else if (userInfo.serverAuthCode) {
        idToken = userInfo.serverAuthCode;
        console.log('Using serverAuthCode as fallback');
      }
      
      console.log('Extracted token type:', idToken ? 'Found token' : 'No token found');
      
      // If still no token, try to use the user ID to create a pseudo-token
      if (!idToken) {
        // Try to find user ID in various places in the response structure
        const userId = 
          (userInfo.data && userInfo.data.user && userInfo.data.user.id) || 
          (userInfo.user && userInfo.user.id) || 
          (userInfo.data && userInfo.data.id) ||
          userInfo.id;
        
        if (userId) {
          console.log('Creating pseudo-token from user ID as last resort');
          idToken = `pseudo-token-${userId}`;
        }
      }
      
      if (!idToken) {
        console.error('Unable to extract idToken from Google response');
        Alert.alert('Authentication Error', 'Could not retrieve authentication token from Google.');
        return;
      }
      
      // Extract all possible user data, checking both top-level and data.user structures
      const userData = userInfo.data || userInfo;
      const googleAuthData = {
        idToken: idToken,
        email: userData.user?.email || userData.email,
        name: userData.user?.name || userData.displayName || userData.givenName,
        photo: userData.user?.photo || userData.photoURL
      };
      
      console.log('GoogleAuthData sending to backend:', JSON.stringify(googleAuthData));
      
      // Send to our backend through the authService
      const response = await authService.googleAuth(googleAuthData);
      
      if (response.success) {
        console.log('Backend authentication successful');
        
        if (response.isNewUser || !response.user.hasProfile) {
          // New user or existing user without profile - go to profile creation
          console.log('New Google user or no profile, navigating to CreateProfile');
          navigation.replace('CreateProfile');
        } else {
          // Existing user with profile - go to main app
          console.log('Existing Google user with profile, navigating to Main');
          navigation.replace('Main');
        }
      } else {
        // Handle auth failure
        Alert.alert('Authentication Failed', response.message || 'Failed to authenticate with Google');
      }
    } catch (error) {
      console.error('Google Sign-In error:', error);
      
      // Improved error handling - check if error and error.code exist before using them
      if (error && error.code) {
        if (error.code === statusCodes.SIGN_IN_CANCELLED) {
          console.log('Sign in cancelled by user');
          // Just close the dialog, no error message needed
        } else if (error.code === statusCodes.IN_PROGRESS) {
          Alert.alert('Google Sign-In', 'Sign in is already in progress');
        } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
          Alert.alert('Google Play Services Required', 'Please install/update Google Play Services to use this feature');
        } else {
          // Generic error message for other code-based errors
          Alert.alert('Google Sign-In Error', error.message || 'An error occurred during Google Sign-In. Please try again later.');
        }
      } else {
        // Fallback for when error object doesn't have expected structure
        Alert.alert('Google Sign-In Error', 'An unexpected error occurred. Please try again later.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    // Validate inputs
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);

    if (isEmailValid && isPasswordValid) {
      setIsLoading(true);
      dismissKeyboard();

      try {
        console.log('Attempting login with:', { email: email.trim(), password: '***' });

        // Call login API endpoint
        const response = await authService.login({
          email: email.trim(),
          password: password
        });

        if (response.success) {
          console.log('Login successful, navigating to Main screen');
          
          // Fetch user profile after successful login
          try {
            // The API doesn't return user ID with login, so we need to lookup by username
            // This is a workaround until the API can return the user ID
            const storedUser = await authService.getUserFromStorage();
            if (storedUser) {
              navigation.replace('Main');
            } else {
              // If user doesn't have a profile yet, redirect to create profile
              navigation.replace('CreateProfile');
            }
          } catch (profileError) {
            console.error('Error fetching profile:', profileError);
            navigation.replace('CreateProfile');
          }
        } else {
          throw new Error(response.message || 'Login failed. Please check your credentials.');
        }
      } catch (error) {
        setIsLoading(false);
        console.error('Login error:', error);
        
        // Show appropriate error message based on error type
        if (error.response?.status === 404) {
          Alert.alert('Login Failed', 'Email not found. Please check your credentials.');
        } else if (error.response?.status === 401) {
          Alert.alert('Login Failed', 'Incorrect password. Please try again.');
        } else if (error.type === 'network') {
          Alert.alert('Connection Error', 'Please check your internet connection and try again.');
        } else {
          Alert.alert('Login Failed', error.message || 'An unexpected error occurred. Please try again.');
        }
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Add a useEffect hook to check for existing login at component mount
  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        setIsLoading(true);
        const authStatus = await authService.checkAuthStatus();
        
        if (authStatus.isAuthenticated) {
          // User is already logged in
          console.log('User already logged in, navigating to Main screen');
          navigation.replace('Main');
        }
      } catch (error) {
        console.error('Error checking login status:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkLoginStatus();
  }, [navigation]);

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  return (
    <TouchableWithoutFeedback onPress={dismissKeyboard}>
      <LinearGradient colors={['#A95CF1', '#DB6FDF']} style={styles.container}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingView}
        >
          <SafeAreaView style={styles.safeArea}>
            <View style={styles.logoContainer}>
              <Image
                source={require('../../../assets/images/gym_icon.png')}
                style={styles.logo}
                resizeMode="contain"
              />
              <Text style={styles.appName}>GymTastic</Text>
            </View>
            
            <Text style={styles.title}>Login</Text>

            {/* Email Input */}
            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.input, emailError ? styles.inputError : null]}
                placeholder="Enter Email"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (emailError) validateEmail(text);
                }}
                placeholderTextColor="#999"
                autoCapitalize="none"
                onBlur={() => validateEmail(email)}
                maxLength={100}
              />
              {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.input, passwordError ? styles.inputError : null]}
                placeholder="Enter Password"
                secureTextEntry
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (passwordError) validatePassword(text);
                }}
                placeholderTextColor="#999"
                onBlur={() => validatePassword(password)}
              />
              {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
            </View>

            {/* Forgot Password */}
            <View style={styles.forgotPasswordContainer}>
              <TouchableOpacity onPress={handleForgotPassword}>
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>
            </View>

            {/* Login Button */}
            <TouchableOpacity 
              style={styles.button} 
              onPress={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.buttonText}>Login</Text>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.dividerContainer}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.divider} />
            </View>

            {/* Google Sign-In Button */}
            <TouchableOpacity 
              style={styles.googleButton} 
              onPress={handleGoogleSignIn}
              disabled={isLoading}
            >
              <View style={styles.googleIconContainer}>
                <Text style={styles.googleIconText}>G</Text>
              </View>
              <Text style={styles.googleText}>Continue with Google</Text>
            </TouchableOpacity>

            {/* Register Navigation */}
            <View style={styles.registerContainer}>
              <Text style={styles.registerPrompt}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                <Text style={styles.registerText}>Register</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1 
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logo: {
    width: 80,
    height: 80,
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 10,
  },
  title: { 
    fontSize: 30, 
    fontWeight: 'bold', 
    color: '#fff', 
    marginBottom: 20 
  },
  inputContainer: {
    width: '100%',
    marginBottom: 10,
  },
  input: {
    width: '100%',
    height: 55,
    backgroundColor: '#fff',
    borderRadius: 30,
    paddingHorizontal: 20,
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'transparent',
    color: '#333',
  },
  inputError: {
    borderColor: '#FF6B6B',
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 12,
    marginTop: 5,
    marginLeft: 10,
  },
  forgotPasswordContainer: {
    width: '100%',
    alignItems: 'flex-end',
    marginTop: 8,
    marginBottom: 5,
  },
  forgotPasswordText: {
    color: '#fff',
    fontSize: 14,
  },
  button: { 
    width: '100%', 
    height: 55, 
    borderRadius: 30,
    backgroundColor: '#8E44AD',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  buttonText: { 
    color: '#fff', 
    fontSize: 18, 
    fontWeight: 'bold' 
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginVertical: 20,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  dividerText: {
    color: '#fff',
    marginHorizontal: 10,
    fontSize: 14,
  },
  googleButton: {
    width: '100%',
    height: 55,
    borderRadius: 30,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  googleIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4285F4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  googleIconText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  googleText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  registerContainer: {
    flexDirection: 'row',
    marginTop: 25,
  },
  registerPrompt: {
    color: '#fff',
  },
  registerText: { 
    color: '#fff', 
    fontWeight: 'bold',
  },
});

export default LoginScreen;
