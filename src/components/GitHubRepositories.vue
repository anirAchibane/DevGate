<template>
    <div class="github-repositories">
        <div v-if="isLoading" class="loading-state">
            <p>
                <i class="fas fa-spinner fa-spin"></i> Loading repositories...
            </p>
        </div>

        <div v-else-if="error" class="error-state">
            <p><i class="fas fa-exclamation-triangle"></i> {{ error }}</p>
            <button
                @click="loadRepositories"
                class="btn btn-outline-primary btn-sm"
            >
                <i class="fas fa-sync"></i> Try Again
            </button>
        </div>

        <div v-else-if="repositories.length === 0" class="empty-state">
            <i class="fab fa-github"></i>
            <p>No repositories found on GitHub</p>
            <div class="mt-2">
                <input
                    v-model="githubUsername"
                    placeholder="Enter GitHub username"
                    class="form-control mb-2"
                />
                <button
                    @click="loadRepositories"
                    class="btn btn-outline-primary btn-sm"
                >
                    <i class="fas fa-search"></i> Find Repositories
                </button>
            </div>
        </div>

        <div v-else class="repositories-list">
            <div class="d-flex justify-content-between align-items-center mb-3">
                <h5 class="mb-0">Your GitHub Repositories</h5>
                <div>
                    <input
                        v-model="githubUsername"
                        placeholder="GitHub username"
                        class="form-control form-control-sm d-inline-block me-2"
                        style="width: auto"
                    />
                    <button
                        @click="loadRepositories"
                        class="btn btn-sm btn-outline-primary"
                    >
                        <i class="fas fa-sync"></i> Refresh
                    </button>
                </div>
            </div>

            <div
                v-for="repo in repositories"
                :key="repo.id"
                class="repository-card"
            >
                <div class="repository-content">
                    <h3 class="repository-title">
                        <i
                            class="far"
                            :class="repo.private ? 'fa-lock' : 'fa-folder-open'"
                        ></i>
                        <a :href="repo.html_url" target="_blank">{{
                            repo.name
                        }}</a>
                    </h3>
                    <p class="repository-description" v-if="repo.description">
                        {{ repo.description }}
                    </p>
                    <p class="repository-description" v-else>
                        <em>No description available</em>
                    </p>

                    <div class="repository-meta">
                        <span class="repository-language" v-if="repo.language">
                            <span
                                class="language-dot"
                                :style="{
                                    backgroundColor: getLanguageColor(
                                        repo.language
                                    ),
                                }"
                            ></span>
                            {{ repo.language }}
                        </span>
                        <span class="repository-stars">
                            <i class="fas fa-star"></i>
                            {{ repo.stargazers_count }}
                        </span>
                        <span class="repository-forks">
                            <i class="fas fa-code-branch"></i>
                            {{ repo.forks_count }}
                        </span>
                        <span class="repository-date">
                            <i class="fas fa-calendar"></i>
                            {{ formatDate(repo.updated_at) }}
                        </span>
                    </div>

                    <div class="repository-actions mt-2">
                        <button
                            class="btn btn-sm btn-outline-primary"
                            @click="importAsProject(repo)"
                            :disabled="isImporting[repo.id]"
                        >
                            <i
                                :class="
                                    isImporting[repo.id]
                                        ? 'fas fa-spinner fa-spin'
                                        : 'fas fa-file-import'
                                "
                            ></i>
                            {{
                                isImporting[repo.id]
                                    ? "Importing..."
                                    : "Import as Project"
                            }}
                        </button>
                        <span v-if="importSuccess[repo.id]" class="import-success">
                            <i class="fas fa-check"></i> Project created
                            successfully!
                        </span>
                        <span v-if="importError[repo.id]" class="import-error">
                            <i class="fas fa-exclamation-circle"></i>
                            {{ importError[repo.id] }}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, watch, defineProps } from "vue";
import { useGitHubApi } from "@/composables/useGitHubApi";
import { db, auth } from "@/firebase/config.js";

const props = defineProps({
    userId: {
        type: String,
        required: true,
    },
});

const { isLoading, error, getUserRepositories } = useGitHubApi();
const repositories = ref([]);
const githubUsername = ref('');
const isImporting = ref({});
const importSuccess = ref({});
const importError = ref({});

// Load the repositories when the component mounts
onMounted(() => {
    loadRepositories();
});

// Watch for changes in the userId prop
watch(
    () => props.userId,
    () => {
        loadRepositories();
    }
);

