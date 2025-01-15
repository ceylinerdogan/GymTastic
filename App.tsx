import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import SplashScreen from './src/screens/splash/SplashScreen';
import LoginScreen from './src/screens/login/LoginScreen';
import RegisterScreen from './src/screens/register/RegisterScreen';
import CreateProfileScreen from './src/screens/profile/CreateProfileScreen';
import MainScreen from './src/screens/main/MainScreen';
import WorkoutsScreen from './src/screens/workouts/WorkoutScreen';
import WorkoutHistoryScreen from './src/screens/history/WorkoutHistoryScreen';
import ProfileScreen from './src/screens/profile/ProfileScreen';
import StartWorkout from './src/screens/workouts/StartWorkout';
import WorkoutVideo from './src/screens/workouts/WorkoutVideo';
import PoseFeedback from './src/screens/camera/PoseFeedback';


const Stack = createNativeStackNavigator();

const App = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Splash">
        <Stack.Screen name="Splash" component={SplashScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
        <Stack.Screen name="CreateProfile" component={CreateProfileScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Main" component={MainScreen} options={{ headerShown: false }} />
        <Stack.Screen name="WorkoutsScreen" component={WorkoutsScreen} options={{ title: 'Workouts' }} />
        <Stack.Screen name="WorkoutHistory" component={WorkoutHistoryScreen} options={{ title: 'Workout History' }} />
        <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile' }} />
        <Stack.Screen name="StartWorkout" component={StartWorkout} options={{ title: 'Workout Types' }}/>
        <Stack.Screen name="WorkoutVideo" component={WorkoutVideo} options={{ title: 'Workout Video' }}/>
        <Stack.Screen name="PoseFeedback" component={PoseFeedback} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
