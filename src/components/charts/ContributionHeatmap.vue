<template>
    <div class="contribution-heatmap">
        <div v-if="isLoading" class="loading-container">
            <div class="loading-skeleton"></div>
        </div>
        <div v-else-if="error" class="error-message">
            <i class="fas fa-exclamation-circle"></i>
            <p>{{ error }}</p>
        </div>
        <div v-else>
            <div class="heatmap-header">
                <h4>{{ year }} Contributions</h4>
                <div class="filter-options">
                    <select
                        v-model="selectedPeriod"
                        class="form-select input-dark"
                        @change="handlePeriodChange"
                    >
                        <option value="year">Year</option>
                        <option value="6months">Last 6 Months</option>
                        <option value="3months">Last 3 Months</option>
                        <option value="month">This Month</option>
                    </select>
                </div>
            </div>

            <!-- GitHub-style contribution breakdown -->
            <div class="contribution-summary">
                <div
                    v-for="(count, type) in contributionBreakdown"
                    :key="type"
                    class="contribution-type"
                    v-show="count > 0"
                >
                    <span class="contribution-icon">
                        <i :class="getContributionIcon(type)"></i>
                    </span>
                    <span class="contribution-count">{{ count }}</span>
                    <span class="contribution-label">{{
                        getContributionLabel(type)
                    }}</span>
                </div>
            </div>

            <div class="heatmap-grid">
                <div class="month-labels">
                    <div
                        v-for="month in monthLabels"
                        :key="month"
                        class="month-label"
                    >
                        {{ month }}
                    </div>
                </div>
                <div class="day-labels">
                    <div class="day-label">Mon</div>
                    <div class="day-label">Wed</div>
                    <div class="day-label">Fri</div>
                </div>
                <div class="grid">
                    <div
                        v-for="day in contributionData"
                        :key="day.date"
                        class="cell"
                        :class="getColorClass(day.count)"
                        :title="`${formatDate(day.date)}: ${
                            day.count
                        } contributions`"
                        @mouseover="showTooltip($event, day)"
                        @mouseleave="hideTooltip"
                    ></div>
                </div>
            </div>
            <div class="legend">
                <span class="legend-label">Less</span>
                <div class="legend-cells">
                    <div class="cell level-0"></div>
                    <div class="cell level-1"></div>
                    <div class="cell level-2"></div>
                    <div class="cell level-3"></div>
                    <div class="cell level-4"></div>
                </div>
                <span class="legend-label">More</span>
            </div>

            <!-- Enhanced Tooltip with contribution details -->
            <div v-if="tooltipData" class="tooltip" :style="tooltipStyle">
                <div class="tooltip-date">{{ tooltipData.formattedDate }}</div>
                <div class="tooltip-count">
                    {{ tooltipData.count }} contributions
                </div>
                <div
                    v-if="tooltipData.details && tooltipData.details.length > 0"
                    class="tooltip-details"
                >
                    <div
                        v-for="(detail, idx) in tooltipData.details"
                        :key="idx"
                        class="tooltip-detail-item"
                    >
                        <i
                            :class="getContributionIcon(detail.type)"
                            class="tooltip-icon"
                        ></i>
                        <span>{{ detail.description }}</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import { ref, onMounted, watch } from "vue";
import useContributionAnalytics from "@/composables/analytics/useContributionAnalytics";

export default {
    name: "ContributionHeatmap",
    props: {
        userId: {
            type: String,
            required: true,
        },
    },
    emits: ["contributionsLoaded"],
    setup(props, { emit }) {
        const {
            contributions,
            isLoading,
            error,
            totalContributions,
            contributionBreakdown,
            fetchContributionData,
        } = useContributionAnalytics();

        const selectedPeriod = ref("year");
        const year = ref(new Date().getFullYear());
        const tooltipData = ref(null);
        const tooltipStyle = ref({});

        // Month labels for the heatmap
        const monthLabels = [
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

        // Handle period change
        const handlePeriodChange = () => {
            fetchContributionData(props.userId, selectedPeriod.value);
        };

        // Get the color class based on contribution count (GitHub-style intensity)
        const getColorClass = (count) => {
            if (count === 0) return "level-0";
            if (count < 3) return "level-1";
            if (count < 6) return "level-2";
            if (count < 10) return "level-3";
            return "level-4";
        };

        // Get an icon for each contribution type
        const getContributionIcon = (type) => {
            switch (type) {
                case "commits":
                    return "fas fa-code-commit";
                case "posts":
                    return "fas fa-comment-alt";
                case "projects":
                    return "fas fa-project-diagram";
                case "pullRequests":
                    return "fas fa-code-branch";
                case "issues":
                    return "fas fa-exclamation-circle";
                case "reviews":
                    return "fas fa-code-compare";
                default:
                    return "fas fa-star";
            }
        };

        // Get a friendly label for each contribution type
        const getContributionLabel = (type) => {
            switch (type) {
                case "commits":
                    return "commits";
                case "posts":
                    return "posts";
                case "projects":
                    return "projects";
                case "pullRequests":
                    return "project updates";
                case "issues":
                    return "objectives";
                case "reviews":
                    return "reviews";
                default:
                    return type;
            }
        };

        // Format date for display
        const formatDate = (dateString) => {
            const date = new Date(dateString);
            return date.toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
            });
        };

        // Tooltip functions
        const showTooltip = (event, day) => {
            tooltipData.value = {
                count: day.count,
                formattedDate: formatDate(day.date),
                details: day.details,
            };

            // Position tooltip near cursor
            const rect = event.target.getBoundingClientRect();
            const scrollTop =
                window.scrollY || document.documentElement.scrollTop;

            tooltipStyle.value = {
                display: "block",
                top: `${rect.top + scrollTop - 60}px`,
                left: `${rect.left + rect.width / 2 - 100}px`,
            };
        };

        const hideTooltip = () => {
            tooltipData.value = null;
        };

        // Watch for userId changes and reload data
        watch(
            () => props.userId,
            () => {
                fetchContributionData(props.userId, selectedPeriod.value);
            }
        );

        // Emit the total contributions count up to the parent
        watch(isLoading, (newIsLoading) => {
            // When loading is complete, emit the current state
            if (!newIsLoading) {
                emit("contributionsLoaded", {
                    count: totalContributions.value,
                    loading: false,
                    breakdown: contributionBreakdown.value,
                });
            } else {
                // While loading, also emit loading state
                emit("contributionsLoaded", {
                    count: 0,
                    loading: true,
                    breakdown: {},
                });
            }
        });

        onMounted(() => {
            fetchContributionData(props.userId, selectedPeriod.value);
        });

        return {
            contributionData: contributions,
            contributionBreakdown,
            isLoading,
            error,
            selectedPeriod,
            year,
            monthLabels,
            tooltipData,
            tooltipStyle,
            handlePeriodChange,
            getColorClass,
            getContributionIcon,
            getContributionLabel,
            formatDate,
            showTooltip,
            hideTooltip,
        };
    },
};
</script>

<style scoped>
.contribution-heatmap {
    position: relative;
    background-color: var(--github-sidebar-bg, #161b22);
    border-radius: 6px;
    padding: 16px;
    margin-bottom: 16px;
}

.heatmap-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
}

.heatmap-header h4 {
    margin: 0;
    color: var(--github-text, #c9d1d9);
    font-size: 16px;
    font-weight: 600;
}

/* Contribution Summary */
.contribution-summary {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    margin-bottom: 16px;
    padding: 12px;
    background-color: var(--github-card-bg, #21262d);
    border-radius: 6px;
    border: 1px solid var(--github-border, #30363d);
}

.contribution-type {
    display: flex;
    align-items: center;
    gap: 6px;
}

.contribution-icon {
    color: #58a6ff;
    font-size: 14px;
    width: 18px;
    text-align: center;
}

.contribution-count {
    font-weight: 600;
    color: var(--github-text, #c9d1d9);
}

.contribution-label {
    color: var(--github-secondary-text, #8b949e);
    font-size: 13px;
}

.heatmap-grid {
    position: relative;
    margin-bottom: 8px;
}

.month-labels {
    display: grid;
    grid-template-columns: repeat(12, 1fr);
    margin-bottom: 8px;
    padding-left: 30px;
}

.month-label {
    font-size: 12px;
    color: var(--github-secondary-text, #8b949e);
    text-align: center;
}

.day-labels {
    position: absolute;
    left: 0;
    top: 24px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    height: calc(100% - 24px);
}

.day-label {
    font-size: 12px;
    color: var(--github-secondary-text, #8b949e);
}

.grid {
    display: grid;
    grid-template-columns: repeat(52, 1fr);
    grid-template-rows: repeat(7, 1fr);
    gap: 3px;
    padding-left: 30px;
}

.cell {
    width: 10px;
    height: 10px;
    border-radius: 2px;
    background-color: var(--github-card-bg, #21262d);
    cursor: pointer;
    transition: transform 0.1s ease;
}

.cell:hover {
    transform: scale(1.3);
}

/* GitHub-style contribution intensity levels */
.level-0 {
    background-color: var(--github-card-bg, #21262d);
}
.level-1 {
    background-color: #0e4429;
}
.level-2 {
    background-color: #006d32;
}
.level-3 {
    background-color: #26a641;
}
.level-4 {
    background-color: #39d353;
}

.legend {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    margin-top: 8px;
    font-size: 12px;
    color: var(--github-secondary-text, #8b949e);
}

.legend-cells {
    display: flex;
    gap: 3px;
    margin: 0 8px;
}

.legend .cell {
    width: 10px;
    height: 10px;
    cursor: default;
}

.legend .cell:hover {
    transform: none;
}

.loading-container {
    height: 120px;
    display: flex;
    justify-content: center;
    align-items: center;
}

.loading-skeleton {
    width: 100%;
    height: 84px;
    background: linear-gradient(
        90deg,
        var(--github-card-bg, #21262d) 25%,
        #30363d 50%,
        var(--github-card-bg, #21262d) 75%
    );
    background-size: 200% 100%;
    animation: loading 1.5s infinite;
    border-radius: 6px;
}

.error-message {
    text-align: center;
    color: #f85149;
    padding: 24px;
}

.error-message i {
    font-size: 24px;
    margin-bottom: 8px;
}

/* Enhanced tooltip with contribution details */
.tooltip {
    position: fixed;
    background-color: #161b22;
    border: 1px solid #30363d;
    border-radius: 6px;
    padding: 8px 12px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
    z-index: 100;
    pointer-events: none;
    display: none;
    min-width: 200px;
    max-width: 300px;
    font-size: 12px;
}

.tooltip-date {
    font-weight: 600;
    margin-bottom: 4px;
    color: #e6edf3;
}

.tooltip-count {
    color: #8b949e;
    padding-bottom: 8px;
    border-bottom: 1px solid #30363d;
    margin-bottom: 8px;
}

.tooltip-details {
    max-height: 150px;
    overflow-y: auto;
}

.tooltip-detail-item {
    display: flex;
    align-items: flex-start;
    margin-bottom: 6px;
    color: #8b949e;
}

.tooltip-icon {
    margin-right: 8px;
    color: #58a6ff;
    min-width: 14px;
}

.filter-options {
    width: 140px;
}

@keyframes loading {
    0% {
        background-position: 200% 0;
    }
    100% {
        background-position: -200% 0;
    }
}

@media (max-width: 768px) {
    .grid {
        grid-template-columns: repeat(26, 1fr);
        grid-auto-flow: row;
    }

    .month-labels {
        grid-template-columns: repeat(6, 1fr);
    }

    .contribution-summary {
        flex-direction: column;
        gap: 8px;
    }
}
</style>
