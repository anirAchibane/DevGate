/**
 * Mock service to generate coding time metrics data
 * This replaces the Wakatime API integration
 */

// Helper to generate random values between min and max
const randomBetween = (min, max) => Math.floor(Math.random() * (max - min + 1) + min);

// Generate fake coding time data for the past weeks
const generateWeeklyData = (weeks = 10) => {
  const labels = [];
  const codingHours = [];
  
  // Generate week labels and random coding hours
  for (let i = weeks - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - (i * 7));
    
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay());
    
    // Format date as "Apr 10 - Apr 16"
    const month = weekStart.toLocaleString('default', { month: 'short' });
    const day = weekStart.getDate();
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    const endMonth = weekEnd.toLocaleString('default', { month: 'short' });
    const endDay = weekEnd.getDate();
    
    const weekLabel = `${month} ${day} - ${endMonth} ${endDay}`;
    labels.push(weekLabel);
    
    // Generate a random number of coding hours (between 5 and 40)
    codingHours.push(randomBetween(5, 40));
  }
  
  return {
    labels,
    datasets: [
      {
        label: 'Coding Hours',
        data: codingHours,
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 2,
        tension: 0.4
      }
    ]
  };
};

// Generate fake language usage data
const generateLanguageData = () => {
  const languages = [
    { name: 'JavaScript', color: '#f7df1e' },
    { name: 'Vue.js', color: '#42b883' },
    { name: 'HTML', color: '#e34c26' },
    { name: 'CSS', color: '#264de4' },
    { name: 'Python', color: '#3776ab' },
    { name: 'TypeScript', color: '#007acc' },
    { name: 'Java', color: '#b07219' }
  ];
  
  return languages.map(lang => ({
    ...lang,
    hours: randomBetween(10, 100),
    percentage: randomBetween(5, 30)
  }));
};

// Generate fake project data
const generateProjectData = () => {
  const projects = [
    'DevGate',
    'Personal Portfolio',
    'E-commerce App',
    'Weather App',
    'Blog Platform',
    'Task Manager'
  ];
  
  return projects.map(project => ({
    name: project,
    hours: randomBetween(5, 50),
    percentage: randomBetween(5, 25)
  }));
};

export default {
  // Main function to get user coding data
  getUserCodingData(userId) {
    return new Promise((resolve) => {
      // Simulate API delay
      setTimeout(() => {
        resolve({
          userId,
          weeklyData: generateWeeklyData(),
          languages: generateLanguageData(),
          projects: generateProjectData(),
          totalHours: randomBetween(200, 1000),
          dailyAverage: randomBetween(2, 8)
        });
      }, 800);
    });
  }
};