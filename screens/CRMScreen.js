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
import { supabase } from '../lib/supabaseClient'; // Assuming you have supabase client
import AsyncStorage from '@react-native-async-storage/async-storage';

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

const CAMPAIGN_CHANNELS = [
  { key: 'sms', name: 'SMS', icon: 'sms' },
  { key: 'email', name: 'Email', icon: 'email' },
  { key: 'whatsapp', name: 'WhatsApp', icon: 'message' },
];

const CRMScreen = ({ navigation }) => {
  const { t } = useI18n();
  const [searchQuery, setSearchQuery] = useState('');
  const [isCampaignModalVisible, setCampaignModalVisible] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [businessId, setBusinessId] = useState(null);
  const [sendingCampaign, setSendingCampaign] = useState(false);

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
      
      // Get user from auth
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Error', 'Please log in to access CRM');
        navigation.goBack();
        return;
      }

      // Get user's business
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
      
      // Load customers for this business
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
      // For SMS, we can use the device's SMS capability
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
      // Create comma-separated email list for BCC to protect customer privacy
      const emailList = emails.join(',');
      
      // Use BCC to send to all customers at once while protecting their privacy
      const url = `mailto:?bcc=${encodeURIComponent(emailList)}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
      
      // Try to open email client
      await Linking.openURL(url);
      return true;
    } catch (error) {
      console.error('Email Error:', error);
      
      // If mailto fails, try Gmail web with BCC
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
    // This function is now used for individual customer emails only
    return sendBulkEmail([email], message, subject);
  };

  const sendWhatsApp = async (phone, message) => {
    try {
      // Clean phone number (remove any non-digits except +)
      const cleanPhone = phone.replace(/[^\d+]/g, '');
      const url = `whatsapp://send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`;
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
        return true;
      } else {
        // Fallback to web WhatsApp
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
      // Save campaign to database
      await saveCampaignToDatabase(campaignChannel, campaignAudience, campaignMessage);

      // Get target customers based on selection
      let targetCustomers = [];
      if (campaignAudience === 'all') {
        targetCustomers = customers;
      } else {
        // For specific group, let user choose or use high-value/recent customers
        targetCustomers = customers
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          .slice(0, Math.min(5, customers.length));
      }

      // Filter customers based on channel requirements
      const eligibleCustomers = targetCustomers.filter(customer => {
        switch (campaignChannel) {
          case 'sms':
          case 'whatsapp':
            return customer.phone && customer.phone.trim() !== '';
          case 'email':
            return customer.email && customer.email.trim() !== '';
          default:
            return false;
        }
      });

      if (eligibleCustomers.length === 0) {
        Alert.alert(
          'No Eligible Customers', 
          `No customers have ${campaignChannel === 'email' ? 'email addresses' : 'phone numbers'} for this campaign.`
        );
        setSendingCampaign(false);
        return;
      }

      let successCount = 0;
      let failureCount = 0;
      const failedCustomers = [];

      // Show confirmation before sending
      const proceed = await new Promise((resolve) => {
        Alert.alert(
          'Confirm Campaign',
          `Send ${campaignChannel.toUpperCase()} to ${eligibleCustomers.length} customers?`,
          [
            { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
            { text: 'Send', onPress: () => resolve(true) }
          ]
        );
      });

      if (!proceed) {
        setSendingCampaign(false);
        return;
      }

      // Send messages based on channel
      if (campaignChannel === 'email') {
        // For email campaigns, send all at once using BCC
        const emails = eligibleCustomers.map(c => c.email).filter(email => email && email.trim() !== '');
        
        if (emails.length > 0) {
          const success = await sendBulkEmail(emails, campaignMessage, 'Marketing Campaign');
          if (success) {
            successCount = emails.length;
            failureCount = 0;
          } else {
            successCount = 0;
            failureCount = emails.length;
          }
        }
      } else {
        // For SMS/WhatsApp, send individually as these don't support bulk
        for (const customer of eligibleCustomers) {
          let success = false;

          try {
            switch (campaignChannel) {
              case 'sms':
                success = await sendSMS(customer.phone, campaignMessage);
                break;
              case 'whatsapp':
                success = await sendWhatsApp(customer.phone, campaignMessage);
                break;
            }

            if (success) {
              successCount++;
            } else {
              failureCount++;
              failedCustomers.push(customer.name);
            }
          } catch (error) {
            console.error(`Failed to send to ${customer.name}:`, error);
            failureCount++;
            failedCustomers.push(customer.name);
          }

          // Small delay between sends to avoid overwhelming the system
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      setCampaignModalVisible(false);
      
      // Show detailed results
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
      
      // Reset state
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
        { 
          text: 'Call', 
          onPress: () => {
            if (customer.phone) {
              Linking.openURL(`tel:${customer.phone}`);
            } else {
              Alert.alert('No Phone', 'This customer has no phone number');
            }
          }
        },
        { 
          text: 'Message', 
          onPress: () => {
            if (customer.phone) {
              sendSMS(customer.phone, 'Hello! Thanks for being our valued customer.');
            } else {
              Alert.alert('No Phone', 'This customer has no phone number');
            }
          }
        },
        { 
          text: 'Email', 
          onPress: () => {
            if (customer.email) {
              sendEmail(customer.email, 'Hello! Thanks for being our valued customer.', 'Thank You');
            } else {
              Alert.alert('No Email', 'This customer has no email address');
            }
          }
        },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const renderCustomerItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.customerItem} 
      onPress={() => handleCustomerPress(item)}
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
      </View>
      <View style={styles.customerInfo}>
        <Text style={styles.customerName}>{item.name}</Text>
        <Text style={styles.customerDetails}>
          {item.phone && `📞 ${item.phone}`}
          {item.phone && item.email && ' • '}
          {item.email && `📧 ${item.email}`}
        </Text>
        <Text style={styles.customerSubDetails}>
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
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Launch Campaign</Text>
            <TouchableOpacity onPress={() => setCampaignModalVisible(false)}>
              <Icon name="close" size={24} color={theme.colors.subtleText} />
            </TouchableOpacity>
          </View>
          
          <ScrollView>
             {/* Channel Selection */}
            <Text style={styles.modalSectionTitle}>Step 1: Choose Channel</Text>
            <View style={styles.optionGroup}>
                {CAMPAIGN_CHANNELS.map(channel => (
                    <TouchableOpacity 
                      key={channel.key} 
                      style={[styles.optionButton, campaignChannel === channel.key && styles.optionButtonActive]} 
                      onPress={() => setCampaignChannel(channel.key)}
                    >
                        <Icon name={channel.icon} size={20} color={campaignChannel === channel.key ? theme.colors.primary : theme.colors.subtleText} />
                        <Text style={[styles.optionButtonText, campaignChannel === channel.key && styles.optionButtonTextActive]}>
                          {channel.name}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Audience Selection */}
            <Text style={styles.modalSectionTitle}>Step 2: Select Audience</Text>
            <View style={styles.optionGroup}>
                <TouchableOpacity 
                  style={[styles.optionButton, campaignAudience === 'all' && styles.optionButtonActive]} 
                  onPress={() => setCampaignAudience('all')}
                >
                    <Text style={[styles.optionButtonText, campaignAudience === 'all' && styles.optionButtonTextActive]}>
                      All Customers ({customers.filter(c => 
                        campaignChannel === 'email' 
                          ? c.email && c.email.trim() !== '' 
                          : c.phone && c.phone.trim() !== ''
                      ).length})
                    </Text>
                </TouchableOpacity>
                 <TouchableOpacity 
                   style={[styles.optionButton, campaignAudience === 'specific' && styles.optionButtonActive]} 
                   onPress={() => setCampaignAudience('specific')}
                 >
                    <Text style={[styles.optionButtonText, campaignAudience === 'specific' && styles.optionButtonTextActive]}>
                      Recent Customers ({Math.min(5, customers.filter(c => 
                        campaignChannel === 'email' 
                          ? c.email && c.email.trim() !== '' 
                          : c.phone && c.phone.trim() !== ''
                      ).length)})
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Message Input */}
            <Text style={styles.modalSectionTitle}>Step 3: Compose Message</Text>
            <TextInput
                style={styles.messageInput}
                placeholder={`Enter your ${campaignChannel} message here...`}
                placeholderTextColor={theme.colors.subtleText}
                multiline
                value={campaignMessage}
                onChangeText={setCampaignMessage}
            />
            <View style={styles.templateContainer}>
                <Text style={styles.templateText}>Quick templates: </Text>
                <TouchableOpacity onPress={() => setCampaignMessage('🌟 Special Offer! Get 20% off on all items. Use code SAVE20. Limited time offer!')}>
                    <Text style={styles.templateLink}>Discount Offer</Text>
                </TouchableOpacity>
                <Text style={styles.templateText}> • </Text>
                <TouchableOpacity onPress={() => setCampaignMessage('🎉 Thank you for being our valued customer! Check out our latest products and services.')}>
                    <Text style={styles.templateLink}>Thank You</Text>
                </TouchableOpacity>
            </View>
          </ScrollView>

          <TouchableOpacity 
            style={[styles.primaryButton, (!campaignMessage || sendingCampaign) && {opacity: 0.5}]} 
            onPress={handleStartCampaign} 
            disabled={!campaignMessage || sendingCampaign}
          >
            {sendingCampaign ? (
              <ActivityIndicator size="small" color={theme.colors.white} />
            ) : (
              <>
                <Text style={styles.primaryButtonText}>Send Campaign</Text>
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
      <SafeAreaView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[theme.typography.body, { marginTop: theme.spacing.md }]}>
          Loading customers...
        </Text>
      </SafeAreaView>
    );
  }

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
        <Text style={theme.typography.h1}>CRM</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.searchContainer}>
        <Icon name="search" size={24} color={theme.colors.subtleText} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search customers..."
          placeholderTextColor={theme.colors.subtleText}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <TouchableOpacity 
        style={[styles.primaryButton, customers.length === 0 && { opacity: 0.5 }]} 
        onPress={() => setCampaignModalVisible(true)}
        disabled={customers.length === 0}
      >
        <Text style={styles.primaryButtonText}>
          {customers.length === 0 ? 'No Customers Yet' : 'Start Campaign'}
        </Text>
        <Icon name="campaign" size={24} color={theme.colors.white} />
      </TouchableOpacity>

      <View style={styles.customerListContainer}>
        {filteredCustomers.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="people-outline" size={64} color={theme.colors.subtleText} />
            <Text style={[theme.typography.body, { marginTop: theme.spacing.md, textAlign: 'center' }]}>
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
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
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
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
    marginTop: 2,
  },
  customerSubDetails: {
    ...theme.typography.subtext,
    fontSize: 11,
    color: theme.colors.subtleText,
    marginTop: 2,
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
      flexWrap: 'wrap',
      marginTop: theme.spacing.sm,
      alignItems: 'center',
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