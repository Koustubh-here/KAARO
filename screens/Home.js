/**
 * Home.js
 * A premium, user-centric dashboard providing an elegant and intuitive
 * overview of business performance. Designed for clarity and delight.
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Dimensions,
  StatusBar,
  Animated,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  FlatList,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useI18n } from '../i18n/I18nProvider';

// THEME & DESIGN SYSTEM =================================================
const theme = {
  colors: {
    primary: '#4A69E2', // A softer, more professional blue
    background: '#F7F8FC', // A slightly warmer, brighter background
    surface: '#FFFFFF', // Card and component backgrounds
    text: '#121212',
    subtleText: '#6E717A',
    success: '#2E7D32',
    danger: '#C62828',
    warning: '#FFAB00',
    border: '#E8E9F1',
    white: '#FFFFFF',
    black: '#000000',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  typography: {
    h1: {
      fontFamily: 'Poppins-Bold',
      fontSize: 28,
      color: '#121212',
    },
    h2: {
      fontFamily: 'Poppins-SemiBold',
      fontSize: 20,
      color: '#121212',
    },
    body: {
      fontFamily: 'Poppins-Regular',
      fontSize: 16,
      color: '#6E717A',
    },
    subtext: {
      fontFamily: 'Poppins-Regular',
      fontSize: 14,
      color: '#6E717A',
    },
    label: {
      fontFamily: 'Poppins-Medium',
      fontSize: 12,
      color: '#6E717A',
    },
  },
  borderRadius: {
    sm: 8,
    md: 16,
    lg: 24,
    full: 999,
  },
  shadow: {
    shadowColor: '#4A69E2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
};
// =========================================================================

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const Home = ({ navigation }) => {
  const { t } = useI18n();
  const [selectedTab, setSelectedTab] = useState('Home');
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [chatVisible, setChatVisible] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [chatMessages, setChatMessages] = useState([
    { id: 1, text: t('home.chat.welcome'), isBot: true },
  ]);

  const sidebarAnimation = useRef(new Animated.Value(-350)).current;
  const chatAnimation = useRef(new Animated.Value(screenHeight)).current;
  const fabAnimation = useRef(new Animated.Value(1)).current;

  // ANIMATION LOGIC (Refined for a smoother feel)
  const toggleSidebar = () => {
    const toValue = sidebarVisible ? -350 : 0;
    Animated.spring(sidebarAnimation, {
      toValue,
      useNativeDriver: true,
      tension: 60,
      friction: 10,
    }).start();
    setSidebarVisible(!sidebarVisible);
  };

  const toggleChat = () => {
    const toValue = chatVisible ? screenHeight : 0;
    const fabToValue = chatVisible ? 1 : 0;
    setChatVisible(!chatVisible); // Toggle state optimistically for responsiveness

    Animated.parallel([
      Animated.spring(chatAnimation, {
        toValue,
        useNativeDriver: true,
        tension: 80,
        friction: 12,
      }),
      Animated.timing(fabAnimation, {
        toValue: fabToValue,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const sendMessage = () => {
    if (chatMessage.trim()) {
      const newMessage = { id: Date.now(), text: chatMessage, isBot: false };
      const thinkingMessage = { id: Date.now() + 1, text: t('home.chat.typing'), isBot: true };

      setChatMessages(prev => [...prev, newMessage, thinkingMessage]);
      setChatMessage('');

      setTimeout(() => {
         const botResponse = {
          id: Date.now() + 2,
           text: "Excellent question. I'm analyzing your real-time data to give you the best possible insights.",
          isBot: true,
        };
        setChatMessages(prev => [...prev.slice(0, -1), botResponse]);
      }, 1500);
    }
  };

  // MOCK DATA
  const activityData = [
    { type: 'alert', title: 'Low Stock: Classic T-Shirt', time: 'Just now', icon: 'warning', color: theme.colors.warning },
    { type: 'sale', title: 'Sale to #CUST-0892', time: '15 mins ago', amount: '+ ₹4,999', icon: 'shopping-cart', color: theme.colors.success },
    { type: 'message', title: 'New inquiry from R. Sharma', time: '1 hour ago', icon: 'chat-bubble', color: theme.colors.primary },
    { type: 'expense', title: 'Marketing Subscription', time: '4 hours ago', amount: '- ₹1,500', icon: 'receipt-long', color: theme.colors.danger },
  ];

  const sidebarItems = [
    { title: t('home.sidebar.ledger'), route: 'Ledger', icon: 'account-balance-wallet' },
    { title: t('home.sidebar.inventory'), route: 'Inventory', icon: 'inventory' },
    { title: t('home.sidebar.crm'), route: 'CRM', icon: 'people' },
    { title: t('home.sidebar.reports'), route: 'Reports', icon: 'assessment' },
    { title: t('home.sidebar.aiSettings'), route: null, icon: 'smart-toy' },
    { title: t('home.sidebar.settings'), route: null, icon: 'settings' },
  ];
  
  const quickActions = [
      { 
        title: t('home.newSale'), 
        icon: 'add-shopping-cart', 
        action: () => {
          navigation.navigate('AddTransactionScreen', { type: t('types.income') });
        }
      },
      { 
        title: t('home.newExpense'), 
        icon: 'receipt', 
        action: () => {
          navigation.navigate('AddTransactionScreen', { type: t('types.expense') });
        }
      },
      { 
        title: t('home.addStock'), 
        icon: 'inventory', 
        action: () => {
          Alert.alert(t('home.alertAddStockTitle'), t('home.alertAddStockBody'), [
            { text: t('common.ok'), onPress: () => navigation.navigate('InventoryScreen') }
          ]);
        }
      },
      { 
        title: t('home.newReport'), 
        icon: 'assessment', 
        action: () => {
          Alert.alert(t('home.alertNewReportTitle'), t('home.alertNewReportBody'), [
            { text: t('common.ok'), onPress: () => navigation.navigate('ReportsScreen') }
          ]);
        }
      },
  ];

  const bottomNavItems = [
    { route: 'Home', label: t('home.bottomNav.home'), icon: 'home' },
    { route: 'Inventory', label: t('home.bottomNav.inventory'), icon: 'inventory' },
    { route: 'Ledger', label: t('home.bottomNav.ledger'), icon: 'account-balance-wallet' },
    { route: 'CRM', label: t('home.bottomNav.crm'), icon: 'people' },
    { route: 'Reports', label: t('home.bottomNav.reports'), icon: 'assessment' },
  ];

  // REUSABLE & REFINED RENDER COMPONENTS
  const renderActivityItem = ({ item }) => (
    <View style={styles.activityItem}>
      <View style={[styles.activityIconContainer, { backgroundColor: `${item.color}20` }]}>
        <Icon name={item.icon} size={20} color={item.color} />
      </View>
      <View style={styles.activityContent}>
        <Text style={styles.activityTitle}>{item.title}</Text>
        <Text style={styles.activityTime}>{item.time}</Text>
      </View>
      {item.amount ? (
        <Text style={[styles.activityAmount, { color: item.amount.startsWith('+') ? theme.colors.success : theme.colors.danger }]}>
          {item.amount}
        </Text>
      ) : (
        <Icon name="chevron-right" size={24} color={theme.colors.subtleText} />
      )}
    </View>
  );

  const renderSidebar = () => (
    <Animated.View style={[styles.sidebar, { transform: [{ translateX: sidebarAnimation }] }]}>
      <View style={styles.sidebarHeader}>
        <View style={styles.profileAvatar}>
          <Text style={styles.profileInitial}>JD</Text>
        </View>
        <View>
          <Text style={styles.profileName}>John Doe</Text>
          <Text style={styles.profileEmail}>john@business.com</Text>
        </View>
        <TouchableOpacity onPress={toggleSidebar} style={styles.sidebarClose}>
          <Icon name="close" size={24} color={theme.colors.subtleText} />
        </TouchableOpacity>
      </View>
      <ScrollView>
        {sidebarItems.map((item) => (
          <TouchableOpacity 
            key={item.title} 
            style={styles.sidebarItem}
            onPress={() => {
              if (item.route) {
                navigation.navigate(`${item.route}Screen`);
                setSidebarVisible(false);
              }
            }}
          >
            <Icon name={item.icon} size={24} color={theme.colors.subtleText} />
            <Text style={styles.sidebarItemText}>{item.title}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <TouchableOpacity 
        style={[styles.sidebarItem, styles.sidebarLogout]}
        onPress={() => {
          Alert.alert(
            t('home.sidebar.logoutTitle'),
            t('home.sidebar.logoutBody'),
            [
              { text: t('common.cancel'), style: 'cancel' },
              { 
                text: t('home.sidebar.logout'), 
                style: 'destructive',
                onPress: () => {
                  setSidebarVisible(false);
                  navigation.reset({
                    index: 0,
                    routes: [{ name: 'Login' }],
                  });
                }
              }
            ]
          );
        }}
      >
        <Icon name="logout" size={24} color={theme.colors.danger} />
        <Text style={[styles.sidebarItemText, { color: theme.colors.danger }]}>{t('home.sidebar.logout')}</Text>
      </TouchableOpacity>
    </Animated.View>
  );

  const renderChat = () => (
    <Animated.View style={[styles.chatContainer, { transform: [{ translateY: chatAnimation }] }]}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <View style={styles.chatHeader}>
                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                    <View style={styles.chatBotAvatar}><Icon name="smart-toy" size={24} color={theme.colors.white} /></View>
                    <View>
                        <Text style={styles.chatHeaderTitle}>{t('home.chat.botName')}</Text>
                        <Text style={styles.chatHeaderSubtitle}>{t('home.chat.online')}</Text>
                    </View>
                </View>
                <TouchableOpacity onPress={toggleChat}><Icon name="keyboard-arrow-down" size={32} color={theme.colors.white} /></TouchableOpacity>
            </View>
            <FlatList
                data={chatMessages}
                keyExtractor={(item) => item.id.toString()}
                style={styles.chatMessages}
                contentContainerStyle={{ paddingVertical: theme.spacing.md }}
                renderItem={({ item }) => (
                    <View style={[styles.messageContainer, item.isBot ? styles.botMessage : styles.userMessage]}>
                        <Text style={styles.messageText}>{item.text}</Text>
                    </View>
                )}
            />
            <View style={styles.chatInputContainer}>
                <TextInput
                    style={styles.chatInput}
                    placeholder={t('home.chat.inputPlaceholder')}
                    placeholderTextColor={theme.colors.subtleText}
                    value={chatMessage}
                    onChangeText={setChatMessage}
                    multiline
                />
                <TouchableOpacity style={[styles.chatSendButton, !chatMessage.trim() && { opacity: 0.5 }]} onPress={sendMessage} disabled={!chatMessage.trim()}>
                    <Icon name="send" size={22} color={theme.colors.white} />
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    </Animated.View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />
      
      {sidebarVisible && <TouchableOpacity style={styles.overlay} onPress={toggleSidebar} activeOpacity={1} />}
      {renderSidebar()}
      
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={toggleSidebar} style={styles.headerButton}>
          <Icon name="menu" size={28} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('home.headerTitle')}</Text>
        <TouchableOpacity style={styles.headerButton}>
          <Icon name="notifications" size={28} color={theme.colors.text} />
          <View style={styles.notificationBadge}>
            <Text style={styles.notificationBadgeText}>3</Text>
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.mainContent} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={theme.typography.h1}>{t('home.greeting')}</Text>
          <Text style={theme.typography.body}>{t('home.overview')}</Text>
        </View>

        {/* SUMMARY CARDS */}
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, theme.shadow]}>
            <View style={styles.summaryHeader}>
                <View style={[styles.summaryIconContainer, { backgroundColor: `${theme.colors.success}20`}]}>
                    <Icon name="trending-up" size={24} color={theme.colors.success} />
                </View>
                <Text style={styles.summaryGrowthPositive}>+15.2%</Text>
            </View>
            <Text style={styles.summaryValue}>₹12,450</Text>
            <Text style={styles.summaryLabel}>{t('home.todaysSales')}</Text>
          </View>
          <View style={[styles.summaryCard, theme.shadow]}>
             <View style={styles.summaryHeader}>
                <View style={[styles.summaryIconContainer, { backgroundColor: `${theme.colors.danger}20`}]}>
                    <Icon name="trending-down" size={24} color={theme.colors.danger} />
                </View>
                <Text style={styles.summaryGrowthNegative}>-8.5%</Text>
            </View>
            <Text style={styles.summaryValue}>₹3,200</Text>
            <Text style={styles.summaryLabel}>{t('home.todaysExpenses')}</Text>
          </View>
        </View>

        {/* QUICK ACTIONS */}
        <View style={styles.section}>
            <Text style={theme.typography.h2}>{t('home.quickActions')}</Text>
            <View style={styles.quickActionsRow}>
                {quickActions.map(item => (
                    <TouchableOpacity 
                      key={item.title} 
                      style={styles.quickAction}
                      onPress={item.action}
                      activeOpacity={0.7}
                    >
                        <View style={styles.quickActionIconContainer}>
                            <Icon name={item.icon} size={28} color={theme.colors.primary} />
                        </View>
                        <Text style={styles.quickActionLabel}>{item.title}</Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
        
        {/* ACTIVITY FEED */}
        <View style={styles.section}>
          <Text style={theme.typography.h2}>{t('home.activityFeed')}</Text>
          <View style={[styles.card, { paddingVertical: theme.spacing.sm }]}>
            <FlatList
              data={activityData}
              keyExtractor={(item, index) => `${item.type}-${index}`}
              renderItem={renderActivityItem}
              ItemSeparatorComponent={() => <View style={styles.divider} />}
              scrollEnabled={false}
            />
          </View>
        </View>
        
      </ScrollView>

      {/* FLOATING ACTION BUTTON */}
      <Animated.View style={[styles.fabContainer, { opacity: fabAnimation, transform: [{ scale: fabAnimation }] }]}>
        <TouchableOpacity style={[styles.fab, theme.shadow]} onPress={toggleChat}>
          <Icon name="smart-toy" size={32} color={theme.colors.white} />
        </TouchableOpacity>
      </Animated.View>

      {/* BOTTOM NAVIGATION */}
      <View style={styles.bottomNav}>
        {bottomNavItems.map((item) => (
          <TouchableOpacity 
            key={item.route} 
            style={styles.bottomNavItem} 
            onPress={() => {
              setSelectedTab(item.route);
              if (item.route !== 'Home') {
                navigation.navigate(`${item.route}Screen`);
              }
            }}
          >
            <Icon name={item.icon} size={28} color={selectedTab === item.route ? theme.colors.primary : theme.colors.subtleText} />
            <Text style={[styles.bottomNavText, selectedTab === item.route && styles.bottomNavTextActive]}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      
      {/* CHAT INTERFACE (must be last for z-index) */}
      {renderChat()}
    </SafeAreaView>
  );
};

// MASTER STYLESHEET using the Design System
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingTop: Platform.OS === 'ios' ? theme.spacing.sm : theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  headerButton: { padding: theme.spacing.sm },
  headerTitle: { fontFamily: 'Poppins-Bold', fontSize: 24, color: theme.colors.primary },
  notificationBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: theme.colors.danger,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.background,
  },
  notificationBadgeText: { color: theme.colors.white, fontSize: 10, fontFamily: 'Poppins-Bold' },
  mainContent: { flex: 1 },
  section: { paddingHorizontal: theme.spacing.lg, marginBottom: theme.spacing.xl },
  card: { backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.md, padding: theme.spacing.lg, ...theme.shadow },

  // Summary
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: theme.spacing.lg, marginBottom: theme.spacing.xl },
  summaryCard: { flex: 1, backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.md, padding: theme.spacing.lg },
  summaryCard_margin: { marginLeft: theme.spacing.md },
  summaryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.sm },
  summaryIconContainer: { width: 44, height: 44, borderRadius: theme.borderRadius.full, justifyContent: 'center', alignItems: 'center' },
  summaryValue: { ...theme.typography.h1, fontSize: 24, marginVertical: theme.spacing.xs },
  summaryLabel: { ...theme.typography.subtext },
  summaryGrowthPositive: { ...theme.typography.label, color: theme.colors.success },
  summaryGrowthNegative: { ...theme.typography.label, color: theme.colors.danger },
  
  // Quick Actions
  quickActionsRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: theme.spacing.md },
  quickAction: { alignItems: 'center' },
  quickActionIconContainer: { width: 64, height: 64, borderRadius: theme.borderRadius.full, backgroundColor: theme.colors.surface, justifyContent: 'center', alignItems: 'center', marginBottom: theme.spacing.sm, ...theme.shadow },
  quickActionLabel: { ...theme.typography.label, color: theme.colors.text },

  // Activity
  activityItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: theme.spacing.md },
  activityIconContainer: { width: 40, height: 40, borderRadius: theme.borderRadius.full, justifyContent: 'center', alignItems: 'center', marginRight: theme.spacing.md },
  activityContent: { flex: 1 },
  activityTitle: { ...theme.typography.body, color: theme.colors.text, fontSize: 15, fontFamily: 'Poppins-Medium' },
  activityTime: { ...theme.typography.subtext, fontSize: 13 },
  activityAmount: { fontFamily: 'Poppins-SemiBold', fontSize: 15 },
  divider: { height: 1, backgroundColor: theme.colors.border, marginHorizontal: theme.spacing.lg },

  // FAB
  fabContainer: { position: 'absolute', bottom: 100, right: theme.spacing.lg, zIndex: 1000 },
  fab: {
    width: 64,
    height: 64,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Bottom Nav
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingVertical: theme.spacing.sm,
    paddingBottom: Platform.OS === 'ios' ? theme.spacing.lg : theme.spacing.sm,
  },
  bottomNavItem: { flex: 1, alignItems: 'center' },
  bottomNavText: { ...theme.typography.label, marginTop: theme.spacing.xs },
  bottomNavTextActive: { color: theme.colors.primary },

  // Overlay & Sidebar
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 998 },
  sidebar: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: 350,
    backgroundColor: theme.colors.background,
    zIndex: 999,
    paddingBottom: theme.spacing.lg,
  },
  sidebarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: 60,
    paddingBottom: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  profileAvatar: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  profileInitial: { color: theme.colors.white, fontSize: 18, fontFamily: 'Poppins-Bold' },
  profileName: { ...theme.typography.h2, fontSize: 18, color: theme.colors.text },
  profileEmail: { ...theme.typography.subtext },
  sidebarClose: { position: 'absolute', top: 60, right: theme.spacing.md, padding: theme.spacing.sm },
  sidebarItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.md },
  sidebarItemText: { ...theme.typography.body, color: theme.colors.text, marginLeft: theme.spacing.lg },
  sidebarLogout: { marginTop: 'auto' },

  // Chat Interface
  chatContainer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: theme.colors.surface, zIndex: 1001, transform: [{ translateY: screenHeight }] },
  chatHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.lg,
      paddingTop: Platform.OS === 'ios' ? 60 : 40,
      paddingBottom: theme.spacing.md,
      backgroundColor: theme.colors.primary,
      borderBottomLeftRadius: theme.borderRadius.lg,
      borderBottomRightRadius: theme.borderRadius.lg,
  },
  chatBotAvatar: { width: 40, height: 40, borderRadius: theme.borderRadius.full, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginRight: theme.spacing.md },
  chatHeaderTitle: { ...theme.typography.h2, color: theme.colors.white },
  chatHeaderSubtitle: { ...theme.typography.subtext, color: `${theme.colors.white}99` },
  chatMessages: { flex: 1, paddingHorizontal: theme.spacing.lg },
  messageContainer: { maxWidth: '85%', marginBottom: theme.spacing.md, padding: theme.spacing.md, borderRadius: theme.borderRadius.md },
  botMessage: { alignSelf: 'flex-start', backgroundColor: theme.colors.background, borderTopLeftRadius: theme.borderRadius.sm },
  userMessage: { alignSelf: 'flex-end', backgroundColor: theme.colors.primary, borderTopRightRadius: theme.borderRadius.sm },
  messageText: { ...theme.typography.body, lineHeight: 24, color: theme.colors.text },
  chatInputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: theme.spacing.md,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
  },
  chatInput: {
      flex: 1,
      backgroundColor: theme.colors.background,
      borderRadius: theme.borderRadius.full,
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
      ...theme.typography.body,
      color: theme.colors.text,
      marginRight: theme.spacing.md,
  },
  chatSendButton: { width: 48, height: 48, borderRadius: theme.borderRadius.full, backgroundColor: theme.colors.primary, justifyContent: 'center', alignItems: 'center' },

});

export default Home;