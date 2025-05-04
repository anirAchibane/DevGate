<template>
  <mini-navbar></mini-navbar>
  <div v-if="!isBanned && !isCurrentBanned">
  <div class="container-fluid mt-3">
    <div class="d-flex justify-content-center align-items-center">
      <router-link 
        v-if="isCurrent"
        :to="`/add/${auth.currentUser.uid}`" 
        class="btn btn-success"
      >
        What's New
      </router-link>
    </div>
  </div>
  <div class="choice d-flex justify-content-center align-items-center mt-3">
    <button class="btn btn-sm btn-outline" @click="switchTab('Profile')">Profile</button>
    <button class="btn btn-sm btn-outline" @click="switchTab('Timeline')">Timeline</button>
    <button class="btn btn-sm btn-outline" @click="switchTab('Dashboard')">Dashboard</button>
  </div>
  <!-- Popup Modal for Followers/Following -->
  <div v-if="showFollowersPopup || showFollowingPopup" class="popup-overlay" @click.self="closePopup">
    <div class="popup-content">
      <div v-if="showFollowersPopup" class="followers">
        <h2>Followers</h2>
        <input class="form-control mb-2" type="text" placeholder="Search follower" v-model="followerFilter">
        <div v-for="follower in filteredFollowers" :key="follower.id" class="user-card d-flex align-items-center mb-2">
          <div class="user-avatar me-2">
            <img :src="follower.avatar || require('@/assets/default_pfp.jpg')" alt="User avatar" class="rounded-circle" width="40" height="40"/>
          </div>
          <p class="me-2 mb-0">{{ follower.username }}</p>
          <router-link
                        :to="{ name: 'Profil', params: { id: follower.id } }"
                        class="btn btn-sm btn-outline view-profile"
                    >
                        <i class="fas fa-user-circle"></i> View
          </router-link>
        </div>
      </div>

      <div v-if="showFollowingPopup" class="following">
        <h2>Following</h2>
        <input class="form-control mb-2" type="text" placeholder="Search following" v-model="followingFilter">
        <div v-for="followedUser in filteredFollowing" :key="followedUser.id" class="user-card d-flex align-items-center mb-2">
          <div class="user-avatar me-2">
            <img :src="followedUser.avatar || require('@/assets/default_pfp.jpg')" alt="User avatar" class="rounded-circle" width="40" height="40"/>
          </div>
          <p class="me-2 mb-0">{{ followedUser.username }}</p>
          <router-link
                        :to="{ name: 'Profil', params: { id: followedUser.id } }"
                        class="btn btn-sm btn-outline view-profile"
                    >
                        <i class="fas fa-user-circle"></i> View
                    </router-link>
        </div>
      </div>
      <div class="text-end mt-3">
        <button @click="closePopup" class="btn btn-secondary">Close</button>
      </div>
    </div>
  </div>

  <div class="container-fluid py-4">
    <div class="main row">

      <!-- Sidebar -->
      <div class="sidebar">
        <div class="card text-white bg-dark mb-4">
          <div class="card-body text-center">
            <div class="profile-image">
                <img
                    :src="
                      userData.avatar ||
                      require('@/assets/default_pfp.jpg')
                    "
                    alt="Profile"
                />
            </div>
            <h3 class="username card-title">{{ userData.username }}</h3>
            <p v-if="userData.bio !== ''" class="card-text bio"> {{ userData.bio }}</p>
            <p v-else class="card-text bio"> no bio</p>
            <p class="card-text">{{ userData.email }}</p>
            <p class="card-text clickable" @click="showFollowersPopup = true">Followers: {{ followers.length }}</p>
            <p class="card-text clickable" @click="showFollowingPopup = true">Following: {{ following.length }}</p>
            <p class="card-text">Current Level: <span class="level-badge">{{ currentLevel }}</span></p>
            <p class="card-text" v-if="nextLevelRequirements">Next Level: {{ nextLevelRequirements }}</p>

            <div class="mt-3 d-flex gap-2 justify-content-center">
              <button v-if="isCurrent" @click="settings()" class="btn btn-outline-light btn-sm">
                Settings
              </button>

              <button v-else-if="!isFollowing" @click="follow()" class="btn btn-primary btn-sm">
                Follow
              </button>

              <button v-else @click="unfollow()" class="btn btn-danger btn-sm">
                Unfollow
              </button>

              <router-link :to="{
                                path: '/newreport',
                                query: { targetID: userId,
                                         targetType: 'user',
                                         targetTitle: userData.username,
                                         targetOwner: userId
                                },
                            }">
                  <button v-if="!isCurrent" class="btn btn-outline-light">
                    Report
                  </button>
              </router-link>

            </div>
          </div>
        </div>

        <!-- Skills -->
        <div class="card text-white bg-dark mb-4 edit-card">
          <div class="card-header">
            <h5>Skills</h5>
          </div>
          <div class="card-body">
            <!-- Loading state for skills -->
            <div v-if="skillsLoading" class="section-loading">
              <LoadingOverlay message="Loading skills..." transparent />
            </div>
            <div v-else class="skills">
              <div v-if="userSkills.length === 0" class="empty-state">
                <i class="fas fa-code"></i>
                <p>No skills yet</p>
                <button v-if="isCurrent" @click="navigateToAdd('Skill')" class="btn btn-outline-primary btn-sm">
                  <i class="fas fa-plus-circle me-1"></i> Add Skill
                </button>
                <p v-else class="empty-state-message">This user hasn't added any skills yet</p>
              </div>
              <div v-for="(skill, index) in userSkills" :key="skill.id" class="skill mb-2">
                <template v-if="editingSkillIndex === index">
                  <div class="edit-skill-form p-3 bg-dark text-white rounded shadow-sm mb-3">
                    <div class="mb-2">
                      <label class="form-label small text-white fw-bold">Skill Name</label>
                      <input v-model="skill.name" class="form-control mb-1 input-dark" placeholder="Skill name" />
                    </div>
                    
                    <div class="mb-3">
                      <label class="form-label small text-white fw-bold">Skill Level</label>
                      <select v-model="skill.level" class="forrm-control ms-2 input-dark" placeholder="Skill level">
                        <option> Beginner </option>
                        <option> Intermediate </option>
                        <option> Advanced </option>
                        <option> Master </option>
                      </select>
                      
                    </div>
                    
                    <div class="d-flex gap-2">
                      <button @click="saveSingleSkill(index)" class="btn btn-success">
                        <i class="bi bi-check-lg me-1"></i> Save
                      </button>
                      <button @click="deleteSkill(skill.id)" class="btn btn-danger">
                        <i class="bi bi-trash me-1"></i> Delete
                      </button>
                      <button @click="editingSkillIndex = null" class="btn btn-secondary">
                        Cancel
                      </button>
                    </div>
                  </div>
                </template>
                <template v-else>
                  <p class="mb-1 fw-bold">{{ skill.name }}</p>
                  <p class="mb-1">Level : {{ skill.level }}</p>
                  <p class="mb-1">Acquired at : {{ formatFirestoreTimestamp(skill.acquiredAt) }}</p>
                  <p class="mb-1">Updated at : {{ formatFirestoreTimestamp(skill.updatedAt) }}</p>
                  <button v-if="isCurrent" @click="editingSkillIndex = index" class="btn btn-outline-light btn-sm mt-1">Edit</button>
                </template>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Mainbar -->
      <div class="mainbar" v-if="activeTab === 'Profile'">

        <!-- Projects -->
        <div class="card text-white bg-dark mb-4 edit-card">
          <div class="card-header">
            <h5>Projects</h5>
          </div>
          <div class="card-body">
            <!-- Loading state for projects -->
            <div v-if="projectsLoading" class="section-loading">
              <LoadingOverlay message="Loading projects..." transparent />
            </div>
            <div v-else class="projects">
              <div v-if="userProjects.length === 0" class="empty-state">
                <i class="fas fa-project-diagram"></i>
                <p>No projects yet</p>
                <button v-if="isCurrent" @click="navigateToAdd('Project')" class="btn btn-outline-primary btn-sm">
                  <i class="fas fa-plus-circle me-1"></i> Add Project
                </button>
                <p v-else class="empty-state-message">This user hasn't added any projects yet</p>
              </div>
              <div v-for="(project, index) in userProjects" :key="project.id" class="project mb-3 p-3 border rounded bg-secondary">
                <template v-if="editingProjectIndex === index">
                  <div class="edit-project-form p-3 bg-dark text-white rounded shadow-sm mb-3">
                    <div class="mb-2">
                      <label class=" form-label small text-white fw-bold ">Project Title</label>
                      <input v-model="project.title" class="form-control mb-1 input-dark" placeholder="Title" />
                    </div>
                    
                    <div class="mb-2">
                      <label class="form-label small text-white fw-bold">Description</label>
                      <textarea v-model="project.description" class="form-control mb-1 input-dark" 
                                placeholder="Description" rows="3"></textarea>
                    </div>
                    
                    <div class="mb-2">
                      <label class="form-label small text-white fw-bold">GitHub URL</label>
                      <input v-model="project.githubURL" class="form-control mb-1 input-dark" placeholder="GitHub URL" />
                    </div>
                    
                    <div class="mb-3">
                      <label class="form-label small text-white fw-bold">Visibility</label>
                      <select v-model="project.visibility" class="form-select mb-1 input-dark">
                        <option :value="true">Public</option>
                        <option :value="false">Private</option>
                      </select>
                    </div>
                    
                    <div class="d-flex gap-2">
                      <button @click="saveSingleProject(index)" class="btn btn-success">
                        <i class="bi bi-check-lg me-1"></i> Save
                      </button>
                      <button @click="deleteProject(project.id)" class="btn btn-danger">
                        <i class="bi bi-trash me-1"></i> Delete
                      </button>
                      <button @click="editingProjectIndex = null" class="btn btn-secondary">
                        Cancel
                      </button>
                    </div>
                  </div>
                </template>
                <template v-else>
                  <p class="mb-1 fw-bold">{{ project.title }}</p>
                  <p class="mb-1">Description: {{ project.description || 'no description' }}</p>
                  <p class="mb-1">
                    Github URL : <a :href="project.githubURL" target="_blank">{{ project.githubURL }}</a>
                  </p>
                  <p class="mb-1">Tags : {{ project.tags }}</p>
                  <p class="mb-0">Visibility : {{ project.visibility ? 'Public' : 'Private' }}</p>
                  <p class="mb-0">Created at : {{ formatFirestoreTimestamp(project.createdAt) }}</p>
                  <button v-if="isCurrent" @click="editingProjectIndex = index" class="btn btn-outline-light btn-sm mt-1">Edit</button>

                  <router-link v-if="userId !== auth.currentUser.uid" :to="{
                                path: '/newreport',
                                query: { targetID: project.id,
                                         targetType: 'project',
                                         targetTitle: project.title,
                                         targetOwner: userId
                                },
                            }">
                            <button v-if="!isCurrent" class="btn btn-outline-light">
                                Report
                            </button>
                    </router-link>
                  
                </template>
              </div>
            </div>
          </div>
        </div>

        <!-- Objectives -->
        <div class="card text-white bg-dark mb-4 edit-card">
          <div class="card-header">
            <h5>Objectives</h5>
          </div>
          <div class="card-body">
            <!-- Loading state for objectives -->
            <div v-if="objectivesLoading" class="section-loading">
              <LoadingOverlay message="Loading objectives..." transparent />
            </div>
            <div v-else class="objectives">
              <div v-if="userObjectives.length === 0" class="empty-state">
                <i class="fas fa-bullseye"></i>
                <p>No objectives yet</p>
                <button v-if="isCurrent" @click="navigateToAdd('Objective')" class="btn btn-outline-primary btn-sm">
                  <i class="fas fa-plus-circle me-1"></i> Add Objective
                </button>
                <p v-else class="empty-state-message">This user hasn't added any objectives yet</p>
              </div>
              <div v-for="(objective, index) in userObjectives" :key="objective.id" class="objective mb-3 p-3 border rounded bg-secondary">
                <template v-if="editingObjectiveIndex === index">
                  <div class="edit-objective-form p-3 bg-dark text-white rounded shadow-sm mb-3">
                    <div class="mb-2">
                      <label class="form-label small text-white fw-bold">Objective Name</label>
                      <input v-model="objective.title" class="form-control input-dark" placeholder="Objective name" />
                    </div>
                    
                    <div class="mb-2">
                      <label class="form-label small text-white fw-bold">Progress</label>
                      <textarea v-model="objective.progress" class="form-control input-dark" 
                                placeholder="Progress" rows="3"></textarea>
                    </div>
                    
                    <div class="mb-2">
                      <label class="form-label small text-white fw-bold">Status</label>
                      <input v-model="objective.status" class="form-control input-dark" placeholder="Status" />
                    </div>
                    
                    <div class="mb-3">
                      <label class="form-label small text-white fw-bold">Visibility</label>
                      <select v-model="objective.visibility" class="form-select input-dark">
                        <option :value="true">Public</option>
                        <option :value="false">Private</option>
                      </select>
                    </div>
                    
                    <div class="d-flex gap-2">
                      <button @click="saveSingleObjective(index)" class="btn btn-success">
                        <i class="bi bi-check-lg me-1"></i> Save
                      </button>
                      <button @click="deleteObjective(objective.id)" class="btn btn-danger">
                        <i class="bi bi-trash me-1"></i> Delete
                      </button>
                      <button @click="editingObjectiveIndex = null" class="btn btn-secondary">
                        Cancel
                      </button>
                    </div>
                  </div>
                  </template>
                  <template v-else>
                    <!-- Display objective just like a project card -->
                    <p class="mb-1 fw-bold objective-title">{{ objective.title }}</p>
                    <p class="mb-1 objective-desc">
                      Progress: {{ objective.progress }}
                    </p>
                    <p class="mb-1 objective-status">
                      Status: {{ objective.status }}
                    </p>
                    <p class="mb-1 objective-date">
                      Started: {{ formatFirestoreTimestamp(objective.startDate) }}
                    </p>
                    <p class="mb-1 objective-date">
                      Last updated: {{ formatFirestoreTimestamp(objective.lastUpdate) }}
                    </p>
                    <div class="objective-actions mt-2">
                      <button
                        v-if="isCurrent"
                        @click="editingObjectiveIndex = index"
                        class="btn btn-outline-light btn-sm"
                      >
                        Edit
                      </button>
                    </div>
                  </template>
              </div>
            </div>
          </div>
        </div>

        <!-- Dev.to Articles (moved to bottom) -->
        <div v-if="isCurrent" class="card text-white bg-dark mb-4 edit-card">
          <div class="card-header">
            <h5>Dev.to Articles</h5>
          </div>
          <div class="card-body">
            <DevToArticles :userId="userId" />
          </div>
        </div>

        <!-- GitHub Repositories -->
        <div v-if="isCurrent" class="card text-white bg-dark mb-4 edit-card">
          <div class="card-header">
            <h5>GitHub Repositories</h5>
          </div>
          <div class="card-body">
            <GitHubRepositories :userId="userId" />
          </div>
        </div>

      </div>

      <!-- TimeLine -->
      <div class="mainbar" v-if="activeTab === 'Timeline'">
        <div class="dashboard-header">
          <h1>Timeline</h1>
          <div class="d-flex flex-row gap-2">
            <label class="label">Type </label>
            <select v-model="timelineType">
                <option default value="All">All</option>
                <option value="project">Projects</option>
                <option value="objective">Objectives</option>
                <option value="skill">Skills</option>
            </select>
            <label class="label">Year </label>
            <select v-model="timeLineYear">
                <option default value="All">All</option>
                <option v-for="year in timelineYears" :key="year" :value="year">{{ year }}</option>
            </select>
          </div>
        </div>
              <div v-for="item in filteredTimeLine" :key="item.id" class="timeline-item">
                  <div v-if="item.type === 'project'">
                    <div class="timeline-title">
                      <i class="fas fa-diagram-project"></i>
                      <h3>{{ formatDate(item.createdAt) }}</h3>
                    </div>
                      <p>Started project: {{ item.title }}</p>
                      <p class="desc">{{ item.description }}</p>
                  </div>
                  <div v-else-if="item.type === 'objective'">
                    <div class="timeline-title">
                      <i class="fas fa-bullseye"></i>
                      <h4>{{ formatDate(item.createdAt) }}</h4>
                    </div>
                      <p>Set objective: {{ item.title }}</p>
                      <p class="desc">Status: {{ item.description }}</p>
                  </div>
                  <div v-else-if="item.type === 'skill'">
                    <div class="timeline-title">
                      <i class="fas fa-rocket"></i>
                      <h3>{{ formatDate(item.createdAt) }}</h3>
                    </div>
                      <p>Acquired skill: {{ item.title }}</p>
                      <p class="desc">Level: {{ item.description }}</p>
                  </div>
              </div>
              <div class="timeline-item">
                <div class="timeline-title">
                  <i class="fas fa-user"></i>
                  <h3>Joined DevGate: {{formatDate(userData.createdAt)}}</h3>
                </div>
              </div>
      </div>

      <!-- Dashboard -->
      <div class="mainbar" v-if="activeTab === 'Dashboard'">
        <div class="dashboard-header">
          <h2>Developer Dashboard</h2>
          <button @click="refreshDashboardData" class="btn btn-refresh" title="Refresh dashboard data">
            <i class="fas fa-sync-alt"></i> Refresh
          </button>
        </div>
        
        <div class="dashboard-description">
          <p>Track your development progress and growth metrics over time.</p>
        </div>
        
        <!-- GitHub-style Contribution Heatmap -->
        <div class="chart-card contribution-card">
          <div class="chart-container">
            <div class="chart-info-section">
              <h3>Activity Contributions</h3>
              <span class="chart-info">Your development activity over time</span>
              <div class="chart-action-container">
                <p class="contribution-count">Total: {{ contributionCount || 0 }} contributions</p>
                <button v-if="isCurrent" @click="switchTab('Profile')" class="btn btn-action view-activity">
                  <i class="fas fa-plus-circle"></i> Add Activity
                </button>
              </div>
            </div>
            <div class="chart-display-section">
              <LoadingOverlay v-if="contributionsLoading" />
              <ContributionHeatmap 
                :userId="userId" 
                @contributions-loaded="handleContributionsLoaded" 
              />
            </div>
          </div>
        </div>

        <div class="charts-grid">
          <div class="chart-card">
              <div class="chart-container">
                <div class="chart-info-section">
                  <h3>Skills Growth</h3>
                  <span class="chart-info">Your skill progression over time</span>
                  <div class="chart-action-container">
                    <button v-if="isCurrent" @click="scrollToSkills()" class="btn btn-action add-skill">
                      <i class="fas fa-plus-circle"></i> Add Skill
                    </button>
                  </div>
                </div>
                <div class="chart-display-section">
                  <LoadingOverlay v-if="skillsLoading" />
                  <div v-else-if="!skillsData || !skillsData.labels || skillsData.labels.length === 0" class="no-data-message">
                    <i class="fas fa-chart-line"></i>
                    <p>No skills data available</p>
                    <small v-if="isCurrent">Add skills to your profile to see analytics</small>
                  </div>
                  <SkillsChart v-else :chartData="skillsData" />
                </div>
              </div>
          </div>

          <div class="chart-card">
              <div class="chart-container">
                <div class="chart-info-section">
                  <h3>Coding Time</h3>
                  <span class="chart-info">Hours spent coding per period</span>
                  <div class="chart-action-container">
                    <button v-if="isCurrent" @click="showCodingTimeForm = true" class="btn btn-info btn-sm">
                      <i class="fas fa-clock"></i> Log Coding Time
                    </button>
                  </div>
                </div>
                <div class="chart-display-section">
                  <LoadingOverlay v-if="codingTimeLoading" />
                  <div v-else-if="!codingTimeData || !codingTimeData.labels || codingTimeData.labels.length === 0" class="no-data-message">
                    <i class="fas fa-clock"></i>
                    <p>No coding time data available</p>
                    <small v-if="isCurrent">Log your coding hours to track progress</small>
                  </div>
                  <CodingTimeChart v-else :chartData="codingTimeData" />
                </div>
              </div>
          </div>

          <div class="chart-card">
              <div class="chart-container">
                <div class="chart-info-section">
                  <h3>Level Progression</h3>
                  <span class="chart-info">Your development level over time</span>
                  <div class="chart-action-container">
                    <p class="current-level">Current Level: {{ currentLevel || 1 }}</p>
                    <p class="level-hint">Complete objectives to level up</p>
                    <button v-if="isCurrent" @click="showLevelSystem = true" class="btn btn-info btn-sm">
                      <i class="fas fa-info-circle"></i> About Levels
                    </button>
                  </div>
                </div>
                <div class="chart-display-section">
                  <LoadingOverlay v-if="levelLoading" />
                  <div v-else-if="!levelsData || !levelsData.labels || levelsData.labels.length === 0" class="no-data-message">
                    <i class="fas fa-trophy"></i>
                    <p>No level data available</p>
                    <small v-if="isCurrent">Complete objectives to level up</small>
                  </div>
                  <LevelProgressionChart v-else :chartData="levelsData" />
                </div>
              </div>
          </div>

          <div class="chart-card">
              <div class="chart-container">
                <div class="chart-info-section">
                  <h3>Completed Projects</h3>
                  <span class="chart-info">Projects completed by category</span>
                  <div class="chart-action-container">
                    <p class="project-count">Total: {{ completedProjectCount || 0 }}</p>
                    <button v-if="isCurrent" @click="switchTab('Profile')" class="btn btn-action view-projects">
                      <i class="fas fa-tasks"></i> View Projects
                    </button>
                  </div>
                </div>
                <div class="chart-display-section">
                  <LoadingOverlay v-if="projectsLoading" />
                  <div v-else-if="!projectsData || !projectsData.labels || projectsData.labels.length === 0" class="no-data-message">
                    <i class="fas fa-project-diagram"></i>
                    <p>No projects data available</p>
                    <small v-if="isCurrent">Add projects to see completion stats</small>
                  </div>
                  <ProjectCompletionChart v-else :chartData="projectsData" />
                </div>
              </div>
          </div>
        </div>
      </div>

    </div>
  </div>
  
  <!-- Coding Time Modal -->
  <div v-if="showCodingTimeForm" class="popup-overlay" @click.self="showCodingTimeForm = false">
    <div class="popup-content">
      <CodingTimeForm 
        :userId="auth.currentUser.uid" 
        @submit-success="handleCodingTimeSubmit" 
        @cancel="showCodingTimeForm = false" 
      />
    </div>
  </div>
  
  <!-- Level System Modal -->
  <div v-if="showLevelSystem" class="popup-overlay" @click.self="showLevelSystem = false">
    <div class="popup-content">
      <h2>DevGate Level System</h2>
      <p class="mb-3">Level up your developer journey by completing objectives, adding skills, and logging your coding time.</p>
      
      <div class="level-table">
        <div v-for="level in levelSystemInfo.levels" :key="level.level" class="level-row" :class="{'current-level-row': level.level === currentLevel}">
          <div class="level-number">Level {{ level.level }}</div>
          <div class="level-details">
            <div class="level-name">{{ level.name }}</div>
            <div class="level-requirements">{{ level.requirements }}</div>
          </div>
        </div>
      </div>
      
      <div class="text-end mt-4">
        <button @click="showLevelSystem = false" class="btn btn-secondary">Close</button>
      </div>
    </div>
  </div>
  </div>
  <div v-else>
    <div class="container-fluid mt-3">
      <div class="d-flex justify-content-center align-items-center">
        <h1 >This user is unavailable</h1>
      </div>
    </div>
  </div>
