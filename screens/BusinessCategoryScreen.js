/**
 * BusinessCategoryScreen.js
 * Select a business category and basic details before creating a business card
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  StatusBar,
  Platform,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useI18n } from '../i18n/I18nProvider';

const theme = {
  colors: {
    primary: '#4A69E2',
    background: '#F7F8FC',
    surface: '#FFFFFF',
    text: '#121212',
    subtleText: '#6E717A',
    success: '#2E7D32',
    danger: '#C62828',
    warning: '#FFAB00',
    border: '#E8E9F1',
    white: '#FFFFFF',
  },
  spacing: {
    xs: 4, sm: 8, md: 16, lg: 24, xl: 32,
  },
  typography: {
    h1: { fontFamily: 'Poppins-Bold', fontSize: 24, color: '#121212' },
    h2: { fontFamily: 'Poppins-SemiBold', fontSize: 18, color: '#121212' },
    body: { fontFamily: 'Poppins-Regular', fontSize: 16, color: '#6E717A' },
    subtext: { fontFamily: 'Poppins-Regular', fontSize: 14, color: '#6E717A' },
    label: { fontFamily: 'Poppins-Medium', fontSize: 12, color: '#6E717A' },
  },
  borderRadius: { sm: 8, md: 16, lg: 24, full: 999 },
  shadow: {
    shadowColor: '#4A69E2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
};

const CATEGORIES = [
  { key: 'Retail', icon: 'storefront' },
  { key: 'Cafe', icon: 'local-cafe' },
  { key: 'Salon', icon: 'content-cut' },
  { key: 'Grocery', icon: 'local-grocery-store' },
  { key: 'Restaurant', icon: 'restaurant' },
  { key: 'Pharmacy', icon: 'medical-services' },
  { key: 'Electronics', icon: 'devices' },
  { key: 'Services', icon: 'handyman' },
];

const BusinessCategoryScreen = ({ navigation }) => {
  const { t } = useI18n();
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [businessName, setBusinessName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  const handleContinue = () => {
    if (!selectedCategory) {
      Alert.alert(t('businessCategory.alerts.selectCategoryTitle'), t('businessCategory.alerts.selectCategoryBody'));
      return;
    }
    if (!businessName.trim()) {
      Alert.alert(t('businessCategory.alerts.businessNameTitle'), t('businessCategory.alerts.businessNameBody'));
      return;
    }
    navigation.navigate('BusinessCardScreen', {
      category: selectedCategory,
      businessName: businessName.trim(),
      phoneNumber: phoneNumber.trim(),
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <Icon name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('businessCategory.title')}</Text>
        <View style={styles.headerBtn} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: theme.spacing.xl }}>
        {/* Intro */}
        <View style={styles.section}>
          <Text style={theme.typography.h1}>{t('businessCategory.introTitle')}</Text>
          <Text style={[theme.typography.body, { marginTop: theme.spacing.xs }]}>{t('businessCategory.introBody')}</Text>
        </View>

        {/* Category Grid */}
        <View style={styles.section}>
          <Text style={theme.typography.h2}>{t('businessCategory.chooseCategory')}</Text>
          <View style={styles.grid}>
            {CATEGORIES.map((c) => {
              const active = selectedCategory === c.key;
              return (
                <TouchableOpacity
                  key={c.key}
                  style={[styles.card, active && styles.cardActive]}
                  onPress={() => setSelectedCategory(c.key)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.iconWrap, active && { backgroundColor: `${theme.colors.primary}15` }]}>
                    <Icon name={c.icon} size={22} color={active ? theme.colors.primary : theme.colors.subtleText} />
                  </View>
                  <Text style={[styles.cardLabel, active && styles.cardLabelActive]}>{t(`businessCategory.categories.${c.key}`)}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Basic Details */}
        <View style={styles.section}>
          <Text style={theme.typography.h2}>{t('businessCategory.businessDetails')}</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>{t('businessCategory.businessName')}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('businessCategory.businessNamePlaceholder')}
              placeholderTextColor={theme.colors.subtleText}
              value={businessName}
              onChangeText={setBusinessName}
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>{t('businessCategory.phoneOptional')}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('businessCategory.phonePlaceholder')}
              placeholderTextColor={theme.colors.subtleText}
              keyboardType="phone-pad"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
            />
          </View>
        </View>

        {/* Continue */}
        <TouchableOpacity
          style={[styles.primaryButton, !selectedCategory && { opacity: 0.6 }]}
          onPress={handleContinue}
          disabled={!selectedCategory}
        >
          <Text style={styles.primaryButtonText}>{t('businessCategory.continue')}</Text>
          <Icon name="arrow-forward" size={20} color={theme.colors.white} />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: Platform.OS === 'android' ? theme.spacing.lg : theme.spacing.sm,
    paddingBottom: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: 'Poppins-SemiBold', fontSize: 18, color: theme.colors.text },
  section: { paddingHorizontal: theme.spacing.lg, marginTop: theme.spacing.lg },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: theme.spacing.md },
  card: {
    width: '47%',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.md,
    marginRight: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    ...theme.shadow,
  },
  cardActive: { borderColor: theme.colors.primary, backgroundColor: '#FFFFFF' },
  iconWrap: {
    width: 44, height: 44, borderRadius: theme.borderRadius.full,
    alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.background,
  },
  cardLabel: { marginTop: theme.spacing.sm, ...theme.typography.body, color: theme.colors.subtleText, fontFamily: 'Poppins-Medium' },
  cardLabelActive: { color: theme.colors.primary },
  inputGroup: { marginTop: theme.spacing.md },
  inputLabel: { ...theme.typography.label, color: theme.colors.text, marginBottom: theme.spacing.xs, fontFamily: 'Poppins-Medium' },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    ...theme.typography.body,
    color: theme.colors.text,
  },
  primaryButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    marginHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.full,
    ...theme.shadow,
  },
  primaryButtonText: { color: theme.colors.white, fontFamily: 'Poppins-SemiBold', fontSize: 16, marginRight: theme.spacing.sm },
});

export default BusinessCategoryScreen;
