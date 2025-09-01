/**
 * LedgerScreen.js
 * Final Interactive Dashboard version.
 * This version introduces interactive summary cards that open a detailed transaction modal.
 * The primary 'Add Transaction' button in the header has been restored for quick access.
 * The implementation uses a reusable modal component for a professional and maintainable codebase.
 * It maintains the KAARO design system for a premium look and feel.
 */

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  FlatList,
  StatusBar,
  Platform,
  Alert,
  Modal,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useI18n } from '../i18n/I18nProvider';
import { useAuth } from '../context/AuthContext';
import { listTransactions, sumTransactions } from '../lib/db';
import { supabase } from '../lib/supabaseClient';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext'; // ADDED

// --- Reusable Transaction Detail Modal ---
const TransactionDetailModal = ({ visible, onClose, title, transactions }) => {
  const { theme } = useTheme(); // ADDED for the modal component

  const renderDetailedItem = ({ item }) => {
    const isIncome = (item.type || '').toLowerCase() === 'income';
    const amountColor = isIncome ? theme.colors.success : theme.colors.danger;
    const formattedAmount = `${isIncome ? '+' : '-'} ₹${Number(item.amount || 0).toLocaleString('en-IN')}`;
    const formattedDate = new Date(item.date).toLocaleDateString('en-IN', {
      year: 'numeric', month: 'long', day: 'numeric'
    });

    return (
      <View style={[modalStyles.itemContainer, { borderBottomColor: theme.colors.border }]}>
        <View style={modalStyles.itemInfo}>
          <Text style={[modalStyles.itemDescription, { color: theme.colors.text }]}>{item.description}</Text>
          <Text style={[modalStyles.itemCategory, { color: theme.colors.subtleText }]}>{item.category || 'Uncategorized'}</Text>
        </View>
        <View style={modalStyles.itemAmountContainer}>
          <Text style={[modalStyles.itemAmount, { color: amountColor }]}>{formattedAmount}</Text>
          <Text style={[modalStyles.itemDate, { color: theme.colors.subtleText }]}>{formattedDate}</Text>
        </View>
      </View>
    );
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={[modalStyles.centeredView, { backgroundColor: theme.colors.modalBackdrop }]}>
        <View style={[modalStyles.modalView, { backgroundColor: theme.colors.surface }]}>
          <View style={modalStyles.header}>
            <Text style={[modalStyles.modalTitle, { color: theme.colors.text }]}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={modalStyles.closeButton}>
              <Icon name="close" size={24} color={theme.colors.subtleText} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={transactions}
            renderItem={renderDetailedItem}
            keyExtractor={item => item.id.toString()}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={<Text style={[modalStyles.emptyText, { color: theme.colors.subtleText }]}>No transactions to show.</Text>}
          />
        </View>
      </View>
    </Modal>
  );
};


const FILTERS = ['all', 'income', 'expense'];

