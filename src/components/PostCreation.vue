<template>
    <div class="post-creation-card">
        <div class="post-input-area">
            <div class="user-avatar">
                <img
                    :src="userAvatar || require('@/assets/default_pfp.jpg')"
                    alt="User Avatar"
                />
            </div>
            <div class="post-input" @click="createDefaultPost">
                <span>Start a post</span>
            </div>
        </div>
        <div class="post-actions">
            <button class="post-action-btn" @click="openObjectiveSelector">
                <i class="fas fa-bullseye"></i>
                <span>Objective</span>
            </button>
            <button class="post-action-btn" @click="openSkillSelector">
                <i class="fas fa-certificate"></i>
                <span>Skill</span>
            </button>
            <button class="post-action-btn" @click="openProjectSelector">
                <i class="fas fa-code-branch"></i>
                <span>Project</span>
            </button>
        </div>
    </div>

    <!-- Modals for selecting content -->
    <div
        v-if="showObjectiveModal"
        class="selection-modal-overlay"
        @click="closeAllModals"
    >
        <div class="selection-modal" @click.stop>
            <div class="modal-header">
                <h3>Select an Objective</h3>
                <button class="close-btn" @click="closeAllModals">
                    &times;
                </button>
            </div>
            <div v-if="loadingUserItems" class="modal-loading">
                <div class="spinner"></div>
                <p>Loading your objectives...</p>
            </div>
            <div v-else-if="objectives.length === 0" class="no-items-message">
                <p>
                    You don't have any objectives yet. Create one in your
                    profile first.
                </p>
            </div>
            <div v-else class="items-list">
                <div
                    v-for="objective in objectives"
                    :key="objective.id"
                    class="item-card"
                    @click="createPostFromItem(objective, 'objective')"
                >
                    <h4>{{ objective.title }}</h4>
                    <p><strong>Status:</strong> {{ objective.status }}</p>
                    <p>
                        <strong>Started:</strong>
                        {{ formatDate(objective.startDate) }}
                    </p>
                    <p>
                        <strong>Last Updated:</strong>
                        {{ formatDate(objective.lastUpdated) }}
                    </p>
                </div>
            </div>
        </div>
    </div>

    <div
        v-if="showSkillModal"
        class="selection-modal-overlay"
        @click="closeAllModals"
    >
        <div class="selection-modal" @click.stop>
            <div class="modal-header">
                <h3>Select a Skill</h3>
                <button class="close-btn" @click="closeAllModals">
                    &times;
                </button>
            </div>
            <div v-if="loadingUserItems" class="modal-loading">
                <div class="spinner"></div>
                <p>Loading your skills...</p>
            </div>
            <div v-else-if="skills.length === 0" class="no-items-message">
                <p>
                    You don't have any skills yet. Add some in your profile
                    first.
                </p>
            </div>
            <div v-else class="items-list">
                <div
                    v-for="skill in skills"
                    :key="skill.id"
                    class="item-card"
                    @click="createPostFromItem(skill, 'skill')"
                >
                    <h4>{{ skill.name }}</h4>
                    <p><strong>Level:</strong> {{ skill.level }}</p>
                    <p>
                        <strong>Acquired:</strong>
                        {{ formatDate(skill.acquiredAt) }}
                    </p>
                </div>
            </div>
        </div>
    </div>

    <div
        v-if="showProjectModal"
        class="selection-modal-overlay"
        @click="closeAllModals"
    >
        <div class="selection-modal" @click.stop>
            <div class="modal-header">
                <h3>Select a Project</h3>
                <button class="close-btn" @click="closeAllModals">
                    &times;
                </button>
            </div>
            <div v-if="loadingUserItems" class="modal-loading">
                <div class="spinner"></div>
                <p>Loading your projects...</p>
            </div>
            <div v-else-if="projects.length === 0" class="no-items-message">
                <p>
                    You don't have any projects yet. Create one in your profile
                    first.
                </p>
            </div>
            <div v-else class="items-list">
                <div
                    v-for="project in projects"
                    :key="project.id"
                    class="item-card"
                    @click="createPostFromItem(project, 'project')"
                >
                    <h4>{{ project.title }}</h4>
                    <p>{{ project.description }}</p>
                    <p v-if="project.stack && project.stack.length">
                        <strong>Stack:</strong> {{ project.stack.join(", ") }}
                    </p>
                </div>
            </div>
        </div>
    </div>

    <!-- Post customization modal -->
    <div
        v-if="showCustomizationModal"
        class="selection-modal-overlay"
        @click="closeCustomizationModal"
    >
        <div class="selection-modal customization-modal" @click.stop>
            <div class="modal-header">
                <h3>
                    Customize Your
                    {{
                        currentItemType
                            ? currentItemType.charAt(0).toUpperCase() +
                              currentItemType.slice(1)
                            : ""
                    }}
                    Post
                </h3>
                <button class="close-btn" @click="closeCustomizationModal">
                    &times;
                </button>
            </div>

            <div class="modal-body">
                <!-- Item preview -->
                <div class="selected-item-preview">
                    <div
                        v-if="currentItemType === 'objective'"
                        class="item-preview"
                    >
                        <h4>{{ currentItem?.title }}</h4>
                        <p>
                            <strong>Status:</strong> {{ currentItem?.status }}
                        </p>
                    </div>
                    <div
                        v-else-if="currentItemType === 'skill'"
                        class="item-preview"
                    >
                        <h4>{{ currentItem?.name }}</h4>
                        <p><strong>Level:</strong> {{ currentItem?.level }}</p>
                    </div>
                    <div
                        v-else-if="currentItemType === 'project'"
                        class="item-preview"
                    >
                        <h4>{{ currentItem?.title }}</h4>
                        <p
                            v-if="
                                currentItem?.stack && currentItem.stack.length
                            "
                        >
                            <strong>Stack:</strong>
                            {{ currentItem.stack.join(", ") }}
                        </p>
                    </div>
                </div>

                <!-- Custom text area -->
                <div class="form-group">
                    <label for="custom-text">Add your thoughts</label>
                    <textarea
                        id="custom-text"
                        v-model="customPostText"
                        placeholder="Share your thoughts about this..."
                        class="custom-text-area"
                        rows="4"
                    ></textarea>
                </div>

                <!-- Image upload -->
                <div class="form-group">
                    <label>Add an image</label>
                    <div class="image-upload-container">
                        <label for="post-image" class="image-upload-btn">
                            <i class="fas fa-image"></i>
                            Select Image
                        </label>
                        <input
                            type="file"
                            id="post-image"
                            accept="image/*"
                            @change="handleImageUpload"
                            class="file-input"
                        />
                    </div>

                    <div v-if="uploadingImage" class="upload-status">
                        <div class="spinner small-spinner"></div>
                        <span>Uploading image...</span>
                    </div>

                    <div v-if="postImage" class="image-preview">
                        <img :src="postImage" alt="Post image preview" />
                        <button class="remove-image-btn" @click="removeImage">
                            &times;
                        </button>
                    </div>
                </div>

                <!-- Tags/Skills section (for projects) -->
                <div v-if="currentItemType === 'project'" class="form-group">
                    <label>Add skills related to this project</label>
                    <div class="tags-input-container">
                        <input
                            type="text"
                            v-model="customTagInput"
                            @keyup.enter="addTag"
                            placeholder="Enter a skill and press Enter"
                            class="tag-input"
                        />
                        <button class="add-tag-btn" @click="addTag">
                            Add Skill
                        </button>
                    </div>

                    <div v-if="customTags.length > 0" class="tags-container">
                        <span
                            v-for="(tag, index) in customTags"
                            :key="index"
                            class="tag"
                        >
                            {{ tag }}
                            <button
                                class="remove-tag-btn"
                                @click="removeTag(index)"
                            >
                                &times;
                            </button>
                        </span>
                    </div>
                </div>
            </div>

            <div class="modal-footer">
                <button class="cancel-btn" @click="closeCustomizationModal">
                    Cancel
                </button>
                <button
                    class="post-btn"
                    @click="saveCustomizedPost"
                    :disabled="savingPost || uploadingImage"
                >
                    {{ savingPost ? "Posting..." : "Post" }}
                </button>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, defineProps, defineEmits } from "vue";
