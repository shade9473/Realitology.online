// Content Quality Analyzer Module
class ContentAnalyzer {
    constructor() {
        this.metrics = {
            quality: {},
            originality: {},
            readability: {},
            engagement: {}
        };

        // Initialize analysis
        this.initializeAnalysis();
    }

    // Initialize analysis
    async initializeAnalysis() {
        // Analyze content quality
        this.analyzeQuality();
        
        // Check originality
        await this.checkOriginality();
        
        // Analyze readability
        this.analyzeReadability();
        
        // Check engagement
        this.analyzeEngagement();
        
        // Generate report
        this.generateReport();
    }

    // Analyze content quality
    analyzeQuality() {
        const contentSections = document.querySelectorAll('article, section, .content');
        
        contentSections.forEach(section => {
            const text = section.textContent;
            const metrics = this.calculateQualityMetrics(text);
            
            this.metrics.quality[section.id || 'unnamed'] = {
                wordCount: metrics.wordCount,
                sentenceVariety: metrics.sentenceVariety,
                vocabularyRichness: metrics.vocabularyRichness,
                topicRelevance: this.analyzeTopicRelevance(text)
            };
        });
    }

    // Calculate quality metrics
    calculateQualityMetrics(text) {
        // Word count
        const words = text.trim().split(/\s+/);
        
        // Sentence length variety
        const sentences = text.split(/[.!?]+/).filter(s => s.trim());
        const sentenceLengths = sentences.map(s => s.trim().split(/\s+/).length);
        const sentenceVariety = this.calculateVariety(sentenceLengths);
        
        // Vocabulary richness
        const uniqueWords = new Set(words.map(w => w.toLowerCase()));
        const vocabularyRichness = uniqueWords.size / words.length;
        
        return {
            wordCount: words.length,
            sentenceVariety,
            vocabularyRichness: Math.round(vocabularyRichness * 100) / 100
        };
    }

    // Calculate variety (standard deviation)
    calculateVariety(numbers) {
        const mean = numbers.reduce((a, b) => a + b) / numbers.length;
        const variance = numbers.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / numbers.length;
        return Math.sqrt(variance);
    }

    // Analyze topic relevance
    analyzeTopicRelevance(text) {
        // Get keywords from meta tags
        const keywords = document.querySelector('meta[name="keywords"]')?.content?.split(',') || [];
        
        // Calculate keyword presence
        const relevanceScore = keywords.reduce((score, keyword) => {
            const regex = new RegExp(keyword.trim(), 'gi');
            const matches = text.match(regex) || [];
            return score + matches.length;
        }, 0);
        
        return {
            score: relevanceScore,
            keywords: keywords.length
        };
    }

    // Check content originality
    async checkOriginality() {
        const contentSections = document.querySelectorAll('article, section, .content');
        
        for (const section of contentSections) {
            const text = section.textContent;
            const originality = await this.checkTextOriginality(text);
            
            this.metrics.originality[section.id || 'unnamed'] = originality;
        }
    }

    // Check text originality
    async checkTextOriginality(text) {
        // Calculate text fingerprint
        const fingerprint = this.calculateTextFingerprint(text);
        
        // Compare with known fingerprints
        const similarity = await this.compareFingerprintWithDatabase(fingerprint);
        
        return {
            uniqueScore: similarity.uniqueScore,
            similarSources: similarity.sources
        };
    }

    // Calculate text fingerprint
    calculateTextFingerprint(text) {
        // Remove common words and punctuation
        const cleanText = text.toLowerCase()
            .replace(/[^\w\s]/g, '')
            .split(/\s+/)
            .filter(word => !this.isCommonWord(word))
            .join(' ');
        
        // Calculate hash
        return this.simpleHash(cleanText);
    }

