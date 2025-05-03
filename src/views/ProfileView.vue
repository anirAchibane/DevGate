<template>
  <mini-navbar></mini-navbar>
  <div v-if="!isBanned">
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
  <div class="choice d-flex justify-content-center align-items-center mt-3">
    <button class="btn btn-sm btn-outline" @click="switchTab('Profile')">Profile</button>
    <button class="btn btn-sm btn-outline" @click="switchTab('Timeline')">Timeline</button>
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


            <div class="mt-3 d-flex gap-2 justify-content-center">
              <button v-if="isCurrent" @click="settings()" class="btn btn-outline-light btn-sm">
                Settings
              </button>

              <button v-else-if="!isFollowing" @click="follow()" class="btn btn-primary btn-sm">
                Follow
              </button>

              <button v-else @click="unfollow()" class="btn btn-danger btn-sm">
                Unfollow
              </button>

              <router-link :to="{
                                path: '/newreport',
                                query: { targetID: userId,
                                         targetType: 'user',
                                         targetTitle: userData.username,
                                         targetOwner: userId
                                },
                            }">
                  <button v-if="!isCurrent" class="btn btn-outline-light">
                    Report
                  </button>
              </router-link>

            </div>
          </div>
        </div>

        <!-- Skills -->
        <div class="card text-white bg-dark mb-4 edit-card">
          <div class="card-header">
            <h5>Skills</h5>
          </div>
          <div class="card-body">
            <div class="skills">
              <div v-for="(skill, index) in userSkills" :key="skill.id" class="skill mb-2">
                <template v-if="editingSkillIndex === index">
                  <div class="edit-skill-form p-3 bg-dark text-white rounded shadow-sm mb-3">
                    <div class="mb-2">
                      <label class="form-label small text-white fw-bold">Skill Name</label>
                      <input v-model="skill.name" class="form-control mb-1 input-dark" placeholder="Skill name" />
                    </div>
                    
                    <div class="mb-3">
                      <label class="form-label small text-white fw-bold">Skill Level</label>
                      <input v-model="skill.level" class="form-control mb-1 input-dark" placeholder="Skill level" />
                    </div>
                    
                    <div class="d-flex gap-2">
                      <button @click="saveSingleSkill(index)" class="btn btn-success">
                        <i class="bi bi-check-lg me-1"></i> Save
                      </button>
                      <button @click="deleteSkill(skill.id)" class="btn btn-danger">
                        <i class="bi bi-trash me-1"></i> Delete
                      </button>
                      <button @click="editingSkillIndex = null" class="btn btn-secondary">
                        Cancel
                      </button>
                    </div>
                  </div>
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
      <div class="mainbar" v-if="activeTab === 'Profile'">

        <!-- Projects -->
        <div class="card text-white bg-dark mb-4 edit-card">
          <div class="card-header">
            <h5>Projects</h5>
          </div>
          <div class="card-body">
            <div class="projects">
              <div v-for="(project, index) in userProjects" :key="project.id" class="project mb-3 p-3 border rounded bg-secondary">
                <template v-if="editingProjectIndex === index">
                  <div class="edit-project-form p-3 bg-dark text-white rounded shadow-sm mb-3">
                    <div class="mb-2">
                      <label class=" form-label small text-white fw-bold ">Project Title</label>
                      <input v-model="project.title" class="form-control mb-1 input-dark" placeholder="Title" />
                    </div>
                    
                    <div class="mb-2">
                      <label class="form-label small text-white fw-bold">Description</label>
                      <textarea v-model="project.description" class="form-control mb-1 input-dark" 
                                placeholder="Description" rows="3"></textarea>
                    </div>
                    
                    <div class="mb-2">
                      <label class="form-label small text-white fw-bold">GitHub URL</label>
                      <input v-model="project.githubURL" class="form-control mb-1 input-dark" placeholder="GitHub URL" />
                    </div>
                    
                    <div class="mb-3">
                      <label class="form-label small text-white fw-bold">Visibility</label>
                      <select v-model="project.visibility" class="form-select mb-1 input-dark">
                        <option :value="true">Public</option>
                        <option :value="false">Private</option>
                      </select>
                    </div>
                    
                    <div class="d-flex gap-2">
                      <button @click="saveSingleProject(index)" class="btn btn-success">
                        <i class="bi bi-check-lg me-1"></i> Save
                      </button>
                      <button @click="deleteProject(project.id)" class="btn btn-danger">
                        <i class="bi bi-trash me-1"></i> Delete
                      </button>
                      <button @click="editingProjectIndex = null" class="btn btn-secondary">
                        Cancel
                      </button>
                    </div>
                  </div>
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

                  <router-link v-if="userId !== auth.currentUser.uid" :to="{
                                path: '/newreport',
                                query: { targetID: project.id,
                                         targetType: 'project',
                                         targetTitle: project.title,
                                         targetOwner: userId
                                },
                            }">
                            <button v-if="!isCurrent" class="btn btn-outline-light">
                                Report
                            </button>
                    </router-link>
                  
                </template>
              </div>
            </div>
          </div>
        </div>

        <!-- Objectives -->
        <div class="card text-white bg-dark mb-4 edit-card">
          <div class="card-header">
            <h5>Objectives</h5>
          </div>
          <div class="card-body">
            <div class="objectives">
              <div v-for="(objective, index) in userObjectives" :key="objective.id" class="objective mb-3 p-3 border rounded bg-secondary">
                <template v-if="editingObjectiveIndex === index">
                  <div class="edit-objective-form p-3 bg-dark text-white rounded shadow-sm mb-3">
                    <div class="mb-2">
                      <label class="form-label small text-white fw-bold">Objective Name</label>
                      <input v-model="objective.title" class="form-control input-dark" placeholder="Objective name" />
                    </div>
                    
                    <div class="mb-2">
                      <label class="form-label small text-white fw-bold">Progress</label>
                      <textarea v-model="objective.progress" class="form-control input-dark" 
                                placeholder="Progress" rows="3"></textarea>
                    </div>
                    
                    <div class="mb-2">
                      <label class="form-label small text-white fw-bold">Status</label>
                      <input v-model="objective.status" class="form-control input-dark" placeholder="Status" />
                    </div>
                    
                    <div class="mb-3">
                      <label class="form-label small text-white fw-bold">Visibility</label>
                      <select v-model="objective.visibility" class="form-select input-dark">
                        <option :value="true">Public</option>
                        <option :value="false">Private</option>
                      </select>
                    </div>
                    
                    <div class="d-flex gap-2">
                      <button @click="saveSingleObjective(index)" class="btn btn-success">
                        <i class="bi bi-check-lg me-1"></i> Save
                      </button>
                      <button @click="deleteObjective(objective.id)" class="btn btn-danger">
                        <i class="bi bi-trash me-1"></i> Delete
                      </button>
                      <button @click="editingObjectiveIndex = null" class="btn btn-secondary">
                        Cancel
                      </button>
                    </div>
                  </div>
                  </template>
                  <template v-else>
                  <p class="mb-1 fw-bold">{{ objective.title }}</p>
                  <p class="mb-1">Status : {{ objective.status}}</p>
                  <p class="mb-1">Progress : {{ objective.progress }}</p>
                  <p class="mb-1">Visibility : {{ objective.visibility ? 'Public' : 'Private' }}</p>
                  <p class="mb-1">Created at : {{ formatFirestoreTimestamp(objective.startDate) }} </p>
                  <p class="mb-1">Last updated at : {{ formatFirestoreTimestamp(objective.lastUpdate) }}</p>
                  <button v-if="isCurrent" @click="editingObjectiveIndex = index" class="btn btn-outline-light btn-sm mt-1">Edit</button>
                </template>
              </div>
            </div>
          </div>
        </div>

      </div>

      <!-- TimeLine -->
      <div class="timeline-bar" v-if="activeTab === 'Timeline'">
          <h2>Timeline:</h2>
              <div v-for="item in timeLine" :key="item.data.id" class="timeline-item">
                  <div v-if="item.type === 'project'">
                    <div class="timeline-title">
                      <i class="fas fa-diagram-project"></i>
                      <h3>{{ formatDate(item.createdAt) }}</h3>
                    </div>
                      <p>Started project: {{ item.data.title }}</p>
                  </div>
                  <div v-else-if="item.type === 'objective'">
                    <div class="timeline-title">
                      <i class="fas fa-bullseye"></i>
                      <h4>{{ formatDate(item.createdAt) }}</h4>
                    </div>
                      <p>Set objective: {{ item.data.title }}</p>
                      <p>Status: {{ item.data.status }}</p>
                  </div>
                  <div v-else-if="item.type === 'skill'">
                    <div class="timeline-title">
                      <i class="fas fa-rocket"></i>
                      <h3>{{ formatDate(item.createdAt) }}</h3>
                    </div>
                      <p>Acquired skill: {{ item.data.name }}</p>
                      <p>Level: {{ item.data.level }}</p>
                  </div>
              </div>
              <div class="timeline-item">
                <div class="timeline-title">
                  <i class="fas fa-user"></i>
                  <h3>Joined DevGate: {{formatDate(userData.createdAt)}}</h3>
                </div>
              </div>
      </div>

    </div>
  </div>
  </div>
  <div v-else>
    <div class="container-fluid mt-3">
      <div class="d-flex justify-content-center align-items-center">
        <h1 >This user is unavailable</h1>
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
 
