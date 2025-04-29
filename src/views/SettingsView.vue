<template>
    <mini-navbar></mini-navbar>
    <div class="main">
        <div class="profile">
            <h2>Profile Settings</h2>
            <div class="user-form d-flex flex-column">

                <div class="user-form-row">
                    <label>Profile Picture:</label>
                    <div class="profile-container">
                        <div class="profile-preview-wrapper" @click="triggerFileInput">
                            <img :src="profilePreview" alt="Profile" class="profile-preview" />
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
                                <i class="fas fa-upload btn-icon"></i>
                                Choose Image
                            </button>
                            <button
                                v-if="profileFile"
                                type="button"
                                class="btn btn-outline-danger btn-sm"
                                @click="clearProfilePic"
                            >
                                <i class="fas fa-times btn-icon"></i>
                                Clear
                            </button>
                        </div>
                        <div v-if="uploadingPic" class="upload-status">
                            <div class="spinner"></div>
                            <span>Uploading image...</span>
                        </div>
                    </div>
                </div>

                <div class="user-form-row">
                    <label for="username">Username:</label>
                    <input v-model="username" type="text" id="username" />
                </div>
                <div class="user-form-row">
                    <label for="bio">Bio:</label>
                    <textarea id="bio" v-model="bio"></textarea>
                </div>
                <div class="user-form-row">
                    <label for="email">Email:</label>
                    <input type="email" id="email" v-model="email" />
                </div>
                <div class="d-flex flex-column align-items-center gap-2">
                <button @click="updateProfile" class="btn btn-sm btn-success w-auto">Update Profile</button>
                <button @click="deleteAccount" class="btn btn-sm btn-danger w-auto">Delete Account</button>
                <button @click="deleteAll" class="btn btn-sm btn-danger w-auto">Delete All Data</button>
                </div>

            </div>
        </div>

        <div class="followers">
            <h2>Followers</h2>
            <input class="search" type="text" placeholder="Search follower" v-model="followerFilter">
            <div v-for="follower in filteredFollowers" :key="follower.id" class="user-card d-flex flex-row">
                    <div class="user-avatar">
                        <img
                            :src="
                                follower.avatar ||
                                require('@/assets/default_pfp.jpg')
                            "
                            alt="User avatar"
                        />
                    </div>
                    <p>{{ follower.username }}</p>
                    <router-link
                        :to="{ name: 'Profil', params: { id: follower.id } }"
                        class="btn btn-sm btn-outline view-profile"
                    >
                        <i class="fas fa-user-circle"></i> View
                    </router-link>
            </div>
        </div>

        <div class="following d-flex flex-column">
            <h2>Following</h2>
            <input class="search" type="text" placeholder="Search following" v-model="followingFilter">
            <div v-for="followedUser in  filteredFollowing" :key="followedUser.id" class="user-card d-flex flex-row">
                <div class="user-avatar">
                        <img
                            :src="
                                followedUser.avatar ||
                                require('@/assets/default_pfp.jpg')
                            "
                            alt="User avatar"
                        />
                    </div>
                    <p>{{ followedUser.username }}</p>
                    <router-link
                        :to="{ name: 'Profil', params: { id: followedUser.id } }"
                        class="btn btn-sm btn-outline view-profile"
                    >
                        <i class="fas fa-user-circle"></i> View
                    </router-link>
            </div>
        </div>
    </div>
</template>

<script setup>
import MiniNavbar from '@/components/MiniNavbar.vue';
import { onMounted, computed } from 'vue';
import { ref } from 'vue';
import { db, auth } from '@/firebase/config';
import { getFollowers, getFollowing } from '@/composables/userFollow';
import { useRouter } from 'vue-router';
import { uploadToGitHub } from "@/composables/uploadToGitHub";

const router = useRouter();

let followers = ref([]);
let following = ref([]);

const username = ref('');
const bio = ref('');
const email = ref('');
// Profile picture related refs
const profileFile = ref(null);
const profilePreview = ref(require("@/assets/default_pfp.jpg"));
const fileInput = ref(null);
const uploadingPic = ref(false);
const currentAvatar = ref('');

const followerFilter = ref("");
const followingFilter = ref("");

onMounted(async () => { 
  try {
    const userRef = db.collection("users").doc(auth.currentUser.uid);
    const doc = await userRef.get();   

    if (doc.exists) {
      // Get user data
      username.value = doc.data().username || '';
      bio.value = doc.data().bio || '';
      email.value = doc.data().email || '';
      
      // Set current avatar and preview if available
      if (doc.data().avatar) {
        currentAvatar.value = doc.data().avatar;
        profilePreview.value = doc.data().avatar;
      }
    } else {
      console.log("No such document!");
    }

    // Get followers and following
    const { followers: userFollowers } = await getFollowers(auth.currentUser.uid);
    const { following: userFollowing } = await getFollowing(auth.currentUser.uid, true);
    followers.value = userFollowers.value;
    following.value = userFollowing.value;

  } catch (error) {
    console.error("Error fetching user data:", error);
  }

  console.log("followers: ",followers.value);
  console.log("following: ",following.value);

});

