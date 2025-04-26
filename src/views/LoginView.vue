<template>
    <div class="auth-container">
        <div class="auth-card-wrapper">
            <div class="auth-card">
                <div class="auth-header">
                    <h1>Login</h1>
                </div>

                <!-- ALERTS -->
                <div
                    v-if="alert.message"
                    class="auth-alert"
                    :class="alert.type"
                    role="alert"
                >
                    <i
                        class="fas"
                        :class="
                            alert.type === 'alert-success'
                                ? 'fa-check-circle'
                                : 'fa-exclamation-circle'
                        "
                    ></i>
                    <div class="alert-message">{{ alert.message }}</div>
                </div>

                <form @submit.prevent="login" class="auth-form">
                    <div class="form-group">
                        <label for="email">Email</label>
                        <div class="input-wrapper">
                            <span class="input-icon">
                                <i class="fas fa-envelope"></i>
                            </span>
                            <input
                                type="email"
                                id="email"
                                placeholder="Enter your email"
                                v-model="email"
                                :class="{ 'is-invalid': emailError }"
                            />
                        </div>
                        <div class="error-feedback" v-if="emailError">
                            {{ emailError }}
                        </div>
                    </div>

                    <div class="form-group">
                        <label for="password">Password</label>
                        <div class="input-wrapper">
                            <span class="input-icon">
                                <i class="fas fa-lock"></i>
                            </span>
                            <input
                                :type="showPassword ? 'text' : 'password'"
                                id="password"
                                placeholder="Enter your password"
                                v-model="password"
                                :class="{ 'is-invalid': passwordError }"
                            />
                            <button
                                type="button"
                                class="toggle-password"
                                @click="togglePasswordVisibility"
                            >
                                <i
                                    :class="
                                        showPassword
                                            ? 'fas fa-eye-slash'
                                            : 'fas fa-eye'
                                    "
                                ></i>
                            </button>
                        </div>
                        <div class="error-feedback" v-if="passwordError">
                            {{ passwordError }}
                        </div>
                    </div>

                    <button
                        class="auth-button"
                        type="submit"
                        :disabled="isLoading"
                    >
                        <span v-if="isLoading" class="spinner"></span>
                        {{ isLoading ? "Logging in..." : "Login" }}
                    </button>
                </form>

                <div class="auth-footer">
                    <p>
                        New to DevGate?
                        <router-link to="/signup"
                            >Create an account</router-link
                        >
                    </p>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { auth } from "../firebase/config";

// Form data
const email = ref("");
const password = ref("");
const showPassword = ref(false);

// UI states
const isLoading = ref(false);
const emailError = ref("");
const passwordError = ref("");
const alert = ref({
    message: "",
    type: "", // 'alert-success' | 'alert-danger'
});

const router = useRouter();

// Utility: show a styled alert
const showAlert = (message, type = "alert-danger") => {
    alert.value = { message, type };
    setTimeout(() => {
        alert.value.message = "";
    }, 5000);
};

// Utility: translate Firebase errors to friendly messages
const translateError = (code) => {
    switch (code) {
        case "auth/invalid-email":
            return "Please enter a valid email address.";
        case "auth/user-disabled":
            return "This account has been disabled.";
        case "auth/user-not-found":
            return "No account found with this email.";
        case "auth/wrong-password":
            return "Incorrect password. Please try again.";
        case "auth/too-many-requests":
            return "Too many login attempts. Try again later.";
        default:
            return "Login failed. Please check your credentials and try again.";
    }
};

const login = async () => {
    // Reset states
    emailError.value = "";
    passwordError.value = "";
    alert.value.message = "";

    // Validation
    if (!email.value) {
        emailError.value = "Email is required.";
    }
    if (!password.value) {
        passwordError.value = "Password is required.";
    }
    if (emailError.value || passwordError.value) return;

    isLoading.value = true;

    try {
        const res = await auth.signInWithEmailAndPassword(
            email.value,
            password.value
        );
        console.log("Login successful:", res.user);
        showAlert("Welcome back!", "alert-success");
        router.push("/home");
    } catch (err) {
        console.error("Firebase error:", err.message);
        const friendlyMessage = translateError(err.code);
        showAlert(friendlyMessage, "alert-danger");
        password.value = "";
    } finally {
        isLoading.value = false;
    }
};

const togglePasswordVisibility = () => {
    showPassword.value = !showPassword.value;
};
</script>

<style scoped>
.auth-container {
    min-height: 100vh;
    padding: 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #010508;
    background-image: radial-gradient(
            circle at top right,
            rgba(13, 17, 23, 0.5) 0%,
            transparent 35%
        ),
        radial-gradient(
            circle at bottom left,
            rgba(13, 17, 23, 0.5) 0%,
            transparent 35%
        );
}

.auth-card-wrapper {
    width: 100%;
    max-width: 450px;
}

.auth-card {
    background-color: #0d1117;
    border-radius: 10px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
    padding: 2.5rem;
    border: 1px solid #555d69;
}

.auth-header {
    margin-bottom: 2rem;
    text-align: center;
}

.auth-header h1 {
    color: #ffffff;
    font-size: 2rem;
    font-weight: 700;
    letter-spacing: 0.5px;
    margin: 0;
}

