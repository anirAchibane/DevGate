<template>
    <div class="comments-container">
        <!-- New comment form -->
        <div class="new-comment-container">
            <h3 class="new-comment-title">Leave a comment</h3>
            <div class="new-comment-form">
                <textarea v-model="newCommentContent" placeholder="Write your comment..."
                    class="comment-textarea"></textarea>
                <div class="comment-form-actions">
                    <button class="btn btn-primary" @click="submitComment"
                        :disabled="!newCommentContent.trim() || commentSubmitting">
                        {{ commentSubmitting ? 'Submitting...' : 'Post Comment' }}
                    </button>
                </div>
            </div>
        </div>
        <!-- Loading state -->
        <div v-if="loading" class="comments-loading">
            <div class="spinner"></div>
            <p>Loading comments...</p>
        </div>

        <!-- Error state -->
        <div v-else-if="error" class="comments-error">
            <i class="fas fa-exclamation-circle"></i>
            <p>{{ error }}</p>
        </div>

        <!-- Empty state -->
        <div v-else-if="comments.length === 0" class="comments-empty">
            <p>No comments yet. Be the first to comment!</p>
        </div>

        <!-- Comments list -->
        <div v-else class="comments-list">
            <div v-for="comment in comments" :key="comment.id" class="comment-item">
                <div class="comment-container">
                    <!-- Comment content -->
                    <div class="comment-header">
                        <img :src="comment.userData?.avatar || defaultAvatar" alt="User Avatar"
                            class="comment-avatar" />
                        <div class="comment-meta">
                            <h4 class="comment-username">{{ comment.userData?.username || 'Unknown User' }}</h4>
                            <span class="comment-date">{{ formatDate(comment.createdAt) }}</span>
                        </div>
                    </div>
                    <div class="comment-content">{{ comment.content }}</div>
                    <div class="comment-actions">
                        <button class="comment-action-btn" @click="toggleReplyForm(comment.id)">
                            <i class="fas fa-reply"></i> Reply
                        </button>
                    </div>

                    <!-- Reply form for this comment -->
                    <div v-if="activeReplyId === comment.id" class="reply-form-container">
                        <div class="reply-form">
                            <textarea v-model="replyContent" placeholder="Write your reply..."
                                class="reply-textarea"></textarea>
                            <div class="reply-actions">
                                <button class="btn btn-outline-danger btn-sm" @click="cancelReply">
                                    Cancel
                                </button>
                                <button class="btn btn-primary btn-sm" @click="submitReply(comment.id)"
                                    :disabled="!replyContent.trim() || replySubmitting">
                                    {{ replySubmitting ? 'Submitting...' : 'Reply' }}
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Replies to this comment -->
                    <div v-if="comment.replies && comment.replies.length > 0" class="replies-container">
                        <div v-for="reply in comment.replies" :key="reply.id" class="reply-item">
                            <div class="comment-header">
                                <img :src="reply.userData?.avatar || defaultAvatar" alt="User Avatar"
                                    class="comment-avatar" />
                                <div class="comment-meta">
                                    <h4 class="comment-username">{{ reply.userData?.username || 'Unknown User' }}</h4>
                                    <span class="comment-date">{{ formatDate(reply.createdAt) }}</span>
                                </div>
                            </div>
                            <div class="comment-content">{{ reply.content }}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>


    </div>
</template>

<script setup>
import { ref, onMounted, defineProps } from 'vue';
import { getComments } from '@/composables/getComments';
import {  getCurrentUser } from '@/composables/getUser';
import { auth, db, firebase } from '@/firebase/config';

const props = defineProps({
    postId: {
        type: String,
        required: true
    }
});

// Default avatar
const defaultAvatar = require("@/assets/default_pfp.jpg");

// State variables
const comments = ref([]);
const error = ref(null);
const loading = ref(true);
const currentUser = ref(null);
const currentUserData = ref(null);

// Comment functionality
const newCommentContent = ref('');
const commentSubmitting = ref(false);

// Reply functionality
const replyContent = ref('');
const activeReplyId = ref(null);
const replySubmitting = ref(false);

