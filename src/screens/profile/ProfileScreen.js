import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';

const ProfileScreen = () => {
    const userProfile = {
        name: 'Ecem',
        surname: 'Kaynar',
        email: 'ecem.kaynar@example.com',
        fitnessLevel: 'Intermediate',
        goal: 'Lose Weight',
    };

    return (
        <View style={styles.container}>
            <Image
                source={require('../../../assets/images/profile_pic.jpg')}
                style={styles.profileImage}
            />
            <Text style={styles.name}>
                {userProfile.name} {userProfile.surname}
            </Text>
            <Text style={styles.email}>{userProfile.email}</Text>
            <View style={styles.infoContainer}>
                <Text style={styles.infoLabel}>Fitness Level:</Text>
                <Text style={styles.infoValue}>{userProfile.fitnessLevel}</Text>
            </View>
            <View style={styles.infoContainer}>
                <Text style={styles.infoLabel}>Goal:</Text>
                <Text style={styles.infoValue}>{userProfile.goal}</Text>
            </View>
            <TouchableOpacity style={styles.editButton}>
                <Text style={styles.editButtonText}>Edit Profile</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#F5F5F5',
        alignItems: 'center',
    },
    profileImage: {
        width: 100,
        height: 100,
        borderRadius: 50,
        marginBottom: 20,
    },
    name: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
    },
    email: {
        fontSize: 14,
        color: '#666',
        marginBottom: 20,
    },
    infoContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '80%',
        marginVertical: 10,
    },
    infoLabel: {
        fontSize: 16,
        color: '#666',
    },
    infoValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    editButton: {
        marginTop: 20,
        backgroundColor: '#A95CF1',
        paddingVertical: 10,
        paddingHorizontal: 40,
        borderRadius: 20,
    },
    editButtonText: {
        fontSize: 16,
        color: '#fff',
        fontWeight: 'bold',
    },
});

export default ProfileScreen;
