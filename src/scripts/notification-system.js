// Notification System Module
class NotificationSystem {
    constructor() {
        this.notifications = [];
        this.maxNotifications = 5;
        this.defaultDuration = 5000;
        this.container = null;
        this.sound = new Audio('/assets/sounds/notification.mp3');
        this.hasPermission = false;

        // Initialize notification container
        this.createNotificationContainer();
        
        // Request notification permission
        this.requestPermission();

        // Initialize service worker for push notifications
        this.initializeServiceWorker();
    }

    // Create notification container
    createNotificationContainer() {
        this.container = document.createElement('div');
        this.container.className = 'notification-container';
        document.body.appendChild(this.container);
    }

    // Request notification permission
    async requestPermission() {
        if ('Notification' in window) {
            try {
                const permission = await Notification.requestPermission();
                this.hasPermission = permission === 'granted';
                
                // Track permission status
                window.plausible?.('Notification Permission', {
                    props: {
                        status: permission
                    }
                });
            } catch (error) {
                console.error('Error requesting notification permission:', error);
            }
        }
    }

    // Initialize service worker
    async initializeServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('/service-worker.js');
                const subscription = await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: this.urlBase64ToUint8Array(process.env.VAPID_PUBLIC_KEY)
                });

                // Send subscription to server
                await fetch('/api/notifications/subscribe', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(subscription)
                });
            } catch (error) {
                console.error('Error initializing service worker:', error);
            }
        }
    }

    // Show notification
    show({
        title,
        message,
        type = 'info',
        duration = this.defaultDuration,
        actions = [],
        data = {},
        silent = false
    }) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.setAttribute('role', 'alert');
        notification.innerHTML = this.createNotificationContent(title, message, actions);

        // Add to container
        this.container.appendChild(notification);
        this.notifications.push(notification);

        // Manage maximum notifications
        if (this.notifications.length > this.maxNotifications) {
            this.dismiss(this.notifications[0]);
        }

        // Show browser notification if permitted
        if (this.hasPermission && !document.hasFocus()) {
            this.showBrowserNotification(title, message, data);
        }

        // Play sound if not silent
        if (!silent) {
            this.playNotificationSound();
        }

        // Track notification
        window.plausible?.('Notification Shown', {
            props: {
                type,
                title,
                hasActions: actions.length > 0
            }
        });

        // Add event listeners
        this.addNotificationListeners(notification, actions);

        // Auto dismiss after duration
        if (duration > 0) {
            setTimeout(() => this.dismiss(notification), duration);
        }

        return notification;
    }

    // Create notification content
    createNotificationContent(title, message, actions) {
        return `
            <div class="notification-content">
                <div class="notification-header">
                    <h6>${title}</h6>
                    <button class="notification-close" aria-label="Close notification">
                        <svg viewBox="0 0 24 24">
                            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                        </svg>
                    </button>
                </div>
                <p>${message}</p>
                ${actions.length > 0 ? this.createActionButtons(actions) : ''}
            </div>
        `;
    }

    // Create action buttons
    createActionButtons(actions) {
        return `
            <div class="notification-actions">
                ${actions.map(action => `
                    <button class="notification-action" data-action="${action.id}">
                        ${action.label}
                    </button>
                `).join('')}
            </div>
        `;
    }

    // Add notification listeners
    addNotificationListeners(notification, actions) {
        // Close button
        const closeButton = notification.querySelector('.notification-close');
        closeButton.addEventListener('click', () => this.dismiss(notification));

        // Action buttons
        actions.forEach(action => {
            const button = notification.querySelector(`[data-action="${action.id}"]`);
            button.addEventListener('click', () => {
                action.handler();
                this.dismiss(notification);

                // Track action
                window.plausible?.('Notification Action Clicked', {
                    props: {
                        actionId: action.id
                    }
                });
            });
        });
    }

    // Show browser notification
    showBrowserNotification(title, message, data) {
        if (this.hasPermission) {
            const options = {
                body: message,
                icon: '/assets/images/logo.png',
                badge: '/assets/images/badge.png',
                data
            };

            navigator.serviceWorker.ready.then(registration => {
                registration.showNotification(title, options);
            });
        }
    }

    // Play notification sound
    playNotificationSound() {
        try {
            this.sound.currentTime = 0;
            this.sound.play();
        } catch (error) {
            console.error('Error playing notification sound:', error);
        }
    }

    // Dismiss notification
    dismiss(notification) {
        notification.classList.add('notification-dismissing');
        
        notification.addEventListener('animationend', () => {
            this.container.removeChild(notification);
            this.notifications = this.notifications.filter(n => n !== notification);
        });
    }

    // Dismiss all notifications
    dismissAll() {
        this.notifications.forEach(notification => this.dismiss(notification));
    }

    // Convert VAPID key to Uint8Array
    urlBase64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/\-/g, '+')
            .replace(/_/g, '/');

        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);

        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NotificationSystem;
}
