<template>
    <mini-navbar></mini-navbar>
    <div>
        
    </div>
</template>

<script setup>
import MiniNavbar from "@/components/MiniNavbar.vue"
import { useRoute } from 'vue-router'

// User's ID from route params:
const route = useRoute();
const userId = route.params.id;
console.log(userId); // This will log the user ID from the URL
</script>

<style >
html, body, #app {
    height: 100%;
    margin: 0;
    padding: 0;
    background-color: #0D1117;
}

</style>