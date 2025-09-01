/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { useEffect } from 'react';
import { StatusBar, StyleSheet, View } from 'react-native';
import AppNavigator from './navigation/AppNavigator';
import { supabase } from './lib/supabaseClient';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { I18nProvider } from './i18n/I18nProvider';

const AppContent = () => {
  const { theme, isDark } = useTheme();

  useEffect(() => {
    // Simple connectivity check
    // Skip during Jest tests to avoid logging after teardown
    if (process.env && process.env.JEST_WORKER_ID) return;
    (async () => {
      try {
        const { data, error } = await supabase.from('health_check').select('id').limit(1);
        if (error) {
          // Table may not exist yet; that's fine during initial setup
          console.log('[Supabase] Initialized');
        } else {
          console.log('[Supabase] Health check rows:', data?.length);
        }
      } catch (e) {
        console.log('[Supabase] Init error', e.message);
      }
    })();
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar 
        barStyle={isDark ? 'light-content' : 'dark-content'} 
        backgroundColor={theme.colors.surface}
        translucent={false}
      />
      <AppNavigator />
    </View>
  );
};

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <I18nProvider>
          <AppContent />
        </I18nProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;