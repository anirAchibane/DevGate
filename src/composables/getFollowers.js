import { ref } from "vue";
import { db } from "@/firebase/config";

/**
 * Composable to fetch users who follow a specific user
 * @param {string} targetUserId - The ID of the user whose followers we want to fetch
 * @returns {Object} followers - Array of user objects who follow the target user
 * @returns {Object} loading - Boolean loading state
 * @returns {Object} error - Error message if any
 */
export function getFollowers(targetUserId) {
    const followers = ref([]);
    const loading = ref(true);
    const error = ref(null);

    const fetchFollowers = async () => {
        try {
            loading.value = true;
            error.value = null;
            
            const snapshot = await db.collection("users")
                .where("following", "array-contains", targetUserId)
                .get();
            
            followers.value = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            }));
        } catch (err) {
            console.error("Error getting followers:", err);
            error.value = err.message;
        } finally {
            loading.value = false;
        }
    };

    // Initial fetch
    fetchFollowers();

    return { followers, loading, error, refresh: fetchFollowers };
}
