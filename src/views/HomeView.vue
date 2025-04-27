<template>
    <div class="all">
        <mini-navbar />
        <h1 class="page-title">HomeView.vue</h1>
        <div class="content-container">
            <!-- Sample ProfileItem with filler data -->
            <div class="profile-sample">
                <profile-item
                    userId="sample-user-123"
                    username="John Developer"
                    bio="Full-stack developer passionate about Vue.js, Firebase, and building amazing web applications. Currently working on DevGate and other exciting projects."
                    :avatar="require('@/assets/default_pfp.jpg')"
                    :skills="sampleSkills"
                    :projectCount="5"
                />
            </div>
        </div>
    </div>
</template>

<script setup>
import MiniNavbar from "@/components/MiniNavbar.vue";
import ProfileItem from "@/components/ProfileItem.vue";

// Sample skills data for the profile item
const sampleSkills = [
    { id: "1", name: "Vue.js" },
    { id: "2", name: "Firebase" },
    { id: "3", name: "JavaScript" },
    { id: "4", name: "CSS" },
    { id: "5", name: "UI/UX Design" },
];
</script>

<style>
html,
body,
#app {
    height: 100%;
    margin: 0;
    padding: 0;
}

.all {
    background-color: #0d1117;
    width: 100%;
    min-height: 100%;
}

.content-container {
    padding: 2rem;
    max-width: 1200px;
    margin: 0 auto;
    display: flex;
    justify-content: center;
    align-items: center;
}

.page-title {
    color: #ffffff;
    font-size: 2.5rem;
    font-weight: 700;
    text-align: center;
    margin-top: 2rem;
}

@media (max-width: 768px) {
    .content-container {
        padding: 1rem;
    }

    .page-title {
        font-size: 2rem;
    }
}

.profile-sample {
    width: 100%;
    max-width: 700px;
    margin-top: 2rem;
}
</style>
