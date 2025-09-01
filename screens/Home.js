/**
 * Home.js
 * A premium, user-centric dashboard providing an elegant and intuitive
 * overview of business performance. Designed for clarity and delight.
 */
import React, { useState, useRef, useCallback, useEffect } from 'react';
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
  BackHandler,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useI18n } from '../i18n/I18nProvider';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { useFocusEffect } from '@react-navigation/native';
import { runAgent } from '../lib/agent/agent';
import { useTheme } from '../context/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const Home = ({ navigation, route }) => {
  const { theme } = useTheme();
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
  const [summaryIndex, setSummaryIndex] = useState(0);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);

  const sidebarAnimation = useRef(new Animated.Value(-350)).current;
  const chatAnimation = useRef(new Animated.Value(screenHeight)).current;
  const fabAnimation = useRef(new Animated.Value(1)).current;
  const summaryScrollX = useRef(new Animated.Value(0)).current;
  const pulseAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnimation, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnimation]);


  useEffect(() => {
    const handleBackPress = () => {
      if (chatVisible) {
        toggleChat();
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackPress);

    return () => backHandler.remove();
  }, [chatVisible]);


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

  const loadNotificationCount = useCallback(async () => {
    if (!business?.id) return;
    try {
      const { data: lowStockProducts, error } = await supabase
        .from('products')
        .select('id')
        .eq('business_id', business.id)
        .lt('quantity', 20);

      if (error || !lowStockProducts) {
        setUnreadNotificationCount(0);
        return;
      }

      const clearedIdsString = await AsyncStorage.getItem(`cleared_notifications_${business.id}`);
      const clearedIds = clearedIdsString ? new Set(JSON.parse(clearedIdsString)) : new Set();

      const readIdsString = await AsyncStorage.getItem(`read_notifications_${business.id}`);
      const readIds = readIdsString ? new Set(JSON.parse(readIdsString)) : new Set();

      const unreadCount = lowStockProducts.filter(product => {
        const notificationId = `low_stock_${product.id}`;
        return !clearedIds.has(notificationId) && !readIds.has(notificationId);
      }).length;

      setUnreadNotificationCount(unreadCount);

    } catch (err) {
      console.log('Error loading notification count:', err);
      setUnreadNotificationCount(0);
    }
  }, [business?.id]);

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

  const calculatePercentageChange = (current, previous) => {
    if (!previous || previous === 0) {
      return current > 0 ? 100 : 0;
    }
    return ((current - previous) / previous) * 100;
  };

  const toggleSidebar = () => {
    const toValue = sidebarVisible ? -350 : 0;
    const fabToValue = sidebarVisible ? 1 : 0;

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
    setChatVisible(!chatVisible);

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
      await load();
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

    const { data: todayTx } = await supabase
      .from('transactions')
      .select('*')
      .eq('business_id', business.id)
      .eq('date', today);

    const { data: yesterdayTx } = await supabase
      .from('transactions')
      .select('*')
      .eq('business_id', business.id)
      .eq('date', yesterday);

    const { data: allTx } = await supabase
      .from('transactions')
      .select('*')
      .eq('business_id', business.id)
      .order('created_at', { ascending: false });

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
  }, [business?.id, theme.colors.success, theme.colors.danger]);

  useFocusEffect(
    useCallback(() => {
      setSelectedTab('Home');
      load();
      loadUserProfile();
      loadNotificationCount();
      const openId = route?.params?.openConversationId;
      if (openId) {
        setActiveConversationId(openId);
        setChatVisible(true);
        Animated.spring(chatAnimation, { toValue: 0, useNativeDriver: true, tension: 80, friction: 12 }).start();
        loadConversationMessages(openId);
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
    { title: t('home.sidebar.settings'), route: 'GeneralSettings', icon: 'settings' }
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
        navigation.navigate('InventoryScreen');
      }
    },
    {
      title: t('home.newReport'),
      icon: 'assessment',
      action: () => {
        navigation.navigate('ReportsScreen');
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

  const renderActivityItem = ({ item }) => (
    <View style={styles.activityItem}>
      <View style={[styles.activityIconContainer, { backgroundColor: `${item.color}20` }]}>
        <Icon name={item.icon} size={20} color={item.color} />
      </View>
      <View style={styles.activityContent}>
        <Text style={[styles.activityTitle, { color: theme.colors.text }]}>{item.title}</Text>
        <View style={styles.activityMeta}>
          <Text style={[styles.activityCategory, { color: theme.colors.primary, backgroundColor: `${theme.colors.primary}15` }]}>{item.category}</Text>
          <Text style={[styles.activityTime, { color: theme.colors.subtleText }]}>{item.time}</Text>
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
      navigation.navigate(`${item.route}Screen`);
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
    <Animated.View style={[styles.sidebar, { transform: [{ translateX: sidebarAnimation }], backgroundColor: theme.colors.background }]}>
      <View style={[styles.sidebarHeader, { borderBottomColor: theme.colors.border }]}>
        <View style={[styles.profileAvatar, { backgroundColor: theme.colors.primary }]}>
          <Text style={[styles.profileInitial, { color: theme.colors.white }]}>{getUserInitials()}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.profileName, { color: theme.colors.text }]}>
            {userProfile?.name || business?.name || 'User'}
          </Text>
          <Text style={[styles.profileEmail, { color: theme.colors.subtleText }]}>
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
            <Text style={[styles.sidebarItemText, { color: theme.colors.text }]}>{item.title}</Text>
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
    <Animated.View style={[styles.chatContainer, { transform: [{ translateY: chatAnimation }], backgroundColor: theme.colors.surface }]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={[styles.chatHeader, { backgroundColor: theme.colors.primary }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={styles.chatBotAvatar}><Icon name="smart-toy" size={24} color={theme.colors.white} /></View>
            <View>
              <Text style={[styles.chatHeaderTitle, { color: theme.colors.white }]}>{t('home.chat.botName')}</Text>
              <Text style={[styles.chatHeaderSubtitle, { color: `${theme.colors.white}99` }]}>{t('home.chat.online')}</Text>
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
            <View style={[styles.messageContainer, item.isBot ? [styles.botMessage, { backgroundColor: theme.colors.background }] : [styles.userMessage, { backgroundColor: theme.colors.primary }]]}>
              <Text style={[styles.messageText, { color: item.isBot ? theme.colors.text : theme.colors.white }]}>{item.text}</Text>
            </View>
          )}
        />
        <View style={[styles.chatInputContainer, { borderTopColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
          <TextInput
            style={[styles.chatInput, { backgroundColor: theme.colors.background, color: theme.colors.text }]}
            placeholder={t('home.chat.inputPlaceholder')}
            placeholderTextColor={theme.colors.subtleText}
            value={chatMessage}
            onChangeText={setChatMessage}
            multiline
          />
          <TouchableOpacity style={[styles.chatSendButton, { backgroundColor: theme.colors.primary }, !chatMessage.trim() && { opacity: 0.5 }]} onPress={sendMessage} disabled={!chatMessage.trim()}>
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
              <View style={[styles.summaryCard, theme.shadow, { backgroundColor: theme.colors.surface }]}>
                <View style={styles.summaryHeader}>
                  <View style={[styles.summaryIconContainer, { backgroundColor: `${theme.colors.success}20` }]}>
                    <Icon name="trending-up" size={24} color={theme.colors.success} />
                  </View>
                  <Text style={[styles.summaryGrowth, { color: incomeChange >= 0 ? theme.colors.success : theme.colors.danger }]}>
                    {incomeChange >= 0 ? '+' : ''}{incomeChange.toFixed(1)}%
                  </Text>
                </View>
                <Text style={[styles.summaryValue, { color: theme.colors.text }]}>₹{Number(summary.todayIncome).toLocaleString('en-IN')}</Text>
                <Text style={[styles.summaryLabel, { color: theme.colors.subtleText }]}>{t('home.todaysSales')}</Text>
              </View>
              <View style={[styles.summaryCard, theme.shadow, { marginLeft: theme.spacing.md, backgroundColor: theme.colors.surface }]}>
                <View style={styles.summaryHeader}>
                  <View style={[styles.summaryIconContainer, { backgroundColor: `${theme.colors.danger}20` }]}>
                    <Icon name="trending-down" size={24} color={theme.colors.danger} />
                  </View>
                  <Text style={[styles.summaryGrowth, { color: expenseChange <= 0 ? theme.colors.success : theme.colors.danger }]}>
                    {expenseChange >= 0 ? '+' : ''}{expenseChange.toFixed(1)}%
                  </Text>
                </View>
                <Text style={[styles.summaryValue, { color: theme.colors.text }]}>₹{Number(summary.todayExpenses).toLocaleString('en-IN')}</Text>
                <Text style={[styles.summaryLabel, { color: theme.colors.subtleText }]}>{t('home.todaysExpenses')}</Text>
              </View>
            </View>
          </View>

          {/* Overall Summary */}
          <View style={[styles.summaryPage, { width: screenWidth }]}>
            <View style={styles.summaryRow}>
              <View style={[styles.summaryCard, theme.shadow, { backgroundColor: theme.colors.surface }]}>
                <View style={styles.summaryHeader}>
                  <View style={[styles.summaryIconContainer, { backgroundColor: `${theme.colors.success}20` }]}>
                    <Icon name="trending-up" size={24} color={theme.colors.success} />
                  </View>
                  <Text style={[styles.summaryGrowth, { color: incomeChange >= 0 ? theme.colors.success : theme.colors.danger }]}>
                    {incomeChange >= 0 ? '+' : ''}{incomeChange.toFixed(1)}%
                  </Text>
                </View>
                <Text style={[styles.summaryValue, { color: theme.colors.text }]}>₹{Number(summary.overallIncome).toLocaleString('en-IN')}</Text>
                <Text style={[styles.summaryLabel, { color: theme.colors.subtleText }]}>Overall Sales</Text>
              </View>
              <View style={[styles.summaryCard, theme.shadow, { marginLeft: theme.spacing.md, backgroundColor: theme.colors.surface }]}>
                <View style={styles.summaryHeader}>
                  <View style={[styles.summaryIconContainer, { backgroundColor: `${theme.colors.danger}20` }]}>
                    <Icon name="trending-down" size={24} color={theme.colors.danger} />
                  </View>
                  <Text style={[styles.summaryGrowth, { color: expenseChange <= 0 ? theme.colors.success : theme.colors.danger }]}>
                    {expenseChange >= 0 ? '+' : ''}{expenseChange.toFixed(1)}%
                  </Text>
                </View>
                <Text style={[styles.summaryValue, { color: theme.colors.text }]}>₹{Number(summary.overallExpenses).toLocaleString('en-IN')}</Text>
                <Text style={[styles.summaryLabel, { color: theme.colors.subtleText }]}>Overall Expenses</Text>
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
                backgroundColor: theme.colors.primary,
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
                backgroundColor: theme.colors.primary,
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
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle={theme.dark ? "light-content" : "dark-content"} backgroundColor={theme.colors.background} />

      {sidebarVisible && <TouchableOpacity style={styles.overlay} onPress={toggleSidebar} activeOpacity={1} />}
      {renderSidebar()}

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={toggleSidebar} style={styles.headerButton}>
          <Icon name="menu" size={28} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.primary }]}>kaaro</Text>
        <View style={{ flexDirection: 'row' }}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.navigate('NotificationScreen')}
          >
            <Icon name="notifications" size={28} color={theme.colors.text} />
            {unreadNotificationCount > 0 && (
              <View style={[styles.notificationBadge, { backgroundColor: theme.colors.danger, borderColor: theme.colors.background }]}>
                <Text style={[styles.notificationBadgeText, { color: theme.colors.white }]}>{unreadNotificationCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.mainContent} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={[theme.typography.h1, { color: theme.colors.text }]}>
            Good Morning {business?.name?.trim().split(' ')[0] || 'User'}!
          </Text>
          <Text style={[theme.typography.body, { color: theme.colors.subtleText }]}>{t('home.overview')}</Text>
        </View>

        {/* SUMMARY CARDS */}
        {renderSummaryCards()}

        {/* QUICK ACTIONS */}
        <View style={styles.section}>
          <Text style={[theme.typography.h2, { color: theme.colors.text }]}>{t('home.quickActions')}</Text>
          <View style={styles.quickActionsRow}>
            {quickActions.map(item => (
              <TouchableOpacity
                key={item.title}
                style={styles.quickAction}
                onPress={item.action}
                activeOpacity={0.7}
              >
                <View style={[styles.quickActionIconContainer, { backgroundColor: theme.colors.surface }, theme.shadow]}>
                  <Icon name={item.icon} size={28} color={theme.colors.primary} />
                </View>
                <Text style={[styles.quickActionLabel, { color: theme.colors.text }]}>{item.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ACTIVITY FEED */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[theme.typography.h2, { color: theme.colors.text }]}>{t('home.activityFeed')}</Text>
            <TouchableOpacity onPress={() => navigation.navigate('LedgerScreen')}>
              <Text style={[styles.viewAllText, { color: theme.colors.primary }]}>View All</Text>
            </TouchableOpacity>
          </View>
          <View style={[styles.card, { paddingVertical: theme.spacing.sm, backgroundColor: theme.colors.surface }, theme.shadow]}>
            {activityData.length > 0 ? (
              <FlatList
                data={activityData}
                keyExtractor={(item) => item.id}
                renderItem={renderActivityItem}
                ItemSeparatorComponent={() => <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />}
                scrollEnabled={false}
              />
            ) : (
              <View style={styles.emptyState}>
                <Icon name="assessment" size={48} color={theme.colors.subtleText} />
                <Text style={[styles.emptyStateText, { color: theme.colors.text }]}>No recent activity</Text>
                <Text style={[styles.emptyStateSubtext, { color: theme.colors.subtleText }]}>Start by adding your first transaction</Text>
              </View>
            )}
          </View>
        </View>

      </ScrollView>

      {/* FLOATING ACTION BUTTON */}
      <Animated.View style={[styles.fabContainer, { opacity: fabAnimation, transform: [{ scale: fabAnimation }] }]}>
        <Animated.View
          style={[
            styles.fabPulse,
            {
              backgroundColor: theme.colors.primary,
              transform: [
                {
                  scale: pulseAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 1.5],
                  }),
                },
              ],
              opacity: pulseAnimation.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [0.3, 0.5, 0],
              }),
            },
          ]}
        />
        <TouchableOpacity style={[styles.fab, { backgroundColor: theme.colors.primary }, theme.shadow]} onPress={toggleChat}>
          <Icon name="smart-toy" size={32} color={theme.colors.white} />
        </TouchableOpacity>
      </Animated.View>

      {/* BOTTOM NAVIGATION */}
      <View style={[styles.bottomNav, { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.border }]}>
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
            <Text style={[styles.bottomNavText, { color: theme.colors.subtleText }, selectedTab === item.route && { color: theme.colors.primary }]}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* CHAT INTERFACE */}
      {renderChat()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 8 : 24,
    paddingBottom: 16,
  },
  headerButton: { padding: 8 },
  headerTitle: { fontFamily: 'Pacifico-Regular', fontSize: 28 },
  notificationBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    paddingHorizontal: 4,
  },
  notificationBadgeText: { fontSize: 10, fontFamily: 'Poppins-Bold' },
  mainContent: { flex: 1 },
  section: { paddingHorizontal: 24, marginBottom: 32 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewAllText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 12,
  },
  card: { borderRadius: 16, padding: 24 },
  summaryContainer: { marginBottom: 32, },
  summaryPage: { paddingHorizontal: 24 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  summaryCard: { flex: 1, borderRadius: 16, padding: 24, height: 175 },
  summaryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  summaryIconContainer: { width: 44, height: 44, borderRadius: 999, justifyContent: 'center', alignItems: 'center' },
  summaryValue: { fontFamily: 'Poppins-Bold', fontSize: 24, marginVertical: 4 },
  summaryLabel: { fontFamily: 'Poppins-Regular', fontSize: 14 },
  summaryGrowth: { fontFamily: 'Poppins-SemiBold', fontSize: 12 },
  summaryCompareText: {
    fontSize: 10,
    marginTop: 4
  },
  summaryIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    gap: 8
  },
  summaryIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  quickActionsRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 16 },
  quickAction: { alignItems: 'center' },
  quickActionIconContainer: { width: 64, height: 64, borderRadius: 999, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  quickActionLabel: { fontFamily: 'Poppins-Medium', fontSize: 12 },
  activityItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16 },
  activityIconContainer: { width: 40, height: 40, borderRadius: 999, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  activityContent: { flex: 1 },
  activityTitle: { fontSize: 15, fontFamily: 'Poppins-Medium' },
  activityMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  activityCategory: {
    fontSize: 11,
    fontFamily: 'Poppins-Medium',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 8,
  },
  activityTime: { fontFamily: 'Poppins-Regular', fontSize: 11 },
  activityAmount: { fontFamily: 'Poppins-SemiBold', fontSize: 15 },
  divider: { height: 1, marginHorizontal: 24 },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyStateText: {
    marginTop: 16,
    fontFamily: 'Poppins-Medium',
    fontSize: 16,
  },
  emptyStateSubtext: {
    textAlign: 'center',
    marginTop: 4,
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
  },
  fabContainer: {
    position: 'absolute',
    bottom: 100,
    right: 24,
    zIndex: 1000,
    width: 64,
    height: 64,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fab: {
    width: 64,
    height: 64,
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fabPulse: {
    position: 'absolute',
    width: 64,
    height: 64,
    borderRadius: 999,
  },
  bottomNav: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingVertical: 8,
    paddingBottom: 21,
  },
  bottomNavItem: { flex: 1, alignItems: 'center' },
  bottomNavText: { fontFamily: 'Poppins-Medium', fontSize: 12, marginTop: 4 },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 998 },
  sidebar: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: 350,
    zIndex: 999,
    paddingBottom: 24,
  },
  sidebarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 24,
    borderBottomWidth: 1,
  },
  profileAvatar: {
    width: 48,
    height: 48,
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  profileInitial: { fontSize: 18, fontFamily: 'Poppins-Bold' },
  profileName: { fontSize: 18, fontFamily: 'Poppins-SemiBold' },
  profileEmail: { fontFamily: 'Poppins-Regular', fontSize: 14 },
  sidebarClose: { position: 'absolute', top: 60, right: 16, padding: 8 },
  sidebarItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 16 },
  sidebarItemText: { fontFamily: 'Poppins-Regular', fontSize: 16, marginLeft: 24 },
  sidebarLogout: { marginTop: 'auto' },
  chatContainer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1001, transform: [{ translateY: screenHeight }] },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  chatBotAvatar: { width: 40, height: 40, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  chatHeaderTitle: { fontFamily: 'Poppins-SemiBold', fontSize: 20 },
  chatHeaderSubtitle: { fontFamily: 'Poppins-Regular', fontSize: 14 },
  chatMessages: { flex: 1, paddingHorizontal: 24 },
  messageContainer: { maxWidth: '85%', marginBottom: 16, padding: 16, borderRadius: 16 },
  botMessage: { alignSelf: 'flex-start', borderTopLeftRadius: 8 },
  userMessage: { alignSelf: 'flex-end', borderTopRightRadius: 8 },
  messageText: { fontFamily: 'Poppins-Regular', fontSize: 16, lineHeight: 24 },
  chatInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
  },
  chatInput: {
    flex: 1,
    borderRadius: 999,
    paddingHorizontal: 24,
    paddingVertical: 16,
    fontFamily: 'Poppins-Regular',
    fontSize: 16,
    marginRight: 16,
  },
  chatSendButton: { width: 48, height: 48, borderRadius: 999, justifyContent: 'center', alignItems: 'center' },
});

export default Home;