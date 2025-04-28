<template>
    <div class="profile-card">
        <LoadingOverlay
            v-if="profileLoading"
            message="Loading profile..."
            transparent
        />
        <div v-else>
            <div class="profile-header">
                <div class="profile-picture">
                    <img
                        :src="avatar || require('@/assets/default_pfp.jpg')"
                        alt="Profile Picture"
                    />
                </div>
                <div class="profile-info">
                    <h2 class="username">{{ username }}</h2>
                    <p class="bio">{{ bio || "No bio available" }}</p>
                    <div class="skill-tags" v-if="skills && skills.length">
                        <span
                            class="skill-tag"
                            v-for="skill in skills"
                            :key="skill.name"
                            >{{ skill.name }}</span
                        >
                    </div>
                    <div
                        class="project-count"
                        v-if="projectCount !== undefined"
                    >
                        <span
                            >{{ projectCount }}
                            {{
                                projectCount === 1 ? "project" : "projects"
                            }}</span
                        >
                    </div>
                </div>
            </div>
            <div class="profile-action">
                <router-link
                    :to="{ name: 'Profil', params: { id: userId } }"
                    class="view-profile-btn"
                >
                    <i class="fas fa-user-circle"></i> View Profile
                </router-link>

                <!-- Only show follow button if not viewing own profile -->
                <button
                    v-if="userId !== currentUserId"
                    class="follow-btn"
                    :class="{ following: isUserFollowing }"
                    @click="toggleFollow"
                    :disabled="followLoading"
                >
                    <span v-if="followLoading" class="btn-loading"></span>
                    <span v-else>
                        <i
                            :class="
                                isUserFollowing
                                    ? 'fas fa-user-check'
                                    : 'fas fa-user-plus'
                            "
                        ></i>
                        {{ isUserFollowing ? "Following" : "Follow" }}
                    </span>
                </button>
            </div>
        </div>
    </div>
</template>

<script setup>
import { defineProps, ref, onMounted, watch } from "vue";
import { auth } from "@/firebase/config";
import {
    isFollowing,
    followUser,
    unfollowUser,
} from "@/composables/userFollow";
import LoadingOverlay from "@/components/LoadingOverlay.vue";

const props = defineProps({
    userId: {
        type: String,
        required: true,
    },
    avatar: {
        type: String,
        default: null,
    },
    username: {
        type: String,
        required: true,
    },
    bio: {
        type: String,
        default: "",
    },
    skills: {
        type: Array,
        default: () => [],
    },
    projectCount: {
        type: Number,
        default: 0,
    },
});

// UI state
const isUserFollowing = ref(false);
const followLoading = ref(false);
const currentUserId = ref(null);
const profileLoading = ref(true);

// Check if current user is following this profile
const checkFollowStatus = async () => {
    if (!auth.currentUser || props.userId === auth.currentUser.uid) {
        profileLoading.value = false;
        return;
    }

    // eslint-disable-next-line no-unused-vars
    const { following, loading } = isFollowing(props.userId);

    watch(following, (newFollowing) => {
        isUserFollowing.value = newFollowing;
        profileLoading.value = false;
    });

    watch(loading, (isLoading) => {
        if (!isLoading) {
            profileLoading.value = false;
        }
    });
};

// Toggle follow status
const toggleFollow = async (event) => {
    event.preventDefault(); // Prevent navigating to profile
    event.stopPropagation();

    if (followLoading.value || !auth.currentUser) return;

    followLoading.value = true;

    try {
        if (isUserFollowing.value) {
            // Unfollow user
            const { success, error } = await unfollowUser(props.userId);

            if (success.value) {
                isUserFollowing.value = false;
            } else if (error.value) {
                console.error("Error unfollowing user:", error.value);
            }
        } else {
            // Follow user
            const { success, error } = await followUser(props.userId);

            if (success.value) {
                isUserFollowing.value = true;
            } else if (error.value) {
                console.error("Error following user:", error.value);
            }
        }
    } catch (err) {
        console.error("Error toggling follow status:", err);
    } finally {
        followLoading.value = false;
    }
};