import { db } from "@/firebase/config";
import firebase from "firebase/app";
import { uploadToGitHub } from "@/composables/uploadToGitHub";
import { useRouter } from "vue-router";

const props = defineProps({
    userAvatar: {
        type: String,
        default: null,
    },
    userId: {
        type: String,
        required: true,
    },
});

const emit = defineEmits(["open-post-modal", "post-created"]);

// Modal state
const showObjectiveModal = ref(false);
const showSkillModal = ref(false);
const showProjectModal = ref(false);
const loadingUserItems = ref(false);
const router = useRouter();

// User items
const objectives = ref([]);
const skills = ref([]);
const projects = ref([]);

// Customization modal state
const showCustomizationModal = ref(false);
const currentItem = ref(null);
const currentItemType = ref("");
const currentItemCollection = ref(""); // Reference to store the collection type
const customPostText = ref("");
const postImage = ref(null);
const uploadingImage = ref(false);
const customTags = ref([]);
const customTagInput = ref("");
const savingPost = ref(false);

// Function to create a default text post
const createDefaultPost = () => {
    // Instead of creating the post immediately, just emit an event to open the post modal
    emit("open-post-modal", {
        initialContent: "Enter your post content here...",
        reload: true, // Add flag to indicate page should reload after post creation
    });
};

