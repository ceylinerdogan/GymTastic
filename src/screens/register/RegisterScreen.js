import React, { useState } from 'react';
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
    Alert
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { authService } from '../../services/api';

const RegisterScreen = ({ navigation }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    // Form validation state
    const [emailError, setEmailError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [confirmPasswordError, setConfirmPasswordError] = useState('');
    
    // Password strength indicators
    const [passwordStrength, setPasswordStrength] = useState({
        score: 0,
        hasMinLength: false,
        hasUpperCase: false,
        hasLowerCase: false,
        hasNumber: false,
        hasSpecialChar: false
    });

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

    const validateConfirmPassword = (confirmPassword) => {
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

    const handleRegister = async () => {
        Keyboard.dismiss();
        
        // Validate all fields
        const isEmailValid = validateEmail(email);
        const isPasswordValid = validatePassword(password);
        const isConfirmPasswordValid = validateConfirmPassword(confirmPassword);

        if (isEmailValid && isPasswordValid && isConfirmPasswordValid) {
            setIsLoading(true);
            
            try {
                // Call the register API endpoint
                const response = await authService.register({
                    email,
                    password
                });
                
                setIsLoading(false);
                
                if (response.success || response.user) {
                    // Success - navigate to create profile
                    Alert.alert(
                        'Registration Successful',
                        'Your account has been created successfully!',
                        [
                            {
                                text: 'Continue',
                                onPress: () => navigation.navigate('CreateProfile', { 
                                    email: email,
                                    userId: response.user?.id 
                                })
                            }
                        ]
                    );
                } else {
                    throw new Error('Registration failed');
                }
            } catch (error) {
                setIsLoading(false);
                console.error('Registration error:', error);
                
                // Show appropriate error message
                if (error.type === 'network') {
                    Alert.alert('Connection Error', 'Please check your internet connection and try again.');
                } else if (error.type === 'server' && error.status === 409) {
                    Alert.alert('Registration Failed', 'An account with this email already exists.');
                } else {
                    Alert.alert(
                        'Registration Failed', 
                        error.message || 'Unable to create your account. Please try again later.'
                    );
                }
            }
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
                        <Text style={styles.title}>Create Account</Text>
                        <Text style={styles.subtitle}>Join GymTastic to start your fitness journey</Text>
                        
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
                                onBlur={() => validateConfirmPassword(confirmPassword)}
                            />
                            {confirmPasswordError ? <Text style={styles.errorText}>{confirmPasswordError}</Text> : null}
                        </View>

                        {/* Password Requirements */}
                        {password.length > 0 && (
                            <View style={styles.passwordRequirementsContainer}>
                                <Text style={styles.passwordRequirementsTitle}>Password should contain:</Text>
                                <View style={styles.passwordRequirement}>
                                    <Text style={[
                                        styles.passwordRequirementText,
                                        passwordStrength.hasMinLength ? styles.passwordRequirementMet : null
                                    ]}>
                                        ✓ At least 8 characters
                                    </Text>
                                </View>
                                <View style={styles.passwordRequirement}>
                                    <Text style={[
                                        styles.passwordRequirementText,
                                        passwordStrength.hasUpperCase ? styles.passwordRequirementMet : null
                                    ]}>
                                        ✓ Uppercase letter (A-Z)
                                    </Text>
                                </View>
                                <View style={styles.passwordRequirement}>
                                    <Text style={[
                                        styles.passwordRequirementText,
                                        passwordStrength.hasNumber ? styles.passwordRequirementMet : null
                                    ]}>
                                        ✓ Number (0-9)
                                    </Text>
                                </View>
                            </View>
                        )}

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
        marginBottom: 30,
        textAlign: 'center',
        opacity: 0.8,
    },
    inputContainer: {
        width: '100%',
        marginBottom: 15,
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
    inputError: {
        borderColor: '#FF6B6B',
    },
    errorText: {
        color: '#FF6B6B',
        fontSize: 12,
        marginTop: 5,
        marginLeft: 10,
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
    passwordRequirementsContainer: {
        width: '100%',
        marginBottom: 20,
        paddingHorizontal: 10,
    },
    passwordRequirementsTitle: {
        color: '#fff',
        marginBottom: 8,
        fontSize: 14,
    },
    passwordRequirement: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    passwordRequirementText: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.7)',
    },
    passwordRequirementMet: {
        color: '#4CD964',
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
    },
    buttonText: { 
        color: '#fff', 
        fontSize: 18, 
        fontWeight: 'bold' 
    },
    loginContainer: {
        flexDirection: 'row',
        marginTop: 25,
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
