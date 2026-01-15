# PumpCleanup Twitter Bot

A Twitter bot that scans Solana wallets for reclaimable rent when mentioned with a wallet address.

## How It Works

1. The bot monitors for tweets that mention it
2. When mentioned, it looks for a Solana wallet address in the tweet
3. It scans the wallet for empty token accounts
4. Replies with the number of accounts and estimated SOL to reclaim

## Example Usage

Tweet at the bot:
```
@pumpcleanup Check my wallet 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU
```

Bot replies:
```
🧹 Found 15 empty token accounts to cleanup!

💰 Reclaim ~0.0306 SOL

🔗 Clean up at https://pumpcleanup.com
```

## Setup

### 1. Create Twitter Developer Account

1. Go to [Twitter Developer Portal](https://developer.twitter.com/en/portal/dashboard)
2. Create a new Project and App
3. Set your app permissions to **Read and Write**
4. Generate the following credentials:
   - API Key and Secret
   - Access Token and Secret
   - Bearer Token

### 2. Configure Environment

Copy the example environment file:
```bash
cp env.example .env
```

Fill in your credentials:
```env
TWITTER_API_KEY=your_api_key_here
TWITTER_API_SECRET=your_api_secret_here
TWITTER_ACCESS_TOKEN=your_access_token_here
TWITTER_ACCESS_SECRET=your_access_secret_here
TWITTER_BEARER_TOKEN=your_bearer_token_here
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Run the Bot

Development mode (with hot reload):
```bash
npm run dev
```

Production mode:
```bash
npm run build
npm start
```

## Configuration Options

| Variable | Description | Default |
|----------|-------------|---------|
| `SOLANA_RPC_ENDPOINT` | Solana RPC URL | `https://api.mainnet-beta.solana.com` |
| `POLL_INTERVAL_MS` | How often to check mentions (ms) | `60000` (1 minute) |
| `WEBSITE_URL` | URL to include in replies | `https://pumpcleanup.com` |

## Rate Limits

Twitter API has rate limits. The bot handles these gracefully:
- Mentions endpoint: 180 requests per 15 minutes (user auth)
- Reply endpoint: 200 tweets per 15 minutes

The default 60-second poll interval stays well within these limits.

## Deployment

### Using PM2

```bash
npm install -g pm2
npm run build
pm2 start dist/index.js --name pumpcleanup-bot
pm2 save
```

### Using Docker

Create a `Dockerfile`:
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
CMD ["node", "dist/index.js"]
```

Build and run:
```bash
npm run build
docker build -t pumpcleanup-bot .
docker run -d --env-file .env pumpcleanup-bot
```

## License

MIT

