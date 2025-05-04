import { db } from "@/firebase/config";

/**
 * Level system definition with requirements for each level
 */
export const levelSystem = {
    levels: [
        { level: 1, name: "Beginner", requirements: "Join DevGate" },
        {
            level: 2,
            name: "Code Explorer",
            requirements: "Complete 2 projects",
            projectsRequired: 2,
        },
        {
            level: 3,
            name: "Developer",
            requirements: "Log 50 hours of coding",
            codingHoursRequired: 50,
        },
        {
            level: 4,
            name: "Code Craftsman",
            requirements: "Complete 5 projects & add 5 skills",
            projectsRequired: 5,
            skillsRequired: 5,
        },
        {
            level: 5,
            name: "Master Programmer",
            requirements: "Log 200 hours & complete 10 projects",
            codingHoursRequired: 200,
            projectsRequired: 10,
        },
    ],
};

/**
 * Calculate the user's level based on their activities
 * @param {string} userId - The user ID
 * @returns {Promise<{level: number, nextLevelRequirements: string}>} The user's current level and requirements for next level
 */
export async function calculateUserLevel(userId) {
    try {
        // Get user data
        const userSnapshot = await db.collection("users").doc(userId).get();

        if (!userSnapshot.exists) {
            return {
                level: 1,
                nextLevelRequirements:
                    levelSystem.levels[1]?.requirements || "Max level reached",
            };
        }

        // Get user projects
        const projectsSnapshot = await db
            .collection("users")
            .doc(userId)
            .collection("projects")
            .get();
        const completedProjects = projectsSnapshot.docs.filter(
            (doc) => doc.data().status === "completed"
        ).length;

        // Get user skills
        const skillsSnapshot = await db
            .collection("users")
            .doc(userId)
            .collection("skills")
            .get();
        const skillsCount = skillsSnapshot.size;

        // Get user coding time
        const codingTimeSnapshot = await db
            .collection("users")
            .doc(userId)
            .collection("codingTime")
            .get();
        let totalCodingHours = 0;

        codingTimeSnapshot.forEach((doc) => {
            const entry = doc.data();
            if (entry.hours && !isNaN(entry.hours)) {
                totalCodingHours += parseFloat(entry.hours);
            }
        });

        // Determine user level based on data
        let currentLevel = 1; // Everyone starts at level 1

        // Check each level's requirements
        for (let i = 1; i < levelSystem.levels.length; i++) {
            const level = levelSystem.levels[i];
            const meetsProjectsRequirement =
                !level.projectsRequired ||
                completedProjects >= level.projectsRequired;
            const meetsSkillsRequirement =
                !level.skillsRequired || skillsCount >= level.skillsRequired;
            const meetsCodingHoursRequirement =
                !level.codingHoursRequired ||
                totalCodingHours >= level.codingHoursRequired;

            // If all requirements are met for this level
            if (
                meetsProjectsRequirement &&
                meetsSkillsRequirement &&
                meetsCodingHoursRequirement
            ) {
                currentLevel = level.level;
            } else {
                break; // Stop at the first level where requirements aren't met
            }
        }

        // Get requirements for next level
        const nextLevelIdx = currentLevel;
        const nextLevelRequirements =
            nextLevelIdx < levelSystem.levels.length
                ? levelSystem.levels[nextLevelIdx].requirements
                : "Max level reached";

        return {
            level: currentLevel,
            nextLevelRequirements,
        };
    } catch (error) {
        console.error("Error calculating user level:", error);
        return { level: 1, nextLevelRequirements: "Error calculating level" };
    }
}

/**
 * Updates the user's level if needed and saves to level history
 * @param {string} userId - The user ID
 * @returns {Promise<{level: number, updated: boolean}>} The user's current level and whether it was updated
 */
export async function updateUserLevel(userId) {
    try {
        // First get the user's current level stored in their profile
        const userDoc = await db.collection("users").doc(userId).get();
        const currentStoredLevel = userDoc.data()?.level || 1;

        // Calculate the user's level based on their activities
        const { level: calculatedLevel } = await calculateUserLevel(userId);

        // Check if level needs updating
        if (calculatedLevel > currentStoredLevel) {
            // Update the user's level in their profile
            await db.collection("users").doc(userId).update({
                level: calculatedLevel,
            });

            // Add a new entry to the level history collection
            await db
                .collection("users")
                .doc(userId)
                .collection("levelHistory")
                .add({
                    level: calculatedLevel,
                    achievedAt: new Date(),
                    previousLevel: currentStoredLevel,
                });

            return { level: calculatedLevel, updated: true };
        }

        return { level: calculatedLevel, updated: false };
    } catch (error) {
        console.error("Error updating user level:", error);
        return { level: -1, updated: false };
    }
}
