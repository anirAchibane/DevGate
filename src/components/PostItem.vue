<template>
    <div class="post-item" 
         :class="{
             'gallery-mode': galleryMode, 
             'has-image': post && post.picture,
             'type-project': post && post.type === 'project',
             'type-objective': post && post.type === 'objective',
             'type-skill': post && post.type === 'skill',
             'type-text': post && post.type === 'text' || !post
         }" 
         :data-post-type="post ? post.type : 'text'">
        <!-- Clone the image at the top for gallery mode -->
        <div v-if="galleryMode && post && post.picture" class="gallery-image-top">
            <img :src="post.picture" alt="Post Image" class="gallery-image" />
        </div>
        
        <!-- Remove the standalone type badge -->
        
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
                    <img :src="user.avatar || require('@/assets/default_pfp.jpg')" alt="User Avatar" class="avatar" @click="navigateToProfile" />
                    <div class="text-inf">
                        <h3 class="username" @click="navigateToProfile">{{ user.username }}</h3>
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
                    <router-link v-if="auth.currentUser.uid !== post.uid" :to="{
                                path: '/newreport',
                                query: { targetID: postId,
                                         targetType: 'post',
                                         targetTitle: post.summary,
                                         targetOwner: post.uid
                                },
                            }">
                            <button  class="btn btn-outline-light">
                                Report
                            </button>
                    </router-link>
                </div>

                <div class="post-info">
                    <div class="post-header">
                        <h4 class="post-title">
                            {{ post.summary }}
                            <span class="title-type-badge">{{ post.type }}</span>
                        </h4>
                        
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
                    <div class="post-actions-row">
                        <!-- Voting System -->
                        <div class="vote-container">
                            <button 
                                class="vote-btn upvote-btn" 
                                :class="{ 'active': userVote === 'upvote' }"
                                @click="handleUpvote"
                                :disabled="isVoting || !isLoggedIn"
                                title="Upvote"
                            >
                                <i class="fas fa-arrow-up"></i>
                            </button>
                            <span class="vote-count" :class="getVoteCountClass">{{ post.votes || 0 }}</span>
                            <button 
                                class="vote-btn downvote-btn" 
                                :class="{ 'active': userVote === 'downvote' }"
                                @click="handleDownvote"
                                :disabled="isVoting || !isLoggedIn"
                                title="Downvote"
                            >
                                <i class="fas fa-arrow-down"></i>
                            </button>
                        </div>
                        <button class="comment-btn" @click="toggleComments">
                            <i class="fa-solid fa-comment-dots"></i>
                            {{ showComments ? "Hide Comments" : "Comment" }}
                            <span v-if="commentsCount > 0" class="comments-count"
                                >({{ commentsCount }})</span
                            >
                        </button>
                    </div>
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
            <!-- Remove commented out code and duplicate comments section -->
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
import { usePostVoting } from "@/composables/votePost";
import {
    addComment,
    addReply,
    deleteComment,
    subscribeToComments,
} from "@/composables/getComments";
import { auth, db } from "@/firebase/config";
import LoadingOverlay from "@/components/LoadingOverlay.vue";
import firebase from "firebase/app";
import { useRouter } from "vue-router";

// Define props using the script setup syntax
const props = defineProps({
    postId: {
        type: String,
        required: true,
    },
    galleryMode: {
        type: Boolean,
        default: false
    }
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

// Voting system state and logic
const userVote = ref(null);
const isVoting = ref(false);
const voteError = ref(null);
const isLoggedIn = computed(() => !!firebase.auth().currentUser);

// Format vote count with colors
const getVoteCountClass = computed(() => {
    if (!post.value || !post.value.votes) return 'neutral';
    if (post.value.votes > 0) return 'positive';
    if (post.value.votes < 0) return 'negative';
    return 'neutral';
});

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

    // Check if user is logged in and fetch their current vote
    const currentUser = firebase.auth().currentUser;
    if (currentUser) {
        // Initialize voting system
        initializeVotingSystem(currentUser.uid);
    }

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
    
    // Listen for auth state changes to update voting UI
    firebase.auth().onAuthStateChanged((user) => {
        if (user) {
            initializeVotingSystem(user.uid);
        } else {
            userVote.value = null;
        }
    });
});

// Initialize the voting system
const initializeVotingSystem = (userId) => {
    // Create a single voting instance to avoid duplication
    const votingSystem = usePostVoting(props.postId);
    
    // Get current vote
    votingSystem.getCurrentUserVote(userId);
    
    // Use the watch function to update local userVote state
    watch(votingSystem.userVote, (newVote) => {
        userVote.value = newVote;
    });
    
    // Store references to the voting functions
    upvotePost = () => votingSystem.upvote(userId);
    downvotePost = () => votingSystem.downvote(userId);
};

