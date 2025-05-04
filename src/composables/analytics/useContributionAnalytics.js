import { ref, computed } from "vue";
import { db } from "@/firebase/config";

/**
 * Composable to handle contribution data for the GitHub-style heatmap
 * Uses GitHub's contribution counting methodology adapted for DevGate
 */
export default function useContributionAnalytics() {
    const contributions = ref([]);
    const isLoading = ref(true);
    const error = ref(null);
    const totalContributions = ref(0);

    // Track contribution types for analytics
    const contributionBreakdown = ref({
        commits: 0, // Code additions via GitHub
        posts: 0, // Knowledge sharing (like GitHub discussions)
        projects: 0, // Project creation (like GitHub repositories)
        pullRequests: 0, // Project updates (like GitHub PRs)
        issues: 0, // Objectives (like GitHub issues)
        reviews: 0, // Code reviews or comments
    });

    /**
     * Generate date objects for the selected time period
     * @param {string} period - Time period to generate dates for ('year', '6months', '3months', 'month')
     * @returns {Array} Array of date objects with initial count of 0
     */
    const generateDateRange = (period = "year") => {
        const data = [];
        const today = new Date();
        let startDate;

        switch (period) {
            case "month":
                startDate = new Date(today.getFullYear(), today.getMonth(), 1);
                break;
            case "3months":
                startDate = new Date(today);
                startDate.setMonth(today.getMonth() - 3);
                break;
            case "6months":
                startDate = new Date(today);
                startDate.setMonth(today.getMonth() - 6);
                break;
            case "year":
            default:
                startDate = new Date(today);
                startDate.setFullYear(today.getFullYear() - 1);
                break;
        }

        let currentDate = new Date(startDate);

        while (currentDate <= today) {
            data.push({
                date: currentDate.toISOString().split("T")[0],
                count: 0,
                dayOfWeek: currentDate.getDay(),
                details: [], // Store detailed breakdown of contributions
            });
            currentDate.setDate(currentDate.getDate() + 1);
        }

        return data;
    };

    /**
     * Fetch user activity data from all relevant collections
     * Following GitHub's contribution counting methodology
     * @param {string} userId - The user ID to fetch contributions for
     * @param {string} period - Time period to fetch ('year', '6months', '3months', 'month')
     */
    const fetchContributionData = async (userId, period = "year") => {
        if (!userId) return;

        isLoading.value = true;
        error.value = null;
        totalContributions.value = 0;

        // Reset contribution breakdown
        Object.keys(contributionBreakdown.value).forEach((key) => {
            contributionBreakdown.value[key] = 0;
        });

        try {
            // Generate the date framework first
            contributions.value = generateDateRange(period);

            // Get the start date based on the period
            const today = new Date();
            let startDate;

            switch (period) {
                case "month":
                    startDate = new Date(
                        today.getFullYear(),
                        today.getMonth(),
                        1
                    );
                    break;
                case "3months":
                    startDate = new Date(today);
                    startDate.setMonth(today.getMonth() - 3);
                    break;
                case "6months":
                    startDate = new Date(today);
                    startDate.setMonth(today.getMonth() - 6);
                    break;
                case "year":
                default:
                    startDate = new Date(today);
                    startDate.setFullYear(today.getFullYear() - 1);
                    break;
            }

            const userRef = db.collection("users").doc(userId);

            try {
                // Fetch all relevant contribution data in sequence

                // 1. GitHub commits from projects (GitHub integration)
                // This would count as commits in GitHub
                let commitsSnapshot;
                try {
                    commitsSnapshot = await userRef.collection("commits").get();
                } catch (err) {
                    console.warn("No commits collection found:", err);
                    commitsSnapshot = { docs: [] };
                }

                // 2. Posts (similar to GitHub discussions)
                let postsSnapshot;
                try {
                    postsSnapshot = await db
                        .collection("posts")
                        .where("userID", "==", userId)
                        .get();
                } catch (err) {
                    console.warn("Error fetching posts:", err);
                    postsSnapshot = { docs: [] };
                }

                // 3. Projects (similar to GitHub repositories)
                let projectsSnapshot;
                try {
                    projectsSnapshot = await userRef
                        .collection("projects")
                        .get();
                } catch (err) {
                    console.warn("Error fetching projects:", err);
                    projectsSnapshot = { docs: [] };
                }

                // 4. Project updates (similar to GitHub pull requests)
                let projectUpdatesSnapshot;
                try {
                    projectUpdatesSnapshot = await userRef
                        .collection("projectUpdates")
                        .get();
                } catch (err) {
                    console.warn("No project updates collection found:", err);
                    projectUpdatesSnapshot = { docs: [] };
                }

                // 5. Objectives (similar to GitHub issues)
                let objectivesSnapshot;
                try {
                    objectivesSnapshot = await userRef
                        .collection("objectives")
                        .get();
                } catch (err) {
                    console.warn("Error fetching objectives:", err);
                    objectivesSnapshot = { docs: [] };
                }

                // 6. Comments (similar to GitHub PR reviews)
                // Removing collectionGroup query since it requires a specific index
                // Instead, we'll look for post comments directly
                let postCommentsArray = [];
                try {
                    // Get posts created by the user first
                    const userPostsSnapshot = await db
                        .collection("posts")
                        .where("userID", "==", userId)
                        .get();

                    // Then fetch comments for each post
                    for (const postDoc of userPostsSnapshot.docs) {
                        try {
                            const commentsSnapshot = await db
                                .collection("posts")
                                .doc(postDoc.id)
                                .collection("comments")
                                .where("uid", "==", userId)
                                .get();

                            postCommentsArray = [
                                ...postCommentsArray,
                                ...commentsSnapshot.docs,
                            ];
                        } catch (commentErr) {
                            console.warn(
                                `Error fetching comments for post ${postDoc.id}:`,
                                commentErr
                            );
                        }
                    }
                } catch (err) {
                    console.warn(
                        "Error fetching user posts for comments:",
                        err
                    );
                }

                // Process GitHub commits (direct code contributions)
                commitsSnapshot.forEach((doc) => {
                    const commit = doc.data();
                    if (commit.timestamp && commit.timestamp.toDate) {
                        const commitDate = commit.timestamp.toDate();
                        if (commitDate >= startDate) {
                            incrementContribution(
                                commitDate,
                                "commits",
                                commit.message || "Code commit"
                            );
                        }
                    }
                });

                // Process posts (like GitHub discussions)
                postsSnapshot.forEach((doc) => {
                    const post = doc.data();
                    if (post.created && post.created.toDate) {
                        const postDate = post.created.toDate();
                        if (postDate >= startDate) {
                            incrementContribution(
                                postDate,
                                "posts",
                                "Created a post"
                            );
                        }
                    }
                });

                // Process projects (like GitHub repositories)
                projectsSnapshot.forEach((doc) => {
                    const project = doc.data();
                    // Count project creation (like creating a repository)
                    if (project.createdAt && project.createdAt.toDate) {
                        const createdDate = project.createdAt.toDate();
                        if (createdDate >= startDate) {
                            incrementContribution(
                                createdDate,
                                "projects",
                                `Created project: ${
                                    project.title || "Untitled"
                                }`
                            );
                        }
                    }
                });

                // Process project updates (like GitHub pull requests)
                projectUpdatesSnapshot.forEach((doc) => {
                    const update = doc.data();
                    if (update.timestamp && update.timestamp.toDate) {
                        const updateDate = update.timestamp.toDate();
                        if (updateDate >= startDate) {
                            incrementContribution(
                                updateDate,
                                "pullRequests",
                                `Updated project: ${
                                    update.projectTitle || "Untitled"
                                }`
                            );
                        }
                    }
                });

                // Use project updates as a fallback if no direct project updates collection
                if (projectUpdatesSnapshot.docs.length === 0) {
                    projectsSnapshot.forEach((doc) => {
                        const project = doc.data();
                        // Count updates separately (like pull requests)
                        if (
                            project.updatedAt &&
                            project.updatedAt.toDate &&
                            project.createdAt &&
                            project.createdAt.toDate
                        ) {
                            const updatedDate = project.updatedAt.toDate();
                            const createdDate = project.createdAt.toDate();

                            // Only count as a contribution if update is different from creation
                            if (
                                updatedDate >= startDate &&
                                updatedDate.getTime() !== createdDate.getTime()
                            ) {
                                incrementContribution(
                                    updatedDate,
                                    "pullRequests",
                                    `Updated project: ${
                                        project.title || "Untitled"
                                    }`
                                );
                            }
                        }
                    });
                }

                // Process objectives (like GitHub issues)
                objectivesSnapshot.forEach((doc) => {
                    const objective = doc.data();
                    // Count objective creation (like opening an issue)
                    if (objective.startDate && objective.startDate.toDate) {
                        const startDateObj = objective.startDate.toDate();
                        if (startDateObj >= startDate) {
                            incrementContribution(
                                startDateObj,
                                "issues",
                                `Created objective: ${
                                    objective.title || "Untitled"
                                }`
                            );
                        }
                    }

                    // Count objective updates (like issue comments)
                    if (
                        objective.lastUpdate &&
                        objective.lastUpdate.toDate &&
                        objective.startDate &&
                        objective.startDate.toDate
                    ) {
                        const updateDate = objective.lastUpdate.toDate();
                        const createDate = objective.startDate.toDate();

                        // Only count as a contribution if update is different from creation
                        if (
                            updateDate >= startDate &&
                            updateDate.getTime() !== createDate.getTime()
                        ) {
                            incrementContribution(
                                updateDate,
                                "issues",
                                `Updated objective: ${
                                    objective.title || "Untitled"
                                }`
                            );
                        }
                    }
                });

                // Process comments from our array (like GitHub PR reviews)
                postCommentsArray.forEach((doc) => {
                    const comment = doc.data();
                    if (comment.createdAt && comment.createdAt.toDate) {
                        const commentDate = comment.createdAt.toDate();
                        if (commentDate >= startDate) {
                            incrementContribution(
                                commentDate,
                                "reviews",
                                "Posted a comment"
                            );
                        }
                    }
                });

                // Count skills separately - GitHub doesn't have a direct equivalent,
                // but we could consider them as knowledge sharing contributions
                try {
                    const skillsSnapshot = await userRef
                        .collection("skills")
                        .get();

                    skillsSnapshot.forEach((doc) => {
                        const skill = doc.data();
                        // Skills are like specialized knowledge documentation
                        if (skill.acquiredAt && skill.acquiredAt.toDate) {
                            const acquiredDate = skill.acquiredAt.toDate();
                            if (acquiredDate >= startDate) {
                                incrementContribution(
                                    acquiredDate,
                                    "posts",
                                    `Added skill: ${skill.name || "Untitled"}`
                                );
                            }
                        }
                    });
                } catch (err) {
                    console.warn("Error fetching skills:", err);
                }

                console.log(
                    "Contribution breakdown:",
                    contributionBreakdown.value
                );
                console.log("Total contributions:", totalContributions.value);
            } catch (innerErr) {
                console.error("Error processing contribution data:", innerErr);
                error.value = "Error processing contribution data";
            }
        } catch (err) {
            console.error("Error fetching contribution data:", err);
            error.value = "Failed to load contribution data";
        } finally {
            isLoading.value = false;
        }
    };

    /**
     * Helper function to increment contribution count for a specific date with a type
     * @param {Date} date - The date to increment contribution count for
     * @param {string} type - The type of contribution (commits, posts, etc.)
     * @param {string} description - A description of the contribution
     */
    const incrementContribution = (date, type, description) => {
        const dateString = date.toISOString().split("T")[0];
        const dayData = contributions.value.find((d) => d.date === dateString);

        if (dayData) {
            dayData.count += 1;
            dayData.details.push({
                type,
                description,
                timestamp: date.getTime(),
            });

            // Increment counters
            totalContributions.value += 1;

            // Increment the specific type counter
            // eslint-disable-next-line no-prototype-builtins
            if (contributionBreakdown.value.hasOwnProperty(type)) {
                contributionBreakdown.value[type] += 1;
            }
        }
    };

    // Computed property to get contributions sorted by date
    const sortedContributions = computed(() => {
        return [...contributions.value].sort((a, b) => {
            return new Date(a.date) - new Date(b.date);
        });
    });

    return {
        contributions: sortedContributions,
        isLoading,
        error,
        totalContributions,
        contributionBreakdown,
        fetchContributionData,
    };
}
