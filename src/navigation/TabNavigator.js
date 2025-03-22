import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// Import screens
import MainScreen from '../screens/main/MainScreen';
import StartWorkout from '../screens/workouts/StartWorkout';
import WorkoutHistoryScreen from '../screens/history/WorkoutHistoryScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';

// Ensure icons are loaded
Icon.loadFont();

const Tab = createBottomTabNavigator();

const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#A95CF1',
        tabBarInactiveTintColor: '#999',
        tabBarShowLabel: true,
        tabBarStyle: {
          height: 60,
          backgroundColor: '#fff',
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          marginBottom: 5,
        },
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Home"
        component={MainScreen}
        options={{
          tabBarIcon: ({ color, size, focused }) => (
            <Icon name="home" color={color} size={28} />
          ),
        }}
      />
      <Tab.Screen
        name="Workouts"
        component={StartWorkout}
        options={{
          tabBarIcon: ({ color, size, focused }) => (
            <Icon name="dumbbell" color={color} size={28} />
          ),
        }}
      />
      <Tab.Screen
        name="History"
        component={WorkoutHistoryScreen}
        options={{
          tabBarIcon: ({ color, size, focused }) => (
            <Icon name="clock-outline" color={color} size={28} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color, size, focused }) => (
            <Icon name="account" color={color} size={28} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export default TabNavigator; 