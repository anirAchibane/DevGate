import { createRouter, createWebHistory } from "vue-router";
import Homeview from "../views/HomeView.vue";
import ProfileView from "../views/ProfileView.vue";
import LoginView from "../views/LoginView.vue";
import SignupView from "../views/SignupView.vue";
import MessagesView from "@/views/MessagesView.vue"; 
import SettingsView from "../views/SettingsView.vue";
import AddNewView from "../views/AddNewView";
import { auth, db } from "../firebase/config"; // Import Firebase auth

const routes = [
    {
        path: "/",
        name: "login",
        component: LoginView,
    },
    {
        path: "/signup",
        name: "signup",
        component: SignupView,
    },
    {
        path: "/home",
        name: "Home",
        component: Homeview,
    },
    {
        path: "/profil/:id",
        name: "Profil",
        component: ProfileView,
    },
    {

        path: "/messages",
        name: "Messages",
        component: MessagesView,
        meta: { requiresAuth: true },
    },

    {  path: "/settings",
        name: "Settings",
        component: SettingsView,
    },
    {
        path: "/add/:id",
        name: "Add",
        component: AddNewView,
    }
];

const router = createRouter({
    history: createWebHistory(process.env.BASE_URL),
    routes,
});

// Navigation guard
router.beforeEach(async (to, from, next) => {
    const requiresAuth = to.matched.some((record) => record.meta.requiresAuth);
    const guestOnly = to.matched.some((record) => record.meta.guestOnly);

    // Wait for Firebase auth to be ready
    const waitForAuthReady = () =>
        new Promise((resolve) => {
            if (auth.currentUser !== null) return resolve(auth.currentUser);
            const unsubscribe = auth.onAuthStateChanged((user) => {
                unsubscribe();
                resolve(user);
            });
        });

    const user = await waitForAuthReady();

    // Block if user is banned
    if (user) {
        const userDoc = await db.collection("users").doc(user.uid).get();
        const userData = userDoc.data();

        if (userData?.role === "banned") {
            alert("You are banned from this site");
            return next({ path: "/" });
        }
    }

    // Redirect to login if route requires auth but no user
    if (requiresAuth && !user) {
        return next({
            name: "login",
            query: { redirect: to.fullPath },
        });
    }

    // Redirect to home if guest-only route and user is logged in
    if (guestOnly && user) {
        return next({ name: "home" });
    }

    // All checks passed, proceed
    return next();
});

export default router;
