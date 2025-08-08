/**
 * SignUpScreen.js
 * User registration screen with form validation
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useI18n } from '../i18n/I18nProvider';
import { supabase } from '../lib/supabaseClient';

const SignUpScreen = ({ navigation }) => {
  const { t } = useI18n();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    const { fullName, email, password, confirmPassword } = formData;

    if (!fullName.trim()) {
      Alert.alert(t('common.error'), t('auth.signup.errors.fullName'));
      return false;
    }

    if (!email.trim()) {
      Alert.alert(t('common.error'), t('auth.signup.errors.email'));
      return false;
    }

    if (!email.includes('@') || !email.includes('.')) {
      Alert.alert(t('common.error'), t('auth.signup.errors.emailInvalid'));
      return false;
    }

    if (!password.trim()) {
      Alert.alert(t('common.error'), t('auth.signup.errors.password'));
      return false;
    }

    if (password.length < 6) {
      Alert.alert(t('common.error'), t('auth.signup.errors.passwordShort'));
      return false;
    }

    if (password !== confirmPassword) {
      Alert.alert(t('common.error'), t('auth.signup.errors.passwordMismatch'));
      return false;
    }

    return true;
  };

  const handleSignUp = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: { full_name: formData.fullName },
        emailRedirectTo: 'https://example.com/welcome' // placeholder, adjust for magic link if using
      }
    });
    setIsLoading(false);
    if (error) {
      Alert.alert(t('common.error'), error.message);
      return;
    }
    Alert.alert(
      t('auth.signup.successTitle'),
      t('auth.signup.successBody'),
      [
        {
          text: t('auth.signup.ok'),
          onPress: () => navigation.navigate('Login'),
        },
      ]
    );
  };

  const navigateToLogin = () => {
    navigation.navigate('Login');
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.welcomeText}>{t('auth.signup.createAccount')}</Text>
            <Text style={styles.subText}>{t('auth.signup.subtitle')}</Text>
          </View>

          {/* Sign Up Form Card */}
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>{t('auth.signup.title')}</Text>
            
            {/* Full Name Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>{t('auth.signup.fullName')}</Text>
              <TextInput
                style={styles.textInput}
                placeholder={t('auth.signup.fullNamePlaceholder')}
                placeholderTextColor="#757575"
                value={formData.fullName}
                onChangeText={(value) => updateFormData('fullName', value)}
                autoCapitalize="words"
                autoCorrect={false}
              />
            </View>

            {/* Email Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>{t('auth.signup.emailLabel')}</Text>
              <TextInput
                style={styles.textInput}
                placeholder={t('auth.signup.emailPlaceholder')}
                placeholderTextColor="#757575"
                value={formData.email}
                onChangeText={(value) => updateFormData('email', value)}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>{t('auth.signup.passwordLabel')}</Text>
              <TextInput
                style={styles.textInput}
                placeholder={t('auth.signup.passwordPlaceholder')}
                placeholderTextColor="#757575"
                value={formData.password}
                onChangeText={(value) => updateFormData('password', value)}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>

            {/* Confirm Password Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>{t('auth.signup.confirmPasswordLabel')}</Text>
              <TextInput
                style={styles.textInput}
                placeholder={t('auth.signup.confirmPasswordPlaceholder')}
                placeholderTextColor="#757575"
                value={formData.confirmPassword}
                onChangeText={(value) => updateFormData('confirmPassword', value)}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>

            {/* Terms and Conditions */}
            <View style={styles.termsContainer}>
              <Text style={styles.termsText}>
                {t('auth.signup.terms', { tos: t('auth.signup.tos'), privacy: t('auth.signup.privacy') })}
              </Text>
            </View>

            {/* Sign Up Button */}
            <TouchableOpacity
              style={[styles.signUpButton, isLoading && styles.signUpButtonDisabled]}
              onPress={handleSignUp}
              disabled={isLoading}
            >
              <Text style={styles.signUpButtonText}>
                {isLoading ? t('auth.signup.creatingAccount') : t('auth.signup.createAccountBtn')}
              </Text>
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>{t('auth.signup.divider')}</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Login Link */}
            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>{t('auth.signup.haveAccount')}</Text>
              <TouchableOpacity onPress={navigateToLogin}>
                <Text style={styles.loginLink}>{t('auth.signup.signIn')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F6F8',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0D47A1',
    marginBottom: 8,
    fontFamily: 'Poppins-Bold',
  },
  subText: {
    fontSize: 16,
    color: '#757575',
    textAlign: 'center',
    fontFamily: 'Poppins-Regular',
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 24,
    textAlign: 'center',
    fontFamily: 'Poppins-SemiBold',
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    color: '#212121',
    marginBottom: 8,
    fontFamily: 'Poppins-Regular',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#212121',
    backgroundColor: '#FAFAFA',
    fontFamily: 'Poppins-Regular',
  },
  termsContainer: {
    marginBottom: 24,
  },
  termsText: {
    fontSize: 12,
    color: '#757575',
    textAlign: 'center',
    lineHeight: 18,
    fontFamily: 'Poppins-Regular',
  },
  termsLink: {
    color: '#0D47A1',
    textDecorationLine: 'underline',
  },
  signUpButton: {
    backgroundColor: '#2E7D32',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  signUpButtonDisabled: {
    backgroundColor: '#A5D6A7',
  },
  signUpButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Poppins-SemiBold',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    color: '#757575',
    fontFamily: 'Poppins-Regular',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    fontSize: 14,
    color: '#757575',
    fontFamily: 'Poppins-Regular',
  },
  loginLink: {
    fontSize: 14,
    color: '#0D47A1',
    fontWeight: '600',
    textDecorationLine: 'underline',
    fontFamily: 'Poppins-SemiBold',
  },
});

export default SignUpScreen;