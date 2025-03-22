import React from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';

const WorkoutHistoryScreen = ({ navigation }) => {
    const workoutHistory = [
        { id: '1', date: '2024-12-20', activity: 'Squat', details: '3 Sets • 10 Reps' },
        { id: '2', date: '2024-12-21', activity: 'Plank', details: 'Hold for 60s • 3 Sets' },
        { id: '3', date: '2024-12-22', activity: 'Lunge', details: '3 Sets • 10 Reps' },
    ];

    const renderHistoryItem = ({ item }) => (
        <TouchableOpacity style={styles.historyItem}>
            <Text style={styles.historyDate}>{item.date}</Text>
            <Text style={styles.historyActivity}>{item.activity} - {item.details}</Text>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Workout History</Text>
            <FlatList
                data={workoutHistory}
                keyExtractor={(item) => item.id}
                renderItem={renderHistoryItem}
                contentContainerStyle={styles.listContainer}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: '#F5F5F5',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 20,
        marginTop: 10,
    },
    listContainer: {
        paddingBottom: 20,
    },
    historyItem: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 3,
    },
    historyDate: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#A95CF1',
        marginBottom: 8,
    },
    historyActivity: {
        fontSize: 16,
        color: '#333',
    },
});

export default WorkoutHistoryScreen;
