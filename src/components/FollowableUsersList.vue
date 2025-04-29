<template>
    <div class="followable-users-container">
        <h2 v-if="!compact" class="section-title">{{ listTitle }}</h2>

        <div v-if="loading" class="loading-container">
            <LoadingOverlay message="Loading users..." transparent />
        </div>

        <div v-else-if="displayUsers.length === 0" class="empty-state">
            <i class="fas fa-users empty-icon"></i>
            <p>{{ emptyStateMessage }}</p>
        </div>

        <div v-else class="user-list" :class="{ 'compact-list': compact }">
            <div v-for="user in limitedUsers" :key="user.id" class="user-card" :class="{ 'compact-card': compact }">
                <div class="user-info">
                    <div class="user-avatar">
                        <router-link :to="{ name: 'Profil', params: { id: user.id } }">
                            <img
                                :src="
                                    user.avatar ||
                                    require('@/assets/default_pfp.jpg')
                                "
                                alt="User avatar"
                            />
                        </router-link>
                    </div>
                    <div class="user-details">
                        <router-link :to="{ name: 'Profil', params: { id: user.id } }" class="username-link">
                            <h3 class="username">{{ user.username }}</h3>
                        </router-link>
                        <p v-if="!compact" class="bio">{{ user.bio || "No bio available" }}</p>

                        <div
                            class="skill-tags"
                            v-if="getUserSkills(user).length > 0 && !compact"
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

                <div class="action-buttons" :class="{ 'compact-buttons': compact }">
                    <button
                        v-if="mode !== 'followings' || !hideFollowButton"
                        class="btn btn-outline btn-sm follow-btn"
                        :class="{ 'btn-primary': isFollowing(user.id), 'compact-follow-btn': compact }"
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
                            <span v-if="!compact">{{ isFollowing(user.id) ? "Following" : "Follow" }}</span>
                        </span>
                    </button>
                    <router-link
                        v-if="!compact"
                        :to="{ name: 'Profil', params: { id: user.id } }"
                        class="btn btn-sm btn-outline view-profile"
                    >
                        <i class="fas fa-user-circle"></i> View
                    </router-link>
                </div>
            </div>
        </div>

        <div v-if="!loading && hasMore && displayUsers.length > maxUsers && !compact" class="load-more">
            <button
                class="btn btn-outline"
                @click="loadMore"
                :disabled="loadingMore"
            >
                <span v-if="loadingMore" class="btn-loading"></span>
                <span v-else>Load More</span>
            </button>
        </div>
        
        <div v-if="!loading && displayUsers.length > 0 && compact && displayUsers.length > maxUsers" class="view-all-link">
            <router-link :to="viewAllLink" class="view-all">
                {{ viewAllText }}
            </router-link>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, computed, defineProps, watch } from "vue";
import { db, auth, firebase } from "@/firebase/config";
import LoadingOverlay from "@/components/LoadingOverlay.vue";
import { getFollowers } from "@/composables/getFollowers";
import { getFollowings } from "@/composables/getFollowings";

const props = defineProps({
    maxUsers: {
        type: Number,
        default: 6
    },
    compact: {
        type: Boolean,
        default: false
    },
    userId: {
        type: String,
        default: null
    },
    mode: {
        type: String,
        default: 'suggestions', // 'suggestions', 'followers', 'followings'
        validator: (value) => ['suggestions', 'followers', 'followings'].includes(value)
    },
    hideFollowButton: {
        type: Boolean,
        default: false
    }
});

const users = ref([]);
const currentUserFollowing = ref([]);
const loading = ref(true);
const loadingMore = ref(false);
const lastVisible = ref(null);
const followInProgress = ref(null);
const hasMore = ref(true);
const limit = computed(() => props.maxUsers * 2);

// Computed property to determine which users to display based on mode
const displayUsers = computed(() => {
    return users.value;
});

// Computed property to limit the number of users shown
const limitedUsers = computed(() => {
    return displayUsers.value.slice(0, props.maxUsers);
});

// Computed property for list title
const listTitle = computed(() => {
    switch (props.mode) {
        case 'followers':
            return 'Followers';
        case 'followings':
            return 'Following';
        default:
            return 'People You Might Want to Follow';
    }
});

// Computed property for empty state message
const emptyStateMessage = computed(() => {
    switch (props.mode) {
        case 'followers':
            return 'No followers yet.';
        case 'followings':
            return 'Not following anyone yet.';
        default:
            return 'No users found to follow at the moment.';
    }
});

// Computed property for view all link
const viewAllLink = computed(() => {
    switch (props.mode) {
        case 'followers':
            return { name: 'Profil', params: { id: props.userId }, query: { tab: 'followers' } };
        case 'followings':
            return { name: 'Profil', params: { id: props.userId }, query: { tab: 'following' } };
        default:
            return '/explore-users';
    }
});

