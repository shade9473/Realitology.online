// Social Sharing Functionality
class SocialShare {
    constructor() {
        this.shareButtons = document.querySelectorAll('[data-share]');
        this.init();
    }

    init() {
        this.shareButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const type = button.dataset.share;
                const url = encodeURIComponent(window.location.href);
                const title = encodeURIComponent(document.title);
                const description = encodeURIComponent(
                    document.querySelector('meta[name="description"]')?.content || ''
                );

                this.share(type, { url, title, description });
            });
        });
    }

    share(type, { url, title, description }) {
        const shareUrls = {
            twitter: `https://twitter.com/intent/tweet?url=${url}&text=${title}`,
            facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
            linkedin: `https://www.linkedin.com/shareArticle?mini=true&url=${url}&title=${title}&summary=${description}`,
            email: `mailto:?subject=${title}&body=${description}%0A%0A${url}`
        };

        const width = 600;
        const height = 400;
        const left = (window.innerWidth - width) / 2;
        const top = (window.innerHeight - height) / 2;

        if (type === 'email') {
            window.location.href = shareUrls[type];
        } else {
            window.open(
                shareUrls[type],
                'share',
                `width=${width},height=${height},left=${left},top=${top}`
            );
        }
    }

    // Copy URL to clipboard
    static async copyToClipboard() {
        try {
            await navigator.clipboard.writeText(window.location.href);
            const tooltip = document.getElementById('copy-tooltip');
            tooltip.textContent = 'Copied!';
            setTimeout(() => {
                tooltip.textContent = 'Copy link';
            }, 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    }
}

// Initialize social sharing when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new SocialShare();
    
    // Initialize copy button
    const copyButton = document.querySelector('[data-copy]');
    if (copyButton) {
        copyButton.addEventListener('click', (e) => {
            e.preventDefault();
            SocialShare.copyToClipboard();
        });
    }
});
