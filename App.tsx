import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import SplashScreen from './src/screens/splash/SplashScreen';
import LoginScreen from './src/screens/login/LoginScreen';
import RegisterScreen from './src/screens/register/RegisterScreen';
import CreateProfileScreen from './src/screens/profile/CreateProfileScreen';
import TabNavigator from './src/navigation/TabNavigator';
import WorkoutVideo from './src/screens/workouts/WorkoutVideo';
import PoseFeedback from './src/screens/camera/PoseFeedback';
import EditProfileScreen from './src/screens/profile/EditProfileScreen';

const Stack = createNativeStackNavigator();

const App = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Splash">
        <Stack.Screen name="Splash" component={SplashScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
        <Stack.Screen name="CreateProfile" component={CreateProfileScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Main" component={TabNavigator} options={{ headerShown: false }} />
        <Stack.Screen name="WorkoutVideo" component={WorkoutVideo} options={{ title: 'Workout Video' }}/>
        <Stack.Screen name="PoseFeedback" component={PoseFeedback} />
        <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ title: 'Edit Profile' }}/>
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
