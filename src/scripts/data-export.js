// Data Export Module
class DataExport {
    constructor() {
        this.exportFormats = {
            'json': {
                label: 'JSON',
                mimeType: 'application/json',
                extension: '.json',
                transform: this.transformToJSON.bind(this)
            },
            'csv': {
                label: 'CSV',
                mimeType: 'text/csv',
                extension: '.csv',
                transform: this.transformToCSV.bind(this)
            },
            'excel': {
                label: 'Excel',
                mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                extension: '.xlsx',
                transform: this.transformToExcel.bind(this)
            },
            'pdf': {
                label: 'PDF Report',
                mimeType: 'application/pdf',
                extension: '.pdf',
                transform: this.transformToPDF.bind(this)
            }
        };
    }

    // Export data in specified format
    exportData(data, format, options = {}) {
        const exportFormat = this.exportFormats[format];
        if (!exportFormat) {
            console.error('Invalid export format:', format);
            return;
        }

        try {
            const transformedData = exportFormat.transform(data, options);
            this.downloadFile(transformedData, options.filename || 'export', exportFormat);

            // Track export
            window.plausible?.('Data Exported', {
                props: {
                    format,
                    dataSize: JSON.stringify(data).length,
                    options: JSON.stringify(options)
                }
            });
        } catch (error) {
            console.error('Error exporting data:', error);
            throw error;
        }
    }

    // Transform data to JSON
    transformToJSON(data, options = {}) {
        const { pretty = true } = options;
        return pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data);
    }

    // Transform data to CSV
    transformToCSV(data, options = {}) {
        const { delimiter = ',', includeHeaders = true } = options;
        
        // Extract headers from data
        const headers = this.extractHeaders(data);
        
        // Convert data to rows
        const rows = this.flattenData(data, headers);
        
        // Build CSV content
        let csv = '';
        
        if (includeHeaders) {
            csv += headers.join(delimiter) + '\\n';
        }
        
        rows.forEach(row => {
            csv += headers.map(header => {
                const value = row[header];
                return this.formatCSVValue(value, delimiter);
            }).join(delimiter) + '\\n';
        });
        
        return csv;
    }

    // Transform data to Excel
    transformToExcel(data, options = {}) {
        const XLSX = window.XLSX;
        if (!XLSX) {
            throw new Error('XLSX library not loaded');
        }

        const { sheetName = 'Data Export' } = options;
        
        // Convert data to worksheet format
        const headers = this.extractHeaders(data);
        const rows = this.flattenData(data, headers);
        
        // Create workbook and worksheet
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(rows, {
            header: headers
        });
        
        // Add worksheet to workbook
        XLSX.utils.book_append_sheet(wb, ws, sheetName);
        
        // Generate Excel file
        const excelBuffer = XLSX.write(wb, {
            bookType: 'xlsx',
            type: 'array'
        });
        
        return new Uint8Array(excelBuffer);
    }

    // Transform data to PDF report
    transformToPDF(data, options = {}) {
        const { jsPDF } = window.jspdf;
        if (!jsPDF) {
            throw new Error('jsPDF library not loaded');
        }

        const {
            title = 'Data Export Report',
            author = 'Realitology.online',
            orientation = 'portrait'
        } = options;

        // Create PDF document
        const doc = new jsPDF({
            orientation,
            unit: 'mm',
            format: 'a4'
        });

        // Add metadata
        doc.setProperties({
            title,
            author,
            subject: 'Data Export',
            keywords: 'realitology, data export, analysis',
            creator: 'Realitology.online'
        });

        // Add title
        doc.setFontSize(20);
        doc.text(title, 20, 20);

        // Add timestamp
        doc.setFontSize(10);
        doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 30);

        // Add data summary
        doc.setFontSize(12);
        let yPos = 50;

        Object.entries(data).forEach(([experiment, responses]) => {
            // Add experiment header
            doc.setFont(undefined, 'bold');
            doc.text(this.formatExperimentName(experiment), 20, yPos);
            yPos += 10;

            // Add response summary
            doc.setFont(undefined, 'normal');
            const summary = this.generateResponseSummary(responses);
            Object.entries(summary).forEach(([key, value]) => {
                doc.text(`${key}: ${value}`, 30, yPos);
                yPos += 7;
            });

            yPos += 10;
        });

        // Add footer
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(10);
            doc.text(
                `Page ${i} of ${pageCount}`,
                doc.internal.pageSize.width / 2,
                doc.internal.pageSize.height - 10,
                { align: 'center' }
            );
        }

        return doc.output('arraybuffer');
    }

    // Extract headers from data
    extractHeaders(data) {
        const headers = new Set(['Experiment', 'Response', 'Timestamp']);
        
        Object.entries(data).forEach(([experiment, responses]) => {
            Object.values(responses).forEach(response => {
                if (typeof response === 'object') {
                    Object.keys(response).forEach(key => headers.add(key));
                }
            });
        });
        
        return Array.from(headers);
    }

    // Flatten data for export
    flattenData(data, headers) {
        const rows = [];
        
        Object.entries(data).forEach(([experiment, responses]) => {
            Object.entries(responses).forEach(([response, data]) => {
                const row = {
                    Experiment: experiment,
                    Response: response
                };
                
                if (typeof data === 'object') {
                    Object.entries(data).forEach(([key, value]) => {
                        row[key] = value;
                    });
                }
                
                rows.push(row);
            });
        });
        
        return rows;
    }

    // Format CSV value
    formatCSVValue(value, delimiter) {
        if (value === null || value === undefined) {
            return '';
        }
        
        const stringValue = String(value);
        
        // Escape special characters
        if (
            stringValue.includes(delimiter) ||
            stringValue.includes('"') ||
            stringValue.includes('\\n')
        ) {
            return `"${stringValue.replace(/"/g, '""')}"`;
        }
        
        return stringValue;
    }

    // Format experiment name
    formatExperimentName(experiment) {
        return experiment
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    // Generate response summary
    generateResponseSummary(responses) {
        const summary = {
            'Total Responses': Object.keys(responses).length,
            'Response Types': {}
        };

        Object.entries(responses).forEach(([type, data]) => {
            if (!summary['Response Types'][type]) {
                summary['Response Types'][type] = 0;
            }
            summary['Response Types'][type]++;
        });

        return summary;
    }

    // Download file
    downloadFile(data, filename, format) {
        const blob = new Blob(
            [data],
            { type: format.mimeType }
        );
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${filename}${format.extension}`;
        
        // Trigger download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up
        URL.revokeObjectURL(link.href);
    }

    // Create export UI
    createExportUI(container, onExport) {
        const exportSection = document.createElement('div');
        exportSection.className = 'export-section';

        // Add export options
        const exportOptions = document.createElement('div');
        exportOptions.className = 'export-options';
        exportOptions.innerHTML = `
            <h5>Export Data</h5>
            <div class="export-format-group">
                ${Object.entries(this.exportFormats)
                    .map(([format, config]) => `
                        <button class="export-format-button" data-format="${format}">
                            Export as ${config.label}
                        </button>
                    `).join('')}
            </div>
        `;

        // Add event listeners
        Object.keys(this.exportFormats).forEach(format => {
            const button = exportOptions.querySelector(`[data-format="${format}"]`);
            button.addEventListener('click', () => {
                onExport(format);
            });
        });

        exportSection.appendChild(exportOptions);
        container.appendChild(exportSection);
    }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DataExport;
}