const LedgerScreen = ({ navigation }) => {
  const { theme } = useTheme(); // ADDED for the main screen component
  const { t } = useI18n();
  const { business } = useAuth();
  const [activeFilter, setActiveFilter] = useState('all');
  const [transactions, setTransactions] = useState([]);
  const [totals, setTotals] = useState({ income: 0, expenses: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTab, setSelectedTab] = useState('Ledger');

  // State for the details modal
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalData, setModalData] = useState({ title: '', transactions: [] });

  const filterLabels = useMemo(() => ({
    all: t('ledger.filters.all'),
    income: t('ledger.filters.income'),
    expense: 'Expense',
  }), [t]);

  const load = useCallback(async () => {
    if (!business?.id) return;
    setIsLoading(true);
    const { data: tx, error } = await listTransactions(business.id);
    const { data: sums } = await sumTransactions(business.id);
    if (!error) setTransactions(tx || []);
    setTotals({ income: sums?.income || 0, expenses: sums?.expenses || 0 });
    setIsLoading(false);
  }, [business?.id]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  useEffect(() => {
    if (!business?.id) return;
    const channel = supabase
      .channel('ledger_tx')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions', filter: `business_id=eq.${business.id}` }, () => {
        load();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [business?.id, load]);

  const { filteredTransactions, totalIncome, totalExpenses } = useMemo(() => {
    let tx = transactions;
    if (activeFilter !== 'all') {
      tx = tx.filter(t => (t.type || '').toLowerCase() === activeFilter);
    }
    return { filteredTransactions: tx, totalIncome: totals.income, totalExpenses: totals.expenses };
  }, [activeFilter, transactions, totals]);

  const handleAddTransaction = (type) => {
    navigation.navigate('AddTransactionScreen', { type, contactName: 'Contact' });
  };

  const showTransactionDetails = (type) => {
    const data = transactions.filter(tx => (tx.type || '').toLowerCase() === type);
    setModalData({
      title: type === 'income' ? 'Income Transactions' : 'Expense Transactions',
      transactions: data
    });
    setIsModalVisible(true);
  };

  const netBalance = totalIncome - totalExpenses;
  const isPositiveBalance = netBalance >= 0;

  const bottomNavItems = [
    { route: 'Home', label: t('home.bottomNav.home'), icon: 'home' },
    { route: 'Inventory', label: t('home.bottomNav.inventory'), icon: 'inventory' },
    { route: 'Ledger', label: t('home.bottomNav.ledger'), icon: 'account-balance-wallet' },
    { route: 'CRM', label: t('home.bottomNav.crm'), icon: 'people' },
    { route: 'Reports', label: t('home.bottomNav.reports'), icon: 'assessment' },
  ];

  const renderTransactionItem = ({ item }) => {
    const isIncome = (item.type || '').toLowerCase() === 'income';
    const amountColor = isIncome ? theme.colors.success : theme.colors.danger;
    const iconName = isIncome ? 'trending-up' : 'trending-down';
    const formattedAmount = `₹${Number(item.amount || 0).toLocaleString('en-IN')}`;

    return (
      <TouchableOpacity style={[
        styles.transactionItem,
        { backgroundColor: theme.colors.surface, borderLeftColor: amountColor },
        theme.shadow,
      ]}>
        <View style={[styles.transactionIconContainer, {
          backgroundColor: isIncome ? theme.colors.successLight : theme.colors.dangerLight
        }]}>
          <Icon name={iconName} size={24} color={amountColor} />
        </View>
        <View style={styles.transactionInfo}>
          <Text style={[styles.transactionDescription, { color: theme.colors.text }]}>{item.description}</Text>
          <View style={styles.transactionMeta}>
            <Text style={[styles.transactionCategory, { color: theme.colors.subtleText }]}>{item.category}</Text>
            <View style={[styles.dot, { backgroundColor: theme.colors.subtleText }]} />
            <Text style={[styles.transactionDate, { color: theme.colors.subtleText }]}>{item.date}</Text>
          </View>
        </View>
        <View style={styles.amountContainer}>
          <Text style={[styles.transactionAmount, { color: amountColor }]}>
            {isIncome ? '+' : '-'}{formattedAmount}
          </Text>
          <Text style={[styles.transactionType, { color: theme.colors.subtleText }]}>{isIncome ? 'Income' : 'Expense'}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderListHeader = () => (
    <>
      <View style={[styles.overviewCard, { backgroundColor: theme.colors.surface }, theme.shadow]}>
        <View style={[styles.netBalanceSection, { borderBottomColor: theme.colors.border }]}>
          <Text style={[styles.netBalanceLabel, { color: theme.colors.subtleText }]}>Net Balance</Text>
          <Text style={[
            styles.netBalanceValue,
            { color: isPositiveBalance ? theme.colors.success : theme.colors.danger }
          ]}>
            ₹{Number(Math.abs(netBalance)).toLocaleString('en-IN')}
          </Text>
        </View>
        <View style={styles.financialStatsRow}>
          <TouchableOpacity
            style={[styles.statCard, { backgroundColor: theme.colors.successLight, borderColor: `${theme.colors.success}20` }]}
            onPress={() => showTransactionDetails('income')}
          >
            <View style={styles.statHeader}>
              <View style={[styles.statIconContainer, { backgroundColor: theme.colors.white }]}>
                <Icon name="arrow-upward" size={20} color={theme.colors.success} />
              </View>
            </View>
            <Text style={[styles.statValue, { color: theme.colors.text }]}>₹{Number(totalIncome).toLocaleString('en-IN')}</Text>
            <Text style={[styles.statLabel, { color: theme.colors.subtleText }]}>Total Income</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.statCard, { backgroundColor: theme.colors.dangerLight, borderColor: `${theme.colors.danger}20` }]}
            onPress={() => showTransactionDetails('expense')}
          >
            <View style={styles.statHeader}>
              <View style={[styles.statIconContainer, { backgroundColor: theme.colors.white }]}>
                <Icon name="arrow-downward" size={20} color={theme.colors.danger} />
              </View>
            </View>
            <Text style={[styles.statValue, { color: theme.colors.text }]}>₹{Number(totalExpenses).toLocaleString('en-IN')}</Text>
            <Text style={[styles.statLabel, { color: theme.colors.subtleText }]}>Total Expenses</Text>
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.filterSection}>
        <Text style={[styles.filterTitle, { color: theme.colors.subtleText }]}>Filter Transactions</Text>
        <View style={styles.filterContainer}>
          {FILTERS.map(filter => {
            const isActive = filter === activeFilter;
            return (
              <TouchableOpacity
                key={filter}
                style={[
                  styles.filterButton,
                  { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
                  isActive && { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary }
                ]}
                onPress={() => setActiveFilter(filter)}
              >
                <Text style={[
                  styles.filterButtonText,
                  { color: theme.colors.text },
                  isActive && { color: theme.colors.white }
                ]}>
                  {filterLabels[filter]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
      {filteredTransactions.length > 0 && (
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Recent Transactions</Text>
          <Text style={[styles.transactionCount, { color: theme.colors.subtleText }]}>
            {filteredTransactions.length} {filteredTransactions.length === 1 ? 'transaction' : 'transactions'}
          </Text>
        </View>
      )}
    </>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle={theme.dark ? "light-content" : "dark-content"} backgroundColor={theme.colors.background} />

      <TransactionDetailModal
        visible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        title={modalData.title}
        transactions={modalData.transactions}
      />

      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Icon name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[theme.typography.h1, { color: theme.colors.text }]}>{t('ledger.title')}</Text>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => {
            Alert.alert(
              'Add Transaction',
              'Choose transaction type',
              [
                { text: 'Add Income', onPress: () => handleAddTransaction('Income') },
                { text: 'Add Expense', onPress: () => handleAddTransaction('Expense') },
                { text: 'Cancel', style: 'cancel' }
              ]
            );
          }}
        >
          <Icon name="add-circle" size={28} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredTransactions}
        renderItem={renderTransactionItem}
        keyExtractor={item => item.id}
        ListHeaderComponent={renderListHeader}
        contentContainerStyle={{ paddingBottom: theme.spacing.xl }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyStateContainer}>
            <View style={[styles.emptyIconContainer, { backgroundColor: theme.colors.surface }]}>
              <Icon name="receipt-long" size={64} color={theme.colors.border} />
            </View>
            <Text style={[styles.emptyStateText, { color: theme.colors.subtleText }]}>
              {isLoading ? t('common.loading') : 'No transactions found'}
            </Text>
            {!isLoading && (
              <View style={styles.emptyStateActions}>
                <Text style={[styles.emptyStateSubtext, { color: theme.colors.subtleText }]}>Start tracking your finances</Text>
                <View style={styles.emptyStateButtons}>
                  <TouchableOpacity
                    style={[styles.emptyActionButton, { backgroundColor: theme.colors.success }, theme.shadow]}
                    onPress={() => handleAddTransaction('Income')}
                  >
                    <Icon name="add" size={18} color={theme.colors.white} />
                    <Text style={[styles.emptyActionText, { color: theme.colors.white }]}>Add Income</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.emptyActionButton, { backgroundColor: theme.colors.danger }, theme.shadow]}
                    onPress={() => handleAddTransaction('Expense')}
                  >
                    <Icon name="remove" size={18} color={theme.colors.white} />
                    <Text style={[styles.emptyActionText, { color: theme.colors.white }]}>Add Expense</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        }
      />

      {/* BOTTOM NAVIGATION */}
      <View style={[styles.bottomNav, { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.border }]}>
        {bottomNavItems.map((item) => (
          <TouchableOpacity
            key={item.route}
            style={styles.bottomNavItem}
            onPress={() => {
              setSelectedTab(item.route);
              if (item.route !== 'Ledger') {
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

// --- Stylesheets ---

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: Platform.OS === 'android' ? 24 : 8, paddingBottom: 16 },
  backButton: { padding: 8, marginLeft: -8 },
  menuButton: { padding: 8, marginRight: -8 },
  overviewCard: { marginHorizontal: 24, marginTop: 8, padding: 24, borderRadius: 24 },
  netBalanceSection: { alignItems: 'center', marginBottom: 24, paddingBottom: 24, borderBottomWidth: 1 },
  netBalanceLabel: { fontFamily: 'Poppins-Medium', fontSize: 14, marginBottom: 4 },
  netBalanceValue: { fontFamily: 'Poppins-Bold', fontSize: 32 },
  financialStatsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  statCard: { flex: 1, padding: 16, borderRadius: 16, marginHorizontal: 4, borderWidth: 1 },
  statHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  statIconContainer: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  statValue: { fontFamily: 'Poppins-Bold', fontSize: 18, marginBottom: 4 },
  statLabel: { fontFamily: 'Poppins-Medium', fontSize: 12 },
  filterSection: { paddingHorizontal: 24, marginVertical: 24 },
  filterTitle: { fontFamily: 'Poppins-Medium', fontSize: 14, marginBottom: 8 },
  filterContainer: { flexDirection: 'row', justifyContent: 'flex-start' },
  filterButton: { paddingVertical: 8, paddingHorizontal: 24, borderRadius: 999, marginRight: 16, borderWidth: 1 },
  filterButtonText: { fontFamily: 'Poppins-Medium', fontSize: 14 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: 24, marginBottom: 16 },
  sectionTitle: { fontFamily: 'Poppins-SemiBold', fontSize: 20 },
  transactionCount: { fontFamily: 'Poppins-Regular', fontSize: 14 },
  transactionItem: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 24, marginBottom: 8, padding: 16, borderRadius: 16, borderLeftWidth: 4 },
  transactionIconContainer: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  transactionInfo: { flex: 1, marginLeft: 16 },
  transactionDescription: { fontFamily: 'Poppins-Medium', fontSize: 15, marginBottom: 4 },
  transactionMeta: { flexDirection: 'row', alignItems: 'center' },
  transactionCategory: { fontSize: 13, fontFamily: 'Poppins-Regular' },
  dot: { width: 3, height: 3, borderRadius: 1.5, marginHorizontal: 4 },
  transactionDate: { fontSize: 13, fontFamily: 'Poppins-Regular' },
  amountContainer: { alignItems: 'flex-end' },
  transactionAmount: { fontFamily: 'Poppins-Bold', fontSize: 16, marginBottom: 2 },
  transactionType: { fontSize: 11, fontFamily: 'Poppins-Medium' },
  emptyStateContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: '20%' },
  emptyIconContainer: { width: 120, height: 120, borderRadius: 60, justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  emptyStateText: { fontFamily: 'Poppins-SemiBold', fontSize: 20, marginBottom: 8 },
  emptyStateActions: { alignItems: 'center' },
  emptyStateSubtext: { fontFamily: 'Poppins-Regular', fontSize: 16, marginBottom: 24, textAlign: 'center' },
  emptyStateButtons: { flexDirection: 'row', gap: 16 },
  emptyActionButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 16, borderRadius: 999 },
  emptyActionText: { fontFamily: 'Poppins-Medium', marginLeft: 4 },
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

const modalStyles = StyleSheet.create({
  centeredView: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  modalView: { width: '90%', maxHeight: '75%', borderRadius: 24, padding: 24 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontFamily: 'Poppins-SemiBold', fontSize: 20 },
  closeButton: { padding: 4 },
  itemContainer: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 16, borderBottomWidth: 1 },
  itemInfo: { flex: 1, marginRight: 8 },
  itemDescription: { fontFamily: 'Poppins-Medium', fontSize: 15 },
  itemCategory: { fontFamily: 'Poppins-Regular', fontSize: 14, marginTop: 4 },
  itemAmountContainer: { alignItems: 'flex-end' },
  itemAmount: { fontFamily: 'Poppins-Bold', fontSize: 15 },
  itemDate: { fontFamily: 'Poppins-Medium', fontSize: 12, marginTop: 4 },
  emptyText: { fontFamily: 'Poppins-Regular', fontSize: 16, textAlign: 'center', padding: 24 },
});

export default LedgerScreen;