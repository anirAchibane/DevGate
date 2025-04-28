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
                <button v-else @click="follow()" class="btn btn-primary btn-sm">
                  Follow
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
                  <p class="mb-1">{{ skill.name }} : {{ skill.level }}</p>
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
                  <p class="mb-1 fw-bold">{{ project.name }}</p>
                  <p v-if="project.description !== ''" class="mb-1">Description: {{ project.description }}</p>
                  <p v-else class="mb-1">Description: no description</p>
                  <p class="mb-1">Type: {{ project.type }}</p>
                  <p class="mb-1">Language: {{ project.language }}</p>
                  <p class="mb-0" v-if="project.isPublic">Public</p>
                  <p class="mb-0" v-else>Private</p>
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
import { useRoute, /*useRouter*/  } from "vue-router";
import { onMounted } from "vue";


const route = useRoute();
//const router = useRouter();

const userId = route.params.id;                         // Get the userId from the route params 
const isCurrent = userId === auth.currentUser.uid;      // Check if the userId is the same as the current user's id

const userData = ref({});    // stores current user's data
const userProjects = ref([]);   // stores user's projects ( all projects if isCurrent(), else only public projects)
const userObjectives = ref([]); // stores user's objectives
const userSkills = ref([]);     // stores user's skills


onMounted(() => {
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

        
    } catch (error) {
        console.error("Error fetching user data:", error);
    }
});

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
