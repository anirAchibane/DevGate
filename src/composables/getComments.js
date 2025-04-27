import { ref } from 'vue';
import { db } from '@/firebase/config';

async function getComments(postID) {
    const comments = ref([]);
    const error = ref(null);
    const loading = ref(true);

    try {
        // First fetch top-level comments (without filtering and ordering together)
        const snapshot = await db
            .collection('publicFeed')
            .doc(postID)
            .collection('comments')
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

        // Fetch replies for each comment
        for (const comment of commentsData) {
            comment.replies = await fetchReplies(postID, comment.id);
        }

        comments.value = commentsData;
        console.log('Comments and nested replies fetched:', comments.value);
    } catch (err) {
        error.value = err.message;
        console.error('Error fetching comments and replies:', err);
    } finally {
        loading.value = false;
    }

    return { comments: comments.value, error: error.value, loading: loading.value };
}

async function fetchReplies(postID, parentId) {
    try {
        // Fetch replies without complex query
        const snapshot = await db
            .collection('publicFeed')
            .doc(postID)
            .collection('comments')
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

        // Recursively fetch nested replies
        for (const reply of replies) {
            reply.replies = await fetchReplies(postID, reply.id);
        }

        return replies;
    } catch (err) {
        console.error('Error fetching replies for parentId:', parentId, err);
        return [];
    }
}

export { getComments, fetchReplies };