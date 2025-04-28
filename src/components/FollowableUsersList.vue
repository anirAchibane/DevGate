<template>
    <div class="followable-users-container">
        <h2 class="section-title">People You Might Want to Follow</h2>

        <div v-if="loading" class="loading-container">
            <LoadingOverlay message="Loading users..." transparent />
        </div>

        <div v-else-if="users.length === 0" class="empty-state">
            <i class="fas fa-users empty-icon"></i>
            <p>No users found to follow at the moment.</p>
        </div>

        <div v-else class="user-list">
            <div v-for="user in users" :key="user.id" class="user-card">
                <div class="user-info">
                    <div class="user-avatar">
                        <img
                            :src="
                                user.avatar ||
                                require('@/assets/default_pfp.jpg')
                            "
                            alt="User avatar"
                        />
                    </div>
                    <div class="user-details">
                        <h3 class="username">{{ user.username }}</h3>
                        <p class="bio">{{ user.bio || "No bio available" }}</p>

                        <div
                            class="skill-tags"
                            v-if="getUserSkills(user).length > 0"
                        >
                            <span
                                v-for="skill in getUserSkills(user).slice(0, 3)"
                                :key="skill.name"
                                class="skill-tag"
                            >
                                {{ skill.name }}
                            </span>
                            <span
                                v-if="getUserSkills(user).length > 3"
                                class="more-skills"
                            >
                                +{{ getUserSkills(user).length - 3 }} more
                            </span>
                        </div>
                    </div>
                </div>

                <div class="action-buttons">
                    <button
                        class="btn btn-outline btn-sm"
                        :class="{ 'btn-primary': isFollowing(user.id) }"
                        @click="toggleFollow(user.id)"
                        :disabled="followInProgress === user.id"
                    >
                        <span
                            v-if="followInProgress === user.id"
                            class="btn-loading"
                        ></span>
                        <span v-else>
                            <i
                                :class="
                                    isFollowing(user.id)
                                        ? 'fas fa-user-check'
                                        : 'fas fa-user-plus'
                                "
                            ></i>
                            {{ isFollowing(user.id) ? "Following" : "Follow" }}
                        </span>
                    </button>
                    <router-link
                        :to="{ name: 'Profil', params: { id: user.id } }"
                        class="btn btn-sm btn-outline view-profile"
                    >
                        <i class="fas fa-user-circle"></i> View
                    </router-link>
                </div>
            </div>
        </div>

        <div v-if="!loading && hasMore" class="load-more">
            <button
                class="btn btn-outline"
                @click="loadMore"
                :disabled="loadingMore"
            >
                <span v-if="loadingMore" class="btn-loading"></span>
                <span v-else>Load More</span>
            </button>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { db, auth, firebase } from "@/firebase/config";
import LoadingOverlay from "@/components/LoadingOverlay.vue";

const users = ref([]);
const currentUserFollowing = ref([]);
const loading = ref(true);
const loadingMore = ref(false);
const lastVisible = ref(null);
const followInProgress = ref(null);
const hasMore = ref(true);
const limit = 6;

// Check if user is being followed
const isFollowing = (userId) => currentUserFollowing.value.includes(userId);

// Extract skills from user object according to Schema.md
const getUserSkills = (user) => {
    if (!user.skills) return [];
    return Object.values(user.skills).map((skill) => ({
        name: skill.name,
        level: skill.level,
    }));
};

// Load initial set of users
const loadUsers = async () => {
    try {
        loading.value = true;
        const currentUser = auth.currentUser;
        if (!currentUser) {
            loading.value = false;
            return;
        }

        // Get current user's following list
        const userDoc = await db.collection("users").doc(currentUser.uid).get();
        const userData = userDoc.data();
        currentUserFollowing.value = userData?.following || [];

        // Query users that are not the current user
        let query = db
            .collection("users")
            .where(
                firebase.firestore.FieldPath.documentId(),
                "!=",
                currentUser.uid
            )
            .orderBy(firebase.firestore.FieldPath.documentId())
            .limit(limit);

        const snapshot = await query.get();
        if (snapshot.empty) {
            loading.value = false;
            return;
        }

        lastVisible.value = snapshot.docs[snapshot.docs.length - 1];

        users.value = snapshot.docs.map((doc) => ({
            id: doc.id,
            username: doc.data().username || "Unknown User",
            bio: doc.data().bio || "",
            avatar: doc.data().avatar || null,
            skills: doc.data().skills || {},
            createdAt: doc.data().createdAt?.toDate() || new Date(),
        }));

        hasMore.value = snapshot.docs.length === limit;
    } catch (error) {
        console.error("Error loading users:", error);
    } finally {
        loading.value = false;
    }
};

