// Acorn Finance Configuration
const CONFIG = {
    // API endpoint
    apiUrl: window.location.origin.includes('localhost') 
        ? 'http://localhost:3000/api' 
        : '/api',
    
    // WebSocket endpoint
    wsUrl: window.location.origin.includes('localhost')
        ? 'ws://localhost:3001'
        : `ws://${window.location.hostname}:3001`,
    
    // Default webhook (can be changed in admin)
    defaultWebhookUrl: 'https://discord.com/api/webhooks/1471267540033470766/n-6Sp6tcKb3CZL5_MpNz6pUzc6GNRV4vljKXyBgdGNMpY2Vv8bGWIclBTsfVlx8R_RS4',
    
    // Stock symbols to monitor
    stockSymbols: ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA', 'META', 'NVDA', 'NFLX', 'AMD', 'INTC', 'SPY', 'QQQ'],
    
    // Admin settings
    adminPassword: 'admin123', // Change this!
    
    // Update intervals
    updateInterval: 60000, // 1 minute
    signalRefreshInterval: 30000, // 30 seconds
    
    // Minimum confidence for webhook notifications
    minConfidenceForWebhook: 70
};
