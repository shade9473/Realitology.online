// Philosophy Interactive Features
document.addEventListener('DOMContentLoaded', () => {
    initializePhilosophyQuotes();
    initializeEthicalDilemma();
    initializeScrollTracking();
    initializeThoughtExperiments();
});

// Rotating Philosophy Quotes
function initializePhilosophyQuotes() {
    const quotes = document.querySelectorAll('.philosophy-quote');
    let currentQuote = 0;

    function showQuote(index) {
        quotes.forEach((quote, i) => {
            quote.style.opacity = i === index ? '1' : '0';
            quote.style.transform = i === index ? 'translateX(0)' : 'translateX(20px)';
        });
    }

    function rotateQuotes() {
        currentQuote = (currentQuote + 1) % quotes.length;
        showQuote(currentQuote);
        
        // Track quote views
        window.plausible?.('Quote View', {
            props: {
                quoteIndex: currentQuote,
                quoteText: quotes[currentQuote].textContent
            }
        });
    }

    // Initialize quotes
    quotes.forEach((quote, index) => {
        quote.style.transition = 'all 0.5s ease-in-out';
        quote.style.position = 'absolute';
        if (index !== 0) {
            quote.style.opacity = '0';
            quote.style.transform = 'translateX(20px)';
        }
    });

    // Rotate quotes every 10 seconds
    setInterval(rotateQuotes, 10000);

    // Allow manual navigation
    quotes.forEach((quote, index) => {
        quote.addEventListener('click', () => {
            currentQuote = index;
            showQuote(currentQuote);
        });
    });
}

// Interactive Ethical Dilemma
function initializeEthicalDilemma() {
    const dilemma = document.querySelector('.ethical-dilemma');
    const options = document.querySelectorAll('.dilemma-options .option');

    options.forEach(option => {
        option.addEventListener('click', () => {
            // Toggle active state
            options.forEach(opt => opt.classList.remove('active'));
            option.classList.add('active');

            // Track user choice
            window.plausible?.('Ethical Choice', {
                props: {
                    choice: option.querySelector('h4').textContent,
                    section: 'trolley-problem'
                }
            });

            // Show explanation
            const explanation = document.createElement('div');
            explanation.className = 'option-explanation';
            explanation.innerHTML = getExplanation(option.querySelector('h4').textContent);
            
            // Remove any existing explanations
            const existingExplanation = dilemma.querySelector('.option-explanation');
            if (existingExplanation) {
                existingExplanation.remove();
            }
            
            dilemma.appendChild(explanation);
        });
    });
}

function getExplanation(choice) {
    const explanations = {
        'Utilitarian Approach': `
            <h4>Utilitarian Perspective</h4>
            <p>This approach focuses on maximizing overall well-being and minimizing harm across all affected parties. 
            In the context of AI decision-making, this might mean:</p>
            <ul>
                <li>Prioritizing actions that save the most lives</li>
                <li>Considering long-term consequences</li>
                <li>Weighing quantifiable outcomes</li>
            </ul>
            <p>However, this approach raises questions about measuring and comparing different types of harm.</p>
        `,
        'Deontological Approach': `
            <h4>Deontological Perspective</h4>
            <p>This approach emphasizes moral rules and individual rights, regardless of consequences. 
            For AI systems, this could mean:</p>
            <ul>
                <li>Never using individuals as mere means</li>
                <li>Respecting autonomy and consent</li>
                <li>Following predetermined ethical rules</li>
            </ul>
            <p>This approach provides clear guidelines but may struggle with conflicting rules.</p>
        `
    };
    return explanations[choice] || '';
}

// Scroll Tracking
function initializeScrollTracking() {
    const sections = document.querySelectorAll('section[data-track-section]');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                window.plausible?.('Section View', {
                    props: {
                        section: entry.target.getAttribute('data-track-section'),
                        page: 'philosophy'
                    }
                });
            }
        });
    }, {
        threshold: 0.5
    });

    sections.forEach(section => observer.observe(section));
}

// Thought Experiments
function initializeThoughtExperiments() {
    initializeChineseRoom();
    initializePhilosophicalZombie();
    initializeExperienceMachine();
}

