// Performance Monitor Module
class PerformanceMonitor {
    constructor() {
        this.metrics = {
            navigation: {},
            resources: {},
            interactions: {},
            animations: {},
            memory: {}
        };

        this.thresholds = {
            fcp: 2000,      // First Contentful Paint
            lcp: 2500,      // Largest Contentful Paint
            fid: 100,       // First Input Delay
            cls: 0.1,       // Cumulative Layout Shift
            ttfb: 600,      // Time to First Byte
            fps: 60         // Frames Per Second
        };

        // Initialize observers
        this.initializeObservers();
        
        // Start monitoring
        this.startMonitoring();
    }

    // Initialize performance observers
    initializeObservers() {
        // Performance Observer for web vitals
        if ('PerformanceObserver' in window) {
            // LCP observer
            new PerformanceObserver((entryList) => {
                const entries = entryList.getEntries();
                const lastEntry = entries[entries.length - 1];
                this.metrics.navigation.lcp = lastEntry.startTime;
                this.checkThreshold('lcp', lastEntry.startTime);
            }).observe({ entryTypes: ['largest-contentful-paint'] });

            // FID observer
            new PerformanceObserver((entryList) => {
                const entries = entryList.getEntries();
                entries.forEach(entry => {
                    this.metrics.interactions.fid = entry.processingStart - entry.startTime;
                    this.checkThreshold('fid', this.metrics.interactions.fid);
                });
            }).observe({ entryTypes: ['first-input'] });

            // CLS observer
            new PerformanceObserver((entryList) => {
                const entries = entryList.getEntries();
                let clsValue = 0;
                entries.forEach(entry => {
                    if (!entry.hadRecentInput) {
                        clsValue += entry.value;
                    }
                });
                this.metrics.layout.cls = clsValue;
                this.checkThreshold('cls', clsValue);
            }).observe({ entryTypes: ['layout-shift'] });

            // Resource timing observer
            new PerformanceObserver((entryList) => {
                const entries = entryList.getEntries();
                entries.forEach(entry => {
                    this.metrics.resources[entry.name] = {
                        duration: entry.duration,
                        transferSize: entry.transferSize,
                        initiatorType: entry.initiatorType
                    };
                });
            }).observe({ entryTypes: ['resource'] });

            // Navigation timing observer
            new PerformanceObserver((entryList) => {
                const entries = entryList.getEntries();
                entries.forEach(entry => {
                    this.metrics.navigation.ttfb = entry.responseStart - entry.requestStart;
                    this.checkThreshold('ttfb', this.metrics.navigation.ttfb);
                });
            }).observe({ entryTypes: ['navigation'] });
        }
    }

    // Start performance monitoring
    startMonitoring() {
        // Monitor FPS
        this.monitorFPS();

        // Monitor memory usage
        this.monitorMemory();

        // Monitor long tasks
        this.monitorLongTasks();

        // Monitor network status
        this.monitorNetwork();

        // Report metrics periodically
        setInterval(() => this.reportMetrics(), 60000);
    }

    // Monitor frames per second
    monitorFPS() {
        let frameCount = 0;
        let lastTime = performance.now();
        
        const countFrame = () => {
            frameCount++;
            requestAnimationFrame(countFrame);
        };
        
        requestAnimationFrame(countFrame);
        
        setInterval(() => {
            const currentTime = performance.now();
            const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
            
            this.metrics.animations.fps = fps;
            this.checkThreshold('fps', fps);
            
            frameCount = 0;
            lastTime = currentTime;
        }, 1000);
    }

    // Monitor memory usage
    monitorMemory() {
        if (performance.memory) {
            setInterval(() => {
                this.metrics.memory = {
                    usedJSHeapSize: performance.memory.usedJSHeapSize,
                    totalJSHeapSize: performance.memory.totalJSHeapSize,
                    jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
                };
            }, 1000);
        }
    }

