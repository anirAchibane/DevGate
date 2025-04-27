<template>
    <div class="post-item">
        <div v-if="postloading || userloading">Loading...</div>
        <div v-else-if="posterror">Error loading post: {{ posterror }}</div>
        <div v-else-if="usererror">Error loading user: {{ usererror }}</div>
        <div v-else-if="post && user" class="post-content-wrapper">
            <div class="user-info">
                <img :src="user.avatar" alt="User Avatar" class="avatar" />
                <div class="text-inf">
                    <h3 class="username">{{ user.username }}</h3>
                    <p class="date">{{ formatDate(post.addedAt) }}</p>
                </div>
            </div>

            <div class="post-info">
                <div class="post-header">
                    <!-- <span class="post-type-badge" :class="'type-' + post.type">{{ post.type }}</span> -->
                    <h4 class="post-title">{{ post.summary }}</h4>
                </div>

                <!-- Common content for all post types -->
                <p class="post-content">{{ post.content }}</p>

                <!-- Type-specific content -->
                <div v-if="post.type === 'project'" class="project-details">
                    <div v-if="projectData" class="project-info">
                        <div class="stack-tags">
                            <span v-for="(tech, index) in projectData.stack" :key="index" class="stack-tag">
                                {{ tech }}
                            </span>
                        </div>
                        <div v-if="projectData.githubURL" class="github-link">
                            <a :href="projectData.githubURL" target="_blank" rel="noopener">
                                <i class="fab fa-github"></i> GitHub Repository
                            </a>
                        </div>
                    </div>
                </div>

                <div v-else-if="post.type === 'objective'" class="objective-details">
                    <div v-if="objectiveData" class="objective-info">
                        <div class="objective-status" :class="objectiveData.status">
                            Status: {{ objectiveData.status }}
                        </div>
                        <div class="objective-timeline">
                            <span>Started: {{ formatDate(objectiveData.startDate) }}</span>
                            <span>Last updated: {{ formatDate(objectiveData.lastUpdated) }}</span>
                        </div>
                    </div>
                </div>

                <div v-else-if="post.type === 'skill'" class="skill-details">
                    <div v-if="skillData" class="skill-info">
                        <div class="skill-level" :class="'level-' + skillData.level">
                            <i class="fas fa-chart-line"></i> {{ skillData.level }}
                        </div>
                        <div class="skill-dates">
                            <span>Acquired: {{ formatDate(skillData.acquiredAt) }}</span>
                        </div>
                    </div>
                </div>

                <div class="post-images" v-if="post.picture">
                    <img :src="post.picture" alt="Post Image" class="post-image" />
                </div>

            </div>
            <div class="comment">
                <button class="comment-btn" @click="showComments = !showComments">
                    <i class="fa-solid fa-comment-dots"></i> {{ showComments ? 'Hide Comments' : 'Comment' }}
                </button>
            </div>
            <transition name="comments-fade">
                <div v-if="showComments" class="comments-section">
                    <comments-item :postId="post.id" />
                </div>
            </transition>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, watch, defineProps } from 'vue'
import { getUser } from '@/composables/getUser'
import { getPost } from '@/composables/getPost'
import CommentsItem from '@/components/CommentsItem'
import { db } from '@/firebase/config'
// import router from '@/router'

// Define props using the script setup syntax
const props = defineProps({
    postId: {
        type: String,
        required: true
    }
})

// State variables
const showComments = ref(false)
const post = ref(null)
const posterror = ref(null)
const postloading = ref(true)
const user = ref(null)
const usererror = ref(null)
const userloading = ref(true)

// Additional data based on post type
const projectData = ref(null)
const objectiveData = ref(null)
const skillData = ref(null)

onMounted(() => {
    // Get post data with the composable
    const { post: postData, error: postErr, loading: postLoad } = getPost(props.postId)

    // Watch for post data changes
    watch(postData, (newPost) => {
        if (newPost) {
            post.value = newPost

            // Only fetch user data once we have the post with the user ID
            if (newPost.uid) {
                fetchUserData(newPost.uid)

                // If post has reference to an original item (pid), fetch type-specific data
                if (newPost.pid && newPost.type) {
                    fetchTypeSpecificData(newPost.uid, newPost.pid, newPost.type)
                }
            } else {
                usererror.value = "Post does not contain user ID"
                userloading.value = false
            }
        }
    })

    // Watch for post errors
    watch(postErr, (error) => {
        if (error) {
            posterror.value = error
        }
    })

    // Watch for post loading state
    watch(postLoad, (loading) => {
        postloading.value = loading
    })
})

