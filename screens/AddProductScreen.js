import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  SafeAreaView, 
  StyleSheet, 
  Alert, 
  ActivityIndicator,
  Image,
  ScrollView
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useI18n } from '../i18n/I18nProvider';
import { useAuth } from '../context/AuthContext';
import { createProduct } from '../lib/db';
import { useTheme } from '../context/ThemeContext';
import ProductImageService from '../services/ProductImageService';

const AddProductScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const { t } = useI18n();
  const { business } = useAuth();
  
  const [name, setName] = useState('');
  const [stock, setStock] = useState('0');
  const [category, setCategory] = useState('');
  const [previewImage, setPreviewImage] = useState(null);
  const [isLoadingImage, setIsLoadingImage] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Function to fetch and preview image
  const fetchPreviewImage = async (productName, productCategory = '') => {
    if (!productName.trim()) {
      setPreviewImage(null);
      return;
    }

    setIsLoadingImage(true);
    try {
      const imageUrl = await ProductImageService.fetchProductImage(productName, productCategory);
      setPreviewImage(imageUrl);
    } catch (error) {
      console.error('Error fetching preview image:', error);
      setPreviewImage(ProductImageService.getDefaultImage(productCategory));
    } finally {
      setIsLoadingImage(false);
    }
  };

  // Auto-fetch image when name changes (with debounce effect)
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (name.trim()) {
        fetchPreviewImage(name, category);
      } else {
        setPreviewImage(null);
      }
    }, 1000); // Wait 1 second after user stops typing

    return () => clearTimeout(timer);
  }, [name, category]);

  const save = async () => {
    // Validate that the product name is not empty
    if (!name.trim()) {
      Alert.alert(t('common.error'), t('inventory.addProductBody'));
      return;
    }
    
    if (!business?.id) {
      Alert.alert(t('common.error'), 'Business not found. Please log in again.');
      return;
    }

    setIsLoading(true);

    try {
      // Use the preview image if available, otherwise fetch a new one
      let imageUrl = previewImage;
      if (!imageUrl) {
        imageUrl = await ProductImageService.fetchProductImage(name, category);
      }

      // Prepare the product data
      const productData = {
        name: name.trim(),
        stock: Number(stock || 0),
        category: category.trim() || null,
        image: imageUrl,
      };

      // Create the product in the database
      const { error } = await createProduct(business.id, productData);

      if (error) {
        Alert.alert(t('common.error'), error.message);
      } else {
        // Show success message and navigate back
        Alert.alert(
          t('common.success') || 'Success', 
          'Product added successfully!',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      }
    } catch (error) {
      console.error('Error creating product:', error);
      Alert.alert(t('common.error'), 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh image manually
  const refreshImage = () => {
    if (name.trim()) {
      fetchPreviewImage(name, category);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          {t('inventory.addProductTitle')}
        </Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={[styles.form, { backgroundColor: theme.colors.surface }]}>
          
          {/* Image Preview Section */}
          <View style={styles.imageSection}>
            <View style={styles.imageLabelContainer}>
              <Text style={[styles.label, { color: theme.colors.text }]}>
                Product Image Preview
              </Text>
              {name.trim() && (
                <TouchableOpacity 
                  onPress={refreshImage} 
                  style={styles.refreshButton}
                  disabled={isLoadingImage}
                >
                  <Icon 
                    name="refresh" 
                    size={20} 
                    color={theme.colors.primary} 
                  />
                </TouchableOpacity>
              )}
            </View>
            
            <View style={[styles.imageContainer, { borderColor: theme.colors.border }]}>
              {isLoadingImage ? (
                <View style={styles.imageLoading}>
                  <ActivityIndicator size="large" color={theme.colors.primary} />
                  <Text style={[styles.loadingText, { color: theme.colors.subtleText }]}>
                    Fetching image...
                  </Text>
                </View>
              ) : previewImage ? (
                <Image 
                  source={{ uri: previewImage }} 
                  style={styles.previewImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Icon name="image" size={48} color={theme.colors.subtleText} />
                  <Text style={[styles.placeholderText, { color: theme.colors.subtleText }]}>
                    {name.trim() ? 'Image will appear here' : 'Enter product name to see image'}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Product Name Input */}
          <Text style={[styles.label, { color: theme.colors.text }]}>
            {t('inventory.productName') || 'Product Name'} *
          </Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="e.g. Organic Apples, iPhone 14, Nike Shoes"
            placeholderTextColor={theme.colors.subtleText}
            style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.text }]}
          />

          {/* Category Input */}
          <Text style={[styles.label, { color: theme.colors.text }]}>
            Category (Optional)
          </Text>
          <TextInput
            value={category}
            onChangeText={setCategory}
            placeholder="e.g. Food, Electronics, Clothing"
            placeholderTextColor={theme.colors.subtleText}
            style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.text }]}
          />

          {/* Stock Input */}
          <Text style={[styles.label, { color: theme.colors.text }]}>
            {t('inventory.stock') || 'Stock'} *
          </Text>
          <TextInput
            value={stock}
            onChangeText={setStock}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor={theme.colors.subtleText}
            style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.text }]}
          />

          {/* Info Text */}
          <View style={styles.infoContainer}>
            <Icon name="info-outline" size={16} color={theme.colors.subtleText} />
            <Text style={[styles.infoText, { color: theme.colors.subtleText }]}>
              Product images are automatically fetched based on the product name and category.
            </Text>
          </View>

          {/* Save Button */}
          <TouchableOpacity 
            style={[
              styles.save, 
              { 
                backgroundColor: theme.colors.primary,
                opacity: isLoading ? 0.7 : 1 
              }
            ]} 
            onPress={save} 
            disabled={isLoading || !name.trim()}
          >
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color={theme.colors.white} size="small" />
                <Text style={[styles.saveText, { color: theme.colors.white, marginLeft: 8 }]}>
                  Saving...
                </Text>
              </View>
            ) : (
              <Text style={[styles.saveText, { color: theme.colors.white }]}>
                {t('common.save') || 'Add Product'}
              </Text>
            )}
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
    padding: 16,
    paddingBottom: 8,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    fontFamily: 'Poppins-SemiBold'
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  form: {
    margin: 16,
    padding: 24,
    borderRadius: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  imageSection: {
    marginBottom: 24,
  },
  imageLabelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  refreshButton: {
    padding: 4,
  },
  imageContainer: {
    height: 200,
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
    overflow: 'hidden',
  },
  imageLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  placeholderText: {
    marginTop: 8,
    textAlign: 'center',
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
  },
  label: {
    marginTop: 16,
    marginBottom: 8,
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontFamily: 'Poppins-Regular',
    fontSize: 16,
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 16,
    padding: 12,
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderRadius: 8,
  },
  infoText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    lineHeight: 18,
  },
  save: {
    marginTop: 32,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  saveText: {
    fontWeight: '600',
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
  },
});

export default AddProductScreen;