    // Monitor long tasks
    monitorLongTasks() {
        if ('PerformanceObserver' in window) {
            new PerformanceObserver((entryList) => {
                const entries = entryList.getEntries();
                entries.forEach(entry => {
                    if (entry.duration > 50) {
                        this.metrics.interactions.longTasks = this.metrics.interactions.longTasks || [];
                        this.metrics.interactions.longTasks.push({
                            duration: entry.duration,
                            startTime: entry.startTime
                        });

                        // Notify if task is extremely long
                        if (entry.duration > 100) {
                            this.notifyLongTask(entry);
                        }
                    }
                });
            }).observe({ entryTypes: ['longtask'] });
        }
    }

    // Monitor network status
    monitorNetwork() {
        if ('connection' in navigator) {
            const connection = navigator.connection;
            
            const updateNetworkInfo = () => {
                this.metrics.network = {
                    effectiveType: connection.effectiveType,
                    downlink: connection.downlink,
                    rtt: connection.rtt,
                    saveData: connection.saveData
                };
            };
            
            connection.addEventListener('change', updateNetworkInfo);
            updateNetworkInfo();
        }
    }

    // Check if metric exceeds threshold
    checkThreshold(metric, value) {
        if (this.thresholds[metric] && value > this.thresholds[metric]) {
            this.notifyThresholdExceeded(metric, value);
            
            // Track threshold violation
            window.plausible?.('Performance Threshold Exceeded', {
                props: {
                    metric,
                    value,
                    threshold: this.thresholds[metric]
                }
            });
        }
    }

    // Notify about long task
    notifyLongTask(entry) {
        if (window.notificationSystem) {
            window.notificationSystem.show({
                title: 'Performance Warning',
                message: `Long task detected (${Math.round(entry.duration)}ms)`,
                type: 'warning',
                duration: 5000
            });
        }
    }

    // Notify about threshold exceeded
    notifyThresholdExceeded(metric, value) {
        if (window.notificationSystem) {
            window.notificationSystem.show({
                title: 'Performance Alert',
                message: `${metric.toUpperCase()} exceeded threshold: ${Math.round(value)}`,
                type: 'error',
                duration: 5000
            });
        }
    }

    // Report metrics
    reportMetrics() {
        // Send metrics to analytics
        window.plausible?.('Performance Metrics', {
            props: {
                metrics: JSON.stringify(this.metrics)
            }
        });

        // Log to console in development
        if (process.env.NODE_ENV === 'development') {
            console.log('Performance Metrics:', this.metrics);
        }
    }

    // Get current metrics
    getMetrics() {
        return {
            ...this.metrics,
            timestamp: Date.now()
        };
    }

    // Update threshold
    updateThreshold(metric, value) {
        if (metric in this.thresholds) {
            this.thresholds[metric] = value;
        }
    }

    // Check if performance is optimal
    isPerformanceOptimal() {
        return {
            fcp: this.metrics.navigation.fcp < this.thresholds.fcp,
            lcp: this.metrics.navigation.lcp < this.thresholds.lcp,
            fid: this.metrics.interactions.fid < this.thresholds.fid,
            cls: this.metrics.layout.cls < this.thresholds.cls,
            ttfb: this.metrics.navigation.ttfb < this.thresholds.ttfb,
            fps: this.metrics.animations.fps >= this.thresholds.fps
        };
    }

    // Get optimization suggestions
    getOptimizationSuggestions() {
        const suggestions = [];
        const metrics = this.isPerformanceOptimal();

        if (!metrics.fcp) {
            suggestions.push('Consider reducing initial server response time and optimizing critical rendering path');
        }

        if (!metrics.lcp) {
            suggestions.push('Optimize largest contentful paint by improving image loading and server response time');
        }

        if (!metrics.fid) {
            suggestions.push('Improve first input delay by optimizing JavaScript execution and reducing main thread blocking');
        }

        if (!metrics.cls) {
            suggestions.push('Reduce cumulative layout shift by setting proper image dimensions and avoiding dynamic content insertion');
        }

        if (!metrics.ttfb) {
            suggestions.push('Improve time to first byte by optimizing server response time and using caching');
        }

        if (!metrics.fps) {
            suggestions.push('Optimize frame rate by reducing JavaScript execution time and improving animation performance');
        }

        return suggestions;
    }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PerformanceMonitor;
}
