/**
 * AppNavigator.js
 * Main navigation setup for the application
 */
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useI18n } from '../i18n/I18nProvider';
import { useAuth } from '../context/AuthContext';

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
import MemoryScreen from '../screens/MemoryScreen.js';
import ChatHistoryScreen from '../screens/ChatHistoryScreen.js';
import ProfileScreen from '../screens/ProfileScreen.js';
import AddTransactionScreen from '../screens/AddTransactionScreen.js';
import ProductDetailsScreen from '../screens/ProductDetailsScreen.js';
import AddProductScreen from '../screens/AddProductScreen.js';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  const { language } = useI18n();
  const { user, initializing } = useAuth();
  return (
    <NavigationContainer key={language}>
      <Stack.Navigator
        initialRouteName={user ? 'Home' : 'Splash'}
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#F4F6F8' },
          animation: 'slide_from_right',
          animationDuration: 300,
        }}
      >
        {initializing ? (
          <Stack.Screen 
            name="Splash" 
            component={SplashScreen}
            options={{ contentStyle: { backgroundColor: '#0D47A1' } }}
          />
        ) : !user ? (
          <>
            <Stack.Screen 
              name="Splash" 
              component={SplashScreen}
              options={{ contentStyle: { backgroundColor: '#0D47A1' } }}
            />
            <Stack.Screen 
              name="LanguageSelect" 
              component={LanguageSelectScreen}
              options={{ contentStyle: { backgroundColor: '#FFFFFF' }, gestureEnabled: true }}
            />
            <Stack.Screen 
              name="Login" 
              component={LoginScreen}
              options={{ gestureEnabled: false }}
            />
            <Stack.Screen 
              name="SignUp" 
              component={SignUpScreen}
              options={{ gestureEnabled: true }}
            />
            <Stack.Screen 
              name="BusinessCategoryScreen" 
              component={BusinessCategoryScreen}
              options={{ gestureEnabled: true }}
            />
            <Stack.Screen 
              name="BusinessCardScreen" 
              component={BusinessCardScreen}
              options={{ gestureEnabled: true }}
            />
          </>
        ) : (
          <>
            <Stack.Screen 
              name="Home" 
              component={Home}
              options={{ gestureEnabled: true }}
            />
            <Stack.Screen 
              name="InventoryScreen" 
              component={InventoryScreen}
              options={{ gestureEnabled: true }}
            />
            <Stack.Screen 
              name="LedgerScreen" 
              component={LedgerScreen}
              options={{ gestureEnabled: true }}
            />
            <Stack.Screen 
              name="CRMScreen" 
              component={CRMScreen}
              options={{ gestureEnabled: true }}
            />
            <Stack.Screen 
              name="ReportsScreen" 
              component={ReportsScreen}
              options={{ gestureEnabled: true }}
            />
            <Stack.Screen 
              name="ProfileScreen" 
              component={ProfileScreen}
              options={{ gestureEnabled: true }}
            />
            <Stack.Screen 
              name="MemoryScreen" 
              component={MemoryScreen}
              options={{ gestureEnabled: true }}
            />
            <Stack.Screen 
              name="ChatHistoryScreen" 
              component={ChatHistoryScreen}
              options={{ gestureEnabled: true }}
            />
            <Stack.Screen 
              name="AddTransactionScreen" 
              component={AddTransactionScreen}
              options={{ gestureEnabled: true }}
            />
            <Stack.Screen 
              name="ProductDetailsScreen" 
              component={ProductDetailsScreen}
              options={{ gestureEnabled: true }}
            />
            <Stack.Screen 
              name="AddProductScreen" 
              component={AddProductScreen}
              options={{ gestureEnabled: true }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;