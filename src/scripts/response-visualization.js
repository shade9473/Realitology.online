// Response Visualization Component
class ResponseVisualization {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.data = {
            'chinese-room': {
                'yes': 0,
                'no': 0,
                'maybe': 0
            },
            'philosophical-zombie': {
                'observable': 0,
                'impossible': 0,
                'different': 0
            },
            'experience-machine': {
                'reality': 0,
                'simulation': 0,
                'hybrid': 0
            }
        };
        this.colors = {
            'yes': '#4CAF50',
            'no': '#F44336',
            'maybe': '#2196F3',
            'observable': '#4CAF50',
            'impossible': '#F44336',
            'different': '#2196F3',
            'reality': '#4CAF50',
            'simulation': '#F44336',
            'hybrid': '#2196F3'
        };

        // Initialize data filter
        this.dataFilter = new DataFilter();
        this.activeFilters = {};
    }

    // Initialize visualizations
    initialize() {
        this.createFilterUI();
        this.createVisualizationContainers();
        this.loadStoredResponses();
        this.setupEventListeners();
    }

    // Create filter UI
    createFilterUI() {
        const filterSection = document.createElement('section');
        filterSection.className = 'filter-section';
        filterSection.innerHTML = '<h4>Filter Responses</h4>';

        const { applyButton, resetButton, container } = this.dataFilter.createFilterUI(
            filterSection,
            this.activeFilters
        );

        applyButton.addEventListener('click', () => {
            this.activeFilters = this.dataFilter.getFilterValues(container);
            this.updateAllVisualizations();

            // Track filter usage
            window.plausible?.('Filter Applied', {
                props: {
                    filters: Object.keys(this.activeFilters).join(',')
                }
            });
        });

        resetButton.addEventListener('click', () => {
            this.dataFilter.resetFilters(container);
            this.activeFilters = {};
            this.updateAllVisualizations();

            // Track filter reset
            window.plausible?.('Filters Reset');
        });

        this.container.insertBefore(filterSection, this.container.firstChild);
    }

    // Create container structure
    createVisualizationContainers() {
        const exportControls = document.createElement('div');
        exportControls.className = 'export-controls';
        exportControls.innerHTML = `
            <h4>Export Data</h4>
            <div class="export-buttons">
                <button class="export-button" data-format="json">Export as JSON</button>
                <button class="export-button" data-format="csv">Export as CSV</button>
                <button class="export-button" data-format="report">Generate Report</button>
            </div>
        `;
        this.container.appendChild(exportControls);

        // Add export event listeners
        const dataExport = new DataExport();
        exportControls.querySelectorAll('.export-button').forEach(button => {
            button.addEventListener('click', () => {
                const format = button.getAttribute('data-format');
                if (format === 'report') {
                    const report = dataExport.generateSummaryReport(this.data);
                    dataExport.export({ report }, 'json', 'experiment-report');
                } else {
                    dataExport.export(this.data, format);
                }
            });
        });

        Object.keys(this.data).forEach(experiment => {
            const section = document.createElement('div');
            section.className = 'response-visualization';
            section.innerHTML = `
                <h4>${this.formatExperimentTitle(experiment)}</h4>
                <div class="visualization-chart" id="${experiment}-chart"></div>
                <div class="visualization-stats" id="${experiment}-stats"></div>
                <div class="visualization-insights" id="${experiment}-insights"></div>
            `;
            this.container.appendChild(section);
        });
    }

    // Format experiment titles
    formatExperimentTitle(experiment) {
        return experiment.split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ') + ' Responses';
    }

    // Load stored responses
    loadStoredResponses() {
        const storedData = localStorage.getItem('experimentResponses');
        if (storedData) {
            this.data = JSON.parse(storedData);
        }
        this.updateAllVisualizations();
    }

    // Setup event listeners
    setupEventListeners() {
        document.addEventListener('experimentResponse', (e) => {
            const { experiment, response } = e.detail;
            this.addResponse(experiment, response);
        });
    }

    // Add new response
    addResponse(experiment, response) {
        if (this.data[experiment] && this.data[experiment][response] !== undefined) {
            this.data[experiment][response]++;
            localStorage.setItem('experimentResponses', JSON.stringify(this.data));
            this.updateVisualization(experiment);
        }
    }

    // Update visualization for specific experiment
    updateVisualization(experiment) {
        const filteredData = this.dataFilter.applyFilters(
            { [experiment]: this.data[experiment] },
            this.activeFilters
        );

        if (filteredData[experiment]) {
            this.updateChart(experiment, filteredData[experiment]);
            this.updateStats(experiment, filteredData[experiment]);
            this.updateInsights(experiment, filteredData[experiment]);
        } else {
            this.showNoDataMessage(experiment);
        }
    }

    // Update all visualizations
    updateAllVisualizations() {
        Object.keys(this.data).forEach(experiment => {
            this.updateVisualization(experiment);
        });
    }

    // Update chart visualization
    updateChart(experiment, data = this.data[experiment]) {
        const chartContainer = document.getElementById(`${experiment}-chart`);
        const total = Object.values(data).reduce((a, b) => a + b, 0);
        
        if (total === 0) return;

        chartContainer.innerHTML = '';
        const chart = document.createElement('div');
        chart.className = 'response-chart';

        Object.entries(data).forEach(([response, count]) => {
            const percentage = (count / total) * 100;
            const bar = document.createElement('div');
            bar.className = 'chart-bar';
            bar.innerHTML = `
                <div class="bar-fill" style="width: ${percentage}%; background-color: ${this.colors[response]}">
                    <span class="bar-label">${response}: ${Math.round(percentage)}%</span>
                </div>
            `;
            chart.appendChild(bar);
        });

        chartContainer.appendChild(chart);
    }

    // Update statistics
    updateStats(experiment, data = this.data[experiment]) {
        const statsContainer = document.getElementById(`${experiment}-stats`);
        const total = Object.values(data).reduce((a, b) => a + b, 0);
        
        if (total === 0) {
            statsContainer.innerHTML = '<p>No responses yet</p>';
            return;
        }

        const stats = document.createElement('div');
        stats.className = 'response-stats';
        stats.innerHTML = `
            <p>Total Responses: ${total}</p>
            <p>Most Common: ${this.getMostCommonResponse(experiment, data)}</p>
            <p>Response Distribution: ${this.getDistributionSummary(experiment, data)}</p>
        `;

        statsContainer.innerHTML = '';
        statsContainer.appendChild(stats);
    }

    // Get most common response
    getMostCommonResponse(experiment, data = this.data[experiment]) {
        const responses = data;
        return Object.entries(responses)
            .reduce((a, b) => a[1] > b[1] ? a : b)[0];
    }

    // Get distribution summary
    getDistributionSummary(experiment, data = this.data[experiment]) {
        const total = Object.values(data).reduce((a, b) => a + b, 0);
        return Object.entries(data)
            .map(([response, count]) => {
                const percentage = Math.round((count / total) * 100);
                return `${response} (${percentage}%)`;
            })
            .join(', ');
    }

    // Update insights
    updateInsights(experiment, data = this.data[experiment]) {
        const insightsContainer = document.getElementById(`${experiment}-insights`);
        const total = Object.values(data).reduce((a, b) => a + b, 0);
        
        if (total < 5) {
            insightsContainer.innerHTML = '<p>More responses needed for insights</p>';
            return;
        }

        const insights = this.generateInsights(experiment, data);
        insightsContainer.innerHTML = `
            <div class="response-insights">
                <h5>Key Insights:</h5>
                <ul>
                    ${insights.map(insight => `<li>${insight}</li>`).join('')}
                </ul>
            </div>
        `;
    }

    // Generate insights based on responses
    generateInsights(experiment, data = this.data[experiment]) {
        const responses = data;
        const total = Object.values(responses).reduce((a, b) => a + b, 0);
        const insights = [];

        // Calculate percentages
        const percentages = {};
        Object.entries(responses).forEach(([response, count]) => {
            percentages[response] = (count / total) * 100;
        });

        // Generate experiment-specific insights
        switch(experiment) {
            case 'chinese-room':
                if (percentages.maybe > 40) {
                    insights.push('Most participants recognize the complexity of understanding');
                }
                if (percentages.yes > percentages.no) {
                    insights.push('Majority lean towards system comprehension');
                }
                break;

            case 'philosophical-zombie':
                if (percentages.impossible > 40) {
                    insights.push('Strong skepticism about determining consciousness');
                }
                if (percentages.different > 30) {
                    insights.push('Significant support for new approaches to consciousness');
                }
                break;

            case 'experience-machine':
                if (percentages.reality > 50) {
                    insights.push('Strong preference for authentic experiences');
                }
                if (percentages.hybrid > 25) {
                    insights.push('Notable interest in balanced approach');
                }
                break;
        }

        // Add general insights
        const mostCommon = this.getMostCommonResponse(experiment, data);
        insights.push(`Predominant view: ${mostCommon} (${Math.round(percentages[mostCommon])}%)`);

        return insights;
    }

    // Show no data message
    showNoDataMessage(experiment) {
        const chartContainer = document.getElementById(`${experiment}-chart`);
        const statsContainer = document.getElementById(`${experiment}-stats`);
        const insightsContainer = document.getElementById(`${experiment}-insights`);

        const noDataMessage = '<p class="no-data-message">No data matches the current filters</p>';
        
        chartContainer.innerHTML = noDataMessage;
        statsContainer.innerHTML = noDataMessage;
        insightsContainer.innerHTML = '';
    }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ResponseVisualization;
}