// Functions to open selector modals
const openObjectiveSelector = async () => {
    showObjectiveModal.value = true;
    await fetchUserObjectives();
};

const openSkillSelector = async () => {
    showSkillModal.value = true;
    await fetchUserSkills();
};

const openProjectSelector = async () => {
    showProjectModal.value = true;
    await fetchUserProjects();
};

// Close all modals
const closeAllModals = () => {
    showObjectiveModal.value = false;
    showSkillModal.value = false;
    showProjectModal.value = false;
};

// Fetch user's objectives from Firestore
const fetchUserObjectives = async () => {
    if (objectives.value.length > 0) return;

    loadingUserItems.value = true;
    try {
        const snapshot = await db
            .collection("users")
            .doc(props.userId)
            .collection("objectives")
            .get();

        objectives.value = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));
    } catch (error) {
        console.error("Error fetching objectives:", error);
    } finally {
        loadingUserItems.value = false;
    }
};

// Fetch user's skills from Firestore
const fetchUserSkills = async () => {
    if (skills.value.length > 0) return;

    loadingUserItems.value = true;
    try {
        const snapshot = await db
            .collection("users")
            .doc(props.userId)
            .collection("skills")
            .get();

        skills.value = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));
    } catch (error) {
        console.error("Error fetching skills:", error);
    } finally {
        loadingUserItems.value = false;
    }
};

// Fetch user's projects from Firestore
const fetchUserProjects = async () => {
    if (projects.value.length > 0) return;

    loadingUserItems.value = true;
    try {
        const snapshot = await db
            .collection("users")
            .doc(props.userId)
            .collection("projects")
            .get();

        projects.value = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));
    } catch (error) {
        console.error("Error fetching projects:", error);
    } finally {
        loadingUserItems.value = false;
    }
};

// Modified: Now shows customization modal instead of creating post immediately
const createPostFromItem = (item, type) => {
    // Set current item and type
    currentItem.value = item;
    currentItemType.value = type;

    // Set default custom text based on type
    let defaultText = "";
    if (type === "objective") {
        defaultText = `I'm working on my objective: ${item.title}`;
    } else if (type === "skill") {
        defaultText = `I've been developing my ${item.name} skill`;
    } else if (type === "project") {
        defaultText = `Check out my project: ${item.title}`;
    }

    // Reset customization values
    customPostText.value = defaultText;
    postImage.value = null;
    customTags.value = item.stack && type === "project" ? [...item.stack] : [];
    customTagInput.value = "";

    // Update item's visibility to public if not already set
    console.log("Updating visibility for item:", item, "type:", type);
    let collectionType = null;
    if (type === "objective") {
        collectionType = "objectives";
    } else if (type === "skill") {
        collectionType = "skills";
    } else if (type === "project") {
        collectionType = "projects";
    }

    // Store the collection type for later use when posting
    // but don't update visibility yet
    currentItemCollection.value = collectionType;

    // Close selection modals and open customization modal
    closeAllModals();
    showCustomizationModal.value = true;
};

