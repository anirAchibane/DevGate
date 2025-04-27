import { ref } from 'vue';
import { db } from '../firebase';


async function getComments(postID) {
    const comments = ref([]);
    const error = ref(null);
    const loading = ref(true);

    try {
        const snapshot = await db
            .collection('publicFeed')
            .doc(postID)
            .collection('comments')
            .where('parentId', '==', null)
            .orderBy('createdAt', 'asc')
            .get();

        const commentsData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data(), replies: [] }));

        for (const comment of commentsData) {
            comment.replies = await fetchReplies(comment.id);
        }

        comments.value = commentsData;
        console.log('Comments and nested replies fetched:', comments.value);
    } catch (err) {
        error.value = err.message;
        console.error('Error fetching comments and replies:', err);
    } finally {
        loading.value = false;
    }

    return { comments, error, loading };
}

async function fetchReplies(parentId) {
    try {
        const snapshot = await db
            .collection('publicFeed')
            .doc(parentId)
            .collection('comments')
            .where('parentId', '==', parentId)
            .orderBy('createdAt', 'asc')
            .get();

        const replies = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data(), replies: [] }));

        for (const reply of replies) {
            reply.replies = await fetchReplies(reply.id);
        }

        return replies;
    } catch (err) {
        console.error('Error fetching replies for parentId:', parentId, err);
        return [];
    }
}

export { getComments , fetchReplies };