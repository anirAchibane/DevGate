<template>
    <div id="navbar" class="mini-navbar p-3 rounded-lg">
        <div id="navbar-content" class="nav-items d-flex">
            <div class="ele">
                <div
                    class="nav-item d-flex align-items-center"
                    @click="logout()"
                >
                    <div class="nav-icon-wrapper me-2">
                        <i class="fa-solid fa-right-from-bracket"></i>
                    </div>
                    <span>Log Out</span>
                </div>

                <router-link to="/home" class="navlink">
                    <div class="nav-item d-flex align-items-center">
                        <div class="nav-icon-wrapper me-2">
                            <i class="fa-solid fa-house"></i>
                        </div>
                        <span>Home</span>
                    </div>
                </router-link>
            </div>
            <router-link
                :to="{ name: 'Profil', params: { id: auth.currentUser.uid } }"
                class="navlink"
            >
                <div class="nav-item d-flex align-items-center">
                    <div class="nav-icon-wrapper me-2">
                        <i class="fa-solid fa-user"></i>
                    </div>
                    <span>Profile</span>
                </div>
            </router-link>
        </div>
    </div>
</template>

<style>
html,
body,
#app {
    height: 100%;
    margin: 0;
    padding: 0;
    background-color: #010508;
}

#navbar {
    width: 100%;
    background-color: #010508;
    border-bottom: 1px solid #555d69;
    color: #7d8796;
}

#navbar-content {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
}

.ele {
    display: flex;
    flex-direction: row;
    gap: 20px;
}

.navlink,
.nav-item {
    text-decoration: none;
    color: inherit;
    position: relative;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    transition: all 0.3s ease;
}

.navlink:hover,
.nav-item:hover {
    color: white;
    cursor: pointer;
    transform: translateY(-2px);
    text-shadow: 0 0 8px rgba(255, 255, 255, 0.4);
}

.navlink::after,
.nav-item::after {
    content: "";
    position: absolute;
    width: 0;
    height: 2px;
    bottom: -2px;
    left: 50%;
    background-color: #3498db;
    transform: translateX(-50%);
    transition: width 0.3s ease;
}

.navlink:hover::after,
.nav-item:hover::after {
    width: 80%;
}

.router-link-active {
    color: #3498db !important;
    font-weight: 600;
}

.router-link-active::after {
    width: 70%;
    background-color: #3498db;
}

.router-link-active:hover::after {
    width: 90%;
}
</style>

<script setup>
import { auth } from "@/firebase/config.js";
import { useRouter } from "vue-router";

const router = useRouter();

const logout = async () => {
    if (auth.currentUser) {
        try {
            await auth.signOut();
            console.log("User signed out");
            alert("Logged out");
            router.push("/");
        } catch (error) {
            console.error("Error signing out:", error);
        }
    } else {
        console.log("No user is currently logged in");
        alert("No user is logged in");
        router.push("/");
    }
};
</script>
