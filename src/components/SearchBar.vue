<template>
    <div class="search-container">
        <div class="search-input-wrapper">
            <input
                type="text"
                v-model="searchQuery"
                @input="handleSearch"
                @focus="showResults = true"
                @blur="closeResultsDelayed"
                placeholder="Search users or posts..."
                class="search-input"
            />
            <div class="search-icon">
                <i
                    class="fa-solid"
                    :class="loading ? 'fa-spinner fa-spin' : 'fa-search'"
                ></i>
            </div>
        </div>
        <div
            v-if="showResults && searchQuery.length > 0"
            class="search-results"
        >
            <div v-if="loading" class="search-loading">
                <LoadingOverlay message="Searching..." transparent />
            </div>
            <div v-else-if="noResults" class="no-results">
                <i class="fas fa-search-minus"></i> No results found
            </div>
            <div v-else>
                <!-- Users section -->
                <div v-if="userResults.length > 0" class="result-section">
                    <div class="result-section-title">Users</div>
                    <div
                        v-for="user in userResults"
                        :key="'user-' + user.id"
                        class="result-item"
                        @mousedown="navigateToProfile(user.id)"
                    >
                        <div class="result-avatar">
                            <img
                                :src="
                                    user.avatar ||
                                    require('@/assets/default_pfp.jpg')
                                "
                                alt="Profile"
                            />
                        </div>
                        <div class="result-info">
                            <div class="result-name">{{ user.username }}</div>
                            <div class="result-description">
                                {{ truncate(user.bio || "No bio") }}
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Posts section -->
                <div v-if="postResults.length > 0" class="result-section">
                    <div class="result-section-title">Posts</div>
                    <div
                        v-for="post in postResults"
                        :key="'post-' + post.id"
                        class="result-item"
                        @mousedown="navigateToPost(post.id)"
                    >
                        <div class="result-icon">
                            <i class="fa-solid fa-newspaper"></i>
                        </div>
                        <div class="result-info">
                            <div class="result-name">
                                {{ truncate(post.content, 30) }}
                            </div>
                            <div class="result-description">
                                {{ truncate(post.summary || "") }}
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Projects section -->
                <div v-if="projectResults.length > 0" class="result-section">
                    <div class="result-section-title">Projects</div>
                    <div
                        v-for="project in projectResults"
                        :key="'project-' + project.id"
                        class="result-item"
                        @mousedown="navigateToProject(project.id, project.uid)"
                    >
                        <div class="result-icon">
                            <i class="fa-solid fa-code"></i>
                        </div>
                        <div class="result-info">
                            <div class="result-name">{{ project.title }}</div>
                            <div class="result-description">
                                {{ truncate(project.description || "") }}
                            </div>
                            <div class="result-tags">
                                <span
                                    v-for="(tech, index) in project.stack.slice(
                                        0,
                                        3
                                    )"
                                    :key="index"
                                    class="tag"
                                >
                                    {{ tech }}
                                </span>
                                <span v-if="project.stack.length > 3"
                                    >+{{ project.stack.length - 3 }}</span
                                >
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import { db } from "@/firebase/config.js";
import { useRouter } from "vue-router";
import { debounce } from "lodash"; // Make sure to install lodash if not already
import LoadingOverlay from "@/components/LoadingOverlay.vue";

const router = useRouter();
const searchQuery = ref("");
const userResults = ref([]);
const postResults = ref([]);
const projectResults = ref([]);
const loading = ref(false);
const showResults = ref(false);

// Helper function to truncate text
const truncate = (text, length = 60) => {
    if (!text) return "";
    return text.length > length ? text.substring(0, length) + "..." : text;
};

// Computed property to check if no results were found
const noResults = computed(() => {
    return (
        !loading.value &&
        userResults.value.length === 0 &&
        postResults.value.length === 0 &&
        projectResults.value.length === 0
    );
});

// Debounced search function
const handleSearch = debounce(async () => {
    if (searchQuery.value.trim().length < 2) {
        userResults.value = [];
        postResults.value = [];
        projectResults.value = [];
        return;
    }

    loading.value = true;

    try {
        await Promise.all([searchUsers(), searchPosts(), searchProjects()]);
    } catch (error) {
        console.error("Error performing search:", error);
    } finally {
        loading.value = false;
    }
}, 300);

// Search for users
const searchUsers = async () => {
    const query = searchQuery.value.toLowerCase();

    try {
        // Search users by username (case insensitive search not directly supported in Firestore)
        const usersSnapshot = await db.collection("users").get();

        // Client-side filtering for case-insensitive search
        userResults.value = usersSnapshot.docs
            .filter((doc) => {
                const data = doc.data();
                return (
                    (data.username &&
                        data.username.toLowerCase().includes(query)) ||
                    (data.bio && data.bio.toLowerCase().includes(query))
                );
            })
            .map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }))
            .slice(0, 5); // Limit to 5 results
    } catch (error) {
        console.error("Error searching users:", error);
        userResults.value = [];
    }
};