// Load more users for pagination
const loadMore = async () => {
    if (loadingMore.value || !lastVisible.value) return;

    try {
        loadingMore.value = true;
        const currentUser = auth.currentUser;
        if (!currentUser) {
            loadingMore.value = false;
            return;
        }

        // Continue from last visible document
        let query = db
            .collection("users")
            .where(
                firebase.firestore.FieldPath.documentId(),
                "!=",
                currentUser.uid
            )
            .orderBy(firebase.firestore.FieldPath.documentId())
            .startAfter(lastVisible.value)
            .limit(limit);

        const snapshot = await query.get();

        if (!snapshot.empty) {
            lastVisible.value = snapshot.docs[snapshot.docs.length - 1];

            const newUsers = snapshot.docs.map((doc) => ({
                id: doc.id,
                username: doc.data().username || "Unknown User",
                bio: doc.data().bio || "",
                avatar: doc.data().avatar || null,
                skills: doc.data().skills || {},
                createdAt: doc.data().createdAt?.toDate() || new Date(),
            }));

            users.value = [...users.value, ...newUsers];
            hasMore.value = snapshot.docs.length === limit;
        } else {
            hasMore.value = false;
        }
    } catch (error) {
        console.error("Error loading more users:", error);
    } finally {
        loadingMore.value = false;
    }
};

// Toggle follow status for a user
const toggleFollow = async (userId) => {
    if (followInProgress.value) return;

    try {
        followInProgress.value = userId;
        const currentUser = auth.currentUser;
        if (!currentUser) return;

        const userRef = db.collection("users").doc(currentUser.uid);

        // Get current following list to ensure we have the latest data
        const userDoc = await userRef.get();
        let following = userDoc.data()?.following || [];

        // Update following list based on current status
        if (isFollowing(userId)) {
            following = following.filter((id) => id !== userId);
        } else {
            following.push(userId);
        }

        // Update database and local state
        await userRef.update({ following });
        currentUserFollowing.value = following;
    } catch (error) {
        console.error("Error toggling follow status:", error);
    } finally {
        followInProgress.value = null;
    }
};

// Initialize component
onMounted(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
        if (user) loadUsers();
        else {
            users.value = [];
            loading.value = false;
        }
    });

    // Clean up auth listener on unmount
    return () => unsubscribe();
});
</script>

<style scoped>
.followable-users-container {
    width: 100%;
    max-width: 800px;
    margin: 0 auto;
    padding: 20px 0;
}

.section-title {
    font-size: 24px;
    font-weight: 600;
    color: #ffffff;
    margin-bottom: 20px;
    padding-bottom: 10px;
    border-bottom: 1px solid #555d69;
}

.user-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.user-card {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px;
    background-color: #1a2233;
    border-radius: 8px;
    border: 1px solid #555d69;
    transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.user-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.3);
    border-color: #3498db;
}

.user-info {
    display: flex;
    align-items: center;
    flex: 1;
    min-width: 0;
}

.user-avatar {
    margin-right: 16px;
    flex-shrink: 0;
}

.user-avatar img {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid #3498db;
    background-color: #0d1117;
}

.user-details {
    flex: 1;
    min-width: 0;
}

.username {
    font-size: 18px;
    font-weight: 600;
    margin: 0 0 4px 0;
    color: #ffffff;
}

.bio {
    font-size: 14px;
    color: #cfd8dc;
    margin: 0 0 8px 0;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    line-clamp: 2;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
}

.skill-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
}

.skill-tag {
    background-color: rgba(52, 152, 219, 0.15);
    padding: 3px 8px;
    border-radius: 4px;
    font-size: 12px;
    color: #3498db;
    font-weight: 500;
    border: 1px solid rgba(52, 152, 219, 0.3);
}

.more-skills {
    font-size: 12px;
    color: #7d8796;
    padding: 3px 0;
}

.action-buttons {
    display: flex;
    flex-shrink: 0;
    gap: 10px;
}

.view-profile {
    background-color: transparent;
    color: #cfd8dc;
    border-color: #555d69;
}

.view-profile:hover {
    color: #ffffff;
    border-color: #ffffff;
}

.loading-container {
    width: 100%;
    height: 300px;
    position: relative;
}

.empty-state {
    text-align: center;
    padding: 40px 20px;
    background-color: rgba(26, 34, 51, 0.6);
    border-radius: 8px;
    border: 1px dashed #555d69;
    color: #cfd8dc;
}

.empty-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
    color: #555d69;
}

.load-more {
    margin-top: 24px;
    display: flex;
    justify-content: center;
}

@keyframes spinner {
    to {
        transform: rotate(360deg);
    }
}

@media (max-width: 600px) {
    .user-card {
        flex-direction: column;
        align-items: flex-start;
    }

    .action-buttons {
        margin-top: 16px;
        width: 100%;
        justify-content: space-between;
    }

    .user-avatar img {
        width: 50px;
        height: 50px;
    }
}
</style>
