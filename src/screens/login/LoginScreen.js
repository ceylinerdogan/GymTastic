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

const LoginScreen = ({ navigation }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = () => {
        console.log('Email:', email, 'Password:', password);
    };

    return (
        <LinearGradient colors={['#A95CF1', '#DB6FDF']} style={styles.container}>
            {/* Gym-Themed Image */}
            <Image
                source={require('../../../assets/images/gym_icon2.png')}
                style={styles.logo}
            />

            {/* Welcome Text */}
            <Text style={styles.title}>Hey there,</Text>
            <Text style={styles.subtitle}>Welcome Back</Text>

            {/* Input Fields */}
            <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#B8B8B8"
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

            {/* Forgot Password */}
            <TouchableOpacity>
                <Text style={styles.forgotPassword}>Forgot your password?</Text>
            </TouchableOpacity>

            {/* Login Button */}
            <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
                <LinearGradient
                    colors={['#8E44AD', '#A95CF1']}
                    style={styles.buttonGradient}
                >
                    <Text style={styles.buttonText}>Login</Text>
                </LinearGradient>
            </TouchableOpacity>

            {/* Register Navigation */}
            <Text style={styles.registerText}>
                Don't have an account yet?{' '}
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
    },
    subtitle: {
        color: '#fff',
        fontSize: 22,
        marginBottom: 30,
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
    forgotPassword: {
        color: '#fff',
        alignSelf: 'flex-end',
        marginBottom: 20,
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
