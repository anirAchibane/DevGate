<template>
    <mini-navbar></mini-navbar>
    <div class="main">

        <div class="sidebar">
            <div class="UserInfo">
                <p class="pfp">Profile pic</p>
                <p class="username">{{ userData.username }}</p>
                <p v-if="userData.bio !== ''">Bio: {{ userData.bio }}</p>
                <p v-else>Bio: no bio</p>
                <p>email: {{ userData.email }}</p>
                <button v-if ="isCurrent" @click="settings()">Settings</button>
                <button v-else @click="follow()">Follow</button>
            </div>

            <div class="UserSkills">
                <h2>Skills</h2>
                <div class="skills">
                    <div v-for="skill in userSkills" :key="skill.id" class="skill">
                        <p>{{ skill.name }} : {{ skill.level }}</p>
                    </div>
                </div>
            </div>
        </div>

        <div class="mainbar">
            <div class="buttons d-flex flex-row" v-if="isCurrent">
                <h2>Select</h2>
                <select v-model="selectedType">
                    <option value="Project">Project</option>
                    <option value="Objective">Objective</option>
                    <option value="Skill">Skill</option>
                </select>
                <button @click="New">Add</button>
            </div>

            <div class="UserProjects">
                <h2>Projects</h2>
                <div class="projects">
                    <div v-for="project in userProjects" :key="project.id" class="project">
                        <p>{{ project.name }}</p>
                        <p v-if="project.description !== ''">Description: {{ project.description }}</p>
                        <p v-else>Description: no description</p>
                        <p>Type: {{ project.type }}</p>
                        <p>Language: {{ project.language }}</p>
                        <p v-if="project.isPublic">Public</p>
                        <p v-else>Private</p>
                    </div>
                </div>
            </div>

            <div class="UserObjectives">
                <h2>Objectives</h2>
                <div class="objectives">
                    <div v-for="objective in userObjectives" :key="objective.id" class="objective">
                        <p>{{ objective.name }}</p>
                        <p v-if="objective.description !== ''">Description: {{ objective.description }}</p>
                        <p v-else>Description: no description</p>
                        <p>Type: {{ objective.type }}</p>
                        <p>Language: {{ objective.language }}</p>
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

const selectedType = ref("project"); // stores the selected type of item to add (project, objective, skill)

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

.main{
    display: flex;
    flex-direction: row;

    padding: 20px;
    text-align: center;
    gap: 10px;
}

.sidebar{
    width: 30%;
    height: 100%;
    padding: 20px;
    border-radius: 10px;
    border: 1px solid #3D434C;;
}

.mainbar{
    width: 70%;
    height: 100%;
    padding: 20px;
    border-radius: 10px;
    border: 1px solid #3D434C;
}
</style>
