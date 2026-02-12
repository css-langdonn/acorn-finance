# 🌰 Acorn Finance - The Best Finance App

A comprehensive, full-stack finance application with real-time stock analysis, portfolio tracking, webhook integration, and powerful admin controls.

## Features

### For Users
- **Dashboard**: Real-time overview of portfolio, signals, and watchlist
- **Portfolio Tracking**: Track your investments with buy/sell/hold functionality
- **Trading Signals**: AI-powered buy/sell/hold recommendations
- **Watchlist**: Monitor stocks you're interested in
- **Analytics**: Deep insights into portfolio performance
- **Real-time Updates**: WebSocket-powered live updates

### For Admins
- **User Management**: Add, edit, and manage users
- **Webhook Management**: Configure multiple Discord webhooks
- **System Control**: Maintenance mode, system monitoring
- **Signal Management**: View and manage all trading signals

## Tech Stack

- **Backend**: Node.js + Express
- **Frontend**: Vanilla JavaScript (no framework needed!)
- **Real-time**: WebSocket (ws)
- **Storage**: JSON files (easily upgradeable to database)
- **Styling**: Modern CSS with dark theme

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Start the Server

```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

### 3. Access the Application

- Frontend: http://localhost:3000
- WebSocket: ws://localhost:3001
- API: http://localhost:3000/api

### 4. Create Your First Account

1. Go to http://localhost:3000/signup.html
2. Create an account
3. Sign in at http://localhost:3000/login.html
4. Start using Acorn Finance!

## Default Webhook

The default Discord webhook is already configured:
- URL: `https://discord.com/api/webhooks/1471267540033470766/n-6Sp6tcKb3CZL5_MpNz6pUzc6GNRV4vljKXyBgdGNMpY2Vv8bGWIclBTsfVlx8R_RS4`

You can add more webhooks in the Admin Panel.

## Admin Access

- Default admin password: `admin123` (change this in `public/config.js`)
- To make a user admin, edit the user in the Admin Panel

## Project Structure

```
HQ/
├── server.js              # Express backend server
├── package.json           # Dependencies
├── data/                  # JSON data storage
│   ├── users.json
│   ├── webhooks.json
│   ├── signals.json
│   ├── portfolios.json
│   └── watchlists.json
└── public/                # Frontend files
    ├── index.html         # Main dashboard
    ├── login.html         # Sign in page
    ├── signup.html        # Sign up page
    ├── config.js          # Configuration
    ├── api.js             # API client
    ├── app.js             # Main app logic
    └── styles.css         # Styling
```

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Create account
- `POST /api/auth/login` - Sign in

### Webhooks
- `GET /api/webhooks` - Get all webhooks
- `POST /api/webhooks` - Add webhook
- `PUT /api/webhooks/:id` - Update webhook
- `DELETE /api/webhooks/:id` - Delete webhook
- `POST /api/webhooks/:id/test` - Test webhook

### Signals
- `GET /api/signals` - Get all signals
- `POST /api/signals` - Create signal (auto-sends to webhooks)

### Portfolio
- `GET /api/portfolios/:userId` - Get user portfolio
- `POST /api/portfolios/:userId/holdings` - Add holding

### Watchlist
- `GET /api/watchlists/:userId` - Get user watchlist
- `POST /api/watchlists/:userId/symbols` - Add symbol
- `DELETE /api/watchlists/:userId/symbols/:symbol` - Remove symbol

## Webhook Integration

When a new signal is created with confidence >= minConfidence, it automatically:
1. Broadcasts to all WebSocket clients
2. Sends to all enabled webhooks that match the signal type

## Customization

### Change Port
Edit `server.js`:
```javascript
const PORT = process.env.PORT || 3000; // Change 3000 to your port
```

### Change Admin Password
Edit `public/config.js`:
```javascript
adminPassword: 'your-secure-password'
```

### Add More Stock Symbols
Edit `public/config.js`:
```javascript
stockSymbols: ['AAPL', 'GOOGL', ...] // Add more symbols
```

## Production Deployment

1. Set environment variables:
   - `PORT` - Server port
   - `NODE_ENV=production`

2. Use a process manager (PM2):
   ```bash
   npm install -g pm2
   pm2 start server.js --name acorn-finance
   ```

3. Use a reverse proxy (nginx) for HTTPS

4. Set up a database (MongoDB, PostgreSQL) instead of JSON files

## Security Notes

⚠️ **Important**:
- Change default admin password
- Use environment variables for sensitive data
- Implement proper password hashing (currently uses base64)
- Add rate limiting for production
- Use HTTPS in production
- Validate all user inputs

## License

MIT License - Feel free to use and modify!

## Support

For issues or questions, check the browser console (F12) for errors.

---

**Built with ❤️ for the best finance experience**
