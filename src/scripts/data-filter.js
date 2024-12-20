// Data Filter Module
class DataFilter {
    constructor() {
        this.filters = {
            date: {
                type: 'range',
                label: 'Date Range',
                apply: this.filterByDate.bind(this)
            },
            experiment: {
                type: 'select',
                label: 'Experiment',
                apply: this.filterByExperiment.bind(this)
            },
            response: {
                type: 'multiselect',
                label: 'Response Type',
                apply: this.filterByResponse.bind(this)
            },
            threshold: {
                type: 'number',
                label: 'Response Threshold',
                apply: this.filterByThreshold.bind(this)
            }
        };

        // Initialize filter presets
        this.filterPresets = new FilterPresets();
    }

    // Apply filters to data
    applyFilters(data, activeFilters) {
        let filteredData = { ...data };

        Object.entries(activeFilters).forEach(([filterName, filterValue]) => {
            if (this.filters[filterName] && filterValue !== null) {
                filteredData = this.filters[filterName].apply(filteredData, filterValue);
            }
        });

        return filteredData;
    }

    // Filter by date range
    filterByDate(data, { start, end }) {
        const startDate = new Date(start);
        const endDate = new Date(end);
        const filtered = {};

        Object.entries(data).forEach(([experiment, responses]) => {
            const filteredResponses = {};
            Object.entries(responses).forEach(([response, value]) => {
                if (typeof value === 'object' && value.timestamp) {
                    const responseDate = new Date(value.timestamp);
                    if (responseDate >= startDate && responseDate <= endDate) {
                        filteredResponses[response] = value;
                    }
                } else {
                    filteredResponses[response] = value;
                }
            });
            filtered[experiment] = filteredResponses;
        });

        return filtered;
    }

    // Filter by experiment
    filterByExperiment(data, experiments) {
        const filtered = {};
        experiments.forEach(experiment => {
            if (data[experiment]) {
                filtered[experiment] = data[experiment];
            }
        });
        return filtered;
    }

    // Filter by response type
    filterByResponse(data, responses) {
        const filtered = {};
        Object.entries(data).forEach(([experiment, experimentData]) => {
            const filteredResponses = {};
            responses.forEach(response => {
                if (experimentData[response] !== undefined) {
                    filteredResponses[response] = experimentData[response];
                }
            });
            if (Object.keys(filteredResponses).length > 0) {
                filtered[experiment] = filteredResponses;
            }
        });
        return filtered;
    }

    // Filter by response threshold
    filterByThreshold(data, threshold) {
        const filtered = {};
        Object.entries(data).forEach(([experiment, responses]) => {
            const filteredResponses = {};
            Object.entries(responses).forEach(([response, count]) => {
                if (count >= threshold) {
                    filteredResponses[response] = count;
                }
            });
            if (Object.keys(filteredResponses).length > 0) {
                filtered[experiment] = filteredResponses;
            }
        });
        return filtered;
    }

    // Create filter UI
    createFilterUI(container, initialFilters = {}) {
        const filterContainer = document.createElement('div');
        filterContainer.className = 'data-filters';

        // Add filter presets
        this.filterPresets.createPresetUI(filterContainer, (filters) => {
            this.applyPreset(filterContainer, filters);
        });
        
        Object.entries(this.filters).forEach(([filterName, filterConfig]) => {
            const filterElement = this.createFilterElement(
                filterName,
                filterConfig,
                initialFilters[filterName]
            );
            filterContainer.appendChild(filterElement);
        });

        const applyButton = document.createElement('button');
        applyButton.className = 'apply-filters-button';
        applyButton.textContent = 'Apply Filters';
        filterContainer.appendChild(applyButton);

        const resetButton = document.createElement('button');
        resetButton.className = 'reset-filters-button';
        resetButton.textContent = 'Reset Filters';
        filterContainer.appendChild(resetButton);

        container.appendChild(filterContainer);
        return {
            applyButton,
            resetButton,
            container: filterContainer
        };
    }

    // Apply preset filters
    applyPreset(filterContainer, filters) {
        Object.entries(filters).forEach(([filterName, value]) => {
            const filter = this.filters[filterName];
            if (filter) {
                switch (filter.type) {
                    case 'range':
                        if (value.start) {
                            filterContainer.querySelector(`#filter-${filterName}-start`).value = value.start;
                        }
                        if (value.end) {
                            filterContainer.querySelector(`#filter-${filterName}-end`).value = value.end;
                        }
                        break;
                    case 'select':
                        const select = filterContainer.querySelector(`#filter-${filterName}`);
                        if (select) {
                            value.forEach(val => {
                                const option = select.querySelector(`option[value="${val}"]`);
                                if (option) {
                                    option.selected = true;
                                }
                            });
                        }
                        break;
                    case 'multiselect':
                        const multiSelect = filterContainer.querySelector(`#filter-${filterName}`);
                        if (multiSelect) {
                            Array.from(multiSelect.options).forEach(option => {
                                option.selected = value.includes(option.value);
                            });
                        }
                        break;
                    case 'number':
                        const input = filterContainer.querySelector(`#filter-${filterName}`);
                        if (input) {
                            input.value = value;
                        }
                        break;
                }
            }
        });

        // Track preset application
        window.plausible?.('Preset Applied', {
            props: {
                filterCount: Object.keys(filters).length
            }
        });
    }