</template>

<script setup>
import MiniNavbar from "@/components/MiniNavbar.vue";
import {ref } from "vue";
import { db, auth  } from "@/firebase/config.js";
import { useRoute, useRouter  } from "vue-router";
import { onMounted , computed , watch } from "vue";
import { getFollowers , getFollowing } from "@/composables/userFollow";

// Import chart components
import SkillsChart from "@/components/charts/SkillsChart.vue";
import CodingTimeChart from "@/components/charts/CodingTimeChart.vue";
import LevelProgressionChart from "@/components/charts/LevelProgressionChart.vue";
import ProjectCompletionChart from "@/components/charts/ProjectCompletionChart.vue";
import ContributionHeatmap from "@/components/charts/ContributionHeatmap.vue";
import LoadingOverlay from "@/components/LoadingOverlay.vue";
import DevToArticles from "@/components/DevToArticles.vue";
import GitHubRepositories from "@/components/GitHubRepositories.vue";

// Import analytics composables
import useSkillsAnalytics from "@/composables/analytics/useSkillsAnalytics";
import useCodingTimeMetrics from "@/composables/analytics/useCodingTimeMetrics";
import useLevelProgression from "@/composables/analytics/useLevelProgression";
import useProjectCompletionStats from "@/composables/analytics/useProjectCompletionStats";
import CodingTimeForm from "@/components/forms/CodingTimeForm.vue";