// Chinese Room Experiment
function initializeChineseRoom() {
    const experiment = document.querySelector('[data-experiment="chinese-room"]');
    if (!experiment) return;

    const input = experiment.querySelector('#chinese-input');
    const processor = experiment.querySelector('.processor');
    const responseText = experiment.querySelector('.response-text');
    const responseButtons = experiment.querySelectorAll('.response-options button');

    // Simulated responses
    const responses = {
        '你好': '很高兴见到你',
        '早上好': '早安',
        '谢谢': '不客气'
    };

    input.addEventListener('input', () => {
        processor.classList.add('processing');
        setTimeout(() => {
            const response = responses[input.value] || '...',
            responseText.textContent = response;
            processor.classList.remove('processing');
        }, 1000);
    });

    responseButtons.forEach(button => {
        button.addEventListener('click', () => {
            responseButtons.forEach(btn => btn.classList.remove('selected'));
            button.classList.add('selected');

            // Track user response
            window.plausible?.('Thought Experiment Response', {
                props: {
                    experiment: 'chinese-room',
                    response: button.getAttribute('data-response')
                }
            });

            // Dispatch event for visualization
            document.dispatchEvent(new CustomEvent('experimentResponse', {
                detail: {
                    experiment: 'chinese-room',
                    response: button.getAttribute('data-response')
                }
            }));
        });
    });
}

// Philosophical Zombie Experiment
function initializePhilosophicalZombie() {
    const experiment = document.querySelector('[data-experiment="philosophical-zombie"]');
    if (!experiment) return;

    const triggerButton = experiment.querySelector('.trigger-behavior');
    const behaviorDisplay = experiment.querySelector('.behavior-display');
    const entities = experiment.querySelectorAll('.entity');
    const responseButtons = experiment.querySelectorAll('.response-options button');

    const behaviors = [
        'Solving complex problems',
        'Expressing emotions',
        'Creating art',
        'Making decisions',
        'Learning from experience'
    ];

    triggerButton.addEventListener('click', () => {
        const behavior = behaviors[Math.floor(Math.random() * behaviors.length)];
        behaviorDisplay.textContent = behavior;

        entities.forEach(entity => {
            entity.classList.add('acting');
            setTimeout(() => entity.classList.remove('acting'), 2000);
        });

        // Track interaction
        window.plausible?.('Thought Experiment Interaction', {
            props: {
                experiment: 'philosophical-zombie',
                behavior: behavior
            }
        });
    });

    responseButtons.forEach(button => {
        button.addEventListener('click', () => {
            responseButtons.forEach(btn => btn.classList.remove('selected'));
            button.classList.add('selected');

            // Track user response
            window.plausible?.('Thought Experiment Response', {
                props: {
                    experiment: 'philosophical-zombie',
                    response: button.getAttribute('data-response')
                }
            });

            // Dispatch event for visualization
            document.dispatchEvent(new CustomEvent('experimentResponse', {
                detail: {
                    experiment: 'philosophical-zombie',
                    response: button.getAttribute('data-response')
                }
            }));
        });
    });
}

// Experience Machine Experiment
function initializeExperienceMachine() {
    const experiment = document.querySelector('[data-experiment="experience-machine"]');
    if (!experiment) return;

    const switchButton = experiment.querySelector('.switch-button');
    const realityList = experiment.querySelector('.experience-list.real');
    const simulatedList = experiment.querySelector('.experience-list.simulated');
    const responseButtons = experiment.querySelectorAll('.response-options button');

    const realExperiences = [
        'Authentic relationships',
        'Personal growth through challenges',
        'Unexpected discoveries',
        'Natural beauty',
        'Genuine achievements'
    ];

    const simulatedExperiences = [
        'Perfect relationships',
        'Instant mastery',
        'Endless pleasure',
        'Ideal scenarios',
        'Unlimited success'
    ];

    // Populate experience lists
    function populateList(list, experiences) {
        list.innerHTML = experiences.map(exp => `<li>${exp}</li>`).join('');
    }

    populateList(realityList, realExperiences);
    populateList(simulatedList, simulatedExperiences);

    let isSimulated = false;
    switchButton.addEventListener('click', () => {
        isSimulated = !isSimulated;
        experiment.classList.toggle('simulated', isSimulated);
        switchButton.textContent = isSimulated ? 'Return to Reality' : 'Switch Reality';

        // Track interaction
        window.plausible?.('Thought Experiment Interaction', {
            props: {
                experiment: 'experience-machine',
                state: isSimulated ? 'simulation' : 'reality'
            }
        });
    });

    responseButtons.forEach(button => {
        button.addEventListener('click', () => {
            responseButtons.forEach(btn => btn.classList.remove('selected'));
            button.classList.add('selected');

            // Track user response
            window.plausible?.('Thought Experiment Response', {
                props: {
                    experiment: 'experience-machine',
                    response: button.getAttribute('data-response')
                }
            });

            // Dispatch event for visualization
            document.dispatchEvent(new CustomEvent('experimentResponse', {
                detail: {
                    experiment: 'experience-machine',
                    response: button.getAttribute('data-response')
                }
            }));
        });
    });
}

// Export functions for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initializePhilosophyQuotes,
        initializeEthicalDilemma,
        initializeScrollTracking,
        initializeThoughtExperiments
    };
}
