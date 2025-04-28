<template>
    <div class="post-item">
        <div
            class="post-content-wrapper"
            :class="{ 'loading-active': postloading || userloading }"
        >
            <LoadingOverlay
                v-if="postloading || userloading"
                message="Loading post..."
                transparent
            />

            <div v-else-if="posterror">
                <div class="error-message">
                    <i class="fas fa-exclamation-circle"></i>
                    Error loading post: {{ posterror }}
                </div>
            </div>
            <div v-else-if="usererror">
                <div class="error-message">
                    <i class="fas fa-exclamation-circle"></i>
                    Error loading user: {{ usererror }}
                </div>
            </div>

            <div v-else-if="post && user">
                <!-- Delete confirmation modal -->
                <div
                    v-if="showDeleteConfirmation"
                    class="delete-confirmation-overlay"
                >
                    <div class="delete-confirmation-modal">
                        <h3>Delete Post</h3>
                        <p>
                            Are you sure you want to delete this post? This
                            action cannot be undone.
                        </p>
                        <div class="delete-confirmation-actions">
                            <button
                                class="cancel-delete-btn"
                                @click="cancelDeletePost"
                                :disabled="isDeleting"
                            >
                                Cancel
                            </button>
                            <button
                                class="confirm-delete-btn"
                                @click="deletePost"
                                :disabled="isDeleting"
                            >
                                {{ isDeleting ? "Deleting..." : "Delete" }}
                            </button>
                        </div>
                    </div>
                </div>

                <div class="user-info">
                    <img :src="user.avatar" alt="User Avatar" class="avatar" />
                    <div class="text-inf">
                        <h3 class="username">{{ user.username }}</h3>
                        <p class="date">{{ formatDate(post.addedAt) }}</p>
                    </div>
                    <!-- Add delete button for user's own posts -->
                    <div v-if="isCurrentUserPost" class="post-actions">
                        <button
                            class="delete-post-btn"
                            @click="confirmDeletePost"
                        >
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                </div>

                <div class="post-info">
                    <div class="post-header">
                        <!-- <span class="post-type-badge" :class="'type-' + post.type">{{ post.type }}</span> -->
                        <h4 class="post-title">{{ post.summary }}</h4>
                    </div>

                    <!-- Common content for all post types -->
                    <p class="post-content">{{ post.content }}</p>

                    <!-- Type-specific content -->
                    <div v-if="post.type === 'project'" class="project-details">
                        <LoadingOverlay
                            v-if="projectLoading"
                            message="Loading project details..."
                            transparent
                        />
                        <div v-else-if="projectData" class="project-info">
                            <div class="stack-tags">
                                <span
                                    v-for="(tech, index) in projectData.stack"
                                    :key="index"
                                    class="stack-tag"
                                >
                                    {{ tech }}
                                </span>
                            </div>
                            <div
                                v-if="projectData.githubURL"
                                class="github-link"
                            >
                                <a
                                    :href="projectData.githubURL"
                                    target="_blank"
                                    rel="noopener"
                                >
                                    <i class="fab fa-github"></i> GitHub
                                    Repository
                                </a>
                            </div>
                        </div>
                    </div>

                    <div
                        v-else-if="post.type === 'objective'"
                        class="objective-details"
                    >
                        <LoadingOverlay
                            v-if="objectiveLoading"
                            message="Loading objective details..."
                            transparent
                        />
                        <div v-else-if="objectiveData" class="objective-info">
                            <div
                                class="objective-status"
                                :class="objectiveData.status"
                            >
                                Status: {{ objectiveData.status }}
                            </div>
                            <div class="objective-timeline">
                                <span
                                    >Started:
                                    {{
                                        formatDate(objectiveData.startDate)
                                    }}</span
                                >
                                <span
                                    >Last updated:
                                    {{
                                        formatDate(objectiveData.lastUpdated)
                                    }}</span
                                >
                            </div>
                        </div>
                    </div>

                    <div
                        v-else-if="post.type === 'skill'"
                        class="skill-details"
                    >
                        <LoadingOverlay
                            v-if="skillLoading"
                            message="Loading skill details..."
                            transparent
                        />
                        <div v-else-if="skillData" class="skill-info">
                            <div
                                class="skill-level"
                                :class="'level-' + skillData.level"
                            >
                                <i class="fas fa-chart-line"></i>
                                {{ skillData.level }}
                            </div>
                            <div class="skill-dates">
                                <span
                                    >Acquired:
                                    {{ formatDate(skillData.acquiredAt) }}</span
                                >
                            </div>
                        </div>
                    </div>

                    <div class="post-images" v-if="post.picture">
                        <img
                            :src="post.picture"
                            alt="Post Image"
                            class="post-image"
                        />
                    </div>
                </div>
                <div class="post-footer">
                    <button class="comment-btn" @click="toggleComments">
                        <i class="fa-solid fa-comment-dots"></i>
                        {{ showComments ? "Hide Comments" : "Comment" }}
                        <span v-if="commentsCount > 0" class="comments-count"
                            >({{ commentsCount }})</span
                        >
                    </button>

                    <div v-if="showComments" class="comments-section">
                        <div class="new-comment">
                            <img
                                :src="
                                    currentUserAvatar ||
                                    require('@/assets/default_pfp.jpg')
                                "
                                alt="Current User Avatar"
                                class="comment-avatar"
                            />
                            <div class="comment-input-wrapper">
                                <textarea
                                    v-model="newCommentText"
                                    placeholder="Write a comment..."
                                    class="comment-input"
                                    @keyup.enter="submitComment"
                                ></textarea>
                                <button
                                    class="post-comment-btn"
                                    @click="submitComment"
                                    :disabled="
                                        !newCommentText.trim() || addingComment
                                    "
                                >
                                    {{ addingComment ? "Posting..." : "Post" }}
                                </button>
                            </div>
                        </div>

                        <div v-if="commentsLoading" class="comments-loading">
                            <div class="spinner small-spinner"></div>
                            <p>Loading comments...</p>
                        </div>

                        <div v-else-if="commentsError" class="comments-error">
                            <p>Error loading comments: {{ commentsError }}</p>
                            <button class="retry-btn" @click="toggleComments">
                                Retry
                            </button>
                        </div>

                        <div
                            v-else-if="comments.length === 0"
                            class="no-comments"
                        >
                            <p>No comments yet. Be the first to comment!</p>
                        </div>

                        <div class="comments-list">
                            <div
                                v-for="comment in comments"
                                :key="comment.id"
                                class="comment-item"
                            >
                                <div class="comment-user-info">
                                    <img
                                        :src="
                                            comment.userAvatar ||
                                            require('@/assets/default_pfp.jpg')
                                        "
                                        alt="User Avatar"
                                        class="comment-avatar"
                                    />
                                    <div class="comment-user-text">
                                        <h4 class="comment-username">
                                            {{ comment.username }}
                                        </h4>
                                        <p class="comment-date">
                                            {{ formatDate(comment.createdAt) }}
                                        </p>
                                    </div>

                                    <button
                                        v-if="isCommentOwner(comment)"
                                        class="delete-comment-btn"
                                        @click="
                                            confirmDeleteComment(comment.id)
                                        "
                                    >
                                        <i class="fas fa-trash-alt"></i>
                                    </button>
                                </div>
                                <p class="comment-content">
                                    {{ comment.content }}
                                </p>

                                <!-- Comment actions -->
                                <div class="comment-actions">
                                    <button
                                        class="reply-btn"
                                        @click="
                                            startReply(
                                                comment.id,
                                                comment.username
                                            )
                                        "
                                    >
                                        <i class="fas fa-reply"></i> Reply
                                    </button>
                                </div>

                                <!-- Replies -->
                                <div
                                    v-if="
                                        comment.replies &&
                                        comment.replies.length > 0
                                    "
                                    class="comment-replies"
                                >
                                    <div
                                        v-for="reply in comment.replies"
                                        :key="reply.id"
                                        class="reply-item"
                                    >
                                        <div class="comment-user-info">
                                            <img
                                                :src="
                                                    reply.userAvatar ||
                                                    require('@/assets/default_pfp.jpg')
                                                "
                                                alt="User Avatar"
                                                class="comment-avatar reply-avatar"
                                            />
                                            <div class="comment-user-text">
                                                <h4 class="comment-username">
                                                    {{ reply.username }}
                                                </h4>
                                                <p class="comment-date">
                                                    {{
                                                        formatDate(
                                                            reply.createdAt
                                                        )
                                                    }}
                                                </p>
                                            </div>

                                            <button
                                                v-if="isCommentOwner(reply)"
                                                class="delete-comment-btn"
                                                @click="
                                                    confirmDeleteComment(
                                                        reply.id
                                                    )
                                                "
                                            >
                                                <i class="fas fa-trash-alt"></i>
                                            </button>
                                        </div>
                                        <p class="comment-content">
                                            {{ reply.content }}
                                        </p>
                                    </div>
                                </div>

                                <!-- Reply form -->
                                <div
                                    v-if="replyingTo === comment.id"
                                    class="reply-form"
                                >
                                    <div class="reply-input-container">
                                        <img
                                            :src="
                                                currentUserAvatar ||
                                                require('@/assets/default_pfp.jpg')
                                            "
                                            alt="Current User Avatar"
                                            class="comment-avatar reply-avatar"
                                        />
                                        <div class="reply-input-wrapper">
                                            <textarea
                                                v-model="replyText"
                                                :placeholder="
                                                    'Reply to ' +
                                                    replyingToUsername +
                                                    '...'
                                                "
                                                class="reply-input"
                                                @keyup.enter="submitReply"
                                            ></textarea>
                                            <div class="reply-actions">
                                                <button
                                                    class="cancel-reply-btn"
                                                    @click="cancelReply"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    class="post-reply-btn"
                                                    @click="submitReply()"
                                                    :disabled="
                                                        !replyText.trim() ||
                                                        addingReply
                                                    "
                                                >
                                                    {{
                                                        addingReply
                                                            ? "Posting..."
                                                            : "Reply"
                                                    }}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div
                            v-if="comments.length > 5 && !showAllComments"
                            class="show-more-comments"
                        >
                            <button
                                class="show-more-btn"
                                @click="showAllComments = true"
                            >
                                <i class="fas fa-chevron-down"></i> Show more
                                comments
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Delete comment confirmation modal -->
                <div
                    v-if="showDeleteCommentConfirmation"
                    class="delete-confirmation-overlay"
                >
                    <div class="delete-confirmation-modal">
                        <h3>Delete Comment</h3>
                        <p>
                            Are you sure you want to delete this comment? This
                            action cannot be undone.
                        </p>
                        <div class="delete-confirmation-actions">
                            <button
                                class="cancel-delete-btn"
                                @click="cancelDeleteComment"
                                :disabled="isDeletingComment"
                            >
                                Cancel
                            </button>
                            <button
                                class="confirm-delete-btn"
                                @click="deleteCommentConfirmed"
                                :disabled="isDeletingComment"
                            >
                                {{
                                    isDeletingComment ? "Deleting..." : "Delete"
                                }}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <div class="comment">
                <button class="comment-btn" @click="showComments = !showComments">
                    <i class="fa-solid fa-comment-dots"></i> {{ showComments ? 'Hide Comments' : 'Comment' }}
                </button>
            </div>
            <transition name="comments-fade">
                <div v-if="showComments" class="comments-section">
                    <comments-item :postId="post.id" />
                </div>
            </transition>
        </div>
    </div>
