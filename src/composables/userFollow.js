import { ref } from "vue";
import { auth, db } from "@/firebase/config";

// Function to check if current user is following a specific user
function isFollowing(targetUserId) {
    const following = ref(false);
    const loading = ref(true);
    const error = ref(null);

    // Get current user
    const currentUser = auth.currentUser;
    if (!currentUser) {
        loading.value = false;
        error.value = "No authenticated user";
        return { following, loading, error };
    }

    // Check following status
    db.collection("users")
        .doc(currentUser.uid)
        .get()
        .then((doc) => {
            if (doc.exists) {
                const userData = doc.data();
                const followingArray = userData.following || [];
                following.value = followingArray.includes(targetUserId);
            }
            loading.value = false;
        })
        .catch((err) => {
            error.value = err.message;
            loading.value = false;
            console.error("Error checking follow status:", err);
        });

    return { following, loading, error };
}

// Function to follow a user
async function followUser(targetUserId) {
    const success = ref(false);
    const error = ref(null);
    const loading = ref(true);

    try {
        const currentUser = auth.currentUser;
        if (!currentUser) {
            error.value = "No authenticated user";
            loading.value = false;
            return { success, error, loading };
        }

        // Get current user's following list
        const userRef = db.collection("users").doc(currentUser.uid);
        const doc = await userRef.get();

        if (doc.exists) {
            const userData = doc.data();
            const followingArray = userData.following || [];

            // Make sure we're not already following
            if (!followingArray.includes(targetUserId)) {
                // Add target user to following array
                followingArray.push(targetUserId);

                // Update database
                await userRef.update({ following: followingArray });
                success.value = true;
            } else {
                // Already following
                success.value = true;
            }
        } else {
            error.value = "Current user data not found";
        }
    } catch (err) {
        error.value = err.message;
        console.error("Error following user:", err);
    } finally {
        loading.value = false;
    }

    return { success, error, loading };
}

// Function to unfollow a user
async function unfollowUser(targetUserId) {
    const success = ref(false);
    const error = ref(null);
    const loading = ref(true);

    try {
        const currentUser = auth.currentUser;
        if (!currentUser) {
            error.value = "No authenticated user";
            loading.value = false;
            return { success, error, loading };
        }

        // Get current user's following list
        const userRef = db.collection("users").doc(currentUser.uid);
        const doc = await userRef.get();

        if (doc.exists) {
            const userData = doc.data();
            let followingArray = userData.following || [];

            // Remove target user from following array
            followingArray = followingArray.filter((id) => id !== targetUserId);

            // Update database
            await userRef.update({ following: followingArray });
            success.value = true;
        } else {
            error.value = "Current user data not found";
        }
    } catch (err) {
        error.value = err.message;
        console.error("Error unfollowing user:", err);
    } finally {
        loading.value = false;
    }

    return { success, error, loading };
}

// Function to get user followers (users who follow the target user)
async function getFollowers(targetUserId) {
    const followers = ref([]);
    const loading = ref(true);
    const error = ref(null);

    try {
        const snapshot = await db.collection("users")
            .where("following", "array-contains", targetUserId)
            .get();
        
        followers.value = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        }));
    } catch (error){
        console.error("Error getting followers:", error);
    } finally{
        loading.value = false;

    }

    return { followers, loading, error };
}

// Function to get users that the target user is following
async function getFollowing(targetUserId) {
    const following = ref([]);
    const loading = ref(true);
    const error = ref(null);

    try {
        // Get the user's following array
        const userDoc = await db.collection("users").doc(targetUserId).get();

        if (userDoc.exists) {
            const userData = userDoc.data();
            const followingIds = userData.following || [];

            if (followingIds.length === 0) {
                loading.value = false;
                return { following, loading, error };
            }

            // Fetch each followed user's data
            const followingPromises = followingIds.map((id) =>
                db.collection("users").doc(id).get()
            );

            const followingDocs = await Promise.all(followingPromises);

            following.value = followingDocs
                .filter((doc) => doc.exists)
                .map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                }));
        }
    } catch (err) {
        error.value = err.message;
        console.error("Error getting following users:", err);
    } finally {
        loading.value = false;
    }

    return { following, loading, error };
}

export { isFollowing, followUser, unfollowUser, getFollowers, getFollowing };
