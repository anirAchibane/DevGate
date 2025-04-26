<template>
    <div id="navbar" class="mini-navbar p-3">
        <div id="navbar-content" class="nav-items d-flex">
            <div class="ele">
                <router-link to="/home" class="navlink">
                    <div
                        class="nav-item d-flex align-items-center btn btn-outline btn-sm"
                    >
                        <div class="nav-icon-wrapper me-2">
                            <i class="fa-solid fa-house"></i>
                        </div>
                        <span>Home</span>
                    </div>
                </router-link>

                <router-link
                    :to="{
                        name: 'Profil',
                        params: { id: auth.currentUser.uid },
                    }"
                    class="navlink"
                >
                    <div
                        class="nav-item d-flex align-items-center btn btn-outline btn-sm"
                    >
                        <div class="nav-icon-wrapper me-2">
                            <i class="fa-solid fa-user"></i>
                        </div>
                        <span>Profile</span>
                    </div>
                </router-link>
            </div>

            <div
                class="nav-item d-flex align-items-center btn btn-outline-danger btn-sm logout-btn"
                @click="logout()"
            >
                <div class="nav-icon-wrapper me-2">
                    <i class="fa-solid fa-right-from-bracket"></i>
                </div>
                <span>Log Out</span>
            </div>
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
    background-color: #0d1117;
    border-bottom: 1px solid #555d69;
    color: #7d8796;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    position: sticky;
    top: 0;
    z-index: 1000;
}

#navbar-content {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 1rem;
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
    padding: 0.5rem 0.75rem;
    border-radius: 6px;
    transition: all 0.3s ease;
    font-weight: 500;
    letter-spacing: 0.02em;
}

.navlink:hover,
.nav-item:hover {
    color: white;
    cursor: pointer;
    background-color: rgba(255, 255, 255, 0.05);
    transform: translateY(-2px);
    text-shadow: 0 0 8px rgba(255, 255, 255, 0.4);
}

.nav-icon-wrapper {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    opacity: 0.9;
}

.nav-icon-wrapper i {
    font-size: 16px;
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

.logout-btn {
    border: 1px solid rgba(255, 255, 255, 0.1);
    background-color: rgba(255, 255, 255, 0.03);
    transition: all 0.3s ease;
}

.logout-btn:hover {
    background-color: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 255, 255, 0.2);
    color: #f44336;
}

@media (max-width: 768px) {
    .ele {
        gap: 10px;
    }

    .navlink,
    .nav-item {
        padding: 0.4rem 0.6rem;
        font-size: 0.9rem;
    }

    .nav-icon-wrapper {
        width: 20px;
        height: 20px;
    }
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
