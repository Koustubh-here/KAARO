/**
 * ProductImageService.js
 * Service for fetching product images from Unsplash
 */

// Load Unsplash API key from environment variables
const UNSPLASH_ACCESS_KEY = process.env.REACT_APP_UNSPLASH_ACCESS_KEY;

class ProductImageService {
  
  /**
   * Main function to fetch product image
   * @param {string} productName - Name of the product
   * @param {string} category - Product category (optional)
   * @returns {Promise<string>} - Image URL
   */
  static async fetchProductImage(productName, category = '') {
    try {
      // Check if Unsplash API key is available
      if (!UNSPLASH_ACCESS_KEY) {
        console.warn('UNSPLASH_ACCESS_KEY not found in environment variables');
        return this.getDefaultImage(category);
      }

      // Fetch image from Unsplash
      const imageUrl = await this.fetchFromUnsplash(productName, category);
      
      // Fallback to a default image if nothing found
      return imageUrl || this.getDefaultImage(category);
      
    } catch (error) {
      console.error('Error fetching product image:', error);
      return this.getDefaultImage(category);
    }
  }

  /**
   * Fetch image from Unsplash
   */
  static async fetchFromUnsplash(productName, category) {
    try {
      if (!UNSPLASH_ACCESS_KEY) {
        console.warn('Unsplash API key not configured');
        return null;
      }

      const query = `${productName} ${category}`.trim();
      const response = await fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`,
        {
          headers: {
            'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`,
          },
        }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        return data.results[0].urls.regular;
      }
      
      return null;
    } catch (error) {
      console.error('Unsplash API error:', error);
      return null;
    }
  }

  /**
   * Get default placeholder image based on category
   */
  static getDefaultImage(category) {
    const defaultImages = {
      'food': 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800&h=600&fit=crop',
      'electronics': 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=800&h=600&fit=crop',
      'clothing': 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=800&h=600&fit=crop',
      'home': 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=600&fit=crop',
      'beauty': 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800&h=600&fit=crop',
      'sports': 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop',
      'books': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=600&fit=crop',
      'toys': 'https://images.unsplash.com/photo-1558877385-3ad2f1606ad1?w=800&h=600&fit=crop',
    };
    
    const categoryLower = category.toLowerCase();
    return defaultImages[categoryLower] || 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800&h=600&fit=crop';
  }

  /**
   * Validate if image URL is accessible
   */
  static async validateImageUrl(url) {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      return response.ok;
    } catch (error) {
      return false;
    }
  }
}

export default ProductImageService;