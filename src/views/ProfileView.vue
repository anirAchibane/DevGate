<template>
  <mini-navbar></mini-navbar>

  <div class="container-fluid mt-3">
    <div class="d-flex justify-content-center align-items-center">
      <router-link 
        v-if="isCurrent"
        :to="`/add/${auth.currentUser.uid}`" 
        class="btn btn-success"
      >
        What's New
      </router-link>
    </div>
  </div>

  <!-- Popup Modal for Followers/Following -->
  <div v-if="showFollowersPopup || showFollowingPopup" class="popup-overlay" @click.self="closePopup">
    <div class="popup-content">
      <div v-if="showFollowersPopup" class="followers">
        <h2>Followers</h2>
        <input class="form-control mb-2" type="text" placeholder="Search follower" v-model="followerFilter">
        <div v-for="follower in filteredFollowers" :key="follower.id" class="user-card d-flex align-items-center mb-2">
          <div class="user-avatar me-2">
            <img :src="follower.avatar || require('@/assets/default_pfp.jpg')" alt="User avatar" class="rounded-circle" width="40" height="40"/>
          </div>
          <p class="me-2 mb-0">{{ follower.username }}</p>
          <router-link
                        :to="{ name: 'Profil', params: { id: follower.id } }"
                        class="btn btn-sm btn-outline view-profile"
                    >
                        <i class="fas fa-user-circle"></i> View
                    </router-link>
        </div>
      </div>

      <div v-if="showFollowingPopup" class="following">
        <h2>Following</h2>
        <input class="form-control mb-2" type="text" placeholder="Search following" v-model="followingFilter">
        <div v-for="followedUser in filteredFollowing" :key="followedUser.id" class="user-card d-flex align-items-center mb-2">
          <div class="user-avatar me-2">
            <img :src="followedUser.avatar || require('@/assets/default_pfp.jpg')" alt="User avatar" class="rounded-circle" width="40" height="40"/>
          </div>
          <p class="me-2 mb-0">{{ followedUser.username }}</p>
          <router-link
                        :to="{ name: 'Profil', params: { id: followedUser.id } }"
                        class="btn btn-sm btn-outline view-profile"
                    >
                        <i class="fas fa-user-circle"></i> View
                    </router-link>
        </div>
      </div>
      <div class="text-end mt-3">
        <button @click="closePopup" class="btn btn-secondary">Close</button>
      </div>
    </div>
  </div>

  <div class="container-fluid py-4">
    <div class="main row">

      <!-- Sidebar -->
      <div class="sidebar">
        <div class="card text-white bg-dark mb-4">
          <div class="card-body text-center">
            <div class="profile-image">
                <img
                    :src="
                      userData.avatar ||
                      require('@/assets/default_pfp.jpg')
                    "
                    alt="Profile"
                />
            </div>
            <h3 class="username card-title">{{ userData.username }}</h3>
            <p v-if="userData.bio !== ''" class="card-text bio"> {{ userData.bio }}</p>
            <p v-else class="card-text bio"> no bio</p>
            <p class="card-text">{{ userData.email }}</p>
            <p class="card-text clickable" @click="showFollowersPopup = true">Followers: {{ followers.length }}</p>
            <p class="card-text clickable" @click="showFollowingPopup = true">Following: {{ following.length }}</p>


            <div class="mt-3">
              <button v-if="isCurrent" @click="settings()" class="btn btn-outline-light btn-sm">
                Settings
              </button>

              <button v-else-if="!isFollowing" @click="follow()" class="btn btn-primary btn-sm">
                Follow
              </button>

              <button v-else @click="unfollow()" class="btn btn-danger btn-sm">
                Unfollow
              </button>
            </div>
          </div>
        </div>

        <!-- Skills -->
        <div class="card text-white bg-dark">
          <div class="card-header">
            <h5>Skills</h5>
          </div>
          <div class="card-body">
            <div class="skills">
              <div v-for="(skill, index) in userSkills" :key="skill.id" class="skill mb-2">
                <template v-if="editingSkillIndex === index">
                  <input v-model="skill.name" class="form-control mb-1" placeholder="Skill name" />
                  <input v-model="skill.level" class="form-control mb-1" placeholder="Skill level" />
                  <button @click="saveSingleSkill(index)" class="btn btn-success btn-sm mt-1">Save</button>
                  <button @click="editingSkillIndex = null" class="btn btn-secondary btn-sm mt-1 ms-2">Cancel</button>
                </template>
                <template v-else>
                  <p class="mb-1 fw-bold">{{ skill.name }}</p>
                  <p class="mb-1">Level : {{ skill.level }}</p>
                  <p class="mb-1">Acquired at : {{ formatFirestoreTimestamp(skill.acquiredAt) }}</p>
                  <p class="mb-1">Updated at : {{ formatFirestoreTimestamp(skill.updatedAt) }}</p>
                  <button v-if="isCurrent" @click="editingSkillIndex = index" class="btn btn-outline-light btn-sm mt-1">Edit</button>
                </template>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Mainbar -->
      <div class="mainbar">

        <!-- Projects -->
        <div class="card text-white bg-dark mb-4">
          <div class="card-header">
            <h5>Projects</h5>
          </div>
          <div class="card-body">
            <div class="projects">
              <div v-for="(project, index) in userProjects" :key="project.id" class="project mb-3 p-3 border rounded bg-secondary">
                <template v-if="editingProjectIndex === index">
                  <input v-model="project.title" class="form-control mb-1" placeholder="Title" />
                  <textarea v-model="project.description" class="form-control mb-1" placeholder="Description"></textarea>
                  <input v-model="project.githubURL" class="form-control mb-1" placeholder="GitHub URL" />
                  <select v-model="project.visibility" class="form-select mb-1">
                    <option :value="true">Public</option>
                    <option :value="false">Private</option>
                  </select>
                  <button @click="saveSingleProject(index)" class="btn btn-success btn-sm mt-1">Save</button>
                  <button @click="editingProjectIndex = null" class="btn btn-secondary btn-sm mt-1 ms-2">Cancel</button>
                </template>
                <template v-else>
                  <p class="mb-1 fw-bold">{{ project.title }}</p>
                  <p class="mb-1">Description: {{ project.description || 'no description' }}</p>
                  <p class="mb-1">
                    Github URL : <a :href="project.githubURL" target="_blank">{{ project.githubURL }}</a>
                  </p>
                  <p class="mb-1">Tags : {{ project.tags }}</p>
                  <p class="mb-0">Visibility : {{ project.visibility ? 'Public' : 'Private' }}</p>
                  <p class="mb-0">Created at : {{ formatFirestoreTimestamp(project.createdAt) }}</p>
                  <button v-if="isCurrent" @click="editingProjectIndex = index" class="btn btn-outline-light btn-sm mt-1">Edit</button>
                </template>
              </div>
            </div>
          </div>
        </div>

        <!-- Objectives -->
        <div class="card text-white bg-dark">
          <div class="card-header">
            <h5>Objectives</h5>
          </div>
          <div class="card-body">
            <div class="objectives">
              <div v-for="(objective, index) in userObjectives" :key="objective.id" class="objective mb-3 p-3 border rounded bg-secondary">
                <template v-if="editingObjectiveIndex === index">
                  <input v-model="objective.name" class="form-control mb-1" placeholder="Objective name" />
                  <textarea v-model="objective.description" class="form-control mb-1" placeholder="Description"></textarea>
                  <input v-model="objective.type" class="form-control mb-1" placeholder="Type" />
                  <select v-model="objective.visibility" class="form-select mb-1">
                    <option :value="true">Public</option>
                    <option :value="false">Private</option>
                  </select>
                  <button @click="saveSingleObjective(index)" class="btn btn-success btn-sm mt-1">Save</button>
                  <button @click="editingObjectiveIndex = null" class="btn btn-secondary btn-sm mt-1 ms-2">Cancel</button>
                </template>
                <template v-else>
                  <p class="mb-1 fw-bold">{{ objective.name }}</p>
                  <p class="mb-1">Description: {{ objective.description || 'no description' }}</p>
                  <p class="mb-1">Type: {{ objective.type }}</p>
                  <p class="mb-1">Language: {{ objective.language }}</p>
                  <p class="mb-1">Visibility : {{ objective.visibility ? 'Public' : 'Private' }}</p>
                  <button v-if="isCurrent" @click="editingObjectiveIndex = index" class="btn btn-outline-light btn-sm mt-1">Edit</button>
                </template>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  </div>
