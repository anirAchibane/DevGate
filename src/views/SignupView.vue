<template>
    <div class="container">
        <!-- Loading overlay -->
        <div v-if="isLoading" class="loading-overlay">
            <div class="spinner"></div>
            <p>Creating your account...</p>
        </div>

        <h1 class="mb-4">Signup</h1>
        <div class="form-group center mt-3">
            <label for="email">Email</label>
            <input
                v-model="email"
                type="email"
                class="form-control"
                placeholder="Email"
            />
        </div>
        <div class="form-group center mt-4">
            <label for="password">Password</label>
            <input
                v-model="password"
                type="password"
                class="form-control"
                placeholder="Password"
            />
        </div>

        <div class="form-group center mt-4">
            <label for="password">Confirm Password</label>
            <input
                v-model="confirmPassword"
                type="password"
                class="form-control"
                placeholder="Confirm Password"
            />
        </div>

        <div class="form-group center mt-4">
            <label for="password">Username</label>
            <input
                v-model="username"
                type="text"
                class="form-control"
                placeholder="Username"
            />
        </div>

        <div class="form-group mt-3">
            <label>Bio (optional):</label>
            <input
                v-model="bio"
                type="text"
                class="form-control"
                placeholder="Tell us something about yourself"
            />
        </div>

        <div class="form-group mt-3">
            <label>Profile Picture (optional):</label>
            <div class="profile-pic-container">
                <img
                    :src="profilePreview"
                    alt="Profile"
                    class="profile-preview"
                />
                <div class="profile-pic-controls">
                    <input
                        type="file"
                        ref="fileInput"
                        accept="image/*"
                        @change="handleFileChange"
                        class="file-input"
                    />
                    <button
                        @click="triggerFileInput"
                        class="btn btn-outline-secondary"
                    >
                        Choose Image
                    </button>
                    <button
                        v-if="profileFile"
                        @click="clearProfilePic"
                        class="btn btn-outline-danger ml-2"
                    >
                        Clear
                    </button>
                </div>
                <div v-if="uploadingPic" class="mt-2">
                    <div
                        class="spinner-border spinner-border-sm text-primary"
                        role="status"
                    >
                        <span class="visually-hidden">Loading...</span>
                    </div>
                    <span class="ml-2">Uploading image...</span>
                </div>
            </div>
        </div>

        <button @click="signup" class="btn btn-primary mt-3">Signup</button>
        <div class="mt-4 text-center">
            <p class="mb-0">
                Already have an account?
                <router-link to="/" class="fw-medium login">Login</router-link>
            </p>
        </div>
    </div>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { db, auth } from "../firebase/config";
import { uploadToGitHub } from "@/composables/uploadToGitHub";

const email = ref("");
const password = ref("");
const username = ref("");
const bio = ref("");
const confirmPassword = ref("");
const router = useRouter();
const profileFile = ref(null);
const profileUrl = ref("");
const profilePreview = ref("/src/assets/pfp_default.jpg");
const fileInput = ref(null);
const uploadingPic = ref(false);
const isLoading = ref(false);

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
    profilePreview.value = "";
    profileUrl.value = "";
    if (fileInput.value) {
        fileInput.value.value = "";
    }
};

const uploadProfilePic = async () => {
    if (!profileFile.value) return "";

    try {
        uploadingPic.value = true;
        const timestamp = new Date().getTime();
        const fileName = `signup_${timestamp}_${profileFile.value.name}`;
        const url = await uploadToGitHub(profileFile.value, fileName);
        return url;
    } catch (error) {
        console.error("Error uploading profile picture:", error);
        alert("Failed to upload profile picture, but signup will continue.");
        return "";
    } finally {
        uploadingPic.value = false;
    }
};

