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
      <div v-if="selectedType==='Project'" class="card form-card bg-dark text-white mb-4 p-4">
        <h4 class="card-title mb-4 text-center">Add a new project</h4>
        <form @submit.prevent="submitForm">
          <div class="mb-3">
            <label class="form-label">Title</label>
            <input type="text" v-model="formDataProject.title" class="form-control input-dark" required>
          </div>
  
          <div class="mb-3">
            <label class="form-label">Description</label>
            <textarea v-model="formDataProject.description" class="form-control input-dark" rows="3"></textarea>
          </div>
  
          <div class="mb-3">
            <label class="form-label">Github Url</label>
            <input type="text" v-model="formDataProject.githubURL" class="form-control input-dark">
          </div>

          <div class="mb-3">
          <label class="form-label">Tags (separate with commas)</label>
          <input 
            type="text" 
            v-model="tagsInput"
            class="form-control input-dark"
            placeholder="e.g., Vue, Firebase, WebDev"
          >
        </div>

  
          <div class="form-check mb-3">
            <input type="checkbox" v-model="formDataProject.visibility" class="form-check-input" id="isPublic">
            <label class="form-check-label" for="isPublic">Public project?</label>
          </div>
  
          <div class="text-center">
            <button type="submit" class="btn btn-primary submit-btn">Add {{ selectedType }}</button>
          </div>
        </form>
      </div>
  
      <!-- Objective Form -->
      <div v-if="selectedType==='Objective'" class="card form-card bg-dark text-white mb-4 p-4">
        <h4 class="card-title mb-4 text-center">Add a new Objective</h4>
        <form @submit.prevent="submitForm">
          <div class="mb-3">
            <label class="form-label">Title</label>
            <input type="text" v-model="formDataObjective.title" class="form-control input-dark" required />
          </div>
  
          <div class="mb-3">
            <label class="form-label">Status</label>
            <select v-model="formDataObjective.status" class="form-select input-dark ms-0" required>
              <option value="Achieved">Achieved</option>
              <option value="Non Achieved">Non Achieved</option>
            </select>
          </div>
  
          <div class="mb-3">
            <label class="form-label">Progress</label>
            <input type="text" v-model="formDataObjective.progress" class="form-control input-dark" required placeholder="Add a description of the tracked progress" />
          </div>

          
  
          <div class="text-center">
            <button type="submit" class="btn btn-primary submit-btn">Add {{ selectedType }}</button>
          </div>
        </form>
      </div>
  
      <!-- Skill Form -->
      <div v-if="selectedType==='Skill'" class="card form-card bg-dark text-white mb-4 p-4">
        <h4 class="card-title mb-4 text-center">Add a new Skill</h4>
        <form @submit.prevent="submitForm">
          <div class="skills-container">
            <div class="mb-3">
              <label class="form-label">Skill Name</label>
              <input type="text" v-model="formDataskill.name" class="form-control input-dark" required />
            </div>
    
            <div class="mb-3">
              <label class="form-label">Skill Level</label>
              <select v-model="formDataskill.level" class="form-select input-dark ms-0">
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
                <option value="Master">Master</option>
              </select>
              
            </div>
          </div>
    
          <div class="text-center">
            <button type="submit" class="btn btn-primary submit-btn">Add {{ selectedType }}</button>
          </div>
        </form>
      </div>
  
    </div>
  
</template>
  

<script setup>

import router from "@/router";
import {db,auth} from "@/firebase/config.js"
import { ref, onMounted } from "vue";
import MiniNavbar from "@/components/MiniNavbar.vue";
import { useRoute } from "vue-router";

const isBanned = ref(false);

const route = useRoute();
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
    acquiredAt: new Date(),
    updatedAt: new Date()
});
const formDataObjective = ref({
    title: "",
    status:"",
    progress: "",
    lastUpdate: new Date,
    startDate: new Date()
});

