# Lisk Escrow Relayer Service

A Node.js service that enables gasless transactions for the Lisk Escrow platform by relaying user-signed meta-transactions.

## How It Works

1. **Users** sign transactions off-chain (no gas needed)
2. **Frontend** sends signed messages to this relayer service
3. **Relayer** verifies signatures and executes transactions on-chain
4. **Relayer** pays all gas fees on behalf of users

## Setup

### Install Dependencies

```bash
npm install
```

### Environment Configuration

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Fill in your configuration:
```env
RELAYER_PRIVATE_KEY=your_relayer_wallet_private_key
RPC_URL=https://rpc.sepolia-api.lisk.com
ESCROW_CONTRACT=0x...
RELAYER_CONTRACT=0x...
USDC_CONTRACT=0x...
```

### Fund Relayer Wallet

The relayer wallet needs native tokens (ETH) to pay for gas:

```bash
# Check relayer balance
cast balance $RELAYER_ADDRESS --rpc-url $RPC_URL

# Send funds to relayer (from your funded wallet)
cast send $RELAYER_ADDRESS --value 0.1ether --rpc-url $RPC_URL --private-key $YOUR_PRIVATE_KEY
```

## Running the Service

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

The service will run on port 3001 by default.

## API Endpoints

### Health Check
```
GET /health
```

### Get User Nonce
```
GET /nonce/:address
```

### Relay Transactions

#### Create Escrow
```
POST /relay/create-escrow
{
  "seller": "0x...",
  "amount": "1000000000",
  "token": "0x...",
  "deliveryDeadline": 1234567890,
  "buyer": "0x...",
  "signature": "0x..."
}
```

#### Fund Escrow
```
POST /relay/fund-escrow
{
  "escrowId": "0x...",
  "buyer": "0x...",
  "signature": "0x..."
}
```

#### Confirm Delivery
```
POST /relay/confirm-delivery
{
  "escrowId": "0x...",
  "buyer": "0x...",
  "signature": "0x..."
}
```

#### Store Document
```
POST /relay/store-document
{
  "escrowId": "0x...",
  "documentHash": "0x...",
  "seller": "0x...",
  "signature": "0x..."
}
```

## Security Features

- **Rate Limiting**: 100 requests per hour per IP
- **Signature Verification**: All signatures verified on-chain
- **CORS Protection**: Only allows requests from configured origins
- **Input Validation**: All inputs validated before processing
- **Gas Estimation**: Prevents failed transactions
- **Balance Checks**: Ensures sufficient funds before execution

## Monitoring

The service logs important events:

- Transaction submissions and confirmations
- Gas usage for each transaction
- Error conditions and failures
- Relayer wallet balance warnings

## Deployment

### Using PM2 (Recommended)

```bash
npm install -g pm2
cp .env.example .env
# Configure your .env file
pm2 start src/index.js --name "escrow-relayer"
pm2 save
pm2 startup
```

### Using Docker

```bash
docker build -t escrow-relayer .
docker run -d --env-file .env -p 3001:3001 escrow-relayer
```

## Cost Management

### Gas Usage Estimates

- Create Escrow: ~150,000 gas
- Fund Escrow: ~100,000 gas  
- Confirm Delivery: ~120,000 gas
- Store Document: ~80,000 gas

### Daily Cost Example (100 transactions)

- Gas Price: 20 gwei
- Total Gas: 100 × 112,500 avg = 11,250,000 gas
- Daily Cost: 11.25M × 20 gwei = 0.225 ETH (~$400)

## Maintenance

- Monitor relayer wallet balance
- Set up alerts for low balance
- Regularly update gas price multiplier
- Monitor transaction success rates
- Implement automatic balance top-ups