// Function to load repositories from GitHub
async function loadRepositories() {
    if (!githubUsername.value) {
        return;
    }

    try {
        const results = await getUserRepositories(githubUsername.value);
        repositories.value = results;
    } catch (err) {
        console.error("Error loading GitHub repositories:", err);
    }
}

// Function to format the date
function formatDate(dateString) {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
}

// Function to get color for programming language (placeholder)
function getLanguageColor(language) {
    // This could be replaced with a more complete mapping
    const colors = {
        JavaScript: "#f1e05a",
        TypeScript: "#2b7489",
        HTML: "#e34c26",
        CSS: "#563d7c",
        Python: "#3572A5",
        Java: "#b07219",
        PHP: "#4F5D95",
        Ruby: "#701516",
        Go: "#00ADD8",
        C: "#555555",
        "C++": "#f34b7d",
        "C#": "#178600",
    };

    return colors[language] || "#858585";
}

// Function to import a repository as a project
async function importAsProject(repo) {
    try {
        if (!auth.currentUser) {
            alert(
                "You need to be logged in to import a repository as a project."
            );
            return;
        }

        isImporting.value[repo.id] = true;
        importError.value[repo.id] = null;

        // Create a new project record based on the repository data
        const project = {
            title: repo.name,
            description: repo.description || "Imported from GitHub",
            githubURL: repo.html_url,
            tags: repo.topics || [repo.language].filter(Boolean),
            visibility: true,
            createdAt: new Date(),
            lastUpdated: new Date(),
            status: "Finished", // Set status to Finished instead of In Progress
            source: "github",
        };

        // Add to user's projects collection
        const userRef = db.collection("users").doc(auth.currentUser.uid);
        const projectRef = await userRef.collection("projects").add(project);

        // Also add to timeline
        await db.collection("timelineObjects").add({
            title: repo.name,
            type: "project",
            user: auth.currentUser.uid,
            description: repo.description || "Imported from GitHub",
            createdAt: new Date(),
            data: {
                id: projectRef.id,
                source: "github",
            },
        });

        console.log("Repository imported as project:", repo.name);
        importSuccess.value[repo.id] = true;

        // Show success message and reload projects
        setTimeout(() => {
            importSuccess.value[repo.id] = false;
        }, 5000);

        return projectRef.id;
    } catch (err) {
        console.error("Error importing repository as project:", err);
        importError.value[repo.id] = err.message;
        return null;
    } finally {
        isImporting.value[repo.id] = false;
    }
}
</script>

<style scoped>
.github-repositories {
    padding: 16px 0;
}

.loading-state,
.error-state,
.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 2rem 1rem;
    text-align: center;
    border-radius: 6px;
    background-color: var(--github-card-bg);
    border: 1px dashed var(--github-border);
    color: var(--github-secondary-text);
}

.loading-state i,
.error-state i,
.empty-state i {
    font-size: 2rem;
    margin-bottom: 1rem;
}

.empty-state .fab.fa-github {
    font-size: 3rem;
    margin-bottom: 1rem;
}

.repository-card {
    display: flex;
    background-color: var(--github-card-bg);
    border: 1px solid var(--github-border);
    border-radius: 6px;
    overflow: hidden;
    margin-bottom: 16px;
    padding: 16px;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.repository-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.repository-content {
    flex: 1;
}

.repository-title {
    font-size: 18px;
    font-weight: 600;
    margin-bottom: 8px;
    line-height: 1.4;
    display: flex;
    align-items: center;
    gap: 8px;
}

.repository-title a {
    color: var(--github-link);
    text-decoration: none;
}

.repository-title a:hover {
    text-decoration: underline;
}

.repository-description {
    font-size: 14px;
    color: var(--github-secondary-text);
    margin-bottom: 12px;
    line-height: 1.5;
}

.repository-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    margin-bottom: 12px;
    color: var(--github-secondary-text);
    font-size: 13px;
    align-items: center;
}

.repository-language {
    display: flex;
    align-items: center;
    gap: 6px;
}

.language-dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    display: inline-block;
}

.repository-stars,
.repository-forks,
.repository-date {
    display: flex;
    align-items: center;
    gap: 6px;
}

.repository-actions {
    display: flex;
    align-items: center;
    gap: 8px;
}

.import-success {
    color: #2ea043;
    font-size: 13px;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    animation: fadeIn 0.3s ease-in;
}

.import-error {
    color: #f85149;
    font-size: 13px;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    animation: fadeIn 0.3s ease-in;
}

@keyframes fadeIn {
    from {
        opacity: 0;
    }
    to {
        opacity: 1;
    }
}

@media (max-width: 600px) {
    .repository-meta {
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
    }
}
</style>
