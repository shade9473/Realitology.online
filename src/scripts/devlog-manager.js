// Development Log Manager
class DevLogManager {
    constructor() {
        this.entries = [];
        this.currentEntry = null;
        this.version = 'v2';
        this.logFile = 'DEVLOG_V2.md';
    }

    // Start a new log entry
    startEntry({
        task,
        description,
        expectedOutcome,
        estimatedCompletion
    }) {
        this.currentEntry = {
            task,
            startTime: new Date().toISOString(),
            description,
            expectedOutcome,
            estimatedCompletion,
            results: [],
            issues: [],
            nextSteps: [],
            percentComplete: 0,
            overallProgress: 0
        };
    }

    // Add a result to the current entry
    addResult(result) {
        if (this.currentEntry) {
            this.currentEntry.results.push(result);
        }
    }

    // Add an issue to the current entry
    addIssue(issue) {
        if (this.currentEntry) {
            this.currentEntry.issues.push(issue);
        }
    }

    // Add a next step to the current entry
    addNextStep(step) {
        if (this.currentEntry) {
            this.currentEntry.nextSteps.push(step);
        }
    }

    // Complete the current entry
    completeEntry({
        percentComplete,
        overallProgress
    }) {
        if (this.currentEntry) {
            this.currentEntry.endTime = new Date().toISOString();
            this.currentEntry.percentComplete = percentComplete;
            this.currentEntry.overallProgress = overallProgress;
            this.entries.push(this.currentEntry);
            this.currentEntry = null;
        }
    }

    // Generate markdown for an entry
    generateEntryMarkdown(entry) {
        return `
## Task: ${entry.task}

**Start Time:** ${new Date(entry.startTime).toLocaleString('en-US', { timeZone: 'America/Los_Angeles' })} PST
**Description:** ${entry.description}
${entry.expectedOutcome ? `**Expected Outcome:** ${entry.expectedOutcome}\n` : ''}
${entry.estimatedCompletion ? `**Estimated Completion:** ${entry.estimatedCompletion}\n` : ''}

**Progress Update:**
${entry.results.map(result => `- ${result}`).join('\n')}

${entry.issues.length > 0 ? `**Issues/Challenges:**\n${entry.issues.map(issue => `- ${issue}`).join('\n')}\n` : ''}

**Next Actions:**
${entry.nextSteps.map(step => `${step}`).join('\n')}

**Current Focus:**
- Testing implementation
- Optimizing performance
- Ensuring reliability
- Gathering feedback

**End Time:** ${entry.endTime ? new Date(entry.endTime).toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }) + ' PST' : 'In Progress'}
**Status:** ${entry.percentComplete === 100 ? 'Completed' : 'In Progress'}
**% Complete (Task):** ${entry.percentComplete}%

Overall Project Progress: ${entry.overallProgress}%
`;
    }

    // Generate full markdown log
    generateFullLog() {
        const header = `# Development Log ${this.version}
Last Updated: ${new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles' })} PST

This is the development log for the Realitology.online project. It tracks all major changes, updates, and milestones.

`;

        const entries = this.entries
            .sort((a, b) => new Date(b.startTime) - new Date(a.startTime))
            .map(entry => this.generateEntryMarkdown(entry))
            .join('\n---\n');

        return header + entries;
    }

    // Save log to file
    async saveLog() {
        const content = this.generateFullLog();
        
        try {
            // Save to local storage
            localStorage.setItem('devlog', JSON.stringify({
                version: this.version,
                lastUpdated: new Date().toISOString(),
                entries: this.entries
            }));
            console.log('Development log saved to local storage');
        } catch (error) {
            console.error('Error saving development log:', error);
            throw error;
        }
    }

    // Load entries from file
    async loadEntries() {
        try {
            // Load from local storage
            const storedLog = localStorage.getItem('devlog');
            if (storedLog) {
                const data = JSON.parse(storedLog);
                this.version = data.version;
                this.entries = data.entries;
                console.log('Development log loaded from local storage');
            } else {
                console.log('No development log found in local storage');
            }
        } catch (error) {
            console.error('Error loading development log:', error);
            throw error;
        }
    }

    // Parse log content into entries
    parseLogContent(content) {
        // Split content into entries
        const entryBlocks = content.split('## Task:').slice(1);
        
        this.entries = entryBlocks.map(block => {
            const lines = block.trim().split('\n');
            
            // Parse entry details
            const entry = {
                task: lines[0].trim(),
                startTime: this.parseDateTime(lines.find(l => l.includes('Start Time:'))),
                description: this.parseMultiLine(lines, 'Description:'),
                expectedOutcome: this.parseMultiLine(lines, 'Expected Outcome:'),
                estimatedCompletion: this.parseDateTime(lines.find(l => l.includes('Estimated Completion:'))),
                results: this.parseList(lines, 'Progress Update:'),
                issues: this.parseList(lines, 'Issues/Challenges:'),
                nextSteps: this.parseList(lines, 'Next Actions:'),
                endTime: this.parseDateTime(lines.find(l => l.includes('End Time:'))),
                percentComplete: this.parsePercentage(lines.find(l => l.includes('% Complete (Task):'))),
                overallProgress: this.parsePercentage(lines.find(l => l.includes('Overall Project Progress:')))
            };
            
            return entry;
        });
    }

    // Parse date/time string
    parseDateTime(line) {
        if (!line) return null;
        const match = line.match(/\d{1,2}\/\d{1,2}\/\d{4},?\s+\d{1,2}:\d{2}:\d{2}\s+(?:AM|PM)/i);
        return match ? new Date(match[0]).toISOString() : null;
    }

    // Parse multi-line field
    parseMultiLine(lines, field) {
        const startIndex = lines.findIndex(l => l.includes(field));
        if (startIndex === -1) return '';
        
        let content = [];
        for (let i = startIndex + 1; i < lines.length; i++) {
            if (lines[i].match(/^\*\*[^:]+:/)) break;
            content.push(lines[i].trim());
        }
        
        return content.join('\n').trim();
    }

    // Parse list items
    parseList(lines, field) {
        const startIndex = lines.findIndex(l => l.includes(field));
        if (startIndex === -1) return [];
        
        let items = [];
        for (let i = startIndex + 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line || line.match(/^\*\*[^:]+:/)) break;
            if (line.startsWith('-')) {
                items.push(line.substring(1).trim());
            }
        }
        
        return items;
    }

    // Parse percentage value
    parsePercentage(line) {
        if (!line) return 0;
        const match = line.match(/\d+/);
        return match ? parseInt(match[0], 10) : 0;
    }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DevLogManager;
}