// Close customization modal and reset values
const closeCustomizationModal = () => {
    if (savingPost.value || uploadingImage.value) return;

    showCustomizationModal.value = false;
    currentItem.value = null;
    currentItemType.value = "";
    customPostText.value = "";
    postImage.value = null;
    customTags.value = [];
    customTagInput.value = "";
};

// Handle image upload for posts
const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    uploadingImage.value = true;

    try {
        // Generate a unique filename for the post image
        const fileName = `posts-imgs/${Date.now()}-${file.name}`;

        // Upload the image to GitHub
        const downloadURL = await uploadToGitHub(file, fileName);

        // Set the image URL
        postImage.value = downloadURL;
    } catch (error) {
        console.error("Error uploading image:", error);
        alert("Error uploading image. Please try again.");
    } finally {
        uploadingImage.value = false;
    }
};

// Remove image from post
const removeImage = () => {
    postImage.value = null;
};

// Add a tag to the custom tags list
const addTag = () => {
    if (!customTagInput.value.trim()) return;

    // Don't add duplicate tags
    if (!customTags.value.includes(customTagInput.value.trim())) {
        customTags.value.push(customTagInput.value.trim());
    }

    customTagInput.value = "";
};

// Remove a tag from the custom tags list
const removeTag = (index) => {
    customTags.value.splice(index, 1);
};

// Save the customized post
const saveCustomizedPost = async () => {
    if (savingPost.value || uploadingImage.value) return;

    savingPost.value = true;

    try {
        // Ensure the item's visibility is set to public
        let collectionType = currentItemCollection.value;

        // Update visibility to public
        if (currentItem.value && collectionType) {
            await db
                .collection("users")
                .doc(props.userId)
                .collection(collectionType)
                .doc(currentItem.value.id)
                .update({ visibility: true });

            console.log(
                `${currentItemType.value} visibility set to public for post creation`
            );

            // Show alert that visibility has been set to public
            alert(
                `${
                    currentItemType.value.charAt(0).toUpperCase() +
                    currentItemType.value.slice(1)
                } visibility set to public`
            );
        }

        let summary = "";

        // Create appropriate summary based on item type
        if (currentItemType.value === "objective") {
            summary = `Objective: ${currentItem.value.title} - Status: ${currentItem.value.status}`;
        } else if (currentItemType.value === "skill") {
            summary = `Skill: ${currentItem.value.name} - Level: ${currentItem.value.level}`;
        } else if (currentItemType.value === "project") {
            summary = `Project: ${currentItem.value.title}`;
            if (customTags.value && customTags.value.length) {
                summary += ` - Stack: ${customTags.value.join(", ")}`;
            }
        }

        // Create post data object
        const postData = {
            addedAt: firebase.firestore.FieldValue.serverTimestamp(),
            content:
                customPostText.value ||
                `I've shared my ${currentItemType.value}`,
            summary: summary,
            type: currentItemType.value,
            pid: currentItem.value.id,
            uid: props.userId,
            picture: postImage.value || "",
        };

        // Add custom tags for projects
        if (
            currentItemType.value === "project" &&
            customTags.value.length > 0
        ) {
            postData.tags = customTags.value;
        }

        // Add post to public feed
        const docRef = await db.collection("publicFeed").add(postData);

        console.log(
            `Customized ${currentItemType.value} post created with ID:`,
            docRef.id
        );

        // Close all modals and reset values
        showObjectiveModal.value = false;
        showSkillModal.value = false;
        showProjectModal.value = false;
        showCustomizationModal.value = false;

        // Reset all state
        currentItem.value = null;
        currentItemType.value = "";
        customPostText.value = "";
        postImage.value = null;
        customTags.value = [];
        customTagInput.value = "";

        // Emit event to notify parent component
        emit("post-created", docRef.id);

        // Redirect to home page after post creation with reload flag
        router.push("/home");
    } catch (error) {
        console.error(`Error creating customized post:`, error);
        alert("Error creating post. Please try again.");
    } finally {
        savingPost.value = false;
    }
};

