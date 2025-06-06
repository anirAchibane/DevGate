import { ref } from "vue";
import { db } from "@/firebase/config";

export default function useProjectCompletionStats() {
    const projectsData = ref({
        labels: [],
        datasets: [],
    });
    const isLoading = ref(true);
    const error = ref(null);

    const fetchProjectData = async (userId) => {
        isLoading.value = true;
        error.value = null;
        try {
            // Get user's projects from Firebase
            const projectsSnapshot = await db
                .collection("users")
                .doc(userId)
                .collection("projects")
                .orderBy("createdAt", "asc")
                .get();

            if (projectsSnapshot.empty) {
                // Handle empty data case
                projectsData.value = {
                    labels: ['No data available'],
                    datasets: [
                        {
                            label: "Projects",
                            backgroundColor: "rgba(255, 159, 64, 0.2)",
                            borderColor: "rgba(255, 159, 64, 1)",
                            borderWidth: 1,
                            data: [0],
                        },
                    ],
                };
            } else {
                // Group projects by status
                const projectsByStatus = new Map();
                // Group completed projects by month/year
                const completedProjectsByMonth = new Map();
                
                // Process projects
                projectsSnapshot.forEach((doc) => {
                    const projectData = doc.data();
                    
                    // Track projects by status (for pie chart)
                    const status = projectData.status || 'In Progress';
                    if (projectsByStatus.has(status)) {
                        projectsByStatus.set(status, projectsByStatus.get(status) + 1);
                    } else {
                        projectsByStatus.set(status, 1);
                    }
                    
                    // Only include completed/finished projects in the timeline chart
                    if (status === 'Finished' || status === 'Completed') {
                        // Convert Firestore timestamp to Date, handling different timestamp formats
                        let date;
                        if (projectData.createdAt && projectData.createdAt.toDate) {
                            date = projectData.createdAt.toDate();
                        } else if (projectData.createdAt && projectData.createdAt.seconds) {
                            date = new Date(projectData.createdAt.seconds * 1000);
                        } else if (typeof projectData.createdAt === 'string') {
                            date = new Date(projectData.createdAt);
                        } else {
                            date = new Date();
                        }
                        
                        const monthYear = `${date.toLocaleString("en-US", {
                            month: "short",
                        })} ${date.getFullYear()}`;

                        if (completedProjectsByMonth.has(monthYear)) {
                            completedProjectsByMonth.set(
                                monthYear,
                                completedProjectsByMonth.get(monthYear) + 1
                            );
                        } else {
                            completedProjectsByMonth.set(monthYear, 1);
                        }
                    }
                });

                // Sort the months chronologically
                const sortedMonths = Array.from(completedProjectsByMonth.keys()).sort(
                    (a, b) => {
                        const [monthA, yearA] = [
                            a.split(" ")[0],
                            parseInt(a.split(" ")[1]),
                        ];
                        const [monthB, yearB] = [
                            b.split(" ")[0],
                            parseInt(b.split(" ")[1]),
                        ];

                        const months = [
                            "Jan",
                            "Feb",
                            "Mar",
                            "Apr",
                            "May",
                            "Jun",
                            "Jul",
                            "Aug",
                            "Sep",
                            "Oct",
                            "Nov",
                            "Dec",
                        ];
                        const monthIndexA = months.indexOf(monthA);
                        const monthIndexB = months.indexOf(monthB);

                        return yearA !== yearB
                            ? yearA - yearB
                            : monthIndexA - monthIndexB;
                    }
                );

                // Format data for Chart.js
                if (sortedMonths.length === 0) {
                    // If there are no completed projects but we have projects, show them as a single category
                    projectsData.value = {
                        labels: ['All Projects'],
                        datasets: [
                            {
                                label: "Projects",
                                backgroundColor: "rgba(255, 159, 64, 0.2)",
                                borderColor: "rgba(255, 159, 64, 1)",
                                borderWidth: 1,
                                data: [projectsSnapshot.size], // Use the total number of projects
                            },
                        ],
                    };
                } else {
                    projectsData.value = {
                        labels: sortedMonths,
                        datasets: [
                            {
                                label: "Projects",
                                backgroundColor: "rgba(255, 159, 64, 0.2)",
                                borderColor: "rgba(255, 159, 64, 1)",
                                borderWidth: 1,
                                data: sortedMonths.map((month) =>
                                    completedProjectsByMonth.get(month)
                                ),
                            },
                        ],
                    };
                }
            }

            isLoading.value = false;
        } catch (err) {
            console.error("Error fetching project data:", err);
            error.value = err.message;
            
            // Provide empty data structure on error
            projectsData.value = {
                labels: ['Error loading data'],
                datasets: [{
                    label: 'Projects',
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 1,
                    data: [0],
                }]
            };
            
            isLoading.value = false;
        }
    };

    return {
        projectsData,
        isLoading,
        error,
        fetchProjectData,
    };
}