// Routing:
const route = useRoute();
const router = useRouter();

// Variables:
const userId = ref(route.params.id);                         // Get the userId from the route params 
const isCurrent = computed(() => userId.value === auth.currentUser.uid);    // Check if the userId is the same as the current user's id
const isBanned = ref(false);                         // Check if the user is banned
const isFollowing = ref(false);                         // Check if the current user is following the userId
const activeTab = ref("Profile");   // variable to switch between Profile and Timeline tabs

// Data:
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
const timeLine = ref([]);



const editingSkillIndex = ref(null);
const editingProjectIndex = ref(null);
const editingObjectiveIndex = ref(null);




watch(() => route.params.id, (newId) => {
  userId.value = newId;
  showFollowersPopup.value = false;
  showFollowingPopup.value = false;
  loadProfileData(); 
});

const loadProfileData = async () => {
  try {
    const userRef = db.collection("users").doc(userId.value);

    const doc = await userRef.get();
    if (doc.exists) {
      userData.value = doc.data();
      isBanned.value = userData.value.role === 'banned';

      const [projectsSnap, objectivesSnap, skillsSnap] = await Promise.all([
        userRef.collection("projects").get(),
        userRef.collection("objectives").get(),
        userRef.collection("skills").get(),
      ]);

      userProjects.value = [];
      projectsSnap.forEach((doc) => {
        const project = doc.data();
        project.id = doc.id;
        if (isCurrent.value || project.visibility) {
          userProjects.value.push(project);
          timeLine.value.push({
            type: "project",
            data: project,
            createdAt: project.createdAt ? project.createdAt.toDate() : new Date(),
          });
        }
      });
      console.log(userProjects.value)

      userObjectives.value = [];

      objectivesSnap.forEach((doc) => {
        const objective = doc.data();
        objective.id = doc.id;
        userObjectives.value.push(objective);
        timeLine.value.push({
          type: "objective",
          data: objective,
          createdAt: objective.createdAt ? objective.createdAt.toDate() : new Date(),
        });
      });

      userSkills.value = [];
      skillsSnap.forEach((doc) => {
        const skill = doc.data();
        skill.id = doc.id;
        userSkills.value.push(skill);
        timeLine.value.push({
          type: "skill",
          data: skill,
          createdAt: skill.createdAt ? skill.createdAt.toDate() : new Date(),
        });
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


    timeLine.value.sort((a, b) => b.createdAt - a.createdAt);
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
      title: objective.title,
      progress: objective.progress,
      status: objective.status,
      lastUpdate: new Date()
    });
    //window.location.reload();
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

const formatDate = (timestamp) => {
    if (!timestamp) return "Unknown date";

    let date;
    if (timestamp.seconds) {
        // Firebase timestamp format
        date = new Date(timestamp.seconds * 1000);
    } else {
        // Regular date format
        date = new Date(timestamp);
    }

    return date.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
}

const switchTab = (tab) =>{
    activeTab.value = tab;
}

const deleteSkill = async (skillId) => {
  try {
    if (confirm("Are you sure you want to delete this skill?")) {
      const userRef = db.collection("users").doc(auth.currentUser.uid);
      await userRef.collection("skills").doc(skillId).delete();
      
      // Remove from local array
      userSkills.value = userSkills.value.filter(skill => skill.id !== skillId);
      
      // Update timeline
      timeLine.value = timeLine.value.filter(item => 
        !(item.type === 'skill' && item.data.id === skillId)
      );
      editingSkillIndex.value = null;
    }
  } catch (error) {
    console.error("Error deleting skill:", error);
  }
};

const deleteProject = async (projectId) => {
  try {
    if (confirm("Are you sure you want to delete this project?")) {
      const userRef = db.collection("users").doc(auth.currentUser.uid);
      await userRef.collection("projects").doc(projectId).delete();
      
      // Remove from local array
      userProjects.value = userProjects.value.filter(project => project.id !== projectId);
      
      // Update timeline
      timeLine.value = timeLine.value.filter(item => 
        !(item.type === 'project' && item.data.id === projectId)
      );
      editingProjectIndex.value = null;
    }
  } catch (error) {
    console.error("Error deleting skill:", error);
  }
};


const deleteObjective = async (objectiveId) => {
  try {
    if (confirm("Are you sure you want to delete this objective?")) {
      const userRef = db.collection("users").doc(auth.currentUser.uid);
      await userRef.collection("objectives").doc(objectiveId).delete();
      
      // Remove from local array
      userObjectives.value = userObjectives.value.filter(objective => objective.id !== objectiveId);
      
      // Update timeline
      timeLine.value = timeLine.value.filter(item => 
        !(item.type === 'objective' && item.data.id === objectiveId)
      );
      editingObjectiveIndex.value = null;
    }
  } catch (error) {
    console.error("Error deleting skill:", error);
  
  }
};
</script>

<style >

/* GitHub-like Theme Enhancements */
:root {
  --github-bg: #0d1117;
  --github-sidebar-bg: #161b22;
  --github-border: #30363d;
  --github-text: #c9d1d9;
  --github-secondary-text: #8b949e;
  --github-link: #58a6ff;
  --github-success: #238636;
  --github-danger: #da3633;
  --github-card-bg: #21262d;
  --github-accent: #1f6feb;
}

html,
body,
#app {
  color: var(--github-text);
  height: 100%;
  margin: 0;
  padding: 0;
  background-color: var(--github-bg);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
}

/* Main Layout */
.main {
  display: flex;
  flex-direction: row;
  gap: 24px;
  padding: 20px;
}

/* Sidebar Styling */
.sidebar {
  flex: 0 0 25%;
  padding: 0;
  border-radius: 6px;
}

.sidebar .card {
  background-color: var(--github-sidebar-bg) !important;
  border: 1px solid var(--github-border);
  border-radius: 6px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
}

.sidebar .card-header {
  border-bottom: 1px solid var(--github-border);
  background-color: rgba(240, 246, 252, 0.03);
  padding: 12px 16px;
}

.sidebar .card-header h5 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.sidebar .card-body {
  padding: 16px;
}

.profile-image {
  margin-bottom: 16px;
}

.profile-image img {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  border: 1px solid var(--github-border);
}

.username {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 4px;
}

.bio {
  margin-top: 0;
  margin-bottom: 16px;
  color: var(--github-secondary-text);
  font-size: 14px;
  font-style: italic;
}

.card-text {
  margin-bottom: 8px;
  font-size: 14px;
}

.clickable {
  cursor: pointer;
  color: var(--github-link);
  text-decoration: none;
}

.clickable:hover {
  text-decoration: underline;
}

/* Skills Styling */
.skill {
  background-color: var(--github-card-bg);
  border: 1px solid var(--github-border);
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 12px;
  position: relative;
}

.skill .fw-bold {
  color: var(--github-link);
  font-size: 16px;
  margin-bottom: 4px;
}

.skill p {
  margin-bottom: 4px;
  font-size: 14px;
  color: var(--github-secondary-text);
}

.skill .btn-outline-light {
  position: absolute;
  top: 12px;
  right: 12px;
  font-size: 12px;
  padding: 2px 8px;
  border-color: var(--github-border);
  background-color: transparent;
}

.skill .btn-outline-light:hover {
  background-color: rgba(56, 139, 253, 0.15);
  border-color: var(--github-link);
  color: var(--github-link);
}

/* Mainbar Styling */
.mainbar, .timeline-bar {
  flex: 1;
  padding: 0;
  border-radius: 6px;
}

.mainbar .card, .timeline-bar {
  background-color: var(--github-sidebar-bg) !important;
  border: 1px solid var(--github-border);
  border-radius: 6px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
  margin-bottom: 24px;
}

.mainbar .card-header, .timeline-bar h2 {
  border-bottom: 1px solid var(--github-border);
  background-color: rgba(240, 246, 252, 0.03);
  padding: 12px 16px;
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.timeline-bar h2 {
  font-size: 18px;
  padding: 16px;
  margin: 0;
}

.mainbar .card-body {
  padding: 16px;
}

/* Projects Styling */
.project {
  background-color: var(--github-card-bg) !important;
  border: 1px solid var(--github-border) !important;
  border-radius: 6px !important;
  padding: 16px !important;
  margin-bottom: 16px !important;
  position: relative;
}

.project .fw-bold {
  color: var(--github-link);
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 6px;
}

.project p {
  margin-bottom: 6px;
  font-size: 14px;
  color: var(--github-text);
}

.project p a {
  color: var(--github-link);
  text-decoration: none;
}

.project p a:hover {
  text-decoration: underline;
}

.project .btn-outline-light {
  position: absolute;
  top: 16px;
  right: 16px;
  font-size: 12px;
  padding: 2px 8px;
  border-color: var(--github-border);
}

.project .btn-outline-light:hover {
  background-color: rgba(56, 139, 253, 0.15);
  border-color: var(--github-link);
  color: var(--github-link);
}

/* Objectives Styling */
.objective {
  background-color: var(--github-card-bg) !important;
  border: 1px solid var(--github-border) !important;
  border-radius: 6px !important;
  padding: 16px !important;
  margin-bottom: 16px !important;
  position: relative;
}

.objective .fw-bold {
  color: var(--github-link);
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 6px;
}

.objective p {
  margin-bottom: 6px;
  font-size: 14px;
  color: var(--github-text);
}

.objective .btn-outline-light {
  position: absolute;
  top: 16px;
  right: 16px;
  font-size: 12px;
  padding: 2px 8px;
  border-color: var(--github-border);
}

.objective .btn-outline-light:hover {
  background-color: rgba(56, 139, 253, 0.15);
  border-color: var(--github-link);
  color: var(--github-link);
}

/* Timeline Styling */
.timeline-item {
  display: flex;
  flex-direction: column;
  background-color: transparent;
  border-left: 2px solid var(--github-border);
  margin-left: 20px;
  padding-left: 20px;
  margin-bottom: 24px;
  position: relative;
  padding-bottom: 8px;
}

.timeline-item::before {
  content: "";
  position: absolute;
  left: -8px;
  top: 0;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background-color: var(--github-accent);
  border: 2px solid var(--github-bg);
}

.timeline-title {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.timeline-title i {
  font-size: 16px;
  color: var(--github-link);
}

.timeline-title h3, .timeline-title h4 {
  font-size: 16px;
  font-weight: 600;
  margin: 0;
  color: var(--github-text);
}

.timeline-item p {
  margin: 4px 0;
  font-size: 14px;
  color: var(--github-secondary-text);
}

/* Tab Navigation */
.choice {
  margin-bottom: 20px;
  border-bottom: 1px solid var(--github-border);
  padding-bottom: 8px;
}

.choice .btn-outline {
  background-color: transparent;
  border: none;
  color: var(--github-secondary-text);
  font-size: 14px;
  padding: 8px 16px;
  margin-right: 8px;
  border-radius: 6px;
}

.choice .btn-outline:hover {
  background-color: rgba(56, 139, 253, 0.15);
  color: var(--github-link);
}

.choice .btn-outline.active {
  background-color: rgba(56, 139, 253, 0.15);
  color: var(--github-link);
  border-bottom: 2px solid var(--github-link);
}

/* Button Styling */
.btn-success {
  background-color: var(--github-success);
  border-color: rgba(240, 246, 252, 0.1);
}

.btn-success:hover {
  background-color: #2ea043;
  border-color: rgba(240, 246, 252, 0.1);
}

.btn-danger {
  background-color: var(--github-danger);
  border-color: rgba(240, 246, 252, 0.1);
}

.btn-danger:hover {
  background-color: #f85149;
  border-color: rgba(240, 246, 252, 0.1);
}

.btn-primary {
  background-color: var(--github-accent);
  border-color: rgba(240, 246, 252, 0.1);
}

.btn-primary:hover {
  background-color: #388bfd;
  border-color: rgba(240, 246, 252, 0.1);
}

.btn-secondary {
  background-color: var(--github-card-bg);
  border-color: var(--github-border);
  color: var(--github-text);
}

.btn-secondary:hover {
  background-color: #30363d;
  border-color: var(--github-border);
  color: var(--github-text);
}

/* Popup Styling */
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
  background: var(--github-sidebar-bg);
  padding: 24px;
  border-radius: 6px;
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  overflow-y: auto;
  border: 1px solid var(--github-border);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
}

.popup-content h2 {
  margin-top: 0;
  margin-bottom: 16px;
  font-weight: 600;
  color: var(--github-text);
  border-bottom: 1px solid var(--github-border);
  padding-bottom: 12px;
}

.user-card {
  padding: 12px;
  border-radius: 6px;
  background-color: var(--github-card-bg);
  border: 1px solid var(--github-border);
  margin-bottom: 8px;
}

.user-card:hover {
  background-color: #30363d;
}

.view-profile {
  margin-left: auto;
  background-color: transparent;
  border: 1px solid var(--github-border);
  color: var(--github-text);
}

.view-profile:hover {
  background-color: rgba(56, 139, 253, 0.15);
  border-color: var(--github-link);
  color: var(--github-link);
}

/* Form Controls */
.form-control, .form-select {
  background-color: var(--github-card-bg);
  border: 1px solid var(--github-border);
  color: var(--github-text);
  padding: 6px 12px;
}

.form-control:focus, .form-select:focus {
  background-color: var(--github-card-bg);
  border-color: var(--github-link);
  color: var(--github-text);
  box-shadow: 0 0 0 3px rgba(88, 166, 255, 0.3);
}


/* Consistent icon styling */
.bi {
  font-size: 14px;
  vertical-align: -0.125em;
}

/* make the page container dark */
.container-fluid.py-4 {
  background-color: #0d1117;
}

/* edit‐form card */
.edit-card {
  background-color: #161b22 !important;
  border-color:    #30363d !important;
}

/* inputs & selects inside edit form */
.input-dark {
  background-color: #0d1117 !important;
  color:            #c9d1d9 !important;
  border:           1px solid #30363d !important;
}

/* keep placeholders legible */
.input-dark::placeholder {
  color: #8b949e !important;
}

/* button overrides (if you like) */
.btn-save {
  background-color: #238636;
  border-color:     #238636;
  color:            #ffffff;
}
.btn-delete {
  background-color: #b62324;
  border-color:     #b62324;
  color:            #ffffff;
}
.btn-cancel {
  background-color: #57606a;
  border-color:     #57606a;
  color:            #ffffff;
}

</style>