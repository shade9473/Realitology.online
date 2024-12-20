// Comments System
class CommentsSystem {
    constructor() {
        this.commentsContainer = document.querySelector('.comments-section');
        if (!this.commentsContainer) return;

        this.currentUser = null;
        this.comments = [];
        this.init();
    }

    async init() {
        this.setupCommentForm();
        this.setupSorting();
        this.setupFiltering();
        await this.loadComments();
        this.setupAnalytics();
    }

    setupCommentForm() {
        const form = this.commentsContainer.querySelector('.comment-form');
        if (!form) return;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const content = form.querySelector('textarea').value.trim();
            if (!content) return;

            if (!this.currentUser) {
                await this.promptLogin();
                return;
            }

            await this.submitComment(content);
            form.querySelector('textarea').value = '';
        });

        // Character counter
        const textarea = form.querySelector('textarea');
        const counter = form.querySelector('.character-counter');
        if (textarea && counter) {
            textarea.addEventListener('input', () => {
                const remaining = 1000 - textarea.value.length;
                counter.textContent = `${remaining} characters remaining`;
                counter.classList.toggle('warning', remaining < 100);
            });
        }
    }

    setupSorting() {
        const sortSelect = this.commentsContainer.querySelector('.comment-sort');
        if (!sortSelect) return;

        sortSelect.addEventListener('change', () => {
            const sortBy = sortSelect.value;
            this.sortComments(sortBy);
            
            if (window.siteAnalytics) {
                window.siteAnalytics.trackEvent('Comment Sort', { method: sortBy });
            }
        });
    }

    setupFiltering() {
        const filterButtons = this.commentsContainer.querySelectorAll('.comment-filter');
        filterButtons.forEach(button => {
            button.addEventListener('click', () => {
                filterButtons.forEach(b => b.classList.remove('active'));
                button.classList.add('active');
                this.filterComments(button.dataset.filter);

                if (window.siteAnalytics) {
                    window.siteAnalytics.trackEvent('Comment Filter', { 
                        filter: button.dataset.filter 
                    });
                }
            });
        });
    }

    async loadComments() {
        // Simulate loading comments from an API
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Example comments data
        this.comments = [
            {
                id: 1,
                author: 'Alice Chen',
                content: 'Fascinating perspective on machine consciousness. The comparison between neural networks and human consciousness raises interesting questions about the nature of experience.',
                timestamp: new Date('2024-12-19T18:30:00'),
                likes: 5,
                replies: []
            },
            {
                id: 2,
                author: 'David Kumar',
                content: 'The philosophical zombie argument is particularly relevant here. How can we truly know if an AI system has genuine experiences versus simply simulating them?',
                timestamp: new Date('2024-12-19T17:45:00'),
                likes: 3,
                replies: []
            }
        ];

        this.renderComments();
    }

    async submitComment(content) {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 300));

        const newComment = {
            id: this.comments.length + 1,
            author: this.currentUser.name,
            content,
            timestamp: new Date(),
            likes: 0,
            replies: []
        };

        this.comments.unshift(newComment);
        this.renderComments();

        if (window.siteAnalytics) {
            window.siteAnalytics.trackEvent('Comment Submit', {
                wordCount: content.split(' ').length
            });
        }
    }

    sortComments(method) {
        switch (method) {
            case 'newest':
                this.comments.sort((a, b) => b.timestamp - a.timestamp);
                break;
            case 'oldest':
                this.comments.sort((a, b) => a.timestamp - b.timestamp);
                break;
            case 'popular':
                this.comments.sort((a, b) => b.likes - a.likes);
                break;
        }
        this.renderComments();
    }

    filterComments(filter) {
        const commentsList = this.commentsContainer.querySelector('.comments-list');
        const comments = commentsList.querySelectorAll('.comment');

        comments.forEach(comment => {
            switch (filter) {
                case 'all':
                    comment.style.display = '';
                    break;
                case 'discussions':
                    comment.style.display = comment.querySelector('.replies') ? '' : 'none';
                    break;
                case 'unanswered':
                    comment.style.display = comment.querySelector('.replies') ? 'none' : '';
                    break;
            }
        });
    }

    renderComments() {
        const commentsList = this.commentsContainer.querySelector('.comments-list');
        if (!commentsList) return;

        commentsList.innerHTML = this.comments.map(comment => this.createCommentHTML(comment)).join('');
        this.setupCommentInteractions();
    }

    createCommentHTML(comment) {
        const timeAgo = this.getTimeAgo(comment.timestamp);
        return `
            <div class="comment" data-comment-id="${comment.id}">
                <div class="comment-header">
                    <span class="comment-author">${this.escapeHTML(comment.author)}</span>
                    <span class="comment-time">${timeAgo}</span>
                </div>
                <div class="comment-content">${this.escapeHTML(comment.content)}</div>
                <div class="comment-actions">
                    <button class="like-button" aria-label="Like comment">
                        <svg viewBox="0 0 24 24" width="16" height="16">
                            <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" fill="none" stroke="currentColor" stroke-width="2"/>
                        </svg>
                        <span>${comment.likes}</span>
                    </button>
                    <button class="reply-button">Reply</button>
                </div>
                <div class="replies">
                    ${comment.replies.map(reply => this.createCommentHTML(reply)).join('')}
                </div>
            </div>
        `;
    }

    setupCommentInteractions() {
        // Like buttons
        this.commentsContainer.querySelectorAll('.like-button').forEach(button => {
            button.addEventListener('click', () => {
                const commentId = button.closest('.comment').dataset.commentId;
                this.likeComment(commentId);
            });
        });

        // Reply buttons
        this.commentsContainer.querySelectorAll('.reply-button').forEach(button => {
            button.addEventListener('click', () => {
                const commentId = button.closest('.comment').dataset.commentId;
                this.showReplyForm(commentId);
            });
        });
    }

    async likeComment(commentId) {
        if (!this.currentUser) {
            await this.promptLogin();
            return;
        }

        const comment = this.comments.find(c => c.id === parseInt(commentId));
        if (comment) {
            comment.likes++;
            this.renderComments();

            if (window.siteAnalytics) {
                window.siteAnalytics.trackEvent('Comment Like', { commentId });
            }
        }
    }

    showReplyForm(commentId) {
        const comment = this.commentsContainer.querySelector(`[data-comment-id="${commentId}"]`);
        if (!comment) return;

        const existingForm = comment.querySelector('.reply-form');
        if (existingForm) {
            existingForm.remove();
            return;
        }

        const form = document.createElement('form');
        form.className = 'reply-form';
        form.innerHTML = `
            <textarea placeholder="Write a reply..." maxlength="500"></textarea>
            <div class="form-actions">
                <button type="button" class="cancel-button">Cancel</button>
                <button type="submit" class="submit-button">Reply</button>
            </div>
        `;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const content = form.querySelector('textarea').value.trim();
            if (!content) return;

            if (!this.currentUser) {
                await this.promptLogin();
                return;
            }

            await this.submitReply(commentId, content);
            form.remove();
        });

        form.querySelector('.cancel-button').addEventListener('click', () => {
            form.remove();
        });

        comment.querySelector('.replies').insertAdjacentElement('beforebegin', form);
        form.querySelector('textarea').focus();
    }

    async submitReply(commentId, content) {
        const comment = this.comments.find(c => c.id === parseInt(commentId));
        if (!comment) return;

        const reply = {
            id: Date.now(),
            author: this.currentUser.name,
            content,
            timestamp: new Date(),
            likes: 0,
            replies: []
        };

        comment.replies.push(reply);
        this.renderComments();

        if (window.siteAnalytics) {
            window.siteAnalytics.trackEvent('Comment Reply', {
                parentId: commentId,
                wordCount: content.split(' ').length
            });
        }
    }

    async promptLogin() {
        // Simulate login modal
        const name = prompt('Please enter your name to continue:');
        if (name) {
            this.currentUser = { name };
            return true;
        }
        return false;
    }

    getTimeAgo(date) {
        const seconds = Math.floor((new Date() - date) / 1000);
        
        const intervals = {
            year: 31536000,
            month: 2592000,
            week: 604800,
            day: 86400,
            hour: 3600,
            minute: 60
        };

        for (const [unit, secondsInUnit] of Object.entries(intervals)) {
            const interval = Math.floor(seconds / secondsInUnit);
            if (interval >= 1) {
                return `${interval} ${unit}${interval === 1 ? '' : 's'} ago`;
            }
        }

        return 'Just now';
    }

    escapeHTML(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    setupAnalytics() {
        // Track comment section visibility
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && window.siteAnalytics) {
                    window.siteAnalytics.trackEvent('Comment Section View', {
                        commentCount: this.comments.length
                    });
                }
            });
        });

        observer.observe(this.commentsContainer);
    }
}

// Initialize comments system when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new CommentsSystem();
});