// Routing:
const route = useRoute();
const router = useRouter();

// Variables:
const userId = ref(route.params.id);                         // Get the userId from the route params 
const isCurrent = computed(() => userId.value === auth.currentUser.uid);    // Check if the userId is the same as the current user's id
const isBanned = ref(false);                         // Check if the user is banned
const isCurrentBanned = ref(false);                         // Check if the current user is banned
const isFollowing = ref(false);                         // Check if the current user is following the userId
const activeTab = ref("Profile");   // variable to switch between Profile and Timeline tabs

// Data:
const userData = ref({});    // stores current user's data
const userProjects = ref([]);   // stores user's projects ( all projects if isCurrent(), else only public projects)
const userObjectives = ref([]); // stores user's objectives
const userSkills = ref([]);     // stores user's skills
const followers = ref([]);
const followersLoading = ref(true);
const followersError = ref(null);

const following = ref([]);
const followingLoading = ref(true);
const followingError = ref(null);

// timeline variables
const timeLine = ref([]);
const timeLineYear = ref('All');
const timelineType = ref('All'); 
const timelineYears = computed(() => {
  const years = timeLine.value.map(item => item.createdAt.toDate().getFullYear());
  return [...new Set(years)].sort((a,b) => b - a);
})

const filteredTimeLine = computed(() => {
  return timeLine.value.filter(item => {
    const itemYear = item.createdAt.toDate().getFullYear();
    const yearMatch = timeLineYear.value === 'All' || itemYear === timeLineYear.value;
    const typeMatch = timelineType.value === 'All' || item.type === timelineType.value;
    return yearMatch && typeMatch;
  })
});


