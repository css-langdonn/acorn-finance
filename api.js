// API integration for real stock data and AI analysis
const StockAPI = {
    // Get real stock data from Alpha Vantage
    async getStockData(symbol) {
        if (!CONFIG.alphaVantageApiKey) {
            console.warn('Alpha Vantage API key not set');
            return this.getMockData(symbol);
        }

        try {
            const url = `${CONFIG.alphaVantageBaseUrl}?function=TIME_SERIES_INTRADAY&symbol=${symbol}&interval=5min&apikey=${CONFIG.alphaVantageApiKey}`;
            const response = await fetch(url);
            const data = await response.json();

            if (data['Error Message'] || data['Note']) {
                console.warn(`API limit reached or error for ${symbol}, using mock data`);
                return this.getMockData(symbol);
            }

            const timeSeries = data['Time Series (5min)'];
            if (!timeSeries) return this.getMockData(symbol);

            const latest = Object.keys(timeSeries)[0];
            const latestData = timeSeries[latest];
            const previous = Object.keys(timeSeries)[1];
            const previousData = timeSeries[previous];

            const currentPrice = parseFloat(latestData['4. close']);
            const previousPrice = parseFloat(previousData['4. close']);
            const change = currentPrice - previousPrice;
            const changePercent = (change / previousPrice) * 100;

            // Calculate moving averages
            const prices = Object.values(timeSeries).slice(0, 20).map(d => parseFloat(d['4. close']));
            const movingAverage = prices.reduce((a, b) => a + b, 0) / prices.length;

            // Calculate RSI (simplified)
            const gains = [];
            const losses = [];
            for (let i = 1; i < prices.length; i++) {
                const diff = prices[i] - prices[i - 1];
                if (diff > 0) gains.push(diff);
                else losses.push(Math.abs(diff));
            }
            const avgGain = gains.length > 0 ? gains.reduce((a, b) => a + b, 0) / gains.length : 0;
            const avgLoss = losses.length > 0 ? losses.reduce((a, b) => a + b, 0) / losses.length : 0;
            const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
            const rsi = 100 - (100 / (1 + rs));

            // Calculate MACD (simplified)
            const ema12 = this.calculateEMA(prices.slice(0, 12));
            const ema26 = this.calculateEMA(prices.slice(0, 26));
            const macd = ema12 - ema26;

            return {
                symbol,
                price: currentPrice,
                change,
                changePercent,
                volume: parseInt(latestData['5. volume']),
                rsi: Math.min(100, Math.max(0, rsi)),
                macd,
                movingAverage,
                volatility: this.calculateVolatility(prices),
                trend: (currentPrice - movingAverage) / movingAverage,
                timestamp: new Date(latest.replace(' ', 'T'))
            };
        } catch (error) {
            console.error(`Error fetching data for ${symbol}:`, error);
            return this.getMockData(symbol);
        }
    },

    // Calculate EMA
    calculateEMA(prices) {
        if (prices.length === 0) return 0;
        const multiplier = 2 / (prices.length + 1);
        let ema = prices[0];
        for (let i = 1; i < prices.length; i++) {
            ema = (prices[i] * multiplier) + (ema * (1 - multiplier));
        }
        return ema;
    },

    // Calculate volatility
    calculateVolatility(prices) {
        if (prices.length < 2) return 0;
        const mean = prices.reduce((a, b) => a + b, 0) / prices.length;
        const variance = prices.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / prices.length;
        return Math.sqrt(variance) / mean;
    },

    // Mock data fallback
    getMockData(symbol) {
        const basePrice = 50 + Math.random() * 200;
        return {
            symbol,
            price: basePrice,
            change: (Math.random() - 0.5) * 5,
            changePercent: (Math.random() - 0.5) * 3,
            volume: Math.floor(Math.random() * 10000000) + 1000000,
            rsi: 30 + Math.random() * 40,
            macd: (Math.random() - 0.5) * 2,
            movingAverage: basePrice * (1 + (Math.random() - 0.5) * 0.1),
            volatility: 0.01 + Math.random() * 0.03,
            trend: (Math.random() - 0.5) * 0.1,
            timestamp: new Date()
        };
    },

    // AI-powered pattern analysis using OpenAI
    async analyzeWithAI(stockData, historicalData = []) {
        if (!CONFIG.openaiApiKey) {
            console.warn('OpenAI API key not set, using rule-based analysis');
            return this.ruleBasedAnalysis(stockData);
        }

        try {
            const prompt = `Analyze this stock data and provide a trading recommendation:

Symbol: ${stockData.symbol}
Current Price: $${stockData.price.toFixed(2)}
Change: ${stockData.changePercent.toFixed(2)}%
RSI: ${stockData.rsi.toFixed(2)}
MACD: ${stockData.macd.toFixed(4)}
Moving Average: $${stockData.movingAverage.toFixed(2)}
Volatility: ${(stockData.volatility * 100).toFixed(2)}%
Trend: ${(stockData.trend * 100).toFixed(2)}%

Based on technical analysis patterns, provide:
1. Action: BUY, SELL, or HOLD
2. Confidence: 0-100
3. Reasoning: Brief explanation of the pattern analysis

Respond in JSON format: {"action": "BUY|SELL|HOLD", "confidence": 0-100, "reasoning": "explanation"}`;

            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${CONFIG.openaiApiKey}`
                },
                body: JSON.stringify({
                    model: 'gpt-4o-mini',
                    messages: [
                        {
                            role: 'system',
                            content: 'You are a professional stock market analyst. Analyze technical indicators and provide trading recommendations based on patterns.'
                        },
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    temperature: 0.3,
                    max_tokens: 200
                })
            });

            const data = await response.json();
            
            if (data.error) {
                console.error('OpenAI API error:', data.error);
                return this.ruleBasedAnalysis(stockData);
            }

            const content = data.choices[0].message.content;
            const analysis = Utils.safeJsonParse(content, null);

            if (analysis && analysis.action) {
                return {
                    action: analysis.action.toLowerCase(),
                    confidence: Math.min(95, Math.max(30, parseInt(analysis.confidence) || 50)),
                    reasoning: analysis.reasoning || 'AI pattern analysis'
                };
            }

            return this.ruleBasedAnalysis(stockData);
        } catch (error) {
            console.error('AI analysis error:', error);
            return this.ruleBasedAnalysis(stockData);
        }
    },

    // Rule-based analysis fallback
    ruleBasedAnalysis(stockData) {
        const { rsi, macd, price, movingAverage, changePercent, trend, volatility } = stockData;
        
        let action = 'hold';
        let confidence = 50;
        const reasoning = [];

        // RSI signals
        if (rsi < 30) {
            action = 'buy';
            confidence += 25;
            reasoning.push('Oversold (RSI < 30)');
        } else if (rsi > 70) {
            action = 'sell';
            confidence += 25;
            reasoning.push('Overbought (RSI > 70)');
        }

        // MACD signals
        if (macd > 0.5) {
            if (action === 'hold') action = 'buy';
            confidence += 15;
            reasoning.push('Bullish MACD crossover');
        } else if (macd < -0.5) {
            if (action === 'hold') action = 'sell';
            confidence += 15;
            reasoning.push('Bearish MACD divergence');
        }

        // Price vs MA
        const priceDiff = (price - movingAverage) / movingAverage;
        if (priceDiff < -0.05) {
            if (action === 'hold') action = 'buy';
            confidence += 10;
            reasoning.push('Price 5% below MA');
        } else if (priceDiff > 0.05) {
            if (action === 'hold') action = 'sell';
            confidence += 10;
            reasoning.push('Price 5% above MA');
        }

        // Trend analysis
        if (trend > 0.05) {
            if (action === 'hold') action = 'buy';
            confidence += 10;
            reasoning.push('Strong upward trend');
        } else if (trend < -0.05) {
            if (action === 'hold') action = 'sell';
            confidence += 10;
            reasoning.push('Strong downward trend');
        }

        // Volatility check
        if (volatility > 0.03 && changePercent < -2) {
            confidence += 5;
            reasoning.push('High volatility opportunity');
        }

        confidence = Math.min(95, Math.max(30, confidence));

        return {
            action,
            confidence,
            reasoning: reasoning.length > 0 ? reasoning.join(' • ') : 'Neutral market conditions'
        };
    }
};
