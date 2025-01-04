import React, { useState } from 'react';
import { Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

const RegisterScreen = ({ navigation }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [emailError, setEmailError] = useState('');
    const [passwordError, setPasswordError] = useState('');

    const validateEmail = (text) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(text)) {
            setEmailError('Invalid email format');
        } else {
            setEmailError('');
        }
        setEmail(text);
    };

    const validatePassword = (password) => {
        const passwordRegex = /^(?=.*[A-Z]).{6,}$/;
        if (!passwordRegex.test(password)) {
            setPasswordError(
                'Password must be at least 6 characters long and include at least one uppercase letter.'
            );
        } else {
            setPasswordError('');
        }
        setPassword(password);
    };

    const handleRegister = () => {
        if (!email || emailError) {
            alert('Please enter a valid email address.');
            return;
        }
        if (!password) {
            alert('Password cannot be empty!');
            return;
        }
        if (passwordError) {
            alert(passwordError);
            return;
        }
        if (password !== confirmPassword) {
            alert('Passwords do not match!');
            return;
        }
        console.log('Registering:', email);
        navigation.replace('CreateProfile'); 
    };

    return (
        <LinearGradient colors={['#A95CF1', '#DB6FDF']} style={styles.container}>
            <Text style={styles.title}>Register</Text>
            <TextInput
                style={styles.input}
                placeholder="Enter Email"
                onChangeText={validateEmail}
                value={email}
            />
            {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}

            <TextInput
                style={styles.input}
                placeholder="Password"
                secureTextEntry
                onChangeText={validatePassword}
                value={password}
            />
            {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}

            <TextInput
                style={styles.input}
                placeholder="Confirm Password"
                secureTextEntry
                onChangeText={setConfirmPassword}
                value={confirmPassword}
            />

            <TouchableOpacity style={styles.button} onPress={handleRegister}>
                <LinearGradient
                    colors={['#8E44AD', '#A95CF1']}
                    style={styles.buttonGradient}
                >
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