// Dashboard data
const {
    skillsData,
    isLoading: skillsLoading,
    fetchSkillsData,
} = useSkillsAnalytics();

const {
    codingTimeData,
    isLoading: codingTimeLoading,
    fetchCodingTimeData,
} = useCodingTimeMetrics();

const {
    levelsData,
    isLoading: levelLoading,
    fetchLevelData,
    currentLevel,
    nextLevelRequirements,
    checkAndUpdateLevel,
} = useLevelProgression();

const {
    projectsData,
    // eslint-disable-next-line no-unused-vars
    isLoading: projectsDataLoading,
    fetchProjectData,
} = useProjectCompletionStats();

// Contribution heatmap data
const contributionCount = ref(0);
const contributionsLoading = ref(true);

const editingSkillIndex = ref(null);
const editingProjectIndex = ref(null);
const editingObjectiveIndex = ref(null);

// New variables for dashboard interactions
const showCodingTimeForm = ref(false);
const showLevelSystem = ref(false);
const completedProjectCount = computed(() => {
  return userProjects.value.length;
});

const objectivesLoading = ref(true);
const projectsLoading = ref(true);

watch(() => route.params.id, (newId) => {
  userId.value = newId;
  showFollowersPopup.value = false;
  showFollowingPopup.value = false;
  loadProfileData(); 
});

