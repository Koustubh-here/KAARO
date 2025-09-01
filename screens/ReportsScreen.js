/**
 * ReportsScreen.js
 * A comprehensive screen for generating, viewing, and sharing business reports.
 * Features real database integration with transactions table.
 * Adheres to the KAARO design system for a cohesive app experience.
 * import React, { useState, useMemo } from 'react';
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
import { useTheme } from '../context/ThemeContext'; // ADDED

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
  const { theme } = useTheme(); // ADDED
  const { t } = useI18n();
  const [selectedReport, setSelectedReport] = useState(null);
  const [selectedDateRange, setSelectedDateRange] = useState('thisMonth');
  const [generatedReport, setGeneratedReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentBusiness, setCurrentBusiness] = useState(null);
  const [selectedTab, setSelectedTab] = useState('Reports');

  const currentBusinessId = businessId || route?.params?.businessId || currentBusiness?.id;

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

  const fetchTransactionData = async (reportType, dateRange) => {
    try {
      const { start, end } = getDateRange(dateRange);
      const reportConfig = REPORT_TYPES.find(r => r.key === reportType);
      const transactionType = reportConfig?.type;

      const { data, error } = await listTransactions(currentBusinessId, {
        type: transactionType !== 'both' && transactionType !== 'stock' ? transactionType : undefined
      });

      if (error) throw error;

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
      if (error) throw error;
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
    const income = transactions.filter(t => t.type === 'income');
    const expenses = transactions.filter(t => t.type === 'expense');

    const periodIncome = income.reduce((sum, t) => sum + Number(t.amount), 0);
    const periodExpenses = expenses.reduce((sum, t) => sum + Number(t.amount), 0);
    const netProfit = periodIncome - periodExpenses;

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
          case 'sales': reportData = generateSalesReport(transactions, selectedDateRange); break;
          case 'expense': reportData = generateExpenseReport(transactions, selectedDateRange); break;
          case 'pnl': reportData = await generatePnLReport(transactions, selectedDateRange); break;
          default: throw new Error('Unknown report type');
        }
      }
      setGeneratedReport(reportData);
    } catch (error) {
      console.error('Error generating report:', error);
      Alert.alert(t('common.error'), 'Failed to generate report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const bottomNavItems = [
    { route: 'Home', label: t('home.bottomNav.home'), icon: 'home' },
    { route: 'Inventory', label: t('home.bottomNav.inventory'), icon: 'inventory' },
    { route: 'Ledger', label: t('home.bottomNav.ledger'), icon: 'account-balance-wallet' },
    { route: 'CRM', label: t('home.bottomNav.crm'), icon: 'people' },
    { route: 'Reports', label: t('home.bottomNav.reports'), icon: 'assessment' },
  ];

  const renderReportGenerator = () => (
    <View>
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{t('reports.selectType')}</Text>
        <View style={styles.reportTypeGrid}>
          {REPORT_TYPES.map(report => (
            <TouchableOpacity
              key={report.key}
              style={[
                styles.reportTypeCard,
                { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
                selectedReport === report.key && { borderColor: theme.colors.primary, backgroundColor: `${theme.colors.primary}10` }
              ]}
              onPress={() => setSelectedReport(report.key)}
            >
              <Icon name={report.icon} size={28} color={selectedReport === report.key ? theme.colors.primary : theme.colors.subtleText} />
              <Text style={[
                styles.reportTypeName,
                { color: theme.colors.subtleText },
                selectedReport === report.key && { color: theme.colors.primary }
              ]}>
                {t(`reports.types.${report.key}`)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {selectedReport !== 'stock' && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{t('reports.chooseDate')}</Text>
          <View style={styles.dateRangeContainer}>
            {DATE_RANGES.filter(range => range !== 'custom').map(range => (
              <TouchableOpacity
                key={range}
                style={[
                  styles.dateRangeButton,
                  { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
                  selectedDateRange === range && { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary }
                ]}
                onPress={() => setSelectedDateRange(range)}
              >
                <Text style={[
                  styles.dateRangeText,
                  { color: theme.colors.text },
                  selectedDateRange === range && { color: theme.colors.white }
                ]}>
                  {t(`reports.dateRanges.${range}`)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      <TouchableOpacity
        style={[styles.primaryButton, { backgroundColor: theme.colors.primary }, theme.shadow, (!selectedReport || loading) && { opacity: 0.5 }]}
        onPress={handleGenerateReport}
        disabled={!selectedReport || loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color={theme.colors.white} />
        ) : (
          <>
            <Text style={[styles.primaryButtonText, { color: theme.colors.white }]}>{t('reports.generate')}</Text>
            <Icon name="assessment" size={24} color={theme.colors.white} />
          </>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderGeneratedReport = () => (
    <ScrollView>
      <View style={styles.reportHeader}>
        <Text style={[styles.reportTitle, { color: theme.colors.text }]}>{generatedReport.title}</Text>
        <TouchableOpacity onPress={() => setGeneratedReport(null)}>
          <Text style={[styles.newReportLink, { color: theme.colors.primary }]}>{t('reports.generateNew')}</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.chartPlaceholder, { backgroundColor: `${theme.colors.primary}10`, borderColor: `${theme.colors.primary}20` }]}>
        <Icon name="bar-chart" size={64} color={`${theme.colors.primary}50`} />
        <Text style={[styles.chartPlaceholderText, { color: `${theme.colors.primary}99` }]}>{t('reports.chartPlaceholder')}</Text>
      </View>

      <View style={styles.metricsContainer}>
        {generatedReport.metrics.map(metric => (
          <View key={metric.label} style={styles.metricItem}>
            <Text style={[styles.metricLabel, { color: theme.colors.subtleText }]}>{metric.label}</Text>
            <Text style={[styles.metricValue, { color: theme.colors.primary }]}>{metric.value}</Text>
          </View>
        ))}
      </View>

      <View style={[styles.tableContainer, { backgroundColor: theme.colors.surface }, theme.shadow]}>
        <View style={[styles.tableHeader, { borderBottomColor: theme.colors.border }]}>
          {generatedReport.tableHeaders.map(header => <Text key={header} style={[styles.tableHeaderText, { color: theme.colors.text }]}>{header}</Text>)}
        </View>
        {generatedReport.tableData.map((row, index) => (
          <View key={index} style={[styles.tableRow, { borderBottomColor: theme.colors.border }]}>
            {row.map((cell, cellIndex) => <Text key={cellIndex} style={[styles.tableCellText, { color: theme.colors.subtleText }]}>{cell}</Text>)}
          </View>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.primaryButton, { backgroundColor: theme.colors.primary }, theme.shadow]}
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
        <Text style={[styles.primaryButtonText, { color: theme.colors.white }]}>{t('reports.share')}</Text>
        <Icon name="share" size={20} color={theme.colors.white} />
      </TouchableOpacity>
    </ScrollView>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle={theme.dark ? "light-content" : "dark-content"} backgroundColor={theme.colors.background} />

      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Icon name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[theme.typography.h1, { color: theme.colors.text }]}>Reports</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={{ flex: 1 }}>
        {generatedReport ? renderGeneratedReport() : renderReportGenerator()}
      </View>

      {/* BOTTOM NAVIGATION */}
      <View style={[styles.bottomNav, { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.border }]}>
        {bottomNavItems.map((item) => (
          <TouchableOpacity
            key={item.route}
            style={styles.bottomNavItem}
            onPress={() => {
              setSelectedTab(item.route);
              if (item.route !== 'Reports') {
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
  section: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 18,
    marginBottom: 16,
  },
  reportTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  reportTypeCard: {
    width: '48%',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
  },
  reportTypeName: {
    fontSize: 15,
    fontFamily: 'Poppins-Medium',
    marginTop: 8,
  },
  dateRangeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dateRangeButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 999,
    borderWidth: 1,
  },
  dateRangeText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
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
  // Generated Report Styles
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  reportTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 20,
  },
  newReportLink: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 14,
  },
  chartPlaceholder: {
    height: 200,
    marginHorizontal: 24,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  chartPlaceholderText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    marginTop: 8,
  },
  metricsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 24,
  },
  metricItem: {
    alignItems: 'center',
  },
  metricLabel: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
  },
  metricValue: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 20,
  },
  tableContainer: {
    marginHorizontal: 24,
    borderRadius: 16,
    marginBottom: 16,
  },
  tableHeader: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
  },
  tableHeaderText: {
    flex: 1,
    fontFamily: 'Poppins-SemiBold',
    fontSize: 12,
  },
  tableRow: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
  },
  tableCellText: {
    flex: 1,
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
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

export default ReportsScreen;