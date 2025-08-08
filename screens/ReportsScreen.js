/**
 * ReportsScreen.js
 * A comprehensive screen for generating, viewing, and sharing business reports.
 * Features a clean interface for selecting report types and date ranges.
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
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useI18n } from '../i18n/I18nProvider';

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

// MOCK DATA & CONFIG
const REPORT_TYPES = [
  { key: 'sales', icon: 'trending-up' },
  { key: 'expense', icon: 'trending-down' },
  { key: 'pnl', icon: 'account-balance' },
  { key: 'stock', icon: 'inventory' },
];

const DATE_RANGES = ['today', 'thisWeek', 'thisMonth', 'custom'];

const MOCK_REPORT_DATA = {
    sales: {
        title: "Sales Report (This Month)",
        metrics: [
            { label: 'Total Revenue', value: '₹85,450' },
            { label: 'Transactions', value: '128' },
            { label: 'Avg. Sale Value', value: '₹667.58' },
        ],
        tableHeaders: ['Date', 'Item', 'Amount'],
        tableData: [
            ['08-15', 'Sale #1234', '₹2,500'],
            ['08-14', 'Sale #1233', '₹4,999'],
            ['08-12', 'Sale #1232', '₹7,500'],
        ]
    }
    // Add mock data for other report types as needed
};

const ReportsScreen = ({ navigation }) => {
  const { t } = useI18n();
  const [selectedReport, setSelectedReport] = useState(null);
  const [selectedDateRange, setSelectedDateRange] = useState('thisMonth');
  const [generatedReport, setGeneratedReport] = useState(null);

  const handleGenerateReport = () => {
    if (!selectedReport) {
      Alert.alert(t('common.error'), t('reports.selectType'));
      return;
    }

    // Show loading state simulation
    Alert.alert(
      t('reports.generatingTitle'),
      t('reports.generatingBody'),
      [{ text: t('reports.ok') }]
    );

    setTimeout(() => {
      // In a real app, you would fetch and process data here.
      // We'll use mock data based on the selected report key.
      const reportData = MOCK_REPORT_DATA[selectedReport] || {
          title: `${t(`reports.types.${selectedReport}`)} (${t(`reports.dateRanges.${selectedDateRange}`)})`,
          metrics: [{label: 'Total', value: '₹XX,XXX'}],
          tableHeaders: ['Column 1', 'Column 2'],
          tableData: [['Data A', 'Data B']]
      };
      setGeneratedReport(reportData);
    }, 1000);
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

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('reports.chooseDate')}</Text>
        <View style={styles.dateRangeContainer}>
            {DATE_RANGES.map(range => (
                <TouchableOpacity key={range} style={[styles.dateRangeButton, selectedDateRange === range && styles.dateRangeButtonActive]} onPress={() => setSelectedDateRange(range)}>
                    <Text style={[styles.dateRangeText, selectedDateRange === range && styles.dateRangeTextActive]}>{t(`reports.dateRanges.${range}`)}</Text>
                </TouchableOpacity>
            ))}
        </View>
      </View>

      <TouchableOpacity
        style={[styles.primaryButton, !selectedReport && { opacity: 0.5 }]}
        onPress={handleGenerateReport}
        disabled={!selectedReport}
      >
        <Text style={styles.primaryButtonText}>{t('reports.generate')}</Text>
        <Icon name="assessment" size={24} color={theme.colors.white} />
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
                    {row.map(cell => <Text key={cell} style={styles.tableCellText}>{cell}</Text>)}
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