/**
 * ProductDetailsScreen.js
 * Enhanced version with automatic image fetching
 */

import React, { useState, useEffect } from 'react';
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
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useI18n } from '../i18n/I18nProvider';
import { updateProduct } from '../lib/db';
import { useTheme } from '../context/ThemeContext';
import ProductImageService from '../services/ProductImageService'; // Import our service

const ProductDetailsScreen = ({ navigation, route }) => {
  const { theme } = useTheme();
  const { t } = useI18n();
  const { product } = route.params || {
    product: {
      id: '1',
      name: 'Sample Product',
      category: 'Food',
      stock: 100,
      image: null, // Start with no image to trigger fetching
      price: 25.99,
      supplier: 'Fresh Foods Ltd.',
      lastUpdated: '2025-08-15',
    }
  };

  const [editingStock, setEditingStock] = useState(false);
  const [newStock, setNewStock] = useState(String(product.quantity ?? product.stock ?? 0));
  const [productImage, setProductImage] = useState(product.image);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Fetch product image on component mount
  useEffect(() => {
    fetchProductImage();
  }, [product.name, product.category]);

  const fetchProductImage = async () => {
    // If we already have an image and it's not a placeholder, don't fetch
    if (productImage && !productImage.includes('placeholder') && !imageError) {
      return;
    }

    setImageLoading(true);
    setImageError(false);

    try {
      console.log(`Fetching image for product: ${product.name}`);
      
      const fetchedImageUrl = await ProductImageService.fetchProductImage(
        product.name, 
        product.category || ''
      );

      if (fetchedImageUrl) {
        // Validate the image URL before setting it
        const isValid = await ProductImageService.validateImageUrl(fetchedImageUrl);
        
        if (isValid) {
          setProductImage(fetchedImageUrl);
          
          // Optionally update the product in the database with the new image
          await updateProductImage(fetchedImageUrl);
        } else {
          throw new Error('Image URL not accessible');
        }
      } else {
        throw new Error('No image found');
      }
      
    } catch (error) {
      console.error('Failed to fetch product image:', error);
      setImageError(true);
      // Set a category-based default image
      const defaultImg = ProductImageService.getDefaultImage(product.category || '');
      setProductImage(defaultImg);
    } finally {
      setImageLoading(false);
    }
  };

  const updateProductImage = async (imageUrl) => {
    try {
      await updateProduct(product.id, { image: imageUrl });
      console.log('Product image updated in database');
    } catch (error) {
      console.error('Failed to update product image in database:', error);
    }
  };

  const handleImageError = () => {
    setImageError(true);
    // Try to fetch a new image
    fetchProductImage();
  };

  const handleRefreshImage = () => {
    setProductImage(null);
    setImageError(false);
    fetchProductImage();
  };

  const getStockStatusColor = (stock) => {
    if (stock < 20) return theme.colors.danger;
    if (stock < 50) return theme.colors.warning;
    return theme.colors.success;
  };

  const handleUpdateStock = async () => {
    const updatedStock = parseInt(newStock);
    if (isNaN(updatedStock) || updatedStock < 0) {
      Alert.alert(t('productDetails.errorTitle'), t('productDetails.errorBody'));
      return;
    }

    Alert.alert(
      t('productDetails.updateStockTitle'),
      t('productDetails.updateStockBody', { from: product.quantity ?? product.stock ?? 0, to: updatedStock }),
      [
        { text: t('productDetails.cancel'), style: 'cancel' },
        {
          text: t('productDetails.update'),
          onPress: async () => {
            const { error } = await updateProduct(product.id, { stock: updatedStock });
            if (error) {
              Alert.alert(t('productDetails.errorTitle'), error.message);
              return;
            }
            Alert.alert(t('productDetails.successTitle'), t('productDetails.successBody'));
            setEditingStock(false);
            route.params.product.stock = updatedStock;
            route.params.product.quantity = updatedStock;
          },
        },
      ]
    );
  };

  const renderProductImage = () => {
    if (imageLoading) {
      return (
        <View style={[styles.productImage, styles.imageLoadingContainer, { backgroundColor: theme.colors.border }]}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.subtleText }]}>
            Fetching image...
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.imageContainer}>
        <Image 
          source={{ uri: productImage || 'https://via.placeholder.com/300x200' }} 
          style={[styles.productImage, { backgroundColor: theme.colors.border }]}
          onError={handleImageError}
        />
        
        {/* Image refresh button */}
        <TouchableOpacity 
          style={[styles.refreshImageButton, { backgroundColor: theme.colors.surface }]}
          onPress={handleRefreshImage}
        >
          <Icon name="refresh" size={20} color={theme.colors.primary} />
        </TouchableOpacity>
        
        {imageError && (
          <View style={[styles.imageErrorOverlay, { backgroundColor: 'rgba(0,0,0,0.7)' }]}>
            <Icon name="broken-image" size={32} color={theme.colors.white} />
            <Text style={[styles.imageErrorText, { color: theme.colors.white }]}>
              Image failed to load
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle={theme.dark ? "light-content" : "dark-content"} backgroundColor={theme.colors.surface} />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>{t('productDetails.title')}</Text>
        <TouchableOpacity style={styles.editButton}>
          <Icon name="edit" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Product Image and Basic Info */}
        <View style={[styles.productCard, { backgroundColor: theme.colors.surface }, theme.shadow]}>
          {renderProductImage()}
          
          <View style={styles.productInfo}>
            <Text style={[styles.productName, { color: theme.colors.text }]}>{product.name}</Text>
            <Text style={[styles.productCategory, { color: theme.colors.subtleText }]}>{product.category}</Text>
            <View style={styles.stockContainer}>
              <Text style={[styles.stockText, { color: getStockStatusColor(product.quantity ?? product.stock ?? 0) }]}> 
                {t('productDetails.inStock', { count: product.quantity ?? product.stock ?? 0 })}
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
          <View style={[styles.editStockCard, { backgroundColor: theme.colors.surface }, theme.shadow]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{t('productDetails.updateStockTitle')}</Text>
            <View style={styles.stockEditRow}>
              <TextInput
                style={[styles.stockInput, { borderColor: theme.colors.border, color: theme.colors.text }]}
                value={newStock}
                onChangeText={setNewStock}
                keyboardType="numeric"
                placeholder={t('productDetails.updateStockTitle')}
                placeholderTextColor={theme.colors.subtleText}
              />
              <TouchableOpacity style={[styles.updateButton, { backgroundColor: theme.colors.success }]} onPress={handleUpdateStock}>
                <Text style={[styles.updateButtonText, { color: theme.colors.white }]}>{t('productDetails.update')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.cancelButton, { backgroundColor: theme.colors.subtleText }]}
                onPress={() => {
                  setEditingStock(false);
                  setNewStock(String(product.quantity ?? product.stock ?? 0));
                }}
              >
                <Text style={[styles.cancelButtonText, { color: theme.colors.white }]}>{t('productDetails.cancel')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Product Details */}
        <View style={[styles.detailsCard, { backgroundColor: theme.colors.surface }, theme.shadow]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{t('productDetails.details')}</Text>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: theme.colors.subtleText }]}>{t('productDetails.price')}</Text>
            <Text style={[styles.detailValue, { color: theme.colors.text }]}>₹{product.price}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: theme.colors.subtleText }]}>{t('productDetails.supplier')}</Text>
            <Text style={[styles.detailValue, { color: theme.colors.text }]}>{product.supplier}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: theme.colors.subtleText }]}>{t('productDetails.lastUpdated')}</Text>
            <Text style={[styles.detailValue, { color: theme.colors.text }]}>{product.lastUpdated}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: theme.colors.subtleText }]}>Image Status</Text>
            <Text style={[styles.detailValue, { color: imageError ? theme.colors.danger : theme.colors.success }]}>
              {imageError ? 'Error' : 'Loaded'}
            </Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={[styles.actionsCard, { backgroundColor: theme.colors.surface }, theme.shadow]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{t('productDetails.quickActions')}</Text>
          
          <TouchableOpacity
            style={[styles.actionButton, { borderBottomColor: theme.colors.border }]}
            onPress={handleRefreshImage}
          >
            <Icon name="image" size={24} color={theme.colors.primary} />
            <Text style={[styles.actionText, { color: theme.colors.text }]}>Refresh Product Image</Text>
            <Icon name="chevron-right" size={24} color={theme.colors.subtleText} />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, { borderBottomColor: theme.colors.border }]}
            onPress={() => Alert.alert(t('productDetails.featureComingSoon'), '')}
          >
            <Icon name="history" size={24} color={theme.colors.primary} />
            <Text style={[styles.actionText, { color: theme.colors.text }]}>{t('productDetails.viewStockHistory')}</Text>
            <Icon name="chevron-right" size={24} color={theme.colors.subtleText} />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, { borderBottomColor: theme.colors.border }]}
            onPress={() => Alert.alert(t('productDetails.featureComingSoon'), '')}
          >
            <Icon name="edit" size={24} color={theme.colors.primary} />
            <Text style={[styles.actionText, { color: theme.colors.text }]}>{t('productDetails.editProductDetails')}</Text>
            <Icon name="chevron-right" size={24} color={theme.colors.subtleText} />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, { borderBottomWidth: 0 }]}
            onPress={() => Alert.alert(t('productDetails.featureComingSoon'), '')}
          >
            <Icon name="analytics" size={24} color={theme.colors.primary} />
            <Text style={[styles.actionText, { color: theme.colors.text }]}>{t('productDetails.viewAnalytics')}</Text>
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
  },
  editButton: {
    padding: 8,
    marginRight: -8,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 24,
  },
  productCard: {
    borderRadius: 16,
    padding: 24,
    marginTop: 24,
  },
  imageContainer: {
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: 200,
    borderRadius: 16,
  },
  imageLoadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
  },
  refreshImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    padding: 8,
    borderRadius: 20,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  imageErrorOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageErrorText: {
    marginTop: 8,
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    textAlign: 'center',
  },
  productInfo: {
    marginTop: 16,
  },
  productName: {
    fontSize: 24,
    fontFamily: 'Poppins-Bold',
  },
  productCategory: {
    fontSize: 16,
    marginTop: 4,
    fontFamily: 'Poppins-Regular',
  },
  stockContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  stockText: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
  },
  editStockButton: {
    marginLeft: 8,
    padding: 4,
  },
  editStockCard: {
    borderRadius: 16,
    padding: 24,
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: 16,
    fontFamily: 'Poppins-SemiBold',
  },
  stockEditRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stockInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
  },
  updateButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 8,
  },
  updateButtonText: {
    fontWeight: '600',
    fontFamily: 'Poppins-SemiBold',
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 8,
  },
  cancelButtonText: {
    fontWeight: '600',
    fontFamily: 'Poppins-SemiBold',
  },
  detailsCard: {
    borderRadius: 16,
    padding: 24,
    marginTop: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
  },
  detailValue: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
  },
  actionsCard: {
    borderRadius: 16,
    padding: 24,
    marginTop: 16,
    marginBottom: 24,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  actionText: {
    flex: 1,
    fontSize: 16,
    marginLeft: 16,
    fontFamily: 'Poppins-Regular',
  },
});

export default ProductDetailsScreen;