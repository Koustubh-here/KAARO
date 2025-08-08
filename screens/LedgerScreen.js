/**
 * LedgerScreen.js
 * A clear and organized screen for viewing financial transactions.
 * Adheres to the KAARO design system for a cohesive app experience.
 */

import React, { useState, useMemo } from 'react';
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
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

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
const FILTERS = ['All', 'Income', 'Expenses'];

const ALL_TRANSACTIONS = [
  { id: '1', type: 'Income', description: 'Sale to Customer #1234', category: 'Product Sale', date: '2024-08-15', amount: 2500 },
  { id: '2', type: 'Expenses', description: 'Office Supplies Purchase', category: 'Operating Cost', date: '2024-08-15', amount: 850 },
  { id: '3', type: 'Income', description: 'Sale to R. Sharma', category: 'Product Sale', date: '2024-08-14', amount: 4999 },
  { id: '4', type: 'Expenses', description: 'Marketing Subscription', category: 'Software', date: '2024-08-14', amount: 1500 },
  { id: '5', type: 'Expenses', description: 'Rent Payment - August', category: 'Fixed Cost', date: '2024-08-13', amount: 15000 },
  { id: '6', type: 'Income', description: 'Consulting Service', category: 'Services', date: '2024-08-12', amount: 7500 },
  { id: '7', type: 'Expenses', description: 'Team Lunch', category: 'Employee Expense', date: '2024-08-12', amount: 2200 },
];

const LedgerScreen = ({ navigation }) => {
  const [activeFilter, setActiveFilter] = useState('All');

  const { filteredTransactions, totalIncome, totalExpenses } = useMemo(() => {
    let transactions = ALL_TRANSACTIONS;
    let income = 0;
    let expenses = 0;

    ALL_TRANSACTIONS.forEach(t => {
      if (t.type === 'Income') income += t.amount;
      else expenses += t.amount;
    });

    if (activeFilter !== 'All') {
      transactions = transactions.filter(t => t.type === activeFilter);
    }

    return { filteredTransactions: transactions, totalIncome: income, totalExpenses: expenses };
  }, [activeFilter]);

  const renderTransactionItem = ({ item }) => {
    const isIncome = item.type === 'Income';
    const amountColor = isIncome ? theme.colors.success : theme.colors.danger;
    const iconName = isIncome ? 'arrow-upward' : 'arrow-downward';
    const formattedAmount = `${isIncome ? '+' : '-'} ₹${item.amount.toLocaleString('en-IN')}`;

    return (
      <TouchableOpacity style={styles.transactionItem}>
        <View style={[styles.transactionIconContainer, { backgroundColor: `${amountColor}20` }]}>
          <Icon name={iconName} size={24} color={amountColor} />
        </View>
        <View style={styles.transactionInfo}>
          <Text style={styles.transactionDescription}>{item.description}</Text>
          <Text style={styles.transactionCategory}>{item.category} • {item.date}</Text>
        </View>
        <Text style={[styles.transactionAmount, { color: amountColor }]}>{formattedAmount}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />
      
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Icon name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={theme.typography.h1}>Ledger</Text>
        <TouchableOpacity 
          style={styles.addButton} 
          onPress={() => {
            Alert.alert(
              'Add Transaction',
              'Choose transaction type',
              [
                { text: 'Income', onPress: () => navigation.navigate('AddTransactionScreen', { type: 'Income' }) },
                { text: 'Expense', onPress: () => navigation.navigate('AddTransactionScreen', { type: 'Expense' }) },
                { text: 'Cancel', style: 'cancel' }
              ]
            );
          }}
        >
          <Icon name="add" size={32} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, theme.shadow, { marginRight: theme.spacing.md }]}>
          <Text style={styles.summaryLabel}>Total Income</Text>
          <Text style={styles.summaryValueIncome}>₹{totalIncome.toLocaleString('en-IN')}</Text>
        </View>
        <View style={[styles.summaryCard, theme.shadow]}>
          <Text style={styles.summaryLabel}>Total Expenses</Text>
          <Text style={styles.summaryValueExpense}>₹{totalExpenses.toLocaleString('en-IN')}</Text>
        </View>
      </View>

      <View style={styles.filterContainer}>
        {FILTERS.map(filter => {
          const isActive = filter === activeFilter;
          return (
            <TouchableOpacity
              key={filter}
              style={[styles.filterButton, isActive && styles.filterButtonActive]}
              onPress={() => setActiveFilter(filter)}
            >
              <Text style={[styles.filterButtonText, isActive && styles.filterButtonTextActive]}>
                {filter}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.transactionListContainer}>
        <Text style={styles.sectionTitle}>Recent Transactions</Text>
        <FlatList
          data={filteredTransactions}
          renderItem={renderTransactionItem}
          keyExtractor={item => item.id}
          contentContainerStyle={{ paddingBottom: theme.spacing.xl }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyStateContainer}>
                <Icon name="receipt-long" size={64} color={theme.colors.border} />
                <Text style={styles.emptyStateText}>No transactions found.</Text>
                <Text style={styles.emptyStateSubtext}>Add a new transaction to get started.</Text>
            </View>
          }
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
    paddingBottom: theme.spacing.sm,
  },
  backButton: {
    padding: theme.spacing.sm,
    marginLeft: -theme.spacing.sm,
  },
  addButton: {
    padding: theme.spacing.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.sm,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
  },
  summaryLabel: {
    ...theme.typography.subtext,
    fontFamily: 'Poppins-Medium',
  },
  summaryValueIncome: {
    ...theme.typography.h2,
    color: theme.colors.success,
    marginTop: theme.spacing.xs,
  },
  summaryValueExpense: {
    ...theme.typography.h2,
    color: theme.colors.danger,
    marginTop: theme.spacing.xs,
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
  },
  filterButton: {
    backgroundColor: theme.colors.surface,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.full,
    marginHorizontal: theme.spacing.xs,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  filterButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  filterButtonText: {
    ...theme.typography.subtext,
    color: theme.colors.text,
    fontFamily: 'Poppins-Medium',
  },
  filterButtonTextActive: {
    color: theme.colors.white,
  },
  transactionListContainer: {
    flex: 1,
  },
  sectionTitle: {
    ...theme.typography.h2,
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    ...theme.shadow,
  },
  transactionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  transactionInfo: {
    flex: 1,
    marginHorizontal: theme.spacing.md,
  },
  transactionDescription: {
    ...theme.typography.body,
    color: theme.colors.text,
    fontFamily: 'Poppins-Medium',
    fontSize: 15,
  },
  transactionCategory: {
    ...theme.typography.subtext,
    fontSize: 13,
  },
  transactionAmount: {
    ...theme.typography.h2,
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: '15%',
  },
  emptyStateText: {
    ...theme.typography.h2,
    marginTop: theme.spacing.md,
    color: theme.colors.subtleText,
  },
  emptyStateSubtext: {
    ...theme.typography.body,
    marginTop: theme.spacing.sm,
    textAlign: 'center',
    color: theme.colors.subtleText,
  },
});

export default LedgerScreen;