</template>

<script setup>
import {
    ref,
    onMounted,
    watch,
    defineProps,
    computed,
    onBeforeUnmount,
} from "vue";
import { getUser } from "@/composables/getUser";
import { getPost } from "@/composables/getPost";
import {
    addComment,
    addReply,
    deleteComment,
    subscribeToComments,
} from "@/composables/getComments";
import { db } from "@/firebase/config";
import LoadingOverlay from "@/components/LoadingOverlay.vue";
import firebase from "firebase/app";
import { useRouter } from "vue-router";

// Define props using the script setup syntax
const props = defineProps({
    postId: {
        type: String,
        required: true,
    },
});

// State variables
const post = ref(null);
const posterror = ref(null);
const postloading = ref(true);
const user = ref(null);
const usererror = ref(null);
const userloading = ref(true);

// Additional data based on post type
const projectData = ref(null);
const objectiveData = ref(null);
const skillData = ref(null);
const projectLoading = ref(false);
const objectiveLoading = ref(false);
const skillLoading = ref(false);

const router = useRouter();
const isDeleting = ref(false);
const showDeleteConfirmation = ref(false);

// Check if the post belongs to the current user
const isCurrentUserPost = computed(() => {
    if (!post.value) return false;

    // Get current user ID from Firebase auth
    const currentUser = firebase.auth().currentUser;
    if (!currentUser) return false;

    return post.value.uid === currentUser.uid;
});