// Set up when component mounts
onMounted(() => {
    profileLoading.value = true;

    // Set current user ID and check follow status
    const unsubscribe = auth.onAuthStateChanged((user) => {
        if (user) {
            currentUserId.value = user.uid;
            checkFollowStatus();
        } else {
            profileLoading.value = false;
        }
    });

    // Clean up auth listener
    return () => unsubscribe();
});
</script>

<style scoped>
.profile-card {
    width: 100%;
    max-width: 700px;
    padding: 20px;
    background-color: #1a2233;
    border-radius: 8px;
    margin-bottom: 16px;
    border: 1px solid #555d69;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    transition: transform 0.3s ease, box-shadow 0.3s ease;
    position: relative;
    min-height: 180px;
}

.profile-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.4);
}

.profile-header {
    display: flex;
    align-items: flex-start;
}

.profile-picture {
    margin-right: 20px;
    flex-shrink: 0;
}

.profile-picture img {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid #3498db;
    box-shadow: 0 2px 8px rgba(52, 152, 219, 0.3);
    transition: transform 0.3s ease;
}

.profile-card:hover .profile-picture img {
    transform: scale(1.05);
}

.profile-info {
    flex: 1;
    min-width: 0;
}

.username {
    font-size: 20px;
    font-weight: bold;
    margin: 0 0 8px 0;
    color: #ffffff;
    word-break: break-word;
}

.bio {
    font-size: 14px;
    color: #cfd8dc;
    margin: 0 0 12px 0;
    word-wrap: break-word;
    line-height: 1.4;
}

.skill-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 12px;
}

.skill-tag {
    background-color: rgba(52, 152, 219, 0.15);
    padding: 4px 10px;
    border-radius: 4px;
    font-size: 12px;
    color: #3498db;
    font-weight: 500;
    border: 1px solid rgba(52, 152, 219, 0.3);
    transition: all 0.2s ease;
}

.skill-tag:hover {
    background-color: rgba(52, 152, 219, 0.25);
    transform: translateY(-2px);
}

.project-count {
    font-size: 14px;
    color: #7d8796;
    margin-bottom: 12px;
}

.profile-action {
    display: flex;
    justify-content: flex-end;
    margin-top: 16px;
    gap: 10px;
}

.view-profile-btn {
    display: inline-flex;
    align-items: center;
    padding: 8px 16px;
    background-color: rgba(52, 152, 219, 0.1);
    color: #3498db;
    border: 1px solid rgba(52, 152, 219, 0.3);
    border-radius: 6px;
    font-size: 14px;
    font-weight: 500;
    text-decoration: none;
    transition: all 0.2s ease;
}

.view-profile-btn i {
    margin-right: 6px;
}

.view-profile-btn:hover {
    background-color: rgba(52, 152, 219, 0.2);
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.follow-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 8px 16px;
    font-size: 14px;
    font-weight: 500;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s ease;
    border: 1px solid;
    min-width: 100px;
}

.follow-btn:not(.following) {
    background-color: #3498db;
    color: white;
    border-color: #3498db;
}

.follow-btn.following {
    background-color: transparent;
    color: #3498db;
    border-color: #3498db;
}

.follow-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.follow-btn i {
    margin-right: 6px;
}

.follow-btn:disabled {
    opacity: 0.7;
    cursor: not-allowed;
}

.follow-btn .btn-loading {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top: 2px solid white;
    border-radius: 50%;
    animation: spin 1s linear infinite;
}

@keyframes spin {
    0% {
        transform: rotate(0deg);
    }
    100% {
        transform: rotate(360deg);
    }
}

@media (max-width: 600px) {
    .profile-header {
        flex-direction: column;
        align-items: center;
        text-align: center;
    }

    .profile-picture {
        margin-right: 0;
        margin-bottom: 16px;
    }

    .skill-tags {
        justify-content: center;
    }

    .project-count {
        text-align: center;
    }

    .profile-action {
        justify-content: center;
    }
}
</style>
