import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";

// Import Bootstrap and its CSS
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue-3/dist/bootstrap-vue-3.css";
import { BootstrapVue3 } from "bootstrap-vue-3";

// Import Font Awesome
import "@fortawesome/fontawesome-free/css/all.css";
import "@fortawesome/fontawesome-free/js/all.js";

const app = createApp(App);

// Use plugins
app.use(router);
app.use(BootstrapVue3);

// Mount app
app.mount("#app");
