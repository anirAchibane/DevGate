import { ref } from 'vue'

/**
 * Composable for interacting with the Dev.to API
 * Documentation: https://developers.forem.com/api
 */
export function useDevToApi() {
  const isLoading = ref(false)
  const error = ref(null)
  
  // Base URL for Dev.to API
  const baseUrl = 'https://dev.to/api'
  
  /**
   * Fetch a user's articles from Dev.to
   * @param {string} username - Dev.to username
   * @param {number} page - Page number for pagination (default: 1)
   * @param {number} perPage - Number of articles per page (default: 10)
   * @returns {Promise} - Promise resolving to array of articles
   */
  const getUserArticles = async (username, page = 1, perPage = 10) => {
    isLoading.value = true
    error.value = null
    
    try {
      const response = await fetch(`${baseUrl}/articles?username=${username}&page=${page}&per_page=${perPage}`)
      
      if (!response.ok) {
        throw new Error(`Error fetching Dev.to articles: ${response.status}`)
      }
      
      const articles = await response.json()
      return articles
    } catch (err) {
      error.value = err.message
      return []
    } finally {
      isLoading.value = false
    }
  }
  
  /**
   * Fetch trending articles from Dev.to
   * @param {number} page - Page number for pagination (default: 1)
   * @param {number} perPage - Number of articles per page (default: 10)
   * @returns {Promise} - Promise resolving to array of trending articles
   */
  const getTrendingArticles = async (page = 1, perPage = 10) => {
    isLoading.value = true
    error.value = null
    
    try {
      const response = await fetch(`${baseUrl}/articles?top=7&page=${page}&per_page=${perPage}`)
      
      if (!response.ok) {
        throw new Error(`Error fetching trending Dev.to articles: ${response.status}`)
      }
      
      const articles = await response.json()
      return articles
    } catch (err) {
      error.value = err.message
      return []
    } finally {
      isLoading.value = false
    }
  }
  
  /**
   * Search articles on Dev.to
   * @param {string} query - Search query
   * @param {number} page - Page number for pagination (default: 1)
   * @param {number} perPage - Number of articles per page (default: 10)
   * @returns {Promise} - Promise resolving to array of search results
   */
  const searchArticles = async (query, page = 1, perPage = 10) => {
    isLoading.value = true
    error.value = null
    
    try {
      // Dev.to API doesn't have a dedicated search endpoint, but we can filter by tag
      const response = await fetch(`${baseUrl}/articles?tag=${encodeURIComponent(query)}&page=${page}&per_page=${perPage}`)
      
      if (!response.ok) {
        throw new Error(`Error searching Dev.to articles: ${response.status}`)
      }
      
      const articles = await response.json()
      return articles
    } catch (err) {
      error.value = err.message
      return []
    } finally {
      isLoading.value = false
    }
  }
  
  /**
   * Publish an article to Dev.to (requires API key)
   * @param {string} apiKey - User's Dev.to API key
   * @param {Object} articleData - Article data object
   * @returns {Promise} - Promise resolving to published article data
   */
  const publishArticle = async (apiKey, articleData) => {
    isLoading.value = true
    error.value = null
    
    try {
      const response = await fetch(`${baseUrl}/articles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': apiKey
        },
        body: JSON.stringify({
          article: articleData
        })
      })
      
      if (!response.ok) {
        throw new Error(`Error publishing to Dev.to: ${response.status}`)
      }
      
      const result = await response.json()
      return result
    } catch (err) {
      error.value = err.message
      return null
    } finally {
      isLoading.value = false
    }
  }
  
  return {
    isLoading,
    error,
    getUserArticles,
    getTrendingArticles,
    searchArticles,
    publishArticle
  }
}