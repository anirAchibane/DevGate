<template>
    <div id="navbar" class="mini-navbar">
        <div id="navbar-content" class="d-flex align-items-center">
            <!-- Logo section -->
            <div class="logo-section">
                <router-link to="/home">
                    <img src="@/assets/devgate_logo.png" alt="DevGate" class="devgate-logo" />
                </router-link>
            </div>

            <!-- Search section -->
            <div class="search-section">
                <SearchBar />
            </div>

            <!-- Navigation items -->
            <div class="nav-items-section">
                
                <div class="nav-items d-flex" >
                    <router-link to="/dashboard" class="navlink" v-if="isModerator">
                        <div class="nav-item d-flex flex-column align-items-center">
                            <div class="nav-icon">
                                <i class="fa-solid fa-gear"></i>
                            </div>
                            <span>Dashboard</span>
                        </div>
                    </router-link>

                    <!-- Home -->
                    <router-link to="/home" class="navlink">
                        <div class="nav-item d-flex flex-column align-items-center">
                            <div class="nav-icon">
                                <i class="fa-solid fa-house"></i>
                            </div>
                            <span>Home</span>
                        </div>
                    </router-link>

                    <!-- Messaging -->
                    <router-link to="/messages" class="navlink">
                        <div class="nav-item d-flex flex-column align-items-center">
                            <div class="nav-icon">
                                <i class="fa-solid fa-comment-dots"></i>
                                <div v-if="hasUnreadMessages" class="notification-dot"></div>
                            </div>
                            <span>Messaging</span>
                        </div>
                    </router-link>

                    <!-- Profile -->
                    <router-link :to="{
                        name: 'Profil',
                        params: { id: auth.currentUser?.uid },
                    }" class="navlink">
                        <div class="nav-item d-flex flex-column align-items-center">
                            <div class="nav-icon profile-icon">
                                <img :src="userProfilePic ||
                                    require('@/assets/default_pfp.jpg')
                                    " alt="Profile" />
                            </div>
                            <span>Me</span>
                        </div>
                    </router-link>

                    <!-- Logout button -->
                    <div class="navlink">
                        <div class="nav-item d-flex flex-column align-items-center" @click="logout()">
                            <div class="nav-icon">
                                <i class="fa-solid fa-right-from-bracket"></i>
                            </div>
                            <span>Logout</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
#navbar {
    width: 100%;
    background-color: #010508;
    border-bottom: 1px solid #555d69;
    color: #cfd8dc;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    position: sticky;
    top: 0;
    z-index: 1000;
    padding: 0;
}

#navbar-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    max-width: 1200px;
    margin: 0 auto;
    padding: 0.5rem 1rem;
}

.logo-section {
    display: flex;
    align-items: center;
}

.devgate-logo {
    height: 50px;
    width: auto;
    margin-right: 0.5rem;
}

.search-section {
    flex-grow: 1;
    max-width: 400px;
    margin: 0 1.5rem;
}

.nav-items-section {
    display: flex;
    align-items: center;
}

.nav-items {
    display: flex;
    gap: 10px;
}

.navlink {
    color: #cfd8dc;
    text-decoration: none;
    position: relative;
    transition: all 0.3s ease;
}

.navlink:hover {
    color: #ffffff;
}

.nav-item {
    padding: 0.5rem;
    min-width: 70px;
    cursor: pointer;
    font-size: 0.8rem;
    border-radius: 8px;
    transition: all 0.3s ease;
}

.nav-item:hover {
    background-color: rgba(255, 255, 255, 0.1);
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.nav-icon {
    font-size: 1.2rem;
    margin-bottom: 0.2rem;
    position: relative;
    transition: transform 0.3s ease;
}

.nav-item:hover .nav-icon {
    transform: scale(1.1);
    color: var(--primary-blue-light, #5dade2);
}

.profile-icon {
    width: 30px;
    height: 30px;
    border-radius: 50%;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px solid #3498db;
    transition: all 0.3s ease;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.nav-item:hover .profile-icon {
    border-color: #5dade2;
    box-shadow: 0 4px 8px rgba(52, 152, 219, 0.4);
    transform: scale(1.1);
}

.profile-icon img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

/* Notification badge */
.notification-badge {
    position: absolute;
    top: -5px;
    right: -5px;
    background-color: #e74c3c;
    color: white;
    border-radius: 50%;
    width: 16px;
    height: 16px;
    font-size: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
}

/* Notification dot for unread messages */
.notification-dot {
    position: absolute;
    top: -3px;
    right: -3px;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background-color: #e74c3c;
    box-shadow: 0 0 3px rgba(0, 0, 0, 0.5);
}

/* Active navigation item */
.router-link-active .nav-item {
    color: white;
    border-bottom: 2px solid white;
}

@media (max-width: 768px) {
    .nav-items {
        gap: 5px;
    }

    .nav-item {
        min-width: 50px;
        font-size: 0.7rem;
    }

    .search-section {
        max-width: 150px;
        margin: 0 0.5rem;
    }
}

@media (max-width: 576px) {
    span {
        display: none;
    }

    .nav-item {
        min-width: auto;
    }

    .search-section {
        max-width: 120px;
    }
}
</style>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import { auth, db } from "@/firebase/config.js";
import { useRouter } from "vue-router";
import SearchBar from "@/components/SearchBar.vue";

const router = useRouter();
const userProfilePic = ref(null);
const hasUnreadMessages = ref(false);
let unsubscribe = null;
const isModerator = ref(false);

onMounted(async () => {
    if (auth.currentUser) {
        try {
            // Fetch user profile pic
            const userDoc = await db
                .collection("users")
                .doc(auth.currentUser.uid)
                .get();
            if (userDoc.exists) {
                userProfilePic.value = userDoc.data().avatar || null;
                isModerator.value = userDoc.data().role === "moderator";
            }

            // Setup listener for unread messages
            setupUnreadMessagesListener();
        } catch (error) {
            console.error("Error fetching user data:", error);
        }
    }
});

onUnmounted(() => {
    // Clean up listener when component is unmounted
    if (unsubscribe) {
        unsubscribe();
    }
});

// Set up a listener to check for unread messages
const setupUnreadMessagesListener = () => {
    const currentUserId = auth.currentUser.uid;

    // Listen to chats
    unsubscribe = db
        .collection("chat")
        .where("users", "array-contains", currentUserId)
        .onSnapshot(snapshot => {
            let unreadFound = false;

            snapshot.docs.forEach(doc => {
                const chatData = doc.data();
                // Check if unreadMessages field exists and if current user has any unread messages
                if (chatData.unreadMessages && chatData.unreadMessages[currentUserId] > 0) {
                    unreadFound = true;
                }
            });

            // Update the hasUnreadMessages value based on whether any unread messages were found
            hasUnreadMessages.value = unreadFound;
        }, error => {
            console.error("Error checking for unread messages:", error);
        });
};


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
