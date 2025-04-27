<template>
    <div class="all">
        <mini-navbar />
        <div class="home-container">
            <!-- Left Column - Profile Summary -->
            <div class="profile-sidebar">
                <div class="profile-summary" v-if="user && userData">
                    <div class="profile-info">
                        <div class="profile-image">
                            <img
                                :src="
                                    userData.avatar ||
                                    require('@/assets/default_pfp.jpg')
                                "
                                alt="Profile"
                            />
                        </div>
                        <h3 class="profile-name">{{ userData.username }}</h3>
                        <p class="profile-bio">
                            {{
                                userData.bio ||
                                "Add a bio to tell people about yourself"
                            }}
                        </p>
                    </div>
                </div>
            </div>

            <!-- Middle Column - Post Creation and Feed -->
            <div class="main-content">
                <!-- Post creation area -->
                <div class="post-creation-card">
                    <div class="post-input-area">
                        <div class="user-avatar">
                            <img
                                :src="
                                    userData?.avatar ||
                                    require('@/assets/default_pfp.jpg')
                                "
                                alt="User Avatar"
                            />
                        </div>
                        <div class="post-input" @click="openPostModal">
                            <span>Start a post</span>
                        </div>
                    </div>
                    <div class="post-actions">
                        <button class="post-action-btn">
                            <i class="fas fa-image"></i>
                            <span>Media</span>
                        </button>
                        <button class="post-action-btn">
                            <i class="fas fa-calendar-alt"></i>
                            <span>Event</span>
                        </button>
                        <button class="post-action-btn">
                            <i class="fas fa-newspaper"></i>
                            <span>Write article</span>
                        </button>
                    </div>
                </div>

                <!-- Sort/filter options -->
                <div class="feed-sort">
                    <div class="sort-divider"></div>
                    <div class="sort-option">
                        <span>Sort by:</span>
                        <select v-model="sortOption" class="sort-select">
                            <option value="recent">Recent</option>
                            <option value="top">Top</option>
                        </select>
                    </div>
                </div>

                <!-- Posts feed -->
                <div class="posts-feed">
                    <posts-list />
                </div>
            </div>

            <!-- Right Column - User Suggestions -->
            <div class="right-sidebar">
                <!-- People to follow section -->
                <div class="follow-suggestions-card">
                    <h3 class="sidebar-title">Add to your feed</h3>
                    <followable-users-list :max-users="3" />
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import MiniNavbar from "@/components/MiniNavbar.vue";
import PostsList from "@/components/PostsList.vue";
import FollowableUsersList from "@/components/FollowableUsersList.vue";
import { db, auth } from "@/firebase/config.js";
import { onMounted, ref } from "vue";

const user = ref(null);
const userData = ref(null);
const sortOption = ref("recent");

const fetchUserData = async (userId) => {
    try {
        const doc = await db.collection("users").doc(userId).get();
        if (doc.exists) {
            userData.value = doc.data();
        }
    } catch (error) {
        console.error("Error fetching user data: ", error);
    }
};

const openPostModal = () => {
    // Implement post creation modal functionality here
    console.log("Open post creation modal");
};

onMounted(() => {
    auth.onAuthStateChanged((firebaseUser) => {
        user.value = firebaseUser;
        if (firebaseUser) {
            fetchUserData(firebaseUser.uid);
        }
    });
});
</script>

<style>
html,
body,
#app {
    height: 100%;
    margin: 0;
    padding: 0;
}

.all {
    background-color: #0d1117;
    width: 100%;
    min-height: 100%;
}

/* Three-column layout container */
.home-container {
    max-width: 1600px;
    margin: 0 auto;
    padding: 20px 16px;
    display: grid;
    grid-template-columns: 1fr 2fr 1fr;
    gap: 20px;
}

/* Profile sidebar (left column) */
.profile-sidebar {
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.profile-summary {
    background-color: #1a2233;
    border-radius: 8px;
    border: 1px solid #555d69;
    overflow: hidden;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.profile-info {
    padding: 20px;
    text-align: center;
    position: relative;
}

.profile-image {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    overflow: hidden;
    margin: 0 auto 15px;
    border: 4px solid #1a2233;
    background-color: #0d1117;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
}

.profile-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.profile-name {
    margin: 5px 0;
    color: #ffffff;
    font-size: 18px;
    font-weight: 600;
}

.profile-bio {
    color: #cfd8dc;
    font-size: 14px;
    margin-bottom: 10px;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    line-clamp: 2;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
}

/* Main content (middle column) */
.main-content {
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.post-creation-card {
    background-color: #1a2233;
    border-radius: 8px;
    padding: 20px;
    border: 1px solid #555d69;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.post-input-area {
    display: flex;
    align-items: center;
    gap: 15px;
    margin-bottom: 15px;
}

.user-avatar {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    overflow: hidden;
}

.user-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border: 2px solid #3498db;
}

.post-input {
    flex: 1;
    background-color: #10151f;
    border: 1px solid #555d69;
    border-radius: 30px;
    padding: 12px 20px;
    color: #cfd8dc;
    cursor: pointer;
    transition: background-color 0.3s ease, border-color 0.3s ease;
}

.post-input:hover {
    background-color: #0d1117;
    border-color: #3498db;
}

.post-actions {
    display: flex;
    justify-content: space-around;
}

.post-action-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    background: none;
    border: none;
    color: #cfd8dc;
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.3s ease;
}

.post-action-btn:hover {
    background-color: rgba(255, 255, 255, 0.05);
    color: #3498db;
}

.post-action-btn i {
    font-size: 18px;
}

.feed-sort {
    display: flex;
    align-items: center;
}

.sort-divider {
    flex: 1;
    height: 1px;
    background-color: #555d69;
}

.sort-option {
    padding: 0 15px;
    display: flex;
    align-items: center;
    gap: 8px;
    color: #cfd8dc;
    font-size: 14px;
}

.sort-select {
    background-color: transparent;
    border: none;
    color: #3498db;
    font-weight: 600;
    cursor: pointer;
    padding: 3px;
    font-size: 14px;
}

.sort-select option {
    background-color: #1a2233;
    color: #cfd8dc;
}

/* Fix for PostsList component */
.posts-feed {
    width: 100%;
}

.posts-feed :deep(.container) {
    padding: 0;
    width: 100%;
    max-width: 100%;
}

.posts-feed :deep(.row) {
    margin: 0;
}

.posts-feed :deep(.col-12) {
    padding: 0;
}

.posts-feed :deep(.column) {
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.posts-feed :deep(.col-md-4) {
    width: 100%;
    padding: 0;
    margin-bottom: 0 !important;
}

/* Right sidebar */
.right-sidebar {
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.follow-suggestions-card {
    background-color: #1a2233;
    border-radius: 8px;
    padding: 15px;
    border: 1px solid #555d69;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.sidebar-title {
    margin-top: 0;
    margin-bottom: 15px;
    color: #ffffff;
    font-size: 16px;
}

/* Media queries for responsive design */
@media (max-width: 1200px) {
    .home-container {
        grid-template-columns: 1fr 2fr;
    }

    .right-sidebar {
        display: none;
    }
}

@media (max-width: 768px) {
    .home-container {
        grid-template-columns: 1fr;
        padding: 10px;
    }

    .profile-sidebar {
        order: 2;
    }

    .main-content {
        order: 1;
    }
}
</style>
