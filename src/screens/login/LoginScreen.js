import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Image,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

const LoginScreen = ({ navigation }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    // Email Validation Function
    const validateEmail = (text) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // Basic email validation regex
        if (!emailRegex.test(text)) {
            setError('Invalid email format');
        } else {
            setError('');
        }
        setEmail(text);
    };

    const handleLogin = () => {
        if (!email || error) {
            alert('Please enter a valid email address.');
            return;
        }
        console.log('Logging in with Email:', email, 'Password:', password);
        // Navigate to Home screen after successful login
        navigation.replace('Home'); // Replace 'Home' with your next screen
    };

    return (
        <LinearGradient colors={['#A95CF1', '#DB6FDF']} style={styles.container}>
            {/* Illustration */}
            <Image
                source={require('../../../assets/images/gym_icon.png')}
                style={styles.logo}
            />

            {/* Title */}
            <Text style={styles.title}>Welcome Back!</Text>
            <Text style={styles.subtitle}>Please login to your account</Text>

            {/* Email Input */}
            <TextInput
                style={styles.input}
                placeholder="Enter Your Email"
                placeholderTextColor="#B8B8B8"
                keyboardType="email-address"
                value={email}
                onChangeText={validateEmail}
            />
            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            {/* Password Input */}
            <TextInput
                style={styles.input}
                placeholder="Enter Your Password"
                placeholderTextColor="#B8B8B8"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
            />

            {/* Login Button */}
            <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
                <LinearGradient
                    colors={['#8E44AD', '#A95CF1']}
                    style={styles.buttonGradient}
                >
                    <Text style={styles.buttonText}>Login</Text>
                </LinearGradient>
            </TouchableOpacity>

            {/* Register Link */}
            <Text style={styles.registerText}>
                Don't have an account?{' '}
                <Text
                    style={{ fontWeight: 'bold', color: '#A95CF1' }}
                    onPress={() => navigation.navigate('Register')}
                >
                    Register
                </Text>
            </Text>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    logo: {
        width: 150,
        height: 150,
        marginBottom: 30,
    },
    title: {
        color: '#fff',
        fontSize: 28,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    subtitle: {
        color: '#fff',
        fontSize: 18,
        marginBottom: 20,
        textAlign: 'center',
    },
    input: {
        width: '100%',
        height: 50,
        backgroundColor: '#fff',
        borderRadius: 25,
        paddingHorizontal: 20,
        marginBottom: 15,
        fontSize: 16,
    },
    errorText: {
        color: 'red',
        fontSize: 12,
        marginBottom: 10,
        alignSelf: 'flex-start',
    },
    loginButton: {
        width: '100%',
        height: 50,
        borderRadius: 25,
        marginBottom: 20,
    },
    buttonGradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 25,
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    registerText: {
        color: '#fff',
        fontSize: 14,
    },
});

export default LoginScreen;
