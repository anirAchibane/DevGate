<template>
    <mini-navbar></mini-navbar>
    <div class="main">
        <div class="profile">
            <h2>Profile Settings</h2>
            <div class="user-form d-flex flex-column">

                <div class="user-form-row">

                    <!-- Add Avatar editor inside this div !!! -->

                </div>

                <div   class="user-form-row">
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

const router = useRouter();

let followers = ref([]);
let following = ref([]);

const username = ref('');
const bio = ref('');
const email = ref('');

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

    } else {
      console.log("No such document!");
    }

    // Get followers and following
    const { followers: userFollowers } = await getFollowers(auth.currentUser.uid);
    const { following: userFollowing } = await getFollowing(auth.currentUser.uid);

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
            const userRef = db.collection("users").doc(auth.currentUser.uid);
            const updatedData = {
                username: username.value,
                bio: bio.value,
                email: email.value
            };
            alert("Profile updated successfully!!");
            router.push("/profil/" + auth.currentUser.uid);
            await userRef.update(updatedData);
            console.log("Profile updated successfully");
        } catch (error) {
            alert("Error updating profile: " + error.message);
            console.error("Error updating profile:", error);
        }
    }

};

const deleteAccount = async () => {
    if (confirm("Are you sure you want to delete your account?")) {
        try {
            const userRef = db.collection("users").doc(auth.currentUser.uid);
            await userRef.delete();
            alert("Account deleted successfully!!");
            router.push("/");
            console.log("Account deleted successfully");
        } catch (error) {
            alert("Error deleting account: " + error.message);
            console.error("Error deleting account:", error);
        }
    }
};

const deleteAll = async () => {

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

<style>
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