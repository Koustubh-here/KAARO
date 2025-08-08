/**
 * CRMScreen.js
 * A powerful yet intuitive screen for Customer Relationship Management.
 * Allows viewing customer details and launching targeted marketing campaigns.
 * Adheres to the KAARO design system for a cohesive app experience.
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  FlatList,
  StatusBar,
  Platform,
  Modal,
  ScrollView,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useI18n } from '../i18n/I18nProvider';

// THEME & DESIGN SYSTEM (Consistent with other screens)
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
    h1: { fontFamily: 'Poppins-Bold', fontSize: 28, color: '#121212' },
    h2: { fontFamily: 'Poppins-SemiBold', fontSize: 20, color: '#121212' },
    body: { fontFamily: 'Poppins-Regular', fontSize: 16, color: '#6E717A' },
    subtext: { fontFamily: 'Poppins-Regular', fontSize: 14, color: '#6E717A' },
    label: { fontFamily: 'Poppins-Medium', fontSize: 12, color: '#6E717A' },
  },
  borderRadius: { sm: 8, md: 16, lg: 24, full: 999 },
  shadow: {
    shadowColor: '#4A69E2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
};

// MOCK DATA
const ALL_CUSTOMERS = [
  { id: '1', name: 'Rohan Sharma', lastPurchase: '2025-08-05', totalSpend: 12500, phone: '9876543210', email: 'rohan.s@example.com' },
  { id: '2', name: 'Priya Patel', lastPurchase: '2025-08-04', totalSpend: 8200, phone: '9876543211', email: 'priya.p@example.com' },
  { id: '3', name: 'Amit Singh', lastPurchase: '2025-08-01', totalSpend: 25000, phone: '9876543212', email: 'amit.s@example.com' },
  { id: '4', name: 'Sneha Reddy', lastPurchase: '2025-07-28', totalSpend: 5500, phone: '9876543213', email: 'sneha.r@example.com' },
  { id: '5', name: 'Vikram Kumar', lastPurchase: '2025-07-25', totalSpend: 18000, phone: '9876543214', email: 'vikram.k@example.com' },
  { id: '6', name: 'Anjali Desai', lastPurchase: '2025-07-19', totalSpend: 9800, phone: '9876543215', email: 'anjali.d@example.com' },
];

const CAMPAIGN_CHANNELS = [
  { key: 'sms', name: 'SMS', icon: 'sms' },
  { key: 'email', name: 'Email', icon: 'email' },
  { key: 'whatsapp', name: 'message', icon: 'message' }, // Using message icon for whatsapp
];

const CRMScreen = ({ navigation }) => {
  const { t } = useI18n();
  const [searchQuery, setSearchQuery] = useState('');
  const [isCampaignModalVisible, setCampaignModalVisible] = useState(false);

  // Campaign State
  const [campaignChannel, setCampaignChannel] = useState('sms');
  const [campaignAudience, setCampaignAudience] = useState('all');
  const [campaignMessage, setCampaignMessage] = useState('');

  const filteredCustomers = useMemo(() => {
    if (!searchQuery) return ALL_CUSTOMERS;
    const lowercasedQuery = searchQuery.toLowerCase();
    return ALL_CUSTOMERS.filter(c => c.name.toLowerCase().includes(lowercasedQuery));
  }, [searchQuery]);

  const handleStartCampaign = () => {
    if (!campaignMessage.trim()) {
      Alert.alert(t('common.error'), t('crm.alerts.enterMessage'));
      return;
    }

    // Logic to send campaign would go here
    console.log({
        channel: campaignChannel,
        audience: campaignAudience,
        message: campaignMessage,
    });
    
    setCampaignModalVisible(false);
    Alert.alert(
      t('crm.alerts.sentTitle'),
      t('crm.alerts.sentBody', { channel: campaignChannel, audience: campaignAudience === 'all' ? t('crm.modal.audienceAll') : t('crm.modal.audienceSpecific') }),
      [{ text: t('crm.alerts.ok') }]
    );
    
    // Reset state for next time
    setCampaignMessage('');
  };

  const renderCustomerItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.customerItem} 
      onPress={() => {
        Alert.alert(
          item.name,
          t('crm.alerts.customerDetails', { phone: item.phone, email: item.email, spend: item.totalSpend.toLocaleString('en-IN'), lastPurchase: item.lastPurchase }),
          [
            { text: t('crm.alerts.callCustomer'), onPress: () => Alert.alert(t('productDetails.featureComingSoon'), '') },
            { text: t('crm.alerts.sendMessage'), onPress: () => Alert.alert(t('productDetails.featureComingSoon'), '') },
            { text: t('crm.alerts.cancel'), style: 'cancel' }
          ]
        );
      }}
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{item.name.charAt(0)}</Text>
      </View>
      <View style={styles.customerInfo}>
        <Text style={styles.customerName}>{item.name}</Text>
        <Text style={styles.customerDetails}>
          Last Purchase: {item.lastPurchase} • Total Spend: ₹{item.totalSpend.toLocaleString('en-IN')}
        </Text>
      </View>
      <Icon name="chevron-right" size={24} color={theme.colors.subtleText} />
    </TouchableOpacity>
  );

  const renderCampaignModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isCampaignModalVisible}
      onRequestClose={() => setCampaignModalVisible(false)}
    >
      <View style={styles.modalBackdrop}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t('crm.modal.title')}</Text>
            <TouchableOpacity onPress={() => setCampaignModalVisible(false)}>
              <Icon name="close" size={24} color={theme.colors.subtleText} />
            </TouchableOpacity>
          </View>
          
          <ScrollView>
             {/* Channel Selection */}
            <Text style={styles.modalSectionTitle}>{t('crm.modal.step1')}</Text>
            <View style={styles.optionGroup}>
                {CAMPAIGN_CHANNELS.map(channel => (
                    <TouchableOpacity key={channel.key} style={[styles.optionButton, campaignChannel === channel.key && styles.optionButtonActive]} onPress={() => setCampaignChannel(channel.key)}>
                        <Icon name={channel.icon} size={20} color={campaignChannel === channel.key ? theme.colors.primary : theme.colors.subtleText} />
                        <Text style={[styles.optionButtonText, campaignChannel === channel.key && styles.optionButtonTextActive]}>{t(`crm.modal.channels.${channel.key}`)}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Audience Selection */}
            <Text style={styles.modalSectionTitle}>{t('crm.modal.step2')}</Text>
            <View style={styles.optionGroup}>
                <TouchableOpacity style={[styles.optionButton, campaignAudience === 'all' && styles.optionButtonActive]} onPress={() => setCampaignAudience('all')}>
                    <Text style={[styles.optionButtonText, campaignAudience === 'all' && styles.optionButtonTextActive]}>{t('crm.modal.audienceAll')}</Text>
                </TouchableOpacity>
                 <TouchableOpacity style={[styles.optionButton, campaignAudience === 'specific' && styles.optionButtonActive]} onPress={() => setCampaignAudience('specific')}>
                    <Text style={[styles.optionButtonText, campaignAudience === 'specific' && styles.optionButtonTextActive]}>{t('crm.modal.audienceSpecific')}</Text>
                </TouchableOpacity>
            </View>

            {/* Message Input */}
            <Text style={styles.modalSectionTitle}>{t('crm.modal.step3')}</Text>
            <TextInput
                style={styles.messageInput}
                placeholder={t('crm.modal.messagePlaceholder', { channel: campaignChannel })}
                placeholderTextColor={theme.colors.subtleText}
                multiline
                value={campaignMessage}
                onChangeText={setCampaignMessage}
            />
            <View style={styles.templateContainer}>
                <Text style={styles.templateText}>{t('crm.modal.useTemplate')} </Text>
                <TouchableOpacity onPress={() => setCampaignMessage('🌟 Diwali Offer! Get 20% off on all items. Use code DIWALI20. Valid till this weekend!')}>
                    <Text style={styles.templateLink}>{t('crm.modal.templateDiwali')}</Text>
                </TouchableOpacity>
            </View>
          </ScrollView>

          <TouchableOpacity style={[styles.primaryButton, !campaignMessage && {opacity: 0.5}]} onPress={handleStartCampaign} disabled={!campaignMessage}>
            <Text style={styles.primaryButtonText}>{t('crm.modal.sendCampaign')}</Text>
            <Icon name="send" size={20} color={theme.colors.white} />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />
      {renderCampaignModal()}

      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Icon name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={theme.typography.h1}>{t('crm.title')}</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.searchContainer}>
        <Icon name="search" size={24} color={theme.colors.subtleText} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder={t('crm.searchPlaceholder')}
          placeholderTextColor={theme.colors.subtleText}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <TouchableOpacity style={styles.primaryButton} onPress={() => setCampaignModalVisible(true)}>
        <Text style={styles.primaryButtonText}>{t('crm.startCampaign')}</Text>
        <Icon name="campaign" size={24} color={theme.colors.white} />
      </TouchableOpacity>

      <View style={styles.customerListContainer}>
        <FlatList
          data={filteredCustomers}
          renderItem={renderCustomerItem}
          keyExtractor={item => item.id}
          contentContainerStyle={{ paddingBottom: theme.spacing.xl }}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: Platform.OS === 'android' ? theme.spacing.lg : theme.spacing.sm,
    paddingBottom: theme.spacing.md,
  },
  backButton: {
    padding: theme.spacing.sm,
    marginLeft: -theme.spacing.sm,
  },
  placeholder: {
    width: 32,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.full,
    marginHorizontal: theme.spacing.lg,
    paddingHorizontal: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  searchIcon: {
    marginRight: theme.spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...theme.typography.body,
    color: theme.colors.text,
    height: 50,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    margin: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.full,
    ...theme.shadow,
  },
  primaryButtonText: {
    ...theme.typography.body,
    fontFamily: 'Poppins-SemiBold',
    color: theme.colors.white,
    marginRight: theme.spacing.sm,
  },
  customerListContainer: {
    flex: 1,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  customerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.full,
    backgroundColor: `${theme.colors.primary}20`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: theme.colors.primary,
    fontSize: 18,
    fontFamily: 'Poppins-Bold',
  },
  customerInfo: {
    flex: 1,
    marginLeft: theme.spacing.md,
  },
  customerName: {
    ...theme.typography.body,
    fontFamily: 'Poppins-Medium',
    color: theme.colors.text,
  },
  customerDetails: {
    ...theme.typography.subtext,
    fontSize: 12,
  },
  // Modal Styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: theme.colors.surface,
    height: '85%',
    borderTopLeftRadius: theme.borderRadius.lg,
    borderTopRightRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  modalTitle: {
    ...theme.typography.h2,
  },
  modalSectionTitle: {
    ...theme.typography.label,
    fontFamily: 'Poppins-SemiBold',
    color: theme.colors.text,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  optionGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.full,
    marginRight: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  optionButtonActive: {
    backgroundColor: `${theme.colors.primary}20`,
    borderColor: theme.colors.primary,
  },
  optionButtonText: {
    ...theme.typography.subtext,
    color: theme.colors.subtleText,
    fontFamily: 'Poppins-Medium',
    marginLeft: theme.spacing.xs,
  },
  optionButtonTextActive: {
    color: theme.colors.primary,
  },
  messageInput: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    height: 150,
    textAlignVertical: 'top',
    ...theme.typography.body,
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  templateContainer: {
      flexDirection: 'row',
      marginTop: theme.spacing.sm,
  },
  templateText: {
      ...theme.typography.subtext,
  },
  templateLink: {
      ...theme.typography.subtext,
      fontFamily: 'Poppins-SemiBold',
      color: theme.colors.primary,
      textDecorationLine: 'underline',
  },
});

export default CRMScreen;