/**
 * CRMScreen.js
 * A powerful yet intuitive screen for Customer Relationship Management.
 * Allows viewing customer details and launching targeted marketing campaigns.
 * Adheres to the KAARO design system for a cohesive app experience.
 */

import React, { useState, useMemo, useEffect } from 'react';
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
  ActivityIndicator,
  Linking,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useI18n } from '../i18n/I18nProvider';
import { supabase } from '../lib/supabaseClient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../context/ThemeContext'; // ADDED

const CAMPAIGN_CHANNELS = [
  { key: 'sms', name: 'SMS', icon: 'sms' },
  { key: 'email', name: 'Email', icon: 'email' },
  { key: 'whatsapp', name: 'WhatsApp', icon: 'message' },
];

const CRMScreen = ({ navigation }) => {
  const { theme } = useTheme(); // ADDED
  const { t } = useI18n();
  const [searchQuery, setSearchQuery] = useState('');
  const [isCampaignModalVisible, setCampaignModalVisible] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [businessId, setBusinessId] = useState(null);
  const [sendingCampaign, setSendingCampaign] = useState(false);
  const [selectedTab, setSelectedTab] = useState('CRM');

  // Campaign State
  const [campaignChannel, setCampaignChannel] = useState('sms');
  const [campaignAudience, setCampaignAudience] = useState('all');
  const [campaignMessage, setCampaignMessage] = useState('');

  // Get business ID and load customers
  useEffect(() => {
    loadBusinessData();
  }, []);

  const loadBusinessData = async () => {
    try {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Error', 'Please log in to access CRM');
        navigation.goBack();
        return;
      }

      const { data: business, error: businessError } = await supabase
        .from('businesses')
        .select('id')
        .eq('owner_user', user.id)
        .single();

      if (businessError || !business) {
        Alert.alert('Error', 'No business found. Please set up your business first.');
        navigation.goBack();
        return;
      }

      setBusinessId(business.id);

      await loadCustomers(business.id);
    } catch (error) {
      console.error('Error loading business data:', error);
      Alert.alert('Error', 'Failed to load business data');
    } finally {
      setLoading(false);
    }
  };

  const loadCustomers = async (bizId) => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('business_id', bizId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error('Error loading customers:', error);
      Alert.alert('Error', 'Failed to load customers');
    }
  };

  const filteredCustomers = useMemo(() => {
    if (!searchQuery) return customers;
    const lowercasedQuery = searchQuery.toLowerCase();
    return customers.filter(c =>
      c.name.toLowerCase().includes(lowercasedQuery) ||
      (c.phone && c.phone.includes(searchQuery)) ||
      (c.email && c.email.toLowerCase().includes(lowercasedQuery))
    );
  }, [searchQuery, customers]);

  const sendSMS = async (phone, message) => {
    try {
      const url = `sms:${phone}?body=${encodeURIComponent(message)}`;
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
        return true;
      } else {
        throw new Error('SMS not supported on this device');
      }
    } catch (error) {
      console.error('SMS Error:', error);
      return false;
    }
  };

  const sendBulkEmail = async (emails, message, subject = 'Campaign Message') => {
    try {
      const emailList = emails.join(',');
      const url = `mailto:?bcc=${encodeURIComponent(emailList)}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
      await Linking.openURL(url);
      return true;
    } catch (error) {
      console.error('Email Error:', error);
      try {
        const emailList = emails.join(',');
        const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&bcc=${encodeURIComponent(emailList)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
        await Linking.openURL(gmailUrl);
        return true;
      } catch (gmailError) {
        console.error('Gmail fallback failed:', gmailError);
        Alert.alert(
          'Email Setup Required',
          'Please set up an email app on your device or use the web browser to send emails.',
          [{ text: 'OK' }]
        );
        return false;
      }
    }
  };

  const sendEmail = async (email, message, subject = 'Campaign Message') => {
    return sendBulkEmail([email], message, subject);
  };

  const sendWhatsApp = async (phone, message) => {
    try {
      const cleanPhone = phone.replace(/[^\d+]/g, '');
      const url = `whatsapp://send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`;
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
        return true;
      } else {
        const webUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
        await Linking.openURL(webUrl);
        return true;
      }
    } catch (error) {
      console.error('WhatsApp Error:', error);
      return false;
    }
  };

  const saveCampaignToDatabase = async (channel, audience, message) => {
    try {
      const { error } = await supabase
        .from('campaigns')
        .insert([{
          business_id: businessId,
          title: `${channel.toUpperCase()} Campaign - ${new Date().toLocaleDateString()}`,
          channel: channel,
          content: message,
          scheduled_at: new Date().toISOString(),
        }]);

      if (error) throw error;
    } catch (error) {
      console.error('Error saving campaign:', error);
    }
  };

  const handleStartCampaign = async () => {
    if (!campaignMessage.trim()) {
      Alert.alert('Error', 'Please enter a message');
      return;
    }

    setSendingCampaign(true);

    try {
      await saveCampaignToDatabase(campaignChannel, campaignAudience, campaignMessage);

      let targetCustomers = campaignAudience === 'all'
        ? customers
        : customers.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, Math.min(5, customers.length));

      const eligibleCustomers = targetCustomers.filter(customer => {
        return campaignChannel === 'email' ? (customer.email && customer.email.trim() !== '') : (customer.phone && customer.phone.trim() !== '');
      });

      if (eligibleCustomers.length === 0) {
        Alert.alert('No Eligible Customers', `No customers have ${campaignChannel === 'email' ? 'email addresses' : 'phone numbers'} for this campaign.`);
        setSendingCampaign(false);
        return;
      }

      const proceed = await new Promise((resolve) => {
        Alert.alert('Confirm Campaign', `Send ${campaignChannel.toUpperCase()} to ${eligibleCustomers.length} customers?`, [
          { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
          { text: 'Send', onPress: () => resolve(true) }
        ]);
      });

      if (!proceed) {
        setSendingCampaign(false);
        return;
      }

      let successCount = 0;
      let failureCount = 0;
      const failedCustomers = [];

      if (campaignChannel === 'email') {
        const emails = eligibleCustomers.map(c => c.email).filter(Boolean);
        if (emails.length > 0) {
          const success = await sendBulkEmail(emails, campaignMessage, 'Marketing Campaign');
          successCount = success ? emails.length : 0;
          failureCount = success ? 0 : emails.length;
        }
      } else {
        for (const customer of eligibleCustomers) {
          let success = false;
          try {
            success = campaignChannel === 'sms'
              ? await sendSMS(customer.phone, campaignMessage)
              : await sendWhatsApp(customer.phone, campaignMessage);

            if (success) successCount++;
            else {
              failureCount++;
              failedCustomers.push(customer.name);
            }
          } catch (error) {
            console.error(`Failed to send to ${customer.name}:`, error);
            failureCount++;
            failedCustomers.push(customer.name);
          }
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      setCampaignModalVisible(false);

      let resultMessage = `Campaign Results:\n\n✅ Successful: ${successCount}\n❌ Failed: ${failureCount}`;
      if (failedCustomers.length > 0 && failedCustomers.length <= 3) {
        resultMessage += `\n\nFailed customers: ${failedCustomers.join(', ')}`;
      } else if (failedCustomers.length > 3) {
        resultMessage += `\n\nSome customers couldn't be reached.`;
      }
      if (successCount > 0) {
        resultMessage += `\n\nNote: Messages opened in external apps for sending.`;
      }

      Alert.alert('Campaign Complete', resultMessage, [{ text: 'OK' }]);
      setCampaignMessage('');
    } catch (error) {
      console.error('Campaign error:', error);
      Alert.alert('Error', 'Failed to send campaign');
    } finally {
      setSendingCampaign(false);
    }
  };

  const handleCustomerPress = (customer) => {
    Alert.alert(
      customer.name,
      `Phone: ${customer.phone || 'N/A'}\nEmail: ${customer.email || 'N/A'}\nJoined: ${new Date(customer.created_at).toLocaleDateString()}`,
      [
        { text: 'Call', onPress: () => customer.phone ? Linking.openURL(`tel:${customer.phone}`) : Alert.alert('No Phone', 'This customer has no phone number') },
        { text: 'Message', onPress: () => customer.phone ? sendSMS(customer.phone, 'Hello! Thanks for being our valued customer.') : Alert.alert('No Phone', 'This customer has no phone number') },
        { text: 'Email', onPress: () => customer.email ? sendEmail(customer.email, 'Hello! Thanks for being our valued customer.', 'Thank You') : Alert.alert('No Email', 'This customer has no email address') },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const bottomNavItems = [
    { route: 'Home', label: t('home.bottomNav.home'), icon: 'home' },
    { route: 'Inventory', label: t('home.bottomNav.inventory'), icon: 'inventory' },
    { route: 'Ledger', label: t('home.bottomNav.ledger'), icon: 'account-balance-wallet' },
    { route: 'CRM', label: t('home.bottomNav.crm'), icon: 'people' },
    { route: 'Reports', label: t('home.bottomNav.reports'), icon: 'assessment' },
  ];

  const renderCustomerItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.customerItem, { borderBottomColor: theme.colors.border }]}
      onPress={() => handleCustomerPress(item)}
    >
      <View style={[styles.avatar, { backgroundColor: `${theme.colors.primary}20` }]}>
        <Text style={[styles.avatarText, { color: theme.colors.primary }]}>{item.name.charAt(0).toUpperCase()}</Text>
      </View>
      <View style={styles.customerInfo}>
        <Text style={[styles.customerName, { color: theme.colors.text }]}>{item.name}</Text>
        <Text style={[styles.customerDetails, { color: theme.colors.subtleText }]}>
          {item.phone && `📞 ${item.phone}`}
          {item.phone && item.email && ' • '}
          {item.email && `📧 ${item.email}`}
        </Text>
        <Text style={[styles.customerSubDetails, { color: theme.colors.subtleText }]}>
          Joined: {new Date(item.created_at).toLocaleDateString()}
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
        <View style={[styles.modalContainer, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Launch Campaign</Text>
            <TouchableOpacity onPress={() => setCampaignModalVisible(false)}>
              <Icon name="close" size={24} color={theme.colors.subtleText} />
            </TouchableOpacity>
          </View>

          <ScrollView>
            <Text style={[styles.modalSectionTitle, { color: theme.colors.text }]}>Step 1: Choose Channel</Text>
            <View style={styles.optionGroup}>
              {CAMPAIGN_CHANNELS.map(channel => (
                <TouchableOpacity
                  key={channel.key}
                  style={[
                    styles.optionButton,
                    { backgroundColor: theme.colors.background, borderColor: theme.colors.border },
                    campaignChannel === channel.key && { backgroundColor: `${theme.colors.primary}20`, borderColor: theme.colors.primary }
                  ]}
                  onPress={() => setCampaignChannel(channel.key)}
                >
                  <Icon name={channel.icon} size={20} color={campaignChannel === channel.key ? theme.colors.primary : theme.colors.subtleText} />
                  <Text style={[
                    styles.optionButtonText,
                    { color: theme.colors.subtleText },
                    campaignChannel === channel.key && { color: theme.colors.primary }
                  ]}>
                    {channel.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.modalSectionTitle, { color: theme.colors.text }]}>Step 2: Select Audience</Text>
            <View style={styles.optionGroup}>
              <TouchableOpacity
                style={[
                  styles.optionButton,
                  { backgroundColor: theme.colors.background, borderColor: theme.colors.border },
                  campaignAudience === 'all' && { backgroundColor: `${theme.colors.primary}20`, borderColor: theme.colors.primary }
                ]}
                onPress={() => setCampaignAudience('all')}
              >
                <Text style={[styles.optionButtonText, { color: theme.colors.subtleText }, campaignAudience === 'all' && { color: theme.colors.primary }]}>
                  All Customers ({customers.filter(c => campaignChannel === 'email' ? c.email : c.phone).length})
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.optionButton,
                  { backgroundColor: theme.colors.background, borderColor: theme.colors.border },
                  campaignAudience === 'specific' && { backgroundColor: `${theme.colors.primary}20`, borderColor: theme.colors.primary }
                ]}
                onPress={() => setCampaignAudience('specific')}
              >
                <Text style={[styles.optionButtonText, { color: theme.colors.subtleText }, campaignAudience === 'specific' && { color: theme.colors.primary }]}>
                  Recent Customers ({Math.min(5, customers.filter(c => campaignChannel === 'email' ? c.email : c.phone).length)})
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalSectionTitle, { color: theme.colors.text }]}>Step 3: Compose Message</Text>
            <TextInput
              style={[styles.messageInput, { backgroundColor: theme.colors.background, color: theme.colors.text, borderColor: theme.colors.border }]}
              placeholder={`Enter your ${campaignChannel} message here...`}
              placeholderTextColor={theme.colors.subtleText}
              multiline
              value={campaignMessage}
              onChangeText={setCampaignMessage}
            />
            <View style={styles.templateContainer}>
              <Text style={[styles.templateText, { color: theme.colors.subtleText }]}>Quick templates: </Text>
              <TouchableOpacity onPress={() => setCampaignMessage('🌟 Special Offer! Get 20% off on all items. Use code SAVE20. Limited time offer!')}>
                <Text style={styles.templateLink}>Discount Offer</Text>
              </TouchableOpacity>
              <Text style={[styles.templateText, { color: theme.colors.subtleText }]}> • </Text>
              <TouchableOpacity onPress={() => setCampaignMessage('🎉 Thank you for being our valued customer! Check out our latest products and services.')}>
                <Text style={styles.templateLink}>Thank You</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>

          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: theme.colors.primary }, (!campaignMessage || sendingCampaign) && { opacity: 0.5 }]}
            onPress={handleStartCampaign}
            disabled={!campaignMessage || sendingCampaign}
          >
            {sendingCampaign ? (
              <ActivityIndicator size="small" color={theme.colors.white} />
            ) : (
              <>
                <Text style={[styles.primaryButtonText, { color: theme.colors.white }]}>Send Campaign</Text>
                <Icon name="send" size={20} color={theme.colors.white} />
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.centered, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[theme.typography.body, { marginTop: theme.spacing.md, color: theme.colors.text }]}>
          Loading customers...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle={theme.dark ? "light-content" : "dark-content"} backgroundColor={theme.colors.background} />
      {renderCampaignModal()}

      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Icon name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[theme.typography.h1, { color: theme.colors.text }]}>CRM</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={[styles.searchContainer, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
        <Icon name="search" size={24} color={theme.colors.subtleText} style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, { color: theme.colors.text }]}
          placeholder="Search customers..."
          placeholderTextColor={theme.colors.subtleText}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <TouchableOpacity
        style={[styles.primaryButton, { backgroundColor: theme.colors.primary }, theme.shadow, customers.length === 0 && { opacity: 0.5 }]}
        onPress={() => setCampaignModalVisible(true)}
        disabled={customers.length === 0}
      >
        <Text style={[styles.primaryButtonText, { color: theme.colors.white }]}>
          {customers.length === 0 ? 'No Customers Yet' : 'Start Campaign'}
        </Text>
        <Icon name="campaign" size={24} color={theme.colors.white} />
      </TouchableOpacity>

      <View style={[styles.customerListContainer, { borderTopColor: theme.colors.border }]}>
        {filteredCustomers.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="people-outline" size={64} color={theme.colors.subtleText} />
            <Text style={[theme.typography.body, { marginTop: theme.spacing.md, textAlign: 'center', color: theme.colors.text }]}>
              {customers.length === 0
                ? 'No customers found.\nAdd customers to start using CRM features.'
                : 'No customers match your search.'}
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredCustomers}
            renderItem={renderCustomerItem}
            keyExtractor={item => item.id}
            contentContainerStyle={{ paddingBottom: theme.spacing.xl }}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      {/* BOTTOM NAVIGATION */}
      <View style={[styles.bottomNav, { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.border }]}>
        {bottomNavItems.map((item) => (
          <TouchableOpacity
            key={item.route}
            style={styles.bottomNavItem}
            onPress={() => {
              setSelectedTab(item.route);
              if (item.route !== 'CRM') {
                navigation.navigate(item.route === 'Home' ? 'Home' : `${item.route}Screen`);
              }
            }}
          >
            <Icon name={item.icon} size={28} color={selectedTab === item.route ? theme.colors.primary : theme.colors.subtleText} />
            <Text style={[styles.bottomNavText, { color: theme.colors.subtleText }, selectedTab === item.route && { color: theme.colors.primary }]}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'android' ? 24 : 8,
    paddingBottom: 16,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  placeholder: {
    width: 32,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    marginHorizontal: 24,
    paddingHorizontal: 16,
    borderWidth: 1,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Poppins-Regular',
    fontSize: 16,
    height: 50,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 24,
    paddingVertical: 16,
    borderRadius: 999,
  },
  primaryButtonText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    marginRight: 8,
  },
  customerListContainer: {
    flex: 1,
    borderTopWidth: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  customerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontFamily: 'Poppins-Bold',
  },
  customerInfo: {
    flex: 1,
    marginLeft: 16,
  },
  customerName: {
    fontFamily: 'Poppins-Medium',
    fontSize: 16,
  },
  customerDetails: {
    fontSize: 12,
    marginTop: 2,
    fontFamily: 'Poppins-Regular',
  },
  customerSubDetails: {
    fontSize: 11,
    marginTop: 2,
    fontFamily: 'Poppins-Regular',
  },
  // Modal Styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    height: '85%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 20,
  },
  modalSectionTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 12,
    marginTop: 16,
    marginBottom: 8,
  },
  optionGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 999,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
  },
  optionButtonText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    marginLeft: 4,
  },
  messageInput: {
    borderRadius: 16,
    padding: 16,
    height: 150,
    textAlignVertical: 'top',
    fontFamily: 'Poppins-Regular',
    fontSize: 16,
    borderWidth: 1,
  },
  templateContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    alignItems: 'center',
  },
  templateText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
  },
  templateLink: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  // Bottom Nav
  bottomNav: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingVertical: 8,
    paddingBottom: 21,
  },
  bottomNavItem: { flex: 1, alignItems: 'center' },
  bottomNavText: { fontFamily: 'Poppins-Medium', fontSize: 12, marginTop: 4 },
});

export default CRMScreen;