<template>
    <div class="all">
        <mini-navbar />
        <div class="home-container">
            <!-- Full-page loading overlay when everything is loading -->
            <LoadingOverlay
                v-if="initialLoading"
                fullPage
                large
                message="Loading your feed..."
            />

            <!-- Left Column - Profile Summary -->
            <div class="profile-sidebar">
                <div class="profile-summary" v-if="userLoading">
                    <LoadingOverlay message="Loading profile..." transparent />
                </div>
                <div class="profile-summary" v-else-if="user && userData">
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
                <post-creation
                    :user-avatar="userData?.avatar"
                    :user-id="user?.uid"
                    @open-post-modal="openPostModal"
                    @post-created="handlePostCreated"
                />

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

        <!-- Post edit modal -->
        <div
            v-if="showPostModal"
            class="post-modal-overlay"
            @click="closePostModal"
        >
            <div class="post-modal" @click.stop>
                <div class="modal-header">
                    <h3>{{ editingPost ? "Edit Post" : "Create Post" }}</h3>
                    <button class="close-btn" @click="closePostModal">
                        &times;
                    </button>
                </div>
                <div class="modal-body">
                    <textarea
                        v-model="postContent"
                        class="post-content-editor"
                        placeholder="What would you like to share?"
                        rows="5"
                    ></textarea>

                    <!-- Optional image upload -->
                    <div class="post-image-upload">
                        <label for="post-image" class="image-upload-label">
                            <i class="fas fa-image"></i>
                            <span>Add an image</span>
                        </label>
                        <input
                            type="file"
                            id="post-image"
                            accept="image/*"
                            @change="handleImageUpload"
                            class="image-upload-input"
                        />
                    </div>

                    <div v-if="uploadingImage" class="upload-progress">
                        <div class="spinner small-spinner"></div>
                        <span>Uploading image...</span>
                    </div>

                    <div v-if="postImage" class="post-image-preview">
                        <img :src="postImage" alt="Post image preview" />
                        <button class="remove-image-btn" @click="removeImage">
                            &times;
                        </button>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="cancel-btn" @click="closePostModal">
                        Cancel
                    </button>
                    <button
                        class="post-btn"
                        @click="savePost"
                        :disabled="!postContent.trim() || savingPost"
                    >
                        {{ savingPost ? "Posting..." : "Post" }}
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import MiniNavbar from "@/components/MiniNavbar.vue";
import PostsList from "@/components/PostsList.vue";
import FollowableUsersList from "@/components/FollowableUsersList.vue";
import LoadingOverlay from "@/components/LoadingOverlay.vue";
import PostCreation from "@/components/PostCreation.vue";
import { db, auth } from "@/firebase/config.js";
import { onMounted, ref } from "vue";
import firebase from "firebase/app";
import { uploadToGitHub } from "@/composables/uploadToGitHub";

const user = ref(null);
const userData = ref(null);
const sortOption = ref("recent");
const userLoading = ref(true);
const initialLoading = ref(true);

const showPostModal = ref(false);
const editingPost = ref(false);
const editingPostId = ref(null); // Add this missing ref
const postContent = ref("");
const postImage = ref(null);
const uploadingImage = ref(false);
const savingPost = ref(false);

const fetchUserData = async (userId) => {
    try {
        userLoading.value = true;
        const doc = await db.collection("users").doc(userId).get();
        if (doc.exists) {
            userData.value = doc.data();
        }
    } catch (error) {
        console.error("Error fetching user data: ", error);
    } finally {
        userLoading.value = false;
        // After user data is fetched, we can hide the initial loading screen
        initialLoading.value = false;
    }
};

const openPostModal = (data) => {
    console.log("Opening post modal with data:", data);

    if (data && data.postId) {
        editingPost.value = true;
        editingPostId.value = data.postId;
        postContent.value = data.initialContent || "";

        // If there's a picture URL, set it
        if (data.pictureUrl) {
            postImage.value = data.pictureUrl;
        }
    } else {
        editingPost.value = false;
        editingPostId.value = null;
        postContent.value = "";
        postImage.value = null;
    }

    showPostModal.value = true;
};

const closePostModal = () => {
    if (savingPost.value) return; // Don't close if currently saving

    showPostModal.value = false;
    postContent.value = "";
    postImage.value = null;
    editingPost.value = false;
    editingPostId.value = null;
    uploadingImage.value = false;
};

const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    uploadingImage.value = true;

    try {
        // Generate a unique filename for the post image
        const fileName = `posts-imgs/${Date.now()}-${file.name}`;

        // Upload the image to GitHub using the uploadToGitHub utility
        const downloadURL = await uploadToGitHub(file, fileName);

        // Set the image URL to be displayed in the preview and saved with the post
        postImage.value = downloadURL;
    } catch (error) {
        console.error("Error uploading image:", error);
        alert("Error uploading image. Please try again.");
    } finally {
        uploadingImage.value = false;
    }
};

