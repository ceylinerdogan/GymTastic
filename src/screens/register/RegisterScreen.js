import React, { useState, useEffect } from 'react';
import { 
    View, 
    Text, 
    TextInput, 
    TouchableOpacity, 
    StyleSheet, 
    SafeAreaView,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    TouchableWithoutFeedback,
    Keyboard,
    Alert,
    ScrollView
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import authService from '../../services/authService';
import { Dropdown } from 'react-native-element-dropdown';

// Fitness goal options
const fitnessGoals = [
  { label: 'Lose Weight', value: 'lose_weight' },
  { label: 'Gain Muscle', value: 'gain_muscle' },
  { label: 'Cardio', value: 'cardio' },
];

// Activity level options
const activityLevels = [
  { label: 'Beginner', value: 'beginner' },
  { label: 'Intermediate', value: 'intermediate' },
  { label: 'Advance', value: 'advance' },
];

// Gender options
const genderOptions = [
  { label: 'Male', value: 'Male' },
  { label: 'Female', value: 'Female' },
  { label: 'Other', value: 'Other' },
  { label: 'Prefer not to say', value: 'Not_specified' },
];

const RegisterScreen = ({ navigation }) => {
    // Basic Account Fields
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [fullName, setFullName] = useState('');
    
    // Profile Fields
    const [gender, setGender] = useState(null);
    const [birthDate, setBirthDate] = useState('');
    const [weight, setWeight] = useState('');
    const [height, setHeight] = useState('');
    const [fitnessGoal, setFitnessGoal] = useState(null);
    const [activityLevel, setActivityLevel] = useState(null);
    
    const [isLoading, setIsLoading] = useState(false);
    
    // Basic Account Validation States
    const [emailError, setEmailError] = useState('');
    const [usernameError, setUsernameError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [confirmPasswordError, setConfirmPasswordError] = useState('');
    const [fullNameError, setFullNameError] = useState('');
    
    // Profile Validation States
    const [genderError, setGenderError] = useState('');
    const [birthDateError, setBirthDateError] = useState('');
    const [weightError, setWeightError] = useState('');
    const [heightError, setHeightError] = useState('');
    const [fitnessGoalError, setFitnessGoalError] = useState('');
    const [activityLevelError, setActivityLevelError] = useState('');
    
    // Password strength indicators
    const [passwordStrength, setPasswordStrength] = useState({
        score: 0,
        hasMinLength: false,
        hasUpperCase: false,
        hasLowerCase: false,
        hasNumber: false,
        hasSpecialChar: false
    });

    // Initialize Google Sign-In
    useEffect(() => {
        GoogleSignin.configure({
            // Web client ID from Google Cloud Console
            webClientId: '192945878015-c7ck03vqeduqhnln1a9eslb085on44te.apps.googleusercontent.com',
            offlineAccess: true,
        });
    }, []);

    const validateEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email) {
            setEmailError('Email is required');
            return false;
        } else if (!emailRegex.test(email)) {
            setEmailError('Please enter a valid email address');
            return false;
        }
        setEmailError('');
        return true;
    };

    const validateUsername = (username) => {
        if (!username || username.trim() === '') {
            setUsernameError('Username is required');
            return false;
        }
        setUsernameError('');
        return true;
    };

    const checkPasswordStrength = (password) => {
        const strength = {
            score: 0,
            hasMinLength: password.length >= 8,
            hasUpperCase: /[A-Z]/.test(password),
            hasLowerCase: /[a-z]/.test(password),
            hasNumber: /[0-9]/.test(password),
            hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password)
        };

        if (strength.hasMinLength) strength.score++;
        if (strength.hasUpperCase) strength.score++;
        if (strength.hasLowerCase) strength.score++;
        if (strength.hasNumber) strength.score++;
        if (strength.hasSpecialChar) strength.score++;

        setPasswordStrength(strength);
        return strength;
    };

    const validatePassword = (password) => {
        if (!password) {
            setPasswordError('Password is required');
            return false;
        }
        
        const strength = checkPasswordStrength(password);
        
        if (strength.score < 3) {
            setPasswordError('Password is too weak');
            return false;
        }
        
        setPasswordError('');
        return true;
    };

    const validateConfirmPassword = (password, confirmPassword) => {
        if (!confirmPassword) {
            setConfirmPasswordError('Please confirm your password');
            return false;
        } else if (confirmPassword !== password) {
            setConfirmPasswordError('Passwords do not match');
            return false;
        }
        setConfirmPasswordError('');
        return true;
    };

    const validateFullName = (name) => {
        if (!name || name.trim() === '') {
            setFullNameError('Full name is required');
            return false;
        }
        setFullNameError('');
        return true;
    };

    // Profile Field Validation Functions
    const validateGender = (gender) => {
        if (!gender) {
            setGenderError('Please select your gender');
            return false;
        }
        setGenderError('');
        return true;
    };

    const validateBirthDate = (date) => {
        // Basic date format validation (DD.MM.YYYY)
        const dateRegex = /^(0[1-9]|[12][0-9]|3[01])\.(0[1-9]|1[0-2])\.\d{4}$/;
        if (!date) {
            setBirthDateError('Date of birth is required');
            return false;
        } else if (!dateRegex.test(date)) {
            setBirthDateError('Please use format: DD.MM.YYYY');
            return false;
        }
        setBirthDateError('');
        return true;
    };

    const validateWeight = (weight) => {
        if (!weight) {
            setWeightError('Weight is required');
            return false;
        } else if (isNaN(weight) || parseFloat(weight) <= 0) {
            setWeightError('Please enter a valid weight');
            return false;
        } else if (parseFloat(weight) < 30 || parseFloat(weight) > 300) {
            setWeightError('Weight should be between 30-300kg');
            return false;
        }
        setWeightError('');
        return true;
    };

    const validateHeight = (height) => {
        if (!height) {
            setHeightError('Height is required');
            return false;
        } else if (isNaN(height) || parseFloat(height) <= 0) {
            setHeightError('Please enter a valid height');
            return false;
        } else if (parseFloat(height) < 100 || parseFloat(height) > 250) {
            setHeightError('Height should be between 100-250cm');
            return false;
        }
        setHeightError('');
        return true;
    };

    const validateFitnessGoal = (goal) => {
        if (!goal) {
            setFitnessGoalError('Please select your fitness goal');
            return false;
        }
        setFitnessGoalError('');
        return true;
    };

    const validateActivityLevel = (level) => {
        if (!level) {
            setActivityLevelError('Please select your activity level');
            return false;
        }
        setActivityLevelError('');
        return true;
    };

    const handleGoogleSignUp = async () => {
        try {
            setIsLoading(true);
            dismissKeyboard();
            
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
                console.log('Google authentication successful');
                
                // Show success message
                Alert.alert(
                    'Registration Successful',
                    'Your account has been created with Google!',
                    [
                        {
                            text: 'Continue',
                            onPress: () => {
                                // Always navigate to profile creation for new Google users
                                navigation.navigate('CreateProfile');
                            }
                        }
                    ]
                );
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

    const handleRegister = async () => {
        // Validate basic account fields
        const isFullNameValid = validateFullName(fullName);
        const isUsernameValid = validateUsername(username);
        const isPasswordValid = validatePassword(password);
        const isConfirmPasswordValid = validateConfirmPassword(password, confirmPassword);
        const isEmailValid = validateEmail(email);

        // Validate profile fields
        const isGenderValid = validateGender(gender);
        const isBirthDateValid = validateBirthDate(birthDate);
        const isWeightValid = validateWeight(weight);
        const isHeightValid = validateHeight(height);
        const isFitnessGoalValid = validateFitnessGoal(fitnessGoal);
        const isActivityLevelValid = validateActivityLevel(activityLevel);

        // Check if all validations passed
        const isFormValid = 
            isFullNameValid && isUsernameValid && isPasswordValid && 
            isConfirmPasswordValid && isEmailValid && isGenderValid && 
            isBirthDateValid && isWeightValid && isHeightValid && 
            isFitnessGoalValid && isActivityLevelValid;

        if (isFormValid) {
            setIsLoading(true);
            dismissKeyboard();
            
            try {
                // Prepare registration data with all required fields
                const registrationData = {
                    fullName: fullName,
                    username: username,
                    password: password,
                    email: email,
                    gender: gender,
                    height: parseFloat(height),
                    weight: parseFloat(weight),
                    birth_date: birthDate,
                    fitness_goal: fitnessGoal,
                    activity_level: activityLevel
                };
                
                console.log('Registering with data:', {
                    ...registrationData,
                    password: '***'  // Hide password in logs
                });
                
                // Call the register API endpoint
                const response = await authService.register(registrationData);
                
                setIsLoading(false);
                
                if (response.success) {
                    // Store user data for use in the app
                    await authService.saveUserToStorage({
                        username: username,
                        authenticated: true,
                        userID: response.data?.user_id
                    });
                    
                    // Success - navigate directly to main app
                    Alert.alert(
                        'Registration Successful',
                        'Your account has been created successfully!',
                        [
                            {
                                text: 'Continue',
                                onPress: () => navigation.replace('Main')
                            }
                        ]
                    );
                } else {
                    throw new Error(response.message || 'Registration failed');
                }
            } catch (error) {
                setIsLoading(false);
                console.error('Registration error:', error);
                
                // Show appropriate error based on error type
                if (error.response?.status === 400 && error.response?.data?.error?.includes('Username already exists')) {
                    Alert.alert('Registration Failed', 'This username is already taken. Please choose a different one.');
                } else if (error.response?.status === 400 && error.response?.data?.error?.includes('Email already exists')) {
                    Alert.alert('Registration Failed', 'This email is already registered. Please use a different email or try logging in.');
                } else if (error.type === 'network') {
                    Alert.alert('Connection Error', 'Please check your internet connection and try again.');
                } else {
                    Alert.alert(
                        'Registration Failed', 
                        error.message || 'An unexpected error occurred. Please try again.'
                    );
                }
            }
        } else {
            // Form is invalid, scroll to first error
            // Handled by UI scroll
        }
    };

    const getPasswordStrengthText = () => {
        const { score } = passwordStrength;
        if (score === 0) return '';
        if (score < 3) return 'Weak';
        if (score < 5) return 'Medium';
        return 'Strong';
    };

    const getPasswordStrengthColor = () => {
        const { score } = passwordStrength;
        if (score === 0) return '#ccc';
        if (score < 3) return '#FF6B6B';
        if (score < 5) return '#FFCC00';
        return '#4CD964';
    };

    const calculateBMI = () => {
        if (weight && height) {
            const weightNum = parseFloat(weight);
            const heightNum = parseFloat(height) / 100; // Convert cm to m
            const bmi = weightNum / (heightNum * heightNum);
            return bmi.toFixed(1);
        }
        return null;
    };

    const getBMICategory = (bmi) => {
        if (!bmi) return '';
        if (bmi < 18.5) return 'Underweight';
        if (bmi < 25) return 'Normal weight';
        if (bmi < 30) return 'Overweight';
        return 'Obese';
    };

    const dismissKeyboard = () => {
        Keyboard.dismiss();
    };

    const bmi = calculateBMI();
    const bmiCategory = getBMICategory(bmi);

    return (
        <TouchableWithoutFeedback onPress={dismissKeyboard}>
            <LinearGradient colors={['#A95CF1', '#DB6FDF']} style={styles.container}>
                <KeyboardAvoidingView 
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.keyboardAvoidingView}
                >
                    <SafeAreaView style={styles.safeArea}>
                        <ScrollView 
                            style={styles.scrollView} 
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={styles.scrollContent}
                        >
                            <Text style={styles.title}>Create Account</Text>
                            <Text style={styles.subtitle}>Join GymTastic to start your fitness journey</Text>
                            
                            {/* Google Sign Up Button */}
                            <TouchableOpacity 
                                style={styles.googleButton} 
                                onPress={handleGoogleSignUp}
                                disabled={isLoading}
                            >
                                <View style={styles.googleIconContainer}>
                                    <Text style={styles.googleIconText}>G</Text>
                                </View>
                                <Text style={styles.googleText}>Sign up with Google</Text>
                            </TouchableOpacity>
                            
                            {/* Divider */}
                            <View style={styles.dividerContainer}>
                                <View style={styles.divider} />
                                <Text style={styles.dividerText}>OR</Text>
                                <View style={styles.divider} />
                            </View>
                            
                            {/* Part 1: Basic Account Information */}
                            <Text style={styles.sectionTitle}>Account Information</Text>

                            {/* Full Name Input */}
                            <View style={styles.inputContainer}>
                                <TextInput
                                    style={[styles.input, fullNameError ? styles.inputError : null]}
                                    placeholder="Full name"
                                    value={fullName}
                                    onChangeText={setFullName}
                                    placeholderTextColor="#999"
                                    autoCapitalize="words"
                                    onBlur={() => validateFullName(fullName)}
                                    maxLength={100}
                                />
                                {fullNameError ? <Text style={styles.errorText}>{fullNameError}</Text> : null}
                            </View>
                            
                            {/* Email Input */}
                            <View style={styles.inputContainer}>
                                <TextInput
                                    style={[styles.input, emailError ? styles.inputError : null]}
                                    placeholder="Email address"
                                    value={email}
                                    onChangeText={setEmail}
                                    placeholderTextColor="#999"
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    onBlur={() => validateEmail(email)}
                                    maxLength={100}
                                />
                                {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
                            </View>

                            {/* Username Input */}
                            <View style={styles.inputContainer}>
                                <TextInput
                                    style={[styles.input, usernameError ? styles.inputError : null]}
                                    placeholder="Username"
                                    value={username}
                                    onChangeText={setUsername}
                                    placeholderTextColor="#999"
                                    autoCapitalize="none"
                                    onBlur={() => validateUsername(username)}
                                    maxLength={50}
                                />
                                {usernameError ? <Text style={styles.errorText}>{usernameError}</Text> : null}
                            </View>

                            {/* Password Input */}
                            <View style={styles.inputContainer}>
                                <TextInput
                                    style={[styles.input, passwordError ? styles.inputError : null]}
                                    placeholder="Create password (8+ characters)"
                                    secureTextEntry
                                    value={password}
                                    onChangeText={(text) => {
                                        setPassword(text);
                                        checkPasswordStrength(text);
                                    }}
                                    placeholderTextColor="#999"
                                    onBlur={() => validatePassword(password)}
                                />
                                {password.length > 0 && (
                                    <View style={styles.passwordStrengthContainer}>
                                        <View style={styles.passwordStrengthBar}>
                                            <View 
                                                style={[
                                                    styles.passwordStrengthIndicator, 
                                                    { 
                                                        width: `${20 * passwordStrength.score}%`,
                                                        backgroundColor: getPasswordStrengthColor() 
                                                    }
                                                ]} 
                                            />
                                        </View>
                                        <Text style={[styles.passwordStrengthText, { color: getPasswordStrengthColor() }]}>
                                            {getPasswordStrengthText()}
                                        </Text>
                                    </View>
                                )}
                                {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
                            </View>

                            {/* Confirm Password Input */}
                            <View style={styles.inputContainer}>
                                <TextInput
                                    style={[styles.input, confirmPasswordError ? styles.inputError : null]}
                                    placeholder="Confirm password"
                                    secureTextEntry
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                    placeholderTextColor="#999"
                                    onBlur={() => validateConfirmPassword(password, confirmPassword)}
                                />
                                {confirmPasswordError ? <Text style={styles.errorText}>{confirmPasswordError}</Text> : null}
                            </View>

                            {/* Part 2: Profile Information */}
                            <Text style={styles.sectionTitle}>Personal Information</Text>

                            {/* Gender Input */}
                            <View style={styles.inputContainer}>
                                <Dropdown
                                    style={[styles.dropdown, genderError ? styles.inputError : null]}
                                    placeholder="Select Gender"
                                    placeholderStyle={styles.placeholderStyle}
                                    selectedTextStyle={styles.selectedTextStyle}
                                    data={genderOptions}
                                    maxHeight={200}
                                    labelField="label"
                                    valueField="value"
                                    value={gender}
                                    onChange={(item) => {
                                        setGender(item.value);
                                        validateGender(item.value);
                                    }}
                                />
                                {genderError ? <Text style={styles.errorText}>{genderError}</Text> : null}
                            </View>

                            {/* Birth Date Input */}
                            <View style={styles.inputContainer}>
                                <TextInput
                                    style={[styles.input, birthDateError ? styles.inputError : null]}
                                    placeholder="Date of Birth (DD.MM.YYYY)"
                                    value={birthDate}
                                    onChangeText={setBirthDate}
                                    placeholderTextColor="#999"
                                    keyboardType="number-pad"
                                    maxLength={10}
                                    onBlur={() => validateBirthDate(birthDate)}
                                />
                                {birthDateError ? <Text style={styles.errorText}>{birthDateError}</Text> : null}
                            </View>

                            {/* Height and Weight Inputs - Side by Side */}
                            <View style={styles.doubleInputRow}>
                                {/* Height Input */}
                                <View style={[styles.inputContainer, styles.halfInput]}>
                                    <TextInput
                                        style={[styles.input, heightError ? styles.inputError : null]}
                                        placeholder="Height (cm)"
                                        value={height}
                                        onChangeText={setHeight}
                                        keyboardType="decimal-pad"
                                        placeholderTextColor="#999"
                                        maxLength={6}
                                        onBlur={() => validateHeight(height)}
                                    />
                                    {heightError ? <Text style={styles.errorText}>{heightError}</Text> : null}
                                </View>
                                
                                {/* Weight Input */}
                                <View style={[styles.inputContainer, styles.halfInput]}>
                                    <TextInput
                                        style={[styles.input, weightError ? styles.inputError : null]}
                                        placeholder="Weight (kg)"
                                        value={weight}
                                        onChangeText={setWeight}
                                        keyboardType="decimal-pad"
                                        placeholderTextColor="#999"
                                        maxLength={6}
                                        onBlur={() => validateWeight(weight)}
                                    />
                                    {weightError ? <Text style={styles.errorText}>{weightError}</Text> : null}
                                </View>
                            </View>

                            {/* BMI Display */}
                            {bmi && (
                                <View style={styles.bmiContainer}>
                                    <Text style={styles.bmiLabel}>
                                        BMI: <Text style={styles.bmiValue}>{bmi}</Text> 
                                        <Text style={styles.bmiCategory}> ({bmiCategory})</Text>
                                    </Text>
                                </View>
                            )}

                            {/* Fitness Goal Input */}
                            <View style={styles.inputContainer}>
                                <Dropdown
                                    style={[styles.dropdown, fitnessGoalError ? styles.inputError : null]}
                                    placeholder="Select Fitness Goal"
                                    placeholderStyle={styles.placeholderStyle}
                                    selectedTextStyle={styles.selectedTextStyle}
                                    data={fitnessGoals}
                                    maxHeight={200}
                                    labelField="label"
                                    valueField="value"
                                    value={fitnessGoal}
                                    onChange={(item) => {
                                        setFitnessGoal(item.value);
                                        validateFitnessGoal(item.value);
                                    }}
                                />
                                {fitnessGoalError ? <Text style={styles.errorText}>{fitnessGoalError}</Text> : null}
                            </View>

                            {/* Activity Level Input */}
                            <View style={styles.inputContainer}>
                                <Dropdown
                                    style={[styles.dropdown, activityLevelError ? styles.inputError : null]}
                                    placeholder="Select Activity Level"
                                    placeholderStyle={styles.placeholderStyle}
                                    selectedTextStyle={styles.selectedTextStyle}
                                    data={activityLevels}
                                    maxHeight={200}
                                    labelField="label"
                                    valueField="value"
                                    value={activityLevel}
                                    onChange={(item) => {
                                        setActivityLevel(item.value);
                                        validateActivityLevel(item.value);
                                    }}
                                />
                                {activityLevelError ? <Text style={styles.errorText}>{activityLevelError}</Text> : null}
                            </View>

                            {/* Register Button */}
                            <TouchableOpacity 
                                style={styles.button} 
                                onPress={handleRegister}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <ActivityIndicator color="#fff" size="small" />
                                ) : (
                                    <Text style={styles.buttonText}>Create Account</Text>
                                )}
                            </TouchableOpacity>

                            {/* Login Navigation */}
                            <View style={styles.loginContainer}>
                                <Text style={styles.loginPrompt}>Already have an account? </Text>
                                <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                                    <Text style={styles.loginText}>Login</Text>
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
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
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingVertical: 30,
        paddingHorizontal: 20,
    },
    title: { 
        fontSize: 30, 
        fontWeight: 'bold', 
        color: '#fff', 
        marginBottom: 10, 
        textAlign: 'center' 
    },
    subtitle: {
        fontSize: 16,
        color: '#fff',
        marginBottom: 25,
        textAlign: 'center',
        opacity: 0.8,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
        marginVertical: 15,
    },
    inputContainer: {
        marginBottom: 15,
        width: '100%',
    },
    input: { 
        backgroundColor: '#fff', 
        borderRadius: 30, 
        paddingHorizontal: 20, 
        height: 55, 
        width: '100%',
        fontSize: 16,
        borderWidth: 1,
        borderColor: 'transparent',
        color: '#333',
    },
    dropdown: {
        backgroundColor: '#fff',
        borderRadius: 30,
        height: 55,
        paddingHorizontal: 20,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    placeholderStyle: {
        fontSize: 16,
        color: '#999',
    },
    selectedTextStyle: {
        fontSize: 16,
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
    doubleInputRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
    },
    halfInput: {
        width: '48%',
    },
    bmiContainer: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        padding: 12,
        borderRadius: 15,
        marginBottom: 15,
    },
    bmiLabel: {
        color: '#fff',
        fontSize: 16,
    },
    bmiValue: {
        fontWeight: 'bold',
    },
    bmiCategory: {
        fontStyle: 'italic',
    },
    passwordStrengthContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
    },
    passwordStrengthBar: {
        flex: 1,
        height: 4,
        backgroundColor: '#ddd',
        borderRadius: 2,
        overflow: 'hidden',
    },
    passwordStrengthIndicator: {
        height: '100%',
    },
    passwordStrengthText: {
        marginLeft: 10,
        fontSize: 12,
        fontWeight: 'bold',
    },
    button: { 
        height: 55, 
        borderRadius: 30,
        backgroundColor: '#8E44AD',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
        elevation: 3,
        marginTop: 15,
    },
    buttonText: { 
        color: '#fff', 
        fontSize: 18, 
        fontWeight: 'bold' 
    },
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 25,
        width: '100%',
        marginTop: 15,
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
        height: 55,
        borderRadius: 30,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
        elevation: 3,
        flexDirection: 'row',
    },
    googleIconContainer: {
        backgroundColor: '#4285F4',
        borderRadius: 15,
        width: 30,
        height: 30,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    googleIconText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
    },
    googleText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#333',
    },
    loginContainer: {
        flexDirection: 'row',
        marginTop: 20,
        justifyContent: 'center',
    },
    loginPrompt: {
        color: '#fff',
    },
    loginText: { 
        color: '#fff', 
        fontWeight: 'bold',
    },
});

export default RegisterScreen;
