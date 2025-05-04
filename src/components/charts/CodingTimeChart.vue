<template>
  <div class="chart-container" style="position: relative; height: 300px;">
    <Bar :data="props.chartData" :options="props.chartOptions" />
  </div>
</template>

<script setup>
import { Bar } from 'vue-chartjs';
import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale } from 'chart.js';
import { defineProps } from 'vue';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const props = defineProps({
  chartData: {
    type: Object,
    required: true
  },
  chartOptions: {
    type: Object,
    default: () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
        },
        title: {
          display: true,
          text: 'Coding Time Per Week'
        }
      }
    })
  }
});
</script>

<style scoped>
.chart-container {
  margin: 20px 0;
}
</style>