</template>

<script setup>
import MiniNavbar from "@/components/MiniNavbar.vue";
import {ref } from "vue";
import { db, auth  } from "@/firebase/config.js";
import { useRoute, useRouter  } from "vue-router";
import { onMounted , computed , watch } from "vue";
import { getFollowers , getFollowing } from "@/composables/userFollow";
 

const route = useRoute();
const router = useRouter();

const userId = ref(route.params.id);                         // Get the userId from the route params 
const isCurrent = computed(() => userId.value === auth.currentUser.uid);    // Check if the userId is the same as the current user's id
const isFollowing = ref(false);                         // Check if the current user is following the userId

const userData = ref({});    // stores current user's data
const userProjects = ref([]);   // stores user's projects ( all projects if isCurrent(), else only public projects)
const userObjectives = ref([]); // stores user's objectives
const userSkills = ref([]);     // stores user's skills
const followers = ref([]);
const followersLoading = ref(true);
const followersError = ref(null);

const following = ref([]);
const followingLoading = ref(true);
const followingError = ref(null);



const editingSkillIndex = ref(null);
const editingProjectIndex = ref(null);
const editingObjectiveIndex = ref(null);




watch(() => route.params.id, (newId) => {
  userId.value = newId;
  showFollowersPopup.value = false;
  showFollowingPopup.value = false;
  loadProfileData(); // your logic to refetch all user data
});