const removeImage = () => {
    postImage.value = null;
};

const savePost = async () => {
    if (!postContent.value.trim()) return;

    savingPost.value = true;

    try {
        if (editingPost.value && editingPostId.value) {
            // Update existing post
            await db
                .collection("publicFeed")
                .doc(editingPostId.value)
                .update({
                    content: postContent.value,
                    picture: postImage.value || "",
                    // Don't modify other fields like type, pid, uid, etc.
                });

            console.log("Post updated successfully:", editingPostId.value);
        } else {
            // Create a new text post
            const newPostData = {
                addedAt: firebase.firestore.FieldValue.serverTimestamp(),
                content: postContent.value,
                summary: "", // No summary for text posts
                type: "text",
                uid: user.value.uid,
                picture: postImage.value || "",
                // Note: pid field intentionally absent for text posts
            };

            const docRef = await db.collection("publicFeed").add(newPostData);
            console.log("New post created with ID:", docRef.id);

            // Emit event to notify that a new post was created
            handlePostCreated(docRef.id);
        }
    } catch (error) {
        console.error("Error saving post:", error);
        alert("Error saving post. Please try again.");
    } finally {
        savingPost.value = false;
        closePostModal();
    }
};

// Handle new post creation event
const handlePostCreated = (postId) => {
    console.log("Post created with ID:", postId);
    // You could refresh the posts list or perform other actions here
    // This ensures the feed gets updated when a new post is added
};

onMounted(() => {
    initialLoading.value = true;

    // Set a timeout to ensure initial loading doesn't flash if data loads quickly
    const minLoadingTime = setTimeout(() => {
        if (user.value && userData.value) {
            initialLoading.value = false;
        }
    }, 800);

    auth.onAuthStateChanged((firebaseUser) => {
        user.value = firebaseUser;
        if (firebaseUser) {
            fetchUserData(firebaseUser.uid);
        } else {
            initialLoading.value = false;
            userLoading.value = false;
        }
    });

    // Cleanup timeout
    return () => clearTimeout(minLoadingTime);
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
    position: relative;
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
    position: relative;
    min-height: 220px;
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
    width: 100%;
}

.posts-feed :deep(.col-12) {
    padding: 0;
    width: 100%;
}

.posts-feed :deep(.column) {
    display: flex;
    flex-direction: column;
    gap: 20px;
    width: 100%;
}

.posts-feed :deep(.col-md-4) {
    width: 100% !important;
    max-width: 100% !important;
    flex: 0 0 100% !important;
    padding: 0;
    margin-bottom: 0 !important;
}

.posts-feed :deep(.post-card) {
    width: 100%;
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

/* Post modal styles */
.post-modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.7);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
}

.post-modal {
    background-color: #1a2233;
    border-radius: 8px;
    width: 90%;
    max-width: 500px;
    padding: 20px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    position: relative;
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
}

.modal-header h3 {
    margin: 0;
    color: #ffffff;
    font-size: 18px;
}

.close-btn {
    background: none;
    border: none;
    color: #ffffff;
    font-size: 24px;
    cursor: pointer;
}

.modal-body {
    display: flex;
    flex-direction: column;
    gap: 15px;
}

.post-content-editor {
    width: 100%;
    padding: 10px;
    border-radius: 4px;
    border: 1px solid #555d69;
    background-color: #0d1117;
    color: #ffffff;
    resize: none;
}

.post-image-upload {
    display: flex;
    align-items: center;
    gap: 10px;
}

.image-upload-label {
    display: flex;
    align-items: center;
    gap: 5px;
    cursor: pointer;
    color: #3498db;
}

.image-upload-input {
    display: none;
}

.upload-progress {
    display: flex;
    align-items: center;
    gap: 10px;
    color: #cfd8dc;
}

.small-spinner {
    width: 20px;
    height: 20px;
    border-width: 2px;
}

.post-image-preview {
    position: relative;
}

.post-image-preview img {
    width: 100%;
    border-radius: 4px;
}

.remove-image-btn {
    position: absolute;
    top: 5px;
    right: 5px;
    background-color: rgba(0, 0, 0, 0.5);
    border-radius: 50%;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    color: #ffffff;
    font-size: 18px;
    cursor: pointer;
}

.modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    margin-top: 15px;
}

.cancel-btn,
.post-btn {
    padding: 8px 16px;
    border-radius: 4px;
    border: none;
    cursor: pointer;
}

.cancel-btn {
    background-color: #555d69;
    color: #ffffff;
}

.post-btn {
    background-color: #3498db;
    color: #ffffff;
}

.post-btn:disabled {
    background-color: #555d69;
    cursor: not-allowed;
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
