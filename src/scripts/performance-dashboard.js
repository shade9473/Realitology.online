// Performance Dashboard Module
class PerformanceDashboard {
    constructor() {
        this.charts = {};
        this.metrics = {};
        this.updateInterval = 5000;
        this.historyLength = 100;

        // Create dashboard container
        this.createDashboard();
        
        // Initialize charts
        this.initializeCharts();
        
        // Start updating
        this.startUpdating();
    }

    // Create dashboard container
    createDashboard() {
        this.container = document.createElement('div');
        this.container.id = 'performance-dashboard';
        this.container.className = 'performance-dashboard hidden';
        
        this.container.innerHTML = `
            <div class="dashboard-header">
                <h2>Performance Dashboard</h2>
                <div class="dashboard-controls">
                    <button class="refresh-btn" title="Refresh">
                        <svg viewBox="0 0 24 24">
                            <path d="M17.65 6.35A7.958 7.958 0 0012 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0112 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
                        </svg>
                    </button>
                    <button class="close-btn" title="Close">
                        <svg viewBox="0 0 24 24">
                            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                        </svg>
                    </button>
                </div>
            </div>
            <div class="dashboard-content">
                <div class="metrics-grid">
                    <div class="metric-card" data-metric="web-vitals">
                        <h3>Web Vitals</h3>
                        <canvas id="web-vitals-chart"></canvas>
                    </div>
                    <div class="metric-card" data-metric="resources">
                        <h3>Resource Usage</h3>
                        <canvas id="resources-chart"></canvas>
                    </div>
                    <div class="metric-card" data-metric="memory">
                        <h3>Memory Usage</h3>
                        <canvas id="memory-chart"></canvas>
                    </div>
                    <div class="metric-card" data-metric="network">
                        <h3>Network Status</h3>
                        <canvas id="network-chart"></canvas>
                    </div>
                </div>
                <div class="insights-panel">
                    <h3>Performance Insights</h3>
                    <div class="insights-content"></div>
                </div>
            </div>
        `;

        document.body.appendChild(this.container);
        this.addEventListeners();
    }

