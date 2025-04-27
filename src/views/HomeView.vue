<template>
    <div class="all">
        <mini-navbar />
        <h1 class="page-title">HomeView.vue</h1>
        <div class="content-container">
            <!-- Sample sections with filler data -->
            <div class="content-sections">
                <!-- Sample ProfileItem -->
                <div class="section">
                    <h2 class="section-title">Sample Profile</h2>
                    <div class="profile-sample">
                        <profile-item
                            userId="sample-user-123"
                            username="John Developer"
                            bio="Full-stack developer passionate about Vue.js, Firebase, and building amazing web applications. Currently working on DevGate and other exciting projects."
                            :avatar="require('@/assets/default_pfp.jpg')"
                            :skills="sampleSkills"
                            :projectCount="5"
                        />
                    </div>
                </div>

                <!-- Sample FollowableUsersList -->
                <div class="section">
                    <followable-users-list-sample />
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import MiniNavbar from "@/components/MiniNavbar.vue";
import ProfileItem from "@/components/ProfileItem.vue";
import { defineComponent, h } from "vue";

// Sample skills data for the profile item
const sampleSkills = [
    { id: "1", name: "Vue.js" },
    { id: "2", name: "Firebase" },
    { id: "3", name: "JavaScript" },
    { id: "4", name: "CSS" },
    { id: "5", name: "UI/UX Design" },
];

// Create a sample version of FollowableUsersList with mock data
// This way we don't need to modify the actual component
const FollowableUsersListSample = defineComponent({
    name: "FollowableUsersListSample",
    setup() {
        // Sample users data
        const sampleUsers = [
            {
                id: "user1",
                username: "Sarah Johnson",
                bio: "Frontend developer specializing in Vue and React. Love creating beautiful UI experiences.",
                avatar: null,
                skills: [
                    { name: "Vue.js" },
                    { name: "React" },
                    { name: "CSS" },
                    { name: "UX Design" },
                ],
                isFollowing: false,
            },
            {
                id: "user2",
                username: "Michael Chen",
                bio: "Backend developer with 5+ years experience. Specialized in Node.js and Firebase.",
                avatar: null,
                skills: [
                    { name: "Node.js" },
                    { name: "Firebase" },
                    { name: "Express" },
                ],
                isFollowing: true,
            },
            {
                id: "user3",
                username: "Emma Williams",
                bio: "Full stack developer and tech blogger. Currently learning machine learning.",
                avatar: null,
                skills: [
                    { name: "Python" },
                    { name: "Django" },
                    { name: "TensorFlow" },
                    { name: "JavaScript" },
                ],
                isFollowing: false,
            },
        ];

        return () => {
            // Return the component with our mock props and methods
            return h("div", { class: "followable-users-sample" }, [
                h(
                    "h2",
                    { class: "sample-title" },
                    "People You Might Want to Follow"
                ),
                h("div", { class: "user-list" }, [
                    // Map sample users to user cards
                    ...sampleUsers.map((user) =>
                        h("div", { key: user.id, class: "user-card" }, [
                            h("div", { class: "user-info" }, [
                                h("div", { class: "user-avatar" }, [
                                    h("img", {
                                        src: require("@/assets/default_pfp.jpg"),
                                        alt: "User avatar",
                                    }),
                                ]),
                                h("div", { class: "user-details" }, [
                                    h(
                                        "h3",
                                        { class: "username" },
                                        user.username
                                    ),
                                    h("p", { class: "bio" }, user.bio),
                                    h("div", { class: "skill-tags" }, [
                                        ...user.skills
                                            .slice(0, 3)
                                            .map((skill) =>
                                                h(
                                                    "span",
                                                    {
                                                        key: skill.name,
                                                        class: "skill-tag",
                                                    },
                                                    skill.name
                                                )
                                            ),
                                        user.skills.length > 3
                                            ? h(
                                                  "span",
                                                  { class: "more-skills" },
                                                  `+${
                                                      user.skills.length - 3
                                                  } more`
                                              )
                                            : null,
                                    ]),
                                ]),
                            ]),
                            h("div", { class: "action-buttons" }, [
                                h(
                                    "button",
                                    {
                                        class: `btn btn-sm ${
                                            user.isFollowing
                                                ? "btn-primary"
                                                : "btn-outline"
                                        }`,
                                    },
                                    [
                                        h("i", {
                                            class: user.isFollowing
                                                ? "fas fa-user-check"
                                                : "fas fa-user-plus",
                                        }),
                                        ` ${
                                            user.isFollowing
                                                ? "Following"
                                                : "Follow"
                                        }`,
                                    ]
                                ),
                                h(
                                    "button",
                                    {
                                        class: "btn btn-sm btn-outline view-profile",
                                    },
                                    [
                                        h("i", { class: "fas fa-user-circle" }),
                                        " View",
                                    ]
                                ),
                            ]),
                        ])
                    ),
                ]),
            ]);
        };
    },
});
</script>