// Show delete confirmation dialog
const confirmDeletePost = () => {
    showDeleteConfirmation.value = true;
};

// Cancel post deletion
const cancelDeletePost = () => {
    showDeleteConfirmation.value = false;
};

// Delete the post
const deletePost = async () => {
    if (!post.value || isDeleting.value) return;

    isDeleting.value = true;

    try {
        // Delete the post from Firestore
        await db.collection("publicFeed").doc(props.postId).delete();

        // Also delete comments if they exist
        const commentsSnapshot = await db
            .collection("publicFeed")
            .doc(props.postId)
            .collection("comments")
            .get();

        // Delete all comments in a batch
        const batch = db.batch();
        commentsSnapshot.docs.forEach((doc) => {
            batch.delete(doc.ref);
        });

        if (commentsSnapshot.docs.length > 0) {
            await batch.commit();
        }

        console.log("Post successfully deleted");

        // Redirect to refresh the feed
        router.push({ path: "/home", query: { reload: Date.now() } });
    } catch (error) {
        console.error("Error deleting post:", error);
        alert("Error deleting post. Please try again.");
    } finally {
        isDeleting.value = false;
        showDeleteConfirmation.value = false;
    }
};

onMounted(() => {
    // Get post data with the composable
    const {
        post: postData,
        error: postErr,
        loading: postLoad,
    } = getPost(props.postId);

    // Watch for post data changes
    watch(postData, (newPost) => {
        if (newPost) {
            post.value = newPost;

            // Only fetch user data once we have the post with the user ID
            if (newPost.uid) {
                fetchUserData(newPost.uid);

                // If post has reference to an original item (pid), fetch type-specific data
                if (newPost.pid && newPost.type) {
                    fetchTypeSpecificData(
                        newPost.uid,
                        newPost.pid,
                        newPost.type
                    );
                }
            } else {
                usererror.value = "Post does not contain user ID";
                userloading.value = false;
            }
        }
    });

    // Watch for post errors
    watch(postErr, (error) => {
        if (error) {
            posterror.value = error;
        }
    });

    // Watch for post loading state
    watch(postLoad, (loading) => {
        postloading.value = loading;
    });
});

