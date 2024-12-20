// SEO Optimization Module
class SEOOptimizer {
    constructor() {
        this.metrics = {
            content: {},
            keywords: {},
            links: {},
            performance: {}
        };

        // Initialize optimization
        this.initializeOptimization();
    }

    // Initialize optimization
    async initializeOptimization() {
        // Analyze content
        this.analyzeContent();
        
        // Check keywords
        this.analyzeKeywords();
        
        // Analyze links
        this.analyzeLinks();
        
        // Check performance
        await this.analyzePerformance();
        
        // Generate report
        this.generateReport();
    }

    // Analyze content quality
    analyzeContent() {
        const contentElements = document.querySelectorAll('article, section, .content');
        
        contentElements.forEach(element => {
            const text = element.textContent;
            const metrics = this.calculateContentMetrics(text);
            
            this.metrics.content[element.id || 'unnamed'] = {
                wordCount: metrics.wordCount,
                readingEase: metrics.readingEase,
                headingStructure: this.analyzeHeadingStructure(element),
                imageOptimization: this.analyzeImages(element)
            };
        });
    }

    // Calculate content metrics
    calculateContentMetrics(text) {
        // Word count
        const words = text.trim().split(/\s+/).length;
        
        // Sentences
        const sentences = text.split(/[.!?]+/).length;
        
        // Syllables (basic approximation)
        const syllables = text.toLowerCase()
            .replace(/[^a-z]/g, '')
            .replace(/[^aeiou]/g, '')
            .length;
        
        // Calculate Flesch Reading Ease
        const readingEase = 206.835 - 1.015 * (words / sentences) - 84.6 * (syllables / words);
        
        return {
            wordCount: words,
            readingEase: Math.round(readingEase * 10) / 10
        };
    }

    // Analyze heading structure
    analyzeHeadingStructure(element) {
        const headings = {};
        ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].forEach(tag => {
            headings[tag] = element.querySelectorAll(tag).length;
        });
        