// Search for posts in publicFeed
const searchPosts = async () => {
    const query = searchQuery.value.toLowerCase();

    try {
        // Search posts by content or summary
        const postsSnapshot = await db.collection("publicFeed").get();

        // Client-side filtering
        postResults.value = postsSnapshot.docs
            .filter((doc) => {
                const data = doc.data();
                return (
                    (data.content &&
                        data.content.toLowerCase().includes(query)) ||
                    (data.summary && data.summary.toLowerCase().includes(query))
                );
            })
            .map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }))
            .slice(0, 5); // Limit to 5 results
    } catch (error) {
        console.error("Error searching posts:", error);
        postResults.value = [];
    }
};

// Search for public projects
const searchProjects = async () => {
    const query = searchQuery.value.toLowerCase();

    try {
        // Search projects by title or stack
        const projectsSnapshot = await db.collection("publicProjects").get();

        // Client-side filtering
        projectResults.value = projectsSnapshot.docs
            .filter((doc) => {
                const data = doc.data();
                return (
                    (data.title && data.title.toLowerCase().includes(query)) ||
                    (data.stack &&
                        data.stack.some((tech) =>
                            tech.toLowerCase().includes(query)
                        ))
                );
            })
            .map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }))
            .slice(0, 5); // Limit to 5 results
    } catch (error) {
        console.error("Error searching projects:", error);
        projectResults.value = [];
    }
};

// Navigation functions
const navigateToProfile = (userId) => {
    router.push({ name: "Profil", params: { id: userId } });
    showResults.value = false;
};

const navigateToPost = (postId) => {
    // This will need to be updated based on how your routes are set up for viewing posts
    router.push({ name: "Post", params: { id: postId } });
    showResults.value = false;
};

const navigateToProject = (projectId, userId) => {
    // This will need to be updated based on how your routes are set up for viewing projects
    router.push({
        name: "Profil",
        params: { id: userId },
        query: { project: projectId },
    });
    showResults.value = false;
};

// Close results with a slight delay to allow for clicking
const closeResultsDelayed = () => {
    setTimeout(() => {
        showResults.value = false;
    }, 200);
};

// Clear results when search query is empty
watch(searchQuery, (newValue) => {
    if (!newValue || newValue.trim() === "") {
        userResults.value = [];
        postResults.value = [];
        projectResults.value = [];
    }
});
</script>

<style scoped>
.search-container {
    position: relative;
    width: 280px;
}

.search-input-wrapper {
    position: relative;
}

.search-input {
    width: 100%;
    padding: 8px 16px 8px 36px;
    border-radius: 20px;
    border: 1px solid #555d69;
    background-color: rgba(255, 255, 255, 0.05);
    color: #cfd8dc;
    font-size: 14px;
    outline: none;
    transition: all 0.3s ease;
}

.search-input:focus {
    border-color: #7d8796;
    background-color: rgba(255, 255, 255, 0.08);
    box-shadow: 0 0 5px rgba(125, 135, 150, 0.3);
}

.search-icon {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: #7d8796;
}

.search-results {
    position: absolute;
    top: 100%;
    left: 0;
    width: 100%;
    max-height: 400px;
    overflow-y: auto;
    background-color: #1a1e23;
    border-radius: 8px;
    margin-top: 5px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 1100;
    border: 1px solid #2c313a;
}

.search-loading {
    position: relative;
    height: 100px;
}

.no-results {
    padding: 16px;
    color: #7d8796;
    font-size: 14px;
    text-align: center;
}

.no-results i {
    margin-right: 8px;
}

.result-section {
    padding: 10px 0;
    border-bottom: 1px solid #2c313a;
}

.result-section:last-child {
    border-bottom: none;
}

.result-section-title {
    padding: 0 12px 5px;
    color: #7d8796;
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.result-item {
    display: flex;
    align-items: center;
    padding: 8px 12px;
    cursor: pointer;
    transition: background-color 0.2s ease;
}

.result-item:hover {
    background-color: rgba(255, 255, 255, 0.05);
}

.result-avatar,
.result-icon {
    width: 36px;
    height: 36px;
    margin-right: 12px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #2c313a;
    color: #cfd8dc;
    font-size: 16px;
    overflow: hidden;
}

.result-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.result-info {
    flex: 1;
}

.result-name {
    color: #cfd8dc;
    font-size: 14px;
    font-weight: 500;
    margin-bottom: 2px;
}

.result-description {
    color: #7d8796;
    font-size: 12px;
}

.result-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    margin-top: 4px;
}

.tag {
    display: inline-block;
    padding: 2px 6px;
    background-color: rgba(125, 135, 150, 0.1);
    color: #7d8796;
    border-radius: 4px;
    font-size: 10px;
    font-weight: 500;
}
</style>