// Function to fetch user data once we have the post
function fetchUserData(userId) {
    const { userData, error: userErr, loading: userLoad } = getUser(userId)

    // Watch for user data changes
    watch(userData, (newUserData) => {
        if (newUserData) {
            user.value = newUserData
        }
    })

    // Watch for user errors
    watch(userErr, (error) => {
        if (error) {
            usererror.value = error
        }
    })

    // Watch for user loading state
    watch(userLoad, (loading) => {
        userloading.value = loading
    })
}

// Function to fetch type-specific data from user subcollections
function fetchTypeSpecificData(userId, itemId, type) {
    let collection = null

    // Determine which collection to fetch from based on post type
    switch (type) {
        case 'project':
            collection = 'projects'
            break
        case 'objective':
            collection = 'objectives'
            break
        case 'skill':
            collection = 'skills'
            break
        default:
            // Text type doesn't need additional data
            return
    }

    if (!collection) return

    db.collection('users')
        .doc(userId)
        .collection(collection)
        .doc(itemId)
        .get()
        .then((doc) => {
            if (doc.exists) {
                const data = doc.data()

                // Store data in appropriate ref based on type
                switch (type) {
                    case 'project':
                        projectData.value = data
                        break
                    case 'objective':
                        objectiveData.value = data
                        break
                    case 'skill':
                        skillData.value = data
                        break
                }
            } else {
                console.error(`No ${type} found with ID: ${itemId}`)
            }
        })
        .catch((err) => {
            console.error(`Error fetching ${type} data:`, err)
        })
}

// Helper function to format dates
function formatDate(timestamp) {
    if (!timestamp) return 'Unknown date'

    let date
    if (timestamp.seconds) {
        // Firebase timestamp format
        date = new Date(timestamp.seconds * 1000)
    } else {
        // Regular date format
        date = new Date(timestamp)
    }

    return date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    })
}
</script>



<style scoped>
.post-item {
    background-color: #0D1117;
    border: 1px solid #555d69;
    border-radius: 8px;
    margin-bottom: 1.5rem;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
    transition: transform 0.3s ease, box-shadow 0.3s ease;
    padding: 1rem;
}

.post-item:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 12px rgba(0, 0, 0, 0.25);
    border-color: #6e7683;
}

.post-content-wrapper {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.user-info {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 0.5rem;
    padding: 1.5rem;
}

.avatar {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid #3498db;
}

.text-inf {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
}

.username {
    margin: 0;
    color: #ffffff;
    font-size: 1.1rem;
    font-weight: 600;
}

.date {
    margin: 0;
    color: #7d8796;
    font-size: 0.85rem;
}

.post-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 0.75rem;
}

.post-type-badge {
    padding: 0.25rem 0.75rem;
    border-radius: 20px;
    font-size: 0.8rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

/* .type-project {
    background-color: rgba(52, 152, 219, 0.15);
    color: #5dade2;
    border: 1px solid rgba(52, 152, 219, 0.3);
}

.type-objective {
    background-color: rgba(241, 196, 15, 0.15);
    color: #f4d03f;
    border: 1px solid rgba(241, 196, 15, 0.3);
}

.type-skill {
    background-color: rgba(46, 204, 113, 0.15);
    color: #58d68d;
    border: 1px solid rgba(46, 204, 113, 0.3);
}

.type-text {
    background-color: rgba(155, 89, 182, 0.15);
    color: #bb8fce;
    border: 1px solid rgba(155, 89, 182, 0.3);
} */

.post-info {
    color: #ffffff;
}

.post-title {
    margin: 0 0 0.5rem 0;
    font-size: 1.25rem;
    font-weight: 600;
    color: #ffffff;
}

.post-content {
    margin-bottom: 1rem;
    color: #cfd8dc;
    line-height: 1.5;
    text-align: left;
}

/* Project specific styles */
.project-details {
    background-color: #010508;
    border: 1px solid rgba(52, 152, 219, 0.2);
    border-radius: 6px;
    padding: 1rem;
    margin: 0.5rem 0;
}

.stack-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-bottom: 0.75rem;
}

