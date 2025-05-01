<template>
    <div class="posts-container">
        <div class="posts-row">
            <div v-if="loading" class="loading-container">
                <LoadingOverlay message="Loading posts..." large />
            </div>
            <div v-else-if="error" class="error-container">
                <div class="error-message">
                    <i class="fas fa-exclamation-circle"></i>
                    Error: {{ error }}
                </div>
            </div>
            <div v-else class="posts-column" :class="{ 'gallery-view': displayMode === 'gallery' }">
                <div v-if="posts.length === 0" class="empty-state">
                    <i class="fas fa-newspaper empty-icon"></i>
                    <p>No posts to display yet</p>
                </div>
                <div
                    v-else
                    v-for="post in posts"
                    :key="post"
                    class="post-wrapper"
                    :class="{ 'gallery-item': displayMode === 'gallery' }"
                >
                    <post-item :postId="post" :gallery-mode="displayMode === 'gallery'" />
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import PostItem from "@/components/PostItem";
import LoadingOverlay from "@/components/LoadingOverlay";
import { getPosts } from "@/composables/getPost";
import {
    ref,
    onMounted,
    onUnmounted,
    watchEffect,
    defineProps,
    watch,
} from "vue";

const props = defineProps({
    sortOption: {
        type: String,
        default: "newest",
    },
    displayMode: {
        type: String,
        default: "list", // list or gallery
    },
});

const posts = ref([]);
const loading = ref(true);
const error = ref(null);
let unsubscribe = null;
let postsData = null;

onMounted(() => {
    // Initial sorting direction based on sortOption
    const initialSortDirection = props.sortOption === "newest" ? "desc" : "asc";
    postsData = getPosts(initialSortDirection);

    // Use watchEffect to sync reactive references
    watchEffect(() => {
        posts.value = postsData.posts.value;
        error.value = postsData.error.value;
        loading.value = postsData.loading.value;
    });

    // Store unsubscribe function to clean up when component unmounts
    unsubscribe = postsData.unsubscribe;
});

// Watch for sort option changes
watch(
    () => props.sortOption,
    (newSortOption) => {
        // Cleanup previous subscription
        if (unsubscribe) {
            unsubscribe();
        }

        // Create a new subscription with the updated sort direction
        const sortDirection = newSortOption === "newest" ? "desc" : "asc";
        console.log("Changing sort direction to:", sortDirection);

        loading.value = true;
        postsData = getPosts(sortDirection);

        // Update the unsubscribe function
        unsubscribe = postsData.unsubscribe;

        // Sync the new data
        watchEffect(() => {
            posts.value = postsData.posts.value;
            error.value = postsData.error.value;
            loading.value = postsData.loading.value;
        });
    }
);

onUnmounted(() => {
    // Cleanup subscription when component is destroyed
    if (unsubscribe) {
        unsubscribe();
        console.log("Unsubscribed from posts feed");
    }
});
</script>

<style scoped>
.posts-container {
    width: 100%;
}

.posts-row {
    width: 100%;
    display: flex;
    flex-direction: column;
}

.posts-column {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.post-wrapper {
    width: 100%;
}

.loading-container {
    width: 100%;
    height: 300px;
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
}

.error-container {
    margin: 20px 0;
    width: 100%;
}

.error-message {
    padding: 1rem;
    background-color: rgba(231, 76, 60, 0.1);
    border: 1px solid rgba(231, 76, 60, 0.3);
    color: #e74c3c;
    border-radius: 6px;
    text-align: center;
}

.error-message i {
    margin-right: 0.5rem;
}

.empty-state {
    text-align: center;
    padding: 40px 20px;
    background-color: rgba(13, 17, 23, 0.5);
    border-radius: 8px;
    border: 1px dashed #555d69;
    color: #cfd8dc;
}

.empty-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
    color: #555d69;
}

/* Gallery view styles */
.gallery-view {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 20px;
}

.gallery-item {
    height: 100%;
    min-height: 400px;
    margin-bottom: 0;
}

/* Remove hover transform from container as it's handled in the card */
.gallery-item:hover {
    transform: none;
}

/* Responsive gallery adjustments */
@media (max-width: 768px) {
    .gallery-view {
        grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
        gap: 16px;
    }
}

@media (max-width: 480px) {
    .gallery-view {
        grid-template-columns: 1fr;
        gap: 16px;
    }
}
</style>
