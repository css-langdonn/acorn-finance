const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs').promises;
const path = require('path');
const fetch = require('node-fetch');
const WebSocket = require('ws');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Data storage paths
const DATA_DIR = path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const WEBHOOKS_FILE = path.join(DATA_DIR, 'webhooks.json');
const SIGNALS_FILE = path.join(DATA_DIR, 'signals.json');
const PORTFOLIOS_FILE = path.join(DATA_DIR, 'portfolios.json');
const WATCHLISTS_FILE = path.join(DATA_DIR, 'watchlists.json');

// Ensure data directory exists
async function ensureDataDir() {
    try {
        await fs.mkdir(DATA_DIR, { recursive: true });
    } catch (error) {
        console.error('Error creating data directory:', error);
    }
}

// Data management functions
async function readData(file, defaultValue = []) {
    try {
        const data = await fs.readFile(file, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return defaultValue;
    }
}

async function writeData(file, data) {
    try {
        await fs.writeFile(file, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error(`Error writing to ${file}:`, error);
        return false;
    }
}

// WebSocket server for real-time updates
const wss = new WebSocket.Server({ port: 3001 });

wss.on('connection', (ws) => {
    console.log('Client connected');
    ws.on('close', () => console.log('Client disconnected'));
});

function broadcast(data) {
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
        }
    });
}

// ===== API Routes =====

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Acorn Finance API is running' });
});

