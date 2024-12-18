import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

const RegisterScreen = ({ navigation }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
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

    const handleRegister = () => {
        if (!email || error) {
            alert('Please enter a valid email address.');
            return;
        }
        if (!password) {
            alert('Password cannot be empty!');
            return;
        }
        if (password !== confirmPassword) {
            alert('Passwords do not match!');
            return;
        }
        console.log('Registering:', email);
        navigation.replace('CreateProfile'); // Go to Profile Screen
    };

    return (
        <LinearGradient colors={['#A95CF1', '#DB6FDF']} style={styles.container}>
            <Text style={styles.title}>Register</Text>
            <TextInput style={styles.input} placeholder="Enter Email" onChangeText={validateEmail} value={email} />
            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <TextInput style={styles.input} placeholder="Password" secureTextEntry onChangeText={setPassword} />
            <TextInput style={styles.input} placeholder="Confirm Password" secureTextEntry onChangeText={setConfirmPassword} />

            <TouchableOpacity style={styles.button} onPress={handleRegister}>
                <LinearGradient colors={['#8E44AD', '#A95CF1']} style={styles.buttonGradient}>
                    <Text style={styles.buttonText}>Next</Text>
                </LinearGradient>
            </TouchableOpacity>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, justifyContent: 'center' },
    title: { fontSize: 28, fontWeight: 'bold', color: '#fff', marginBottom: 20, textAlign: 'center' },
    input: { backgroundColor: '#fff', borderRadius: 25, marginBottom: 15, paddingHorizontal: 20, height: 50 },
    button: { height: 50, borderRadius: 25 },
    buttonGradient: { flex: 1, justifyContent: 'center', alignItems: 'center', borderRadius: 25 },
    buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    errorText: { color: 'red', fontSize: 12, marginBottom: 10 },
});

export default RegisterScreen;
