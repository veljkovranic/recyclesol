# PumpCleanup Backend API

Simple Express.js backend that caches recent cleanup transactions from the Solana blockchain.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
```

3. Configure environment variables:
- `PORT` - API server port (default: 3001)
- `RPC_ENDPOINT` - Solana RPC endpoint
- `FEE_WALLET` - Fee wallet address to track
- `CACHE_TTL_MS` - Cache TTL in milliseconds (default: 120000)
- `CORS_ORIGIN` - Frontend URL for CORS
- `SPONSOR_PRIVATE_KEY` - (Optional) Private key for gas sponsorship wallet (base58 or JSON array format)

## Gas Sponsorship

The backend can sponsor gas fees for users who have recoverable accounts but insufficient SOL balance.

### Setup
1. Create a new Solana wallet for sponsorship
2. Fund it with a small amount of SOL (0.1 SOL is plenty)
3. Add the private key to `.env` as `SPONSOR_PRIVATE_KEY`

### Limits (configurable in `services/sponsorWallet.ts`)
- Max per transaction: 0.00001 SOL (just gas)
- Max daily: 0.1 SOL
- Min recoverable: 0.01 SOL (only sponsor if user can recover at least this much)

## Development

```bash
npm run dev
```

## Production

```bash
npm run build
npm start
```

## API Endpoints

### GET /health
Health check endpoint.

### GET /api/recent-cleanups
Returns cached recent cleanup transactions.

### GET /api/stats
Returns summary statistics.

### GET /api/sponsor/status
Check if gas sponsorship is enabled and current limits.

### POST /api/sponsor/check
Check if a user qualifies for gas sponsorship.
```json
{
  "userWallet": "...",
  "recoverableAmountLamports": 10000000,
  "estimatedFeeLamports": 5000
}
```

### POST /api/sponsor/sign
Sign a transaction as fee payer (sponsor gas).
```json
{
  "transaction": "base64-encoded-transaction",
  "userWallet": "...",
  "recoverableAmountLamports": 10000000
}
```
Returns a partially signed transaction that the user must also sign.