.auth-alert {
    display: flex;
    align-items: center;
    padding: 0.75rem 1rem;
    border-radius: 6px;
    margin-bottom: 1.5rem;
}

.alert-success {
    background-color: rgba(46, 204, 113, 0.2);
    border: 1px solid rgba(46, 204, 113, 0.3);
    color: #2ecc71;
}

.alert-danger {
    background-color: rgba(231, 76, 60, 0.2);
    border: 1px solid rgba(231, 76, 60, 0.3);
    color: #e74c3c;
}

.alert-message {
    margin-left: 0.5rem;
}

.auth-form {
    margin-bottom: 1.5rem;
}

.form-group {
    margin-bottom: 1.5rem;
}

.form-group label {
    display: block;
    margin-bottom: 0.5rem;
    color: #ffffff;
    font-weight: 600;
    font-size: 0.95rem;
}

.input-wrapper {
    position: relative;
    display: flex;
    align-items: stretch;
}

.input-icon {
    position: absolute;
    left: 15px;
    top: 50%;
    transform: translateY(-50%);
    color: #3498db;
    font-size: 1rem;
    z-index: 2;
}

.input-wrapper input {
    width: 100%;
    background-color: #1a2233;
    border: 1px solid #555d69;
    border-radius: 6px;
    padding: 0.75rem 1rem 0.75rem 2.75rem;
    color: #ffffff;
    font-size: 1rem;
    transition: border-color 0.2s, box-shadow 0.2s, background-color 0.2s;
}

.input-wrapper input::placeholder {
    color: #7d8590;
}

.input-wrapper input:hover {
    background-color: #202a3c;
    border-color: #3498db;
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(52, 152, 219, 0.2);
}

.input-wrapper input:focus {
    outline: none;
    background-color: #202a3c;
    border-color: #3498db;
    box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.25);
}

.input-wrapper input.is-invalid {
    border-color: #e74c3c;
}

.toggle-password {
    position: absolute;
    right: 10px;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    color: #7d8590;
    cursor: pointer;
    font-size: 1rem;
    padding: 0.25rem 0.5rem;
    transition: all 0.2s;
}

.toggle-password:hover,
.toggle-password:focus {
    color: #3498db;
    outline: none;
    transform: translateY(-2px) scale(1.1);
}

.error-feedback {
    margin-top: 0.5rem;
    color: #e74c3c;
    font-size: 0.85rem;
}

.auth-button {
    width: 100%;
    height: 48px;
    background-color: #3498db;
    color: #ffffff;
    border: none;
    border-radius: 6px;
    padding: 0.875rem 1.5rem;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    justify-content: center;
    align-items: center;
    margin-top: 1rem;
    position: relative;
    overflow: hidden;
}

.auth-button::after {
    content: "";
    position: absolute;
    top: 50%;
    left: 50%;
    width: 5px;
    height: 5px;
    background: rgba(255, 255, 255, 0.3);
    opacity: 0;
    border-radius: 100%;
    transform: scale(1, 1) translate(-50%);
    transform-origin: 50% 50%;
}

.auth-button:focus:not(:active)::after {
    animation: ripple 1s ease-out;
}

.auth-button:hover:not(:disabled) {
    background-color: #2980b9;
    transform: translateY(-4px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.4);
    letter-spacing: 0.5px;
}

.auth-button:active:not(:disabled) {
    transform: translateY(0);
    box-shadow: 0 3px 6px rgba(0, 0, 0, 0.2);
}

.auth-button:disabled {
    background-color: #555d69;
    color: #bec3c9;
    cursor: not-allowed;
}

.auth-footer {
    text-align: center;
    margin-top: 1.5rem;
    color: #bec3c9;
}

.auth-footer a {
    color: #3498db;
    font-weight: 600;
    text-decoration: none;
    position: relative;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    transition: all 0.3s ease;
    display: inline-block;
}

.auth-footer a:hover {
    color: white;
    background-color: rgba(52, 152, 219, 0.15);
    transform: translateY(-3px) scale(1.05);
    box-shadow: 0 6px 12px rgba(52, 152, 219, 0.25);
}

.auth-footer a::after {
    content: "";
    position: absolute;
    width: 0;
    height: 2px;
    bottom: -1px;
    left: 50%;
    background-color: #3498db;
    transform: translateX(-50%);
    transition: width 0.3s ease;
}

.auth-footer a:hover::after {
    width: 80%;
}

.auth-footer a:focus {
    outline: none;
    box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.4);
}

.spinner {
    display: inline-block;
    width: 1.25rem;
    height: 1.25rem;
    margin-right: 0.5rem;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: #ffffff;
    border-radius: 50%;
    animation: spinner 0.8s linear infinite;
}

@keyframes spinner {
    to {
        transform: rotate(360deg);
    }
}

@keyframes ripple {
    0% {
        transform: scale(0, 0);
        opacity: 1;
    }
    20% {
        transform: scale(25, 25);
        opacity: 1;
    }
    100% {
        opacity: 0;
        transform: scale(40, 40);
    }
}

@media (max-width: 480px) {
    .auth-card {
        padding: 1.5rem;
    }

    .auth-header h1 {
        font-size: 1.75rem;
    }
}
</style>