const loadProfileData = async () => {
  try {
    const userRef = db.collection("users").doc(userId.value);

    const doc = await userRef.get();
    if (doc.exists) {
      userData.value = doc.data();

      const [projectsSnap, objectivesSnap, skillsSnap] = await Promise.all([
        userRef.collection("projects").get(),
        userRef.collection("objectives").get(),
        userRef.collection("skills").get(),
      ]);

      userProjects.value = [];
      projectsSnap.forEach((doc) => {
        const project = doc.data();
        project.id = doc.id;
        if (isCurrent.value || project.isPublic) {
          userProjects.value.push(project);
        }
      });

      userObjectives.value = [];
      objectivesSnap.forEach((doc) => {
        const objective = doc.data();
        objective.id = doc.id;
        userObjectives.value.push(objective);
      });

      userSkills.value = [];
      skillsSnap.forEach((doc) => {
        const skill = doc.data();
        skill.id = doc.id;
        userSkills.value.push(skill);
      });

    } else {
      console.log("No such document!");
    }

    if (!isCurrent.value) {
      const currentUserRef = db.collection("users").doc(auth.currentUser.uid);
      const currentDoc = await currentUserRef.get();
      if (currentDoc.exists) {
        const followingList = currentDoc.data().following;
        isFollowing.value = followingList.includes(userId.value);
      }
    }

    const result = await getFollowers(userId.value);
    followers.value = result.followers.value;
    followersLoading.value = result.loading.value;
    followersError.value = result.error.value;

    const result2 = await getFollowing(userId.value);
    following.value = result2.following.value;
    followingLoading.value = result2.loading.value;
    followingError.value = result2.error.value;

  } catch (error) {
    console.error("Error fetching user data:", error);
  }
};



onMounted(() => {
   loadProfileData();
});


const showFollowersPopup = ref(false);
const showFollowingPopup = ref(false);
const followerFilter = ref('');
const followingFilter = ref('');

const filteredFollowers = computed(() => {
  return followers.value.filter(f =>
    f.username.toLowerCase().includes(followerFilter.value.toLowerCase())
  );
});

const filteredFollowing = computed(() => {
  return following.value.filter(f =>
    f.username.toLowerCase().includes(followingFilter.value.toLowerCase())
  );
});

function closePopup() {
  showFollowersPopup.value = false;
  showFollowingPopup.value = false;
}


