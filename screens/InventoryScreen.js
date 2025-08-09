/**
 * InventoryScreen.js
 * A visually clean and functional screen for managing product inventory.
 * Built with the KAARO design system for a consistent and premium user experience.
 */

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Image,
  StatusBar,
  Platform,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useI18n } from '../i18n/I18nProvider';
import { useAuth } from '../context/AuthContext';
import { listProducts } from '../lib/db';
import { supabase } from '../lib/supabaseClient';
import { useFocusEffect } from '@react-navigation/native';

// THEME & DESIGN SYSTEM (Consistent with Home.js)
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

const CATEGORIES_KEYS = ['all'];

const InventoryScreen = ({ navigation }) => {
  const { t } = useI18n();
  const { business } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const load = useCallback(async () => {
    if (!business?.id) return;
    setIsLoading(true);
    const { data, error } = await listProducts(business.id);
    if (!error) setProducts(data || []);
    setIsLoading(false);
  }, [business?.id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  useEffect(() => {
    if (!business?.id) return;
    const channel = supabase
      .channel('inventory_products')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products', filter: `business_id=eq.${business.id}` }, () => {
        load();
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [business?.id, load]);

  // Memoized filtering for performance
  const filteredProducts = useMemo(() => {
    let result = products;

    // If categories are later added in DB, filter here

    if (searchQuery) {
      const lowercasedQuery = searchQuery.toLowerCase();
      result = result.filter(p => (p.name || '').toLowerCase().includes(lowercasedQuery));
    }

    return result;
  }, [searchQuery, selectedCategory, products]);

  const getStockStyle = (stock) => {
    if (stock < 20) return { color: theme.colors.danger };
    if (stock < 50) return { color: theme.colors.warning };
    return { color: theme.colors.success };
  };

  const renderProductItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.productItem}
      onPress={() => {
        navigation.navigate('ProductDetailsScreen', { product: item });
      }}
    >
      <Image source={{ uri: item.image || 'https://via.placeholder.com/56' }} style={styles.productImage} />
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{item.name}</Text>
        <Text style={[styles.productStock, getStockStyle(item.quantity ?? item.stock ?? 0)]}>
          {item.quantity ?? item.stock ?? 0} in stock
        </Text>
      </View>
      <Icon name="chevron-right" size={24} color={theme.colors.subtleText} />
    </TouchableOpacity>
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
        <Text style={theme.typography.h1}>{t('inventory.title')}</Text>
        <TouchableOpacity 
          style={styles.addButton} 
          onPress={() => navigation.navigate('AddProductScreen')}
        >
          <Icon name="add" size={32} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Icon name="search" size={24} color={theme.colors.subtleText} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder={t('inventory.searchPlaceholder')}
          placeholderTextColor={theme.colors.subtleText}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View style={styles.categoriesContainer}>
        <Text style={styles.sectionTitle}>{t('inventory.categories')}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesScroll}>
          {CATEGORIES_KEYS.map(categoryKey => {
            const isActive = categoryKey === selectedCategory;
            return (
              <TouchableOpacity
                key={categoryKey}
                style={[styles.categoryButton, isActive && styles.categoryButtonActive]}
                onPress={() => setSelectedCategory(categoryKey)}
              >
                <Text style={[styles.categoryButtonText, isActive && styles.categoryButtonTextActive]}>
                  {t(`inventory.categoryList.${categoryKey}`)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <View style={styles.productListContainer}>
        <Text style={styles.sectionTitle}>{`${t('inventory.products')} (${filteredProducts.length})`}</Text>
        <FlatList
          data={filteredProducts}
          renderItem={renderProductItem}
          keyExtractor={item => item.id}
          contentContainerStyle={{ paddingBottom: theme.spacing.xl }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyStateContainer}>
                <Icon name="search-off" size={64} color={theme.colors.border} />
                <Text style={styles.emptyStateText}>{isLoading ? t('common.loading') : t('inventory.noProducts')}</Text>
                {!isLoading && (
                  <Text style={styles.emptyStateSubtext}>{t('inventory.tryAdjusting')}</Text>
                )}
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.full,
    marginHorizontal: theme.spacing.lg,
    paddingHorizontal: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  searchIcon: {
    marginRight: theme.spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...theme.typography.body,
    color: theme.colors.text,
    height: 50,
  },
  categoriesContainer: {
    marginTop: theme.spacing.lg,
  },
  sectionTitle: {
    ...theme.typography.h2,
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  categoriesScroll: {
    paddingHorizontal: theme.spacing.lg,
  },
  categoryButton: {
    backgroundColor: theme.colors.surface,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.full,
    marginRight: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  categoryButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  categoryButtonText: {
    ...theme.typography.subtext,
    color: theme.colors.text,
    fontFamily: 'Poppins-Medium'
  },
  categoryButtonTextActive: {
    color: theme.colors.white,
  },
  productListContainer: {
    flex: 1,
    marginTop: theme.spacing.lg,
  },
  productItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    ...theme.shadow,
  },
  productImage: {
    width: 56,
    height: 56,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.border,
  },
  productInfo: {
    flex: 1,
    marginLeft: theme.spacing.md,
  },
  productName: {
    ...theme.typography.body,
    color: theme.colors.text,
    fontFamily: 'Poppins-Medium',
  },
  productStock: {
    ...theme.typography.subtext,
  },
  emptyStateContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingTop: '20%',
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

export default InventoryScreen;