import React, { createContext, useContext, useMemo, useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { translations } from './translations';

const I18nContext = createContext({
  language: 'en',
  setLanguage: (lang) => {},
  t: (key, params) => key,
  isLoading: true,
});

const LANGUAGE_STORAGE_KEY = '@app_language';

function getNested(obj, path) {
  return path.split('.').reduce((acc, part) => (acc && acc[part] !== undefined ? acc[part] : undefined), obj);
}

function interpolate(template, params = {}) {
  if (typeof template !== 'string') return template;
  return template.replace(/\{\{(.*?)\}\}/g, (_, p1) => {
    const key = p1.trim();
    return params[key] !== undefined ? String(params[key]) : `{{${key}}}`;
  });
}

export const I18nProvider = ({ children }) => {
  const [language, setLanguageState] = useState('en');
  const [isLoading, setIsLoading] = useState(true);

  // Load saved language on app start
  useEffect(() => {
    const loadSavedLanguage = async () => {
      try {
        const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
        if (savedLanguage && translations[savedLanguage]) {
          setLanguageState(savedLanguage);
        }
      } catch (error) {
        console.log('Error loading saved language:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSavedLanguage();
  }, []);

  const setLanguage = useCallback(async (langCode) => {
    const validLangCode = translations[langCode] ? langCode : 'en';
    setLanguageState(validLangCode);
    
    try {
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, validLangCode);
    } catch (error) {
      console.log('Error saving language:', error);
    }
  }, []);

  const t = useCallback(
    (key, params = {}) => {
      const localePack = translations[language] || translations.en;
      const value = getNested(localePack, key);
      if (value === undefined) {
        // Fallback to English if key not present
        const fallback = getNested(translations.en, key);
        return typeof fallback === 'string' ? interpolate(fallback, params) : fallback ?? key;
      }
      if (typeof value === 'string') {
        return interpolate(value, params);
      }
      return value;
    },
    [language]
  );

  const value = useMemo(() => ({ 
    language, 
    setLanguage, 
    t, 
    isLoading 
  }), [language, setLanguage, t, isLoading]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export const useI18n = () => useContext(I18nContext);


