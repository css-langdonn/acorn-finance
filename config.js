// Configuration file
const CONFIG = {
    // API Keys (users should set these in admin panel)
    openaiApiKey: '', // Set in admin panel
    alphaVantageApiKey: '', // Free API key for stock data - get from https://www.alphavantage.co/support/#api-key
    
    // Default webhook (can be changed in admin)
    defaultWebhookUrl: 'https://discord.com/api/webhooks/1471267540033470766/n-6Sp6tcKb3CZL5_MpNz6pUzc6GNRV4vljKXyBgdGNMpY2Vv8bGWIclBTsfVlx8R_RS4',
    
    // Update intervals
    updateInterval: 60000, // 1 minute for real API calls
    aiAnalysisInterval: 300000, // 5 minutes for AI analysis
    
    // Stock symbols to monitor
    stockSymbols: ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA', 'META', 'NVDA', 'NFLX', 'AMD', 'INTC', 'SPY', 'QQQ'],
    
    // Admin settings
    adminPassword: 'admin123', // Change this!
    
    // API endpoints
    alphaVantageBaseUrl: 'https://www.alphavantage.co/query',
    
    // Minimum confidence for webhook notifications
    minConfidenceForWebhook: 70
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}
