<template>
    <div class="auth-container">
        <!-- Loading overlay -->
        <div v-if="isLoading" class="loading-overlay">
            <div class="spinner-large"></div>
            <p>Creating your account...</p>
        </div>

        <div class="auth-card-wrapper">
            <div class="auth-card">
                <div class="auth-header">
                    <div class="logo-container">
                        <img src="@/assets/devgate_logo.png" alt="DevGate Logo" class="auth-logo">
                    </div>
                    <h1>Join DevGate</h1>
                    <p class="auth-subtitle">Create an account and start your developer journey</p>
                </div>

                <!-- alertS -->
                <div
                    v-if="alerting.message"
                    class="auth-alert"
                    :class="alerting.type"
                    role="alert"
                >
                    <i
                        class="fas"
                        :class="
                            alerting.type === 'alert-success'
                                ? 'fa-check-circle'
                                : 'fa-exclamation-circle'
                        "
                    ></i>
                    <div class="alert-message">{{ alerting.message }}</div>
                </div>

                <form @submit.prevent="signup" class="auth-form">
                    <div class="form-columns">
                        <!-- Left Column -->
                        <div class="form-column">
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
                                    />
                                </div>
                            </div>

                            <div class="form-group">
                                <label for="password">Password</label>
                                <div class="input-wrapper">
                                    <span class="input-icon">
                                        <i class="fas fa-lock"></i>
                                    </span>
                                    <input
                                        type="password"
                                        id="password"
                                        placeholder="Enter your password"
                                        v-model="password"
                                    />
                                </div>
                            </div>

                            <div class="form-group">
                                <label for="confirmPassword"
                                    >Confirm Password</label
                                >
                                <div class="input-wrapper">
                                    <span class="input-icon">
                                        <i class="fas fa-lock"></i>
                                    </span>
                                    <input
                                        type="password"
                                        id="confirmPassword"
                                        placeholder="Confirm your password"
                                        v-model="confirmPassword"
                                    />
                                </div>
                            </div>
                        </div>

                        <!-- Right Column -->
                        <div class="form-column">
                            <div class="form-group">
                                <label for="username">Username</label>
                                <div class="input-wrapper">
                                    <span class="input-icon">
                                        <i class="fas fa-user"></i>
                                    </span>
                                    <input
                                        type="text"
                                        id="username"
                                        placeholder="Choose a username"
                                        v-model="username"
                                    />
                                </div>
                            </div>

                            <div class="form-group">
                                <label for="bio">Bio (optional)</label>
                                <div class="input-wrapper">
                                    <span class="input-icon">
                                        <i class="fas fa-info-circle"></i>
                                    </span>
                                    <input
                                        type="text"
                                        id="bio"
                                        placeholder="Tell us something about yourself"
                                        v-model="bio"
                                    />
                                </div>
                            </div>

                            <div class="form-group">
                                <label>Profile Picture (optional)</label>
                                <div class="profile-container">
                                    <div
                                        class="profile-preview-wrapper"
                                        @click="triggerFileInput"
                                    >
                                        <img
                                            :src="profilePreview"
                                            alt="Profile"
                                            class="profile-preview"
                                        />
                                        <div class="profile-overlay">
                                            <i class="fas fa-camera"></i>
                                        </div>
                                    </div>
                                    <div class="profile-controls">
                                        <input
                                            type="file"
                                            ref="fileInput"
                                            accept="image/*"
                                            @change="handleFileChange"
                                            class="file-input"
                                        />
                                        <button
                                            type="button"
                                            class="btn btn-outline btn-sm"
                                            @click="triggerFileInput"
                                        >
                                            <i
                                                class="fas fa-upload btn-icon"
                                            ></i>
                                            Choose Image
                                        </button>
                                        <button
                                            v-if="profileFile"
                                            type="button"
                                            class="btn btn-outline-danger btn-sm"
                                            @click="clearProfilePic"
                                        >
                                            <i
                                                class="fas fa-times btn-icon"
                                            ></i>
                                            Clear
                                        </button>
                                    </div>
                                    <div
                                        v-if="uploadingPic"
                                        class="upload-status"
                                    >
                                        <div class="spinner"></div>
                                        <span>Uploading image...</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <button
                        class="btn btn-primary btn-block"
                        type="submit"
                        :disabled="isLoading"
                        :class="{ 'btn-loading': isLoading }"
                    >
                        {{ isLoading ? "Creating account..." : "Sign Up" }}
                    </button>
                </form>

                <!-- GitHub Sign-in Button -->
                <div class="social-login">
                    <p class="social-divider"><span>Or sign up with</span></p>
                    <button 
                        type="button" 
                        class="btn-github" 
                        @click="signInWithGitHub"
                        :disabled="isLoading"
                    >
                        <i class="fab fa-github"></i>
                        <span>GitHub</span>
                    </button>
                </div>

                <div class="auth-footer">
                    <p>
                        Already have an account?
                        <router-link to="/">Login</router-link>
                    </p>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { db, auth, firebase } from "../firebase/config";