// Function to fetch user data once we have the post
function fetchUserData(userId) {
    const { userData, error: userErr, loading: userLoad } = getUser(userId);

    // Watch for user data changes
    watch(userData, (newUserData) => {
        if (newUserData) {
            user.value = newUserData;
        }
    });

    // Watch for user errors
    watch(userErr, (error) => {
        if (error) {
            usererror.value = error;
        }
    });

    // Watch for user loading state
    watch(userLoad, (loading) => {
        userloading.value = loading;
    });
}

// Function to fetch type-specific data from user subcollections
function fetchTypeSpecificData(userId, itemId, type) {
    let collection = null;
    let loadingRef = null;

    // Determine which collection to fetch from based on post type
    switch (type) {
        case "project":
            collection = "projects";
            loadingRef = projectLoading;
            break;
        case "objective":
            collection = "objectives";
            loadingRef = objectiveLoading;
            break;
        case "skill":
            collection = "skills";
            loadingRef = skillLoading;
            break;
        default:
            // Text type doesn't need additional data
            return;
    }

    if (!collection) return;

    loadingRef.value = true;

    db.collection("users")
        .doc(userId)
        .collection(collection)
        .doc(itemId)
        .get()
        .then((doc) => {
            if (doc.exists) {
                const data = doc.data();

                // Store data in appropriate ref based on type
                switch (type) {
                    case "project":
                        projectData.value = data;
                        break;
                    case "objective":
                        objectiveData.value = data;
                        break;
                    case "skill":
                        skillData.value = data;
                        break;
                }
            } else {
                console.error(`No ${type} found with ID: ${itemId}`);
            }
            loadingRef.value = false;
        })
        .catch((err) => {
            console.error(`Error fetching ${type} data:`, err);
            loadingRef.value = false;
        });
}

// Helper function to format dates
function formatDate(timestamp) {
    if (!timestamp) return "Unknown date";

    let date;
    if (timestamp.seconds) {
        // Firebase timestamp format
        date = new Date(timestamp.seconds * 1000);
    } else {
        // Regular date format
        date = new Date(timestamp);
    }

    return date.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
}

// Comments functionality
const showComments = ref(false);
const comments = ref([]);
const commentsLoading = ref(false);
const commentsError = ref(null);
const newCommentText = ref("");
const addingComment = ref(false);
const commentsCount = ref(0);
const currentUserAvatar = ref(null);
const showDeleteCommentConfirmation = ref(false);
const commentToDeleteId = ref(null);
const isDeletingComment = ref(false);
const replyingTo = ref(null);
const replyingToUsername = ref("");
const replyText = ref("");
const addingReply = ref(false);
const showAllComments = ref(false);
const commentsNeedRefresh = ref(false);

// Toggle comments visibility
const toggleComments = async () => {
    showComments.value = !showComments.value;

    // Load comments if showing and not already loaded or need refresh
    if (showComments.value) {
        commentsLoading.value = true;
        commentsError.value = null;
        commentsNeedRefresh.value = false;

        try {
            // Set up real-time comments subscription
            const commentsUnsubscribe = subscribeToComments(
                props.postId,
                (result) => {
                    // Update comments reactively
                    comments.value = result.comments;
                    commentsError.value = result.error;
                    commentsLoading.value = result.loading;

                    // Update comment count
                    commentsCount.value = comments.value.length;
                }
            );

            // Store unsubscribe function to clean up later
            onBeforeUnmount(() => {
                if (commentsUnsubscribe) {
                    commentsUnsubscribe();
                    console.log("Unsubscribed from comments");
                }
            });

            // Load current user's avatar for the comment form
            const currentUser = firebase.auth().currentUser;
            if (currentUser) {
                const userDoc = await db
                    .collection("users")
                    .doc(currentUser.uid)
                    .get();
                const userData = userDoc.data();
                currentUserAvatar.value = userData?.avatar || null;
            }
        } catch (error) {
            console.error("Error setting up comments subscription:", error);
            commentsError.value = error.message;
            commentsLoading.value = false;
        }
    }
};