// Helper function to format dates
const formatDate = (timestamp) => {
    if (!timestamp) return "N/A";

    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
};
</script>

<style scoped>
.post-creation-card {
    background-color: #1a2233;
    border-radius: 10px;
    padding: 20px;
    border: 1px solid #555d69;
    box-shadow: 0 6px 15px rgba(0, 0, 0, 0.3);
    transition: transform 0.3s ease, box-shadow 0.3s ease;
    margin-bottom: 20px;
}

.post-creation-card:hover {
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.4);
    border-color: #3498db;
}

.post-input-area {
    display: flex;
    align-items: center;
    gap: 15px;
    margin-bottom: 15px;
}

.user-avatar {
    width: 50px;
    height: 50px;
    border-radius: 50%;
    overflow: hidden;
    transition: transform 0.3s ease;
    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.3);
}

.user-avatar:hover {
    transform: scale(1.05);
}

.user-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border: 2px solid #3498db;
    transition: border-color 0.3s ease;
}

.post-input {
    flex: 1;
    background-color: #10151f;
    border: 1px solid #555d69;
    border-radius: 30px;
    padding: 14px 20px;
    color: #cfd8dc;
    cursor: pointer;
    transition: all 0.3s ease;
    font-size: 1rem;
}

.post-input:hover {
    background-color: #0d1117;
    border-color: #3498db;
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(52, 152, 219, 0.2);
}

.post-actions {
    display: flex;
    justify-content: space-around;
    margin-top: 5px;
    border-top: 1px solid rgba(85, 93, 105, 0.3);
    padding-top: 15px;
}

.post-action-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    background: none;
    border: none;
    color: #cfd8dc;
    padding: 10px 16px;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
}

.post-action-btn::before {
    content: "";
    position: absolute;
    top: 50%;
    left: 50%;
    width: 0;
    height: 0;
    background-color: rgba(52, 152, 219, 0.1);
    border-radius: 50%;
    transform: translate(-50%, -50%);
    transition: width 0.5s ease, height 0.5s ease;
    z-index: -1;
}

.post-action-btn:hover {
    color: #3498db;
    transform: translateY(-2px);
}

.post-action-btn:hover::before {
    width: 200px;
    height: 200px;
}

.post-action-btn i {
    font-size: 18px;
    transition: transform 0.3s ease;
}

.post-action-btn:hover i {
    transform: scale(1.2);
}

/* Modal styles */
.selection-modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.8);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
    animation: fadeIn 0.3s ease;
    backdrop-filter: blur(3px);
}

@keyframes fadeIn {
    from {
        opacity: 0;
    }
    to {
        opacity: 1;
    }
}

.selection-modal {
    background-color: #1a2233;
    border-radius: 12px;
    width: 90%;
    max-width: 600px;
    max-height: 80vh;
    overflow-y: auto;
    box-shadow: 0 6px 30px rgba(0, 0, 0, 0.5);
    padding: 25px;
    color: #cfd8dc;
    animation: slideUp 0.4s ease;
    border: 1px solid #3498db;
}

