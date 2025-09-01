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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../context/ThemeContext'; // ADDED

const NotificationScreen = ({ navigation }) => {
  const { theme } = useTheme(); // ADDED
  const { t } = useI18n();
  const { business } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState('all'); // all, low_stock, system

  const loadNotifications = useCallback(async () => {
    if (!business?.id) return;
    
    try {
      setRefreshing(true);

      const clearedIdsString = await AsyncStorage.getItem(`cleared_notifications_${business.id}`);
      const clearedIds = clearedIdsString ? new Set(JSON.parse(clearedIdsString)) : new Set();
      
      const readIdsString = await AsyncStorage.getItem(`read_notifications_${business.id}`);
      const readIds = readIdsString ? new Set(JSON.parse(readIdsString)) : new Set();

      const { data: lowStockProducts, error: stockError } = await supabase
        .from('products')
        .select('id, name, quantity, low_stock_threshold, category')
        .eq('business_id', business.id)
        .lt('quantity', 20);
      
      let allNotifications = [];
      
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

      const { data: recentTransactions, error: txError } = await supabase
        .from('transactions')
        .select('*')
        .eq('business_id', business.id)
        .order('created_at', { ascending: false })
        .limit(5);

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

      let processedNotifications = allNotifications
        .filter(n => !clearedIds.has(n.id))
        .map(n => ({ ...n, read: readIds.has(n.id) }));

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
  }, [business?.id, theme.colors.warning, theme.colors.success, theme.colors.danger, theme.colors.primary]);

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

  const handleNotificationAction = (notification) => {
    if (notification.type === 'low_stock') {
      navigation.navigate('InventoryScreen');
    }
  };

  const markAsRead = async (notificationId) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId 
          ? { ...notif, read: true }
          : notif
      )
    );

    const readIdsString = await AsyncStorage.getItem(`read_notifications_${business.id}`);
    const readIds = readIdsString ? new Set(JSON.parse(readIdsString)) : new Set();
    readIds.add(notificationId);
    await AsyncStorage.setItem(`read_notifications_${business.id}`, JSON.stringify([...readIds]));
  };

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
              const idsToClear = notifications.map(n => n.id);
              const clearedIdsString = await AsyncStorage.getItem(`cleared_notifications_${business.id}`);
              const clearedIds = clearedIdsString ? new Set(JSON.parse(clearedIdsString)) : new Set();
              idsToClear.forEach(id => clearedIds.add(id));
              await AsyncStorage.setItem(`cleared_notifications_${business.id}`, JSON.stringify([...clearedIds]));
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
      style={[
        styles.notificationItem, 
        { backgroundColor: theme.colors.surface },
        theme.shadow,
        item.read && { opacity: 0.7, backgroundColor: theme.colors.background }
      ]}
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
          <Text style={[styles.notificationTitle, { color: theme.colors.text }]}>{item.title}</Text>
          <Text style={[styles.notificationTime, { color: theme.colors.subtleText }]}>
            {new Date(item.timestamp).toLocaleTimeString('en-IN', {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </Text>
        </View>
        <Text style={[styles.notificationMessage, { color: theme.colors.subtleText }]}>{item.message}</Text>
        <View style={styles.notificationFooter}>
          <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(item.priority) }]}>
            <Text style={[styles.priorityText, { color: theme.colors.white }]}>{item.priority}</Text>
          </View>
        </View>
      </View>
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
      style={[
        styles.tabButton, 
        { backgroundColor: theme.colors.background },
        selectedTab === tabId && { backgroundColor: theme.colors.primary }
      ]}
      onPress={() => setSelectedTab(tabId)}
    >
      <Text style={[
        styles.tabButtonText, 
        { color: theme.colors.text },
        selectedTab === tabId && { color: theme.colors.white }
      ]}>
        {label}
      </Text>
      {count > 0 && (
        <View style={[styles.countBadge, { backgroundColor: theme.colors.primary, borderColor: theme.colors.white }]}>
          <Text style={[styles.countBadgeText, { color: theme.colors.white }]}>{count}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Icon name="notifications-none" size={64} color={theme.colors.subtleText} />
      <Text style={[styles.emptyStateTitle, { color: theme.colors.text }]}>No notifications</Text>
      <Text style={[styles.emptyStateMessage, { color: theme.colors.subtleText }]}>
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
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar 
        barStyle={theme.dark ? "light-content" : "dark-content"} 
        backgroundColor={theme.colors.surface}
        translucent={false}
      />
      
      <View style={[styles.header, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Icon name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Notifications</Text>
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

      <View style={[styles.tabContainer, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border }]}>
        {renderTabButton('all', 'All', totalCount)}
        {renderTabButton('low_stock', 'Low Stock', lowStockCount)}
        {renderTabButton('system', 'System', systemCount)}
      </View>

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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    paddingTop: 25,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
    minWidth: 40,
  },
  headerTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 20,
    flex: 1,
    textAlign: 'center',
  },
  clearButton: {
    padding: 4,
    minWidth: 40, 
    alignItems: 'flex-end',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginHorizontal: 4,
    borderRadius: 8,
  },
  tabButtonText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
  },
  countBadge: {
    borderRadius: 999,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
    borderWidth: 1,
  },
  countBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  notificationsList: {
    flex: 1,
  },
  notificationsContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  notificationItem: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'flex-start',
    position: 'relative',
    borderLeftWidth: 4,
    borderLeftColor: 'transparent',
  },
  notificationIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  notificationTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    flex: 1,
  },
  notificationTime: {
    fontFamily: 'Poppins-Medium',
    fontSize: 12,
  },
  notificationMessage: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    marginBottom: 8,
    lineHeight: 20,
  },
  notificationFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyStateTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 20,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateMessage: {
    fontFamily: 'Poppins-Regular',
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 32,
    lineHeight: 22,
  },
});

export default NotificationScreen;