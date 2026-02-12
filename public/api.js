// API Client for Acorn Finance
const API = {
    baseUrl: CONFIG.apiUrl,

    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        if (config.body && typeof config.body === 'object') {
            config.body = JSON.stringify(config.body);
        }

        try {
            const response = await fetch(url, config);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || `HTTP ${response.status}`);
            }
            
            return data;
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    },

    // Authentication
    async signup(username, email, password) {
        return this.request('/auth/signup', {
            method: 'POST',
            body: { username, email, password }
        });
    },

    async login(email, password) {
        return this.request('/auth/login', {
            method: 'POST',
            body: { email, password }
        });
    },

    // Webhooks
    async getWebhooks() {
        return this.request('/webhooks');
    },

    async addWebhook(name, url, types, minConfidence) {
        return this.request('/webhooks', {
            method: 'POST',
            body: { name, url, types, minConfidence }
        });
    },

    async updateWebhook(id, updates) {
        return this.request(`/webhooks/${id}`, {
            method: 'PUT',
            body: updates
        });
    },

    async deleteWebhook(id) {
        return this.request(`/webhooks/${id}`, {
            method: 'DELETE'
        });
    },

    async testWebhook(id) {
        return this.request(`/webhooks/${id}/test`, {
            method: 'POST'
        });
    },

    // Signals
    async getSignals() {
        return this.request('/signals');
    },

    async createSignal(signal) {
        return this.request('/signals', {
            method: 'POST',
            body: signal
        });
    },

    // Users
    async getUsers() {
        return this.request('/users');
    },

    async updateUser(id, updates) {
        return this.request(`/users/${id}`, {
            method: 'PUT',
            body: updates
        });
    },

    // Portfolio
    async getPortfolio(userId) {
        return this.request(`/portfolios/${userId}`);
    },

    async addHolding(userId, symbol, quantity, price) {
        return this.request(`/portfolios/${userId}/holdings`, {
            method: 'POST',
            body: { symbol, quantity, price }
        });
    },

    // Watchlist
    async getWatchlist(userId) {
        return this.request(`/watchlists/${userId}`);
    },

    async addToWatchlist(userId, symbol) {
        return this.request(`/watchlists/${userId}/symbols`, {
            method: 'POST',
            body: { symbol }
        });
    },

    async removeFromWatchlist(userId, symbol) {
        return this.request(`/watchlists/${userId}/symbols/${symbol}`, {
            method: 'DELETE'
        });
    }
};
