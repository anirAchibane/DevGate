<template>
    <mini-navbar></mini-navbar>
    <div
        class="profile-view d-flex flex-column align-items-center justify-content-center"
    >
        <h1 class="text-white">Profile View</h1>
        <h2 class="text-white">User ID: {{ userId }}</h2>
    </div>
</template>

<script setup>
import MiniNavbar from "@/components/MiniNavbar.vue";
import { useRoute } from "vue-router";

// User's ID from route params:
const route = useRoute();
const userId = route.params.id;
console.log(userId); // This will log the user ID from the URL
</script>

<style>
html,
body,
#app {
    height: 100%;
    margin: 0;
    padding: 0;
    background-color: #0d1117;
}
</style>