// Define references to voting functions
let upvotePost;
let downvotePost;

// Updated vote handler functions
const handleUpvote = async () => {
    if (!isLoggedIn.value) {
        alert("You must be logged in to vote");
        return;
    }
    
    try {
        isVoting.value = true;
        await upvotePost();
    } catch (error) {
        console.error("Error upvoting:", error);
        voteError.value = error.message;
    } finally {
        isVoting.value = false;
    }
};

const handleDownvote = async () => {
    if (!isLoggedIn.value) {
        alert("You must be logged in to vote");
        return;
    }
    
    try {
        isVoting.value = true;
        await downvotePost();
    } catch (error) {
        console.error("Error downvoting:", error);
        voteError.value = error.message;
    } finally {
        isVoting.value = false;
    }
};

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

// Navigate to the post owner's profile
const navigateToProfile = () => {
    if (user.value && user.value.uid) {
        router.push({ path: `/profil/${user.value.uid}` });
    }
};
</script>

<style scoped>
.post-item {
    background-color: #0d1117;
    border: 1px solid #555d69;
    border-radius: 10px;
    margin-bottom: 1.5rem;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
    transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease;
    padding: 0;
    height: 100%; /* Make sure all items have the same height in gallery mode */
    display: flex;
    flex-direction: column;
    overflow: hidden;
    position: relative;
}

.post-content-wrapper {
    position: relative;
    min-height: 200px;
    display: flex;
    flex-direction: column;
    flex: 1;
}

.loading-active {
    height: 200px;
}

.post-item:hover {
    transform: translateY(-4px);
    box-shadow: 0 10px 18px rgba(0, 0, 0, 0.35);
    border-color: #3498db;
}

.error-message {
    padding: 1rem;
    background-color: rgba(231, 76, 60, 0.1);
    border: 1px solid rgba(231, 76, 60, 0.3);
    color: #e74c3c;
    border-radius: 6px;
    text-align: center;
    margin: 1rem;
}

.error-message i {
    margin-right: 0.5rem;
}

.user-info {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1.25rem 1.5rem 0.75rem;
    position: relative;
    background: linear-gradient(to bottom, rgba(26, 34, 51, 0.7), transparent);
    border-bottom: 1px solid rgba(85, 93, 105, 0.2);
}

.avatar {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid #3498db;
    box-shadow: 0 3px 6px rgba(0, 0, 0, 0.2);
    transition: transform 0.3s ease, border-color 0.3s ease;
    cursor: pointer; /* Add cursor pointer for clickable avatar */
}

.post-item:hover .avatar {
    transform: scale(1.05);
    border-color: #5dade2;
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
    letter-spacing: 0.01em;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
    cursor: pointer; /* Add cursor pointer for clickable username */
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
    position: relative;
    padding: 1.5rem;
    padding-top: 1rem;
    padding-bottom: 2.5rem; /* Add padding to accommodate the vote container */
    flex: 1;
    display: flex;
    flex-direction: column;
}

/* Gallery image top section */
.gallery-image-top {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 180px;
  width: 100%;
  overflow: hidden;
  z-index: 3; /* Above the gradient background */
  border-radius: 10px 10px 0 0;
}

.gallery-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  display: block;
  transition: transform 0.5s ease;
}

.post-item.gallery-mode:hover .gallery-image {
  transform: scale(1.08);
}