// Submit a new comment
const submitComment = async () => {
    if (!newCommentText.value.trim() || addingComment.value) return;

    addingComment.value = true;

    try {
        const currentUser = firebase.auth().currentUser;
        if (!currentUser) {
            throw new Error("You must be logged in to comment");
        }

        // Get current user data for username
        const userDoc = await db.collection("users").doc(currentUser.uid).get();
        const userData = userDoc.data();

        // Add username to comment data
        const commentData = {
            content: newCommentText.value.trim(),
            uid: currentUser.uid,
            username: userData?.username || "Anonymous",
            userAvatar: userData?.avatar || null,
        };

        const result = await addComment(props.postId, commentData);

        if (result.success) {
            newCommentText.value = "";
            // No need to manually refresh comments, the real-time listener will update automatically
        } else {
            throw new Error(result.error || "Failed to add comment");
        }
    } catch (error) {
        console.error("Error adding comment:", error);
        alert("Error adding comment: " + error.message);
    } finally {
        addingComment.value = false;
    }
};

// Check if current user is the owner of a comment
const isCommentOwner = (comment) => {
    const currentUser = firebase.auth().currentUser;
    if (!currentUser || !comment) return false;
    return comment.uid === currentUser.uid; // Fix: use uid instead of userId
};

// Show delete comment confirmation
const confirmDeleteComment = (commentId) => {
    commentToDeleteId.value = commentId;
    showDeleteCommentConfirmation.value = true;
};

// Cancel comment deletion
const cancelDeleteComment = () => {
    showDeleteCommentConfirmation.value = false;
    commentToDeleteId.value = null;
};

// Delete comment confirmed
const deleteCommentConfirmed = async () => {
    if (!commentToDeleteId.value || isDeletingComment.value) return;

    isDeletingComment.value = true;

    try {
        const result = await deleteComment(
            props.postId,
            commentToDeleteId.value
        );

        if (result.success) {
            // No need to manually refresh comments, the real-time listener will update automatically
            showDeleteCommentConfirmation.value = false;
            commentToDeleteId.value = null;
        } else {
            throw new Error(result.error || "Failed to delete comment");
        }
    } catch (error) {
        console.error("Error deleting comment:", error);
        alert("Error deleting comment: " + error.message);
    } finally {
        isDeletingComment.value = false;
    }
};

// Start reply to a comment
const startReply = (commentId, username) => {
    replyingTo.value = commentId;
    replyingToUsername.value = username;
    replyText.value = "";
};

// Cancel reply
const cancelReply = () => {
    replyingTo.value = null;
    replyingToUsername.value = "";
    replyText.value = "";
};

// Submit a reply
const submitReply = async () => {
    if (!replyText.value.trim() || addingReply.value || !replyingTo.value)
        return;

    addingReply.value = true;

    try {
        const currentUser = firebase.auth().currentUser;
        if (!currentUser) {
            throw new Error("You must be logged in to reply");
        }

        // Get current user data for username
        const userDoc = await db.collection("users").doc(currentUser.uid).get();
        const userData = userDoc.data();

        const replyData = {
            content: replyText.value.trim(),
            uid: currentUser.uid,
            parentId: replyingTo.value,
            username: userData?.username || "Anonymous",
            userAvatar: userData?.avatar || null,
        };

        // Use our improved addReply function
        const result = await addReply(props.postId, replyData);

        if (result.success) {
            replyText.value = "";
            replyingTo.value = null;
            replyingToUsername.value = "";
            // No need to manually refresh comments, the real-time listener will update automatically
        } else {
            throw new Error(result.error || "Failed to add reply");
        }
    } catch (error) {
        console.error("Error adding reply:", error);
        alert("Error adding reply: " + error.message);
    } finally {
        addingReply.value = false;
    }
};
</script>

<style scoped>
.post-item {
    background-color: #0d1117;
    border: 1px solid #555d69;
    border-radius: 8px;
    margin-bottom: 1.5rem;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
    transition: transform 0.3s ease, box-shadow 0.3s ease;
    padding: 1rem;
}

.post-content-wrapper {
    position: relative;
    min-height: 200px;
}

.loading-active {
    height: 200px;
}

.post-item:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 12px rgba(0, 0, 0, 0.25);
    border-color: #6e7683;
}

.post-content-wrapper {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.error-message {
    padding: 1rem;
    background-color: rgba(231, 76, 60, 0.1);
    border: 1px solid rgba(231, 76, 60, 0.3);
    color: #e74c3c;
    border-radius: 6px;
    text-align: center;
    margin: 1rem 0;
}

.error-message i {
    margin-right: 0.5rem;
}

.user-info {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 0.5rem;
    padding: 1.5rem;
}

.avatar {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid #3498db;
}

.text-inf {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
}

.username {
    margin: 0;
    color: #ffffff;
    font-size: 1.1rem;
    font-weight: 600;
}

.date {
    margin: 0;
    color: #7d8796;
    font-size: 0.85rem;
}

.post-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 0.75rem;
}