// Fetch comments on mount
onMounted(async () => {
    // Get current user
    if (auth.currentUser) {
        currentUser.value = auth.currentUser;
        const { userData } = getCurrentUser();
        currentUserData.value = userData;
    }

    // Fetch comments
    await fetchComments();
});

// Fetch comments and user data for each comment
async function fetchComments() {
    loading.value = true;
    error.value = null;

    try {
        const { comments: fetchedComments, error: commentsError } = await getComments(props.postId);

        if (commentsError) {
            error.value = commentsError;
            return;
        }

        comments.value = fetchedComments;

        // Fetch user data for each comment and reply
        for (const comment of comments.value) {
            if (comment.uid) {
                await fetchUserDataForComment(comment);
            }

            // Fetch user data for replies
            if (comment.replies && comment.replies.length > 0) {
                for (const reply of comment.replies) {
                    if (reply.uid) {
                        await fetchUserDataForComment(reply);
                    }
                }
            }
        }
    } catch (err) {
        error.value = "Error loading comments: " + err.message;
        console.error("Error in fetchComments:", err);
    } finally {
        loading.value = false;
    }
}

// Fetch user data for a comment
async function fetchUserDataForComment(comment) {
    try {
        const userDoc = await db.collection('users').doc(comment.uid).get();
        if (userDoc.exists) {
            comment.userData = userDoc.data();
        }
    } catch (err) {
        console.error("Error fetching user data for comment:", err);
    }
}

// Format date
function formatDate(timestamp) {
    if (!timestamp) return 'Unknown date';

    let date;
    if (timestamp.seconds) {
        // Firebase timestamp format
        date = new Date(timestamp.seconds * 1000);
    } else {
        // Regular date format
        date = new Date(timestamp);
    }

    return date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Submit a new comment
async function submitComment() {
    if (!newCommentContent.value.trim()) return;
    if (!auth.currentUser) {
        error.value = "You must be logged in to comment";
        return;
    }

    commentSubmitting.value = true;

    try {
        // Create new comment
        const commentData = {
            content: newCommentContent.value.trim(),
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            uid: auth.currentUser.uid,
            parentId: null
        };

        // Add to Firestore
        const docRef = await db.collection('publicFeed')
            .doc(props.postId)
            .collection('comments')
            .add(commentData);

        // Add to local state with user data
        const newComment = {
            id: docRef.id,
            ...commentData,
            createdAt: new Date(),
            userData: currentUserData.value,
            replies: []
        };

        comments.value.push(newComment);

        // Clear input
        newCommentContent.value = '';

    } catch (err) {
        error.value = "Failed to post comment: " + err.message;
        console.error("Error posting comment:", err);
    } finally {
        commentSubmitting.value = false;
    }
}

// Toggle reply form
function toggleReplyForm(commentId) {
    if (!auth.currentUser) {
        error.value = "You must be logged in to reply";
        return;
    }

    if (activeReplyId.value === commentId) {
        activeReplyId.value = null;
        replyContent.value = '';
    } else {
        activeReplyId.value = commentId;
        replyContent.value = '';
    }
}

// Cancel reply
function cancelReply() {
    activeReplyId.value = null;
    replyContent.value = '';
}

// Submit reply
async function submitReply(parentId) {
    if (!replyContent.value.trim()) return;
    if (!auth.currentUser) {
        error.value = "You must be logged in to reply";
        return;
    }

    replySubmitting.value = true;

    try {
        // Create reply data
        const replyData = {
            content: replyContent.value.trim(),
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            uid: auth.currentUser.uid,
            parentId: parentId
        };

        // Add to Firestore
        const docRef = await db.collection('publicFeed')
            .doc(props.postId)
            .collection('comments')
            .add(replyData);

        // Add to local state with user data
        const newReply = {
            id: docRef.id,
            ...replyData,
            createdAt: new Date(),
            userData: currentUserData.value
        };

        // Find parent comment and add reply
        const parentComment = comments.value.find(c => c.id === parentId);
        if (parentComment) {
            if (!parentComment.replies) {
                parentComment.replies = [];
            }
            parentComment.replies.push(newReply);
        }

        // Reset reply form
        replyContent.value = '';
        activeReplyId.value = null;

    } catch (err) {
        error.value = "Failed to post reply: " + err.message;
        console.error("Error posting reply:", err);
    } finally {
        replySubmitting.value = false;
    }
}
</script>

<style scoped>
.comments-container {
    background-color: #0D1117;
    color: #cfd8dc;
    padding: 1.5rem;
    border-radius: 8px;
    margin-top: 1rem;
}

.comments-loading,
.comments-error,
.comments-empty {
    text-align: center;
    padding: 2rem 0;
    color: #7d8796;
}

.comments-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
}