.post-title {
    margin: 0 0 0.75rem 0;
    font-size: 1.25rem;
    font-weight: 600;
    color: #ffffff;
    line-height: 1.4;
    letter-spacing: 0.01em;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.post-content {
    margin-bottom: 1.25rem;
    color: #cfd8dc;
    line-height: 1.6;
    text-align: left;
    font-size: 1rem;
    letter-spacing: 0.01em;
}

/* Project specific styles */
.project-details {
    background-color: rgba(1, 5, 8, 0.5);
    border: 1px solid rgba(52, 152, 219, 0.2);
    border-radius: 8px;
    padding: 1.25rem;
    margin: 0.75rem 0;
    position: relative;
    min-height: 80px;
    backdrop-filter: blur(4px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
    transition: transform 0.3s ease, border-color 0.3s ease;
}

.project-details:hover {
    transform: translateY(-2px);
    border-color: rgba(52, 152, 219, 0.5);
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
    padding: 0.25rem 0.75rem;
    font-size: 0.8rem;
    font-weight: 500;
    transition: all 0.2s ease;
}

.stack-tag:hover {
    background-color: rgba(52, 152, 219, 0.25);
    transform: translateY(-1px);
}

.github-link a {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    color: #3498db;
    text-decoration: none;
    font-weight: 500;
    padding: 0.35rem 0.75rem;
    border-radius: 4px;
    transition: all 0.2s ease;
    background-color: rgba(52, 152, 219, 0.08);
}

.github-link a:hover {
    color: #5dade2;
    background-color: rgba(52, 152, 219, 0.15);
    transform: translateY(-1px);
}

.github-link a i {
    font-size: 1.1rem;
}

/* Objective specific styles */
.objective-details {
    background-color: rgba(1, 5, 8, 0.5);
    border: 1px solid rgba(241, 196, 15, 0.2);
    border-radius: 8px;
    padding: 1.25rem;
    margin: 0.75rem 0;
    position: relative;
    min-height: 80px;
    backdrop-filter: blur(4px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
    transition: transform 0.3s ease, border-color 0.3s ease;
}

.objective-details:hover {
    transform: translateY(-2px);
    border-color: rgba(241, 196, 15, 0.5);
}

.objective-status {
    display: inline-block;
    padding: 0.35rem 0.85rem;
    border-radius: 6px;
    font-weight: 600;
    margin-bottom: 0.75rem;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
    letter-spacing: 0.03em;
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
    gap: 0.35rem;
    color: #8d99a6;
    font-size: 0.9rem;
}

/* Skill specific styles */
.skill-details {
    background-color: rgba(1, 5, 8, 0.5);
    border: 1px solid rgba(46, 204, 113, 0.2);
    border-radius: 8px;
    padding: 1.25rem;
    margin: 0.75rem 0;
    position: relative;
    min-height: 80px;
    backdrop-filter: blur(4px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
    transition: transform 0.3s ease, border-color 0.3s ease;
}

.skill-details:hover {
    transform: translateY(-2px);
    border-color: rgba(46, 204, 113, 0.5);
}

.skill-level {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.35rem 0.85rem;
    border-radius: 6px;
    font-weight: 600;
    margin-bottom: 0.75rem;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
    letter-spacing: 0.03em;
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
    margin: 1rem 0;
    width: 100%;
    position: relative;
    border-radius: 8px;
    overflow: hidden;
}

.post-image {
    width: 100%;
    border-radius: 8px;
    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.4);
    border: 1px solid rgba(85, 93, 105, 0.5);
    transition: transform 0.3s ease;
    object-fit: cover;
    max-height: 400px;
}

.post-images:hover .post-image {
    transform: scale(1.02);
}

.post-footer {
    margin-top: auto;
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    padding: 0.5rem 1.5rem 1.5rem;
    background: linear-gradient(to top, rgba(26, 34, 51, 0.4), transparent);
}

.post-actions {
    margin-left: auto;
    z-index: 21; /* Ensure it's above the type badge */
    position: relative; /* Ensure z-index works */
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
    opacity: 0.7;
}

.delete-post-btn:hover {
    background-color: rgba(231, 76, 60, 0.1);
    transform: scale(1.1);
    opacity: 1;
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
    backdrop-filter: blur(3px);
    animation: fadeIn 0.3s ease;
}

.delete-confirmation-modal {
    background-color: #1a2233;
    border-radius: 12px;
    padding: 24px;
    width: 90%;
    max-width: 400px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
    border: 1px solid #e74c3c;
    animation: modalSlideIn 0.3s ease;
}

@keyframes modalSlideIn {
    from { 
        transform: translateY(20px) scale(0.95); 
        opacity: 0; 
    }
    to { 
        transform: translateY(0) scale(1); 
        opacity: 1; 
    }
}

.delete-confirmation-modal h3 {
    color: #e74c3c;
    margin-top: 0;
    margin-bottom: 15px;
    font-size: 1.3rem;
    font-weight: 600;
}

.delete-confirmation-modal p {
    color: #cfd8dc;
    margin-bottom: 24px;
    line-height: 1.5;
    font-size: 1rem;
}

.delete-confirmation-actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
}

.cancel-delete-btn {
    padding: 10px 18px;
    background-color: transparent;
    border: 1px solid #555d69;
    color: #cfd8dc;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.3s ease;
    font-weight: 500;
}

.cancel-delete-btn:hover {
    background-color: rgba(255, 255, 255, 0.05);
    transform: translateY(-2px);
}

.confirm-delete-btn {
    padding: 10px 18px;
    background-color: #e74c3c;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.3s ease;
    font-weight: 500;
    box-shadow: 0 3px 6px rgba(231, 76, 60, 0.3);
}

.confirm-delete-btn:hover {
    background-color: #c0392b;
    transform: translateY(-2px);
    box-shadow: 0 5px 10px rgba(231, 76, 60, 0.4);
}

.confirm-delete-btn:disabled,
.cancel-delete-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
}

/* Comment button */
.comment-btn {
    background-color: rgba(16, 21, 31, 0.8);
    color: white;
    border: 1px solid #3498db;
    padding: 10px 18px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 0.95rem;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 15px;
    width: auto;
    text-align: center;
    align-self: center;
    font-weight: 500;
    box-shadow: 0 3px 6px rgba(0, 0, 0, 0.15);
}

.comment-btn:hover {
    background-color: #2980b9;
    transform: translateY(-3px);
    box-shadow: 0 5px 10px rgba(0, 0, 0, 0.25);
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
    background-color: rgba(52, 152, 219, 0.2);
    padding: 2px 8px;
    border-radius: 10px;
    display: inline-block;
}

/* Comments section styles */
.comments-section {
    width: 100%;
    border-top: 1px solid rgba(85, 93, 105, 0.4);
    padding-top: 18px;
    animation: fadeIn 0.4s ease;
    background-color: rgba(10, 15, 25, 0.5);
    border-radius: 0 0 8px 8px;
    max-height: 800px;
    overflow: hidden;
}

.new-comment {
    display: flex;
    gap: 12px;
    margin-bottom: 20px;
    padding: 0 10px;
}

.comment-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid #3498db;
    transition: transform 0.3s ease;
}

