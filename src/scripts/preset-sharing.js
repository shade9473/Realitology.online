// Preset Sharing Module
class PresetSharing {
    constructor() {
        this.shareBaseUrl = window.location.origin + window.location.pathname;
    }

    // Generate shareable URL
    generateShareUrl(preset) {
        const shareData = {
            name: preset.name,
            description: preset.description,
            filters: preset.filters
        };

        const encodedData = btoa(JSON.stringify(shareData));
        return `${this.shareBaseUrl}?preset=${encodedData}`;
    }

    // Generate shareable code
    generateShareCode(preset) {
        const shareData = {
            name: preset.name,
            description: preset.description,
            filters: preset.filters,
            timestamp: Date.now()
        };

        return btoa(JSON.stringify(shareData))
            .replace(/[^a-zA-Z0-9]/g, '')
            .substring(0, 8)
            .toUpperCase();
    }

    // Import preset from URL
    importFromUrl(url) {
        try {
            const params = new URLSearchParams(new URL(url).search);
            const presetData = params.get('preset');
            
            if (!presetData) return null;

            const decoded = JSON.parse(atob(presetData));
            return this.validatePreset(decoded);
        } catch (error) {
            console.error('Error importing preset from URL:', error);
            return null;
        }
    }

    // Import preset from code
    importFromCode(code) {
        try {
            const decoded = JSON.parse(atob(code));
            return this.validatePreset(decoded);
        } catch (error) {
            console.error('Error importing preset from code:', error);
            return null;
        }
    }

    // Validate imported preset
    validatePreset(preset) {
        const requiredFields = ['name', 'description', 'filters'];
        const isValid = requiredFields.every(field => preset.hasOwnProperty(field));

        if (!isValid) {
            console.error('Invalid preset format');
            return null;
        }

        // Validate filters
        const validFilters = ['date', 'experiment', 'response', 'threshold'];
        const hasValidFilters = Object.keys(preset.filters).every(filter => 
            validFilters.includes(filter)
        );

        if (!hasValidFilters) {
            console.error('Invalid filter types in preset');
            return null;
        }

        return preset;
    }

    // Create sharing UI
    createSharingUI(container, preset, onImport) {
        const sharingSection = document.createElement('div');
        sharingSection.className = 'sharing-section';

        // Share options
        const shareOptions = document.createElement('div');
        shareOptions.className = 'share-options';
        shareOptions.innerHTML = `
            <h5>Share Preset</h5>
            <div class="share-url-group">
                <input type="text" class="share-url" value="${this.generateShareUrl(preset)}" readonly>
                <button class="copy-url-button">Copy URL</button>
            </div>
            <div class="share-code-group">
                <span class="share-code">${this.generateShareCode(preset)}</span>
                <button class="copy-code-button">Copy Code</button>
            </div>
        `;

        // Import form
        const importForm = document.createElement('form');
        importForm.className = 'import-form';
        importForm.innerHTML = `
            <h5>Import Preset</h5>
            <div class="import-code-group">
                <input type="text" class="import-code" placeholder="Enter preset code">
                <button type="submit" class="import-button">Import</button>
            </div>
        `;

        // Add event listeners
        this.addSharingEventListeners(shareOptions, importForm, onImport);

        sharingSection.appendChild(shareOptions);
        sharingSection.appendChild(importForm);
        container.appendChild(sharingSection);
    }

    // Add event listeners for sharing UI
    addSharingEventListeners(shareOptions, importForm, onImport) {
        // Copy URL button
        const copyUrlButton = shareOptions.querySelector('.copy-url-button');
        const shareUrl = shareOptions.querySelector('.share-url');
        copyUrlButton.addEventListener('click', () => {
            shareUrl.select();
            document.execCommand('copy');

            // Visual feedback
            copyUrlButton.textContent = 'Copied!';
            setTimeout(() => {
                copyUrlButton.textContent = 'Copy URL';
            }, 2000);

            // Track URL copy
            window.plausible?.('Preset URL Copied');
        });

        // Copy code button
        const copyCodeButton = shareOptions.querySelector('.copy-code-button');
        const shareCode = shareOptions.querySelector('.share-code');
        copyCodeButton.addEventListener('click', () => {
            const range = document.createRange();
            range.selectNode(shareCode);
            window.getSelection().removeAllRanges();
            window.getSelection().addRange(range);
            document.execCommand('copy');
            window.getSelection().removeAllRanges();

            // Visual feedback
            copyCodeButton.textContent = 'Copied!';
            setTimeout(() => {
                copyCodeButton.textContent = 'Copy Code';
            }, 2000);

            // Track code copy
            window.plausible?.('Preset Code Copied');
        });

        // Import form
        importForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const importCode = importForm.querySelector('.import-code').value;
            const importedPreset = this.importFromCode(importCode);

            if (importedPreset) {
                onImport(importedPreset);
                importForm.reset();

                // Show success message
                const successMessage = document.createElement('div');
                successMessage.className = 'import-success';
                successMessage.textContent = 'Preset imported successfully!';
                importForm.appendChild(successMessage);
                setTimeout(() => {
                    successMessage.remove();
                }, 3000);

                // Track successful import
                window.plausible?.('Preset Imported', {
                    props: {
                        presetName: importedPreset.name
                    }
                });
            } else {
                // Show error message
                const errorMessage = document.createElement('div');
                errorMessage.className = 'import-error';
                errorMessage.textContent = 'Invalid preset code. Please try again.';
                importForm.appendChild(errorMessage);
                setTimeout(() => {
                    errorMessage.remove();
                }, 3000);

                // Track failed import
                window.plausible?.('Preset Import Failed');
            }
        });
    }

    // Check URL for shared preset
    checkUrlForSharedPreset() {
        if (window.location.search) {
            const importedPreset = this.importFromUrl(window.location.href);
            if (importedPreset) {
                return importedPreset;
            }
        }
        return null;
    }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PresetSharing;
}
