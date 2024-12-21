import React, {useEffect} from 'react';
import {View, Text, StyleSheet, Image} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

const SplashScreen = ({navigation}) => {
  // Automatically navigate to LoginScreen after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.replace('Login'); // Navigate to LoginScreen
    }, 3000); // 3 seconds delay

    return () => clearTimeout(timer); // Clean up timer
  }, [navigation]);

  return (
    <LinearGradient colors={['#A95CF1', '#DB6FDF']} style={styles.container}>
      <Image
        source={require('../../../assets/images/gym.jpg')} // Add your app logo here
        style={styles.logo}
      />
      <Text style={styles.appName}>GYM-Tastic</Text>
      <Text style={styles.tagline}>Everybody Can Train</Text>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 150,
    height: 150,
    marginBottom: 20,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  tagline: {
    fontSize: 16,
    color: '#fff',
    fontStyle: 'italic',
  },
});

export default SplashScreen;