.new-comment:hover .comment-avatar {
    transform: scale(1.05);
}

.comment-input-wrapper {
    flex: 1;
    position: relative;
}

.comment-input {
    width: 100%;
    padding: 14px 18px;
    padding-right: 90px;
    border-radius: 20px;
    border: 1px solid rgba(85, 93, 105, 0.7);
    background-color: rgba(16, 21, 31, 0.7);
    color: #ffffff;
    resize: none;
    font-family: inherit;
    font-size: 0.95rem;
    min-height: 60px;
    transition: all 0.3s ease;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.comment-input:focus {
    border-color: #3498db;
    outline: none;
    box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2), 0 4px 12px rgba(0, 0, 0, 0.15);
    background-color: rgba(16, 21, 31, 0.9);
}

.post-comment-btn {
    position: absolute;
    bottom: 10px;
    right: 10px;
    padding: 7px 14px;
    background-color: #3498db;
    color: white;
    border: none;
    border-radius: 15px;
    cursor: pointer;
    transition: all 0.3s ease;
    font-weight: 500;
    font-size: 0.9rem;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.post-comment-btn:hover {
    background-color: #2980b9;
    transform: translateY(-2px);
    box-shadow: 0 3px 6px rgba(0, 0, 0, 0.3);
}

.post-comment-btn:disabled {
    background-color: #555d69;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
}

.comments-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 24px;
    color: #cfd8dc;
}

.small-spinner {
    width: 30px;
    height: 30px;
    border: 3px solid rgba(52, 152, 219, 0.1);
    border-radius: 50%;
    border-top-color: #3498db;
    animation: spin 1s cubic-bezier(0.76, 0.21, 0.24, 0.93) infinite;
    margin-bottom: 10px;
}

.comments-error {
    text-align: center;
    padding: 15px;
    color: #e74c3c;
    background-color: rgba(231, 76, 60, 0.1);
    border-radius: 8px;
    margin: 0 15px 15px;
}

.retry-btn {
    margin-top: 10px;
    padding: 7px 14px;
    background-color: #e74c3c;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.3s ease;
    font-weight: 500;
}

.retry-btn:hover {
    background-color: #c0392b;
    transform: translateY(-2px);
}

.no-comments {
    text-align: center;
    padding: 24px;
    color: #b0bec5;
    font-style: italic;
}

.comments-list {
    display: flex;
    flex-direction: column;
    gap: 15px;
    padding: 0 15px 15px;
}

.comment-item {
    background-color: rgba(16, 21, 31, 0.7);
    border-radius: 12px;
    padding: 15px;
    border: 1px solid rgba(85, 93, 105, 0.5);
    transition: all 0.3s ease;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
}

.comment-item:hover {
    border-color: #3498db;
    transform: translateY(-3px);
    box-shadow: 0 5px 12px rgba(0, 0, 0, 0.25);
    background-color: rgba(16, 21, 31, 0.9);
}

.comment-user-info {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 12px;
}

.comment-user-text {
    flex: 1;
}

.comment-username {
    margin: 0 0 3px 0;
    font-size: 1rem;
    color: #ffffff;
    font-weight: 600;
}

.comment-date {
    margin: 0;
    font-size: 0.8rem;
    color: #8d99a6;
}