const loadProfileData = async () => {
  try {
    db.collection("users").doc(auth.currentUser.uid).get().then((doc) => {
      if (doc.exists) {
        isCurrentBanned.value = doc.data().role === "banned";
      }
    });
    const userRef = db.collection("users").doc(userId.value);
    const doc = await userRef.get();
    if (doc.exists) {
      userData.value = doc.data();
      isBanned.value = userData.value.role === 'banned';

      const [projectsSnap, objectivesSnap, skillsSnap] = await Promise.all([
        userRef.collection("projects").get(),
        userRef.collection("objectives").get(),
        userRef.collection("skills").get(),
      ]);

      userProjects.value = [];
      projectsSnap.forEach((doc) => {
        const project = doc.data();
        project.id = doc.id;
        if (isCurrent.value || project.visibility) {
          userProjects.value.push(project);
          
        }
      });
      console.log(userProjects.value)

      userObjectives.value = [];

      objectivesSnap.forEach((doc) => {
        const objective = doc.data();
        objective.id = doc.id;
        userObjectives.value.push(objective);
       
      });

      userSkills.value = [];
      skillsSnap.forEach((doc) => {
        const skill = doc.data();
        skill.id = doc.id;
        userSkills.value.push(skill);
        
      });

    } else {
      console.log("No such document!");
    }

    if (!isCurrent.value) {
      const currentUserRef = db.collection("users").doc(auth.currentUser.uid);
      const currentDoc = await currentUserRef.get();
      if (currentDoc.exists) {
        const followingList = currentDoc.data().following;
        isFollowing.value = followingList.includes(userId.value);
      }
    }

    await db.collection("timelineObjects").where("user", "==", userId.value)
    .get().then((snapshot) => {
      const timelineItems = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        data.id = doc.id;
        timelineItems.push(data);
      });

      timelineItems.sort((a,b) => {
        return b.createdAt.toDate() - a.createdAt.toDate();
      });

      timeLine.value = timelineItems;
    })

    const result = await getFollowers(userId.value);
    followers.value = result.followers.value;
    followersLoading.value = result.loading.value;
    followersError.value = result.error.value;

    const result2 = await getFollowing(userId.value);
    following.value = result2.following.value;
    followingLoading.value = result2.loading.value;
    followingError.value = result2.error.value;
    
  } catch (error) {
    console.error("Error fetching user data:", error);
  } finally {
    projectsLoading.value = false;
    objectivesLoading.value = false;
  }
};



onMounted(() => {
   loadProfileData();
   
   // Load dashboard data
   fetchSkillsData(userId.value);
   fetchCodingTimeData(userId.value);
   fetchLevelData(userId.value);
   fetchProjectData(userId.value);
});


const showFollowersPopup = ref(false);
const showFollowingPopup = ref(false);
const followerFilter = ref('');
const followingFilter = ref('');

const filteredFollowers = computed(() => {
  return followers.value.filter(f =>
    f.username.toLowerCase().includes(followerFilter.value.toLowerCase())
  );
});

const filteredFollowing = computed(() => {
  return following.value.filter(f =>
    f.username.toLowerCase().includes(followingFilter.value.toLowerCase())
  );
});

function closePopup() {
  showFollowersPopup.value = false;
  showFollowingPopup.value = false;
}


const saveSingleSkill = async (index) => {
  const skill = userSkills.value[index];
  const userRef = db.collection("users").doc(auth.currentUser.uid);
  const skillsCollection = userRef.collection("skills");

  if (skill.id) {
    await skillsCollection.doc(skill.id).update({
      name: skill.name,
      level: skill.level,
      updatedAt: new Date()
    });
    await db.collection("timelineObjects").add({
      title: skill.name,
      type: "skill",
      user: auth.currentUser.uid,
      description: skill.level,
      createdAt: new Date(),
    });
  }

  editingSkillIndex.value = null;
  
  // Check if the user's level should be updated after adding/updating skills
  if (isCurrent.value) {
    try {
      const { level, updated } = await checkAndUpdateLevel(auth.currentUser.uid);
      if (updated) {
        // If level was updated, show a notification
        alert(`Congratulations! You've reached level ${level}!`);
      }
    } catch (error) {
      console.error("Error checking level after skill update:", error);
    }
  }
};

const saveSingleProject = async (index) => {
  const project = userProjects.value[index];
  const userRef = db.collection("users").doc(auth.currentUser.uid);
  const projectsCollection = userRef.collection("projects");

  if (project.id) {
    await projectsCollection.doc(project.id).update({
      title: project.title,
      description: project.description,
      githubURL: project.githubURL,
      visibility: project.visibility
    });
    await db.collection("timelineObjects").add({
      title: project.title,
      type: "project",
      user: auth.currentUser.uid,
      description: project.description,
      createdAt: new Date(),
    });
  }

  editingProjectIndex.value = null;
  
  // Check if user level should be updated after modifying the project
  if (isCurrent.value) {
    try {
      const { level, updated } = await checkAndUpdateLevel(auth.currentUser.uid);
      if (updated) {
        alert(`Congratulations! You've reached level ${level}!`);
      }
    } catch (error) {
      console.error("Error checking level after project update:", error);
    }
  }
};

const saveSingleObjective = async (index) => {
  const objective = userObjectives.value[index];
  const userRef = db.collection("users").doc(auth.currentUser.uid);
  const objectivesCollection = userRef.collection("objectives");

  if (objective.id) {
    await objectivesCollection.doc(objective.id).update({
      title: objective.title,
      progress: objective.progress,
      status: objective.status,
      lastUpdate: new Date()
    });
    await db.collection("timelineObjects").add({
      title: objective.title,
      type: "objective",
      user: auth.currentUser.uid,
      description: objective.status,
      createdAt: new Date(),
    });
  }

  editingObjectiveIndex.value = null;
  
  // Check if the user's level should be updated after adding/updating an objective
  if (isCurrent.value) {
    try {
      const { level, updated } = await checkAndUpdateLevel(auth.currentUser.uid);
      if (updated) {
        // If level was updated, show a notification
        alert(`Congratulations! You've reached level ${level}!`);
      }
    } catch (error) {
      console.error("Error checking level after objective update:", error);
    }
  }
};



const settings = () => {
    // Redirect to the settings page
    router.push("/settings");
}

const follow = async () => {
      try{
        let followList = [];
        await db.collection("users").doc(auth.currentUser.uid).get().then((doc) =>{
            if(doc.exists){
                followList = doc.data().following; 
            } else {
                console.log("No such document!");
            }
        })

        followList.push(userId.value); // Add the userId to the following list
        await db.collection("users").doc(auth.currentUser.uid).update({
            following: followList
        })

        isFollowing.value = true; // Update the isFollowing state

      } catch(error){
        console.error("Error following user:", error);
      }
}

const unfollow = async () => {
      try{
            const followList = ref([]);
            await db.collection("users").doc(auth.currentUser.uid).get().then((doc) =>{
                if(doc.exists){
                    followList.value = doc.data().following; 
                } else {
                    console.log("No such document!");
                }
            })

            followList.value = followList.value.filter((id) => id !== userId.value);

            await db.collection("users").doc(auth.currentUser.uid).update({
                following: followList.value
            })

            isFollowing.value = false; // Update the isFollowing state

          } catch(error){
            console.error("Error following user:", error);
          }
}

