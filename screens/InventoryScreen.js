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
import { useTheme } from '../context/ThemeContext'; // ADDED

const CATEGORIES_KEYS = ['all'];

const InventoryScreen = ({ navigation }) => {
  const { theme } = useTheme(); // ADDED
  const { t } = useI18n();
  const { business } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTab, setSelectedTab] = useState('Inventory');

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

  const bottomNavItems = [
    { route: 'Home', label: t('home.bottomNav.home'), icon: 'home' },
    { route: 'Inventory', label: t('home.bottomNav.inventory'), icon: 'inventory' },
    { route: 'Ledger', label: t('home.bottomNav.ledger'), icon: 'account-balance-wallet' },
    { route: 'CRM', label: t('home.bottomNav.crm'), icon: 'people' },
    { route: 'Reports', label: t('home.bottomNav.reports'), icon: 'assessment' },
  ];

  const renderProductItem = ({ item }) => (
    <TouchableOpacity 
      style={[styles.productItem, { backgroundColor: theme.colors.surface }, theme.shadow]}
      onPress={() => {
        navigation.navigate('ProductDetailsScreen', { product: item });
      }}
    >
      <Image source={{ uri: item.image || 'https://via.placeholder.com/56' }} style={[styles.productImage, { backgroundColor: theme.colors.border }]} />
      <View style={styles.productInfo}>
        <Text style={[styles.productName, { color: theme.colors.text }]}>{item.name}</Text>
        <Text style={[styles.productStock, getStockStyle(item.quantity ?? item.stock ?? 0)]}>
          {item.quantity ?? item.stock ?? 0} in stock
        </Text>
      </View>
      <Icon name="chevron-right" size={24} color={theme.colors.subtleText} />
    </TouchableOpacity>
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
        <Text style={[theme.typography.h1, { color: theme.colors.text }]}>{t('inventory.title')}</Text>
        <TouchableOpacity 
          style={styles.addButton} 
          onPress={() => navigation.navigate('AddProductScreen')}
        >
          <Icon name="add" size={32} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={[styles.searchContainer, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
        <Icon name="search" size={24} color={theme.colors.subtleText} style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, { color: theme.colors.text }]}
          placeholder={t('inventory.searchPlaceholder')}
          placeholderTextColor={theme.colors.subtleText}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View style={styles.categoriesContainer}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{t('inventory.categories')}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesScroll}>
          {CATEGORIES_KEYS.map(categoryKey => {
            const isActive = categoryKey === selectedCategory;
            return (
              <TouchableOpacity
                key={categoryKey}
                style={[
                    styles.categoryButton, 
                    { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
                    isActive && { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary }
                ]}
                onPress={() => setSelectedCategory(categoryKey)}
              >
                <Text style={[
                    styles.categoryButtonText, 
                    { color: theme.colors.text },
                    isActive && { color: theme.colors.white }
                ]}>
                  {t(`inventory.categoryList.${categoryKey}`)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <View style={styles.productListContainer}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{`${t('inventory.products')} (${filteredProducts.length})`}</Text>
        <FlatList
          data={filteredProducts}
          renderItem={renderProductItem}
          keyExtractor={item => item.id}
          contentContainerStyle={{ paddingBottom: theme.spacing.xl }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyStateContainer}>
                <Icon name="search-off" size={64} color={theme.colors.border} />
                <Text style={[styles.emptyStateText, { color: theme.colors.subtleText }]}>{isLoading ? t('common.loading') : t('inventory.noProducts')}</Text>
                {!isLoading && (
                  <Text style={[styles.emptyStateSubtext, { color: theme.colors.subtleText }]}>{t('inventory.tryAdjusting')}</Text>
                )}
            </View>
          }
        />
      </View>

      {/* BOTTOM NAVIGATION */}
      <View style={[styles.bottomNav, { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.border }]}>
        {bottomNavItems.map((item) => (
          <TouchableOpacity 
            key={item.route} 
            style={styles.bottomNavItem} 
            onPress={() => {
              setSelectedTab(item.route);
              if (item.route !== 'Inventory') {
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
    paddingBottom: 8,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  addButton: {
    padding: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    marginHorizontal: 24,
    paddingHorizontal: 16,
    borderWidth: 1,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Poppins-Regular',
    fontSize: 16,
    height: 50,
  },
  categoriesContainer: {
    marginTop: 24,
  },
  sectionTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 20,
    marginHorizontal: 24,
    marginBottom: 16,
  },
  categoriesScroll: {
    paddingHorizontal: 24,
  },
  categoryButton: {
    paddingVertical: 8,
    paddingHorizontal: 24,
    borderRadius: 999,
    marginRight: 8,
    borderWidth: 1,
  },
  // Removed categoryButtonActive styles, now handled inline
  categoryButtonText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
  },
  // Removed categoryButtonTextActive styles, now handled inline
  productListContainer: {
    flex: 1,
    marginTop: 24,
  },
  productItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 24,
    marginBottom: 16,
    padding: 16,
    borderRadius: 16,
  },
  productImage: {
    width: 56,
    height: 56,
    borderRadius: 8,
  },
  productInfo: {
    flex: 1,
    marginLeft: 16,
  },
  productName: {
    fontFamily: 'Poppins-Medium',
    fontSize: 16,
  },
  productStock: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
  },
  emptyStateContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingTop: '20%',
  },
  emptyStateText: {
      fontFamily: 'Poppins-SemiBold',
      fontSize: 20,
      marginTop: 16,
  },
  emptyStateSubtext: {
      fontFamily: 'Poppins-Regular',
      fontSize: 16,
      marginTop: 8,
      textAlign: 'center',
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

export default InventoryScreen;