const saveSingleSkill = async (index) => {
  const skill = userSkills.value[index];
  const userRef = db.collection("users").doc(auth.currentUser.uid);
  const skillsCollection = userRef.collection("skills");

  if (skill.id) {
    await skillsCollection.doc(skill.id).update({
      name: skill.name,
      level: skill.level,
      updatedAt: new Date()
    });
  }

  editingSkillIndex.value = null;
};

const saveSingleProject = async (index) => {
  const project = userProjects.value[index];
  const userRef = db.collection("users").doc(auth.currentUser.uid);
  const projectsCollection = userRef.collection("projects");

  if (project.id) {
    await projectsCollection.doc(project.id).update({
      title: project.title,
      description: project.description,
      githubURL: project.githubURL,
      visibility: project.visibility
    });
  }

  editingProjectIndex.value = null;
};

const saveSingleObjective = async (index) => {
  const objective = userObjectives.value[index];
  const userRef = db.collection("users").doc(auth.currentUser.uid);
  const objectivesCollection = userRef.collection("objectives");

  if (objective.id) {
    await objectivesCollection.doc(objective.id).update({
      name: objective.name,
      description: objective.description,
      type: objective.type,
      visibility: objective.visibility
    });
  }

  editingObjectiveIndex.value = null;
};



const settings = () => {
    // Redirect to the settings page
    router.push("/settings");
}

const follow = async () => {
      try{
        let followList = [];
        await db.collection("users").doc(auth.currentUser.uid).get().then((doc) =>{
            if(doc.exists){
                followList = doc.data().following; 
            } else {
                console.log("No such document!");
            }
        })

        followList.push(userId.value); // Add the userId to the following list
        await db.collection("users").doc(auth.currentUser.uid).update({
            following: followList
        })

        isFollowing.value = true; // Update the isFollowing state

      } catch(error){
        console.error("Error following user:", error);
      }
}

const unfollow = async () => {
      try{
            const followList = ref([]);
            await db.collection("users").doc(auth.currentUser.uid).get().then((doc) =>{
                if(doc.exists){
                    followList.value = doc.data().following; 
                } else {
                    console.log("No such document!");
                }
            })

            followList.value = followList.value.filter((id) => id !== userId.value);

            await db.collection("users").doc(auth.currentUser.uid).update({
                following: followList.value
            })

            isFollowing.value = false; // Update the isFollowing state

          } catch(error){
            console.error("Error following user:", error);
          }
}

function formatFirestoreTimestamp(timestamp) {
    if (!timestamp) return "N/A";

    // Handle both Firestore Timestamp object or plain object
    let date;
    if (timestamp.toDate) {
        // If it's an actual Firestore Timestamp object
        date = timestamp.toDate();
    } else if (timestamp.seconds !== undefined) {
        // If it's a plain object { seconds: ..., nanoseconds: ... }
        date = new Date(timestamp.seconds * 1000);
    } else {
        return "Invalid Timestamp";
    }

    // Format nicely
    return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}


</script>

<style>
html,
body,
#app {
    color: white;
    height: 100%;
    margin: 0;
    padding: 0;
    background-color: #0d1117;
}

.main {
    display: flex;
    flex-direction: row;
    gap: 20px; /* you can adjust */
    padding: 20px;
}

/* REMOVE display: flex and flex-direction from .main */

.sidebar {
    flex: 0 0 25%;
    padding: 20px;
    border-radius: 10px;
    border: 1px solid #3D434C;
}
.bio {
    margin-top: 0;
    margin-bottom: 20px;
    color: #a0aec0;
    font-size: 14px;
    font-style: italic;
}

.mainbar {
    flex: 1; /* take the rest */
    padding: 20px;
    border-radius: 10px;
    border: 1px solid #3D434C;
}

.popup-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  z-index: 999;
  display: flex;
  justify-content: center;
  align-items: center;
}

.popup-content {
  background: #161b22;
  padding: 20px;
  border-radius: 10px;
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  overflow-y: auto;
}

.clickable {
  cursor: pointer;
  text-decoration: underline;
}
</style>
