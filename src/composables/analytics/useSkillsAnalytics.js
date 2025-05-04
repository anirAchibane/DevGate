import { ref } from "vue";
import { db } from "@/firebase/config";

export default function useSkillsAnalytics() {
    const skillsData = ref({
        labels: [],
        datasets: [],
    });
    const isLoading = ref(true);
    const error = ref(null);

    // Function to fetch skills data from Firebase
    const fetchSkillsData = async (userId) => {
        isLoading.value = true;
        try {
            // Get the user's skills from Firebase
            const skillsSnapshot = await db
                .collection("users")
                .doc(userId)
                .collection("skills")
                .get();

            // If no skills data, return empty chart
            if (skillsSnapshot.empty) {
                skillsData.value = {
                    labels: ['No data available'],
                    datasets: [{
                        label: 'Skills Added',
                        backgroundColor: 'rgba(75, 192, 192, 0.2)',
                        borderColor: 'rgba(75, 192, 192, 1)',
                        borderWidth: 1,
                        data: [0],
                    }]
                };
                isLoading.value = false;
                return;
            }

            // Create a map to store skills count by month
            const skillsByMonth = new Map();
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

            skillsSnapshot.forEach((doc) => {
                const skillData = doc.data();
                // Get month and year from the timestamp (check multiple possible field names)
                const timestamp = skillData.acquiredAt || skillData.createdAt || skillData.dateAdded;
                let date;
                
                if (timestamp && timestamp.toDate) {
                    date = timestamp.toDate();
                } else if (timestamp && timestamp.seconds) {
                    date = new Date(timestamp.seconds * 1000);
                } else {
                    date = new Date();
                }
                
                const monthIndex = date.getMonth();
                const year = date.getFullYear();
                const monthYear = `${monthNames[monthIndex]} ${year}`;

                // Increment the count for this month
                if (skillsByMonth.has(monthYear)) {
                    skillsByMonth.set(
                        monthYear,
                        skillsByMonth.get(monthYear) + 1
                    );
                } else {
                    skillsByMonth.set(monthYear, 1);
                }
            });

            // Sort the months chronologically
            const sortedMonths = Array.from(skillsByMonth.keys()).sort((a, b) => {
                const [monthA, yearA] = [monthNames.indexOf(a.split(' ')[0]), parseInt(a.split(' ')[1])];
                const [monthB, yearB] = [monthNames.indexOf(b.split(' ')[0]), parseInt(b.split(' ')[1])];
                return yearA !== yearB ? yearA - yearB : monthA - monthB;
            });

            // Format data for Chart.js
            skillsData.value = {
                labels: sortedMonths,
                datasets: [
                    {
                        label: "Skills Added",
                        backgroundColor: "rgba(75, 192, 192, 0.2)",
                        borderColor: "rgba(75, 192, 192, 1)",
                        borderWidth: 1,
                        data: sortedMonths.map((month) =>
                            skillsByMonth.get(month)
                        ),
                    },
                ],
            };

            isLoading.value = false;
        } catch (err) {
            console.error("Error fetching skills data:", err);
            error.value = err.message;
            
            // Provide empty data structure on error
            skillsData.value = {
                labels: ['Error loading data'],
                datasets: [{
                    label: 'Skills Added',
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
        skillsData,
        isLoading,
        error,
        fetchSkillsData,
    };
}
