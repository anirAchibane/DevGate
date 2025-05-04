import { ref } from "vue";
import { db } from "@/firebase/config";
import { calculateUserLevel, updateUserLevel } from "@/services/levelService";

export default function useLevelProgression() {
    const levelsData = ref({
        labels: [],
        datasets: [],
    });
    const isLoading = ref(true);
    const error = ref(null);
    const currentLevel = ref(1);
    const nextLevelRequirements = ref("");

    // Fetch the user's current level and level history
    const fetchLevelData = async (userId) => {
        isLoading.value = true;
        try {
            // Get the user's level history from Firebase
            const levelHistorySnapshot = await db
                .collection("users")
                .doc(userId)
                .collection("levelHistory")
                .orderBy("achievedAt", "asc")
                .get();

            // Get the user's current level
            const userLevel = await calculateUserLevel(userId);
            currentLevel.value = userLevel.level;
            nextLevelRequirements.value = userLevel.nextLevelRequirements;

            if (levelHistorySnapshot.empty) {
                // If no level history exists, create a starting entry if this is level 1
                if (currentLevel.value === 1) {
                    // Add a base level history record for new users
                    await db
                        .collection("users")
                        .doc(userId)
                        .collection("levelHistory")
                        .add({
                            level: 1,
                            achievedAt: new Date(),
                            previousLevel: 0,
                        });

                    // Set chart data with just the initial level
                    levelsData.value = {
                        labels: [
                            new Date().toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                            }),
                        ],
                        datasets: [
                            {
                                label: "Level Progression",
                                backgroundColor: "rgba(153, 102, 255, 0.2)",
                                borderColor: "rgba(153, 102, 255, 1)",
                                borderWidth: 1,
                                data: [1],
                                fill: false,
                                tension: 0.1,
                            },
                        ],
                    };
                } else {
                    // Return empty chart data if no real data exists and not level 1
                    levelsData.value = {
                        labels: ["No data available"],
                        datasets: [
                            {
                                label: "Level Progression",
                                backgroundColor: "rgba(153, 102, 255, 0.2)",
                                borderColor: "rgba(153, 102, 255, 1)",
                                borderWidth: 1,
                                data: [0],
                                fill: false,
                                tension: 0.1,
                            },
                        ],
                    };
                }
            } else {
                // Format real data for Chart.js
                const levels = [];
                const dates = [];

                levelHistorySnapshot.forEach((doc) => {
                    const levelData = doc.data();
                    levels.push(levelData.level);

                    // Convert Firestore timestamp to Date, handling different timestamp formats
                    let date;
                    if (levelData.achievedAt && levelData.achievedAt.toDate) {
                        date = levelData.achievedAt.toDate();
                    } else if (
                        levelData.achievedAt &&
                        levelData.achievedAt.seconds
                    ) {
                        date = new Date(levelData.achievedAt.seconds * 1000);
                    } else if (typeof levelData.achievedAt === "string") {
                        date = new Date(levelData.achievedAt);
                    } else {
                        date = new Date();
                    }

                    dates.push(
                        date.toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                        })
                    );
                });

                levelsData.value = {
                    labels: dates,
                    datasets: [
                        {
                            label: "Level Progression",
                            backgroundColor: "rgba(153, 102, 255, 0.2)",
                            borderColor: "rgba(153, 102, 255, 1)",
                            borderWidth: 1,
                            data: levels,
                            fill: false,
                            tension: 0.1,
                        },
                    ],
                };
            }

            isLoading.value = false;
        } catch (err) {
            console.error("Error fetching level data:", err);
            error.value = err.message;

            // Provide empty data structure on error
            levelsData.value = {
                labels: ["Error loading data"],
                datasets: [
                    {
                        label: "Level Progression",
                        backgroundColor: "rgba(255, 99, 132, 0.2)",
                        borderColor: "rgba(255, 99, 132, 1)",
                        borderWidth: 1,
                        data: [0],
                        fill: false,
                        tension: 0.1,
                    },
                ],
            };

            isLoading.value = false;
        }
    };

    // Check and update the user's level if needed
    const checkAndUpdateLevel = async (userId) => {
        try {
            const { level, updated } = await updateUserLevel(userId);

            if (updated) {
                // If level was updated, refresh the chart data
                await fetchLevelData(userId);
                return { level, updated: true };
            }

            return { level, updated: false };
        } catch (err) {
            console.error("Error updating level:", err);
            return { level: currentLevel.value, updated: false };
        }
    };

    return {
        levelsData,
        isLoading,
        error,
        currentLevel,
        nextLevelRequirements,
        fetchLevelData,
        checkAndUpdateLevel,
    };
}
