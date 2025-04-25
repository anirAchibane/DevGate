import { createRouter, createWebHistory } from "vue-router";
import Homeview from "../views/HomeView.vue";
import ProfileView from "../views/ProfileView.vue";
import LoginView from "../views/LoginView.vue";

const routes = [
    {
        path: "/home",
        name: "Home",
        component: Homeview,
    },
    {
        path: "/profil",
        name: "Profil",
        component: ProfileView,
    },
    {
        path: "/",
        name: "login",
        component: LoginView
    }
];

const router = createRouter({
    history: createWebHistory(process.env.BASE_URL),
    routes,
});

export default router;

