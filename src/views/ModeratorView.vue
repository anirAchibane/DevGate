<template>
    <mini-navbar></mini-navbar>
    <div class="container-fluid py-4"  v-if="isMod">
        <div class="row g-4">
            <!-- Users List -->
            <div class="col-md-6">
                <div class="card" style="background-color: #0D1117; border: 1px solid #3D434C;">
                    <div class="card-header d-flex justify-content-between align-items-center py-3" style="background-color: #0D1117; border-bottom: 1px solid #3D434C;">
                        <h5 class="mb-0 fw-semibold text-light">Users</h5>
                        <div class="input-group input-group-sm" style="max-width: 200px;">
                            <span class="input-group-text" style="background-color: #0D1117; border: 1px solid #3D434C; border-right: none;">
                                <i class="bi bi-search text-light"></i>
                            </span>
                            <input 
                                type="text" 
                                class="form-control" 
                                v-model="userSearch" 
                                placeholder="Search users..."
                                aria-label="Search users"
                                style="background-color: #0D1117; border: 1px solid #3D434C; border-left: none; color: #fff;"
                            >
                        </div>
                    </div>
                    <div class="list-group list-group-flush">
                        <div class="list-group-item d-flex justify-content-between align-items-center py-3" 
                             v-for="user in filteredUsers" 
                             :key="user.id"
                             style="background-color: #0D1117; border-bottom: 1px solid #3D434C;">
                            <div class="d-flex align-items-center">
                                <div class="profile-image size-40 me-3">
                                    <img
                                        :src="
                                        user.avatar ||
                                        require('@/assets/default_pfp.jpg')
                                        "
                                        alt="Profile"
                                    />
                                </div>
                                <div>
                                    <h6 class="mb-0 fw-semibold text-light">{{ user.username }}</h6>
                                    <small class="text-secondary">{{ user.email }}</small>
                                    <div class="mt-1">
                                        <span v-if="user.role === 'banned'" class="badge text-bg-danger">Banned</span>
                                        <span v-else-if="user.role === 'admin'" class="badge text-bg-primary">Admin</span>
                                        <span v-else class="badge text-bg-success">User</span>
                                    </div>
                                </div>
                            </div>
                            <div class="d-flex gap-2">
                                <router-link 
                                    :to="`/profil/${user.id}`" 
                                    v-if="user.role !== 'banned'" 
                                    class="btn btn-sm btn-outline-secondary"
                                >
                                    <i class="bi bi-person me-1"></i> Profile
                                </router-link>
                                <button 
                                    @click="banUser(user.id)" 
                                    v-if="user.role !== 'banned'" 
                                    class="btn btn-sm btn-danger"
                                >
                                    Ban
                                </button>
                                <button 
                                    @click="unBanUser(user.id)" 
                                    v-else 
                                    class="btn btn-sm btn-success"
                                >
                                    Unban
                                </button>
                            </div>
                        </div>
                        
                        <div v-if="filteredUsers.length === 0" class="list-group-item py-4 text-center" style="background-color: #0D1117; color: #8b949e;">
                            <i class="bi bi-people fs-4 d-block mb-2"></i>
                            <p class="mb-0">No users found matching your search.</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Reports List -->
            <div class="col-md-6">
                <div class="card" style="background-color: #0D1117; border: 1px solid #3D434C;">
                    <div class="card-header d-flex justify-content-between align-items-center py-3" style="background-color: #0D1117; border-bottom: 1px solid #3D434C;">
                        <h5 class="mb-0 fw-semibold text-light">Reports</h5>
                        <div class="input-group input-group-sm" style="max-width: 200px;">
                            <span class="input-group-text" style="background-color: #0D1117; border: 1px solid #3D434C; border-right: none;">
                                <i class="bi bi-search text-light"></i>
                            </span>
                            <input 
                                type="text" 
                                class="form-control" 
                                v-model="reportSearch" 
                                placeholder="Search reports..."
                                aria-label="Search reports"
                                style="background-color: #0D1117; border: 1px solid #3D434C; border-left: none; color: #fff;"
                            >
                        </div>
                    </div>
                    <div class="list-group list-group-flush">
                        <div 
                            v-for="report in filteredReports" 
                            :key="report.id" 
                            class="list-group-item py-3"
                            style="background-color: #0D1117; border-bottom: 1px solid #3D434C;"
                        >
                            <div class="d-flex justify-content-between align-items-start mb-2">
                                <div>
                                    <h6 class="mb-1 d-flex align-items-center text-light">
                                        <span 
                                            :class="{
                                                'badge me-2': true,
                                                'text-bg-info': report.targetType === 'post',
                                                'text-bg-warning': report.targetType === 'project',
                                                'text-bg-danger': report.targetType === 'user',
                                            }"
                                        >
                                            {{ report.targetType }}
                                        </span>
                                        {{ report.targetTitle }}
                                    </h6>
                                    <p class="mb-1 small text-secondary">{{ report.reason }}</p>
                                    <small class="text-secondary">Reported by: {{ report.reporter }}</small>
                                </div>
                                <div class="ms-2">

                                </div>
                            </div>
                            <div class="d-flex gap-2">
                                <button 
                                    v-if="report.targetType === 'post'" 
                                    @click="deletePost(report)" 
                                    class="btn btn-sm btn-outline-danger"
                                >
                                    <i class="bi bi-trash me-1"></i> Delete Post
                                </button>
                                <button 
                                    v-if="report.targetType === 'project'" 
                                    @click="deleteProject(report)" 
                                    class="btn btn-sm btn-outline-danger"
                                >
                                    <i class="bi bi-trash me-1"></i> Delete Project
                                </button>

                                <button 
                                    @click="deleteReport(report.id)" 
                                    class="btn btn-sm btn-outline-secondary"
                                >
                                    <i class="bi bi-x-circle me-1"></i> Dismiss
                                </button>
                            </div>
                        </div>
                        
                        <div v-if="filteredReports.length === 0" class="list-group-item py-4 text-center" style="background-color: #0D1117; color: #8b949e;">
                            <i class="bi bi-shield-check fs-4 d-block mb-2"></i>
                            <p class="mb-0">No reports found matching your search.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <div v-else>
        <h1 class="text-center text-white mt-5">You're not supposed to access this page, go away!</h1>
    </div>
