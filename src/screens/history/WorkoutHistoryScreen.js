import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';

const WorkoutHistoryScreen = () => {
    const workoutHistory = [
        { id: '1', date: '2024-12-20', activity: 'Squat - 3 Sets • 10 Reps' },
        { id: '2', date: '2024-12-21', activity: 'Plank - Hold for 60s • 3 Sets' },
        { id: '3', date: '2024-12-22', activity: 'Lunge - 3 Sets • 10 Reps' },
    ];

    const renderHistoryItem = ({ item }) => (
        <View style={styles.historyItem}>
            <Text style={styles.historyDate}>{item.date}</Text>
            <Text style={styles.historyActivity}>{item.activity}</Text>
        </View>
    );

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Workout History</Text>
            <FlatList
                data={workoutHistory}
                keyExtractor={(item) => item.id}
                renderItem={renderHistoryItem}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#F5F5F5',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 20,
    },
    historyItem: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 15,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 3,
    },
    historyDate: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#A95CF1',
    },
    historyActivity: {
        fontSize: 14,
        color: '#333',
    },
});

export default WorkoutHistoryScreen;