import { uploadToGitHub } from "@/composables/uploadToGitHub";

const email = ref("");
const password = ref("");
const username = ref("");
const bio = ref("");
const confirmPassword = ref("");
const router = useRouter();
const profileFile = ref(null);
const profileUrl = ref("");
const profilePreview = ref(require("@/assets/default_pfp.jpg"));
const fileInput = ref(null);
const uploadingPic = ref(false);
const isLoading = ref(false);

const alerting = ref({
    message: "",
    type: "", // 'alerting-success' | 'alerting-danger'
});

const triggerFileInput = () => {
    fileInput.value.click();
};

const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file (max 2MB, only images)
    if (file.size > 2 * 1024 * 1024) {
        alert("File size should not exceed 2MB");
        return;
    }

    if (!file.type.startsWith("image/")) {
        alert("Only image files are allowed");
        return;
    }

    profileFile.value = file;

    // Create a preview URL
    const reader = new FileReader();
    reader.onload = (e) => {
        profilePreview.value = e.target.result;
    };
    reader.readAsDataURL(file);
};

const clearProfilePic = () => {
    profileFile.value = null;
    profilePreview.value = require("@/assets/default_pfp.jpg");
    profileUrl.value = "";
    if (fileInput.value) {
        fileInput.value.value = "";
    }
};

const uploadProfilePic = async () => {
    if (!profileFile.value) return "";

    try {
        uploadingPic.value = true;

        // By this point, auth.currentUser should exist since we create the user first
        const userId = auth.currentUser.uid;
        const fileName = `profile_pics/${userId}_${profileFile.value.name}`;

        const url = await uploadToGitHub(profileFile.value, fileName);
        return url;
    } catch (error) {
        console.error("Error uploading profile picture:", error);
        alerting.value = {
            message:
                "Failed to upload profile picture, but signup will continue.",
            type: "alert-danger",
        };
        return "";
    } finally {
        uploadingPic.value = false;
    }
};

const signup = async () => {
    try {
        isLoading.value = true;

        // 1. Validate required fields
        if (!email.value || !password.value || !username.value) {
            alert("Email, password and username are required fields.");
            isLoading.value = false;
            return;
        }

        // 2. Check for matching passwords
        if (password.value !== confirmPassword.value) {
            alert("Passwords do not match.");
            isLoading.value = false;
            return;
        }

        // 3. Create user in Firebase Auth first
        const res = await auth.createUserWithEmailAndPassword(
            email.value,
            password.value
        );

        // 4. Set display name
        await res.user.updateProfile({
            displayName: username.value,
        });

        // 5. Upload profile picture if one was selected (AFTER user is created)
        let pfpUrl = require("@/assets/default_pfp.jpg"); // Default image
        if (profileFile.value) {
            try {
                pfpUrl = await uploadProfilePic();
                if (!pfpUrl) {
                    console.warn(
                        "Using default profile picture due to upload failure"
                    );
                    pfpUrl = require("@/assets/default_pfp.jpg");
                }
            } catch (uploadError) {
                console.error("Profile picture upload failed:", uploadError);
                // Continue with signup process even if upload fails
            }
        }

        // 6. Save extra user data in Firestore with the profile picture URL
        await addUser(pfpUrl);

        console.log("Signup successful:", res);
        router.push("/home");
    } catch (err) {
        console.log("Signup error:", err.message);
        alert("Signup failed: " + err.message);
    } finally {
        isLoading.value = false;
    }
};

