/**
 * LanguageSelectScreen.js
 * Language selection screen with Indian languages
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  StatusBar,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const { width, height } = Dimensions.get('window');

const LanguageSelectScreen = ({ navigation }) => {
  const [selectedLanguage, setSelectedLanguage] = useState('English');

  const languages = [
    { name: 'English', code: 'en' },
    { name: 'Hindi', code: 'hi' },
    { name: 'Bengali', code: 'bn' },
    { name: 'Telugu', code: 'te' },
    { name: 'Marathi', code: 'mr' },
    { name: 'Tamil', code: 'ta' },
    { name: 'Gujarati', code: 'gu' },
    { name: 'Urdu', code: 'ur' },
    { name: 'Kannada', code: 'kn' },
    { name: 'Odia', code: 'or' },
    { name: 'Punjabi', code: 'pa' },
    { name: 'Assamese', code: 'as' },
    { name: 'Maithili', code: 'mai' },
    { name: 'Malayalam', code: 'ml' },
  ];

  const handleLanguageSelect = (language) => {
    setSelectedLanguage(language.name);
  };

  const handleContinue = () => {
    // You can store the selected language in AsyncStorage or Redux here
    // For now, we'll just navigate to the Login screen
    navigation.replace('Login');
  };

  const renderLanguageItem = (language) => {
    const isSelected = selectedLanguage === language.name;
    
    return (
      <TouchableOpacity
        key={language.code}
        style={[
          styles.languageItem,
          isSelected && styles.selectedLanguageItem
        ]}
        onPress={() => handleLanguageSelect(language)}
        activeOpacity={0.7}
      >
        <Text style={[
          styles.languageText,
          isSelected && styles.selectedLanguageText
        ]}>
          {language.name}
        </Text>
        <View style={[
          styles.radioButton,
          isSelected && styles.selectedRadioButton
        ]}>
          {isSelected && (
            <View style={styles.radioButtonInner} />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#0D47A1" barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color="#0D47A1" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Language</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.subtitle}>Select your preferred language</Text>
        
        <ScrollView 
          style={styles.languageList}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {languages.map(renderLanguageItem)}
        </ScrollView>
      </View>

      {/* Continue Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.continueButton}
          onPress={handleContinue}
          activeOpacity={0.8}
        >
          <Text style={styles.continueButtonText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 30,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212121',
    fontFamily: 'Poppins-SemiBold',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  subtitle: {
    fontSize: 16,
    color: '#757575',
    marginBottom: 32,
    fontFamily: 'Poppins-Regular',
  },
  languageList: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  languageItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 12,
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  selectedLanguageItem: {
    backgroundColor: '#E3F2FD',
    borderColor: '#2196F3',
    borderWidth: 2,
  },
  languageText: {
    fontSize: 16,
    color: '#424242',
    fontFamily: 'Poppins-Medium',
  },
  selectedLanguageText: {
    color: '#1976D2',
    fontWeight: '600',
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#BDBDBD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedRadioButton: {
    borderColor: '#2196F3',
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#2196F3',
  },
  footer: {
    paddingHorizontal: 24,
    paddingVertical: 24,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  continueButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Poppins-SemiBold',
  },
});

export default LanguageSelectScreen;