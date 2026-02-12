// Webhook management system
const WebhookManager = {
    webhooks: [],

    init() {
        this.webhooks = Utils.loadFromStorage('webhooks', [
            {
                id: 'default',
                name: 'Default Discord Webhook',
                url: CONFIG.defaultWebhookUrl,
                enabled: true,
                types: ['buy', 'sell', 'hold', 'alert'],
                minConfidence: CONFIG.minConfidenceForWebhook
            }
        ]);
    },

    // Add webhook
    addWebhook(name, url, types = ['buy', 'sell', 'hold'], minConfidence = 70) {
        const webhook = {
            id: Utils.generateId(),
            name,
            url,
            enabled: true,
            types,
            minConfidence,
            createdAt: Date.now()
        };

        this.webhooks.push(webhook);
        this.save();
        return webhook;
    },

    // Update webhook
    updateWebhook(id, updates) {
        const webhook = this.webhooks.find(w => w.id === id);
        if (webhook) {
            Object.assign(webhook, updates);
            this.save();
            return webhook;
        }
        return null;
    },

    // Delete webhook
    deleteWebhook(id) {
        this.webhooks = this.webhooks.filter(w => w.id !== id);
        this.save();
    },

    // Get webhook by ID
    getWebhook(id) {
        return this.webhooks.find(w => w.id === id);
    },

    // Get all enabled webhooks
    getEnabledWebhooks() {
        return this.webhooks.filter(w => w.enabled);
    },

    // Send signal to webhooks
    async sendSignal(signal) {
        const enabledWebhooks = this.getEnabledWebhooks();
        const results = [];

        for (const webhook of enabledWebhooks) {
            // Check if webhook should receive this signal type
            if (!webhook.types.includes(signal.action)) {
                continue;
            }

            // Check confidence threshold
            if (signal.confidence < webhook.minConfidence) {
                continue;
            }

            try {
                const success = await this.sendToWebhook(webhook, signal);
                results.push({ webhook: webhook.name, success });
            } catch (error) {
                results.push({ webhook: webhook.name, success: false, error: error.message });
            }
        }

        return results;
    },

    // Send to individual webhook
    async sendToWebhook(webhook, signal) {
        try {
            if (!webhook || !webhook.url) {
                throw new Error('Invalid webhook configuration');
            }

            if (!signal) {
                throw new Error('Invalid signal data');
            }

            const embed = {
                title: `📈 ${signal.symbol} - ${signal.action.toUpperCase()} Signal`,
                description: `**Confidence:** ${signal.confidence}%\n**Price:** ${Utils.formatCurrency(signal.price)}\n**Change:** ${Utils.formatPercent(signal.changePercent)}\n\n**Analysis:** ${signal.reasoning}`,
                color: signal.action === 'buy' ? 0x10b981 : signal.action === 'sell' ? 0xef4444 : 0xf59e0b,
                timestamp: signal.timestamp ? signal.timestamp.toISOString() : new Date().toISOString(),
                footer: {
                    text: 'StockTiming Pro - AI-Powered Analysis'
                },
                fields: [
                    {
                        name: 'RSI',
                        value: signal.rsi ? signal.rsi.toFixed(2) : 'N/A',
                        inline: true
                    },
                    {
                        name: 'MACD',
                        value: signal.macd ? signal.macd.toFixed(4) : 'N/A',
                        inline: true
                    },
                    {
                        name: 'Volume',
                        value: signal.volume ? signal.volume.toLocaleString() : 'N/A',
                        inline: true
                    }
                ]
            };

            const payload = {
                embeds: [embed],
                username: 'StockTiming Pro',
                avatar_url: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'
            };

            console.log('Sending webhook to:', webhook.url);
            console.log('Payload:', JSON.stringify(payload, null, 2));

            const response = await fetch(webhook.url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            const responseText = await response.text();
            console.log('Webhook response status:', response.status);
            console.log('Webhook response:', responseText);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${responseText.substring(0, 100)}`);
            }

            return true;
        } catch (error) {
            console.error(`Webhook error (${webhook.name}):`, error);
            throw error;
        }
    },

    // Test webhook
    async testWebhook(webhookId) {
        const webhook = this.getWebhook(webhookId);
        if (!webhook) {
            throw new Error('Webhook not found');
        }

        const testSignal = {
            symbol: 'TEST',
            action: 'buy',
            price: 100.00,
            changePercent: 0.00,
            confidence: 100,
            reasoning: 'This is a test message from StockTiming Pro admin panel',
            timestamp: new Date(),
            rsi: 50,
            macd: 0,
            volume: 0
        };

        return await this.sendToWebhook(webhook, testSignal);
    },

    // Save webhooks
    save() {
        Utils.saveToStorage('webhooks', this.webhooks);
    }
};
