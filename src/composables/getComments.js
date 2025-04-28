import { ref } from "vue";
import { db } from "@/firebase/config";
import firebase from "firebase/app";

/**
 * Fetches comments and their replies for a specific post
 * @param {string} postID - The ID of the post to fetch comments for
 * @returns {Object} Object containing comments, error, and loading state
 */

async function getComments(postID) {
    const comments = ref([]);
    const error = ref(null);
    const loading = ref(true);

    try {
        // Fetch top-level comments
        const snapshot = await db
            .collection("publicFeed")
            .doc(postID)
            .collection("comments")
            .where("parentId", "==", null)
            .orderBy("createdAt", "asc")
            .get();

        const commentsData = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            replies: [],
        }));

        // Fetch all replies in a single query
        const repliesSnapshot = await db
            .collection("publicFeed")
            .doc(postID)
            .collection("comments")
            .where("parentId", "!=", null)
            .get();
            
        // Filter top-level comments (parentId == null) manually
        const commentsData = snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data(), replies: [] }))
            .filter(comment => comment.parentId === null)
            .sort((a, b) => {
                // Sort by createdAt if available
                if (a.createdAt && b.createdAt) {
                    return a.createdAt.seconds - b.createdAt.seconds;
                }
                return 0;
            });

        // Group replies by parent ID for efficient lookup
        const repliesMap = groupRepliesByParent(repliesSnapshot.docs);

        // Build reply tree and attach to comments
        for (const comment of commentsData) {
            comment.replies = buildReplyTree(repliesMap, comment.id);
        }

        comments.value = commentsData;
    } catch (err) {
        error.value = err.message;
        console.error("Error fetching comments:", err);
    } finally {
        loading.value = false;
    }

    return {
        comments: comments.value,
        error: error.value,
        loading: loading.value,
    };
}

/**
 * Creates a mapping of parent comment IDs to their replies
 * @param {Array} docs - Array of Firestore document snapshots
 * @returns {Object} Map of parent IDs to arrays of replies
 */
function groupRepliesByParent(docs) {
    const repliesMap = {};

    docs.forEach((doc) => {
        const reply = { id: doc.id, ...doc.data(), replies: [] };
        const parentId = reply.parentId;

        if (!repliesMap[parentId]) {
            repliesMap[parentId] = [];
        }
        repliesMap[parentId].push(reply);
    });

    return repliesMap;
}

/**
 * Recursively builds a tree of replies
 * @param {Object} repliesMap - Map of parent IDs to arrays of replies
 * @param {string} parentId - ID of the parent comment
 * @returns {Array} Sorted array of replies with nested replies
 */
function buildReplyTree(repliesMap, parentId) {
    const childReplies = repliesMap[parentId] || [];

    return childReplies
        .sort((a, b) => sortByTimestamp(a, b))
        .map((reply) => {
            reply.replies = buildReplyTree(repliesMap, reply.id);
            return reply;
        });
}

/**
 * Helper function to sort by createdAt timestamp
 * @param {Object} a - First comment or reply
 * @param {Object} b - Second comment or reply
 * @returns {number} Sort order value
 */
function sortByTimestamp(a, b) {
    if (a.createdAt && b.createdAt) {
        return a.createdAt.seconds - b.createdAt.seconds;
    }
    return 0;
}

/**
 * Adds a new comment to a post
 * @param {string} postID - ID of the post
 * @param {Object} commentData - Comment data to save
 * @returns {Object} Result object with success flag
 */
async function addComment(postID, commentData) {
    try {
        const dataToSave = {
            ...commentData,
            parentId: null,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        };

        const docRef = await db
            .collection("publicFeed")
            .doc(postID)
            .collection("comments")
            .add(dataToSave);

        return { success: true, commentId: docRef.id };
    } catch (err) {
        console.error("Error adding comment:", err);
        return { success: false, error: err.message };
    }
}

/**
 * Adds a reply to an existing comment
 * @param {string} postID - ID of the post
 * @param {Object} replyData - Reply data including parentId
 * @returns {Object} Result object with success flag
 */
async function addReply(postID, replyData) {
    try {
        if (!replyData.parentId) {
            throw new Error("Parent comment ID is required for replies");
        }

        const dataToSave = {
            ...replyData,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        };

        const docRef = await db
            .collection("publicFeed")
            .doc(postID)
            .collection("comments")
            .add(dataToSave);

        return { success: true, replyId: docRef.id };
    } catch (err) {
        console.error("Error adding reply:", err);
        return { success: false, error: err.message };
    }
}

