<template>
    <router-view></router-view>
</template>

<style>
#app {
    font-family: Avenir, Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-align: center;
    color: #2c3e50;
}

nav {
    padding: 30px;
}

nav a {
    font-weight: bold;
    color: #2c3e50;
    text-decoration: none;
    transition: all 0.3s ease;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    position: relative;
}

nav a:hover {
    color: #3498db;
    background-color: rgba(52, 152, 219, 0.1);
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(52, 152, 219, 0.15);
}

nav a.router-link-exact-active {
    color: #42b983;
    position: relative;
}

nav a.router-link-exact-active::after {
    content: "";
    position: absolute;
    bottom: -3px;
    left: 0;
    width: 100%;
    height: 2px;
    background-color: #42b983;
    transform: scaleX(0.8);
    transition: transform 0.3s ease;
}

nav a.router-link-exact-active:hover::after {
    transform: scaleX(1);
}
</style>
