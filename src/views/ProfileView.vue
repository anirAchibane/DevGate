<template>
    <mini-navbar></mini-navbar>
    <div class="container-fluid mt-3">
        <div class="d-flex  justify-content-center align-items-center">
        <router-link 
      v-if="isCurrent"
      :to="`/add/${auth.currentUser.uid}`" 
      class="btn btn-success"
    >
      What's New
    </router-link>
        </div>
    </div>
    <div class="container-fluid py-4">
      <div class="main row">
  
        <!-- Sidebar -->
        <div class="sidebar">
          <div class="card text-white bg-dark mb-4">
            <div class="card-body text-center">
              <p class="pfp mb-3">Profile pic</p>
              <h4 class="username card-title">{{ userData.username }}</h4>
              <p v-if="userData.bio !== ''" class="card-text">Bio: {{ userData.bio }}</p>
              <p v-else class="card-text">Bio: no bio</p>
              <p class="card-text">Email: {{ userData.email }}</p>
  
              <div class="mt-3">
                <button v-if="isCurrent" @click="settings()" class="btn btn-outline-light btn-sm" style="background-color: white; color: black;" >
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
  
          <div class="card text-white bg-dark">
            <div class="card-header">
              <h5>Skills</h5>
            </div>
            <div class="card-body">
              <div class="skills">
                <div v-for="skill in userSkills" :key="skill.id" class="skill mb-2">
                  <p class="mb-1 fw-bold">{{ skill.name }} </p>
                  <p class="mb-1"> Level : {{ skill.level }}</p>
                  <p class="mb-1"> Skill aquired at : {{ formatFirestoreTimestamp(skill.acquiredAt ) }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
  
        <!-- Mainbar -->
        <div class="mainbar">
        
  
          <div class="card text-white bg-dark mb-4">
            <div class="card-header">
              <h5>Projects</h5>
            </div>
            <div class="card-body">
              <div class="projects">
                <div v-for="project in userProjects" :key="project.id" class="project mb-3 p-3 border rounded bg-secondary">
                  <p class="mb-1 fw-bold">{{ project.title }}</p>
                  <p v-if="project.description " class="mb-1">Description: {{ project.description }}</p>
                  <p v-else class="mb-1">Description: no description</p>
                  <p class="mb-1">
                    Github URL :
                    <a :href="project.githubURL" target="_blank" rel="noopener noreferrer">
                      {{ project.githubURL }}
                    </a> 
                  </p>
                  <p class="mb-1 ">Tags : {{ project.tags }}</p>
                  <p class="mb-0" v-if="project.visibility"> Visibility : Public</p>
                  <p class="mb-0" v-else> Visibiliy : Private</p>
                  <p class="mb-0"> Created at : {{ formatFirestoreTimestamp(project.createdAt) }} </p>
                </div>
              </div>
            </div>
          </div>
  
          <div class="card text-white bg-dark">
            <div class="card-header">
              <h5>Objectives</h5>
            </div>
            <div class="card-body">
              <div class="objectives">
                <div v-for="objective in userObjectives" :key="objective.id" class="objective mb-3 p-3 border rounded bg-secondary">
                  <p class="mb-1 fw-bold">{{ objective.name }}</p>
                  <p v-if="objective.description !== ''" class="mb-1">Description: {{ objective.description }}</p>
                  <p v-else class="mb-1">Description: no description</p>
                  <p class="mb-1">Type: {{ objective.type }}</p>
                  <p class="mb-0">Language: {{ objective.language }}</p>
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
import { onMounted } from "vue";


const route = useRoute();
const router = useRouter();

const userId = route.params.id;                         // Get the userId from the route params 
const isCurrent = userId === auth.currentUser.uid;      // Check if the userId is the same as the current user's id
const isFollowing = ref(false);                         // Check if the current user is following the userId

const userData = ref({});    // stores current user's data
const userProjects = ref([]);   // stores user's projects ( all projects if isCurrent(), else only public projects)
const userObjectives = ref([]); // stores user's objectives
const userSkills = ref([]);     // stores user's skills


onMounted(async () => {
    // fetching data:
    try{
        const userRef = db.collection("users").doc(userId);
        userRef.get().then((doc) =>{
            if(doc.exists){
                // Get user data
                userData.value = doc.data(); 

                // Get user projects
                userRef.collection("projects").get().then((snapshot)=>{
                    const projects = [];
                    snapshot.forEach((doc) =>{
                        const project = doc.data();
                        project.id = doc.id;

                        // If the user is the current user or the project is public
                        if (isCurrent || project.isPublic) { 
                            projects.push(project);
                        }
                    })
                    userProjects.value = projects;
                })

                // Get user objectives
                userRef.collection("objectives").get().then((snapshot)=>{
                    const objectives = [];
                    snapshot.forEach((doc) =>{
                        const objective = doc.data();
                        objective.id = doc.id;
                        objectives.push(objective);
                    })
                    userObjectives.value = objectives;
                })

                // Get user skills
                userRef.collection("skills").get().then((snapshot)=>{
                    const skills = [];
                    snapshot.forEach((doc) =>{
                        const skill = doc.data();
                        skill.id = doc.id;
                        skills.push(skill);
                    })
                    userSkills.value = skills;
                })

            } else {
                console.log("No such document!");
            }
        })

        if (!isCurrent){
            // If the user is not the current user, check if the current user is following them
            const currentUserRef = await db.collection("users").doc(auth.currentUser.uid);
            currentUserRef.get().then((doc) =>{
                if(doc.exists){
                    const following = doc.data().following; // Get the following array
                    isFollowing.value = following.includes(userId); // Check if the userId is in the following array
                } else {
                    console.log("No such document!");
                }
            })

        }

        
    } catch (error) {
        console.error("Error fetching user data:", error);
    }

});


const settings = () => {
    // Redirect to the settings page
    router.push("/settings");
}

const follow = async () => {
      try{
        const followList = ref([]);
        await db.collection("users").doc(auth.currentUser.uid).get().then((doc) =>{
            if(doc.exists){
                followList.value = doc.data().following; 
            } else {
                console.log("No such document!");
            }
        })

        followList.value.push(userId); // Add the userId to the following list
        await db.collection("users").doc(auth.currentUser.uid).update({
            following: followList.value
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

            followList.value = followList.value.filter((id) => id !== userId);

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

.mainbar {
    flex: 1; /* take the rest */
    padding: 20px;
    border-radius: 10px;
    border: 1px solid #3D434C;
}


</style>
