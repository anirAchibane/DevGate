// Composable function to handle post voting functionality
import { ref } from "vue";
import { db, firebase } from "@/firebase/config";

/**
 * Function to track and manage a user's vote on a post
 * @param {string} postId - The ID of the post to vote on
 * @returns {object} - Functions and state for voting
 */
function usePostVoting(postId) {
    const userVote = ref(null); // null, 'upvote', or 'downvote'
    const isVoting = ref(false);
    const error = ref(null);

    // Keep track of the user's votes in a separate collection
    const getCurrentUserVote = async (userId) => {
        try {
            const voteDoc = await db
                .collection("userVotes")
                .doc(`${userId}_${postId}`)
                .get();

            if (voteDoc.exists) {
                userVote.value = voteDoc.data().vote;
            } else {
                userVote.value = null;
            }
        } catch (err) {
            console.error("Error getting user vote:", err);
            error.value = err.message;
        }
    };

    // Vote on a post (upvote or downvote)
    const voteOnPost = async (userId, voteType) => {
        if (!userId || isVoting.value) return;

        isVoting.value = true;
        error.value = null;

        try {
            const postRef = db.collection("publicFeed").doc(postId);
            const userVoteRef = db
                .collection("userVotes")
                .doc(`${userId}_${postId}`);

            // Get the current post data and user's previous vote (if any)
            const postDoc = await postRef.get();
            if (!postDoc.exists) {
                throw new Error("Post not found");
            }

            const userVoteDoc = await userVoteRef.get();
            const previousVote = userVoteDoc.exists
                ? userVoteDoc.data().vote
                : null;

            // Logic for handling different vote transitions
            let voteIncrement = 0;

            if (previousVote === null) {
                // First-time vote
                voteIncrement = voteType === "upvote" ? 1 : -1;
                await userVoteRef.set({ vote: voteType });
                userVote.value = voteType;
            } else if (previousVote === voteType) {
                // Canceling a vote (clicking the same button again)
                voteIncrement = voteType === "upvote" ? -1 : 1;
                await userVoteRef.delete();
                userVote.value = null;
            } else {
                // Changing vote (upvote → downvote or downvote → upvote)
                voteIncrement = voteType === "upvote" ? 2 : -2;
                await userVoteRef.update({ vote: voteType });
                userVote.value = voteType;
            }

            // Update the post's vote count
            await postRef.update({
                votes: firebase.firestore.FieldValue.increment(voteIncrement),
            });
        } catch (err) {
            console.error("Error voting on post:", err);
            error.value = err.message;
        } finally {
            isVoting.value = false;
        }
    };

    // Functions for upvoting and downvoting
    const upvote = async (userId) => voteOnPost(userId, "upvote");
    const downvote = async (userId) => voteOnPost(userId, "downvote");

    return {
        userVote,
        isVoting,
        error,
        getCurrentUserVote,
        upvote,
        downvote,
    };
}

export { usePostVoting };
