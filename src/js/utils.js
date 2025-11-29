// Utility functions
class Utils {
    static formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    static generateId(prefix) {
        return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    static calculateWinRate(wins, totalGames) {
        return totalGames > 0 ? ((wins / totalGames) * 100).toFixed(1) : '0.0';
    }

    static async uploadImage(file) {
        // This would typically upload to Netlify's blob storage or similar
        // For now, return a placeholder
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.readAsDataURL(file);
        });
    }

    static showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

// Local storage utilities
class Storage {
    static set(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    }

    static get(key) {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
    }

    static remove(key) {
        localStorage.removeItem(key);
    }
}