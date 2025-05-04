<template>
  <div class="dev-to-articles">
    <div v-if="isLoading" class="loading-state">
      <p><i class="fas fa-spinner fa-spin"></i> Loading articles...</p>
    </div>
    
    <div v-else-if="error" class="error-state">
      <p><i class="fas fa-exclamation-triangle"></i> {{ error }}</p>
      <button @click="loadArticles" class="btn btn-outline-primary btn-sm">
        <i class="fas fa-sync"></i> Try Again
      </button>
    </div>

    <div v-else-if="articles.length === 0" class="empty-state">
      <i class="fab fa-dev"></i>
      <p>No articles found on Dev.to</p>
      <div class="mt-2">
        <input v-model="devToUsername" placeholder="Enter Dev.to username" class="form-control mb-2" />
        <button @click="loadArticles" class="btn btn-outline-primary btn-sm">
          <i class="fas fa-search"></i> Find Articles
        </button>
      </div>
    </div>

    <div v-else class="articles-list">
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h5 class="mb-0">Your Dev.to Articles</h5>
        <div>
          <input v-model="devToUsername" placeholder="Dev.to username" class="form-control form-control-sm d-inline-block me-2" style="width: auto" />
          <button @click="loadArticles" class="btn btn-sm btn-outline-primary">
            <i class="fas fa-sync"></i> Refresh
          </button>
        </div>
      </div>
      
      <div v-for="article in articles" :key="article.id" class="article-card">
        <div class="article-image" v-if="article.cover_image">
          <img :src="article.cover_image" :alt="article.title" />
        </div>
        <div class="article-content">
          <h3 class="article-title">
            <a :href="article.url" target="_blank">{{ article.title }}</a>
          </h3>
          <p class="article-description">{{ article.description }}</p>
          <div class="article-meta">
            <span class="article-reactions">
              <i class="fas fa-heart"></i> {{ article.positive_reactions_count }}
            </span>
            <span class="article-comments">
              <i class="fas fa-comment"></i> {{ article.comments_count }}
            </span>
            <span class="article-date">
              <i class="fas fa-calendar"></i> {{ formatDate(article.published_at) }}
            </span>
          </div>
          <div class="article-tags">
            <span v-for="tag in article.tag_list" :key="tag" class="tag">{{ tag }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, defineProps } from 'vue';
import { useDevToApi } from '@/composables/useDevToApi';

const props = defineProps({
  userId: {
    type: String,
    required: true
  }
});

const { isLoading, error, getUserArticles } = useDevToApi();
const articles = ref([]);
const devToUsername = ref('');

// Load the articles when the component mounts
onMounted(() => {
  loadArticles();
});

// Watch for changes in the userId prop
watch(() => props.userId, () => {
  loadArticles();
});

// Function to load articles from Dev.to
async function loadArticles() {
  if (!devToUsername.value) {
    return;
  }
  
  try {
    const results = await getUserArticles(devToUsername.value);
    articles.value = results;
  } catch (err) {
    console.error('Error loading Dev.to articles:', err);
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
.dev-to-articles {
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

.article-card {
  display: flex;
  background-color: var(--github-card-bg);
  border: 1px solid var(--github-border);
  border-radius: 6px;
  overflow: hidden;
  margin-bottom: 16px;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.article-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.article-image {
  flex: 0 0 120px;
  background-color: #0d1117;
  position: relative;
  overflow: hidden;
}

.article-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.article-content {
  flex: 1;
  padding: 16px;
}

.article-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 8px;
  line-height: 1.4;
}

.article-title a {
  color: var(--github-link);
  text-decoration: none;
}

.article-title a:hover {
  text-decoration: underline;
}

.article-description {
  font-size: 14px;
  color: var(--github-secondary-text);
  margin-bottom: 12px;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.article-meta {
  display: flex;
  gap: 16px;
  margin-bottom: 12px;
  color: var(--github-secondary-text);
  font-size: 13px;
}

.article-reactions, .article-comments, .article-date {
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

@media (max-width: 600px) {
  .article-image {
    display: none;
  }
}
</style>