// Computed property for view all text
const viewAllText = computed(() => {
    switch (props.mode) {
        case 'followers':
            return 'View all followers';
        case 'followings':
            return 'View all following';
        default:
            return 'View all suggestions';
    }
});

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

// Load users based on the mode (suggestions, followers, or followings)
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

        const targetUserId = props.userId || currentUser.uid;

        // Load users based on the mode
        if (props.mode === 'followers') {
            // Use the getFollowers composable
            // eslint-disable-next-line no-unused-vars
            const { followers, loading: followerLoading, error } = getFollowers(targetUserId);
            watch(followers, (newFollowers) => {
                users.value = newFollowers;
                loading.value = false;
            });
            watch(followerLoading, (isLoading) => {
                loading.value = isLoading;
            });
        } else if (props.mode === 'followings') {
            // Use the getFollowings composable
            // eslint-disable-next-line no-unused-vars
            const { followings, loading: followingLoading, error } = getFollowings(targetUserId);
            watch(followings, (newFollowings) => {
                users.value = newFollowings;
                loading.value = false;
            });
            watch(followingLoading, (isLoading) => {
                loading.value = isLoading;
            });
        } else {
            // Load suggestions (users not followed)
            // Query users that are not the current user
            let query = db
                .collection("users")
                .where(
                    firebase.firestore.FieldPath.documentId(),
                    "!=",
                    currentUser.uid
                )
                .orderBy(firebase.firestore.FieldPath.documentId())
                .limit(limit.value);

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

            hasMore.value = snapshot.docs.length === limit.value;
            loading.value = false;
        }
    } catch (error) {
        console.error("Error loading users:", error);
        loading.value = false;
    }
};

// Load more users for pagination
const loadMore = async () => {
    if (loadingMore.value || !lastVisible.value || props.mode !== 'suggestions') return;

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
            .limit(limit.value);

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
            hasMore.value = snapshot.docs.length === limit.value;
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
        
        // If we're in followers/following mode, refresh the list
        if ((props.mode === 'followers' || props.mode === 'followings') && props.userId) {
            loadUsers();
        }
    } catch (error) {
        console.error("Error toggling follow status:", error);
    } finally {
        followInProgress.value = null;
    }
};

// Watch for changes in userId or mode
watch(() => [props.userId, props.mode], () => {
    if (auth.currentUser) loadUsers();
}, { immediate: false });

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

.compact-list {
    gap: 10px;
}

.user-card {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px;
    background-color: #1a2233;
    border-radius: 8px;
    border: 1px solid #555d69;
    transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease;
}

.user-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.3);
    border-color: #3498db;
}

.compact-card {
    padding: 10px;
    margin-bottom: 5px;
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
    transition: transform 0.2s ease;
}

.compact-card .user-avatar img {
    width: 40px;
    height: 40px;
}

.user-avatar img:hover {
    transform: scale(1.05);
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
    transition: color 0.2s ease;
}

.username-link {
    text-decoration: none;
}

.username-link:hover .username {
    color: #3498db;
}

.compact-card .username {
    font-size: 14px;
    margin-bottom: 0;
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

.compact-buttons {
    gap: 5px;
}

.follow-btn {
    min-width: 90px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 5px;
    transition: all 0.2s ease;
    background-color: #1a2233 !important; /* Slightly lighter than card background */
    color: #3498db !important; /* Use accent blue for better visibility */
    border: 2px solid #3498db !important; /* Thicker border with accent color */
}

.follow-btn:hover {
    background-color: #3498db !important;
    color: #ffffff !important;
    border-color: #3498db !important;
    box-shadow: 0 0 8px rgba(52, 152, 219, 0.5) !important;
}

.btn-primary.follow-btn {
    background-color: #3498db !important;
    color: #ffffff !important;
}

.compact-follow-btn {
    min-width: 40px;
    width: 40px;
    height: 40px;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
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
    height: 200px;
    position: relative;
}

.empty-state {
    text-align: center;
    padding: 20px;
    background-color: rgba(26, 34, 51, 0.6);
    border-radius: 8px;
    border: 1px dashed #555d69;
    color: #cfd8dc;
}

.empty-icon {
    font-size: 2.5rem;
    margin-bottom: 1rem;
    color: #555d69;
}

.load-more {
    margin-top: 20px;
    display: flex;
    justify-content: center;
}

.view-all-link {
    margin-top: 10px;
    text-align: center;
}

.view-all {
    color: #3498db;
    text-decoration: none;
    font-size: 14px;
    font-weight: 500;
    transition: color 0.2s ease;
}

.view-all:hover {
    color: #2980b9;
    text-decoration: underline;
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

    .compact-card {
        flex-direction: row;
    }

    .action-buttons {
        margin-top: 16px;
        width: 100%;
        justify-content: space-between;
    }

    .compact-buttons {
        margin-top: 0;
        width: auto;
    }

    .user-avatar img {
        width: 50px;
        height: 50px;
    }

    .compact-card .user-avatar img {
        width: 40px;
        height: 40px;
    }
}
</style>