function formatFirestoreTimestamp(timestamp) {
    if (!timestamp) return "N/A";

    // Handle both Firestore Timestamp object or plain object
    let date;
    if (timestamp.toDate) {
        // If it's an actual Firestore Timestamp object
        date = timestamp.toDate();
    } else if (timestamp.seconds !== undefined) {
        // If it's a plain object { seconds: ..., nanoseconds: ... }
        date = new Date(timestamp.seconds * 1000);
    } else {
        return "Invalid Timestamp";
    }

    // Format nicely
    return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

const formatDate = (timestamp) => {
    if (!timestamp) return "Unknown date";

    let date;
    if (timestamp.seconds) {
        // Firebase timestamp format
        date = new Date(timestamp.seconds * 1000);
    } else {
        // Regular date format
        date = new Date(timestamp);
    }

    return date.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
}

const switchTab = (tab) =>{
    activeTab.value = tab;
}

const deleteSkill = async (skillId) => {
  try {
    if (confirm("Are you sure you want to delete this skill?")) {
      const userRef = db.collection("users").doc(auth.currentUser.uid);
      await userRef.collection("skills").doc(skillId).delete();
      
      // Remove from local array
      userSkills.value = userSkills.value.filter(skill => skill.id !== skillId);
      
      // Update timeline
      timeLine.value = timeLine.value.filter(item => 
        !(item.type === 'skill' && item.data.id === skillId)
      );
      editingSkillIndex.value = null;
    }
  } catch (error) {
    console.error("Error deleting skill:", error);
  }
};

const deleteProject = async (projectId) => {
  try {
    if (confirm("Are you sure you want to delete this project?")) {
      const userRef = db.collection("users").doc(auth.currentUser.uid);
      await userRef.collection("projects").doc(projectId).delete();
      
      // Remove from local array
      userProjects.value = userProjects.value.filter(project => project.id !== projectId);
      
      // Update timeline
      timeLine.value = timeLine.value.filter(item => 
        !(item.type === 'project' && item.data.id === projectId)
      );
      editingProjectIndex.value = null;
    }
  } catch (error) {
    console.error("Error deleting skill:", error);
  }
};


const deleteObjective = async (objectiveId) => {
  try {
    if (confirm("Are you sure you want to delete this objective?")) {
      const userRef = db.collection("users").doc(auth.currentUser.uid);
      await userRef.collection("objectives").doc(objectiveId).delete();
      
      // Remove from local array
      userObjectives.value = userObjectives.value.filter(objective => objective.id !== objectiveId);
      
      // Update timeline
      timeLine.value = timeLine.value.filter(item => 
        !(item.type === 'objective' && item.data.id === objectiveId)
      );
      editingObjectiveIndex.value = null;
    }
  } catch (error) {
    console.error("Error deleting skill:", error);
  
  }
};

// Added function to refresh dashboard data
const refreshDashboardData = async () => {
  try {
    await Promise.all([
      fetchSkillsData(userId.value),
      fetchCodingTimeData(userId.value),
      fetchLevelData(userId.value),
      fetchProjectData(userId.value)
    ]);
  } catch (error) {
    console.error("Error refreshing dashboard data:", error);
  }
};

// Dashboard interaction functions
const scrollToSkills = () => {
  // Navigate to the Add New page with skill option pre-selected
  if (auth.currentUser) {
    router.push({
      path: `/add/${auth.currentUser.uid}`,
      query: { type: 'Skill' }
    });
  }
};

// Function to navigate to Add New page with type preselected
const navigateToAdd = (type) => {
  if (auth.currentUser) {
    router.push({
      path: `/add/${auth.currentUser.uid}`,
      query: { type }
    });
  }
};

// Level system modal
const levelSystemInfo = {
  levels: [
    { level: 1, name: "Beginner", requirements: "Join DevGate" },
    { level: 2, name: "Code Explorer", requirements: "Complete 2 projects" },
    { level: 3, name: "Developer", requirements: "Log 50 hours of coding" },
    { level: 4, name: "Code Craftsman", requirements: "Complete 5 projects & add 5 skills" },
    { level: 5, name: "Master Programmer", requirements: "Log 200 hours & complete 10 projects" }
  ]
};

const handleCodingTimeSubmit = async () => {
  showCodingTimeForm.value = false;
  await fetchCodingTimeData(userId.value);
  
  // Check if the user's level should be updated after logging coding time
  if (isCurrent.value) {
    try {
      const { level, updated } = await checkAndUpdateLevel(auth.currentUser.uid);
      if (updated) {
        alert(`Congratulations! You've reached level ${level}! Your coding time helped you level up.`);
      } else {
        alert("Coding time logged successfully!");
      }
    } catch (error) {
      console.error("Error checking level after logging coding time:", error);
      alert("Coding time logged successfully!");
    }
  } else {
    alert("Coding time logged successfully!");
  }
};

// Handle the contribution data emitted from the ContributionHeatmap component
const handleContributionsLoaded = (data) => {
  contributionCount.value = data.count || 0;
  contributionsLoading.value = data.loading;
  
  // Debug to console
  console.log("Contribution data received:", {
    count: data.count,
    loading: data.loading
  });
};

</script>

<style >

/* GitHub-like Theme Enhancements */
:root {
  --github-bg: #0d1117;
  --github-sidebar-bg: #161b22;
  --github-border: #30363d;
  --github-text: #c9d1d9;
  --github-secondary-text: #8b949e;
  --github-link: #58a6ff;
  --github-success: #238636;
  --github-danger: #da3633;
  --github-card-bg: #21262d;
  --github-accent: #1f6feb;
}

html,
body,
#app {
  color: var(--github-text);
  height: 100%;
  margin: 0;
  padding: 0;
  background-color: var(--github-bg);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
}

/* Main Layout */
.main {
  display: flex;
  flex-direction: row;
  gap: 24px;
  padding: 20px;
}

/* Sidebar Styling */
.sidebar {
  flex: 0 0 25%;
  padding: 0;
  border-radius: 6px;
}

.sidebar .card {
  background-color: var(--github-sidebar-bg) !important;
  border: 1px solid var(--github-border);
  border-radius: 6px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
}

.sidebar .card-header {
  border-bottom: 1px solid var(--github-border);
  background-color: rgba(240, 246, 252, 0.03);
  padding: 12px 16px;
}

.sidebar .card-header h5 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.sidebar .card-body {
  padding: 16px;
}

.profile-image {
  margin-bottom: 16px;
}

.profile-image img {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  border: 1px solid var(--github-border);
}

.username {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 4px;
}

.bio, .desc {
  margin-top: 0;
  margin-bottom: 16px;
  color: var(--github-secondary-text);
  font-size: 14px;
  font-style: italic;
}

.card-text {
  margin-bottom: 8px;
  font-size: 14px;
}

.clickable {
  cursor: pointer;
  color: var(--github-link);
  text-decoration: none;
}

.clickable:hover {
  text-decoration: underline;
}

/* Skills Styling */
.skill {
  background-color: var(--github-card-bg);
  border: 1px solid var(--github-border);
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 12px;
  position: relative;
}

.skill .fw-bold {
  color: var(--github-link);
  font-size: 16px;
  margin-bottom: 4px;
}

.skill p {
  margin-bottom: 4px;
  font-size: 14px;
  color: var(--github-secondary-text);
}

.skill .btn-outline-light {
  position: absolute;
  top: 12px;
  right: 12px;
  font-size: 12px;
  padding: 2px 8px;
  border-color: var(--github-border);
  background-color: transparent;
}

.skill .btn-outline-light:hover {
  background-color: rgba(56, 139, 253, 0.15);
  border-color: var(--github-link);
  color: var(--github-link);
}

