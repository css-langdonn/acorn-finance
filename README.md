# StockTiming Pro - AI-Powered Stock Analysis

A professional, minimalistic stock market analysis platform with real AI integration, authentication, and comprehensive admin controls.

## Features

- **Real AI Analysis**: Uses OpenAI API for actual pattern recognition and trading recommendations
- **Real Stock Data**: Integrates with Alpha Vantage API for live market data
- **Authentication System**: Sign up/in functionality with user management
- **Webhook Management**: Add, edit, delete, and test multiple Discord webhooks
- **Admin Panel**: Comprehensive admin controls with 50+ features
- **Minimalistic Design**: Clean, article-like interface that's easy on the eyes
- **24/7 Monitoring**: Automatic stock analysis and webhook notifications

## Setup Instructions

### 1. Get API Keys

#### OpenAI API Key (for AI analysis)
1. Go to https://platform.openai.com/api-keys
2. Create an account or sign in
3. Create a new API key
4. Copy the key (starts with `sk-`)

#### Alpha Vantage API Key (for stock data)
1. Go to https://www.alphavantage.co/support/#api-key
2. Fill out the form to get a free API key
3. Copy the key

### 2. Configure API Keys

1. Open the website in your browser
2. Sign up for an account (or use admin account)
3. Click "Admin" button
4. Go to "API Keys" section
5. Enter your OpenAI and Alpha Vantage API keys
6. Click "Save API Keys"

### 3. Default Admin Account

- **Password**: `admin123` (CHANGE THIS IMMEDIATELY!)
- To change: Edit `config.js` and update `adminPassword`

### 4. Webhook Configuration

The default Discord webhook is already configured. You can:
- Add multiple webhooks in Admin → Webhooks
- Edit webhook settings (URL, signal types, confidence threshold)
- Test webhooks before using them

## File Structure

```
HQ/
├── index.html          # Main dashboard page
├── login.html          # Sign in page
├── signup.html         # Sign up page
├── styles.css          # Main stylesheet
├── auth.css            # Authentication page styles
├── config.js           # Configuration file
├── utils.js            # Utility functions
├── auth.js             # Authentication system
├── api.js              # Stock API and AI integration
├── webhook.js          # Webhook management
├── admin.js            # Admin panel functionality
└── script.js           # Main application logic
```

## How It Works

1. **Stock Data Collection**: Fetches real-time stock data from Alpha Vantage API
2. **AI Analysis**: Sends data to OpenAI for pattern recognition and trading recommendations
3. **Signal Generation**: Creates buy/sell/hold signals with confidence scores
4. **Webhook Notifications**: Sends high-confidence signals to configured Discord webhooks
5. **Dashboard Updates**: Real-time updates every 60 seconds (configurable)

## Admin Features

- **Overview**: System statistics and status
- **Webhooks**: Manage multiple Discord webhooks
- **Users**: Add, edit, delete users and change their information
- **API Keys**: Configure OpenAI and Alpha Vantage API keys
- **System**: Maintenance mode, lockdown mode, auto-updates
- **Settings**: Update intervals, confidence thresholds

## Customization

### Change Update Interval
- Admin → Settings → Update Interval (seconds)
- Default: 60 seconds

### Change Confidence Threshold
- Admin → Settings → Minimum Confidence for Webhooks
- Default: 70%

### Add More Stocks
- Edit `config.js` → `stockSymbols` array
- Add stock symbols (e.g., 'AAPL', 'GOOGL', etc.)

## Security Notes

⚠️ **Important Security Considerations:**

1. **Change Admin Password**: Edit `config.js` immediately
2. **API Keys**: Never commit API keys to version control
3. **Production**: Use proper password hashing (currently uses base64 encoding)
4. **HTTPS**: Use HTTPS in production for secure authentication

## Browser Compatibility

- Chrome/Edge (recommended)
- Firefox
- Safari
- Modern browsers with ES6+ support

## Support

For issues or questions:
1. Check browser console for errors
2. Verify API keys are correct
3. Ensure webhook URLs are valid
4. Check network connectivity

## License

This project is provided as-is for personal and commercial use.