.comment-content {
    margin: 0;
    color: #cfd8dc;
    line-height: 1.5;
    margin-left: 50px;
    font-size: 0.95rem;
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
    padding-bottom: 10px;
}

.show-more-btn {
    background: none;
    border: none;
    color: #3498db;
    cursor: pointer;
    padding: 8px 18px;
    font-size: 0.95rem;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0 auto;
    border-radius: 20px;
    background-color: rgba(52, 152, 219, 0.1);
    border: 1px solid rgba(52, 152, 219, 0.2);
}

.show-more-btn:hover {
    color: #5dade2;
    transform: translateY(-2px);
    background-color: rgba(52, 152, 219, 0.15);
    border-color: rgba(52, 152, 219, 0.4);
}

/* Replies and reply form styles */
.comment-actions {
    margin-top: 12px;
    margin-left: 50px;
    display: flex;
    gap: 15px;
}

.reply-btn {
    background: none;
    border: none;
    color: #3498db;
    font-size: 0.9rem;
    padding: 5px 10px;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    gap: 6px;
    border-radius: 12px;
}

.reply-btn:hover {
    color: #5dade2;
    transform: translateY(-2px);
    background-color: rgba(52, 152, 219, 0.1);
}

.comment-replies {
    margin-top: 15px;
    margin-left: 45px;
    border-left: 2px solid rgba(52, 152, 219, 0.3);
    padding-left: 15px;
}

.reply-item {
    background-color: rgba(16, 21, 31, 0.5);
    border-radius: 10px;
    padding: 12px;
    margin-bottom: 12px;
    border: 1px solid rgba(85, 93, 105, 0.4);
    transition: all 0.3s ease;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.reply-item:hover {
    border-color: #3498db;
    transform: translateY(-2px);
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
    background-color: rgba(16, 21, 31, 0.7);
}

.reply-avatar {
    width: 32px;
    height: 32px;
    border-width: 1px;
}

.reply-form {
    margin-top: 15px;
    margin-left: 45px;
    padding: 15px;
    background-color: rgba(16, 21, 31, 0.3);
    border-radius: 12px;
    animation: fadeIn 0.3s ease;
    border: 1px solid rgba(52, 152, 219, 0.2);
}

.reply-input-container {
    display: flex;
    gap: 10px;
}

.reply-input-wrapper {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.reply-input {
    width: 100%;
    padding: 12px 15px;
    border-radius: 15px;
    border: 1px solid rgba(85, 93, 105, 0.7);
    background-color: rgba(16, 21, 31, 0.7);
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
    background-color: rgba(16, 21, 31, 0.9);
}

.reply-actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
}

.cancel-reply-btn {
    padding: 7px 14px;
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
    transform: translateY(-2px);
}

.post-reply-btn {
    padding: 7px 14px;
    background-color: #3498db;
    color: white;
    border: none;
    border-radius: 15px;
    cursor: pointer;
    font-size: 0.85rem;
    transition: all 0.3s ease;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
}

.post-reply-btn:hover {
    background-color: #2980b9;
    transform: translateY(-2px);
    box-shadow: 0 3px 6px rgba(0, 0, 0, 0.25);
}

.post-reply-btn:disabled {
    background-color: #555d69;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
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

/* Voting system styles */
.vote-container {
    display: flex;
    flex-direction: row;
    align-items: center;
    position: absolute;
    left: 1.5rem;
    bottom: 1rem;
    background-color: rgba(16, 21, 31, 0.9);
    border-radius: 8px;
    padding: 4px 8px;
    border: 1px solid rgba(85, 93, 105, 0.7);
    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.2);
    z-index: 5;
    transition: all 0.3s ease;
}

.vote-container:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 12px rgba(0, 0, 0, 0.3);
    border-color: #3498db;
}

.vote-btn {
    background: none;
    border: none;
    color: #cfd8dc;
    font-size: 1.2rem;
    padding: 5px 8px;
    cursor: pointer;
    transition: all 0.2s ease;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.vote-btn:hover:not(:disabled) {
    background-color: rgba(52, 152, 219, 0.15);
    transform: scale(1.1);
}

.vote-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.upvote-btn.active {
    color: #2ecc71;
}

.downvote-btn.active {
    color: #e74c3c;
}

.vote-count {
    font-weight: 600;
    font-size: 1rem;
    margin: 0 10px;
    min-width: 24px;
    text-align: center;
}

.vote-count.positive {
    color: #2ecc71;
}

.vote-count.negative {
    color: #e74c3c;
}

.vote-count.neutral {
    color: #cfd8dc;
}

.post-actions-row {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    gap: 20px;
    margin-bottom: 15px;
}

.post-actions-row .vote-container {
    position: static;
    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.2);
    background-color: rgba(16, 21, 31, 0.9);
    border-radius: 8px;
    padding: 5px 10px;
    margin: 0;
}