// Add user to Firestore
const addUser = async (pfpUrl) => {
    const user = auth.currentUser;
    const uid = user.uid;
    const currentDate = new Date();

    // Create main user document
    const userData = {
        username: username.value,
        bio: bio.value || "",
        email: email.value,
        avatar: pfpUrl, // Changed from pfp to avatar to match schema
        createdAt: currentDate,
        following: [], // Initialize empty following array
    };

    // Create user document
    await db.collection("users").doc(uid).set(userData);

    // We don't need to create placeholder documents anymore
    // The subcollections will be created implicitly when the first document is added
    // For now, we just ensure the structure exists by creating the collections

    // Create an empty reference to each subcollection - this ensures the collections exist
    db.collection("users").doc(uid).collection("objectives");
    db.collection("users").doc(uid).collection("projects");
    db.collection("users").doc(uid).collection("skills");

    console.log(
        "User document created and subcollection structure initialized."
    );
};

// GitHub sign-in function
const signInWithGitHub = async () => {
    isLoading.value = true;
    try {
        const provider = new firebase.auth.GithubAuthProvider();
        // Request additional scopes if needed
        // provider.addScope('user:email');
        
        const result = await auth.signInWithPopup(provider);
        
        // Check if this is a new user
        const isNewUser = result.additionalUserInfo.isNewUser;
        
        if (isNewUser) {
            // Create a user document in Firestore
            const user = result.user;
            await db.collection("users").doc(user.uid).set({
                username: user.displayName || user.email.split('@')[0],
                email: user.email,
                avatar: user.photoURL || require("@/assets/default_pfp.jpg"),
                bio: "",
                createdAt: new Date(),
                following: [],
            });
            
            // Initialize subcollections
            db.collection("users").doc(user.uid).collection("objectives");
            db.collection("users").doc(user.uid).collection("projects");
            db.collection("users").doc(user.uid).collection("skills");
            
            console.log("New GitHub user added to Firestore");
        }
        
        console.log("GitHub login successful:", result.user);
        alerting.value = { 
            message: "Welcome! Signed in with GitHub", 
            type: "alert-success" 
        };
        router.push("/home");
    } catch (err) {
        console.error("GitHub auth error:", err);
        alerting.value = { 
            message: err.message, 
            type: "alert-danger" 
        };
    } finally {
        isLoading.value = false;
    }
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
    max-width: 800px;
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

.auth-form {
    margin-bottom: 1.5rem;
}

.form-columns {
    display: flex;
    flex-wrap: wrap;
    gap: 2rem;
    margin-bottom: 1rem;
}

.form-column {
    flex: 1;
    min-width: 250px;
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
    height: 48px;
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

.profile-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
}

.profile-preview-wrapper {
    position: relative;
    width: 120px;
    height: 120px;
    border-radius: 50%;
    overflow: hidden;
    cursor: pointer;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
    transition: box-shadow 0.3s ease;
}

.profile-preview-wrapper:hover {
    box-shadow: 0 8px 16px rgba(52, 152, 219, 0.5);
    transform: translateY(-3px);
}

.profile-preview {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border: 2px solid #3498db;
    background-color: #1a2233;
    transition: transform 0.3s ease;
}

.profile-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(13, 17, 23, 0.7);
    display: flex;
    justify-content: center;
    align-items: center;
    opacity: 0;
    transition: opacity 0.3s ease;
}

.profile-preview-wrapper:hover .profile-overlay {
    opacity: 1;
    background: rgba(13, 17, 23, 0.6);
}

.profile-preview-wrapper:hover .profile-preview {
    transform: scale(1.08);
    border-color: #2ecc71;
}

.profile-overlay i {
    color: #ffffff;
    font-size: 2rem;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
}

.profile-controls {
    display: flex;
    gap: 0.75rem;
    margin-top: 0.5rem;
}

.file-input {
    display: none;
}

.profile-button {
    padding: 0.5rem 1rem;
    border-radius: 6px;
    font-weight: 600;
    cursor: pointer;
    font-size: 0.9rem;
    transition: all 0.2s;
    border: 1px solid;
    position: relative;
    overflow: hidden;
}

