/**
 * ReportsScreen.js
 * A comprehensive screen for generating, viewing, and sharing business reports.
 * Features real database integration with transactions table.
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
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useI18n } from '../i18n/I18nProvider';
import { listTransactions, listProducts, sumTransactions, getOrCreateBusinessForUser } from '../lib/db';
import { supabase } from '../lib/supabaseClient';

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

// REPORT CONFIG
const REPORT_TYPES = [
  { key: 'sales', icon: 'trending-up', type: 'income' },
  { key: 'expense', icon: 'trending-down', type: 'expense' },
  { key: 'pnl', icon: 'account-balance', type: 'both' },
  { key: 'stock', icon: 'inventory', type: 'stock' },
];

const DATE_RANGES = ['today', 'thisWeek', 'thisMonth', 'custom'];

// Utility functions for date calculations
const getDateRange = (range) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  switch (range) {
    case 'today':
      return {
        start: today,
        end: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1)
      };
    case 'thisWeek':
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);
      return { start: startOfWeek, end: endOfWeek };
    case 'thisMonth':
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      endOfMonth.setHours(23, 59, 59, 999);
      return { start: startOfMonth, end: endOfMonth };
    default:
      return { start: today, end: today };
  }
};

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-IN', {
    month: '2-digit',
    day: '2-digit',
  });
};

const ReportsScreen = ({ navigation, businessId, route }) => {
  const { t } = useI18n();
  const [selectedReport, setSelectedReport] = useState(null);
  const [selectedDateRange, setSelectedDateRange] = useState('thisMonth');
  const [generatedReport, setGeneratedReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentBusiness, setCurrentBusiness] = useState(null);

  // Get businessId from various sources
  const currentBusinessId = businessId || route?.params?.businessId || currentBusiness?.id;

  // Fetch business for current user if no businessId provided
  React.useEffect(() => {
    const fetchBusiness = async () => {
      if (!currentBusinessId) {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const { data: business } = await getOrCreateBusinessForUser(user);
            setCurrentBusiness(business);
          }
        } catch (error) {
          console.error('Error fetching business:', error);
        }
      }
    };

    fetchBusiness();
  }, [currentBusinessId]);

  // Database query functions
  const fetchTransactionData = async (reportType, dateRange) => {
    try {
      const { start, end } = getDateRange(dateRange);
      
      // Get report configuration
      const reportConfig = REPORT_TYPES.find(r => r.key === reportType);
      const transactionType = reportConfig?.type;

      // Use your existing db function
      const { data, error } = await listTransactions(currentBusinessId, {
        type: transactionType !== 'both' && transactionType !== 'stock' ? transactionType : undefined
      });

      if (error) {
        console.error('Database error:', error);
        throw error;
      }

      // Filter by date range since your db function doesn't handle date filtering
      const filteredData = (data || []).filter(transaction => {
        const transactionDate = new Date(transaction.created_at);
        return transactionDate >= start && transactionDate <= end;
      });

      return filteredData;
    } catch (error) {
      console.error('Error fetching transaction data:', error);
      throw error;
    }
  };

  const fetchStockData = async () => {
    try {
      const { data, error } = await listProducts(currentBusinessId);

      if (error) {
        console.error('Database error:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching stock data:', error);
      throw error;
    }
  };

  const generateSalesReport = (transactions, dateRange) => {
    const totalRevenue = transactions.reduce((sum, t) => sum + Number(t.amount), 0);
    const transactionCount = transactions.length;
    const avgSaleValue = transactionCount > 0 ? totalRevenue / transactionCount : 0;

    return {
      title: `${t('reports.types.sales')} (${t(`reports.dateRanges.${dateRange}`)})`,
      metrics: [
        { label: t('reports.metrics.totalRevenue'), value: formatCurrency(totalRevenue) },
        { label: t('reports.metrics.transactions'), value: transactionCount.toString() },
        { label: t('reports.metrics.avgSaleValue'), value: formatCurrency(avgSaleValue) },
      ],
      tableHeaders: [t('reports.table.date'), t('reports.table.description'), t('reports.table.amount')],
      tableData: transactions.slice(0, 10).map(t => [
        formatDate(t.created_at),
        t.description || 'Sale',
        formatCurrency(t.amount)
      ])
    };
  };

  const generateExpenseReport = (transactions, dateRange) => {
    const totalExpenses = transactions.reduce((sum, t) => sum + Number(t.amount), 0);
    const expenseCount = transactions.length;
    const avgExpense = expenseCount > 0 ? totalExpenses / expenseCount : 0;

    // Group by category
    const categoryTotals = transactions.reduce((acc, t) => {
      const category = t.category || 'Other';
      acc[category] = (acc[category] || 0) + Number(t.amount);
      return acc;
    }, {});

    const topCategory = Object.entries(categoryTotals)
      .sort(([,a], [,b]) => b - a)[0];

    return {
      title: `${t('reports.types.expense')} (${t(`reports.dateRanges.${dateRange}`)})`,
      metrics: [
        { label: t('reports.metrics.totalExpenses'), value: formatCurrency(totalExpenses) },
        { label: t('reports.metrics.expenseCount'), value: expenseCount.toString() },
        { label: t('reports.metrics.avgExpense'), value: formatCurrency(avgExpense) },
      ],
      tableHeaders: [t('reports.table.date'), t('reports.table.description'), t('reports.table.amount')],
      tableData: transactions.slice(0, 10).map(t => [
        formatDate(t.created_at),
        t.description || t.category || 'Expense',
        formatCurrency(t.amount)
      ])
    };
  };

  const generatePnLReport = async (transactions, dateRange) => {
    try {
      // Use your existing sumTransactions function for overall totals
      const { data: totals, error } = await sumTransactions(currentBusinessId);
      
      if (error) {
        console.error('Error fetching transaction totals:', error);
      }

      // Filter transactions for the selected date range
      const income = transactions.filter(t => t.type === 'income');
      const expenses = transactions.filter(t => t.type === 'expense');
      
      const periodIncome = income.reduce((sum, t) => sum + Number(t.amount), 0);
      const periodExpenses = expenses.reduce((sum, t) => sum + Number(t.amount), 0);
      const netProfit = periodIncome - periodExpenses;

      // Use period data for the report, but show overall totals as additional context
      return {
        title: `${t('reports.types.pnl')} (${t(`reports.dateRanges.${dateRange}`)})`,
        metrics: [
          { label: t('reports.metrics.totalIncome'), value: formatCurrency(periodIncome) },
          { label: t('reports.metrics.totalExpenses'), value: formatCurrency(periodExpenses) },
          { label: t('reports.metrics.netProfit'), value: formatCurrency(netProfit) },
        ],
        tableHeaders: [t('reports.table.type'), t('reports.table.count'), t('reports.table.amount')],
        tableData: [
          [t('reports.types.sales'), income.length.toString(), formatCurrency(periodIncome)],
          [t('reports.types.expense'), expenses.length.toString(), formatCurrency(periodExpenses)],
          [t('reports.metrics.netProfit'), '', formatCurrency(netProfit)]
        ]
      };
    } catch (error) {
      console.error('Error generating P&L report:', error);
      // Fallback to basic calculation
      const income = transactions.filter(t => t.type === 'income');
      const expenses = transactions.filter(t => t.type === 'expense');
      
      const totalIncome = income.reduce((sum, t) => sum + Number(t.amount), 0);
      const totalExpenses = expenses.reduce((sum, t) => sum + Number(t.amount), 0);
      const netProfit = totalIncome - totalExpenses;

      return {
        title: `${t('reports.types.pnl')} (${t(`reports.dateRanges.${dateRange}`)})`,
        metrics: [
          { label: t('reports.metrics.totalIncome'), value: formatCurrency(totalIncome) },
          { label: t('reports.metrics.totalExpenses'), value: formatCurrency(totalExpenses) },
          { label: t('reports.metrics.netProfit'), value: formatCurrency(netProfit) },
        ],
        tableHeaders: [t('reports.table.type'), t('reports.table.count'), t('reports.table.amount')],
        tableData: [
          [t('reports.types.sales'), income.length.toString(), formatCurrency(totalIncome)],
          [t('reports.types.expense'), expenses.length.toString(), formatCurrency(totalExpenses)],
          [t('reports.metrics.netProfit'), '', formatCurrency(netProfit)]
        ]
      };
    }
  };

  const generateStockReport = (products) => {
    const totalProducts = products.length;
    const totalValue = products.reduce((sum, p) => sum + (Number(p.quantity) * Number(p.unit_price || 0)), 0);
    const lowStockItems = products.filter(p => Number(p.quantity) <= Number(p.low_stock_threshold || 0));

    return {
      title: t('reports.types.stock'),
      metrics: [
        { label: t('reports.metrics.totalProducts'), value: totalProducts.toString() },
        { label: t('reports.metrics.totalValue'), value: formatCurrency(totalValue) },
        { label: t('reports.metrics.lowStock'), value: lowStockItems.length.toString() },
      ],
      tableHeaders: [t('reports.table.product'), t('reports.table.quantity'), t('reports.table.value')],
      tableData: products.slice(0, 10).map(p => [
        p.name,
        p.quantity?.toString() || '0',
        formatCurrency(Number(p.quantity || 0) * Number(p.unit_price || 0))
      ])
    };
  };

  const handleGenerateReport = async () => {
    if (!selectedReport) {
      Alert.alert(t('common.error'), t('reports.selectType'));
      return;
    }

    // Debug logging
    console.log('BusinessId from props:', businessId);
    console.log('BusinessId from route:', route?.params?.businessId);
    console.log('Current BusinessId:', currentBusinessId);

    if (!currentBusinessId) {
      Alert.alert(t('common.error'), 'Business ID is required. Please ensure you have a business selected.');
      return;
    }

    setLoading(true);

    try {
      let reportData;

      if (selectedReport === 'stock') {
        const products = await fetchStockData();
        reportData = generateStockReport(products);
      } else {
        const transactions = await fetchTransactionData(selectedReport, selectedDateRange);
        
        switch (selectedReport) {
          case 'sales':
            reportData = generateSalesReport(transactions, selectedDateRange);
            break;
          case 'expense':
            reportData = generateExpenseReport(transactions, selectedDateRange);
            break;
          case 'pnl':
            reportData = await generatePnLReport(transactions, selectedDateRange);
            break;
          default:
            throw new Error('Unknown report type');
        }
      }

      setGeneratedReport(reportData);
    } catch (error) {
      console.error('Error generating report:', error);
      Alert.alert(
        t('common.error'),
        'Failed to generate report. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const renderReportGenerator = () => (
    <View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('reports.selectType')}</Text>
        <View style={styles.reportTypeGrid}>
          {REPORT_TYPES.map(report => (
            <TouchableOpacity
              key={report.key}
              style={[styles.reportTypeCard, selectedReport === report.key && styles.reportTypeCardActive]}
              onPress={() => setSelectedReport(report.key)}
            >
              <Icon name={report.icon} size={28} color={selectedReport === report.key ? theme.colors.primary : theme.colors.subtleText} />
              <Text style={[styles.reportTypeName, selectedReport === report.key && styles.reportTypeNameActive]}>{t(`reports.types.${report.key}`)}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {selectedReport !== 'stock' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('reports.chooseDate')}</Text>
          <View style={styles.dateRangeContainer}>
              {DATE_RANGES.filter(range => range !== 'custom').map(range => (
                  <TouchableOpacity key={range} style={[styles.dateRangeButton, selectedDateRange === range && styles.dateRangeButtonActive]} onPress={() => setSelectedDateRange(range)}>
                      <Text style={[styles.dateRangeText, selectedDateRange === range && styles.dateRangeTextActive]}>{t(`reports.dateRanges.${range}`)}</Text>
                  </TouchableOpacity>
              ))}
          </View>
        </View>
      )}

      <TouchableOpacity
        style={[styles.primaryButton, (!selectedReport || loading) && { opacity: 0.5 }]}
        onPress={handleGenerateReport}
        disabled={!selectedReport || loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color={theme.colors.white} />
        ) : (
          <>
            <Text style={styles.primaryButtonText}>{t('reports.generate')}</Text>
            <Icon name="assessment" size={24} color={theme.colors.white} />
          </>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderGeneratedReport = () => (
    <ScrollView>
        <View style={styles.reportHeader}>
            <Text style={styles.reportTitle}>{generatedReport.title}</Text>
            <TouchableOpacity onPress={() => setGeneratedReport(null)}>
                <Text style={styles.newReportLink}>{t('reports.generateNew')}</Text>
            </TouchableOpacity>
        </View>

        {/* Chart Placeholder */}
        <View style={styles.chartPlaceholder}>
            <Icon name="bar-chart" size={64} color={`${theme.colors.primary}50`} />
            <Text style={styles.chartPlaceholderText}>{t('reports.chartPlaceholder')}</Text>
        </View>

        {/* Key Metrics */}
        <View style={styles.metricsContainer}>
            {generatedReport.metrics.map(metric => (
                <View key={metric.label} style={styles.metricItem}>
                    <Text style={styles.metricLabel}>{metric.label}</Text>
                    <Text style={styles.metricValue}>{metric.value}</Text>
                </View>
            ))}
        </View>

        {/* Data Table */}
        <View style={styles.tableContainer}>
            <View style={styles.tableHeader}>
                {generatedReport.tableHeaders.map(header => <Text key={header} style={styles.tableHeaderText}>{header}</Text>)}
            </View>
            {generatedReport.tableData.map((row, index) => (
                <View key={index} style={styles.tableRow}>
                    {row.map((cell, cellIndex) => <Text key={cellIndex} style={styles.tableCellText}>{cell}</Text>)}
                </View>
            ))}
        </View>

        <TouchableOpacity 
          style={styles.primaryButton}
          onPress={() => {
            Alert.alert(
              t('reports.shareTitle'),
              t('reports.shareBody'),
              [
                { text: t('reports.options.downloadPdf'), onPress: () => Alert.alert('Feature Coming Soon', '') },
                { text: t('reports.options.shareEmail'), onPress: () => Alert.alert('Feature Coming Soon', '') },
                { text: t('reports.options.exportExcel'), onPress: () => Alert.alert('Feature Coming Soon', '') },
                { text: t('reports.options.cancel'), style: 'cancel' }
              ]
            );
          }}
        >
            <Text style={styles.primaryButtonText}>{t('reports.share')}</Text>
            <Icon name="share" size={20} color={theme.colors.white} />
        </TouchableOpacity>
    </ScrollView>
  );

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
        <Text style={theme.typography.h1}>Reports</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={{flex: 1}}>
        {generatedReport ? renderGeneratedReport() : renderReportGenerator()}
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
  section: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    ...theme.typography.h2,
    fontSize: 18,
    marginBottom: theme.spacing.md,
  },
  reportTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  reportTypeCard: {
    width: '48%',
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    borderWidth: 2,
    borderColor: theme.colors.border,
  },
  reportTypeCardActive: {
    borderColor: theme.colors.primary,
    backgroundColor: `${theme.colors.primary}10`,
  },
  reportTypeName: {
    ...theme.typography.body,
    fontSize: 15,
    fontFamily: 'Poppins-Medium',
    color: theme.colors.subtleText,
    marginTop: theme.spacing.sm,
  },
  reportTypeNameActive: {
    color: theme.colors.primary,
  },
  dateRangeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dateRangeButton: {
    backgroundColor: theme.colors.surface,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  dateRangeButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  dateRangeText: {
    ...theme.typography.subtext,
    fontFamily: 'Poppins-Medium',
  },
  dateRangeTextActive: {
    color: theme.colors.white,
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
  // Generated Report Styles
  reportHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
  },
  reportTitle: {
      ...theme.typography.h2,
  },
  newReportLink: {
      ...theme.typography.subtext,
      color: theme.colors.primary,
      fontFamily: 'Poppins-SemiBold',
  },
  chartPlaceholder: {
      height: 200,
      backgroundColor: `${theme.colors.primary}10`,
      marginHorizontal: theme.spacing.lg,
      borderRadius: theme.borderRadius.md,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: `${theme.colors.primary}20`,
  },
  chartPlaceholderText: {
      ...theme.typography.subtext,
      color: `${theme.colors.primary}99`,
      marginTop: theme.spacing.sm,
  },
  metricsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      padding: theme.spacing.lg,
  },
  metricItem: {
      alignItems: 'center',
  },
  metricLabel: {
      ...theme.typography.subtext,
  },
  metricValue: {
      ...theme.typography.h2,
      color: theme.colors.primary,
  },
  tableContainer: {
      marginHorizontal: theme.spacing.lg,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.md,
      ...theme.shadow,
      marginBottom: theme.spacing.md,
  },
  tableHeader: {
      flexDirection: 'row',
      padding: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
  },
  tableHeaderText: {
      flex: 1,
      ...theme.typography.label,
      fontFamily: 'Poppins-SemiBold',
      color: theme.colors.text,
  },
  tableRow: {
      flexDirection: 'row',
      padding: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
  },
  tableCellText: {
      flex: 1,
      ...theme.typography.subtext,
  },
});

export default ReportsScreen;