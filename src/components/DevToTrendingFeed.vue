<template>
  <div class="dev-to-trending">
    <div v-if="isLoading" class="loading-state">
      <p><i class="fas fa-spinner fa-spin"></i> Loading trending articles...</p>
    </div>
    
    <div v-else-if="error" class="error-state">
      <p><i class="fas fa-exclamation-triangle"></i> {{ error }}</p>
      <button @click="loadTrendingArticles" class="btn btn-outline-primary btn-sm">
        <i class="fas fa-sync"></i> Try Again
      </button>
    </div>
    
    <div v-else class="articles-container">
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h5 class="mb-0">
          <i class="fas fa-fire"></i> Trending on Dev.to
        </h5>
        <button @click="loadTrendingArticles" class="btn btn-sm btn-outline-primary">
          <i class="fas fa-sync"></i> Refresh
        </button>
      </div>
      
      <div v-if="articles.length === 0" class="empty-state">
        <i class="fab fa-dev"></i>
        <p>No trending articles available right now</p>
        <small>Check back later for new content</small>
      </div>
      
      <div v-else class="trending-articles">
        <div v-for="article in articles" :key="article.id" class="trending-article">
          <a :href="article.url" target="_blank" class="article-link">
            <div class="article-header">
              <img :src="article.user.profile_image_90 || require('@/assets/default_pfp.jpg')" alt="Author" class="author-image">
              <div class="author-info">
                <p class="author-name">{{ article.user.name }}</p>
                <p class="publish-date">{{ formatDate(article.published_at) }}</p>
              </div>
            </div>
            
            <h3 class="article-title">{{ article.title }}</h3>
            
            <div class="article-stats">
              <span class="article-reactions">
                <i class="fas fa-heart"></i> {{ article.positive_reactions_count }}
              </span>
              <span class="article-comments">
                <i class="fas fa-comment"></i> {{ article.comments_count }}
              </span>
            </div>
            
            <div class="article-tags">
              <span v-for="tag in article.tag_list" :key="tag" class="tag">{{ tag }}</span>
            </div>
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useDevToApi } from '@/composables/useDevToApi';

const { isLoading, error, getTrendingArticles } = useDevToApi();
const articles = ref([]);

// Load trending articles when the component mounts
onMounted(() => {
  loadTrendingArticles();
});

// Function to load trending articles from Dev.to
async function loadTrendingArticles() {
  try {
    const results = await getTrendingArticles();
    articles.value = results.slice(0, 5); // Limit to 5 articles for the feed
  } catch (err) {
    console.error('Error loading trending Dev.to articles:', err);
  }
}

// Format the date
function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}
</script>

<style scoped>
.dev-to-trending {
  padding: 16px 0;
}

.loading-state, .error-state, .empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
  text-align: center;
  border-radius: 6px;
  background-color: var(--github-card-bg);
  border: 1px dashed var(--github-border);
  color: var(--github-secondary-text);
}

.loading-state i, .error-state i, .empty-state i {
  font-size: 2rem;
  margin-bottom: 1rem;
}

.empty-state .fab.fa-dev {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.trending-articles {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.trending-article {
  background-color: var(--github-card-bg);
  border: 1px solid var(--github-border);
  border-radius: 6px;
  overflow: hidden;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.trending-article:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.article-link {
  display: block;
  padding: 16px;
  color: inherit;
  text-decoration: none;
}

.article-header {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

.author-image {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
  margin-right: 12px;
}

.author-info {
  flex: 1;
}

.author-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--github-text);
  margin: 0;
}

.publish-date {
  font-size: 12px;
  color: var(--github-secondary-text);
  margin: 0;
}

.article-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 12px;
  color: var(--github-link);
  line-height: 1.4;
}

.article-stats {
  display: flex;
  gap: 16px;
  margin-bottom: 12px;
  color: var(--github-secondary-text);
  font-size: 13px;
}

.article-reactions, .article-comments {
  display: flex;
  align-items: center;
  gap: 6px;
}

.article-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag {
  background-color: rgba(56, 139, 253, 0.1);
  color: var(--github-link);
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

h5 i {
  color: #f85149;
  margin-right: 6px;
}
</style>