/* Mainbar Styling */
.mainbar, .timeline-bar {
  flex: 1;
  padding: 0;
  border-radius: 6px;
}

.mainbar .card, .timeline-bar {
  background-color: var(--github-sidebar-bg) !important;
  border: 1px solid var(--github-border);
  border-radius: 6px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
  margin-bottom: 24px;
}

.mainbar .card-header, .timeline-bar h2 {
  border-bottom: 1px solid var(--github-border);
  background-color: rgba(240, 246, 252, 0.03);
  padding: 12px 16px;
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.timeline-bar h2 {
  font-size: 18px;
  padding: 16px;
  margin: 0;
}

.mainbar .card-body {
  padding: 16px;
}

/* Projects Styling */
.project {
  background-color: var(--github-card-bg) !important;
  border: 1px solid var(--github-border) !important;
  border-radius: 6px !important;
  padding: 16px !important;
  margin-bottom: 16px !important;
  position: relative;
}

.project .fw-bold {
  color: var(--github-link);
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 6px;
}

.project p {
  margin-bottom: 6px;
  font-size: 14px;
  color: var(--github-text);
}

.project p a {
  color: var(--github-link);
  text-decoration: none;
}

.project p a:hover {
  text-decoration: underline;
}

.project .btn-outline-light {
  position: absolute;
  top: 16px;
  right: 16px;
  font-size: 12px;
  padding: 2px 8px;
  border-color: var(--github-border);
}

.project .btn-outline-light:hover {
  background-color: rgba(56, 139, 253, 0.15);
  border-color: var(--github-link);
  color: var(--github-link);
}

/* Objectives Styling */
.objective {
  background-color: var(--github-card-bg) !important;
  border: 1px solid var(--github-border) !important;
  border-radius: 6px !important;
  padding: 16px !important;
  margin-bottom: 16px !important;
  position: relative;
}

.objective .fw-bold {
  color: var (--github-link);
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 6px;
}

.objective p {
  margin-bottom: 6px;
  font-size: 14px;
  color: var(--github-text);
}

.objective .btn-outline-light {
  position: absolute;
  top: 16px;
  right: 16px;
  font-size: 12px;
  padding: 2px 8px;
  border-color: var(--github-border);
}

.objective .btn-outline-light:hover {
  background-color: rgba(56, 139, 253, 0.15);
  border-color: var(--github-link);
  color: var(--github-link);
}

/* Timeline Styling */
.label{
  position: relative;
  top:5px;
}
.timeline-item {
  display: flex;
  flex-direction: column;
  background-color: transparent;
  border-left: 2px solid var(--github-border);
  margin-left: 20px;
  padding-left: 20px;
  margin-bottom: 24px;
  position: relative;
  padding-bottom: 8px;
}

.timeline-item::before {
  content: "";
  position: absolute;
  left: -8px;
  top: 0;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background-color: var(--github-accent);
  border: 2px solid var(--github-bg);
}

.timeline-title {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.timeline-title i {
  font-size: 16px;
  color: var(--github-link);
}

.timeline-title h3, .timeline-title h4 {
  font-size: 16px;
  font-weight: 600;
  margin: 0;
  color: var(--github-text);
}

.timeline-item p {
  margin: 4px 0;
  font-size: 14px;
  color: var(--github-secondary-text);
}

/* Tab Navigation */
.choice {
  margin-bottom: 20px;
  border-bottom: 1px solid var(--github-border);
  padding-bottom: 8px;
}

.choice .btn-outline {
  background-color: transparent;
  border: none;
  color: var(--github-secondary-text);
  font-size: 14px;
  padding: 8px 16px;
  margin-right: 8px;
  border-radius: 6px;
}

.choice .btn-outline:hover {
  background-color: rgba(56, 139, 253, 0.15);
  color: var(--github-link);
}

.choice .btn-outline.active {
  background-color: rgba(56, 139, 253, 0.15);
  color: var(--github-link);
  border-bottom: 2px solid var(--github-link);
}

/* Button Styling */
.btn-success {
  background-color: var(--github-success);
  border-color: rgba(240, 246, 252, 0.1);
}

.btn-success:hover {
  background-color: #2ea043;
  border-color: rgba(240, 246, 252, 0.1);
}

.btn-danger {
  background-color: var(--github-danger);
  border-color: rgba(240, 246, 252, 0.1);
}

.btn-danger:hover {
  background-color: #f85149;
  border-color: rgba(240, 246, 252, 0.1);
}

.btn-primary {
  background-color: var(--github-accent);
  border-color: rgba(240, 246, 252, 0.1);
}

.btn-primary:hover {
  background-color: #388bfd;
  border-color: rgba(240, 246, 252, 0.1);
}

.btn-secondary {
  background-color: var(--github-card-bg);
  border-color: var(--github-border);
  color: var(--github-text);
}

.btn-secondary:hover {
  background-color: #30363d;
  border-color: var(--github-border);
  color: var(--github-text);
}

/* Popup Styling */
.popup-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  z-index: 999;
  display: flex;
  justify-content: center;
  align-items: center;
}

.popup-content {
  background: var(--github-sidebar-bg);
  padding: 24px;
  border-radius: 6px;
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  overflow-y: auto;
  border: 1px solid var(--github-border);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
}

.popup-content h2 {
  margin-top: 0;
  margin-bottom: 16px;
  font-weight: 600;
  color: var(--github-text);
  border-bottom: 1px solid var(--github-border);
  padding-bottom: 12px;
}

.user-card {
  padding: 12px;
  border-radius: 6px;
  background-color: var(--github-card-bg);
  border: 1px solid var(--github-border);
  margin-bottom: 8px;
}

.user-card:hover {
  background-color: #30363d;
}

.view-profile {
  margin-left: auto;
  background-color: transparent;
  border: 1px solid var(--github-border);
  color: var(--github-text);
}

.view-profile:hover {
  background-color: rgba(56, 139, 253, 0.15);
  border-color: var(--github-link);
  color: var(--github-link);
}

/* Form Controls */
.form-control, .form-select {
  background-color: var(--github-card-bg);
  border: 1px solid var(--github-border);
  color: var(--github-text);
  padding: 6px 12px;
}

.form-control:focus, .form-select:focus {
  background-color: var(--github-card-bg);
  border-color: var(--github-link);
  color: var(--github-text);
  box-shadow: 0 0 0 3px rgba(88, 166, 255, 0.3);
}


/* Consistent icon styling */
.bi {
  font-size: 14px;
  vertical-align: -0.125em;
}

/* make the page container dark */
.container-fluid.py-4 {
  background-color: #0d1117;
}

/* edit‐form card */
.edit-card {
  background-color: #161b22 !important;
  border-color:    #30363d !important;
}

/* inputs & selects inside edit form */
.input-dark {
  background-color: #0d1117 !important;
  color:            #c9d1d9 !important;
  border:           1px solid #30363d !important;
}

/* keep placeholders legible */
.input-dark::placeholder {
  color: #8b949e !important;
}

/* button overrides (if you like) */
.btn-save {
  background-color: #238636;
  border-color:     #238636;
  color:            #ffffff;
}
.btn-delete {
  background-color: #b62324;
  border-color:     #b62324;
  color:            #ffffff;
}
.btn-cancel {
  background-color: #57606a;
  border-color:     #57606a;
  color:            #ffffff;
}

/* Dashboard Styling */
.dashboard-bar {
  padding: 16px;
  background-color: var(--github-sidebar-bg);
  border: 1px solid var(--github-border);
  border-radius: 6px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
}

.dashboard-bar h2 {
  margin-bottom: 20px;
  font-size: 20px;
  font-weight: 600;
  color: var(--github-text);
}

.charts-grid {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 10px 0;
}

.chart-card {
  background-color: var(--github-card-bg);
  border: 1px solid var(--github-border);
  border-radius: 6px;
  padding: 16px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  position: relative;
  height: 300px;
}

.chart-card h3 {
  font-size: 16px;
  margin-bottom: 15px;
  color: var(--github-link);
  font-weight: 600;
}

/* Dashboard Enhanced Styling */
.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--github-border);
}

