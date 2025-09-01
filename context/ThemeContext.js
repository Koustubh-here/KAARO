import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const lightTheme = {
    dark: false, // Add a flag to easily check the theme type
    colors: {
        primary: '#4A69E2',
        background: '#F7F8FC',
        surface: '#FFFFFF',
        text: '#121212',
        subtleText: '#6E717A',
        border: '#E8E9F1',
        white: '#FFFFFF',
        black: '#000000',
        success: '#2E7D32',
        warning: '#FFAB00',
        danger: '#C62828', 
    },
    spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
    typography: {
        h1: { fontFamily: 'Poppins-Bold', fontSize: 24 },
        h2: { fontFamily: 'Poppins-SemiBold', fontSize: 20 },
        h3: { fontFamily: 'Poppins-SemiBold', fontSize: 18 },
        body: { fontFamily: 'Poppins-Regular', fontSize: 16 },
        caption: { fontFamily: 'Poppins-Regular', fontSize: 14 },
    },
    borderRadius: { sm: 8, md: 16, lg: 24 },
};

const darkTheme = {
    ...lightTheme,
    dark: true, // Add a flag to easily check the theme type
    colors: {
        ...lightTheme.colors, // Inherit all colors first
        primary: '#5A7EF2',
        background: '#121212',
        surface: '#1E1E1E',
        text: '#FFFFFF',
        subtleText: '#B0B3B8',
        border: '#333333',
        danger: '#FF6B6B', // CHANGED: A much brighter red for dark mode visibility
    },
};

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    const systemColorScheme = useColorScheme();
    const [themeMode, setThemeModeState] = useState('system');
    
    // This logic is now simpler and more direct
    const effectiveTheme = themeMode === 'system' 
        ? (systemColorScheme === 'dark' ? darkTheme : lightTheme)
        : (themeMode === 'dark' ? darkTheme : lightTheme);

    const setThemeMode = async (mode) => {
        setThemeModeState(mode);
        try {
            await AsyncStorage.setItem('@theme_mode', mode);
        } catch (error) {
            console.error('Error saving theme mode:', error);
        }
    };

    useEffect(() => {
        const loadThemeMode = async () => {
            try {
                const savedMode = await AsyncStorage.getItem('@theme_mode');
                if (savedMode) {
                    setThemeModeState(savedMode);
                }
            } catch (error) {
                console.error('Error loading theme mode:', error);
            }
        };
        loadThemeMode();
    }, []);

    const value = { 
        theme: effectiveTheme, 
        themeMode, 
        setThemeMode,
        isDark: effectiveTheme.dark // Use the new flag
    };

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};