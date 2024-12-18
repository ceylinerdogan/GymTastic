import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Image,
    StyleSheet,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

const RegisterScreen = ({ navigation }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const handleRegister = () => {
        if (password === confirmPassword) {
            console.log('Registering Email:', email, 'Password:', password);
        } else {
            alert('Passwords do not match!');
        }
    };

    return (
        <LinearGradient colors={['#A95CF1', '#DB6FDF']} style={styles.container}>
            {/* Gym-Themed Image */}
            <Image
                source={require('../../../assets/images/gym_icon2.png')}
                style={styles.logo}
            />

            {/* Welcome Text */}
            <Text style={styles.title}>Let’s Get Started!</Text>
            <Text style={styles.subtitle}>Create your account</Text>

            {/* Input Fields */}
            <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#B8B8B8"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
            />
            <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#B8B8B8"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
            />
            <TextInput
                style={styles.input}
                placeholder="Confirm Password"
                placeholderTextColor="#B8B8B8"
                secureTextEntry
                value={confirmPassword}
                onChangeText={setConfirmPassword}
            />

            {/* Register Button */}
            <TouchableOpacity style={styles.registerButton} onPress={handleRegister}>
                <LinearGradient
                    colors={['#8E44AD', '#A95CF1']}
                    style={styles.buttonGradient}
                >
                    <Text style={styles.buttonText}>Register</Text>
                </LinearGradient>
            </TouchableOpacity>

            {/* Back to Login */}
            <Text style={styles.loginText}>
                Already have an account?{' '}
                <Text
                    style={{ fontWeight: 'bold', color: '#A95CF1' }}
                    onPress={() => navigation.navigate('Login')}
                >
                    Login
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
    },
    subtitle: {
        color: '#fff',
        fontSize: 20,
        marginBottom: 20,
    },
    input: {
        width: '100%',
        height: 50,
        backgroundColor: '#fff',
        borderRadius: 25,
        paddingLeft: 20,
        marginBottom: 15,
        fontSize: 16,
    },
    registerButton: {
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
    loginText: {
        color: '#fff',
        fontSize: 14,
        marginTop: 10,
    },
});

export default RegisterScreen;
