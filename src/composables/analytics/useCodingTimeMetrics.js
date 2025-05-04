import { ref } from "vue";
import { db } from "@/firebase/config";

export default function useCodingTimeMetrics() {
    const codingTimeData = ref({
        labels: [],
        datasets: [],
    });
    const isLoading = ref(true);
    const error = ref(null);
    const languageData = ref([]);
    const projectData = ref([]);
    const stats = ref({
        totalHours: 0,
        dailyAverage: 0
    });

    // Fetch coding time data from Firestore
    const fetchCodingTimeData = async (userId) => {
        isLoading.value = true;
        error.value = null;
        
        try {
            // Get coding time data from Firestore
            const codingTimeSnapshot = await db
                .collection("users")
                .doc(userId)
                .collection("codingTime")
                .orderBy("date", "asc")
                .get();
                
            if (codingTimeSnapshot.empty) {
                // Handle empty data case
                codingTimeData.value = {
                    labels: ['No data available'],
                    datasets: [{
                        label: 'Coding Hours',
                        backgroundColor: 'rgba(54, 162, 235, 0.2)',
                        borderColor: 'rgba(54, 162, 235, 1)',
                        borderWidth: 1,
                        data: [0],
                    }]
                };
                isLoading.value = false;
                return;
            }
            
            // Process the coding time data
            const timeEntries = [];
            const weeklyHours = new Map();
            const languagesMap = new Map();
            const projectsMap = new Map();
            let totalMinutes = 0;
            
            codingTimeSnapshot.forEach(doc => {
                const entry = doc.data();
                timeEntries.push(entry);
                
                // Calculate weekly data
                let date;
                if (entry.date && entry.date.toDate) {
                    date = entry.date.toDate();
                } else if (entry.date && entry.date.seconds) {
                    date = new Date(entry.date.seconds * 1000);
                } else if (typeof entry.date === 'string') {
                    date = new Date(entry.date);
                } else {
                    // Skip entries without valid dates
                    return;
                }
                
                // Convert date to week string (e.g., "May 1-7")
                const weekStart = new Date(date);
                weekStart.setDate(date.getDate() - date.getDay());
                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekStart.getDate() + 6);
                
                const month = weekStart.toLocaleString('default', { month: 'short' });
                const weekKey = `${month} ${weekStart.getDate()}-${weekEnd.getDate()}`;
                
                // Convert hours - supporting both duration and hours fields
                const hoursSpent = entry.hours || (entry.duration ? (entry.duration / 60) : 0);
                totalMinutes += hoursSpent * 60; // Convert hours to minutes for total calculation
                
                // Add to weekly data
                if (weeklyHours.has(weekKey)) {
                    weeklyHours.set(weekKey, weeklyHours.get(weekKey) + hoursSpent);
                } else {
                    weeklyHours.set(weekKey, hoursSpent);
                }
                
                // Track languages used (if available)
                if (entry.language) {
                    if (languagesMap.has(entry.language)) {
                        languagesMap.set(entry.language, languagesMap.get(entry.language) + hoursSpent);
                    } else {
                        languagesMap.set(entry.language, hoursSpent);
                    }
                }
                
                // Track projects worked on (if available)
                if (entry.projectId) {
                    if (projectsMap.has(entry.projectId)) {
                        projectsMap.set(entry.projectId, projectsMap.get(entry.projectId) + hoursSpent);
                    } else {
                        projectsMap.set(entry.projectId, hoursSpent);
                    }
                }
            });
            
            // Sort weeks chronologically
            const sortedWeeks = Array.from(weeklyHours.keys()).sort((a, b) => {
                const dateA = new Date(a.split(' ')[0] + ' ' + a.split(' ')[1].split('-')[0]);
                const dateB = new Date(b.split(' ')[0] + ' ' + b.split(' ')[1].split('-')[0]);
                return dateA - dateB;
            });
            
            // Format for Chart.js
            codingTimeData.value = {
                labels: sortedWeeks,
                datasets: [{
                    label: 'Coding Hours per Week',
                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1,
                    data: sortedWeeks.map(week => Math.round(weeklyHours.get(week) * 10) / 10) // Round to 1 decimal
                }]
            };
            
            // Process languages data
            languageData.value = Array.from(languagesMap.entries()).map(([language, hours]) => ({
                language,
                hours: Math.round(hours * 10) / 10
            })).sort((a, b) => b.hours - a.hours);
            
            // Process projects data
            projectData.value = Array.from(projectsMap.entries()).map(([projectId, hours]) => ({
                projectId,
                hours: Math.round(hours * 10) / 10
            })).sort((a, b) => b.hours - a.hours);
            
            // Calculate stats
            const totalHours = totalMinutes / 60;
            const totalDays = timeEntries.length > 0 ? 
                Math.max(1, Math.round((Date.now() - timeEntries[0].date.toDate()) / (1000 * 60 * 60 * 24))) : 1;
                
            stats.value = {
                totalHours: Math.round(totalHours * 10) / 10,
                dailyAverage: Math.round((totalHours / totalDays) * 10) / 10
            };
            
            isLoading.value = false;
            
        } catch (err) {
            console.error("Error fetching coding time data:", err);
            error.value = err.message || "Failed to fetch coding time data";
            
            // Provide empty chart data on error
            codingTimeData.value = {
                labels: ['Error loading data'],
                datasets: [{
                    label: 'Coding Hours',
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
        codingTimeData,
        isLoading,
        error,
        languageData,
        projectData,
        stats,
        fetchCodingTimeData
    };
}