    // Create filter element based on type
    createFilterElement(name, config, initialValue) {
        const wrapper = document.createElement('div');
        wrapper.className = 'filter-item';

        const label = document.createElement('label');
        label.textContent = config.label;
        label.htmlFor = `filter-${name}`;
        wrapper.appendChild(label);

        let input;
        switch (config.type) {
            case 'range':
                input = this.createDateRangeFilter(name, initialValue);
                break;
            case 'select':
                input = this.createSelectFilter(name, initialValue);
                break;
            case 'multiselect':
                input = this.createMultiSelectFilter(name, initialValue);
                break;
            case 'number':
                input = this.createNumberFilter(name, initialValue);
                break;
        }

        wrapper.appendChild(input);
        return wrapper;
    }

    // Create date range filter
    createDateRangeFilter(name, initialValue = {}) {
        const container = document.createElement('div');
        container.className = 'date-range-filter';

        const startDate = document.createElement('input');
        startDate.type = 'date';
        startDate.id = `filter-${name}-start`;
        startDate.value = initialValue.start || '';

        const endDate = document.createElement('input');
        endDate.type = 'date';
        endDate.id = `filter-${name}-end`;
        endDate.value = initialValue.end || '';

        container.appendChild(startDate);
        container.appendChild(endDate);

        return container;
    }

    // Create select filter
    createSelectFilter(name, initialValue = '') {
        const select = document.createElement('select');
        select.id = `filter-${name}`;
        select.multiple = false;
        select.value = initialValue;

        // Add options based on available experiments
        const experiments = ['chinese-room', 'philosophical-zombie', 'experience-machine'];
        experiments.forEach(experiment => {
            const option = document.createElement('option');
            option.value = experiment;
            option.textContent = this.formatExperimentName(experiment);
            select.appendChild(option);
        });

        return select;
    }

    // Create multi-select filter
    createMultiSelectFilter(name, initialValue = []) {
        const select = document.createElement('select');
        select.id = `filter-${name}`;
        select.multiple = true;
        
        // Add options based on response types
        const responses = ['yes', 'no', 'maybe', 'observable', 'impossible', 'different', 'reality', 'simulation', 'hybrid'];
        responses.forEach(response => {
            const option = document.createElement('option');
            option.value = response;
            option.textContent = this.formatResponseName(response);
            option.selected = initialValue.includes(response);
            select.appendChild(option);
        });

        return select;
    }

    // Create number filter
    createNumberFilter(name, initialValue = 0) {
        const input = document.createElement('input');
        input.type = 'number';
        input.id = `filter-${name}`;
        input.min = '0';
        input.value = initialValue;
        return input;
    }

    // Format experiment name for display
    formatExperimentName(experiment) {
        return experiment
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    // Format response name for display
    formatResponseName(response) {
        return response.charAt(0).toUpperCase() + response.slice(1);
    }

    // Get current filter values
    getFilterValues(filterContainer) {
        const values = {};
        
        Object.keys(this.filters).forEach(filterName => {
            const filter = this.filters[filterName];
            switch (filter.type) {
                case 'range':
                    values[filterName] = {
                        start: filterContainer.querySelector(`#filter-${filterName}-start`).value,
                        end: filterContainer.querySelector(`#filter-${filterName}-end`).value
                    };
                    break;
                case 'select':
                    values[filterName] = [filterContainer.querySelector(`#filter-${filterName}`).value];
                    break;
                case 'multiselect':
                    values[filterName] = Array.from(
                        filterContainer.querySelector(`#filter-${filterName}`).selectedOptions,
                        option => option.value
                    );
                    break;
                case 'number':
                    values[filterName] = parseInt(filterContainer.querySelector(`#filter-${filterName}`).value, 10);
                    break;
            }
        });

        return values;
    }

    // Reset filters to default values
    resetFilters(filterContainer) {
        Object.keys(this.filters).forEach(filterName => {
            const filter = this.filters[filterName];
            switch (filter.type) {
                case 'range':
                    filterContainer.querySelector(`#filter-${filterName}-start`).value = '';
                    filterContainer.querySelector(`#filter-${filterName}-end`).value = '';
                    break;
                case 'select':
                case 'multiselect':
                    const select = filterContainer.querySelector(`#filter-${filterName}`);
                    Array.from(select.options).forEach(option => {
                        option.selected = false;
                    });
                    break;
                case 'number':
                    filterContainer.querySelector(`#filter-${filterName}`).value = '0';
                    break;
            }
        });
    }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DataFilter;
}