// Check if there's a type parameter in the URL and set the selectedType accordingly
onMounted(async () => {
  db.collection("users").doc(auth.currentUser.uid).get().then((doc) => {
    if (doc.exists) {
      isBanned.value = doc.data().role === "banned";
    }
  });
  if (route.query.type) {
    // Make sure the type is one of the valid options
    const validTypes = ['Project', 'Objective', 'Skill'];
    if (validTypes.includes(route.query.type)) {
      selectedType.value = route.query.type;
    }
  }
});

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
        await db.collection("timelineObjects").add({
          title: formDataProject.value.title,
          description: formDataProject.value.description,
          user: auth.currentUser.uid,
          type: "project",
          createdAt: new Date(),
        })
        
    }
    else if (selectedType.value === "Skill") {
      const dataToAdd = { ...formDataskill.value };
      await userRef.collection("skills").add(dataToAdd);
      await db.collection("timelineObjects").add({
        title: formDataskill.value.name,
        description: formDataskill.value.level,
        user: auth.currentUser.uid,
        type: "skill",
        createdAt: new Date(),
      })
    }
    else if(selectedType.value === "Objective"){
        const dataToAdd = { ... formDataObjective.value};
        await userRef.collection("objectives").add(dataToAdd);
        await db.collection("timelineObjects").add({
          title: formDataObjective.value.title,
          description: formDataObjective.value.status,
          user: auth.currentUser.uid,
          type: "objective",
          createdAt: new Date(),
        })
    }
    alert(`${selectedType.value} added successfully!`);
    router.push(`/profil/${auth.currentUser.uid}`);

    
  } catch (error) {
    console.error("Error adding item:", error);
  }



}

</script>

<style lang="scss" scoped>
.post-action-btn {
    padding: 10px 18px;
    background-color: var(--background-secondary);
    border: 1px solid var(--border-light);
    border-radius: var(--radius-md);
    color: var(--text-secondary);
    cursor: pointer;
    transition: all var(--transition-normal);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    font-size: 14px;
    font-weight: 500;
}

.post-action-btn:hover {
    background-color: rgba(52, 152, 219, 0.1);
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
    border-color: rgba(52, 152, 219, 0.3);
}

.post-action-btn i {
    font-size: 20px;
    margin-bottom: 4px;
}

.active-post-action {
    color: var(--primary-color);
    transform: translateY(-2px);
    position: relative;
    overflow: hidden;
    transition: all var(--transition-normal);
    background-color: rgba(52, 152, 219, 0.15);
    border-color: rgba(52, 152, 219, 0.4);
    box-shadow: 0 4px 12px rgba(52, 152, 219, 0.25);
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
    color: var(--accent-color);
}

.form-card {
    background-color: var(--background-secondary) !important;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-sm);
    transition: transform var(--transition-normal), box-shadow var(--transition-normal);
}

.form-card:hover {
    transform: translateY(-3px);
    box-shadow: var(--shadow-md);
    border-color: var(--primary-color);
}

.form-label {
    color: var(--text-primary);
    font-weight: 600;
    font-size: 0.95rem;
    margin-bottom: 0.5rem;
}

.input-dark {
    background-color: var(--background-primary) !important;
    color: var(--text-primary) !important;
    border: 1px solid var(--border-color) !important;
    padding: 10px 12px;
    border-radius: var(--radius-md);
    transition: all var(--transition-normal);
}

.input-dark:hover {
    background-color: rgba(13, 17, 23, 0.8) !important;
    border-color: rgba(52, 152, 219, 0.5) !important;
}

.input-dark:focus {
    background-color: var(--background-primary) !important;
    border-color: var(--primary-color) !important;
    color: var(--text-primary) !important;
    box-shadow: 0 0 0 3px rgba(88, 166, 255, 0.3) !important;
    outline: none;
}

.input-dark::placeholder {
    color: var(--text-muted) !important;
}

.form-check-input {
    background-color: var(--background-primary);
    border: 1px solid var(--border-color);
}

.form-check-input:checked {
    background-color: var(--primary-color);
    border-color: var(--primary-color);
}

.form-check-label {
    color: var(--text-secondary);
    font-size: 0.95rem;
}

.submit-btn {
    padding: 10px 25px;
    background-color: var(--primary-color);
    color: white;
    border: none;
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: all var(--transition-normal);
    font-weight: 600;
    letter-spacing: 0.5px;
    min-width: 150px;
}

.submit-btn:hover {
    background-color: var(--primary-hover);
    transform: translateY(-3px);
    box-shadow: var(--shadow-lg);
}

.submit-btn:active:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: var(--shadow-sm);
}

/* Type colors for labels */
.post-action-btn:has(#project:checked) i {
    color: var(--primary-color);
}

.post-action-btn:has(#objective:checked) i {
    color: var(--warning-color);
}

.post-action-btn:has(#skill:checked) i {
    color: var(--success-color);
}

.skills-container {
    max-width: 400px;
    overflow-x: auto;
}
</style>