@keyframes slideUp {
    from {
        opacity: 0;
        transform: translateY(40px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding-bottom: 15px;
    border-bottom: 1px solid #3498db;
}

.modal-header h3 {
    margin: 0;
    color: #3498db;
    font-size: 1.5rem;
    font-weight: 600;
}

.close-btn {
    background: none;
    border: none;
    font-size: 24px;
    color: #cfd8dc;
    cursor: pointer;
    transition: all 0.3s ease;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
}

.close-btn:hover {
    color: #e74c3c;
    background-color: rgba(231, 76, 60, 0.1);
    transform: rotate(90deg);
}

.modal-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px;
}

.spinner {
    width: 50px;
    height: 50px;
    border: 5px solid rgba(52, 152, 219, 0.1);
    border-radius: 50%;
    border-top-color: #3498db;
    animation: spin 1s ease-in-out infinite;
    margin-bottom: 20px;
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}

.no-items-message {
    text-align: center;
    padding: 30px 20px;
    color: #b0bec5;
    background-color: rgba(255, 255, 255, 0.03);
    border-radius: 8px;
    border: 1px dashed #555d69;
}

.no-items-message p {
    font-size: 1.1rem;
    margin-bottom: 0;
}

.items-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 15px;
    max-height: 60vh;
    overflow-y: auto;
    padding: 5px;
    margin-right: -5px;
    scrollbar-width: thin;
    scrollbar-color: #3498db #10151f;
}

.items-list::-webkit-scrollbar {
    width: 8px;
}

.items-list::-webkit-scrollbar-track {
    background: #10151f;
    border-radius: 4px;
}

.items-list::-webkit-scrollbar-thumb {
    background-color: #3498db;
    border-radius: 4px;
}

.item-card {
    background-color: #10151f;
    border-radius: 10px;
    padding: 18px;
    border: 1px solid #555d69;
    cursor: pointer;
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
}

.item-card::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 4px;
    height: 0;
    background-color: #3498db;
    transition: height 0.3s ease;
}

.item-card:hover {
    transform: translateY(-5px) scale(1.02);
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.25);
    border-color: #3498db;
}

.item-card:hover::before {
    height: 100%;
}

.item-card h4 {
    margin-top: 0;
    margin-bottom: 12px;
    color: #3498db;
    font-size: 1.2rem;
    font-weight: 600;
    transition: transform 0.3s ease;
}

.item-card:hover h4 {
    transform: translateX(5px);
}

.item-card p {
    margin: 8px 0;
    font-size: 0.95em;
    transition: opacity 0.3s ease;
}

/* Customization modal styles */
.customization-modal {
    max-width: 700px;
}

.modal-body {
    display: flex;
    flex-direction: column;
    gap: 25px;
}

.selected-item-preview {
    background-color: #10151f;
    border-radius: 10px;
    padding: 20px;
    border: 1px solid #3498db;
    margin-bottom: 5px;
    transition: transform 0.3s ease, box-shadow 0.3s ease;
    box-shadow: 0 4px 10px rgba(52, 152, 219, 0.1);
}

.selected-item-preview:hover {
    transform: translateY(-3px);
    box-shadow: 0 6px 15px rgba(52, 152, 219, 0.2);
}

.item-preview h4 {
    margin-top: 0;
    margin-bottom: 15px;
    color: #3498db;
    font-size: 1.3rem;
    font-weight: 600;
}

.form-group {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.form-group label {
    font-weight: 600;
    color: #cfd8dc;
    font-size: 1.1rem;
}

.custom-text-area {
    width: 100%;
    padding: 15px;
    border-radius: 10px;
    border: 1px solid #555d69;
    background-color: #10151f;
    color: #ffffff;
    resize: vertical;
    font-family: inherit;
    font-size: 1rem;
    min-height: 120px;
    transition: all 0.3s ease;
}

.custom-text-area:focus {
    border-color: #3498db;
    outline: none;
    box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.2);
}

.image-upload-container {
    display: flex;
    gap: 15px;
    align-items: center;
}

.image-upload-btn {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    padding: 12px 20px;
    background-color: #3498db;
    color: white;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s ease;
    font-weight: 500;
    letter-spacing: 0.3px;
}

.image-upload-btn:hover {
    background-color: #2980b9;
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(52, 152, 219, 0.3);
}

.file-input {
    display: none;
}

.upload-status {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-top: 15px;
    background-color: rgba(52, 152, 219, 0.1);
    padding: 10px 15px;
    border-radius: 6px;
    border: 1px dashed #3498db;
}

