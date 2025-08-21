/**
 * NotificationScreen.js
 * A dedicated screen for managing and viewing notifications
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  FlatList,
  StatusBar,
  RefreshControl,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useI18n } from '../i18n/I18nProvider';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { useFocusEffect } from '@react-navigation/native';
// ADDED: Import AsyncStorage for persistent state
import AsyncStorage from '@react-native-async-storage/async-storage';

// THEME & DESIGN SYSTEM =================================================
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

const NotificationScreen = ({ navigation }) => {
  const { t } = useI18n();
  const { business } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState('all'); // all, low_stock, system

  // Load notifications
  const loadNotifications = useCallback(async () => {
    if (!business?.id) return;
    
    try {
      setRefreshing(true);

      // ADDED: Get cleared and read notifications from storage
      const clearedIdsString = await AsyncStorage.getItem(`cleared_notifications_${business.id}`);
      const clearedIds = clearedIdsString ? new Set(JSON.parse(clearedIdsString)) : new Set();
      
      const readIdsString = await AsyncStorage.getItem(`read_notifications_${business.id}`);
      const readIds = readIdsString ? new Set(JSON.parse(readIdsString)) : new Set();

      // Get low stock products
      const { data: lowStockProducts, error: stockError } = await supabase
        .from('products')
        .select('id, name, quantity, low_stock_threshold, category')
        .eq('business_id', business.id)
        .lt('quantity', 20);
      
      let allNotifications = [];
      
      // Create low stock notifications
      if (!stockError && lowStockProducts) {
        const lowStockNotifs = lowStockProducts.map(product => ({
          id: `low_stock_${product.id}`,
          type: 'low_stock',
          title: 'Low Stock Alert',
          message: `${product.name} is running low (${product.quantity} items left)`,
          icon: 'warning',
          color: theme.colors.warning,
          timestamp: new Date().toISOString(),
          priority: 'high',
          product: product,
          actionable: true,
        }));
        allNotifications = [...allNotifications, ...lowStockNotifs];
      }

      // Get recent transactions for system notifications
      const { data: recentTransactions, error: txError } = await supabase
        .from('transactions')
        .select('*')
        .eq('business_id', business.id)
        .order('created_at', { ascending: false })
        .limit(5);

      // Create system notifications for recent large transactions
      if (!txError && recentTransactions) {
        const systemNotifs = recentTransactions
          .filter(tx => Number(tx.amount) > 10000)
          .map(tx => ({
            id: `transaction_${tx.id}`,
            type: 'system',
            title: 'Large Transaction',
            message: `${tx.type === 'income' ? 'Sale' : 'Expense'} of ₹${Number(tx.amount).toLocaleString('en-IN')} was recorded`,
            icon: tx.type === 'income' ? 'trending-up' : 'trending-down',
            color: tx.type === 'income' ? theme.colors.success : theme.colors.danger,
            timestamp: tx.created_at,
            priority: 'medium',
            actionable: false,
          }));
        allNotifications = [...allNotifications, ...systemNotifs];
      }

      // Add welcome notification if no data and it hasn't been cleared
      if (allNotifications.length === 0 && !clearedIds.has('welcome')) {
        allNotifications = [
          {
            id: 'welcome',
            type: 'system',
            title: 'Welcome to Your Dashboard',
            message: 'Start by adding your products and transactions to get personalized notifications.',
            icon: 'celebration',
            color: theme.colors.primary,
            timestamp: new Date().toISOString(),
            priority: 'low',
            actionable: false,
          }
        ];
      }

      // CHANGED: Filter out cleared notifications and apply read status
      let processedNotifications = allNotifications
        .filter(n => !clearedIds.has(n.id))
        .map(n => ({ ...n, read: readIds.has(n.id) }));

      // Sort notifications by priority and timestamp
      processedNotifications.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        }
        return new Date(b.timestamp) - new Date(a.timestamp);
      });

      setNotifications(processedNotifications);
      
    } catch (error) {
      console.log('Error loading notifications:', error);
    } finally {
      setRefreshing(false);
    }
  }, [business?.id]);

  // Filter notifications based on selected tab
  const getFilteredNotifications = () => {
    switch (selectedTab) {
      case 'low_stock':
        return notifications.filter(n => n.type === 'low_stock');
      case 'system':
        return notifications.filter(n => n.type === 'system');
      default:
        return notifications;
    }
  };

  // CHANGED: Handle notification action directly
  const handleNotificationAction = (notification) => {
    if (notification.type === 'low_stock') {
      // Directly navigate without an alert
      navigation.navigate('InventoryScreen');
    }
  };

  // CHANGED: Mark notification as read and save to persistent storage
  const markAsRead = async (notificationId) => {
    // Update UI immediately
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId 
          ? { ...notif, read: true }
          : notif
      )
    );

    // Persist the read state
    const readIdsString = await AsyncStorage.getItem(`read_notifications_${business.id}`);
    const readIds = readIdsString ? new Set(JSON.parse(readIdsString)) : new Set();
    readIds.add(notificationId);
    await AsyncStorage.setItem(`read_notifications_${business.id}`, JSON.stringify([...readIds]));
  };

  // CHANGED: Clear all notifications and save their IDs to prevent them from reappearing
  const clearAllNotifications = () => {
    Alert.alert(
      'Clear All Notifications',
      'Are you sure you want to clear all notifications?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear All', 
          style: 'destructive',
          onPress: async () => {
            try {
              // Get IDs of all current notifications
              const idsToClear = notifications.map(n => n.id);

              // Get existing cleared IDs
              const clearedIdsString = await AsyncStorage.getItem(`cleared_notifications_${business.id}`);
              const clearedIds = clearedIdsString ? new Set(JSON.parse(clearedIdsString)) : new Set();

              // Add new IDs to the set and save
              idsToClear.forEach(id => clearedIds.add(id));
              await AsyncStorage.setItem(`cleared_notifications_${business.id}`, JSON.stringify([...clearedIds]));
              
              // Clear from the UI
              setNotifications([]);
            } catch (error) {
              console.error('Failed to clear notifications:', error);
            }
          }
        }
      ]
    );
  };

  useFocusEffect(
    useCallback(() => {
      loadNotifications();
    }, [loadNotifications])
  );

  useEffect(() => {
    if (!business?.id) return;
    
    // Subscribe to real-time changes
    const channel = supabase
      .channel('notifications')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'products', 
        filter: `business_id=eq.${business.id}` 
      }, () => {
        loadNotifications();
      })
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'transactions', 
        filter: `business_id=eq.${business.id}` 
      }, () => {
        loadNotifications();
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [business?.id, loadNotifications]);

  const renderNotificationItem = ({ item }) => (
    <TouchableOpacity 
      style={[styles.notificationItem, item.read && styles.readNotification]}
      onPress={() => {
        markAsRead(item.id);
        if (item.actionable) {
          handleNotificationAction(item);
        }
      }}
      activeOpacity={0.7}
    >
      <View style={[styles.notificationIconContainer, { backgroundColor: `${item.color}20` }]}>
        <Icon name={item.icon} size={24} color={item.color} />
      </View>
      <View style={styles.notificationContent}>
        <View style={styles.notificationHeader}>
          <Text style={styles.notificationTitle}>{item.title}</Text>
          <Text style={styles.notificationTime}>
            {new Date(item.timestamp).toLocaleTimeString('en-IN', {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </Text>
        </View>
        <Text style={styles.notificationMessage}>{item.message}</Text>
        <View style={styles.notificationFooter}>
          <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(item.priority) }]}>
            <Text style={styles.priorityText}>{item.priority}</Text>
          </View>
          {/* REMOVED: "Tap to take action" text */}
        </View>
      </View>
      {/* REMOVED: Unread indicator (blue dot) */}
    </TouchableOpacity>
  );

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return theme.colors.danger;
      case 'medium': return theme.colors.warning;
      case 'low': return theme.colors.subtleText;
      default: return theme.colors.subtleText;
    }
  };

  const renderTabButton = (tabId, label, count) => (
    <TouchableOpacity
      key={tabId}
      style={[styles.tabButton, selectedTab === tabId && styles.activeTabButton]}
      onPress={() => setSelectedTab(tabId)}
    >
      <Text style={[styles.tabButtonText, selectedTab === tabId && styles.activeTabButtonText]}>
        {label}
      </Text>
      {count > 0 && (
        <View style={styles.countBadge}>
          <Text style={styles.countBadgeText}>{count}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Icon name="notifications-none" size={64} color={theme.colors.subtleText} />
      <Text style={styles.emptyStateTitle}>No notifications</Text>
      <Text style={styles.emptyStateMessage}>
        {selectedTab === 'all' 
          ? "You're all caught up! No new notifications to show."
          : `No ${selectedTab === 'low_stock' ? 'low stock' : 'system'} notifications at the moment.`}
      </Text>
    </View>
  );

  const filteredNotifications = getFilteredNotifications();
  const lowStockCount = notifications.filter(n => n.type === 'low_stock' && !n.read).length;
  const systemCount = notifications.filter(n => n.type === 'system' && !n.read).length;
  const totalCount = lowStockCount + systemCount;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar 
        barStyle="dark-content" 
        backgroundColor={theme.colors.background}
        translucent={false}
      />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Icon name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <TouchableOpacity 
          onPress={clearAllNotifications}
          style={styles.clearButton}
          disabled={notifications.length === 0}
        >
          <Icon 
            name="clear-all" 
            size={24} 
            color={notifications.length === 0 ? theme.colors.subtleText : theme.colors.text} 
          />
        </TouchableOpacity>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        {renderTabButton('all', 'All', totalCount)}
        {renderTabButton('low_stock', 'Low Stock', lowStockCount)}
        {renderTabButton('system', 'System', systemCount)}
      </View>

      {/* Notifications List */}
      <FlatList
        data={filteredNotifications}
        renderItem={renderNotificationItem}
        keyExtractor={(item) => item.id}
        style={styles.notificationsList}
        contentContainerStyle={styles.notificationsContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={loadNotifications}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
        ListEmptyComponent={renderEmptyState}
      />
    </SafeAreaView>
  );
};

// STYLES =================================================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    paddingTop:25,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    padding: theme.spacing.xs,
    // CHANGED: Aligned items by adding a placeholder width to balance the clear button
    minWidth: 40,
  },
  headerTitle: {
    ...theme.typography.h2,
    flex: 1,
    textAlign: 'center',
    // REMOVED: paddingTop: 28 to align title with buttons
  },
  clearButton: {
    padding: theme.spacing.xs,
    // CHANGED: Aligned items by adding a placeholder width to balance the back button
    minWidth: 40, 
    alignItems: 'flex-end',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    marginHorizontal: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.background,
  },
  activeTabButton: {
    backgroundColor: theme.colors.primary,
  },
  tabButtonText: {
    ...theme.typography.label,
    fontSize: 14,
    color: theme.colors.text,
  },
  activeTabButtonText: {
    color: theme.colors.white,
    fontWeight: '600',
  },
  countBadge: {
    backgroundColor: theme.colors.primary, // Changed to primary to avoid confusion with priority
    borderRadius: theme.borderRadius.full,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: theme.spacing.xs,
    borderWidth: 1,
    borderColor: theme.colors.white,
  },
  countBadgeText: {
    color: theme.colors.white,
    fontSize: 10,
    fontWeight: 'bold',
  },
  notificationsList: {
    flex: 1,
  },
  notificationsContent: {
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.md, // Added padding at the bottom
  },
  notificationItem: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'flex-start',
    ...theme.shadow,
    position: 'relative',
    borderLeftWidth: 4,
    borderLeftColor: 'transparent',
  },
  readNotification: {
    opacity: 0.7,
    backgroundColor: '#F5F5F5',
  },
  notificationIconContainer: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  notificationTitle: {
    ...theme.typography.h2,
    fontSize: 16,
    flex: 1,
  },
  notificationTime: {
    ...theme.typography.label,
    fontSize: 12,
    color: theme.colors.subtleText,
  },
  notificationMessage: {
    ...theme.typography.body,
    fontSize: 14,
    marginBottom: theme.spacing.sm,
    lineHeight: 20,
  },
  notificationFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priorityBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
  },
  priorityText: {
    color: theme.colors.white,
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  // REMOVED: actionableText style
  // REMOVED: unreadIndicator style
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xl * 2,
  },
  emptyStateTitle: {
    ...theme.typography.h2,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  emptyStateMessage: {
    ...theme.typography.body,
    textAlign: 'center',
    paddingHorizontal: theme.spacing.xl,
    lineHeight: 22,
  },
});

export default NotificationScreen;