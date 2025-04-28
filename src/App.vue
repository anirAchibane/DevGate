<template>
    <router-view></router-view>
</template>

<script>
import '@/assets/styles/variables.css';
import '@/assets/styles/buttons.css';

export default {
    name: 'App'
};
</script>

<style>
#app {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    background-color: var(--background-primary);
    color: var(--text-primary);
    min-height: 100vh;
}

nav {
    padding: var(--spacing-lg);
    display: flex;
    gap: var(--spacing-md);
    justify-content: center;
}

nav a {
    font-weight: bold;
    color: var(--text-secondary);
    text-decoration: none;
    transition: all var(--transition-normal);
    padding: var(--spacing-xs) var(--spacing-sm);
    border-radius: var(--radius-md);
    position: relative;
}

nav a:hover {
    color: var(--primary-color);
    background-color: rgba(52, 152, 219, 0.1);
    transform: translateY(-2px);
    box-shadow: var(--shadow-sm);
}

nav a.router-link-exact-active {
    color: var(--primary-color);
    position: relative;
}

nav a.router-link-exact-active::after {
    content: "";
    position: absolute;
    bottom: -3px;
    left: 0;
    width: 100%;
    height: 2px;
    background-color: var(--primary-color);
    transform: scaleX(0.8);
    transition: transform var(--transition-normal);
}

nav a.router-link-exact-active:hover::after {
    transform: scaleX(1);
}

/* Global form and input styles */
input,
textarea,
select {
    background-color: rgba(13, 17, 23, 0.7);
    border: 1px solid var(--border-light);
    color: var(--text-primary);
    border-radius: var(--radius-md);
    padding: var(--spacing-sm) var(--spacing-md);
    transition: all var(--transition-fast);
}

input:focus,
textarea:focus,
select:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
}

button {
    cursor: pointer;
}

.card {
    background-color: var(--background-secondary);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-sm);
    border: 1px solid var(--border-light);
    transition: all var(--transition-normal);
}

.card:hover {
    box-shadow: var(--shadow-md);
}

/* Animation classes */
.fade-enter-active,
.fade-leave-active {
    transition: opacity var(--transition-normal);
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}

.slide-fade-enter-active {
    transition: all var(--transition-normal) ease-out;
}

.slide-fade-leave-active {
    transition: all var(--transition-fast) cubic-bezier(1, 0.5, 0.8, 1);
}

.slide-fade-enter-from,
.slide-fade-leave-to {
    transform: translateY(10px);
    opacity: 0;
}
</style>
