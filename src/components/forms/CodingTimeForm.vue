<template>
  <div class="coding-form">
    <h2>Log Coding Time</h2>
    <form @submit.prevent="submitForm">
      <div class="mb-3">
        <label for="codingDate" class="form-label">Date</label>
        <input 
          type="date" 
          id="codingDate" 
          v-model="codingDate" 
          class="form-control input-dark" 
          :max="currentDate"
          required
        />
      </div>
      <div class="mb-3">
        <label for="codingHours" class="form-label">Hours</label>
        <input 
          type="number" 
          id="codingHours" 
          v-model="codingHours" 
          class="form-control input-dark" 
          min="0.5" 
          step="0.5" 
          placeholder="Enter hours spent coding"
          required
        />
      </div>
      <div class="d-flex justify-content-end gap-2">
        <button type="button" @click="$emit('cancel')" class="btn btn-secondary">Cancel</button>
        <button type="submit" class="btn btn-success" :disabled="isSubmitting">
          {{ isSubmitting ? 'Logging...' : 'Log Time' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, computed, defineProps, defineEmits } from 'vue';
import { db } from '@/firebase/config';

const props = defineProps({
  userId: {
    type: String,
    required: true
  }
});

const emit = defineEmits(['submit-success', 'cancel']);

const codingDate = ref(new Date().toISOString().substr(0, 10));
const codingHours = ref(0);
const isSubmitting = ref(false);
const currentDate = computed(() => new Date().toISOString().substr(0, 10));

const submitForm = async () => {
  // Validation
  if (!codingHours.value || codingHours.value <= 0) {
    alert("Please enter a valid number of hours greater than 0");
    return;
  }
  
  // Validate the date is not in the future
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Set to beginning of day for fair comparison

  isSubmitting.value = true;
  
  try {
    const userRef = db.collection("users").doc(props.userId);
    await userRef.collection("codingTime").add({
      date: new Date(codingDate.value),
      hours: parseFloat(codingHours.value),
      createdAt: new Date()
    });
    
    // Reset form
    codingHours.value = 0;
    
    // Emit success event
    emit('submit-success');
  } catch (error) {
    console.error("Error logging coding time:", error);
    alert("Error logging coding time: " + error.message);
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<style scoped>
.coding-form {
  width: 100%;
}

.input-dark {
  background-color: #0d1117 !important;
  color: #c9d1d9 !important;
  border: 1px solid #30363d !important;
}

.input-dark::placeholder {
  color: #8b949e !important;
}

.input-dark:focus {
  background-color: #0d1117 !important;
  border-color: #58a6ff !important;
  color: #c9d1d9 !important;
  box-shadow: 0 0 0 3px rgba(88, 166, 255, 0.3) !important;
}
</style>