        return {
            headings,
            isValid: this.validateHeadingStructure(headings)
        };
    }

    // Validate heading structure
    validateHeadingStructure(headings) {
        // Check if there's exactly one H1
        if (headings.h1 !== 1) return false;
        
        // Check if headings are in order (no skipping levels)
        let previousLevel = 1;
        for (let i = 2; i <= 6; i++) {
            if (headings[`h${i}`] > 0 && headings[`h${previousLevel}`] === 0) {
                return false;
            }
            previousLevel = i;
        }
        
        return true;
    }

    // Analyze images
    analyzeImages(element) {
        const images = element.querySelectorAll('img');
        const imageMetrics = {
            total: images.length,
            withAlt: 0,
            optimized: 0
        };
        
        images.forEach(img => {
            // Check alt text
            if (img.alt && img.alt.trim()) {
                imageMetrics.withAlt++;
            }
            
            // Check if image is optimized
            if (this.isImageOptimized(img)) {
                imageMetrics.optimized++;
            }
        });
        
        return imageMetrics;
    }

    // Check if image is optimized
    isImageOptimized(img) {
        // Check file format
        const isWebP = img.src.toLowerCase().endsWith('.webp');
        
        // Check if image has width and height attributes
        const hasDimensions = img.width && img.height;
        
        // Check if image has loading attribute
        const hasLazyLoading = img.loading === 'lazy';
        
        return isWebP && hasDimensions && hasLazyLoading;
    }

    // Analyze keywords
    analyzeKeywords() {
        const text = document.body.textContent;
        const words = text.toLowerCase()
            .replace(/[^\w\s]/g, '')
            .split(/\s+/);
        
        // Calculate word frequency
        const frequency = {};
        words.forEach(word => {
            frequency[word] = (frequency[word] || 0) + 1;
        });
        
        // Sort by frequency
        this.metrics.keywords = Object.entries(frequency)
            .sort(([, a], [, b]) => b - a)
            .reduce((obj, [word, count]) => {
                obj[word] = count;
                return obj;
            }, {});
    }

    // Analyze links
    analyzeLinks() {
        const links = document.querySelectorAll('a');
        const linkMetrics = {
            total: links.length,
            internal: 0,
            external: 0,
            broken: 0
        };
        
        links.forEach(link => {
            const href = link.href;
            
            if (!href) {
                linkMetrics.broken++;
            } else if (href.startsWith(window.location.origin)) {
                linkMetrics.internal++;
            } else {
                linkMetrics.external++;
            }
        });
        
        this.metrics.links = linkMetrics;
    }

    // Analyze performance
    async analyzePerformance() {
        if ('performance' in window) {
            const timing = performance.timing;
            
            this.metrics.performance = {
                loadTime: timing.loadEventEnd - timing.navigationStart,
                domReady: timing.domContentLoadedEventEnd - timing.navigationStart,
                firstPaint: performance.getEntriesByType('paint')[0]?.startTime,
                firstContentfulPaint: performance.getEntriesByType('paint')[1]?.startTime
            };
        }
    }

    // Generate optimization suggestions
    generateSuggestions() {
        const suggestions = [];
        
        // Content suggestions
        Object.entries(this.metrics.content).forEach(([id, metrics]) => {
            if (metrics.wordCount < 300) {
                suggestions.push(`Content section '${id}' is too short. Add more comprehensive content.`);
            }
            
            if (metrics.readingEase < 30) {
                suggestions.push(`Content section '${id}' is too difficult to read. Simplify the language.`);
            }
            
            if (!metrics.headingStructure.isValid) {
                suggestions.push(`Heading structure in '${id}' needs improvement. Ensure proper hierarchy.`);
            }
            
            if (metrics.imageOptimization.withAlt < metrics.imageOptimization.total) {
                suggestions.push(`Some images in '${id}' are missing alt text.`);
            }
        });
        
        // Link suggestions
        if (this.metrics.links.broken > 0) {
            suggestions.push(`Found ${this.metrics.links.broken} broken links. Fix or remove them.`);
        }
        
        if (this.metrics.links.internal < this.metrics.links.external) {
            suggestions.push('Consider adding more internal links for better site structure.');
        }
        
        // Performance suggestions
        if (this.metrics.performance.loadTime > 3000) {
            suggestions.push('Page load time is too high. Optimize performance.');
        }
        
        return suggestions;
    }

    // Generate SEO report
    generateReport() {
        const report = {
            timestamp: new Date().toISOString(),
            metrics: this.metrics,
            suggestions: this.generateSuggestions()
        };
        
        // Log report
        if (process.env.NODE_ENV === 'development') {
            console.log('SEO Report:', report);
        }
        
        // Track metrics
        window.plausible?.('SEO Analysis', {
            props: {
                metrics: JSON.stringify(this.metrics)
            }
        });
        
        return report;
    }

    // Get optimization status
    getOptimizationStatus() {
        const metrics = this.metrics;
        const status = {
            content: {},
            seo: {},
            performance: {}
        };
        
        // Content status
        Object.entries(metrics.content).forEach(([id, data]) => {
            status.content[id] = {
                isOptimal: data.wordCount >= 300 && data.readingEase >= 30,
                readingEase: data.readingEase,
                headingStructure: data.headingStructure.isValid
            };
        });
        
        // SEO status
        status.seo = {
            hasKeywords: Object.keys(metrics.keywords).length > 0,
            hasMetaTags: document.querySelector('meta[name="description"]') !== null,
            hasStructuredData: document.querySelector('script[type="application/ld+json"]') !== null
        };
        
        // Performance status
        status.performance = {
            isOptimal: metrics.performance.loadTime < 3000,
            loadTime: metrics.performance.loadTime,
            firstContentfulPaint: metrics.performance.firstContentfulPaint
        };
        
        return status;
    }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SEOOptimizer;
}