.dashboard-header h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: var(--github-text);
}

.btn-refresh {
  background-color: rgba(56, 139, 253, 0.1);
  color: var(--github-link);
  border: 1px solid var(--github-border);
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s ease;
}

.btn-refresh:hover {
  background-color: rgba(56, 139, 253, 0.2);
  border-color: var(--github-link);
}

.btn-refresh i {
  font-size: 14px;
}

.dashboard-description {
  margin-bottom: 24px;
  color: var(--github-secondary-text);
  font-size: 14px;
}

.chart-header {
  display: flex;
  flex-direction: column;
  margin-bottom: 12px;
}

.chart-info {
  font-size: 12px;
  color: var(--github-secondary-text);
  margin-top: 4px;
}

/* Contribution heatmap specific styles */
.contribution-card {
  width: 100%;
  height: auto;
  min-height: 180px;
}

.contribution-count {
  font-size: 13px;
  font-weight: 600;
  color: var(--github-text);
  margin-bottom: 8px;
}

.chart-action-container {
  margin-top: auto;
  padding-top: 10px;
}

.btn-action.view-activity {
  background-color: #ff7b72; /* Reddish */
  border-color: rgba(255, 123, 114, 0.4);
}

.btn-action.view-activity:hover {
  background-color: #ff8f87;
  border-color: rgba(255, 143, 135, 0.6);
}

.no-data-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: var(--github-secondary-text);
  text-align: center;
  padding: 20px;
}

.no-data-message i {
  font-size: 36px;
  margin-bottom: 16px;
  color: var(--github-border);
}

.no-data-message p {
  margin-bottom: 4px;
  font-size: 16px;
  font-weight: 500;
}

.no-data-message small {
  font-size: 12px;
}

@media (max-width: 768px) {
  .charts-grid {
    grid-template-columns: 1fr;
  }
  
  .main {
    flex-direction: column;
  }
  
  .sidebar {
    flex: 0 0 100%;
  }
}

.chart-container {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: flex-start;
  height: 100%;
}

.chart-info-section {
  flex: 1;
  padding-right: 16px;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
}

.chart-display-section {
  flex: 2;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.btn-action {
  color: #ffffff;
  font-size: 13px;
  padding: 6px 12px;
  transition: all 0.3s ease;
  font-weight: 600;
  box-shadow: 0 1px 0 rgba(27,31,36,0.1), inset 0 1px 0 rgba(255,255,255,0.25);
  border-radius: 6px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: 1px solid rgba(240, 246, 252, 0.1);
  text-decoration: none;
  letter-spacing: 0.02em;
}

.btn-action:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  filter: brightness(110%);
}

.btn-action:active {
  transform: translateY(0);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.btn-action i {
  font-size: 14px;
}

/* Different background colors for each action button */
.btn-action.add-skill {
  background-color: #238636; /* Green */
  border-color: rgba(35, 134, 54, 0.4);
}

.btn-action.add-skill:hover {
  background-color: #2ea043;
  border-color: rgba(46, 160, 67, 0.6);
}

.btn-action.view-projects {
  background-color: #8957e5; /* Purple */
  border-color: rgba(137, 87, 229, 0.4);
}

.btn-action.view-projects:hover {
  background-color: #9e77f5;
  border-color: rgba(158, 119, 245, 0.6);
}

.btn-info.btn-sm {
  background-color: #1f6feb; /* Blue */
  border-color: rgba(31, 111, 235, 0.4);
  color: #ffffff;
  font-size: 13px;
  padding: 6px 12px;
  transition: all 0.3s ease;
  font-weight: 600;
  box-shadow: 0 1px 0 rgba(27,31,36,0.1), inset 0 1px 0 rgba(255,255,255,0.25);
  border-radius: 6px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  letter-spacing: 0.02em;
}

.btn-info.btn-sm:hover {
  background-color: #388bfd;
  border-color: rgba(56, 139, 253, 0.6);
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  filter: brightness(110%);
}

.btn-info.btn-sm:active {
  transform: translateY(0);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

/* Level system modal styling */
.level-table {
  margin: 16px 0;
  border: 1px solid #30363d;
  border-radius: 6px;
  overflow: hidden;
}

.level-row {
  display: flex;
  border-bottom: 1px solid #30363d;
  padding: 12px;
  background-color: #21262d;
}

.level-row:last-child {
  border-bottom: none;
}

.level-number {
  flex: 0 0 80px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #161b22;
  margin: -12px 12px -12px -12px;
  padding: 12px;
}

.level-details {
  flex: 1;
}

.level-name {
  font-weight: 600;
  font-size: 15px;
  margin-bottom: 4px;
  color: #58a6ff;
}

.level-requirements {
  color: #8b949e;
  font-size: 14px;
}

.current-level-row {
  background-color: rgba(88, 166, 255, 0.1);
  position: relative;
}

.current-level-row::before {
  content: "Current";
  position: absolute;
  top: 8px;
  right: 8px;
  background-color: #1f6feb;
  color: #ffffff;
  font-size: 11px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 12px;
}

.level-badge {
  background-color: #1f6feb;
  color: #ffffff;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 12px;
  font-size: 14px;
  display: inline-block;
  margin-left: 4px;
}
.objective-title { 
  color: var(--github-link);
  font-size: 16px;
  font-weight: 600;
}
.objective-desc,
.objective-status,
.objective-date {
  color: var(--github-text);
  font-size: 14px;
  margin-bottom: 6px;
}
.objective-actions { 
  display: flex; 
  gap: 8px; 
}

/* Empty state styling */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 30px 20px;
  border-radius: 6px;
  background-color: rgba(33, 38, 45, 0.4);
  border: 1px dashed var(--github-border);
  text-align: center;
}

.empty-state i {
  font-size: 32px;
  color: var(--github-secondary-text);
  margin-bottom: 16px;
}

.empty-state p {
  font-size: 16px;
  color: var(--github-secondary-text);
  margin-bottom: 16px;
}

.empty-state .btn-outline-primary {
  background-color: transparent;
  border: 1px solid var(--github-link);
  color: var(--github-link);
  transition: all 0.2s ease;
}

.empty-state .btn-outline-primary:hover {
  background-color: rgba(56, 139, 253, 0.1);
  border-color: #58a6ff;
}

.empty-state-message {
  font-size: 14px;
  color: var(--github-secondary-text);
  font-style: italic;
}

</style>