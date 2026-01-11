import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import SignUpScreen from '../screens/SignUpScreen';
import WorkoutManagementScreen from '../screens/WorkoutManagementScreen';
import SetAvailabilityScreen from '../screens/SetAvailabilityScreen';
import BookSlotsScreen from '../screens/BookSlotsScreen';

const Stack = createStackNavigator();

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="SignUp"
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="SignUp" component={SignUpScreen} />
        <Stack.Screen name="WorkoutManagement" component={WorkoutManagementScreen} />
        <Stack.Screen name="SetAvailability" component={SetAvailabilityScreen} />
        <Stack.Screen name="BookSlots" component={BookSlotsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;

