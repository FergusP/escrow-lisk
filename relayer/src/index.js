const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { RateLimiterMemory } = require('rate-limiter-flexible');
require('dotenv').config();

const { RelayerService } = require('./services/relayer');
const { ContractService } = require('./services/contracts');

const app = express();
const PORT = process.env.PORT || 3001;

// Rate limiter - 100 requests per hour per IP
const rateLimiter = new RateLimiterMemory({
  points: process.env.RATE_LIMIT || 100,
  duration: 3600, // 1 hour
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

// API Key middleware (optional but recommended)
app.use((req, res, next) => {
  // Skip API key check for health endpoint
  if (req.path === '/health') return next();
  
  const apiKey = req.headers['x-api-key'];
  if (process.env.API_KEY && apiKey !== process.env.API_KEY) {
    return res.status(401).json({ error: 'Invalid API key' });
  }
  next();
});

// Rate limiting middleware
app.use(async (req, res, next) => {
  try {
    await rateLimiter.consume(req.ip);
    next();
  } catch (rejRes) {
    res.status(429).json({
      error: 'Too many requests',
      retryAfter: Math.round(rejRes.msBeforeNext / 1000),
    });
  }
});

// Initialize services
const contractService = new ContractService();
const relayerService = new RelayerService(contractService);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Get user nonce
app.get('/nonce/:address', async (req, res) => {
  try {
    const { address } = req.params;
    
    if (!address.match(/^0x[a-fA-F0-9]{40}$/)) {
      return res.status(400).json({ error: 'Invalid address format' });
    }
    
    const nonce = await contractService.getNonce(address);
    res.json({ nonce: nonce.toString() });
  } catch (error) {
    console.error('Get nonce error:', error);
    res.status(500).json({ error: 'Failed to get nonce' });
  }
});

// Relay create escrow transaction
app.post('/relay/create-escrow', async (req, res) => {
  try {
    const { seller, amount, token, deliveryDeadline, buyer, signature } = req.body;
    
    // Validate input
    if (!seller || !amount || !token || !deliveryDeadline || !buyer || !signature) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const result = await relayerService.relayCreateEscrow({
      seller,
      amount,
      token,
      deliveryDeadline,
      buyer,
      signature,
    });
    
    res.json(result);
  } catch (error) {
    console.error('Create escrow relay error:', error);
    res.status(500).json({ 
      error: 'Failed to relay transaction',
      details: error.message,
    });
  }
});

// Relay fund escrow transaction
app.post('/relay/fund-escrow', async (req, res) => {
  try {
    const { escrowId, buyer, signature } = req.body;
    
    if (!escrowId || !buyer || !signature) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const result = await relayerService.relayFundEscrow({
      escrowId,
      buyer,
      signature,
    });
    
    res.json(result);
  } catch (error) {
    console.error('Fund escrow relay error:', error);
    res.status(500).json({ 
      error: 'Failed to relay transaction',
      details: error.message,
    });
  }
});

// Relay confirm delivery transaction
app.post('/relay/confirm-delivery', async (req, res) => {
  try {
    const { escrowId, buyer, signature } = req.body;
    
    if (!escrowId || !buyer || !signature) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const result = await relayerService.relayConfirmDelivery({
      escrowId,
      buyer,
      signature,
    });
    
    res.json(result);
  } catch (error) {
    console.error('Confirm delivery relay error:', error);
    res.status(500).json({ 
      error: 'Failed to relay transaction',
      details: error.message,
    });
  }
});

// Relay store document transaction
app.post('/relay/store-document', async (req, res) => {
  try {
    const { escrowId, documentHash, seller, signature } = req.body;
    
    if (!escrowId || !documentHash || !seller || !signature) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const result = await relayerService.relayStoreDocument({
      escrowId,
      documentHash,
      seller,
      signature,
    });
    
    res.json(result);
  } catch (error) {
    console.error('Store document relay error:', error);
    res.status(500).json({ 
      error: 'Failed to relay transaction',
      details: error.message,
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Lisk Escrow Relayer running on port ${PORT}`);
  console.log(`📡 RPC URL: ${process.env.RPC_URL}`);
  console.log(`🔒 CORS Origin: ${process.env.CORS_ORIGIN}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down relayer service...');
  process.exit(0);
});