    // Simple hash function
    simpleHash(text) {
        let hash = 0;
        for (let i = 0; i < text.length; i++) {
            const char = text.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash.toString(36);
    }

    // Check if word is common
    isCommonWord(word) {
        const commonWords = new Set(['the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i']);
        return commonWords.has(word);
    }

    // Compare fingerprint with database
    async compareFingerprintWithDatabase(fingerprint) {
        // Simulate database comparison
        return {
            uniqueScore: 0.95,
            sources: []
        };
    }

    // Analyze readability
    analyzeReadability() {
        const contentSections = document.querySelectorAll('article, section, .content');
        
        contentSections.forEach(section => {
            const text = section.textContent;
            const metrics = this.calculateReadabilityMetrics(text);
            
            this.metrics.readability[section.id || 'unnamed'] = metrics;
        });
    }

    // Calculate readability metrics
    calculateReadabilityMetrics(text) {
        // Split into words and sentences
        const words = text.trim().split(/\s+/);
        const sentences = text.split(/[.!?]+/).filter(s => s.trim());
        
        // Calculate metrics
        const avgWordsPerSentence = words.length / sentences.length;
        const avgSyllablesPerWord = this.calculateAverageSyllables(words);
        
        // Calculate scores
        const fleschKincaid = 206.835 - 1.015 * avgWordsPerSentence - 84.6 * avgSyllablesPerWord;
        const gunningFog = 0.4 * (avgWordsPerSentence + this.calculateComplexWords(words));
        
        return {
            fleschKincaid: Math.round(fleschKincaid * 10) / 10,
            gunningFog: Math.round(gunningFog * 10) / 10,
            avgWordsPerSentence: Math.round(avgWordsPerSentence * 10) / 10,
            avgSyllablesPerWord: Math.round(avgSyllablesPerWord * 10) / 10
        };
    }

    // Calculate average syllables per word
    calculateAverageSyllables(words) {
        const totalSyllables = words.reduce((total, word) => {
            return total + this.countSyllables(word);
        }, 0);
        
        return totalSyllables / words.length;
    }

    // Count syllables in a word
    countSyllables(word) {
        word = word.toLowerCase();
        if (word.length <= 3) return 1;
        
        word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
        word = word.replace(/^y/, '');
        
        const syllables = word.match(/[aeiouy]{1,2}/g);
        return syllables ? syllables.length : 1;
    }

    // Calculate percentage of complex words
    calculateComplexWords(words) {
        const complexWords = words.filter(word => this.countSyllables(word) > 2);
        return (complexWords.length / words.length) * 100;
    }

    // Analyze engagement metrics
    analyzeEngagement() {
        const contentSections = document.querySelectorAll('article, section, .content');
        
        contentSections.forEach(section => {
            this.metrics.engagement[section.id || 'unnamed'] = {
                interactiveElements: this.countInteractiveElements(section),
                mediaElements: this.countMediaElements(section),
                callsToAction: this.countCallsToAction(section)
            };
        });
    }

    // Count interactive elements
    countInteractiveElements(element) {
        return {
            buttons: element.querySelectorAll('button').length,
            links: element.querySelectorAll('a').length,
            forms: element.querySelectorAll('form').length,
            inputs: element.querySelectorAll('input, select, textarea').length
        };
    }

    // Count media elements
    countMediaElements(element) {
        return {
            images: element.querySelectorAll('img').length,
            videos: element.querySelectorAll('video').length,
            audio: element.querySelectorAll('audio').length,
            embeds: element.querySelectorAll('iframe, embed').length
        };
    }

    // Count calls to action
    countCallsToAction(element) {
        const ctaKeywords = ['sign up', 'subscribe', 'join', 'download', 'learn more', 'get started'];
        let count = 0;
        
        element.querySelectorAll('a, button').forEach(el => {
            const text = el.textContent.toLowerCase();
            if (ctaKeywords.some(keyword => text.includes(keyword))) {
                count++;
            }
        });
        
        return count;
    }

    // Generate content improvement suggestions
    generateSuggestions() {
        const suggestions = [];
        
        // Quality suggestions
        Object.entries(this.metrics.quality).forEach(([id, metrics]) => {
            if (metrics.wordCount < 300) {
                suggestions.push(`Content section '${id}' needs more depth. Add detailed explanations and examples.`);
            }
            
            if (metrics.vocabularyRichness < 0.4) {
                suggestions.push(`Content section '${id}' could use more varied vocabulary.`);
            }
            
            if (metrics.topicRelevance.score < metrics.topicRelevance.keywords) {
                suggestions.push(`Content section '${id}' could be more focused on the main topics.`);
            }
        });
        
        // Readability suggestions
        Object.entries(this.metrics.readability).forEach(([id, metrics]) => {
            if (metrics.fleschKincaid < 50) {
                suggestions.push(`Content section '${id}' is too complex. Simplify the language.`);
            }
            
            if (metrics.avgWordsPerSentence > 25) {
                suggestions.push(`Sentences in '${id}' are too long. Break them into smaller parts.`);
            }
        });
        
        // Engagement suggestions
        Object.entries(this.metrics.engagement).forEach(([id, metrics]) => {
            if (metrics.callsToAction < 1) {
                suggestions.push(`Add clear calls to action in section '${id}'.`);
            }
            
            if (Object.values(metrics.mediaElements).reduce((a, b) => a + b) < 1) {
                suggestions.push(`Consider adding media elements to section '${id}' for better engagement.`);
            }
        });
        
        return suggestions;
    }

    // Generate content analysis report
    generateReport() {
        const report = {
            timestamp: new Date().toISOString(),
            metrics: this.metrics,
            suggestions: this.generateSuggestions()
        };
        
        // Log report
        if (process.env.NODE_ENV === 'development') {
            console.log('Content Analysis Report:', report);
        }
        
        // Track metrics
        window.plausible?.('Content Analysis', {
            props: {
                metrics: JSON.stringify(this.metrics)
            }
        });
        
        return report;
    }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ContentAnalyzer;
}
