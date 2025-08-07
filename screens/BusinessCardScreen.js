/**
 * BusinessCardScreen.js
 * Digital business card creation and preview screen
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
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const { width: screenWidth } = Dimensions.get('window');

const BusinessCardScreen = ({ navigation, route }) => {
  const { category, businessName, phoneNumber } = route.params || {};
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateBusinessCard = async () => {
    setIsCreating(true);
    
    // Simulate business card creation process
    setTimeout(() => {
      setIsCreating(false);
      Alert.alert(
        'Success!',
        'Your digital business card has been created successfully.',
        [
          {
            text: 'Continue',
            onPress: () => {
              // Navigate to next screen or main app
              navigation.navigate('Dashboard'); // Adjust as needed
            }
          }
        ]
      );
    }, 2000);
  };

  const handleSkipForNow = () => {
    Alert.alert(
      'Skip Business Card',
      'You can create your business card later from the settings.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Skip',
          onPress: () => {
            // Navigate to main app
            navigation.navigate('Dashboard'); // Adjust as needed
          }
        }
      ]
    );
  };

  const goBack = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack} style={styles.backButton}>
          <Icon name="close" size={24} color="#212121" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Business Card</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Title Section */}
        <View style={styles.titleContainer}>
          <Text style={styles.mainTitle}>Create your digital business card</Text>
          <Text style={styles.subtitle}>
            Share your contact information with customers and partners
          </Text>
        </View>

        {/* Business Card Preview */}
        <View style={styles.previewContainer}>
          <View style={styles.cardContainer}>
            {/* Front Card */}
            <View style={styles.businessCard}>
              <View style={styles.cardBackground}>
                {/* Decorative Pattern */}
                <View style={styles.decorativePattern}>
                  <View style={styles.patternLine1} />
                  <View style={styles.patternLine2} />
                  <View style={styles.patternCircle} />
                </View>
                
                {/* Card Content */}
                <View style={styles.cardContent}>
                  <View style={styles.cardTextContainer}>
                    <Text style={styles.cardBusinessName}>
                      {businessName || 'BUSINESS NAME'}
                    </Text>
                    <Text style={styles.cardTagline}>
                      PROFESSIONAL SERVICES AND CREATIVE EXECUTIVE
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Back Card (Stacked behind) */}
            <View style={[styles.businessCard, styles.backCard]}>
              <View style={styles.cardBackground}>
                <View style={styles.decorativePattern}>
                  <View style={styles.patternLine1} />
                  <View style={styles.patternLine2} />
                  <View style={styles.patternCircle} />
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Features List */}
        <View style={styles.featuresContainer}>
          <View style={styles.featureItem}>
            <Icon name="phone" size={20} color="#2E7D32" />
            <Text style={styles.featureText}>Contact information included</Text>
          </View>
          <View style={styles.featureItem}>
            <Icon name="share" size={20} color="#2E7D32" />
            <Text style={styles.featureText}>Easy sharing via QR code</Text>
          </View>
          <View style={styles.featureItem}>
            <Icon name="edit" size={20} color="#2E7D32" />
            <Text style={styles.featureText}>Customizable design and content</Text>
          </View>
          <View style={styles.featureItem}>
            <Icon name="cloud" size={20} color="#2E7D32" />
            <Text style={styles.featureText}>Always up-to-date information</Text>
          </View>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={[styles.createButton, isCreating && styles.createButtonDisabled]}
          onPress={handleCreateBusinessCard}
          disabled={isCreating}
        >
          <Text style={styles.createButtonText}>
            {isCreating ? 'Creating Business Card...' : 'Create Business Card'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.skipButton}
          onPress={handleSkipForNow}
          disabled={isCreating}
        >
          <Text style={styles.skipButtonText}>Skip for Now</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F6F8',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212121',
    fontFamily: 'Poppins-SemiBold',
  },
  placeholder: {
    width: 32,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  titleContainer: {
    marginTop: 32,
    marginBottom: 40,
    alignItems: 'center',
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212121',
    textAlign: 'center',
    marginBottom: 12,
    fontFamily: 'Poppins-Bold',
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 16,
    color: '#757575',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
    fontFamily: 'Poppins-Regular',
  },
  previewContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  cardContainer: {
    position: 'relative',
    width: screenWidth * 0.8,
    height: 200,
  },
  businessCard: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
    position: 'absolute',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  backCard: {
    transform: [{ translateX: 8 }, { translateY: 8 }],
    zIndex: 1,
  },
  cardBackground: {
    flex: 1,
    backgroundColor: '#D4BFA0',
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  decorativePattern: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: '60%',
    height: '100%',
  },
  patternLine1: {
    position: 'absolute',
    top: 20,
    right: -20,
    width: 120,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    transform: [{ rotate: '25deg' }],
  },
  patternLine2: {
    position: 'absolute',
    bottom: 40,
    right: -30,
    width: 150,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    transform: [{ rotate: '15deg' }],
  },
  patternCircle: {
    position: 'absolute',
    top: 60,
    right: 30,
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  cardContent: {
    flex: 1,
    padding: 24,
    justifyContent: 'flex-end',
    zIndex: 2,
  },
  cardTextContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 16,
    borderRadius: 8,
    maxWidth: '75%',
  },
  cardBusinessName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 4,
    fontFamily: 'Poppins-Bold',
  },
  cardTagline: {
    fontSize: 8,
    color: '#757575',
    lineHeight: 12,
    fontFamily: 'Poppins-Regular',
  },
  featuresContainer: {
    marginBottom: 40,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  featureText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#212121',
    fontFamily: 'Poppins-Regular',
  },
  bottomContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  createButton: {
    backgroundColor: '#4A90E2',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  createButtonDisabled: {
    backgroundColor: '#BDBDBD',
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Poppins-SemiBold',
  },
  skipButton: {
    backgroundColor: 'transparent',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
  },
  skipButtonText: {
    color: '#757575',
    fontSize: 16,
    fontWeight: '500',
    fontFamily: 'Poppins-Medium',
  },
});

export default BusinessCardScreen;