.post-actions-row .comment-btn {
    margin-bottom: 0;
}

/* Gallery mode styles */
.post-item.gallery-mode {
  display: flex;
  flex-direction: column;
  height: 100%;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid rgba(85, 93, 105, 0.5);
  transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease;
  background-color: #0d1117;
  position: relative;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
}

.post-item.gallery-mode:hover {
  transform: translateY(-8px);
  box-shadow: 0 15px 30px rgba(0, 0, 0, 0.4);
  border-color: #3498db;
}

.post-item.gallery-mode .post-content-wrapper {
  display: flex;
  flex-direction: column;
  height: 100%;
}

/* Create placeholder for images */
.post-item.gallery-mode::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 180px;
  background: linear-gradient(120deg, #1e3a8a 0%, #1a2233 100%);
  z-index: 1;
}

/* Image area at the top - moved to start of post structure */
.post-item.gallery-mode .post-images {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 180px;
  margin: 0;
  padding: 0;
  border-radius: 10px 10px 0 0;
  overflow: hidden;
  z-index: 2;
  display: block; /* Changed from flex to block */
}

/* Fixed image styling */
.post-item.gallery-mode .post-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 0;
  box-shadow: none;
  border: none;
  transition: transform 0.5s ease;
  margin: 0; /* Reset margin */
  object-position: center;
  display: block; /* Ensure image displays properly */
}

.post-item.gallery-mode:hover .post-image {
  transform: scale(1.08);
}

/* User info overlay on image */
.post-item.gallery-mode .user-info {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 5;
  padding: 12px;
  background: linear-gradient(to bottom, rgba(13, 17, 23, 0.9), rgba(13, 17, 23, 0.5) 60%, transparent);
  border-bottom: none;
  margin: 0;
}

.post-item.gallery-mode .avatar {
  width: 38px;
  height: 38px;
  border: 2px solid rgba(52, 152, 219, 0.8);
}

.post-item.gallery-mode .username {
  font-size: 0.95rem;
  color: white;
  font-weight: 600;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.8);
}

.post-item.gallery-mode .date {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.8);
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.8);
}

/* Type badge */
.post-item.gallery-mode::after {
  display: none; /* Hide gradient background when we have an image */
}

/* Post type badges */
.post-item.gallery-mode[data-post-type="project"]::after {
  background-color: #3498db;
  color: white;
}

.post-item.gallery-mode[data-post-type="objective"]::after {
  background-color: #f1c40f;
  color: #1a2233;
}

.post-item.gallery-mode[data-post-type="skill"]::after {
  background-color: #2ecc71;
  color: white;
}

.post-item.gallery-mode[data-post-type="text"]::after {
  background-color: #9b59b6;
  color: white;
}

/* Content area - always starts after image space */
.post-item.gallery-mode .post-info {
  padding: 16px;
  margin-top: 180px; /* Fixed space for image area */
  flex: 1;
  display: flex;
  flex-direction: column;
  z-index: 3;
}

/* Don't display images in their normal location in gallery mode */
.post-item.gallery-mode .post-info .post-images {
  display: none;
}

/* Add a duplicate of images at the top for gallery mode */
.post-item.gallery-mode.has-image::before {
  display: none; /* Hide gradient background when we have an image */
}

.post-item.gallery-mode .post-title {
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 8px;
  line-height: 1.3;
  display: -webkit-box;
  line-clamp: 2;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  max-height: 2.6em;
}

.post-item.gallery-mode .post-content {
  font-size: 0.85rem;
  color: #a0aec0;
  margin-bottom: 12px;
  display: -webkit-box;
  line-clamp: 3;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.5;
}

/* Footer and actions area */
.post-item.gallery-mode .post-footer {
  padding: 12px;
  margin-top: auto;
  background: rgba(16, 21, 31, 0.4);
  border-top: 1px solid rgba(52, 152, 219, 0.1);
}

/* Media queries for gallery mode */
@media (max-width: 768px) {
  .post-item.gallery-mode .post-info {
    padding: 12px;
  }
  
  .post-item.gallery-mode .post-footer {
    padding: 10px;
  }
  
  .post-item.gallery-mode .post-title {
    font-size: 0.95rem;
  }
  
  .post-item.gallery-mode .post-content {
    font-size: 0.8rem;
  }
}

