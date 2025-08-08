/**
 * ProductDetailsScreen.js
 * Detailed view of a specific product with options to edit stock, view history, etc.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  Image,
  TextInput,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useI18n } from '../i18n/I18nProvider';

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

const ProductDetailsScreen = ({ navigation, route }) => {
  const { t } = useI18n();
  const { product } = route.params || {
    product: {
      id: '1',
      name: 'Sample Product',
      category: 'Food',
      stock: 100,
      image: 'https://images.pexels.com/photos/102104/pexels-photo-102104.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
      price: 25.99,
      supplier: 'Fresh Foods Ltd.',
      lastUpdated: '2025-08-15',
    }
  };

  const [editingStock, setEditingStock] = useState(false);
  const [newStock, setNewStock] = useState(product.stock.toString());

  const getStockStatusColor = (stock) => {
    if (stock < 20) return theme.colors.danger;
    if (stock < 50) return theme.colors.warning;
    return theme.colors.success;
  };

  const handleUpdateStock = () => {
    const updatedStock = parseInt(newStock);
    if (isNaN(updatedStock) || updatedStock < 0) {
      Alert.alert(t('productDetails.errorTitle'), t('productDetails.errorBody'));
      return;
    }

    Alert.alert(
      t('productDetails.updateStockTitle'),
      t('productDetails.updateStockBody', { from: product.stock, to: updatedStock }),
      [
        { text: t('productDetails.cancel'), style: 'cancel' },
        {
          text: t('productDetails.update'),
          onPress: () => {
            // In real app, this would update the stock via API
            Alert.alert(t('productDetails.successTitle'), t('productDetails.successBody'));
            setEditingStock(false);
            product.stock = updatedStock; // Update locally for demo
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('productDetails.title')}</Text>
        <TouchableOpacity style={styles.editButton}>
          <Icon name="edit" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Product Image and Basic Info */}
        <View style={styles.productCard}>
          <Image source={{ uri: product.image }} style={styles.productImage} />
          <View style={styles.productInfo}>
            <Text style={styles.productName}>{product.name}</Text>
            <Text style={styles.productCategory}>{product.category}</Text>
            <View style={styles.stockContainer}>
              <Text style={[styles.stockText, { color: getStockStatusColor(product.stock) }]}>
                {t('productDetails.inStock', { count: product.stock })}
              </Text>
              <TouchableOpacity
                style={styles.editStockButton}
                onPress={() => setEditingStock(true)}
              >
                <Icon name="edit" size={16} color={theme.colors.primary} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Stock Update Section */}
        {editingStock && (
          <View style={styles.editStockCard}>
            <Text style={styles.sectionTitle}>{t('productDetails.updateStockTitle')}</Text>
            <View style={styles.stockEditRow}>
              <TextInput
                style={styles.stockInput}
                value={newStock}
                onChangeText={setNewStock}
                keyboardType="numeric"
                placeholder={t('productDetails.updateStockTitle')}
              />
              <TouchableOpacity style={styles.updateButton} onPress={handleUpdateStock}>
                <Text style={styles.updateButtonText}>{t('productDetails.update')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setEditingStock(false);
                  setNewStock(product.stock.toString());
                }}
              >
                <Text style={styles.cancelButtonText}>{t('productDetails.cancel')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Product Details */}
        <View style={styles.detailsCard}>
          <Text style={styles.sectionTitle}>{t('productDetails.details')}</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t('productDetails.price')}</Text>
            <Text style={styles.detailValue}>₹{product.price}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t('productDetails.supplier')}</Text>
            <Text style={styles.detailValue}>{product.supplier}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t('productDetails.lastUpdated')}</Text>
            <Text style={styles.detailValue}>{product.lastUpdated}</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsCard}>
          <Text style={styles.sectionTitle}>{t('productDetails.quickActions')}</Text>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => Alert.alert(t('productDetails.featureComingSoon'), '')}
          >
            <Icon name="history" size={24} color={theme.colors.primary} />
            <Text style={styles.actionText}>{t('productDetails.viewStockHistory')}</Text>
            <Icon name="chevron-right" size={24} color={theme.colors.subtleText} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => Alert.alert(t('productDetails.featureComingSoon'), '')}
          >
            <Icon name="edit" size={24} color={theme.colors.primary} />
            <Text style={styles.actionText}>{t('productDetails.editProductDetails')}</Text>
            <Icon name="chevron-right" size={24} color={theme.colors.subtleText} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => Alert.alert(t('productDetails.featureComingSoon'), '')}
          >
            <Icon name="analytics" size={24} color={theme.colors.primary} />
            <Text style={styles.actionText}>{t('productDetails.viewAnalytics')}</Text>
            <Icon name="chevron-right" size={24} color={theme.colors.subtleText} />
          </TouchableOpacity>
        </View>
      </ScrollView>
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
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    padding: theme.spacing.sm,
    marginLeft: -theme.spacing.sm,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    fontFamily: 'Poppins-SemiBold',
  },
  editButton: {
    padding: theme.spacing.sm,
    marginRight: -theme.spacing.sm,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
  },
  productCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
    marginTop: theme.spacing.lg,
    ...theme.shadow,
  },
  productImage: {
    width: '100%',
    height: 200,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.border,
  },
  productInfo: {
    marginTop: theme.spacing.md,
  },
  productName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
    fontFamily: 'Poppins-Bold',
  },
  productCategory: {
    fontSize: 16,
    color: theme.colors.subtleText,
    marginTop: theme.spacing.xs,
    fontFamily: 'Poppins-Regular',
  },
  stockContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.sm,
  },
  stockText: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Poppins-SemiBold',
  },
  editStockButton: {
    marginLeft: theme.spacing.sm,
    padding: theme.spacing.xs,
  },
  editStockCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
    marginTop: theme.spacing.md,
    ...theme.shadow,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
    fontFamily: 'Poppins-SemiBold',
  },
  stockEditRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stockInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    fontSize: 16,
    color: theme.colors.text,
    fontFamily: 'Poppins-Regular',
  },
  updateButton: {
    backgroundColor: theme.colors.success,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    marginLeft: theme.spacing.sm,
  },
  updateButtonText: {
    color: theme.colors.white,
    fontWeight: '600',
    fontFamily: 'Poppins-SemiBold',
  },
  cancelButton: {
    backgroundColor: theme.colors.subtleText,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    marginLeft: theme.spacing.sm,
  },
  cancelButtonText: {
    color: theme.colors.white,
    fontWeight: '600',
    fontFamily: 'Poppins-SemiBold',
  },
  detailsCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
    marginTop: theme.spacing.md,
    ...theme.shadow,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  detailLabel: {
    fontSize: 16,
    color: theme.colors.subtleText,
    fontFamily: 'Poppins-Regular',
  },
  detailValue: {
    fontSize: 16,
    color: theme.colors.text,
    fontWeight: '600',
    fontFamily: 'Poppins-SemiBold',
  },
  actionsCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    ...theme.shadow,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  actionText: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.text,
    marginLeft: theme.spacing.md,
    fontFamily: 'Poppins-Regular',
  },
});

export default ProductDetailsScreen;