.post-type-badge {
    padding: 0.25rem 0.75rem;
    border-radius: 20px;
    font-size: 0.8rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.post-info {
    color: #ffffff;
}

.post-title {
    margin: 0 0 0.5rem 0;
    font-size: 1.25rem;
    font-weight: 600;
    color: #ffffff;
}

.post-content {
    margin-bottom: 1rem;
    color: #cfd8dc;
    line-height: 1.5;
    text-align: left;
}

/* Project specific styles */
.project-details {
    background-color: #010508;
    border: 1px solid rgba(52, 152, 219, 0.2);
    border-radius: 6px;
    padding: 1rem;
    margin: 0.5rem 0;
    position: relative;
    min-height: 80px;
}

.stack-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-bottom: 0.75rem;
}

.stack-tag {
    background-color: rgba(52, 152, 219, 0.15);
    color: #5dade2;
    border: 1px solid rgba(52, 152, 219, 0.3);
    border-radius: 4px;
    padding: 0.25rem 0.5rem;
    font-size: 0.8rem;
    font-weight: 500;
}

.github-link a {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    color: #3498db;
    text-decoration: none;
    font-weight: 500;
    transition: all 0.2s ease;
}

.github-link a:hover {
    color: #5dade2;
    text-decoration: underline;
}

/* Objective specific styles */
.objective-details {
    background-color: #010508;
    border: 1px solid rgba(241, 196, 15, 0.2);
    border-radius: 6px;
    padding: 1rem;
    margin: 0.5rem 0;
    position: relative;
    min-height: 80px;
}

.objective-status {
    display: inline-block;
    padding: 0.25rem 0.75rem;
    border-radius: 4px;
    font-weight: 500;
    margin-bottom: 0.75rem;
}

.objective-status.completed {
    background-color: rgba(46, 204, 113, 0.15);
    color: #58d68d;
    border: 1px solid rgba(46, 204, 113, 0.3);
}

.objective-status.in-progress {
    background-color: rgba(241, 196, 15, 0.15);
    color: #f4d03f;
    border: 1px solid rgba(241, 196, 15, 0.3);
}

.objective-status.not-started {
    background-color: rgba(231, 76, 60, 0.15);
    color: #e57373;
    border: 1px solid rgba(231, 76, 60, 0.3);
}

.objective-timeline {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    color: #8d99a6;
    font-size: 0.9rem;
}

/* Skill specific styles */
.skill-details {
    background-color: #010508;
    border: 1px solid rgba(46, 204, 113, 0.2);
    border-radius: 6px;
    padding: 1rem;
    margin: 0.5rem 0;
    position: relative;
    min-height: 80px;
}

.skill-level {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.25rem 0.75rem;
    border-radius: 4px;
    font-weight: 500;
    margin-bottom: 0.75rem;
}

.level-beginner {
    background-color: rgba(52, 152, 219, 0.15);
    color: #5dade2;
    border: 1px solid rgba(52, 152, 219, 0.3);
}

.level-intermediate {
    background-color: rgba(241, 196, 15, 0.15);
    color: #f4d03f;
    border: 1px solid rgba(241, 196, 15, 0.3);
}

.level-advanced {
    background-color: rgba(46, 204, 113, 0.15);
    color: #58d68d;
    border: 1px solid rgba(46, 204, 113, 0.3);
}

.level-expert {
    background-color: rgba(155, 89, 182, 0.15);
    color: #bb8fce;
    border: 1px solid rgba(155, 89, 182, 0.3);
}

.skill-dates {
    color: #8d99a6;
    font-size: 0.9rem;
}

/* Post images */
.post-images {
    margin-top: 1rem;
    width: 100%;
}

.post-image {
    max-width: 100%;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    border: 1px solid #555d69;
}

.comment-btn {
    background-color: #0d1117;
    width: 50%;
    color: white;
    border: 1px solid #3498db;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    cursor: pointer;
    font-size: 1rem;
    /* transition: background-color 0.3s ease, transform 0.3s ease; */
    text-align: center;
    align-self: center;
    /* margin-bottom: 1rem; */
}

.comment-btn:hover {
    background-color: #2980b9;
    transform: translateY(-2px);
}

.post-actions {
    margin-left: auto;
}

.delete-post-btn {
    background: none;
    border: none;
    color: #e74c3c;
    cursor: pointer;
    padding: 8px;
    border-radius: 50%;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
}

.delete-post-btn:hover {
    background-color: rgba(231, 76, 60, 0.1);
    transform: scale(1.1);
}

/* Delete confirmation modal styles */
.delete-confirmation-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.7);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
}

.delete-confirmation-modal {
    background-color: #1a2233;
    border-radius: 8px;
    padding: 20px;
    width: 90%;
    max-width: 400px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
}

.delete-confirmation-modal h3 {
    color: #e74c3c;
    margin-top: 0;
    margin-bottom: 15px;
}

.delete-confirmation-modal p {
    color: #cfd8dc;
    margin-bottom: 20px;
}

.delete-confirmation-actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
}

