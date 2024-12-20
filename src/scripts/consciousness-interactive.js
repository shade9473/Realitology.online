// Interactive elements for the consciousness page
class ConsciousnessInteractive {
    constructor() {
        this.init();
    }

    init() {
        this.initProgressBar();
        this.initThoughtExperiment();
        this.initQuoteRotator();
        this.initInteractiveModel();
        this.setupIntersectionObserver();
    }

    initProgressBar() {
        const progressBar = document.createElement('div');
        progressBar.className = 'reading-progress';
        document.body.appendChild(progressBar);

        window.addEventListener('scroll', () => {
            const scrollPercent = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
            progressBar.style.width = `${scrollPercent}%`;
            
            // Track progress milestones
            if (window.siteAnalytics) {
                if (scrollPercent >= 90 && !this.tracked90) {
                    window.siteAnalytics.trackEvent('Reading Progress', { milestone: '90%' });
                    this.tracked90 = true;
                }
            }
        }, { passive: true });
    }

    initThoughtExperiment() {
        const experiments = document.querySelectorAll('.thought-experiment');
        experiments.forEach(exp => {
            const question = exp.querySelector('.question');
            const options = exp.querySelectorAll('.option');
            const explanation = exp.querySelector('.explanation');

            options.forEach(option => {
                option.addEventListener('click', () => {
                    options.forEach(o => o.classList.remove('selected'));
                    option.classList.add('selected');
                    explanation.classList.add('visible');

                    if (window.siteAnalytics) {
                        window.siteAnalytics.trackEvent('Thought Experiment', {
                            question: question.textContent,
                            answer: option.textContent
                        });
                    }
                });
            });
        });
    }

    initQuoteRotator() {
        const quotes = document.querySelectorAll('.consciousness-quote');
        let currentQuote = 0;

        const rotateQuotes = () => {
            quotes.forEach(quote => quote.classList.remove('active'));
            quotes[currentQuote].classList.add('active');
            currentQuote = (currentQuote + 1) % quotes.length;
        };

        setInterval(rotateQuotes, 8000);
        rotateQuotes();
    }

    initInteractiveModel() {
        const model = document.querySelector('.consciousness-model');
        if (!model) return;

        const layers = model.querySelectorAll('.layer');
        let activeLayer = 0;

        const activateLayer = (index) => {
            layers.forEach(layer => layer.classList.remove('active'));
            layers[index].classList.add('active');

            if (window.siteAnalytics) {
                window.siteAnalytics.trackEvent('Model Interaction', {
                    layer: layers[index].dataset.layer
                });
            }
        };

        layers.forEach((layer, index) => {
            layer.addEventListener('click', () => {
                activateLayer(index);
                activeLayer = index;
            });
        });

        // Auto-rotate layers every 5 seconds if no interaction
        setInterval(() => {
            if (!model.matches(':hover')) {
                activeLayer = (activeLayer + 1) % layers.length;
                activateLayer(activeLayer);
            }
        }, 5000);
    }

    setupIntersectionObserver() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    
                    if (window.siteAnalytics && entry.target.dataset.trackSection) {
                        window.siteAnalytics.trackEvent('Section View', {
                            section: entry.target.dataset.trackSection
                        });
                    }
                }
            });
        }, {
            threshold: 0.2
        });

        document.querySelectorAll('section[data-track-section]').forEach(section => {
            observer.observe(section);
        });
    }
}

// Initialize interactive elements when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ConsciousnessInteractive();
});
