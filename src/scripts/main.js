// Theme data
const themes = [
    {
        title: 'AI and the Nature of Reality',
        description: 'Explore how artificial intelligence is reshaping our understanding of reality and existence.',
        icon: '🌌',
        link: '/ai-reality'
    },
    {
        title: 'Consciousness in the Age of AI',
        description: 'Investigating the relationship between human consciousness and artificial intelligence.',
        icon: '🧠',
        link: '/consciousness'
    },
    {
        title: 'Philosophical Implications',
        description: 'Examining the philosophical questions raised by advances in AI technology.',
        icon: '💭',
        link: '/philosophy'
    },
    {
        title: 'Future of Understanding',
        description: 'Predicting how AI will transform human knowledge and comprehension.',
        icon: '🔮',
        link: '/future'
    },
    {
        title: 'Logic and Reasoning',
        description: 'Analyzing the impact of AI on human logic and reasoning capabilities.',
        icon: '⚡',
        link: '/logic'
    },
    {
        title: 'AI and Metaphysics',
        description: 'Exploring the intersection of AI and fundamental questions of existence.',
        icon: '🎯',
        link: '/metaphysics'
    }
];

// Initialize theme grid
function initThemeGrid() {
    const themeGrid = document.querySelector('.theme-grid');
    if (!themeGrid) return;

    themes.forEach(theme => {
        const themeCard = document.createElement('article');
        themeCard.className = 'theme-card fade-in';
        themeCard.innerHTML = `
            <div class="theme-icon">${theme.icon}</div>
            <h3>${theme.title}</h3>
            <p>${theme.description}</p>
            <a href="${theme.link}" class="theme-link">Learn More →</a>
        `;
        themeGrid.appendChild(themeCard);
    });
}

// Performance optimizations
function initPerformanceOptimizations() {
    // Lazy load images
    const images = document.querySelectorAll('img[data-src]');
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                    observer.unobserve(img);
                }
            });
        });

        images.forEach(img => imageObserver.observe(img));
    }
}

// Navigation handling
function initNavigation() {
    const header = document.querySelector('.site-header');
    let lastScroll = 0;

    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;
        
        if (currentScroll <= 0) {
            header.classList.remove('scroll-up');
            return;
        }
        
        if (currentScroll > lastScroll && !header.classList.contains('scroll-down')) {
            header.classList.remove('scroll-up');
            header.classList.add('scroll-down');
        } else if (currentScroll < lastScroll && header.classList.contains('scroll-down')) {
            header.classList.remove('scroll-down');
            header.classList.add('scroll-up');
        }
        lastScroll = currentScroll;
    });
}

// Initialize everything when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    initThemeGrid();
    initPerformanceOptimizations();
    initNavigation();
});

// Register service worker for offline functionality
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch(err => {
            console.error('ServiceWorker registration failed:', err);
        });
    });
}
