// Acorn Finance - Main Application
const App = {
    currentUser: null,
    ws: null,
    signals: [],
    portfolio: null,
    watchlist: null,

    async init() {
        // Check if user is logged in
        const savedUser = localStorage.getItem('currentUser');
        if (!savedUser) {
            window.location.href = 'login.html';
            return;
        }

        this.currentUser = JSON.parse(savedUser);
        this.updateUI();
        
        // Initialize navigation
        this.initNavigation();
        
        // Initialize WebSocket
        this.initWebSocket();
        
        // Load data
        await this.loadData();
        
        // Initialize event listeners
        this.initEventListeners();
        
        // Start auto-refresh
        this.startAutoRefresh();
    },

    // Navigation
    initNavigation() {
        const navLinks = document.querySelectorAll('.nav-link');
        const sections = document.querySelectorAll('.section');

        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const target = link.getAttribute('data-section');

                navLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');

                sections.forEach(s => s.classList.remove('active'));
                document.getElementById(target).classList.add('active');
            });
        });

        // Quick action buttons
        document.getElementById('viewSignalsBtn')?.addEventListener('click', () => {
            document.querySelector('[data-section="signals"]').click();
        });

        document.getElementById('portfolioBtn')?.addEventListener('click', () => {
            document.querySelector('[data-section="portfolio"]').click();
        });

        document.getElementById('analyticsBtn')?.addEventListener('click', () => {
            document.querySelector('[data-section="analytics"]').click();
        });
    },

    // WebSocket connection
    initWebSocket() {
        try {
            this.ws = new WebSocket(CONFIG.wsUrl);
            
            this.ws.onopen = () => {
                console.log('WebSocket connected');
            };

            this.ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                if (data.type === 'new_signal') {
                    this.handleNewSignal(data.data);
                }
            };

            this.ws.onerror = (error) => {
                console.error('WebSocket error:', error);
            };

            this.ws.onclose = () => {
                console.log('WebSocket disconnected, reconnecting...');
                setTimeout(() => this.initWebSocket(), 3000);
            };
        } catch (error) {
            console.error('WebSocket initialization failed:', error);
        }
    },

    // Load all data
    async loadData() {
        try {
            await Promise.all([
                this.loadSignals(),
                this.loadPortfolio(),
                this.loadWatchlist()
            ]);
        } catch (error) {
            console.error('Error loading data:', error);
        }
    },

    // Load signals
    async loadSignals() {
        try {
            this.signals = await API.getSignals();
            this.updateSignals();
            this.updateRecentSignals();
        } catch (error) {
            console.error('Error loading signals:', error);
        }
    },

    // Load portfolio
    async loadPortfolio() {
        try {
            this.portfolio = await API.getPortfolio(this.currentUser.id);
            this.updatePortfolio();
        } catch (error) {
            console.error('Error loading portfolio:', error);
        }
    },

    // Load watchlist
    async loadWatchlist() {
        try {
            this.watchlist = await API.getWatchlist(this.currentUser.id);
            this.updateWatchlist();
        } catch (error) {
            console.error('Error loading watchlist:', error);
        }
    },

    // Update UI
    updateUI() {
        if (this.currentUser) {
            const userInfo = document.getElementById('userInfo');
            if (userInfo) {
                userInfo.textContent = this.currentUser.username;
            }

            // Show/hide admin button
            const adminBtn = document.getElementById('adminBtn');
            if (adminBtn) {
                adminBtn.style.display = this.currentUser.role === 'admin' ? '' : 'none';
            }
        }
    },

    // Update signals display
    updateSignals(filter = 'all') {
        const grid = document.getElementById('signalsGrid');
        if (!grid) return;

        let filtered = this.signals;
        if (filter !== 'all') {
            filtered = this.signals.filter(s => s.action === filter);
        }

        if (filtered.length === 0) {
            grid.innerHTML = '<div class="empty-state">No signals found</div>';
            return;
        }

        grid.innerHTML = filtered.slice(0, 20).map(signal => `
            <div class="signal-card">
                <div class="signal-header">
                    <span class="signal-symbol">${signal.symbol}</span>
                    <span class="signal-badge ${signal.action}">${signal.action.toUpperCase()}</span>
                </div>
                <div class="signal-body">
                    <div class="signal-price">$${parseFloat(signal.price).toFixed(2)}</div>
                    <div class="signal-change ${signal.changePercent >= 0 ? 'positive' : 'negative'}">
                        ${signal.changePercent >= 0 ? '+' : ''}${parseFloat(signal.changePercent).toFixed(2)}%
                    </div>
                    <div class="signal-confidence">
                        <span>Confidence: ${signal.confidence}%</span>
                        <div class="confidence-bar">
                            <div class="confidence-fill" style="width: ${signal.confidence}%"></div>
                        </div>
                    </div>
                    <div class="signal-reasoning">${signal.reasoning}</div>
                </div>
            </div>
        `).join('');
    },

    // Update recent signals
    updateRecentSignals() {
        const list = document.getElementById('recentSignals');
        if (!list) return;

        const recent = this.signals.slice(0, 5);
        if (recent.length === 0) {
            list.innerHTML = '<div class="empty-state">No signals yet</div>';
            return;
        }

        list.innerHTML = recent.map(signal => `
            <div class="signal-item-small">
                <div class="signal-item-header">
                    <span class="signal-symbol">${signal.symbol}</span>
                    <span class="signal-badge ${signal.action}">${signal.action}</span>
                </div>
                <div class="signal-item-details">
                    <span>$${parseFloat(signal.price).toFixed(2)}</span>
                    <span class="${signal.changePercent >= 0 ? 'positive' : 'negative'}">
                        ${signal.changePercent >= 0 ? '+' : ''}${parseFloat(signal.changePercent).toFixed(2)}%
                    </span>
                    <span>${signal.confidence}%</span>
                </div>
            </div>
        `).join('');
    },

    // Update portfolio
    updatePortfolio() {
        if (!this.portfolio) return;

        const cash = this.portfolio.cash || 10000;
        const holdings = this.portfolio.holdings || [];
        
        let totalValue = cash;
        let invested = 0;

        holdings.forEach(holding => {
            const currentPrice = this.getCurrentPrice(holding.symbol);
            const value = currentPrice * holding.quantity;
            totalValue += value;
            invested += holding.avgPrice * holding.quantity;
        });

        // Update summary
        document.getElementById('portfolioTotal')?.textContent = `$${totalValue.toFixed(2)}`;
        document.getElementById('portfolioCash')?.textContent = `$${cash.toFixed(2)}`;
        document.getElementById('portfolioInvested')?.textContent = `$${invested.toFixed(2)}`;

        // Update dashboard stats
        document.getElementById('totalValue')?.textContent = `$${totalValue.toFixed(2)}`;
        document.getElementById('cashBalance')?.textContent = `$${cash.toFixed(2)}`;

        // Update holdings table
        const tbody = document.getElementById('holdingsTableBody');
        if (tbody) {
            if (holdings.length === 0) {
                tbody.innerHTML = '<tr><td colspan="7" class="empty-state">No holdings yet</td></tr>';
            } else {
                tbody.innerHTML = holdings.map(holding => {
                    const currentPrice = this.getCurrentPrice(holding.symbol);
                    const value = currentPrice * holding.quantity;
                    const cost = holding.avgPrice * holding.quantity;
                    const gainLoss = value - cost;
                    const gainLossPercent = (gainLoss / cost) * 100;

                    return `
                        <tr>
                            <td><strong>${holding.symbol}</strong></td>
                            <td>${holding.quantity}</td>
                            <td>$${holding.avgPrice.toFixed(2)}</td>
                            <td>$${currentPrice.toFixed(2)}</td>
                            <td>$${value.toFixed(2)}</td>
                            <td class="${gainLoss >= 0 ? 'positive' : 'negative'}">
                                ${gainLoss >= 0 ? '+' : ''}$${gainLoss.toFixed(2)} (${gainLossPercent >= 0 ? '+' : ''}${gainLossPercent.toFixed(2)}%)
                            </td>
                            <td>
                                <button class="btn-small" onclick="App.removeHolding('${holding.symbol}')">Remove</button>
                            </td>
                        </tr>
                    `;
                }).join('');
            }
        }
    },

    // Update watchlist
    updateWatchlist() {
        if (!this.watchlist) return;

        const symbols = this.watchlist.symbols || [];
        document.getElementById('watchlistCount')?.textContent = symbols.length;

        const grid = document.getElementById('watchlistGrid');
        if (!grid) return;

        if (symbols.length === 0) {
            grid.innerHTML = '<div class="empty-state">Your watchlist is empty</div>';
            return;
        }

        grid.innerHTML = symbols.map(symbol => {
            const price = this.getCurrentPrice(symbol);
            return `
                <div class="watchlist-item">
                    <div class="watchlist-header">
                        <span class="watchlist-symbol">${symbol}</span>
                        <button class="btn-remove" onclick="App.removeFromWatchlist('${symbol}')">&times;</button>
                    </div>
                    <div class="watchlist-price">$${price.toFixed(2)}</div>
                </div>
            `;
        }).join('');
    },

    // Get current price (mock for now)
    getCurrentPrice(symbol) {
        // In production, this would fetch real prices
        const basePrice = 50 + (symbol.charCodeAt(0) * 10);
        return basePrice + (Math.random() * 20 - 10);
    },

    // Handle new signal from WebSocket
    handleNewSignal(signal) {
        this.signals.unshift(signal);
        if (this.signals.length > 1000) {
            this.signals = this.signals.slice(0, 1000);
        }
        this.updateSignals();
        this.updateRecentSignals();
        this.updateDashboard();
    },

    // Update dashboard
    updateDashboard() {
        document.getElementById('signalsCount')?.textContent = this.signals.length;
    },

    // Event listeners
    initEventListeners() {
        // Sign out
        document.getElementById('signOutBtn')?.addEventListener('click', () => {
            localStorage.removeItem('currentUser');
            window.location.href = 'login.html';
        });

        // Admin panel
        document.getElementById('adminBtn')?.addEventListener('click', () => {
            if (this.currentUser.role !== 'admin') {
                const password = prompt('Enter admin password:');
                if (password !== CONFIG.adminPassword) {
                    alert('Incorrect password');
                    return;
                }
            }
            this.openAdminPanel();
        });

        document.getElementById('closeAdmin')?.addEventListener('click', () => {
            document.getElementById('adminModal').classList.remove('active');
        });

        // Admin tabs
        document.querySelectorAll('.admin-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const tabName = tab.getAttribute('data-tab');
                
                document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                document.querySelectorAll('.admin-panel').forEach(p => p.classList.remove('active'));
                document.getElementById(`admin${tabName.charAt(0).toUpperCase() + tabName.slice(1)}`).classList.add('active');

                if (tabName === 'webhooks') this.loadAdminWebhooks();
                if (tabName === 'users') this.loadAdminUsers();
            });
        });

        // Add holding
        document.getElementById('addHoldingBtn')?.addEventListener('click', () => {
            document.getElementById('addHoldingModal').classList.add('active');
        });

        document.getElementById('closeHoldingModal')?.addEventListener('click', () => {
            document.getElementById('addHoldingModal').classList.remove('active');
        });

        document.getElementById('addHoldingForm')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const symbol = document.getElementById('holdingSymbol').value.toUpperCase();
            const quantity = parseInt(document.getElementById('holdingQuantity').value);
            const price = parseFloat(document.getElementById('holdingPrice').value);

            try {
                await API.addHolding(this.currentUser.id, symbol, quantity, price);
                await this.loadPortfolio();
                document.getElementById('addHoldingModal').classList.remove('active');
                document.getElementById('addHoldingForm').reset();
            } catch (error) {
                alert('Error adding holding: ' + error.message);
            }
        });

        // Add to watchlist
        document.getElementById('addWatchlistBtn')?.addEventListener('click', async () => {
            const input = document.getElementById('watchlistSymbolInput');
            const symbol = input.value.toUpperCase().trim();
            
            if (!symbol) {
                alert('Please enter a symbol');
                return;
            }

            try {
                await API.addToWatchlist(this.currentUser.id, symbol);
                input.value = '';
                await this.loadWatchlist();
            } catch (error) {
                alert('Error adding to watchlist: ' + error.message);
            }
        });

        // Signal filters
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const filter = btn.getAttribute('data-filter');
                this.updateSignals(filter);
            });
        });

        // Webhook management
        document.getElementById('addWebhookBtn')?.addEventListener('click', () => {
            this.showAddWebhookModal();
        });
    },

    // Admin panel functions
    async openAdminPanel() {
        document.getElementById('adminModal').classList.add('active');
        await this.loadAdminOverview();
    },

    async loadAdminOverview() {
        try {
            const users = await API.getUsers();
            const webhooks = await API.getWebhooks();
            
            document.getElementById('totalUsers')?.textContent = users.length;
            document.getElementById('activeSignals')?.textContent = this.signals.length;
            document.getElementById('webhookCount')?.textContent = webhooks.length;
        } catch (error) {
            console.error('Error loading admin overview:', error);
        }
    },

    async loadAdminWebhooks() {
        try {
            const webhooks = await API.getWebhooks();
            const list = document.getElementById('webhooksList');
            
            if (webhooks.length === 0) {
                list.innerHTML = '<div class="empty-state">No webhooks configured</div>';
                return;
            }

            list.innerHTML = webhooks.map(webhook => `
                <div class="webhook-item">
                    <div class="webhook-header">
                        <div>
                            <div class="webhook-name">${webhook.name}</div>
                            <div class="webhook-url">${webhook.url.substring(0, 60)}...</div>
                        </div>
                        <div class="webhook-actions">
                            <button class="btn-secondary" onclick="App.testWebhook('${webhook.id}')">Test</button>
                            <button class="btn-secondary" onclick="App.editWebhook('${webhook.id}')">Edit</button>
                            <button class="btn-danger" onclick="App.deleteWebhook('${webhook.id}')">Delete</button>
                        </div>
                    </div>
                    <div class="webhook-info">
                        <span>Types: ${webhook.types.join(', ')}</span>
                        <span>Min Confidence: ${webhook.minConfidence}%</span>
                        <span>Status: ${webhook.enabled ? 'Enabled' : 'Disabled'}</span>
                    </div>
                </div>
            `).join('');
        } catch (error) {
            console.error('Error loading webhooks:', error);
        }
    },

    async loadAdminUsers() {
        try {
            const users = await API.getUsers();
            const tbody = document.getElementById('usersTableBody');
            
            tbody.innerHTML = users.map(user => `
                <tr>
                    <td>${user.id}</td>
                    <td>${user.username}</td>
                    <td>${user.email}</td>
                    <td>${user.role}</td>
                    <td class="${user.status === 'active' ? 'positive' : 'negative'}">${user.status}</td>
                    <td>
                        <button class="btn-small" onclick="App.editUser('${user.id}')">Edit</button>
                    </td>
                </tr>
            `).join('');
        } catch (error) {
            console.error('Error loading users:', error);
        }
    },

    async testWebhook(id) {
        try {
            await API.testWebhook(id);
            alert('✅ Webhook test successful! Check your Discord channel.');
        } catch (error) {
            alert('❌ Webhook test failed: ' + error.message);
        }
    },

    async editWebhook(id) {
        const webhooks = await API.getWebhooks();
        const webhook = webhooks.find(w => w.id === id);
        
        const name = prompt('Webhook Name:', webhook.name);
        const url = prompt('Webhook URL:', webhook.url);
        
        if (name && url) {
            try {
                await API.updateWebhook(id, { name, url });
                await this.loadAdminWebhooks();
            } catch (error) {
                alert('Error updating webhook: ' + error.message);
            }
        }
    },

    async deleteWebhook(id) {
        if (confirm('Are you sure you want to delete this webhook?')) {
            try {
                await API.deleteWebhook(id);
                await this.loadAdminWebhooks();
            } catch (error) {
                alert('Error deleting webhook: ' + error.message);
            }
        }
    },

    async showAddWebhookModal() {
        const name = prompt('Webhook Name:');
        if (!name) return;

        const url = prompt('Webhook URL:');
        if (!url) return;

        try {
            await API.addWebhook(name, url, ['buy', 'sell', 'hold'], 70);
            await this.loadAdminWebhooks();
        } catch (error) {
            alert('Error adding webhook: ' + error.message);
        }
    },

    async removeHolding(symbol) {
        if (confirm(`Remove ${symbol} from portfolio?`)) {
            // Implementation needed in backend
            await this.loadPortfolio();
        }
    },

    async removeFromWatchlist(symbol) {
        try {
            await API.removeFromWatchlist(this.currentUser.id, symbol);
            await this.loadWatchlist();
        } catch (error) {
            alert('Error removing from watchlist: ' + error.message);
        }
    },

    // Auto refresh
    startAutoRefresh() {
        setInterval(async () => {
            await this.loadData();
        }, CONFIG.signalRefreshInterval);
    }
};

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => App.init());
} else {
    App.init();
}
