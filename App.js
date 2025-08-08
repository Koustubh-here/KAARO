/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { useEffect } from 'react';
import { StatusBar, StyleSheet, useColorScheme, View } from 'react-native';
import AppNavigator from './navigation/AppNavigator';
import { supabase } from './lib/supabaseClient';
import { AuthProvider } from './context/AuthContext';
import { I18nProvider } from './i18n/I18nProvider';

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  useEffect(() => {
    // Simple connectivity check
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
    <AuthProvider>
      <I18nProvider>
        <View style={styles.container}>
          <StatusBar 
            barStyle={isDarkMode ? 'light-content' : 'dark-content'} 
            backgroundColor="#0D47A1"
          />
          <AppNavigator />
        </View>
      </I18nProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;