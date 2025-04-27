<template>
    <div class="container">
        <h1 class="text-center">Posts</h1>
        <div class="row">
            <div v-if="loading" class="col-12 text-center">
                <p>Loading...</p>
            </div>
            <div v-else-if="error" class="col-12 text-center">
                <p>Error: {{ error }}</p>
            </div>
            <div v-else class="col-12">
                <div class="column">
                    <div v-for="post in posts" :key="post" class="col-md-4 mb-4">
                        <post-item :postId="post" />
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>


<script setup>
import PostItem from '@/components/PostItem.vue';
import { getPosts } from '@/composables/getPost';
import { ref, onMounted, onUnmounted, watchEffect } from 'vue';

const posts = ref([]);
const loading = ref(true);
const error = ref(null);
let unsubscribe = null;

onMounted(() => {
    const postsData = getPosts();

    // Use watchEffect to sync reactive references
    watchEffect(() => {
        posts.value = postsData.posts.value;
        error.value = postsData.error.value;
        loading.value = postsData.loading.value;
    });

    // Store unsubscribe function to clean up when component unmounts
    unsubscribe = postsData.unsubscribe;
});

onUnmounted(() => {
    // Cleanup subscription when component is destroyed
    if (unsubscribe) {
        unsubscribe();
        console.log('Unsubscribed from posts feed');
    }
});
</script>