/* Responsive design */
@media (max-width: 768px) {
    .post-item {
        padding: 0;
    }
    
    .post-info {
        padding: 1rem 1.25rem 2.5rem;
    }
    
    .user-info {
        padding: 1rem 1.25rem 0.5rem;
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
    
    .vote-container {
        left: 1.25rem;
    }

    .post-actions-row {
        flex-direction: row;
        gap: 12px;
    }
    
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
        align-items: center;
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
}

@media (max-width: 480px) {
    .user-info {
        padding: 0.75rem 1rem 0.5rem;
    }
    
    .post-info {
        padding: 0.75rem 1rem 2.5rem;
    }
    
    .avatar {
        width: 36px;
        height: 36px;
    }
    
    .username {
        font-size: 0.95rem;
    }
    
    .date {
        font-size: 0.8rem;
    }
    
    .post-title {
        font-size: 1rem;
    }
    
    .post-content {
        font-size: 0.9rem;
        line-height: 1.5;
    }
    
    .comment-btn, 
    .post-comment-btn,
    .post-reply-btn,
    .cancel-reply-btn {
        font-size: 0.8rem;
    }
    
    .vote-container {
        left: 1rem;
    }
    
    .post-actions-row {
        gap: 8px;
    }
    
    .comment-item {
        padding: 12px 10px;
    }
}

/* Animation improvements */
.post-item {
    animation: fadeInUp 0.5s ease backwards;
}

@keyframes fadeInUp {
    from {
        opacity: 0;
        transform: translateY(20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.comments-section {
    animation: fadeInDown 0.4s ease;
}

@keyframes fadeInDown {
    from {
        opacity: 0;
        transform: translateY(-10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

/* List mode styles - modernized and inspired by gallery mode */
.post-item:not(.gallery-mode) {
  background-color: #0d1117;
  border: 1px solid rgba(85, 93, 105, 0.5);
  border-radius: 12px;
  margin-bottom: 1.5rem;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
  transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease;
  overflow: hidden;
  position: relative;
  display: flex;
  flex-direction: column;
}

.post-item:not(.gallery-mode):hover {
  transform: translateY(-5px);
  box-shadow: 0 12px 25px rgba(0, 0, 0, 0.35);
  border-color: #3498db;
}

/* Improved user section for list mode */
.post-item:not(.gallery-mode) .user-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem 1.5rem 0.75rem;
  background: linear-gradient(to right, rgba(26, 34, 51, 0.8), rgba(26, 34, 51, 0.4));
  border-bottom: 1px solid rgba(85, 93, 105, 0.2);
  border-radius: 12px 12px 0 0;
}

.post-item:not(.gallery-mode) .avatar {
  width: 48px;
  height: 48px;
  border: 2px solid #3498db;
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.2);
}

.post-item:not(.gallery-mode) .username {
  font-size: 1.1rem;
  color: #ffffff;
  font-weight: 600;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.post-item:not(.gallery-mode) .date {
  color: #7d8796;
  font-size: 0.85rem;
}

/* Improved content section for list mode */
.post-item:not(.gallery-mode) .post-info {
  padding: 1.25rem 1.5rem;
  background: linear-gradient(135deg, rgba(16, 22, 36, 0.6), rgba(13, 17, 23, 0.9));
  flex: 1;
}

.post-item:not(.gallery-mode) .post-title {
  font-size: 1.3rem;
  font-weight: 600;
  margin-bottom: 0.8rem;
  color: #ffffff;
  line-height: 1.4;
  letter-spacing: 0.01em;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

/* Add post type badge inline with title */
.post-item:not(.gallery-mode) .post-title::before {
  content: attr(data-post-type);
  background-color: rgba(52, 152, 219, 0.2);
  color: #5dade2;
  padding: 0.2rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border: 1px solid rgba(52, 152, 219, 0.3);
  text-shadow: none;
}

.post-item:not(.gallery-mode)[data-post-type="project"] .post-title::before {
  background-color: rgba(52, 152, 219, 0.2);
  color: #5dade2;
  border-color: rgba(52, 152, 219, 0.3);
}

.post-item:not(.gallery-mode)[data-post-type="objective"] .post-title::before {
  background-color: rgba(241, 196, 15, 0.2);
  color: #f4d03f;
  border-color: rgba(241, 196, 15, 0.3);
}

.post-item:not(.gallery-mode)[data-post-type="skill"] .post-title::before {
  background-color: rgba(46, 204, 113, 0.2);
  color: #58d68d;
  border-color: rgba(46, 204, 113, 0.3);
}

.post-item:not(.gallery-mode)[data-post-type="text"] .post-title::before {
  background-color: rgba(155, 89, 182, 0.2);
  color: #bb8fce;
  border-color: rgba(155, 89, 182, 0.3);
}

.post-item:not(.gallery-mode) .post-content {
  font-size: 1rem;
  line-height: 1.6;
  color: #cfd8dc;
  margin-bottom: 1.25rem;
}

/* Improved image display for list mode */
.post-item:not(.gallery-mode) .post-images {
  margin: 1rem 0;
  width: 100%;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.3);
  background: linear-gradient(120deg, #1e3a8a 0%, #1a2233 100%);
  max-height: 350px;
}

.post-item:not(.gallery-mode) .post-image {
  width: 100%;
  border-radius: 8px;
  object-fit: cover;
  max-height: 350px;
  transition: transform 0.5s ease;
  display: block;
}

.post-item:not(.gallery-mode) .post-images:hover .post-image {
  transform: scale(1.03);
}

/* Improved type-specific sections for list mode */
.post-item:not(.gallery-mode) .project-details,
.post-item:not(.gallery-mode) .objective-details,
.post-item:not(.gallery-mode) .skill-details {
  border-radius: 8px;
  padding: 1.25rem;
  margin: 1rem 0;
  background-color: rgba(16, 21, 31, 0.5);
  backdrop-filter: blur(4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  border-left: 4px solid #3498db;
}

.post-item:not(.gallery-mode) .project-details {
  border-left-color: #3498db;
}

.post-item:not(.gallery-mode) .objective-details {
  border-left-color: #f1c40f;
}

.post-item:not(.gallery-mode) .skill-details {
  border-left-color: #2ecc71;
}

/* Improved footer section for list mode */
.post-item:not(.gallery-mode) .post-footer {
  padding: 0.75rem 1.5rem 1.25rem;
  background: linear-gradient(to bottom, rgba(16, 21, 31, 0.2), rgba(16, 21, 31, 0.6));
  border-top: 1px solid rgba(52, 152, 219, 0.1);
  border-radius: 0 0 12px 12px;
}

.post-item:not(.gallery-mode) .post-actions-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  margin-bottom: 15px;
}

.post-item:not(.gallery-mode) .vote-container {
  position: static;
  display: flex;
  align-items: center;
  background-color: rgba(16, 21, 31, 0.7);
  border-radius: 8px;
  padding: 5px 10px;
  border: 1px solid rgba(85, 93, 105, 0.5);
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.2);
}

.post-item:not(.gallery-mode) .comment-btn {
  margin-bottom: 0;
  background-color: rgba(16, 21, 31, 0.7);
  border: 1px solid rgba(52, 152, 219, 0.3);
  border-radius: 8px;
  padding: 8px 16px;
  font-size: 0.95rem;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
}

.post-item:not(.gallery-mode) .comment-btn:hover {
  background-color: rgba(52, 152, 219, 0.2);
  transform: translateY(-2px);
}

/* Type badge common styles */
.type-badge {
  position: absolute;
  padding: 5px 12px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
  z-index: 20;
}

/* Type badge for gallery mode */
.post-item.gallery-mode .type-badge {
  top: 150px;
  right: 12px;
}

/* Type badge for list mode */
.post-item:not(.gallery-mode) .type-badge {
  top: 15px;
  right: 60px; /* Adjust to avoid overlapping with the delete button */
}

/* Type colors */
.post-item.type-project .type-badge {
  background-color: #3498db;
  color: white;
}

.post-item.type-objective .type-badge {
  background-color: #f1c40f;
  color: #1a2233;
}

.post-item.type-skill .type-badge {
  background-color: #2ecc71;
  color: white;
}

.post-item.type-text .type-badge {
  background-color: #9b59b6;
  color: white;
}

/* Hide the pseudo-element type badges we created earlier */
.post-item.gallery-mode::after {
  display: none;
}

.title-type-badge {
  display: inline-block;
  margin-left: 12px;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background-color: rgba(52, 152, 219, 0.15);
  color: #5dade2;
  border: 1px solid rgba(52, 152, 219, 0.3);
  vertical-align: middle;
}

.post-item.type-project .title-type-badge {
  background-color: rgba(52, 152, 219, 0.15);
  color: #5dade2;
  border-color: rgba(52, 152, 219, 0.3);
}

.post-item.type-objective .title-type-badge {
  background-color: rgba(241, 196, 15, 0.15);
  color: #f4d03f;
  border-color: rgba(241, 196, 15, 0.3);
}

.post-item.type-skill .title-type-badge {
  background-color: rgba(46, 204, 113, 0.15);
  color: #58d68d;
  border-color: rgba(46, 204, 113, 0.3);
}

.post-item.type-text .title-type-badge {
  background-color: rgba(155, 89, 182, 0.15);
  color: #bb8fce;
  border-color: rgba(155, 89, 182, 0.3);
}

/* Hide the standalone type badge when we show it inline with title */
.post-item:not(.gallery-mode) .type-badge {
  display: none;
}
</style>