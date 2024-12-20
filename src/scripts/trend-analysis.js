// Trend Analysis Module
class TrendAnalysis {
    constructor() {
        this.timeRanges = {
            'day': {
                label: 'Daily',
                getInterval: (date) => date.toISOString().split('T')[0]
            },
            'week': {
                label: 'Weekly',
                getInterval: (date) => {
                    const startOfWeek = new Date(date);
                    startOfWeek.setDate(date.getDate() - date.getDay());
                    return startOfWeek.toISOString().split('T')[0];
                }
            },
            'month': {
                label: 'Monthly',
                getInterval: (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
            }
        };
    }

    // Analyze trends in responses
    analyzeTrends(data, timeRange = 'week') {
        const trends = {};
        const range = this.timeRanges[timeRange];

        if (!range) {
            console.error('Invalid time range:', timeRange);
            return null;
        }

        // Group responses by time interval
        Object.entries(data).forEach(([experiment, responses]) => {
            trends[experiment] = this.groupByTimeInterval(responses, range.getInterval);
        });

        return {
            trends,
            insights: this.generateTrendInsights(trends)
        };
    }

    // Group responses by time interval
    groupByTimeInterval(responses, getInterval) {
        const grouped = {};

        Object.entries(responses).forEach(([response, data]) => {
            if (typeof data === 'object' && data.timestamp) {
                const date = new Date(data.timestamp);
                const interval = getInterval(date);

                if (!grouped[interval]) {
                    grouped[interval] = {};
                }
                if (!grouped[interval][response]) {
                    grouped[interval][response] = 0;
                }
                grouped[interval][response]++;
            }
        });

        return this.fillMissingIntervals(grouped);
    }

    // Fill missing intervals with zero values
    fillMissingIntervals(grouped) {
        const intervals = Object.keys(grouped).sort();
        if (intervals.length < 2) return grouped;

        const filled = { ...grouped };
        const responses = new Set();

        // Collect all response types
        Object.values(grouped).forEach(intervalData => {
            Object.keys(intervalData).forEach(response => responses.add(response));
        });

        // Fill missing intervals
        let currentDate = new Date(intervals[0]);
        const endDate = new Date(intervals[intervals.length - 1]);

        while (currentDate <= endDate) {
            const interval = currentDate.toISOString().split('T')[0];
            if (!filled[interval]) {
                filled[interval] = {};
            }

            // Fill missing responses with zero
            responses.forEach(response => {
                if (!filled[interval][response]) {
                    filled[interval][response] = 0;
                }
            });

            currentDate.setDate(currentDate.getDate() + 1);
        }

        return filled;
    }

    // Generate insights from trends
    generateTrendInsights(trends) {
        const insights = [];

        Object.entries(trends).forEach(([experiment, intervalData]) => {
            const experimentInsights = this.analyzeExperimentTrends(experiment, intervalData);
            insights.push(...experimentInsights);
        });

        return insights;
    }

    // Analyze trends for specific experiment
    analyzeExperimentTrends(experiment, intervalData) {
        const insights = [];
        const intervals = Object.keys(intervalData).sort();
        
        if (intervals.length < 2) {
            insights.push({
                experiment,
                type: 'insufficient_data',
                message: 'Not enough data for trend analysis'
            });
            return insights;
        }

        // Analyze response patterns
        const responsePatterns = this.analyzeResponsePatterns(intervalData);
        insights.push(...responsePatterns.map(pattern => ({
            experiment,
            type: 'pattern',
            ...pattern
        })));

        // Analyze growth trends
        const growthTrends = this.analyzeGrowthTrends(intervalData);
        insights.push(...growthTrends.map(trend => ({
            experiment,
            type: 'growth',
            ...trend
        })));

        return insights;
    }

    // Analyze response patterns
    analyzeResponsePatterns(intervalData) {
        const patterns = [];
        const intervals = Object.keys(intervalData).sort();
        const responses = Object.keys(intervalData[intervals[0]]);

        responses.forEach(response => {
            const values = intervals.map(interval => intervalData[interval][response]);
            
            // Check for consistent trends
            const trend = this.detectTrend(values);
            if (trend) {
                patterns.push({
                    response,
                    trend,
                    confidence: this.calculateConfidence(values)
                });
            }

            // Check for significant changes
            const changes = this.detectSignificantChanges(values);
            if (changes.length > 0) {
                patterns.push({
                    response,
                    changes,
                    type: 'changes'
                });
            }
        });

        return patterns;
    }

    // Detect trend in values
    detectTrend(values) {
        if (values.length < 3) return null;

        let increasing = true;
        let decreasing = true;

        for (let i = 1; i < values.length; i++) {
            if (values[i] <= values[i-1]) increasing = false;
            if (values[i] >= values[i-1]) decreasing = false;
        }

        if (increasing) return 'increasing';
        if (decreasing) return 'decreasing';
        return null;
    }

    // Calculate confidence in trend
    calculateConfidence(values) {
        if (values.length < 2) return 0;

        const changes = [];
        for (let i = 1; i < values.length; i++) {
            changes.push(values[i] - values[i-1]);
        }

        const consistentDirection = changes.every(change => change > 0) || 
                                  changes.every(change => change < 0);
        
        if (consistentDirection) {
            const avgChange = Math.abs(changes.reduce((a, b) => a + b) / changes.length);
            return Math.min(avgChange / 5, 1); // Normalize confidence
        }

        return 0;
    }

    // Detect significant changes
    detectSignificantChanges(values) {
        const changes = [];
        const threshold = this.calculateThreshold(values);

        for (let i = 1; i < values.length; i++) {
            const change = values[i] - values[i-1];
            if (Math.abs(change) >= threshold) {
                changes.push({
                    index: i,
                    change,
                    percentage: (change / values[i-1]) * 100
                });
            }
        }

        return changes;
    }

    // Calculate threshold for significant changes
    calculateThreshold(values) {
        const mean = values.reduce((a, b) => a + b) / values.length;
        const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
        return Math.sqrt(variance);
    }

    // Analyze growth trends
    analyzeGrowthTrends(intervalData) {
        const trends = [];
        const intervals = Object.keys(intervalData).sort();
        
        // Calculate total responses per interval
        const totals = intervals.map(interval => 
            Object.values(intervalData[interval]).reduce((a, b) => a + b, 0)
        );

        // Calculate growth rates
        const growthRates = [];
        for (let i = 1; i < totals.length; i++) {
            const rate = ((totals[i] - totals[i-1]) / totals[i-1]) * 100;
            growthRates.push(rate);
        }

        // Analyze growth pattern
        const avgGrowth = growthRates.reduce((a, b) => a + b, 0) / growthRates.length;
        trends.push({
            metric: 'average_growth',
            value: avgGrowth,
            interpretation: this.interpretGrowthRate(avgGrowth)
        });

        return trends;
    }

    // Interpret growth rate
    interpretGrowthRate(rate) {
        if (rate > 20) return 'Rapid growth';
        if (rate > 5) return 'Steady growth';
        if (rate > -5) return 'Stable';
        if (rate > -20) return 'Declining';
        return 'Rapid decline';
    }

    // Create trend visualization
    createTrendVisualization(container, trends, timeRange = 'week') {
        const visualizationSection = document.createElement('section');
        visualizationSection.className = 'trend-visualization';
        visualizationSection.innerHTML = '<h4>Response Trends</h4>';

        // Add time range selector
        const rangeSelector = this.createTimeRangeSelector(timeRange);
        visualizationSection.appendChild(rangeSelector);

        // Create trend charts
        Object.entries(trends).forEach(([experiment, intervalData]) => {
            const chartContainer = this.createTrendChart(experiment, intervalData);
            visualizationSection.appendChild(chartContainer);
        });

        // Add insights section
        const insightsContainer = this.createInsightsSection(trends.insights);
        visualizationSection.appendChild(insightsContainer);

        container.appendChild(visualizationSection);
    }

    // Create time range selector
    createTimeRangeSelector(currentRange) {
        const selector = document.createElement('div');
        selector.className = 'time-range-selector';

        const label = document.createElement('label');
        label.textContent = 'Time Range:';
        label.htmlFor = 'time-range-select';

        const select = document.createElement('select');
        select.id = 'time-range-select';

        Object.entries(this.timeRanges).forEach(([value, config]) => {
            const option = document.createElement('option');
            option.value = value;
            option.textContent = config.label;
            option.selected = value === currentRange;
            select.appendChild(option);
        });

        selector.appendChild(label);
        selector.appendChild(select);
        return selector;
    }

    // Create trend chart
    createTrendChart(experiment, intervalData) {
        const chartContainer = document.createElement('div');
        chartContainer.className = 'trend-chart-container';
        
        const title = document.createElement('h5');
        title.textContent = this.formatExperimentName(experiment);
        chartContainer.appendChild(title);

        const chart = document.createElement('div');
        chart.className = 'trend-chart';
        
        // Create chart content
        const intervals = Object.keys(intervalData).sort();
        const responses = Object.keys(intervalData[intervals[0]]);

        responses.forEach(response => {
            const line = document.createElement('div');
            line.className = `trend-line ${response}`;
            
            const values = intervals.map(interval => intervalData[interval][response]);
            const maxValue = Math.max(...values);
            
            values.forEach((value, index) => {
                const point = document.createElement('div');
                point.className = 'trend-point';
                point.style.left = `${(index / (intervals.length - 1)) * 100}%`;
                point.style.bottom = `${(value / maxValue) * 100}%`;
                point.title = `${response}: ${value} (${intervals[index]})`;
                line.appendChild(point);
            });

            chart.appendChild(line);
        });

        chartContainer.appendChild(chart);
        return chartContainer;
    }

    // Create insights section
    createInsightsSection(insights) {
        const container = document.createElement('div');
        container.className = 'trend-insights';
        
        const title = document.createElement('h5');
        title.textContent = 'Key Insights';
        container.appendChild(title);

        const list = document.createElement('ul');
        insights.forEach(insight => {
            const item = document.createElement('li');
            item.className = `insight-item ${insight.type}`;
            item.textContent = this.formatInsight(insight);
            list.appendChild(item);
        });

        container.appendChild(list);
        return container;
    }

    // Format experiment name
    formatExperimentName(experiment) {
        return experiment
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    // Format insight message
    formatInsight(insight) {
        switch (insight.type) {
            case 'pattern':
                return `${this.formatExperimentName(insight.experiment)}: ${insight.response} shows a ${insight.trend} trend (${Math.round(insight.confidence * 100)}% confidence)`;
            case 'growth':
                return `${this.formatExperimentName(insight.experiment)}: ${insight.interpretation} (${Math.round(insight.value)}% ${insight.value >= 0 ? 'increase' : 'decrease'})`;
            case 'changes':
                return `${this.formatExperimentName(insight.experiment)}: Significant changes detected in ${insight.response} responses`;
            default:
                return insight.message;
        }
    }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TrendAnalysis;
}