</template>

<script setup>
import MiniNavbar from '@/components/MiniNavbar.vue'
import { ref, onMounted, computed } from 'vue'
import { auth, db } from '@/firebase/config.js'

const usersList = ref([])
const reportsList = ref([])
const isMod = ref(false)

const userSearch = ref('');
const reportSearch = ref('');

const filteredUsers = computed(() => {
    return usersList.value.filter(
        user => {
            return user.username.toLowerCase().includes(userSearch.value.toLowerCase())
                || userSearch.value === ''
        }
    )
})

const filteredReports = computed(() => {
    return reportsList.value.filter(
        reports => {
            return reports.targetTitle.toLowerCase().includes(reportSearch.value.toLowerCase())
                || reportSearch.value === ''
        }
    )
})

onMounted(async () => {
    db.collection("users").doc(auth.currentUser.uid).get().then((doc) => {
    if (doc.exists) {
      isMod.value = doc.data().role === "moderator";
    }
    });
    if (auth.currentUser) {
        try {
            // fetch users
            const usersSnapshot = await db.collection('users').get();
            usersList.value = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            
            // fetch reports
            const reportsSnapshot = await db.collection('reports').get();
            reportsList.value = reportsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        } catch (error) {
            console.error('Error fetching user data:', error)
        }
    }
})

const banUser = async (userId) => {
    try{
        await db.collection('users').doc(userId).update({ role: "banned" })
        console.log('User banned successfully')
        
        // Update local state to reflect changes immediately
        const userIndex = usersList.value.findIndex(user => user.id === userId);
        if (userIndex !== -1) {
            usersList.value[userIndex].role = "banned";
        }
    } catch (error){
        console.error('Error banning user:', error)
    }
}

const unBanUser = async (userId) => {
    try{
        await db.collection('users').doc(userId).update({ role: "user" })
        console.log('User unbanned successfully')
        
        // Update local state to reflect changes immediately
        const userIndex = usersList.value.findIndex(user => user.id === userId);
        if (userIndex !== -1) {
            usersList.value[userIndex].role = "user";
        }
    } catch (error){
        console.error('Error unbanning user:', error)
    }
}

const deleteReport = async (reportId) => {
    try{
        await db.collection('reports').doc(reportId).delete()
        console.log('Report deleted successfully')
        
        // Remove report from local state
        reportsList.value = reportsList.value.filter(report => report.id !== reportId);
    } catch (error){
        console.error('Error deleting report:', error)
    }
}

const deletePost = async (report) => {
    try{
        await db.collection('publicFeed').doc(report.targetID).delete()
        console.log('Post deleted successfully')
        deleteReport(report.id)
    } catch (error){
        console.error('Error deleting post:', error)
    }
}

const deleteProject = async (report) => {
    try{
        const userRef = db.collection('users').doc(report.targetOwner);
        const projectRef = userRef.collection('projects').doc(report.targetID);
        await projectRef.delete();
        console.log('Project deleted successfully')
        deleteReport(report.id)
    }
    catch (error){
        console.error('Error deleting project:', error)
    }
}
</script>

<style scoped>
.dropdown-item:hover {
    background-color: #1a2433; /* slightly lighter than #0D1117 for hover effect */
}

.list-group-item:hover {
    background-color: #131922; /* subtle hover effect */
}

/* Style for making placeholder text lighter in dark inputs */
::placeholder {
    color: #8b949e !important;
    opacity: 0.7;
}

/* Custom scrollbar for the dark theme */
::-webkit-scrollbar {
    width: 8px;
}

::-webkit-scrollbar-track {
    background: #0D1117;
}

::-webkit-scrollbar-thumb {
    background: #3D434C;
    border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
    background: #475060;
}
</style>