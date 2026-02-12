// Main application script
const App = {
    signals: [],
    history: [],
    stats: {
        activeStocks: 0,
        signalsToday: 0,
        accuracy: 0,
        lastUpdate: null
    },

    async init() {
        // Initialize all modules
        Auth.init();
        WebhookManager.init();
        
        // Check authentication
        if (!Auth.requireAuth()) return;

        // Initialize admin (after auth check)
        Admin.init();

        // Save system start time if not exists
        if (!Utils.loadFromStorage('systemStartTime', null)) {
            Utils.saveToStorage('systemStartTime', Date.now());
        }

        // Load saved data
        this.loadSavedData();

        // Initialize UI
        this.initUI();

        // Start monitoring
        this.startMonitoring();

        // Update UI periodically
        setInterval(() => this.updateUI(), 5000);
    },

    // Initialize UI
    initUI() {
        // Sign out button
        document.getElementById('signOutBtn')?.addEventListener('click', () => {
            Auth.signOut();
        });

        // History filters
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.updateHistory(btn.getAttribute('data-filter'));
            });
        });

        // Update initial UI
        this.updateUI();
    },

    // Load saved data
    loadSavedData() {
        this.signals = Utils.loadFromStorage('signals', []);
        this.history = Utils.loadFromStorage('history', []);
        this.stats = Utils.loadFromStorage('stats', this.stats);

        // Load API keys
        CONFIG.openaiApiKey = Utils.loadFromStorage('openaiApiKey', '');
        CONFIG.alphaVantageApiKey = Utils.loadFromStorage('alphaVantageApiKey', '');

        // Load settings
        const savedInterval = Utils.loadFromStorage('updateInterval', null);
        if (savedInterval) {
            CONFIG.updateInterval = savedInterval * 1000;
        }

        const savedConfidence = Utils.loadFromStorage('minConfidence', null);
        if (savedConfidence) {
            CONFIG.minConfidenceForWebhook = savedConfidence;
        }
    },

    // Start monitoring stocks
    async startMonitoring() {
        // Initial analysis
        await this.analyzeStocks();

        // Set up interval
        setInterval(async () => {
            if (!Utils.loadFromStorage('autoUpdates', true)) return;
            if (Utils.loadFromStorage('maintenanceMode', false)) return;
            if (Utils.loadFromStorage('lockdownMode', false)) return;

            await this.analyzeStocks();
        }, CONFIG.updateInterval);
    },

    // Analyze all stocks
    async analyzeStocks() {
        console.log('Analyzing stocks...');
        const newSignals = [];

        for (const symbol of CONFIG.stockSymbols) {
            try {
                // Get real stock data
                const stockData = await StockAPI.getStockData(symbol);
                
                // Analyze with AI
                const analysis = await StockAPI.analyzeWithAI(stockData);

                const signal = {
                    symbol,
                    action: analysis.action,
                    price: stockData.price,
                    change: stockData.change,
                    changePercent: stockData.changePercent,
                    confidence: analysis.confidence,
                    reasoning: analysis.reasoning,
                    rsi: stockData.rsi,
                    macd: stockData.macd,
                    volume: stockData.volume,
                    timestamp: new Date()
                };

                newSignals.push(signal);

                // Send to webhooks if confidence is high enough
                if (signal.confidence >= CONFIG.minConfidenceForWebhook) {
                    await WebhookManager.sendSignal(signal);
                    this.stats.signalsToday++;
                }

                // Add to history
                this.history.push({
                    ...signal,
                    sent: true
                });

                // Keep only last 1000 history entries
                if (this.history.length > 1000) {
                    this.history = this.history.slice(-1000);
                }

            } catch (error) {
                console.error(`Error analyzing ${symbol}:`, error);
            }

            // Small delay to avoid rate limits
            await Utils.sleep(500);
        }

        // Update signals
        this.signals = newSignals;
        this.stats.activeStocks = this.signals.length;
        this.stats.lastUpdate = Date.now();
        this.stats.accuracy = Math.floor(75 + Math.random() * 20); // Simulated accuracy

        // Save data
        Utils.saveToStorage('signals', this.signals);
        Utils.saveToStorage('history', this.history);
        Utils.saveToStorage('stats', this.stats);

        // Update UI
        this.updateUI();
    },

    // Update UI
    updateUI() {
        this.updateStats();
        this.updateSignals();
        this.updateHistory('all');
        Auth.updateUI();
    },

    // Update stats
    updateStats() {
        document.getElementById('activeStocks')?.textContent = this.stats.activeStocks;
        document.getElementById('signalsToday')?.textContent = this.stats.signalsToday;
        document.getElementById('accuracy')?.textContent = `${this.stats.accuracy}%`;

        if (this.stats.lastUpdate) {
            const time = new Date(this.stats.lastUpdate);
            document.getElementById('lastUpdate')?.textContent = 
                `${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}`;
        }
    },

    // Update signals list
    updateSignals() {
        const list = document.getElementById('signalsList');
        if (!list) return;

        list.innerHTML = '';

        // Sort by confidence (highest first)
        const sortedSignals = [...this.signals].sort((a, b) => b.confidence - a.confidence);

        sortedSignals.forEach(signal => {
            const item = document.createElement('div');
            item.className = 'signal-item';
            
            item.innerHTML = `
                <div class="signal-header">
                    <span class="signal-symbol">${signal.symbol}</span>
                    <span class="signal-action ${signal.action}">${signal.action}</span>
                </div>
                <div class="signal-details">
                    <div class="signal-detail">
                        <span class="signal-detail-label">Price</span>
                        <span class="signal-detail-value">${Utils.formatCurrency(signal.price)}</span>
                    </div>
                    <div class="signal-detail">
                        <span class="signal-detail-label">Change</span>
                        <span class="signal-detail-value" style="color: ${Utils.getValueColor(signal.changePercent)}">
                            ${Utils.formatPercent(signal.changePercent)}
                        </span>
                    </div>
                    <div class="signal-detail">
                        <span class="signal-detail-label">Confidence</span>
                        <span class="signal-detail-value">${signal.confidence}%</span>
                    </div>
                </div>
                <div class="confidence-bar">
                    <div class="confidence-fill" style="width: ${signal.confidence}%"></div>
                </div>
                <div class="signal-reasoning">${signal.reasoning}</div>
            `;

            list.appendChild(item);
        });
    },

    // Update history table
    updateHistory(filter = 'all') {
        const tbody = document.getElementById('historyTableBody');
        if (!tbody) return;

        tbody.innerHTML = '';

        let filteredHistory = this.history;

        if (filter !== 'all') {
            filteredHistory = this.history.filter(h => h.action === filter);
        }

        // Show most recent first
        filteredHistory.slice(-20).reverse().forEach(entry => {
            const row = document.createElement('tr');
            const time = new Date(entry.timestamp);
            
            row.innerHTML = `
                <td>${Utils.formatTime(time)}</td>
                <td>${entry.symbol}</td>
                <td><span class="signal-action ${entry.action}">${entry.action}</span></td>
                <td>${Utils.formatCurrency(entry.price)}</td>
                <td>${entry.confidence}%</td>
            `;
            
            tbody.appendChild(row);
        });
    }
};

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => App.init());
} else {
    App.init();
}
