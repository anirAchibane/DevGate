<template>
    <mini-navbar></mini-navbar>

    <div>
      <!-- Report Form -->
      <div class="card bg-dark text-white mb-4 p-4">
            <h4 class="card-title mb-4 text-center">New Report</h4>
            <form @submit.prevent="submitForm">
            <div class="mb-3">
                <label class="form-label">Title</label>
                <input type="text" v-model="targetTitle" class="form-control" disabled="true">
            </div>
    
            <div class="mb-3">
                <label class="form-label">Report type</label>
                <input type="text" v-model="targetType" class="form-control" rows="3" disabled="true">
            </div>
    
            <div class="mb-3">
                <label class="form-label">Reason</label>
                <input type="text" v-model="reason" class="form-control" required>
            </div>
    
            <div class="text-center">
                <button type="submit" class="btn btn-success">Confirm</button>
            </div>
            </form>
      </div>
    </div>
  </template>
  

<script setup>

import MiniNavbar from "@/components/MiniNavbar.vue";
import { useRoute, useRouter } from "vue-router";
import { onMounted, ref } from "vue";
import { db, auth } from "@/firebase/config.js";

const targetID = ref("");
const targetTitle = ref("");
const targetType = ref("");
const targetOwner = ref("");
const reason = ref("");
const reporter = ref("");

const router = useRouter();
const route = useRoute();

onMounted(async () => {

    targetID.value = route.query.targetID;
    targetTitle.value = route.query.targetTitle;
    targetType.value = route.query.targetType;   
    targetOwner.value = route.query.targetOwner;

    await db.collection("users").doc(auth.currentUser.uid).get().then((doc) => {
        if (doc.exists) {
            reporter.value = doc.data().username;
        } else {
            console.log("No such document!");
        }
    }).catch((error) => {
        console.log("Error getting document:", error);
    });



})
const submitForm = async()=> {
  try{
        await db.collection("reports").add({
            targetID: targetID.value,
            targetTitle: targetTitle.value,
            targetType: targetType.value,
            targetOwner: targetOwner.value,
            reason: reason.value,
            createdAt: new Date(),
            reporter: reporter.value
        }).then(() => {
            alert("Report sent successfully!");
            console.log("Report added successfully!");
            router.push("/home");
        }).catch((error) => {
            console.error("Error adding report:", error);
        });
    
  } catch (error) {
    console.error("Error adding item:", error);
  }



}


</script>

<style lang="scss" scoped>
.card{
    align-self:center; justify-self: center;
    margin-top:30px;
    width: 50%;
}
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