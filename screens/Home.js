/**
 * Home.js
 * A premium, user-centric dashboard providing an elegant and intuitive
 * overview of business performance. Designed for clarity and delight.
 */

import React, { useState, useRef, useCallback } from 'react';
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
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { useFocusEffect } from '@react-navigation/native';
import { runAgent } from '../lib/agent/agent';
// ADDED: Import AsyncStorage to sync notification state
import AsyncStorage from '@react-native-async-storage/async-storage';

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

const Home = ({ navigation, route }) => {
  const { t } = useI18n();
  const { signOut, business, user } = useAuth();
  const [selectedTab, setSelectedTab] = useState('Home');
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [chatVisible, setChatVisible] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [chatMessages, setChatMessages] = useState([
    { id: 1, text: t('home.chat.welcome'), isBot: true },
  ]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [summaryIndex, setSummaryIndex] = useState(0); // 0: Today, 1: Overall
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);

  const sidebarAnimation = useRef(new Animated.Value(-350)).current;
  const chatAnimation = useRef(new Animated.Value(screenHeight)).current;
  const fabAnimation = useRef(new Animated.Value(1)).current;
  const summaryScrollX = useRef(new Animated.Value(0)).current;

  // Load user profile data
  const loadUserProfile = useCallback(async () => {
    if (!user?.id) return;
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('name, business_name, location')
        .eq('user_id', user.id)
        .single();
      
      if (!error && data) {
        setUserProfile(data);
      }
    } catch (error) {
      console.log('Error loading user profile:', error);
    }
  }, [user?.id]);

  // CHANGED: Load notification count respecting cleared/read status from AsyncStorage
  const loadNotificationCount = useCallback(async () => {
    if (!business?.id) return;
    try {
      // 1. Get potential notifications (e.g., low stock items)
      const { data: lowStockProducts, error } = await supabase
        .from('products')
        .select('id')
        .eq('business_id', business.id)
        .lt('quantity', 20);
      
      if (error || !lowStockProducts) {
        setUnreadNotificationCount(0);
        return;
      }

      // 2. Get the lists of cleared and read notifications from local storage
      const clearedIdsString = await AsyncStorage.getItem(`cleared_notifications_${business.id}`);
      const clearedIds = clearedIdsString ? new Set(JSON.parse(clearedIdsString)) : new Set();
      
      const readIdsString = await AsyncStorage.getItem(`read_notifications_${business.id}`);
      const readIds = readIdsString ? new Set(JSON.parse(readIdsString)) : new Set();
      
      // 3. Filter the potential notifications to find the truly unread count
      const unreadCount = lowStockProducts.filter(product => {
        const notificationId = `low_stock_${product.id}`;
        // A notification is unread if it's NOT cleared AND NOT read
        return !clearedIds.has(notificationId) && !readIds.has(notificationId);
      }).length;
      
      setUnreadNotificationCount(unreadCount);

    } catch (err) {
      console.log('Error loading notification count:', err);
      setUnreadNotificationCount(0); // Default to 0 on error
    }
  }, [business?.id]);

  // Get user initials
  const getUserInitials = () => {
    if (userProfile?.name) {
      const names = userProfile.name.trim().split(' ');
      if (names.length >= 2) {
        return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
      } else if (names.length === 1) {
        return names[0].substring(0, 2).toUpperCase();
      }
    }
    return user?.email?.substring(0, 2).toUpperCase() || 'U';
  };

  // Calculate percentage change from previous day
  const calculatePercentageChange = (current, previous) => {
    if (!previous || previous === 0) {
      return current > 0 ? 100 : 0; // If no previous data but current exists, show 100% increase
    }
    return ((current - previous) / previous) * 100;
  };

  // ANIMATION LOGIC (Refined for a smoother feel)
  const toggleSidebar = () => {
    const toValue = sidebarVisible ? -350 : 0;
    const fabToValue = sidebarVisible ? 1 : 0; // Hide FAB when sidebar opens
    
    Animated.parallel([
      Animated.spring(sidebarAnimation, {
        toValue,
        useNativeDriver: true,
        tension: 60,
        friction: 10,
      }),
      Animated.timing(fabAnimation, {
        toValue: fabToValue,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
    
    setSidebarVisible(!sidebarVisible);
  };

  const loadConversationMessages = async (convId) => {
    if (!convId) return;
    const { data } = await supabase
      .from('ai_messages')
      .select('id, role, content, created_at')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true });
    const mapped = (data || []).map(m => ({ id: m.id, text: m.content, isBot: m.role !== 'user' }));
    setChatMessages(mapped.length ? mapped : [{ id: 1, text: t('home.chat.welcome'), isBot: true }]);
  };

  const ensureLatestConversation = async () => {
    if (!user?.id) return null;
    const { data } = await supabase
      .from('ai_conversations')
      .select('id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (data?.id) setActiveConversationId(data.id);
    return data?.id || null;
  };

  const toggleChat = async () => {
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
    if (!chatVisible) {
      const convId = await ensureLatestConversation();
      await loadConversationMessages(convId);
    }
  };

  const sendMessage = async () => {
    if (!chatMessage.trim()) return;
    const userText = chatMessage.trim();
    const newMessage = { id: Date.now(), text: userText, isBot: false };
    const thinkingMessage = { id: Date.now() + 1, text: t('home.chat.typing'), isBot: true };
    setChatMessages(prev => [...prev, newMessage, thinkingMessage]);
    setChatMessage('');

    try {
      const { reply } = await runAgent({ user, business, userText, conversationId: activeConversationId });
      setChatMessages(prev => [...prev.slice(0, -1), { id: Date.now() + 2, text: reply, isBot: true }]);
      // After tool actions, refresh summaries and activity
      await load();
      // refresh messages from DB to stay in sync
      if (activeConversationId) await loadConversationMessages(activeConversationId);
    } catch (e) {
      setChatMessages(prev => [...prev.slice(0, -1), { id: Date.now() + 2, text: e.message || 'Error', isBot: true }]);
    }
  };

  const [activityData, setActivityData] = useState([]);
  const [summary, setSummary] = useState({ 
    todayIncome: 0, 
    todayExpenses: 0,
    overallIncome: 0,
    overallExpenses: 0,
    yesterdayIncome: 0,
    yesterdayExpenses: 0,
    prevTotalIncome: 0,
    prevTotalExpenses: 0,
  });

  const load = useCallback(async () => {
    if (!business?.id) return;
    
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    // Get today's transactions
    const { data: todayTx } = await supabase
      .from('transactions')
      .select('*')
      .eq('business_id', business.id)
      .eq('date', today);
    
    // Get yesterday's transactions
    const { data: yesterdayTx } = await supabase
      .from('transactions')
      .select('*')
      .eq('business_id', business.id)
      .eq('date', yesterday);
    
    // Get all transactions
    const { data: allTx } = await supabase
      .from('transactions')
      .select('*')
      .eq('business_id', business.id)
      .order('created_at', { ascending: false });
    
    // Get previous period transactions (for overall comparison)
    const { data: prevTx } = await supabase
      .from('transactions')
      .select('*')
      .eq('business_id', business.id)
      .lt('date', lastWeek);

    const todayIncome = (todayTx || []).filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.amount), 0);
    const todayExpenses = (todayTx || []).filter(t => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0);
    
    const yesterdayIncome = (yesterdayTx || []).filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.amount), 0);
    const yesterdayExpenses = (yesterdayTx || []).filter(t => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0);
    
    const overallIncome = (allTx || []).filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.amount), 0);
    const overallExpenses = (allTx || []).filter(t => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0);
    
    const prevTotalIncome = (prevTx || []).filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.amount), 0);
    const prevTotalExpenses = (prevTx || []).filter(t => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0);

    // Create activity data from recent transactions with proper formatting
    const recent = (allTx || []).slice(0, 10).map(t => {
      const transactionDate = new Date(t.date || t.created_at);
      const formattedDate = transactionDate.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
      
      return {
        id: t.id,
        type: (t.type || '').toLowerCase(),
        title: t.description || `${t.type === 'income' ? 'Sale' : 'Expense'} Transaction`,
        category: t.category || 'General',
        time: formattedDate,
        amount: `${(t.type || '').toLowerCase() === 'income' ? '+ ' : '- '}₹${Number(t.amount || 0).toLocaleString('en-IN')}`,
        icon: (t.type || '').toLowerCase() === 'income' ? 'trending-up' : 'trending-down',
        color: (t.type || '').toLowerCase() === 'income' ? theme.colors.success : theme.colors.danger,
        rawAmount: Number(t.amount || 0),
      };
    });
    
    setActivityData(recent);
    setSummary({ 
      todayIncome, 
      todayExpenses,
      overallIncome,
      overallExpenses,
      yesterdayIncome,
      yesterdayExpenses,
      prevTotalIncome,
      prevTotalExpenses,
    });
  }, [business?.id]);

  useFocusEffect(
    useCallback(() => {
      setSelectedTab('Home');
      load();
      loadUserProfile();
      loadNotificationCount();
      // If navigated from ChatHistoryScreen with a selected conversation
      const openId = route?.params?.openConversationId;
      if (openId) {
        setActiveConversationId(openId);
        setChatVisible(true);
        Animated.spring(chatAnimation, { toValue: 0, useNativeDriver: true, tension: 80, friction: 12 }).start();
        loadConversationMessages(openId);
        // Clear the param to avoid reopening repeatedly
        navigation.setParams({ openConversationId: undefined });
      }
    }, [load, loadUserProfile, loadNotificationCount, route?.params?.openConversationId])
  );

  React.useEffect(() => {
    if (!business?.id) return;
    const channel = supabase
      .channel('home_tx')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions', filter: `business_id=eq.${business.id}` }, () => {
        load();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products', filter: `business_id=eq.${business.id}` }, () => {
        loadNotificationCount();
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [business?.id, load, loadNotificationCount]);

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
        <View style={styles.activityMeta}>
          <Text style={styles.activityCategory}>{item.category}</Text>
          <Text style={styles.activityTime}>{item.time}</Text>
        </View>
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

  const handleSidebarNavigation = (item) => {
    if (item.route) {
      // Navigate immediately, don't wait for animation
      navigation.navigate(`${item.route}Screen`);
      
      // Then close sidebar
      setSidebarVisible(false);
      Animated.parallel([
        Animated.spring(sidebarAnimation, {
          toValue: -350,
          useNativeDriver: true,
          tension: 60,
          friction: 10,
        }),
        Animated.timing(fabAnimation, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  };

  const renderSidebar = () => (
    <Animated.View style={[styles.sidebar, { transform: [{ translateX: sidebarAnimation }] }]}>
      <View style={styles.sidebarHeader}>
        <View style={styles.profileAvatar}>
          <Text style={styles.profileInitial}>{getUserInitials()}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.profileName}>
            {userProfile?.name || business?.name || 'User'}
          </Text>
          <Text style={styles.profileEmail}>
            {user?.email || 'user@business.com'}
          </Text>
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
            onPress={() => handleSidebarNavigation(item)}
            activeOpacity={0.7}
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
                onPress: async () => {
                  await signOut();
                  setSidebarVisible(false);
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

  const newChat = async () => {
    if (!user?.id) return;
    const { data, error } = await supabase
      .from('ai_conversations')
      .insert({ user_id: user.id, business_id: business?.id || null, title: `chat-${new Date().toISOString()}` })
      .select('id')
      .single();
    if (!error && data?.id) {
      setActiveConversationId(data.id);
      setChatMessages([{ id: 1, text: t('home.chat.welcome'), isBot: true }]);
    }
  };

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
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <TouchableOpacity onPress={newChat} style={{ marginRight: theme.spacing.md }}>
                    <Icon name="chat" size={24} color={theme.colors.white} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={toggleChat}><Icon name="keyboard-arrow-down" size={32} color={theme.colors.white} /></TouchableOpacity>
                </View>
            </View>
            <FlatList
                data={chatMessages}
                keyExtractor={(item) => item.id.toString()}
                style={styles.chatMessages}
                contentContainerStyle={{ paddingVertical: theme.spacing.md }}
                renderItem={({ item }) => (
                    <View style={[styles.messageContainer, item.isBot ? styles.botMessage : styles.userMessage]}>
                        <Text style={[styles.messageText, item.isBot ? {} : { color: theme.colors.white }]}>{item.text}</Text>
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

  const renderSummaryCards = () => {
    const isToday = summaryIndex === 0;
    const currentIncome = isToday ? summary.todayIncome : summary.overallIncome;
    const currentExpenses = isToday ? summary.todayExpenses : summary.overallExpenses;
    const previousIncome = isToday ? summary.yesterdayIncome : summary.prevTotalIncome;
    const previousExpenses = isToday ? summary.yesterdayExpenses : summary.prevTotalExpenses;
    
    const incomeChange = calculatePercentageChange(currentIncome, previousIncome);
    const expenseChange = calculatePercentageChange(currentExpenses, previousExpenses);
    
    return (
      <View style={styles.summaryContainer}>
        <ScrollView 
          horizontal 
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: summaryScrollX } } }],
            { 
              useNativeDriver: false,
              listener: (event) => {
                const index = Math.round(event.nativeEvent.contentOffset.x / screenWidth);
                setSummaryIndex(index);
              }
            }
          )}
          scrollEventThrottle={16}
        >
          {/* Today's Summary */}
          <View style={[styles.summaryPage, { width: screenWidth }]}>
            <View style={styles.summaryRow}>
              <View style={[styles.summaryCard, theme.shadow]}>
                <View style={styles.summaryHeader}>
                  <View style={[styles.summaryIconContainer, { backgroundColor: `${theme.colors.success}20`}]}>
                    <Icon name="trending-up" size={24} color={theme.colors.success} />
                  </View>
                  <Text style={[styles.summaryGrowth, { color: incomeChange >= 0 ? theme.colors.success : theme.colors.danger }]}>
                    {incomeChange >= 0 ? '+' : ''}{incomeChange.toFixed(1)}%
                  </Text>
                </View>
                <Text style={styles.summaryValue}>₹{Number(summary.todayIncome).toLocaleString('en-IN')}</Text>
                <Text style={styles.summaryLabel}>{t('home.todaysSales')}</Text>
                {/* REMOVED: Comparison text to ensure consistent card size */}
              </View>
              <View style={[styles.summaryCard, theme.shadow, { marginLeft: theme.spacing.md }]}>
                <View style={styles.summaryHeader}>
                  <View style={[styles.summaryIconContainer, { backgroundColor: `${theme.colors.danger}20`}]}>
                    <Icon name="trending-down" size={24} color={theme.colors.danger} />
                  </View>
                  <Text style={[styles.summaryGrowth, { color: expenseChange <= 0 ? theme.colors.success : theme.colors.danger }]}>
                    {expenseChange >= 0 ? '+' : ''}{expenseChange.toFixed(1)}%
                  </Text>
                </View>
                <Text style={styles.summaryValue}>₹{Number(summary.todayExpenses).toLocaleString('en-IN')}</Text>
                <Text style={styles.summaryLabel}>{t('home.todaysExpenses')}</Text>
                {/* REMOVED: Comparison text to ensure consistent card size */}
              </View>
            </View>
          </View>

          {/* Overall Summary */}
          <View style={[styles.summaryPage, { width: screenWidth }]}>
            <View style={styles.summaryRow}>
              <View style={[styles.summaryCard, theme.shadow]}>
                <View style={styles.summaryHeader}>
                  <View style={[styles.summaryIconContainer, { backgroundColor: `${theme.colors.success}20`}]}>
                    <Icon name="trending-up" size={24} color={theme.colors.success} />
                  </View>
                  <Text style={[styles.summaryGrowth, { color: incomeChange >= 0 ? theme.colors.success : theme.colors.danger }]}>
                    {incomeChange >= 0 ? '+' : ''}{incomeChange.toFixed(1)}%
                  </Text>
                </View>
                <Text style={styles.summaryValue}>₹{Number(summary.overallIncome).toLocaleString('en-IN')}</Text>
                <Text style={styles.summaryLabel}>Overall Sales</Text>
                 {/* REMOVED: Comparison text to ensure consistent card size */}
              </View>
              <View style={[styles.summaryCard, theme.shadow, { marginLeft: theme.spacing.md }]}>
                <View style={styles.summaryHeader}>
                  <View style={[styles.summaryIconContainer, { backgroundColor: `${theme.colors.danger}20`}]}>
                    <Icon name="trending-down" size={24} color={theme.colors.danger} />
                  </View>
                  <Text style={[styles.summaryGrowth, { color: expenseChange <= 0 ? theme.colors.success : theme.colors.danger }]}>
                    {expenseChange >= 0 ? '+' : ''}{expenseChange.toFixed(1)}%
                  </Text>
                </View>
                <Text style={styles.summaryValue}>₹{Number(summary.overallExpenses).toLocaleString('en-IN')}</Text>
                <Text style={styles.summaryLabel}>Overall Expenses</Text>
                 {/* REMOVED: Comparison text to ensure consistent card size */}
              </View>
            </View>
          </View>
        </ScrollView>
        
        {/* Page Indicators */}
        <View style={styles.summaryIndicators}>
          <Animated.View 
            style={[
              styles.summaryIndicator, 
              { 
                opacity: summaryScrollX.interpolate({
                  inputRange: [0, screenWidth],
                  outputRange: [1, 0.3],
                  extrapolate: 'clamp',
                })
              }
            ]} 
          />
          <Animated.View 
            style={[
              styles.summaryIndicator, 
              { 
                opacity: summaryScrollX.interpolate({
                  inputRange: [0, screenWidth],
                  outputRange: [0.3, 1],
                  extrapolate: 'clamp',
                })
              }
            ]} 
          />
        </View>
      </View>
    );
  };

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
        <View style={{ flexDirection: 'row' }}>
          <TouchableOpacity 
            style={styles.headerButton} 
            onPress={() => navigation.navigate('NotificationScreen')}
          >
            <Icon name="notifications" size={28} color={theme.colors.text} />
            {unreadNotificationCount > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>{unreadNotificationCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.mainContent} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={theme.typography.h1}>
            Good Morning {business?.name?.trim().split(' ')[0] || 'User'}!
          </Text>
          <Text style={theme.typography.body}>{t('home.overview')}</Text>
        </View>

        {/* SUMMARY CARDS */}
        {renderSummaryCards()}

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
          <View style={styles.sectionHeader}>
            <Text style={theme.typography.h2}>{t('home.activityFeed')}</Text>
            <TouchableOpacity onPress={() => navigation.navigate('LedgerScreen')}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          <View style={[styles.card, { paddingVertical: theme.spacing.sm }]}>
            {activityData.length > 0 ? (
              <FlatList
                data={activityData}
                keyExtractor={(item) => item.id}
                renderItem={renderActivityItem}
                ItemSeparatorComponent={() => <View style={styles.divider} />}
                scrollEnabled={false}
              />
            ) : (
              <View style={styles.emptyState}>
                <Icon name="assessment" size={48} color={theme.colors.subtleText} />
                <Text style={styles.emptyStateText}>No recent activity</Text>
                <Text style={styles.emptyStateSubtext}>Start by adding your first transaction</Text>
              </View>
            )}
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
  headerTitle: { fontFamily: 'Poppins-Bold', fontSize: 24, color: theme.colors.primary, marginLeft: 0 },
  notificationBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: theme.colors.danger,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.background,
    paddingHorizontal: 4,
  },
  notificationBadgeText: { color: theme.colors.white, fontSize: 10, fontFamily: 'Poppins-Bold' },
  mainContent: { flex: 1 },
  section: { paddingHorizontal: theme.spacing.lg, marginBottom: theme.spacing.xl },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  viewAllText: {
    ...theme.typography.label,
    color: theme.colors.primary,
    fontFamily: 'Poppins-SemiBold',
  },
  card: { backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.md, padding: theme.spacing.lg, ...theme.shadow },

  // Summary
  summaryContainer: { marginBottom: theme.spacing.xl, },
  summaryPage: { paddingHorizontal: theme.spacing.lg },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between',marginBottom: theme.spacing.md },
  summaryCard: { flex: 1, backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.md, padding: theme.spacing.lg,height: 175 },
  summaryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.sm },
  summaryIconContainer: { width: 44, height: 44, borderRadius: theme.borderRadius.full, justifyContent: 'center', alignItems: 'center' },
  summaryValue: { ...theme.typography.h1, fontSize: 24, marginVertical: theme.spacing.xs },
  summaryLabel: { ...theme.typography.subtext },
  summaryGrowth: { ...theme.typography.label, fontFamily: 'Poppins-SemiBold' },
  // REMOVED: summaryCompareText style is no longer needed but kept here for reference if you want to add it back.
  summaryCompareText: { 
    ...theme.typography.label, 
    fontSize: 10, 
    color: theme.colors.subtleText, 
    marginTop: theme.spacing.xs 
  },
  summaryIndicators: { 
    flexDirection: 'row', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginTop: theme.spacing.md, 
    gap: theme.spacing.sm 
  },
  summaryIndicator: { 
    width: 8, 
    height: 8, 
    borderRadius: 4, 
    backgroundColor: theme.colors.primary 
  },
  
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
  activityMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  activityCategory: { 
    ...theme.typography.label, 
    fontSize: 11, 
    color: theme.colors.primary,
    backgroundColor: `${theme.colors.primary}15`,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: theme.spacing.sm,
  },
  activityTime: { ...theme.typography.subtext, fontSize: 11 },
  activityAmount: { fontFamily: 'Poppins-SemiBold', fontSize: 15 },
  divider: { height: 1, backgroundColor: theme.colors.border, marginHorizontal: theme.spacing.lg },
  emptyState: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
  },
  emptyStateText: {
    ...theme.typography.body,
    color: theme.colors.text,
    marginTop: theme.spacing.md,
    fontFamily: 'Poppins-Medium',
  },
  emptyStateSubtext: {
    ...theme.typography.subtext,
    textAlign: 'center',
    marginTop: theme.spacing.xs,
  },

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