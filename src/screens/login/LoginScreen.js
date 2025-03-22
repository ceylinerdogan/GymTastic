import React, { useState } from 'react';
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
import { GoogleSignin, GoogleSigninButton } from '@react-native-google-signin/google-signin';
import { authService } from '../../services/api';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  React.useEffect(() => {
    GoogleSignin.configure({
      webClientId: 'YOUR_WEB_CLIENT_ID', 
    });
  }, []);

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      setEmailError('Email is required');
      return false;
    } else if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email');
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
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      console.log('Google User Info:', userInfo);
      
      // Call API to authenticate with Google credentials
      const googleAuthData = {
        idToken: userInfo.idToken,
        email: userInfo.user.email,
        name: userInfo.user.name
      };
      
      try {
        const response = await authService.login({
          provider: 'google',
          ...googleAuthData
        });
        
        if (response.token) {
          navigation.replace('Main');
        } else {
          throw new Error('Authentication failed');
        }
      } catch (apiError) {
        console.error('API Error:', apiError);
        Alert.alert('Login Failed', apiError.message || 'Failed to authenticate with Google');
      }
      
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
      console.error(error);
      Alert.alert('Google Sign-In Error', error.message);
    }
  };

  const handleLogin = async () => {
    Keyboard.dismiss();
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);

    if (isEmailValid && isPasswordValid) {
      setIsLoading(true);
      
      try {
        // We no longer clear user data when logging in, to preserve data between sessions
        
        const response = await authService.login({
          email,
          password
        });
        
        setIsLoading(false);
        
        if (response.token) {
          console.log('Login successful, user ID:', response.user.id);
          
          // After successful login, make sure to fetch the profile
          try {
            const profileResponse = await authService.getProfile();
            if (profileResponse && profileResponse.profile) {
              console.log('Profile retrieved successfully after login');
            }
          } catch (profileError) {
            console.log('Could not retrieve profile after login:', profileError.message);
          }
          
          navigation.replace('Main');
        } else {
          throw new Error('Authentication failed');
        }
      } catch (error) {
        setIsLoading(false);
        console.error('Login error:', error);
        
        // Show appropriate error message
        if (error.type === 'network') {
          Alert.alert('Connection Error', 'Please check your internet connection and try again.');
        } else {
          Alert.alert(
            'Login Failed', 
            error.message || 'Invalid credentials. Please try again or create a new account.'
          );
        }
      }
    }
  };

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
                keyboardType="email-address"
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