// ===== Authentication =====
app.post('/api/auth/signup', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        
        if (!username || !email || !password) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const users = await readData(USERS_FILE, []);
        
        if (users.find(u => u.email === email || u.username === username)) {
            return res.status(400).json({ error: 'User already exists' });
        }

        const newUser = {
            id: Date.now().toString(),
            username,
            email,
            password: Buffer.from(password).toString('base64'), // Simple encoding
            role: 'user',
            status: 'active',
            createdAt: Date.now(),
            subscription: 'free'
        };

        users.push(newUser);
        await writeData(USERS_FILE, users);

        const { password: _, ...userWithoutPassword } = newUser;
        res.json({ user: userWithoutPassword, token: 'mock-token' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        const users = await readData(USERS_FILE, []);
        const user = users.find(u => u.email === email);

        if (!user || Buffer.from(password).toString('base64') !== user.password) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        if (user.status !== 'active') {
            return res.status(403).json({ error: 'Account is inactive' });
        }

        const { password: _, ...userWithoutPassword } = user;
        res.json({ user: userWithoutPassword, token: 'mock-token' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ===== Webhooks =====
app.get('/api/webhooks', async (req, res) => {
    try {
        const webhooks = await readData(WEBHOOKS_FILE, []);
        res.json(webhooks);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/webhooks', async (req, res) => {
    try {
        const { name, url, types, minConfidence } = req.body;
        
        const webhooks = await readData(WEBHOOKS_FILE, []);
        
        const newWebhook = {
            id: Date.now().toString(),
            name,
            url,
            enabled: true,
            types: types || ['buy', 'sell', 'hold'],
            minConfidence: minConfidence || 70,
            createdAt: Date.now()
        };

        webhooks.push(newWebhook);
        await writeData(WEBHOOKS_FILE, webhooks);

        res.json(newWebhook);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/webhooks/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        
        const webhooks = await readData(WEBHOOKS_FILE, []);
        const index = webhooks.findIndex(w => w.id === id);
        
        if (index === -1) {
            return res.status(404).json({ error: 'Webhook not found' });
        }

        webhooks[index] = { ...webhooks[index], ...updates };
        await writeData(WEBHOOKS_FILE, webhooks);

        res.json(webhooks[index]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/webhooks/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const webhooks = await readData(WEBHOOKS_FILE, []);
        const filtered = webhooks.filter(w => w.id !== id);
        
        await writeData(WEBHOOKS_FILE, filtered);

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/webhooks/:id/test', async (req, res) => {
    try {
        const { id } = req.params;
        
        const webhooks = await readData(WEBHOOKS_FILE, []);
        const webhook = webhooks.find(w => w.id === id);
        
        if (!webhook) {
            return res.status(404).json({ error: 'Webhook not found' });
        }

        const testSignal = {
            symbol: 'TEST',
            action: 'buy',
            price: 100.00,
            changePercent: 0.00,
            confidence: 100,
            reasoning: 'This is a test message from Acorn Finance',
            timestamp: new Date().toISOString(),
            rsi: 50,
            macd: 0,
            volume: 0
        };

        const embed = {
            title: `📈 ${testSignal.symbol} - ${testSignal.action.toUpperCase()} Signal`,
            description: `**Confidence:** ${testSignal.confidence}%\n**Price:** $${testSignal.price.toFixed(2)}\n**Change:** ${testSignal.changePercent.toFixed(2)}%\n\n**Analysis:** ${testSignal.reasoning}`,
            color: testSignal.action === 'buy' ? 0x10b981 : testSignal.action === 'sell' ? 0xef4444 : 0xf59e0b,
            timestamp: testSignal.timestamp,
            footer: {
                text: 'Acorn Finance - AI-Powered Analysis'
            }
        };

        const payload = {
            embeds: [embed],
            username: 'Acorn Finance',
            avatar_url: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'
        };

        const response = await fetch(webhook.url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        res.json({ success: true, message: 'Webhook test successful' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ===== Signals =====
app.get('/api/signals', async (req, res) => {
    try {
        const signals = await readData(SIGNALS_FILE, []);
        res.json(signals);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/signals', async (req, res) => {
    try {
        const signal = req.body;
        signal.id = Date.now().toString();
        signal.timestamp = new Date().toISOString();

        const signals = await readData(SIGNALS_FILE, []);
        signals.unshift(signal);
        
        // Keep only last 1000 signals
        if (signals.length > 1000) {
            signals.splice(1000);
        }

        await writeData(SIGNALS_FILE, signals);

        // Broadcast to WebSocket clients
        broadcast({ type: 'new_signal', data: signal });

        // Send to webhooks
        const webhooks = await readData(WEBHOOKS_FILE, []);
        const enabledWebhooks = webhooks.filter(w => w.enabled && w.types.includes(signal.action) && signal.confidence >= w.minConfidence);

        for (const webhook of enabledWebhooks) {
            try {
                const embed = {
                    title: `📈 ${signal.symbol} - ${signal.action.toUpperCase()} Signal`,
                    description: `**Confidence:** ${signal.confidence}%\n**Price:** $${signal.price.toFixed(2)}\n**Change:** ${signal.changePercent.toFixed(2)}%\n\n**Analysis:** ${signal.reasoning}`,
                    color: signal.action === 'buy' ? 0x10b981 : signal.action === 'sell' ? 0xef4444 : 0xf59e0b,
                    timestamp: signal.timestamp,
                    footer: { text: 'Acorn Finance - AI-Powered Analysis' },
                    fields: [
                        { name: 'RSI', value: signal.rsi ? signal.rsi.toFixed(2) : 'N/A', inline: true },
                        { name: 'MACD', value: signal.macd ? signal.macd.toFixed(4) : 'N/A', inline: true },
                        { name: 'Volume', value: signal.volume ? signal.volume.toLocaleString() : 'N/A', inline: true }
                    ]
                };

                await fetch(webhook.url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ embeds: [embed], username: 'Acorn Finance' })
                });
            } catch (error) {
                console.error(`Error sending to webhook ${webhook.name}:`, error);
            }
        }

        res.json(signal);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ===== Users =====
app.get('/api/users', async (req, res) => {
    try {
        const users = await readData(USERS_FILE, []);
        const usersWithoutPasswords = users.map(({ password, ...user }) => user);
        res.json(usersWithoutPasswords);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        
        const users = await readData(USERS_FILE, []);
        const index = users.findIndex(u => u.id === id);
        
        if (index === -1) {
            return res.status(404).json({ error: 'User not found' });
        }

        users[index] = { ...users[index], ...updates };
        await writeData(USERS_FILE, users);

        const { password, ...userWithoutPassword } = users[index];
        res.json(userWithoutPassword);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ===== Portfolios =====
app.get('/api/portfolios/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const portfolios = await readData(PORTFOLIOS_FILE, []);
        const userPortfolio = portfolios.find(p => p.userId === userId) || { userId, holdings: [], cash: 10000 };
        res.json(userPortfolio);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/portfolios/:userId/holdings', async (req, res) => {
    try {
        const { userId } = req.params;
        const { symbol, quantity, price } = req.body;
        
        const portfolios = await readData(PORTFOLIOS_FILE, []);
        let portfolio = portfolios.find(p => p.userId === userId);
        
        if (!portfolio) {
            portfolio = { userId, holdings: [], cash: 10000 };
            portfolios.push(portfolio);
        }

        const existingHolding = portfolio.holdings.find(h => h.symbol === symbol);
        if (existingHolding) {
            existingHolding.quantity += quantity;
            existingHolding.avgPrice = ((existingHolding.avgPrice * (existingHolding.quantity - quantity)) + (price * quantity)) / existingHolding.quantity;
        } else {
            portfolio.holdings.push({ symbol, quantity, avgPrice: price });
        }

        portfolio.cash -= price * quantity;
        await writeData(PORTFOLIOS_FILE, portfolios);

        res.json(portfolio);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ===== Watchlists =====
app.get('/api/watchlists/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const watchlists = await readData(WATCHLISTS_FILE, []);
        const userWatchlist = watchlists.find(w => w.userId === userId) || { userId, symbols: [] };
        res.json(userWatchlist);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/watchlists/:userId/symbols', async (req, res) => {
    try {
        const { userId } = req.params;
        const { symbol } = req.body;
        
        const watchlists = await readData(WATCHLISTS_FILE, []);
        let watchlist = watchlists.find(w => w.userId === userId);
        
        if (!watchlist) {
            watchlist = { userId, symbols: [] };
            watchlists.push(watchlist);
        }

        if (!watchlist.symbols.includes(symbol)) {
            watchlist.symbols.push(symbol);
            await writeData(WATCHLISTS_FILE, watchlists);
        }

        res.json(watchlist);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/watchlists/:userId/symbols/:symbol', async (req, res) => {
    try {
        const { userId, symbol } = req.params;
        
        const watchlists = await readData(WATCHLISTS_FILE, []);
        const watchlist = watchlists.find(w => w.userId === userId);
        
        if (watchlist) {
            watchlist.symbols = watchlist.symbols.filter(s => s !== symbol);
            await writeData(WATCHLISTS_FILE, watchlists);
        }

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Serve frontend
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Initialize server
async function startServer() {
    await ensureDataDir();
    
    // Initialize default webhook if none exists
    const webhooks = await readData(WEBHOOKS_FILE, []);
    if (webhooks.length === 0) {
        await writeData(WEBHOOKS_FILE, [{
            id: 'default',
            name: 'Default Discord Webhook',
            url: 'https://discord.com/api/webhooks/1471267540033470766/n-6Sp6tcKb3CZL5_MpNz6pUzc6GNRV4vljKXyBgdGNMpY2Vv8bGWIclBTsfVlx8R_RS4',
            enabled: true,
            types: ['buy', 'sell', 'hold'],
            minConfidence: 70,
            createdAt: Date.now()
        }]);
    }

    app.listen(PORT, () => {
        console.log(`🌰 Acorn Finance server running on http://localhost:${PORT}`);
        console.log(`📡 WebSocket server running on ws://localhost:3001`);
    });
}

startServer();