.spinner {
    width: 2rem;
    height: 2rem;
    border: 0.25rem solid rgba(52, 152, 219, 0.3);
    border-top-color: #3498db;
    border-radius: 50%;
    animation: spinner 0.8s linear infinite;
}

@keyframes spinner {
    to {
        transform: rotate(360deg);
    }
}

.comments-error {
    color: #e74c3c;
}

.comments-error i {
    font-size: 1.5rem;
    margin-bottom: 0.5rem;
}

.comments-list {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

.comment-item {
    border-bottom: 1px solid #1e2a38;
    padding-bottom: 1.5rem;
}

.comment-item:last-child {
    border-bottom: none;
}

.comment-container {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.comment-header {
    display: flex;
    align-items: center;
    gap: 1rem;
}

.comment-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid #3498db;
}

.comment-meta {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
}

.comment-username {
    margin: 0;
    font-size: 0.95rem;
    font-weight: 600;
    color: #ffffff;
}

.comment-date {
    font-size: 0.8rem;
    color: #7d8796;
}

.comment-content {
    font-size: 0.95rem;
    line-height: 1.5;
    color: #e6e6e6;
    text-align: left;
    white-space: pre-wrap;
}

.comment-actions {
    display: flex;
    gap: 1rem;
}

.comment-action-btn {
    background: none;
    border: none;
    color: #3498db;
    font-size: 0.85rem;
    padding: 0.25rem 0.5rem;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    gap: 0.35rem;
}

.comment-action-btn:hover {
    color: #5dade2;
    transform: translateY(-1px);
}

.replies-container {
    margin-left: 2rem;
    border-left: 2px solid #1e2a38;
    padding-left: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-top: 0.5rem;
}

.reply-item {
    padding: 0.75rem;
    background-color: rgba(26, 34, 51, 0.4);
    border-radius: 8px;
}

.new-comment-container {
    margin-top: 2rem;
    border-top: 1px solid #1e2a38;
    padding-top: 1.5rem;
}

.new-comment-title {
    text-align: left;
    font-size: 1.15rem;
    color: #ffffff;
    margin-bottom: 1rem;
}

.comment-textarea,
.reply-textarea {
    width: 100%;
    min-height: 100px;
    background-color: #1a2233;
    border: 1px solid #30374B;
    border-radius: 8px;
    padding: 1rem;
    color: #ffffff;
    font-size: 0.95rem;
    resize: vertical;
    transition: border-color 0.2s, box-shadow 0.2s;
}

.reply-textarea {
    min-height: 80px;
}

.comment-textarea:focus,
.reply-textarea:focus {
    outline: none;
    border-color: #3498db;
    box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.25);
}

.comment-form-actions,
.reply-actions {
    display: flex;
    justify-content: flex-end;
    margin-top: 1rem;
    gap: 0.75rem;
}

.reply-form-container {
    margin: 1rem 0 1rem 1.5rem;
    padding: 1rem;
    background-color: rgba(26, 34, 51, 0.4);
    border-radius: 8px;
    border-left: 2px solid #3498db;
}

@media (max-width: 768px) {
    .replies-container {
        margin-left: 1rem;
        padding-left: 1rem;
    }

    .comment-avatar {
        width: 32px;
        height: 32px;
    }
}
</style>