.profile-button::after {
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

.profile-button:focus:not(:active)::after {
    animation: ripple 1s ease-out;
}

.profile-button-upload {
    background-color: transparent;
    color: #3498db;
    border-color: #3498db;
}

.profile-button-upload:hover {
    background-color: #3498db;
    color: #ffffff;
    transform: translateY(-3px);
    box-shadow: 0 6px 12px rgba(52, 152, 219, 0.4);
    letter-spacing: 0.5px;
}

.profile-button-upload:active {
    transform: translateY(0);
}

.profile-button-clear {
    background-color: transparent;
    color: #e74c3c;
    border-color: #e74c3c;
}

.profile-button-clear:hover {
    background-color: #e74c3c;
    color: #ffffff;
    transform: translateY(-3px);
    box-shadow: 0 6px 12px rgba(231, 76, 60, 0.4);
    letter-spacing: 0.5px;
}

.profile-button-clear:active {
    transform: translateY(0);
}

.upload-status {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #3498db;
    font-size: 0.9rem;
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

.spinner-large {
    width: 3.5rem;
    height: 3.5rem;
    border: 0.35rem solid rgba(52, 152, 219, 0.2);
    border-top-color: #3498db;
    border-radius: 50%;
    animation: spinner 0.8s linear infinite;
}

.loading-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(1, 5, 8, 0.9);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    backdrop-filter: blur(4px);
}

.loading-overlay p {
    margin-top: 1.25rem;
    font-size: 1.25rem;
    color: #ffffff;
    font-weight: 500;
    letter-spacing: 0.5px;
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

@media (max-width: 768px) {
    .form-columns {
        flex-direction: column;
        gap: 0;
    }

    .form-column {
        width: 100%;
    }

    .auth-card-wrapper {
        max-width: 500px;
    }
}

@media (max-width: 576px) {
    .auth-card {
        padding: 1.5rem;
    }

    .auth-header h1 {
        font-size: 1.75rem;
    }

    .profile-controls {
        flex-direction: column;
        width: 100%;
    }

    .profile-button {
        width: 100%;
    }
}

/* GitHub Sign-in button styles */
.social-login {
    margin-top: 1.5rem;
    text-align: center;
    max-width: 400px;
    margin-left: auto;
    margin-right: auto;
}

.social-divider {
    position: relative;
    margin: 1.5rem 0;
    color: #7d8590;
    font-size: 0.9rem;
    font-weight: 500;
}

.social-divider::before, 
.social-divider::after {
    content: "";
    position: absolute;
    top: 50%;
    width: calc(50% - 60px);
    height: 1px;
    background-color: #555d69;
}

.social-divider::before {
    left: 0;
}

.social-divider::after {
    right: 0;
}

.social-divider span {
    display: inline-block;
    padding: 0 15px;
    background-color: #0d1117;
}

.btn-github {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    max-width: 300px;
    height: 48px;
    background-color: #24292e;
    color: #ffffff;
    border: 1px solid #444;
    border-radius: 6px;
    padding: 0.875rem 1.5rem;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s;
    margin: 0 auto;
    gap: 12px;
}

.btn-github:hover {
    background-color: #333;
    transform: translateY(-3px);
    box-shadow: 0 6px 15px rgba(0, 0, 0, 0.4);
    border-color: #666;
}

.btn-github:active {
    transform: translateY(-1px);
    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.3);
}

.btn-github:disabled {
    background-color: #555d69;
    color: #bec3c9;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
    border-color: transparent;
}

.btn-github i {
    font-size: 1.3rem;
}

.logo-container {
    margin-bottom: 1.5rem;
    display: flex;
    justify-content: center;
}

.auth-logo {
    width: 120px;
    height: auto;
    filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));
    transition: transform 0.3s ease;
    animation: float 3s ease-in-out infinite;
}

.auth-logo:hover {
    transform: scale(1.05);
}

@keyframes float {
    0% { transform: translateY(0px); }
    50% { transform: translateY(-8px); }
    100% { transform: translateY(0px); }
}

.auth-subtitle {
    color: #a0aec0;
    font-size: 1.1rem;
    margin-top: 0.5rem;
    margin-bottom: 1.5rem;
}
</style>
