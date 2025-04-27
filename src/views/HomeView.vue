<template>
  <div class="all">
    <mini-navbar />
    <div class="container">
      <posts-list />

    </div>
  </div>
</template>

<script setup>
import MiniNavbar from "@/components/MiniNavbar.vue";
import PostsList from "@/components/PostsList.vue";
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
  background-color: #0D1117;
  width: 100%;
  height: 100%;
}
.container {
  display: flex;
  flex-direction: column;
  margin: 5%;
  padding: 5%;
  
}
</style>