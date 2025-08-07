/**
 * InventoryScreen.js
 * A visually clean and functional screen for managing product inventory.
 * Built with the KAARO design system for a consistent and premium user experience.
 */

import React, { useState, useMemo } from 'react';
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
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

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

// MOCK DATA
const CATEGORIES = ['All', 'Food', 'Beverages', 'Snacks', 'Dairy'];

const ALL_PRODUCTS = [
  { id: '1', name: 'Organic Apples', category: 'Food', stock: 100, image: 'https://images.pexels.com/photos/102104/pexels-photo-102104.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2' },
  { id: '2', name: 'Almond Milk', category: 'Dairy', stock: 50, image: 'https://images.pexels.com/photos/236781/pexels-photo-236781.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2' },
  { id: '3', name: 'Potato Chips', category: 'Snacks', stock: 200, image: 'https://images.pexels.com/photos/3764353/pexels-photo-3764353.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2' },
  { id: '4', name: 'Greek Yogurt', category: 'Dairy', stock: 75, image: 'https://images.pexels.com/photos/5969562/pexels-photo-5969562.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2' },
  { id: '5', name: 'Cold Brew Coffee', category: 'Beverages', stock: 15, image: 'https://images.pexels.com/photos/851555/pexels-photo-851555.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2' },
  { id: '6', name: 'Whole Wheat Bread', category: 'Food', stock: 40, image: 'https://images.pexels.com/photos/1775043/pexels-photo-1775043.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2' },
  { id: '7', name: 'Dark Chocolate Bar', category: 'Snacks', stock: 120, image: 'https://images.pexels.com/photos/4113840/pexels-photo-4113840.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2' },
  { id: '8', name: 'Sparkling Water', category: 'Beverages', stock: 8, image: 'https://images.pexels.com/photos/416528/pexels-photo-416528.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2' },
];

const InventoryScreen = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Memoized filtering for performance
  const filteredProducts = useMemo(() => {
    let products = ALL_PRODUCTS;

    if (selectedCategory !== 'All') {
      products = products.filter(p => p.category === selectedCategory);
    }

    if (searchQuery) {
      const lowercasedQuery = searchQuery.toLowerCase();
      products = products.filter(p => p.name.toLowerCase().includes(lowercasedQuery));
    }

    return products;
  }, [searchQuery, selectedCategory]);

  const getStockStyle = (stock) => {
    if (stock < 20) return { color: theme.colors.danger };
    if (stock < 50) return { color: theme.colors.warning };
    return { color: theme.colors.success };
  };

  const renderProductItem = ({ item }) => (
    <TouchableOpacity style={styles.productItem}>
      <Image source={{ uri: item.image }} style={styles.productImage} />
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{item.name}</Text>
        <Text style={[styles.productStock, getStockStyle(item.stock)]}>
          {item.stock} in stock
        </Text>
      </View>
      <Icon name="chevron-right" size={24} color={theme.colors.subtleText} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />
      
      <View style={styles.header}>
        <Text style={theme.typography.h1}>Inventory</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => { /* Navigate to Add Product Screen */ }}>
          <Icon name="add" size={32} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Icon name="search" size={24} color={theme.colors.subtleText} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search products..."
          placeholderTextColor={theme.colors.subtleText}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View style={styles.categoriesContainer}>
        <Text style={styles.sectionTitle}>Categories</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesScroll}>
          {CATEGORIES.map(category => {
            const isActive = category === selectedCategory;
            return (
              <TouchableOpacity
                key={category}
                style={[styles.categoryButton, isActive && styles.categoryButtonActive]}
                onPress={() => setSelectedCategory(category)}
              >
                <Text style={[styles.categoryButtonText, isActive && styles.categoryButtonTextActive]}>
                  {category}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <View style={styles.productListContainer}>
        <Text style={styles.sectionTitle}>Products ({filteredProducts.length})</Text>
        <FlatList
          data={filteredProducts}
          renderItem={renderProductItem}
          keyExtractor={item => item.id}
          contentContainerStyle={{ paddingBottom: theme.spacing.xl }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyStateContainer}>
                <Icon name="search-off" size={64} color={theme.colors.border} />
                <Text style={styles.emptyStateText}>No products found.</Text>
                <Text style={styles.emptyStateSubtext}>Try adjusting your search or filters.</Text>
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