<template>
    <mini-navbar></mini-navbar>
  
    <div class="container py-5">
  
      <!-- Selection Radios -->
      <div class="d-flex justify-content-center gap-4 mb-4 post-actions">

<label class="post-action-btn" :class="{ 'active-post-action': selectedType === 'Project' }">
  <input 
    class="form-check-input d-none" 
    type="radio" 
    id="project" 
    value="Project" 
    v-model="selectedType"
  />
  <i class="fas fa-code-branch"></i>
  <span>Project</span>
</label>

<label 
  class="post-action-btn"
  :class="{ 'active-post-action': selectedType === 'Objective' }"
>

  <input 
    class="form-check-input d-none" 
    type="radio" 
    id="objective" 
    value="Objective" 
    v-model="selectedType"
  />
  <i class="fas fa-bullseye"></i>
  <span>Objective</span>
</label>

<label class="post-action-btn" :class="{ 'active-post-action': selectedType === 'Skill' }">
  <input 
    class="form-check-input d-none" 
    type="radio" 
    id="skill" 
    value="Skill" 
    v-model="selectedType"
  />
  <i class="fas fa-certificate"></i>
  <span>Skill</span>
</label>

</div>

  
      <!-- Project Form -->
      <div v-if="selectedType==='Project'" class="card bg-dark text-white mb-4 p-4">
        <h4 class="card-title mb-4 text-center">Add a new project</h4>
        <form @submit.prevent="submitForm">
          <div class="mb-3">
            <label class="form-label">Title</label>
            <input type="text" v-model="formDataProject.title" class="form-control" required>
          </div>
  
          <div class="mb-3">
            <label class="form-label">Description</label>
            <textarea v-model="formDataProject.description" class="form-control" rows="3"></textarea>
          </div>
  
          <div class="mb-3">
            <label class="form-label">Github Url</label>
            <input type="text" v-model="formDataProject.githubURL" class="form-control">
          </div>

          <div class="mb-3">
          <label class="form-label">Tags (separate with commas)</label>
          <input 
            type="text" 
            v-model="tagsInput"
            class="form-control"
            placeholder="e.g., Vue, Firebase, WebDev"
          >
        </div>

  
          <div class="form-check mb-3">
            <input type="checkbox" v-model="formDataProject.visibility" class="form-check-input" id="isPublic">
            <label class="form-check-label" for="isPublic">Public project?</label>
          </div>
  
          <div class="text-center">
            <button type="submit" class="btn btn-success">Add {{ selectedType }}</button>
          </div>
        </form>
      </div>
  
      <!-- Objective Form -->
      <div v-if="selectedType==='Objective'" class="card bg-dark text-white mb-4 p-4">
        <h4 class="card-title mb-4 text-center">Add a new Objective</h4>
        <form @submit.prevent="submitForm">
          <div class="mb-3">
            <label class="form-label">Title</label>
            <input type="text" v-model="formDataObjective.title" class="form-control" required />
          </div>
  
          <div class="mb-3">
            <label class="form-label">Status</label>
            <input type="text" v-model="formDataObjective.status" class="form-control" required />
          </div>
  
          <div class="mb-3">
            <label class="form-label">Progress</label>
            <input type="text" v-model="formDataObjective.progress" class="form-control" required />
          </div>
  
          <div class="text-center">
            <button type="submit" class="btn btn-success">Add {{ selectedType }}</button>
          </div>
        </form>
      </div>
  
      <!-- Skill Form -->
      <div v-if="selectedType==='Skill'" class="card bg-dark text-white mb-4 p-4">
        <h4 class="card-title mb-4 text-center">Add a new Skill</h4>
        <form @submit.prevent="submitForm">
          <div class="mb-3">
            <label class="form-label">Skill Name</label>
            <input type="text" v-model="formDataskill.name" class="form-control" required />
          </div>
  
          <div class="mb-3">
            <label class="form-label">Skill Level</label>
            <input type="text" v-model="formDataskill.level" class="form-control" />
          </div>
  
          <div class="text-center">
            <button type="submit" class="btn btn-success">Add {{ selectedType }}</button>
          </div>
        </form>
      </div>
  
    </div>
  
  </template>
  

<script setup>

import router from "@/router";
import {db,auth} from "@/firebase/config.js"
import { ref } from "vue";
import MiniNavbar from "@/components/MiniNavbar.vue";


const selectedType = ref('Project');
const tagsInput = ref('');
const formDataProject = ref({
  title: "",
  description: "",
  githubURL: "",
  visibility: false,
  createdAt:new Date(),
  tags : []
});
const formDataskill = ref({
    name: "",
    level: "",
    acquiredAt: new Date,
    updatedAt: new Date()
});
const formDataObjective = ref({
    title: "",
    status:"",
    progress: "",
    lastUpdate: new Date,
    startDate: new Date()
})
const submitForm = async()=> {
    try{
    const userRef = db.collection("users").doc(auth.currentUser.uid) ;
    
    if (selectedType.value === "Project"){
        formDataProject.value.tags = tagsInput.value
        .split(',')
        .map(tag => tag.trim())   // remove extra spaces
        .filter(tag => tag !== '');
        const datatoAdd = { ... formDataProject.value};
        await userRef.collection("projects").add(datatoAdd);
        
    }
    else if (selectedType.value === "Skill") {
      const dataToAdd = { ...formDataskill.value };
      await userRef.collection("skills").add(dataToAdd);
    }
    else if(selectedType.value === "Objective"){
        const dataToAdd = { ... formDataObjective.value};
        await userRef.collection("objectives").add(dataToAdd);
    }
    alert(`${selectedType.value} added successfully!`);
    router.push(`/profil/${auth.currentUser.uid}`);

    
  } catch (error) {
    console.error("Error adding item:", error);
  }



}







</script>

<style lang="scss" scoped>
.active-post-action {
    color: #3498db;
    transform: translateY(-2px);
    position: relative;
    overflow: hidden;
    transition: all 0.3s ease;
}

/* Create the animated background circle */
.active-post-action::before {
    content: "";
    position: absolute;
    top: 50%;
    left: 50%;
    width: 0;
    height: 0;
    background-color: rgba(52, 152, 219, 0.2);
    border-radius: 50%;
    transform: translate(-50%, -50%);
    transition: width 0.5s ease, height 0.5s ease;
    z-index: -1;
}

/* When hovering on active */
.active-post-action:hover::before {
    width: 250px;
    height: 250px;
}

/* Optional: improve text hover */
.active-post-action:hover {
    color: #5dade2;
}

</style>