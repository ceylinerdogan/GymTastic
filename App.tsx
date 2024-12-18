import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen from './src/screens/login/LoginScreen';
import RegisterScreen from './src/screens/register/RegisterScreen';
import CreateProfileScreen from './src/screens/profile/CreateProfileScreen';
import MainScreen from './src/screens/main/MainScreen';



const Stack = createNativeStackNavigator();

const App = () => {
    return (
        <NavigationContainer>
            <Stack.Navigator initialRouteName="Login">
                <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
                <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
                <Stack.Screen name="CreateProfile" component={CreateProfileScreen} options={{ headerShown: false }} />
                <Stack.Screen name="Main" component={MainScreen} options={{ headerShown: false }} />
            </Stack.Navigator>
        </NavigationContainer>
    );
};

export default App;