const updateProfile = async () => {
    if (confirm("Are you sure you want to update your profile?")) {
        try {
            // Show loading state
            uploadingPic.value = profileFile.value !== null;
            
            // If there's a new profile picture, upload it first
            let avatarUrl = currentAvatar.value;
            if (profileFile.value) {
                avatarUrl = await uploadProfilePic();
            }
            
            const userRef = db.collection("users").doc(auth.currentUser.uid);
            const updatedData = {
                username: username.value,
                bio: bio.value,
                email: email.value,
                avatar: avatarUrl
            };
            
            await userRef.update(updatedData);
            
            // Update currentAvatar with the new URL
            currentAvatar.value = avatarUrl;
            
            alert("Profile updated successfully!!");
            router.push("/profil/" + auth.currentUser.uid);
            console.log("Profile updated successfully");
        } catch (error) {
            alert("Error updating profile: " + error.message);
            console.error("Error updating profile:", error);
        } finally {
            uploadingPic.value = false;
        }
    }
};

const deleteAccount = async () => {
    if (confirm("Are you sure you want to delete your account?")) {
        try {
            const userRef = db.collection("users").doc(auth.currentUser.uid);
            await userRef.delete();
            alert("Account deleted successfully!!");

            await auth.signOut();
            router.push("/");
            console.log("Account deleted successfully");
        } catch (error) {
            alert("Error deleting account: " + error.message);
            console.error("Error deleting account:", error);
        }
    }
};

const deleteAll = async () => { //delete all user content
    if (confirm("Are you sure you want to delete all your data?")) {
        try {
            const userRef = db.collection("users").doc(auth.currentUser.uid);

            const deleteCollection = async (coll) => {
                const snapshot = await userRef.collection(coll).get();
                const batch = db.batch();
                snapshot.forEach(doc => {
                    batch.delete(doc.ref);
                });
                await batch.commit();
            };

            await deleteCollection("projects");
            await deleteCollection("objectives");
            await deleteCollection("skills");

            alert("All Data deleted successfully!!");
        } catch (error) {
            alert("Error deleting all data: " + error.message);
            console.error("Error deleting all data:", error);
        }
    }
};

// Profile picture handling functions
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
    profilePreview.value = currentAvatar.value || require("@/assets/default_pfp.jpg");
    if (fileInput.value) {
        fileInput.value.value = "";
    }
};

const uploadProfilePic = async () => {
    if (!profileFile.value) return currentAvatar.value;

    try {
        uploadingPic.value = true;

        // Upload with user id in filename
        const userId = auth.currentUser.uid;
        const fileName = `profile_pics/${userId}_${Date.now()}_${profileFile.value.name}`;

        const url = await uploadToGitHub(profileFile.value, fileName);
        return url;
    } catch (error) {
        console.error("Error uploading profile picture:", error);
        alert("Failed to upload profile picture, using previous avatar.");
        return currentAvatar.value;
    } finally {
        uploadingPic.value = false;
    }
};

const filteredFollowers = computed(() => {
    return followers.value.filter(follower => {
        return follower.username.toLowerCase().includes(followerFilter.value.toLowerCase())
               || followerFilter.value === "";
    });
    
});

const filteredFollowing = computed(() => {
    return following.value.filter(followedUser => {
        return followedUser.username.toLowerCase().includes(followingFilter.value.toLowerCase())
               || followingFilter.value === "";
    });

});

</script>

<style scoped>
.main{
    width:100%;
    justify-self: center; align-self: center;
    display: flex;
    padding: 20px;
    background-color: #0D1117;
}

.profile{
    display: flex;
    flex-direction: column;
    gap: 16px;
    background-color: #0D1117;
    padding: 16px;
    border-radius: 8px;
    border: 1px solid #555d69;
}
.user-form-row {
    margin:8px;
}

.profile button {
    margin: 8px;
}

.user-form-row input, .user-form-row textarea {
    width: 400px;
    padding: 8px;
    border-radius: 4px;
    border: 1px solid #555d69;
    background-color: #0D1117;
    color: #fff;
}
.user-form-row{
    gap:20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

/* Profile picture styles */
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

.upload-status {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #3498db;
    font-size: 0.9rem;
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

.user-card {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px;
    background-color: #1a2233;
    border-radius: 8px;
    border: 1px solid #555d69;
    transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.user-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.3);
    border-color: #3498db;
}

.user-avatar {
    margin-right: 16px;
    flex-shrink: 0;
}

.user-avatar img {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid #3498db;
    background-color: #0d1117;
}

.followers, .following{
    width:100%;
    padding: 16px;
    gap:16px;
    display: flex;
    flex-direction: column;
    background-color: #0D1117;
    border-radius: 8px;
    border: 1px solid #555d69;
}

.search {
    width: 100%;
    padding: 8px;
    border-radius: 4px;
    border: 1px solid #555d69;
    background-color: #0D1117;
    color: #fff;
    margin-bottom: 16px;
}
</style>