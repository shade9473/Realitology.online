// Filter Presets Module
class FilterPresets {
    constructor() {
        this.defaultPresets = {
            'recent-responses': {
                name: 'Recent Responses',
                description: 'Responses from the last 7 days',
                filters: {
                    date: {
                        start: this.getDateString(-7),
                        end: this.getDateString(0)
                    }
                }
            },
            'high-engagement': {
                name: 'High Engagement',
                description: 'Experiments with significant response counts',
                filters: {
                    threshold: 10
                }
            },
            'chinese-room-analysis': {
                name: 'Chinese Room Analysis',
                description: 'Focus on Chinese Room experiment responses',
                filters: {
                    experiment: ['chinese-room']
                }
            },
            'consciousness-debate': {
                name: 'Consciousness Debate',
                description: 'Compare responses about consciousness across experiments',
                filters: {
                    experiment: ['philosophical-zombie', 'chinese-room'],
                    response: ['yes', 'observable', 'impossible']
                }
            },
            'reality-perception': {
                name: 'Reality Perception',
                description: 'Analysis of reality vs simulation preferences',
                filters: {
                    experiment: ['experience-machine'],
                    response: ['reality', 'simulation']
                }
            }
        };

        this.customPresets = this.loadCustomPresets();
        
        // Initialize preset sharing
        this.presetSharing = new PresetSharing();
        
        // Check for shared preset in URL
        const sharedPreset = this.presetSharing.checkUrlForSharedPreset();
        if (sharedPreset) {
            this.addCustomPreset(
                sharedPreset.name,
                sharedPreset.description,
                sharedPreset.filters,
                true
            );
        }
    }

    // Get date string for relative days
    getDateString(daysOffset) {
        const date = new Date();
        date.setDate(date.getDate() + daysOffset);
        return date.toISOString().split('T')[0];
    }

    // Load custom presets from storage
    loadCustomPresets() {
        const stored = localStorage.getItem('filterPresets');
        return stored ? JSON.parse(stored) : {};
    }

    // Save custom presets to storage
    saveCustomPresets() {
        localStorage.setItem('filterPresets', JSON.stringify(this.customPresets));
    }

    // Get all presets
    getAllPresets() {
        return {
            ...this.defaultPresets,
            ...this.customPresets
        };
    }

    // Add custom preset
    addCustomPreset(name, description, filters, isShared = false) {
        const id = this.generatePresetId(name);
        this.customPresets[id] = {
            name,
            description,
            filters,
            custom: true,
            shared: isShared
        };
        this.saveCustomPresets();

        // Track preset creation
        window.plausible?.('Preset Created', {
            props: {
                presetName: name,
                filterCount: Object.keys(filters).length,
                isShared
            }
        });

        return id;
    }

    // Remove custom preset
    removeCustomPreset(presetId) {
        if (this.customPresets[presetId]) {
            delete this.customPresets[presetId];
            this.saveCustomPresets();

            // Track preset removal
            window.plausible?.('Preset Removed', {
                props: {
                    presetId
                }
            });

            return true;
        }
        return false;
    }

    // Generate preset ID from name
    generatePresetId(name) {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '') +
            '-' +
            Date.now().toString(36);
    }

    // Create preset UI
    createPresetUI(container, onPresetSelect) {
        const presetSection = document.createElement('div');
        presetSection.className = 'preset-section';

        // Add preset selector
        const presetSelector = this.createPresetSelector(onPresetSelect);
        presetSection.appendChild(presetSelector);

        // Add custom preset form
        const customPresetForm = this.createCustomPresetForm();
        presetSection.appendChild(customPresetForm);

        // Add sharing UI for selected preset
        const selectedPreset = this.getAllPresets()[Object.keys(this.getAllPresets())[0]];
        if (selectedPreset) {
            this.presetSharing.createSharingUI(
                presetSection,
                selectedPreset,
                (importedPreset) => {
                    this.addCustomPreset(
                        importedPreset.name,
                        importedPreset.description,
                        importedPreset.filters,
                        true
                    );
                    onPresetSelect(importedPreset.filters);
                }
            );
        }

        container.appendChild(presetSection);
    }

    // Create preset selector
    createPresetSelector(onPresetSelect) {
        const selector = document.createElement('div');
        selector.className = 'preset-selector';
        
        const label = document.createElement('label');
        label.textContent = 'Filter Presets';
        label.htmlFor = 'preset-select';
        
        const select = document.createElement('select');
        select.id = 'preset-select';
        
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = 'Select a preset...';
        select.appendChild(defaultOption);

        Object.entries(this.getAllPresets()).forEach(([id, preset]) => {
            const option = document.createElement('option');
            option.value = id;
            option.textContent = preset.name;
            select.appendChild(option);
        });

        select.addEventListener('change', () => {
            const presetId = select.value;
            if (presetId) {
                const preset = this.getAllPresets()[presetId];
                if (preset) {
                    onPresetSelect(preset.filters);

                    // Track preset usage
                    window.plausible?.('Preset Used', {
                        props: {
                            presetName: preset.name,
                            presetId
                        }
                    });
                }
            }
        });

        selector.appendChild(label);
        selector.appendChild(select);
        return selector;
    }

    // Create custom preset form
    createCustomPresetForm() {
        const form = document.createElement('form');
        form.className = 'custom-preset-form';
        form.innerHTML = `
            <h5>Create Custom Preset</h5>
            <div class="form-group">
                <label for="preset-name">Preset Name</label>
                <input type="text" id="preset-name" required>
            </div>
            <div class="form-group">
                <label for="preset-description">Description</label>
                <textarea id="preset-description" required></textarea>
            </div>
            <button type="submit" class="save-preset-button">Save Preset</button>
        `;

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = form.querySelector('#preset-name').value;
            const description = form.querySelector('#preset-description').value;

            // Get current filter values
            const filterContainer = document.querySelector('.data-filters');
            const dataFilter = new DataFilter();
            const filters = dataFilter.getFilterValues(filterContainer);

            // Add new preset
            this.addCustomPreset(name, description, filters);

            // Reset form
            form.reset();

            // Refresh preset selector
            const selector = document.querySelector('#preset-select');
            if (selector) {
                const option = document.createElement('option');
                const presetId = this.generatePresetId(name);
                option.value = presetId;
                option.textContent = name;
                selector.appendChild(option);
            }
        });

        return form;
    }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FilterPresets;
}
