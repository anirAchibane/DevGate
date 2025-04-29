import { ref } from "vue";
import { db } from "@/firebase/config";

/**
 * Composable to fetch users that a specific user is following
 * @param {string} targetUserId - The ID of the user whose followings we want to fetch
 * @returns {Object} followings - Array of user objects that the target user follows
 * @returns {Object} loading - Boolean loading state
 * @returns {Object} error - Error message if any
 */
export function getFollowings(targetUserId) {
    const followings = ref([]);
    const loading = ref(true);
    const error = ref(null);

    const fetchFollowings = async () => {
        try {
            loading.value = true;
            error.value = null;
            
            // Get the user's following array
            const userDoc = await db.collection("users").doc(targetUserId).get();

            if (userDoc.exists) {
                const userData = userDoc.data();
                const followingIds = userData.following || [];

                if (followingIds.length === 0) {
                    followings.value = [];
                    loading.value = false;
                    return;
                }

                // Fetch each followed user's data
                const followingPromises = followingIds.map((id) =>
                    db.collection("users").doc(id).get()
                );

                const followingDocs = await Promise.all(followingPromises);

                followings.value = followingDocs
                    .filter((doc) => doc.exists)
                    .map((doc) => ({
                        id: doc.id,
                        ...doc.data(),
                    }));
            } else {
                error.value = "User not found";
            }
        } catch (err) {
            console.error("Error getting followings:", err);
            error.value = err.message;
        } finally {
            loading.value = false;
        }
    };

    // Initial fetch
    fetchFollowings();

    return { followings, loading, error, refresh: fetchFollowings };
}