<style>
html,
body,
#app {
    height: 100%;
    margin: 0;
    padding: 0;
}

.all {
    background-color: #0d1117;
    width: 100%;
    min-height: 100%;
}

.content-container {
    padding: 2rem;
    max-width: 1200px;
    margin: 0 auto;
}

.content-sections {
    display: flex;
    flex-direction: column;
    gap: 3rem;
    align-items: center;
}

.section {
    width: 100%;
    max-width: 800px;
}

.section-title {
    color: #ffffff;
    font-size: 1.5rem;
    margin-bottom: 1rem;
}

.page-title {
    color: #ffffff;
    font-size: 2.5rem;
    font-weight: 700;
    text-align: center;
    margin-top: 2rem;
}

.profile-sample {
    width: 100%;
    max-width: 700px;
}

/* Sample FollowableUsersList Styles */
.followable-users-sample {
    width: 100%;
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
    background-color: #1a2233;
    border-radius: 8px;
    border: 1px solid #555d69;
}

.sample-title {
    font-size: 24px;
    font-weight: 600;
    color: #ffffff;
    margin-bottom: 10px;
}

.sample-description {
    color: #7d8796;
    font-size: 14px;
    margin-bottom: 20px;
    padding-bottom: 10px;
    border-bottom: 1px solid #555d69;
}

.user-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.user-card {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px;
    background-color: rgba(13, 17, 23, 0.5);
    border-radius: 8px;
    border: 1px solid #555d69;
    transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.user-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.3);
    border-color: #3498db;
}

.user-info {
    display: flex;
    align-items: center;
    flex: 1;
    min-width: 0;
}

.user-avatar {
    margin-right: 16px;
    flex-shrink: 0;
}

.user-avatar img {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid #3498db;
}

.user-details {
    flex: 1;
    min-width: 0;
}

.username {
    font-size: 18px;
    font-weight: 600;
    margin: 0 0 4px 0;
    color: #ffffff;
}

.bio {
    font-size: 14px;
    color: #cfd8dc;
    margin: 0 0 8px 0;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
}

.skill-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
}

.skill-tag {
    background-color: rgba(52, 152, 219, 0.15);
    padding: 3px 8px;
    border-radius: 4px;
    font-size: 12px;
    color: #3498db;
    font-weight: 500;
    border: 1px solid rgba(52, 152, 219, 0.3);
}

.more-skills {
    font-size: 12px;
    color: #7d8796;
    padding: 3px 0;
}

.action-buttons {
    display: flex;
    flex-shrink: 0;
    gap: 10px;
}

.view-profile {
    background-color: transparent;
    color: #cfd8dc;
    border-color: #555d69;
}

@media (max-width: 768px) {
    .content-container {
        padding: 1rem;
    }

    .page-title {
        font-size: 2rem;
    }

    .user-card {
        flex-direction: column;
        align-items: flex-start;
    }

    .action-buttons {
        margin-top: 16px;
        width: 100%;
        justify-content: space-between;
    }
}
</style>
