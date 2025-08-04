// ==================== ALPHATERMINAL UTILITIES ====================

class AlphaUtils {
    // Number formatting utilities
    static formatPrice(price) {
        if (price === null || price === undefined) return '$0.00';
        const num = parseFloat(price);
        
        if (num >= 1000) return `$${num.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
        if (num >= 1) return `$${num.toFixed(2)}`;
        if (num >= 0.01) return `$${num.toFixed(4)}`;
        if (num >= 0.0001) return `$${num.toFixed(6)}`;
        return `$${num.toExponential(2)}`;
    }

    static formatPercentage(value, decimals = 2) {
        if (value === null || value === undefined) return '0.00%';
        const num = parseFloat(value);
        const sign = num >= 0 ? '+' : '';
        return `${sign}${num.toFixed(decimals)}%`;
    }

    static formatMarketCap(marketCap) {
        if (marketCap === null || marketCap === undefined) return '$0';
        const num = parseFloat(marketCap);
        
        if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
        if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
        if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
        if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`;
        return `$${num.toFixed(0)}`;
    }

    static formatVolume(volume) {
        return this.formatMarketCap(volume);
    }

    // Time and date utilities
    static formatTimestamp(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('en-US', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    }

    static formatDate(date) {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    static getTimeAgo(timestamp) {
        const now = Date.now();
        const diff = now - new Date(timestamp).getTime();
        
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        
        if (days > 0) return `${days}d ago`;
        if (hours > 0) return `${hours}h ago`;
        if (minutes > 0) return `${minutes}m ago`;
        return `${seconds}s ago`;
    }

    // Color utilities for financial data
    static getPriceChangeColor(change) {
        if (change > 0) return 'var(--accent-green)';
        if (change < 0) return 'var(--accent-red)';
        return 'var(--text-secondary)';
    }

    static getPriceChangeClass(change) {
        if (change > 0) return 'positive';
        if (change < 0) return 'negative';
        return 'neutral';
    }

    // Animation utilities
    static fadeIn(element, duration = 300) {
        element.style.opacity = '0';
        element.style.transition = `opacity ${duration}ms ease`;
        
        setTimeout(() => {
            element.style.opacity = '1';
        }, 10);
    }

    static slideIn(element, direction = 'up', duration = 300) {
        const transforms = {
            up: 'translateY(20px)',
            down: 'translateY(-20px)',
            left: 'translateX(20px)',
            right: 'translateX(-20px)'
        };
        
        element.style.transform = transforms[direction];
        element.style.opacity = '0';
        element.style.transition = `all ${duration}ms ease`;
        
        setTimeout(() => {
            element.style.transform = 'translateY(0)';
            element.style.opacity = '1';
        }, 10);
    }

    static pulse(element, duration = 1000) {
        element.style.animation = `pulse ${duration}ms ease-in-out`;
        
        setTimeout(() => {
            element.style.animation = '';
        }, duration);
    }

    // Data validation utilities
    static isValidPrice(price) {
        return price !== null && price !== undefined && !isNaN(price) && price >= 0;
    }

    static isValidPercentage(percentage) {
        return percentage !== null && percentage !== undefined && !isNaN(percentage);
    }

    static sanitizeString(str) {
        if (typeof str !== 'string') return '';
        return str.replace(/[<>\"']/g, '');
    }

    // API utilities
    static async makeRequest(url, options = {}) {
        const defaultOptions = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        };

        const finalOptions = { ...defaultOptions, ...options };

        try {
            const response = await fetch(url, finalOptions);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }

    // Local storage utilities
    static setLocalData(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch (error) {
            console.error('Failed to save to localStorage:', error);
        }
    }

    static getLocalData(key, defaultValue = null) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : defaultValue;
        } catch (error) {
            console.error('Failed to read from localStorage:', error);
            return defaultValue;
        }
    }

    static removeLocalData(key) {
        try {
            localStorage.removeItem(key);
        } catch (error) {
            console.error('Failed to remove from localStorage:', error);
        }
    }

    // Chart utilities
    static generateChartData(prices, timestamps) {
        if (!prices || !timestamps || prices.length !== timestamps.length) {
            return [];
        }

        return prices.map((price, index) => ({
            time: timestamps[index],
            value: price
        }));
    }

    static generateCandlestickData(ohlcv) {
        if (!ohlcv || !Array.isArray(ohlcv)) return [];

        return ohlcv.map(candle => ({
            time: candle.timestamp || candle.time,
            open: candle.open,
            high: candle.high,
            low: candle.low,
            close: candle.close
        }));
    }

    // Theme utilities
    static setTheme(theme) {
        document.body.className = `${theme}-theme`;
        this.setLocalData('alpha-terminal-theme', theme);
    }

    static getTheme() {
        return this.getLocalData('alpha-terminal-theme', 'dark');
    }

    // Notification utilities
    static showNotification(message, type = 'info', duration = 5000) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // Style the notification
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '12px 20px',
            borderRadius: '4px',
            color: 'white',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.875rem',
            zIndex: '10000',
            opacity: '0',
            transform: 'translateX(100%)',
            transition: 'all 0.3s ease'
        });

        // Set background color based on type
        const colors = {
            info: 'var(--accent-blue)',
            success: 'var(--accent-green)',
            warning: 'var(--accent-yellow)',
            error: 'var(--accent-red)'
        };
        notification.style.backgroundColor = colors[type] || colors.info;

        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(0)';
        }, 100);

        // Auto remove
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, duration);

        return notification;
    }

    // Performance utilities
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    static throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    // Crypto-specific utilities
    static getCryptoIcon(symbol) {
        const iconBaseUrl = 'https://cryptologos.cc/logos/';
        const symbolLower = symbol.toLowerCase();
        return `${iconBaseUrl}${symbolLower}-${symbolLower}-logo.png`;
    }

    static formatSupply(supply, maxSupply) {
        if (!supply) return 'N/A';
        
        const formatted = this.formatMarketCap(supply).replace('$', '');
        
        if (maxSupply) {
            const percentage = (supply / maxSupply * 100).toFixed(1);
            return `${formatted} (${percentage}%)`;
        }
        
        return formatted;
    }

    static calculateMarketCapRank(marketCap, allMarketCaps) {
        if (!marketCap || !Array.isArray(allMarketCaps)) return 'N/A';
        
        const sorted = allMarketCaps.sort((a, b) => b - a);
        const rank = sorted.indexOf(marketCap) + 1;
        
        return rank > 0 ? `#${rank}` : 'N/A';
    }

    // Security utilities
    static sanitizeHtml(str) {
        const temp = document.createElement('div');
        temp.textContent = str;
        return temp.innerHTML;
    }

    static isValidUrl(url) {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }

    // Error handling utilities
    static handleError(error, context = 'Unknown') {
        console.error(`[${context}] Error:`, error);
        
        const message = error.message || 'An unexpected error occurred';
        this.showNotification(`Error in ${context}: ${message}`, 'error');
        
        // Log to analytics service if available
        if (window.analytics && typeof window.analytics.track === 'function') {
            window.analytics.track('Error', {
                context,
                message,
                stack: error.stack
            });
        }
    }
}

// Export utilities globally
window.AlphaUtils = AlphaUtils;

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AlphaUtils;
}