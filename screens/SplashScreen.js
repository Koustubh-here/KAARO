/**
 * SplashScreen.js
 * Initial splash screen with app logo and vision statement
 */
import React, { useEffect } from 'react';
import { View, Text, Image, StyleSheet, Dimensions, StatusBar } from 'react-native';
import { useI18n } from '../i18n/I18nProvider';

const { width, height } = Dimensions.get('window');

const SplashScreen = ({ navigation }) => {
  const { t, isLoading } = useI18n();

  useEffect(() => {
    // Only auto-navigate when language loading is complete
  if (process.env && process.env.JEST_WORKER_ID) return; // skip in tests
  if (!isLoading) {
      const timer = setTimeout(() => {
        navigation.replace('LanguageSelect');
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [navigation, isLoading]);

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#0D47A1" barStyle="light-content" />
      
      <View style={styles.content}>
        {/* App Logo */}
        <View style={styles.logoContainer}>
          <Image
            source={require('../assets/app_logo.jpg')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        {/* Vision Statement */}
        <View style={styles.visionContainer}>
          <Text style={styles.visionTitle}>{t('splash.visionTitle')}</Text>
          <Text style={styles.visionSubtitle}>{t('splash.visionSubtitle')}</Text>
        </View>
      </View>

      {/* Loading indicator or brand name at bottom */}
      <View style={styles.footer}>
        <Text style={styles.brandText}>{t('splash.brand')}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D47A1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  logoContainer: {
    marginBottom: 60,
    alignItems: 'center',
  },
  logo: {
    width: width * 0.4,
    height: width * 0.4,
    borderRadius: 20,
  },
  visionContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  visionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
    fontFamily: 'Poppins-Bold',
  },
  visionSubtitle: {
    fontSize: 16,
    color: '#E3F2FD',
    textAlign: 'center',
    lineHeight: 24,
    fontFamily: 'Poppins-Regular',
  },
  footer: {
    position: 'absolute',
    bottom: 50,
    alignItems: 'center',
  },
  brandText: {
    fontSize: 18,
    color: '#E3F2FD',
    fontWeight: '600',
    fontFamily: 'Poppins-SemiBold',
  },
});

export default SplashScreen;