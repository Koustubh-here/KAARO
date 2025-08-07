/**
 * AppNavigator.js
 * Main navigation setup for the application
 */
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Import screens
import SplashScreen from '../screens/SplashScreen';
import LanguageSelectScreen from '../screens/LanguageSelectScreen';
import LoginScreen from '../screens/LoginScreen';
import SignUpScreen from '../screens/SignUpScreen';
import BusinessCategoryScreen from '../screens/BusinessCategoryScreen';
import BusinessCardScreen from '../screens/BusinessCardScreen.js';
import Home from '../screens/Home.js';
import InventoryScreen from '../screens/InventoryScreen.js';
import LedgerScreen from '../screens/LedgerScreen.js';
import CRMScreen from '../screens/CRMScreen.js';
import ReportsScreen from '../screens/ReportsScreen.js';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#F4F6F8' },
          animation: 'slide_from_right',
          animationDuration: 300,
        }}
      >
        {/* Splash Screen - Entry point */}
        <Stack.Screen 
          name="Splash" 
          component={SplashScreen}
          options={{
            contentStyle: { backgroundColor: '#0D47A1' },
          }}
        />
        
        {/* Language Selection Screen */}
        <Stack.Screen 
          name="LanguageSelect" 
          component={LanguageSelectScreen}
          options={{
            contentStyle: { backgroundColor: '#FFFFFF' },
            gestureEnabled: true,
          }}
        />
        
        {/* Authentication Screens */}
        <Stack.Screen 
          name="Login" 
          component={LoginScreen}
          options={{
            gestureEnabled: false, // Prevent swipe back from login
          }}
        />
        
        <Stack.Screen 
          name="SignUp" 
          component={SignUpScreen}
          options={{
            gestureEnabled: true,
          }}
        />
        <Stack.Screen 
          name="BusinessCardScreen" 
          component={BusinessCardScreen}
          options={{
            gestureEnabled: true,
          }}
        />

        <Stack.Screen 
          name="BusinessCategoryScreen" 
          component={BusinessCategoryScreen}
          options={{
            gestureEnabled: true,
          }}
        />

        <Stack.Screen 
          name="Home" 
          component={Home}
          options={{
            gestureEnabled: true,
          }}
        />

        <Stack.Screen 
          name="InventoryScreen" 
          component={InventoryScreen}
          options={{
            gestureEnabled: true,
          }}
        />

        <Stack.Screen 
          name="LedgerScreen" 
          component={LedgerScreen}
          options={{
            gestureEnabled: true,
          }}
        />
        <Stack.Screen 
          name="CRMScreen" 
          component={CRMScreen}
          options={{
            gestureEnabled: true,
          }}
        />

        <Stack.Screen 
          name="ReportsScreen" 
          component={ReportsScreen}
          options={{
            gestureEnabled: true,
          }}
        />


      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;