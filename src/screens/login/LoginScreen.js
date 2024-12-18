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

    const validateEmail = (text) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
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
        if (!password) {
            alert('Password cannot be empty!');
            return;
        }
        console.log('Logging in with:', email, password);
        navigation.replace('Main'); // Navigate to Main Screen
    };

    return (
        <LinearGradient colors={['#A95CF1', '#DB6FDF']} style={styles.container}>
            <Image source={require('../../../assets/images/gym_icon.png')} style={styles.logo} />

            <Text style={styles.title}>Welcome Back!</Text>
            <TextInput
                style={styles.input}
                placeholder="Enter Your Email"
                placeholderTextColor="#B8B8B8"
                keyboardType="email-address"
                value={email}
                onChangeText={validateEmail}
            />
            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#B8B8B8"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
            />

            <TouchableOpacity style={styles.button} onPress={handleLogin}>
                <LinearGradient colors={['#8E44AD', '#A95CF1']} style={styles.buttonGradient}>
                    <Text style={styles.buttonText}>Login</Text>
                </LinearGradient>
            </TouchableOpacity>

            <Text style={styles.registerText}>
                Don't have an account?{' '}
                <Text style={{ fontWeight: 'bold', color: '#A95CF1' }} onPress={() => navigation.navigate('Register')}>
                    Register
                </Text>
            </Text>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, justifyContent: 'center' },
    logo: { width: 120, height: 120, alignSelf: 'center', marginBottom: 20 },
    title: { fontSize: 28, fontWeight: 'bold', color: '#fff', textAlign: 'center' },
    input: { backgroundColor: '#fff', borderRadius: 25, marginBottom: 15, paddingHorizontal: 20, height: 50 },
    button: { height: 50, borderRadius: 25, marginBottom: 10 },
    buttonGradient: { flex: 1, justifyContent: 'center', alignItems: 'center', borderRadius: 25 },
    buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    errorText: { color: 'red', fontSize: 12, marginBottom: 10 },
    registerText: { color: '#fff', textAlign: 'center', fontSize: 14 },
});

export default LoginScreen;
