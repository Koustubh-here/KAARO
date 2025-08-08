/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React from 'react';
import { StatusBar, StyleSheet, useColorScheme, View } from 'react-native';
import AppNavigator from './navigation/AppNavigator';
import { I18nProvider } from './i18n/I18nProvider';

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <I18nProvider>
      <View style={styles.container}>
        <StatusBar 
          barStyle={isDarkMode ? 'light-content' : 'dark-content'} 
          backgroundColor="#0D47A1"
        />
        <AppNavigator />
      </View>
    </I18nProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;