.cancel-delete-btn {
    padding: 8px 16px;
    background-color: transparent;
    border: 1px solid #555d69;
    color: #cfd8dc;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.3s;
}

.cancel-delete-btn:hover {
    background-color: rgba(255, 255, 255, 0.05);
}

.confirm-delete-btn {
    padding: 8px 16px;
    background-color: #e74c3c;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.3s;
}

.confirm-delete-btn:hover {
    background-color: #c0392b;
}

.confirm-delete-btn:disabled,
.cancel-delete-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

/* Comments section styles */
.post-footer {
    margin-top: 15px;
    display: flex;
    flex-direction: column;
    align-items: center;
}

.comment-btn {
    background-color: #10151f;
    color: white;
    border: 1px solid #3498db;
    padding: 10px 16px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 0.95rem;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 15px;
}

.comment-btn:hover {
    background-color: #3498db;
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(52, 152, 219, 0.3);
}

.comment-btn i {
    font-size: 1.1rem;
    transition: transform 0.3s ease;
}

.comment-btn:hover i {
    transform: scale(1.2);
}

.comments-count {
    font-size: 0.85rem;
    opacity: 0.9;
}

.comments-section {
    width: 100%;
    border-top: 1px solid #555d69;
    padding-top: 15px;
    animation: fadeIn 0.3s ease;
}

.new-comment {
    display: flex;
    gap: 12px;
    margin-bottom: 20px;
}

.comment-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid #3498db;
}

.comment-input-wrapper {
    flex: 1;
    position: relative;
}

.comment-input {
    width: 100%;
    padding: 12px 15px;
    padding-right: 80px;
    border-radius: 18px;
    border: 1px solid #555d69;
    background-color: #10151f;
    color: #ffffff;
    resize: none;
    font-family: inherit;
    font-size: 0.95rem;
    min-height: 60px;
    transition: all 0.3s ease;
}

.comment-input:focus {
    border-color: #3498db;
    outline: none;
    box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
}

.post-comment-btn {
    position: absolute;
    bottom: 10px;
    right: 10px;
    padding: 6px 12px;
    background-color: #3498db;
    color: white;
    border: none;
    border-radius: 15px;
    cursor: pointer;
    transition: all 0.3s ease;
    font-weight: 500;
    font-size: 0.9rem;
}

.post-comment-btn:hover {
    background-color: #2980b9;
    transform: translateY(-2px);
}

.post-comment-btn:disabled {
    background-color: #555d69;
    cursor: not-allowed;
    transform: none;
}

.comments-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 20px;
    color: #cfd8dc;
}

.small-spinner {
    width: 30px;
    height: 30px;
    border: 3px solid rgba(52, 152, 219, 0.1);
    border-radius: 50%;
    border-top-color: #3498db;
    animation: spin 1s ease-in-out infinite;
    margin-bottom: 10px;
}

.comments-error {
    text-align: center;
    padding: 15px;
    color: #e74c3c;
    background-color: rgba(231, 76, 60, 0.1);
    border-radius: 6px;
    margin-bottom: 15px;
}

.retry-btn {
    margin-top: 10px;
    padding: 6px 12px;
    background-color: #e74c3c;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.3s;
}

.retry-btn:hover {
    background-color: #c0392b;
}

.no-comments {
    text-align: center;
    padding: 20px;
    color: #b0bec5;
    font-style: italic;
}

.comments-list {
    display: flex;
    flex-direction: column;
    gap: 15px;
}

.comment-item {
    background-color: #10151f;
    border-radius: 12px;
    padding: 15px;
    border: 1px solid #555d69;
    transition: all 0.3s ease;
}

