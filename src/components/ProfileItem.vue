<template>
    <div class="profile-card">
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
                <div class="project-count" v-if="projectCount !== undefined">
                    <span
                        >{{ projectCount }}
                        {{ projectCount === 1 ? "project" : "projects" }}</span
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
        </div>
    </div>
</template>

<script setup>
import { defineProps } from "vue";

defineProps({
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