    // Initialize charts
    initializeCharts() {
        // Web Vitals Chart
        this.charts.webVitals = new Chart(
            document.getElementById('web-vitals-chart').getContext('2d'),
            {
                type: 'line',
                data: {
                    labels: [],
                    datasets: [
                        {
                            label: 'FCP',
                            data: [],
                            borderColor: '#4CAF50'
                        },
                        {
                            label: 'LCP',
                            data: [],
                            borderColor: '#2196F3'
                        },
                        {
                            label: 'FID',
                            data: [],
                            borderColor: '#FF9800'
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            }
        );

        // Resources Chart
        this.charts.resources = new Chart(
            document.getElementById('resources-chart').getContext('2d'),
            {
                type: 'bar',
                data: {
                    labels: [],
                    datasets: [
                        {
                            label: 'Transfer Size (KB)',
                            data: [],
                            backgroundColor: '#2196F3'
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false
                }
            }
        );

        // Memory Chart
        this.charts.memory = new Chart(
            document.getElementById('memory-chart').getContext('2d'),
            {
                type: 'line',
                data: {
                    labels: [],
                    datasets: [
                        {
                            label: 'Used Heap (MB)',
                            data: [],
                            borderColor: '#4CAF50'
                        },
                        {
                            label: 'Total Heap (MB)',
                            data: [],
                            borderColor: '#FF9800'
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false
                }
            }
        );

        // Network Chart
        this.charts.network = new Chart(
            document.getElementById('network-chart').getContext('2d'),
            {
                type: 'line',
                data: {
                    labels: [],
                    datasets: [
                        {
                            label: 'Downlink (Mbps)',
                            data: [],
                            borderColor: '#2196F3'
                        },
                        {
                            label: 'RTT (ms)',
                            data: [],
                            borderColor: '#FF9800'
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false
                }
            }
        );
    }

    // Add event listeners
    addEventListeners() {
        // Refresh button
        this.container.querySelector('.refresh-btn').addEventListener('click', () => {
            this.updateCharts();
        });

        // Close button
        this.container.querySelector('.close-btn').addEventListener('click', () => {
            this.hide();
        });

        // Toggle shortcut
        document.addEventListener('keydown', event => {
            if (event.ctrlKey && event.shiftKey && event.key === 'P') {
                this.toggle();
            }
        });
    }

    // Start updating charts
    startUpdating() {
        this.updateCharts();
        setInterval(() => this.updateCharts(), this.updateInterval);
    }

    // Update charts with latest metrics
    updateCharts() {
        if (!window.performanceMonitor) return;

        const metrics = window.performanceMonitor.getMetrics();
        const timestamp = new Date().toLocaleTimeString();

        // Update Web Vitals
        this.updateWebVitalsChart(metrics, timestamp);

        // Update Resources
        this.updateResourcesChart(metrics);

        // Update Memory
        this.updateMemoryChart(metrics, timestamp);

        // Update Network
        this.updateNetworkChart(metrics, timestamp);

        // Update insights
        this.updateInsights(metrics);
    }

    // Update Web Vitals chart
    updateWebVitalsChart(metrics, timestamp) {
        const chart = this.charts.webVitals;
        
        // Add new data
        chart.data.labels.push(timestamp);
        chart.data.datasets[0].data.push(metrics.navigation.fcp);
        chart.data.datasets[1].data.push(metrics.navigation.lcp);
        chart.data.datasets[2].data.push(metrics.interactions.fid);

        // Remove old data
        if (chart.data.labels.length > this.historyLength) {
            chart.data.labels.shift();
            chart.data.datasets.forEach(dataset => dataset.data.shift());
        }

        chart.update();
    }

    // Update Resources chart
    updateResourcesChart(metrics) {
        const chart = this.charts.resources;
        const resources = metrics.resources;

        // Process resource data
        const resourceData = Object.entries(resources)
            .map(([name, data]) => ({
                name: this.getResourceName(name),
                size: data.transferSize / 1024 // Convert to KB
            }))
            .sort((a, b) => b.size - a.size)
            .slice(0, 10);

        // Update chart
        chart.data.labels = resourceData.map(r => r.name);
        chart.data.datasets[0].data = resourceData.map(r => r.size);

        chart.update();
    }

    // Update Memory chart
    updateMemoryChart(metrics, timestamp) {
        const chart = this.charts.memory;
        const memory = metrics.memory;

        // Add new data
        chart.data.labels.push(timestamp);
        chart.data.datasets[0].data.push(memory.usedJSHeapSize / (1024 * 1024));
        chart.data.datasets[1].data.push(memory.totalJSHeapSize / (1024 * 1024));

        // Remove old data
        if (chart.data.labels.length > this.historyLength) {
            chart.data.labels.shift();
            chart.data.datasets.forEach(dataset => dataset.data.shift());
        }

        chart.update();
    }

    // Update Network chart
    updateNetworkChart(metrics, timestamp) {
        const chart = this.charts.network;
        const network = metrics.network;

        if (network) {
            // Add new data
            chart.data.labels.push(timestamp);
            chart.data.datasets[0].data.push(network.downlink);
            chart.data.datasets[1].data.push(network.rtt);

            // Remove old data
            if (chart.data.labels.length > this.historyLength) {
                chart.data.labels.shift();
                chart.data.datasets.forEach(dataset => dataset.data.shift());
            }

            chart.update();
        }
    }

    // Update insights panel
    updateInsights(metrics) {
        const insights = window.performanceMonitor.getOptimizationSuggestions();
        const insightsContent = this.container.querySelector('.insights-content');

        insightsContent.innerHTML = insights.length > 0
            ? `<ul>${insights.map(insight => `<li>${insight}</li>`).join('')}</ul>`
            : '<p>All performance metrics are within acceptable ranges.</p>';
    }

    // Get readable resource name
    getResourceName(url) {
        try {
            const urlObj = new URL(url);
            const path = urlObj.pathname;
            return path.split('/').pop() || urlObj.hostname;
        } catch (error) {
            return url;
        }
    }

    // Show dashboard
    show() {
        this.container.classList.remove('hidden');
        this.updateCharts();
    }

    // Hide dashboard
    hide() {
        this.container.classList.add('hidden');
    }

    // Toggle dashboard
    toggle() {
        this.container.classList.contains('hidden') ? this.show() : this.hide();
    }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PerformanceDashboard;
}