.stack-tag {
    background-color: rgba(52, 152, 219, 0.15);
    color: #5dade2;
    border: 1px solid rgba(52, 152, 219, 0.3);
    border-radius: 4px;
    padding: 0.25rem 0.5rem;
    font-size: 0.8rem;
    font-weight: 500;
}

.github-link a {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    color: #3498db;
    text-decoration: none;
    font-weight: 500;
    transition: all 0.2s ease;
}

.github-link a:hover {
    color: #5dade2;
    text-decoration: underline;
}

/* Objective specific styles */
.objective-details {
    background-color: #010508;
    border: 1px solid rgba(241, 196, 15, 0.2);
    border-radius: 6px;
    padding: 1rem;
    margin: 0.5rem 0;
}

.objective-status {
    display: inline-block;
    padding: 0.25rem 0.75rem;
    border-radius: 4px;
    font-weight: 500;
    margin-bottom: 0.75rem;
}

.objective-status.completed {
    background-color: rgba(46, 204, 113, 0.15);
    color: #58d68d;
    border: 1px solid rgba(46, 204, 113, 0.3);
}

.objective-status.in-progress {
    background-color: rgba(241, 196, 15, 0.15);
    color: #f4d03f;
    border: 1px solid rgba(241, 196, 15, 0.3);
}

.objective-status.not-started {
    background-color: rgba(231, 76, 60, 0.15);
    color: #e57373;
    border: 1px solid rgba(231, 76, 60, 0.3);
}

.objective-timeline {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    color: #8d99a6;
    font-size: 0.9rem;
}

/* Skill specific styles */
.skill-details {
    background-color: #010508;
    border: 1px solid rgba(46, 204, 113, 0.2);
    border-radius: 6px;
    padding: 1rem;
    margin: 0.5rem 0;
}

.skill-level {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.25rem 0.75rem;
    border-radius: 4px;
    font-weight: 500;
    margin-bottom: 0.75rem;
}

.level-beginner {
    background-color: rgba(52, 152, 219, 0.15);
    color: #5dade2;
    border: 1px solid rgba(52, 152, 219, 0.3);
}

.level-intermediate {
    background-color: rgba(241, 196, 15, 0.15);
    color: #f4d03f;
    border: 1px solid rgba(241, 196, 15, 0.3);
}

.level-advanced {
    background-color: rgba(46, 204, 113, 0.15);
    color: #58d68d;
    border: 1px solid rgba(46, 204, 113, 0.3);
}

.level-expert {
    background-color: rgba(155, 89, 182, 0.15);
    color: #bb8fce;
    border: 1px solid rgba(155, 89, 182, 0.3);
}

.skill-dates {
    color: #8d99a6;
    font-size: 0.9rem;
}

/* Post images */
.post-images {
    margin-top: 1rem;
    width: 100%;
}

.post-image {
    max-width: 100%;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    border: 1px solid #555d69;
}

.comment-btn {
    background-color: #0D1117;
    width: 50%;
    color: white;
    border: 1px solid #3498db;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    cursor: pointer;
    font-size: 1rem;
    /* transition: background-color 0.3s ease, transform 0.3s ease; */
    text-align: center;
    align-self: center;
    /* margin-bottom: 1rem; */
}

.comment-btn:hover {
    background-color: #2980b9;
    transform: translateY(-2px);
}

/* Comments section styling */
.comments-section {
    max-height: 800px;
    overflow: hidden;
    margin-top: 1rem;
    border-top: 1px solid #1e2a38;
    padding-top: 1rem;
}

/* Enhanced transitions for comments */
.comments-fade-enter-active {
    transition: all 0.5s ease-out;
    max-height: 800px;
    transform-origin: top;
}

.comments-fade-leave-active {
    transition: all 0.5s ease-in;
    max-height: 800px;
    transform-origin: top;
}

.comments-fade-enter-from,
.comments-fade-leave-to {
    opacity: 0;
    max-height: 0;
    transform: scaleY(0.8);
}

.comment {
    display: flex;
    justify-content: center;
    margin: 1rem 0;
}

/* Responsive styles */
@media (max-width: 768px) {
    .post-item {
        padding: 1rem;
    }

    .post-title {
        font-size: 1.1rem;
    }

    .username {
        font-size: 1rem;
    }

    .avatar {
        width: 40px;
        height: 40px;
    }

    .comments-section {
        max-height: 600px;
    }
}
</style>