/**
 * Deletes a comment and all its replies
 * @param {string} postID - ID of the post
 * @param {string} commentId - ID of the comment to delete
 * @returns {Object} Result object with success flag
 */
async function deleteComment(postID, commentId) {
    try {
        // Get all direct replies to this comment
        const repliesSnapshot = await db
            .collection("publicFeed")
            .doc(postID)
            .collection("comments")
            .where("parentId", "==", commentId)
            .get();
            
        // Filter replies manually
        const replies = snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data(), replies: [] }))
            .filter(comment => comment.parentId === parentId)
            .sort((a, b) => {
                // Sort by createdAt if available
                if (a.createdAt && b.createdAt) {
                    return a.createdAt.seconds - b.createdAt.seconds;
                }
                return 0;
            });

        const batch = db.batch();

        // Delete the main comment
        batch.delete(
            db
                .collection("publicFeed")
                .doc(postID)
                .collection("comments")
                .doc(commentId)
        );

        // Delete all replies recursively
        for (const doc of repliesSnapshot.docs) {
            await deleteNestedReplies(postID, doc.id, batch);
            batch.delete(doc.ref);
        }

        await batch.commit();
        return { success: true };
    } catch (err) {
        console.error("Error deleting comment:", err);
        return { success: false, error: err.message };
    }
}

/**
 * Helper function to recursively delete nested replies
 * @param {string} postID - ID of the post
 * @param {string} parentId - ID of the parent comment
 * @param {Object} batch - Firestore batch object
 */
async function deleteNestedReplies(postID, parentId, batch) {
    const nestedRepliesSnapshot = await db
        .collection("publicFeed")
        .doc(postID)
        .collection("comments")
        .where("parentId", "==", parentId)
        .get();

    for (const doc of nestedRepliesSnapshot.docs) {
        await deleteNestedReplies(postID, doc.id, batch);
        batch.delete(doc.ref);
    }
}

/**
 * Sets up real-time subscription to comments
 * @param {string} postID - ID of the post
 * @param {Function} callback - Callback function that receives updated comments
 * @returns {Function} Unsubscribe function
 */
function subscribeToComments(postID, callback) {
    return db
        .collection("publicFeed")
        .doc(postID)
        .collection("comments")
        .orderBy("createdAt", "asc")
        .onSnapshot(
            (snapshot) => {
                try {
                    const processedComments = processCommentsSnapshot(snapshot);
                    callback({
                        comments: processedComments,
                        error: null,
                        loading: false,
                    });
                } catch (err) {
                    console.error("Error processing comments snapshot:", err);
                    callback({
                        comments: [],
                        error: err.message,
                        loading: false,
                    });
                }
            },
            (error) => {
                console.error("Error in comments listener:", error);
                callback({
                    comments: [],
                    error: error.message,
                    loading: false,
                });
            }
        );
}

/**
 * Processes a Firestore snapshot to build a comment tree
 * @param {Object} snapshot - Firestore query snapshot
 * @returns {Array} Array of top-level comments with nested replies
 */
function processCommentsSnapshot(snapshot) {
    // Create map of all comments by ID
    const commentsMap = {};
    snapshot.docs.forEach((doc) => {
        commentsMap[doc.id] = {
            id: doc.id,
            ...doc.data(),
            replies: [],
        };
    });

    // Build comment tree
    const topLevelComments = [];

    Object.values(commentsMap).forEach((comment) => {
        if (!comment.parentId) {
            // Top-level comment
            topLevelComments.push(comment);
        } else if (commentsMap[comment.parentId]) {
            // Reply to an existing comment
            commentsMap[comment.parentId].replies.push(comment);
        }
    });

    // Sort all comments and replies by timestamp
    topLevelComments.sort(sortByTimestamp);

    // Sort replies recursively
    function sortRepliesRecursively(replies) {
        if (!replies || !replies.length) return [];

        replies.sort(sortByTimestamp);

        replies.forEach((reply) => {
            if (reply.replies && reply.replies.length) {
                reply.replies = sortRepliesRecursively(reply.replies);
            }
        });

        return replies;
    }

    // Sort all replies
    topLevelComments.forEach((comment) => {
        comment.replies = sortRepliesRecursively(comment.replies);
    });

    return topLevelComments;
}

export {
    getComments,
    addComment,
    addReply,
    deleteComment,
    subscribeToComments,
};
