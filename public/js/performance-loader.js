// ==================== PERFORMANCE-OPTIMIZED LOADER ====================

class PerformanceLoader {
    constructor() {
        this.loadStartTime = performance.now();
        this.criticalResources = [];
        this.deferredResources = [];
        this.metrics = {
            domContentLoaded: 0,
            firstPaint: 0,
            firstContentfulPaint: 0,
            loadComplete: 0
        };
        
        this.init();
    }

    init() {
        this.measurePerformance();
        this.optimizeResourceLoading();
        this.setupLazyLoading();
    }

    measurePerformance() {
        // Capture performance metrics
        const observer = new PerformanceObserver((list) => {
            list.getEntries().forEach((entry) => {
                if (entry.name === 'first-paint') {
                    this.metrics.firstPaint = entry.startTime;
                } else if (entry.name === 'first-contentful-paint') {
                    this.metrics.firstContentfulPaint = entry.startTime;
                }
            });
        });
        
        try {
            observer.observe({ entryTypes: ['paint'] });
        } catch (e) {
            console.warn('Paint timing not supported');
        }

        // DOM Content Loaded
        document.addEventListener('DOMContentLoaded', () => {
            this.metrics.domContentLoaded = performance.now() - this.loadStartTime;
            console.log(`📊 DOM Ready: ${this.metrics.domContentLoaded.toFixed(2)}ms`);
        });

        // Load Complete
        window.addEventListener('load', () => {
            this.metrics.loadComplete = performance.now() - this.loadStartTime;
            this.reportPerformance();
        });
    }

    optimizeResourceLoading() {
        // Preload critical CSS
        this.preloadResource('/css/styles.css', 'style');
        
        // Defer non-critical JavaScript
        this.deferScript('/js/chart.js');
        this.deferScript('/js/dashboard.js');
        this.deferScript('/js/websocket.js');
        
        // Load external libraries asynchronously
        this.loadExternalAsync('https://unpkg.com/lightweight-charts/dist/lightweight-charts.standalone.production.js');
        this.loadExternalAsync('https://cdn.jsdelivr.net/npm/chart.js');
    }

    preloadResource(href, as = 'script') {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = as;
        link.href = href;
        document.head.appendChild(link);
    }

    deferScript(src) {
        const script = document.createElement('script');
        script.src = src;
        script.defer = true;
        script.async = false;
        document.head.appendChild(script);
        
        this.deferredResources.push(src);
    }

    loadExternalAsync(src) {
        const script = document.createElement('script');
        script.src = src;
        script.async = true;
        script.onload = () => {
            console.log(`✅ External resource loaded: ${src}`);
        };
        document.head.appendChild(script);
    }

    setupLazyLoading() {
        // Intersection Observer for panels
        const panelObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.loadPanelContent(entry.target);
                    panelObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });

        // Observe dashboard panels after DOM load
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(() => {
                document.querySelectorAll('.dashboard-panel').forEach(panel => {
                    panelObserver.observe(panel);
                });
            }, 100);
        });
    }

    loadPanelContent(panel) {
        const panelType = panel.dataset.panel;
        console.log(`🚀 Lazy loading panel: ${panelType}`);
        
        // Add loaded class for CSS animations
        panel.classList.add('panel-loaded');
    }

    // Resource bundling for production
    bundleResources() {
        return {
            critical: [
                '/css/styles.css',
                '/js/utils.js'
            ],
            deferred: [
                '/js/websocket.js',
                '/js/chart.js',
                '/js/dashboard.js'
            ],
            external: [
                'https://unpkg.com/lightweight-charts/dist/lightweight-charts.standalone.production.js',
                'https://cdn.jsdelivr.net/npm/chart.js'
            ]
        };
    }

    reportPerformance() {
        const perfData = {
            ...this.metrics,
            loadComplete: performance.now() - this.loadStartTime,
            resourceTiming: this.getResourceTiming()
        };

        console.log('⚡ PERFORMANCE REPORT:');
        console.log(`├─ DOM Ready: ${perfData.domContentLoaded.toFixed(2)}ms`);
        console.log(`├─ First Paint: ${perfData.firstPaint.toFixed(2)}ms`);
        console.log(`├─ First Contentful Paint: ${perfData.firstContentfulPaint.toFixed(2)}ms`);
        console.log(`└─ Load Complete: ${perfData.loadComplete.toFixed(2)}ms`);

        // Send to performance monitoring (if available)
        if (window.gtag) {
            window.gtag('event', 'timing_complete', {
                name: 'load',
                value: Math.round(perfData.loadComplete)
            });
        }
    }

    getResourceTiming() {
        const resources = performance.getEntriesByType('resource');
        return resources.map(resource => ({
            name: resource.name,
            duration: resource.duration,
            size: resource.transferSize
        })).filter(r => r.name.includes('localhost:3337'));
    }

    // Memory optimization
    optimizeMemory() {
        // Clean up unused event listeners
        const unusedElements = document.querySelectorAll('[data-cleanup="true"]');
        unusedElements.forEach(el => {
            el.removeEventListener('click', null);
            el.removeEventListener('scroll', null);
        });

        // Force garbage collection in development
        if (typeof window.gc === 'function') {
            window.gc();
        }
    }

    // Debounced resize handler
    setupOptimizedHandlers() {
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.handleResize();
            }, 250);
        });
    }

    handleResize() {
        // Optimized resize handling
        const panels = document.querySelectorAll('.dashboard-panel');
        requestAnimationFrame(() => {
            panels.forEach(panel => {
                if (panel.classList.contains('maximized')) {
                    this.recalculatePanelSize(panel);
                }
            });
        });
    }

    recalculatePanelSize(panel) {
        const rect = panel.getBoundingClientRect();
        panel.style.width = `${rect.width}px`;
        panel.style.height = `${rect.height}px`;
    }
}

// Initialize performance loader immediately
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.perfLoader = new PerformanceLoader();
    });
} else {
    window.perfLoader = new PerformanceLoader();
}