const signup = async () => {
    try {
        isLoading.value = true;

        // 1. Check for UM6P domain
        if (!email.value.endsWith("@um6p.ma")) {
            alert("You must use a UM6P email address (e.g., name@um6p.ma).");
            return;
        }

        // 2. Check for matching passwords
        if (password.value !== confirmPassword.value) {
            alert("Passwords do not match.");
            return;
        }

        // 3. Upload profile picture if one was selected
        let pfpUrl = profilePreview.value;
        if (profileFile.value) {
            pfpUrl = await uploadProfilePic();
        }

        // 4. Create user in Firebase Auth
        const res = await auth.createUserWithEmailAndPassword(
            email.value,
            password.value
        );

        // 5. Save extra user data in Firestore with the profile picture URL
        await addUser(pfpUrl);

        // 6. Set display name
        await res.user.updateProfile({
            displayName: username.value,
        });

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

    const userData = {
        username: username.value,
        bio: bio.value,
        email: email.value,
        role: "user",
        status: true,
        pfp: pfpUrl,
        lastOnline: new Date(),
    };

    await db.collection("users").doc(uid).set(userData);
    console.log("User added to database.");
};
</script>

<style scoped>
.container {
    max-width: 600px;
    margin: 0 auto;
    padding: 2rem;
    background-color: #ffffff;
    border-radius: 0.75rem;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

h1 {
    color: #284b63;
    text-align: center;
    font-weight: 600;
}

.form-group {
    margin-bottom: 1rem;
}

.form-group label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
    color: #353535;
}

.form-control {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #d9d9d9;
    border-radius: 0.5rem;
    background-color: #ffffff;
    color: #353535;
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.form-control:focus {
    border-color: #3c6e71;
    box-shadow: 0 0 0 0.25rem rgba(60, 110, 113, 0.25);
    outline: none;
}

.profile-pic-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 1rem;
}

.profile-preview {
    width: 120px;
    height: 120px;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid #d9d9d9;
}

.profile-pic-controls {
    display: flex;
    gap: 0.5rem;
}

.file-input {
    display: none;
}

.btn {
    padding: 0.5rem 1rem;
    border-radius: 0.5rem;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s ease, border-color 0.2s ease;
}

.btn-primary {
    background-color: #284b63;
    border-color: #284b63;
    color: #ffffff;
    width: 100%;
}

.btn-primary:hover {
    background-color: #3c6e71;
    border-color: #3c6e71;
}

.btn-secondary {
    background-color: #d9d9d9;
    border-color: #d9d9d9;
    color: #353535;
    width: 100%;
}

.btn-secondary:hover {
    background-color: #353535;
    border-color: #353535;
    color: #ffffff;
}

.btn-outline-secondary {
    background-color: transparent;
    border: 1px solid #d9d9d9;
    color: #353535;
}

.btn-outline-secondary:hover {
    background-color: #d9d9d9;
    color: #353535;
}

.btn-outline-danger {
    background-color: transparent;
    border: 1px solid #284b63;
    color: #284b63;
}

.btn-outline-danger:hover {
    background-color: rgba(40, 75, 99, 0.1);
}

.spinner-border-sm {
    width: 1rem;
    height: 1rem;
    border: 2px solid #d9d9d9;
    border-top-color: #284b63;
    border-radius: 50%;
    animation: spinner 0.8s linear infinite;
}

@keyframes spinner {
    to {
        transform: rotate(360deg);
    }
}

.ml-2 {
    margin-left: 0.5rem;
}

.mt-2 {
    margin-top: 0.5rem;
}

.loading-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(255, 255, 255, 0.8);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    z-index: 1000;
}

.loading-overlay .spinner {
    width: 3rem;
    height: 3rem;
    border: 0.5rem solid #d9d9d9;
    border-top-color: #284b63;
    border-radius: 50%;
    animation: spinner 0.8s linear infinite;
}

.loading-overlay p {
    margin-top: 1rem;
    font-size: 1.25rem;
    color: #284b63;
}

.login {
    color: #3c6e71;
    text-decoration: none;
    font-weight: 600;
    transition: color 0.2s ease;
}

.login:hover {
    color: #284b63;
    text-decoration: underline;
}
</style>
