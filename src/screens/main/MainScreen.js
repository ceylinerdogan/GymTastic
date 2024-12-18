import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

const MainScreen = ({ navigation }) => {
    return (
        <LinearGradient colors={['#A95CF1', '#DB6FDF']} style={styles.container}>
            <Text style={styles.title}>Welcome to GymTastic!</Text>

            <View style={styles.gridContainer}>
                {/* Start Workout */}
                <TouchableOpacity
                    style={styles.card}
                    onPress={() => navigation.navigate('StartWorkout')}
                >
                    <Image source={require('../../../assets/images/gym_icon.png')} style={styles.icon} />
                    <Text style={styles.cardText}>Start Workout</Text>
                </TouchableOpacity>

                {/* Workout History */}
                <TouchableOpacity
                    style={styles.card}
                    onPress={() => navigation.navigate('WorkoutHistory')}
                >
                    <Image source={require('../../../assets/images/gym_icon.png')} style={styles.icon} />
                    <Text style={styles.cardText}>Workout History</Text>
                </TouchableOpacity>

                {/* Profile */}
                <TouchableOpacity
                    style={styles.card}
                    onPress={() => navigation.navigate('Profile')}
                >
                    <Image source={require('../../../assets/images/gym_icon.png')} style={styles.icon} />
                    <Text style={styles.cardText}>My Profile</Text>
                </TouchableOpacity>

                {/* Workout Library */}
                <TouchableOpacity
                    style={styles.card}
                    onPress={() => navigation.navigate('WorkoutLibrary')}
                >
                    <Image source={require('../../../assets/images/gym_icon.png')} style={styles.icon} />
                    <Text style={styles.cardText}>Workout Library</Text>
                </TouchableOpacity>
            </View>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 50,
        paddingHorizontal: 20,
    },
    title: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#fff',
        textAlign: 'center',
        marginBottom: 20,
    },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    card: {
        width: '48%',
        height: 150,
        backgroundColor: '#fff',
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 15,
        elevation: 5,
    },
    icon: {
        width: 60,
        height: 60,
        marginBottom: 10,
    },
    cardText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
});

export default MainScreen;