.comment-item:hover {
    border-color: #3498db;
    transform: translateY(-3px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.comment-user-info {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 10px;
}

.comment-user-text {
    flex: 1;
}

.comment-username {
    margin: 0 0 3px 0;
    font-size: 1rem;
    color: #ffffff;
}

.comment-date {
    margin: 0;
    font-size: 0.8rem;
    color: #8d99a6;
}

.comment-content {
    margin: 0;
    color: #cfd8dc;
    line-height: 1.4;
    margin-left: 50px;
}

.delete-comment-btn {
    background: none;
    border: none;
    color: #e74c3c;
    cursor: pointer;
    padding: 5px;
    border-radius: 50%;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0.6;
}

.comment-item:hover .delete-comment-btn {
    opacity: 1;
}

.delete-comment-btn:hover {
    background-color: rgba(231, 76, 60, 0.1);
    transform: scale(1.1);
}

.show-more-comments {
    text-align: center;
    margin-top: 15px;
}

.show-more-btn {
    background: none;
    border: none;
    color: #3498db;
    cursor: pointer;
    padding: 8px 16px;
    font-size: 0.9rem;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    gap: 6px;
    margin: 0 auto;
}

.show-more-btn:hover {
    color: #5dade2;
    transform: translateY(-2px);
}

/* Comment animations */
.comment-list-enter-active,
.comment-list-leave-active {
    transition: all 0.3s ease;
}

.comment-list-enter-from {
    opacity: 0;
    transform: translateY(20px);
}

.comment-list-leave-to {
    opacity: 0;
    transform: translateY(-20px);
}

/* Replies and reply form styles */
.comment-actions {
    margin-top: 10px;
    margin-left: 50px;
    display: flex;
    gap: 15px;
}

.reply-btn {
    background: none;
    border: none;
    color: #3498db;
    font-size: 0.85rem;
    padding: 0;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    gap: 5px;
}

.reply-btn:hover {
    color: #5dade2;
    transform: translateY(-2px);
}

.comment-replies {
    margin-top: 15px;
    margin-left: 40px;
    border-left: 2px solid rgba(52, 152, 219, 0.3);
    padding-left: 15px;
}

.reply-item {
    background-color: rgba(16, 21, 31, 0.5);
    border-radius: 10px;
    padding: 12px;
    margin-bottom: 10px;
    border: 1px solid rgba(85, 93, 105, 0.5);
    transition: all 0.3s ease;
}

.reply-item:hover {
    border-color: #3498db;
    transform: translateY(-2px);
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
}

.reply-avatar {
    width: 32px;
    height: 32px;
    border-width: 1px;
}

.reply-form {
    margin-top: 12px;
    margin-left: 40px;
    padding: 12px;
    background-color: rgba(16, 21, 31, 0.3);
    border-radius: 10px;
    animation: fadeIn 0.3s ease;
}

.reply-input-container {
    display: flex;
    gap: 10px;
}

.reply-input-wrapper {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.reply-input {
    width: 100%;
    padding: 10px 12px;
    border-radius: 15px;
    border: 1px solid #555d69;
    background-color: #10151f;
    color: #ffffff;
    resize: none;
    font-family: inherit;
    font-size: 0.9rem;
    min-height: 50px;
    transition: all 0.3s ease;
}

.reply-input:focus {
    border-color: #3498db;
    outline: none;
    box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.15);
}

.reply-actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
}

.cancel-reply-btn {
    padding: 6px 12px;
    background-color: transparent;
    border: 1px solid #555d69;
    color: #cfd8dc;
    border-radius: 15px;
    cursor: pointer;
    font-size: 0.85rem;
    transition: all 0.2s ease;
}

.cancel-reply-btn:hover {
    background-color: rgba(255, 255, 255, 0.05);
}

.post-reply-btn {
    padding: 6px 12px;
    background-color: #3498db;
    color: white;
    border: none;
    border-radius: 15px;
    cursor: pointer;
    font-size: 0.85rem;
    transition: all 0.3s ease;
}

.post-reply-btn:hover {
    background-color: #2980b9;
    transform: translateY(-2px);
}

.post-reply-btn:disabled {
    background-color: #555d69;
    cursor: not-allowed;
    transform: none;
}

@keyframes fadeIn {
    from {
        opacity: 0;
    }
    to {
        opacity: 1;
    }
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}

@media (max-width: 768px) {
    .comment-actions {
        margin-left: 0;
    }

    .comment-replies {
        margin-left: 20px;
        padding-left: 10px;
    }

    .reply-form {
        margin-left: 20px;
    }

    .reply-input-container {
        flex-direction: column;
    }
}

@media (max-width: 768px) {
    .new-comment {
        flex-direction: column;
        align-items: center;
    }

    .comment-avatar {
        margin-bottom: 10px;
    }

    .comment-content {
        margin-left: 0;
    }

    .comment-input {
        font-size: 0.9rem;
        padding-bottom: 40px;
    }

    .post-comment-btn {
        bottom: 5px;
        right: 5px;
        padding: 5px 10px;
        font-size: 0.8rem;
    }

/* Comments section styling */
.comments-section {
    max-height: 800px;
    overflow: hidden;
    margin-top: 1rem;
    border-top: 1px solid #1e2a38;
    padding-top: 1rem;
}

/* Enhanced transitions for comments */
.comments-fade-enter-active {
    transition: all 0.5s ease-out;
    max-height: 800px;
    transform-origin: top;
}

.comments-fade-leave-active {
    transition: all 0.5s ease-in;
    max-height: 800px;
    transform-origin: top;
}

.comments-fade-enter-from,
.comments-fade-leave-to {
    opacity: 0;
    max-height: 0;
    transform: scaleY(0.8);
}

.comment {
    display: flex;
    justify-content: center;
    margin: 1rem 0;
}

/* Responsive styles */
@media (max-width: 768px) {
    .post-item {
        padding: 1rem;
    }

    .post-title {
        font-size: 1.1rem;
    }

    .username {
        font-size: 1rem;
    }

    .avatar {
        width: 40px;
        height: 40px;
    }

    .comments-section {
        max-height: 600px;
    }
}
</style>