.small-spinner {
    width: 24px;
    height: 24px;
    border: 3px solid rgba(52, 152, 219, 0.1);
    border-radius: 50%;
    border-top-color: #3498db;
    animation: spin 1s ease-in-out infinite;
}

.image-preview {
    position: relative;
    margin-top: 15px;
    max-width: 100%;
    border-radius: 10px;
    overflow: hidden;
    border: 1px solid #555d69;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
    transition: transform 0.3s ease;
}

.image-preview:hover {
    transform: scale(1.02);
}

.image-preview img {
    width: 100%;
    display: block;
    transition: filter 0.3s ease;
}

.image-preview:hover img {
    filter: brightness(1.1);
}

.remove-image-btn {
    position: absolute;
    top: 10px;
    right: 10px;
    width: 30px;
    height: 30px;
    border-radius: 50%;
    background-color: rgba(231, 76, 60, 0.9);
    color: white;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    font-size: 16px;
    transition: all 0.3s ease;
}

.remove-image-btn:hover {
    background-color: #e74c3c;
    transform: rotate(90deg);
}

.tags-input-container {
    display: flex;
    gap: 10px;
}

.tag-input {
    flex: 1;
    padding: 12px 15px;
    border-radius: 8px;
    border: 1px solid #555d69;
    background-color: #10151f;
    color: #ffffff;
    font-size: 1rem;
    transition: all 0.3s ease;
}

.tag-input:focus {
    border-color: #3498db;
    outline: none;
    box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.2);
}

.add-tag-btn {
    padding: 12px 20px;
    background-color: #3498db;
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s ease;
    font-weight: 500;
}

.add-tag-btn:hover {
    background-color: #2980b9;
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(52, 152, 219, 0.3);
}

.tags-container {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-top: 15px;
}

.tag {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 15px;
    background-color: #3498db;
    color: white;
    border-radius: 30px;
    font-size: 0.95rem;
    transition: all 0.3s ease;
    box-shadow: 0 2px 5px rgba(52, 152, 219, 0.3);
}

.tag:hover {
    background-color: #2980b9;
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(52, 152, 219, 0.4);
}

.remove-tag-btn {
    border: none;
    background: none;
    color: white;
    cursor: pointer;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    transition: all 0.3s ease;
}

.remove-tag-btn:hover {
    transform: rotate(90deg);
}

.modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 15px;
    margin-top: 25px;
    padding-top: 20px;
    border-top: 1px solid #555d69;
}

.cancel-btn {
    padding: 12px 25px;
    background-color: transparent;
    border: 1px solid #555d69;
    color: #cfd8dc;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s ease;
    font-weight: 500;
    letter-spacing: 0.3px;
}

.cancel-btn:hover {
    background-color: rgba(255, 255, 255, 0.05);
    border-color: #cfd8dc;
    transform: translateY(-2px);
}

.post-btn {
    padding: 12px 30px;
    background-color: #3498db;
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s ease;
    font-weight: 600;
    letter-spacing: 0.5px;
}

.post-btn:hover {
    background-color: #2980b9;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(52, 152, 219, 0.4);
}

.post-btn:disabled {
    background-color: #555d69;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
}

/* Responsive adjustments */
@media (max-width: 768px) {
    .post-actions {
        flex-wrap: wrap;
    }

    .post-action-btn {
        flex: 1;
        min-width: 100px;
        justify-content: center;
    }

    .selection-modal {
        width: 95%;
        padding: 20px;
    }

    .items-list {
        grid-template-columns: 1fr;
    }

    .image-upload-container {
        flex-direction: column;
        align-items: flex-start;
    }

    .image-upload-btn {
        width: 100%;
        justify-content: center;
    }

    .tag-input {
        width: 100%;
    }

    .tags-input-container {
        flex-direction: column;
    }

    .add-tag-btn {
        width: 100%;
    }

    .modal-footer {
        flex-direction: column;
    }

    .cancel-btn,
    .post-btn {
        width: 100%;
    }
}
</style>
