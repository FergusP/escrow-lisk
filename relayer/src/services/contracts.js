const { createPublicClient, createWalletClient, http, parseAbi, formatEther, publicActions } = require('viem');
const { privateKeyToAccount } = require('viem/accounts');

// Define chain based on environment
const chainId = parseInt(process.env.CHAIN_ID || '31337');
const chain = chainId === 31337 ? {
  id: 31337,
  name: 'Localhost',
  network: 'localhost',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: [process.env.RPC_URL || 'http://localhost:8545'],
    },
  },
} : {
  id: 4202,
  name: 'Lisk Sepolia Testnet',
  network: 'lisk-sepolia',
  nativeCurrency: {
    decimals: 18,
    name: 'Sepolia Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.sepolia-api.lisk.com'],
    },
  },
  blockExplorers: {
    default: { name: 'Explorer', url: 'https://sepolia-blockscout.lisk.com' },
  },
};

// Contract ABIs
const ESCROW_ABI = parseAbi([
  'function nonces(address) view returns (uint256)',
  'function getEscrowDetails(bytes32) view returns (address,address,uint256,uint256,uint8,address,uint256,uint256,bool)',
]);

const RELAYER_ABI = parseAbi([
  'function relayCreateEscrow(address,uint256,address,uint256,address,bytes) returns (bytes32)',
  'function relayFundEscrow(bytes32,address,bytes)',
  'function relayConfirmDelivery(bytes32,address,bytes)',
  'function relayStoreDocument(bytes32,bytes32,address,bytes)',
]);

const USDC_ABI = parseAbi([
  'function balanceOf(address) view returns (uint256)',
  'function allowance(address,address) view returns (uint256)',
]);

class ContractService {
  constructor() {
    // Create account from private key
    this.account = privateKeyToAccount(process.env.RELAYER_PRIVATE_KEY);
    
    // Create public client for reading
    this.publicClient = createPublicClient({
      chain,
      transport: http(process.env.RPC_URL),
    });
    
    // Create wallet client for writing
    this.walletClient = createWalletClient({
      account: this.account,
      chain,
      transport: http(process.env.RPC_URL),
    });
    
    // Store contract addresses
    this.contracts = {
      escrow: process.env.ESCROW_CONTRACT,
      relayer: process.env.RELAYER_CONTRACT,
      usdc: process.env.USDC_CONTRACT,
    };
    
    console.log(`🔗 Connected to relayer wallet: ${this.account.address}`);
  }
  
  async getNonce(address) {
    return await this.publicClient.readContract({
      address: this.contracts.escrow,
      abi: ESCROW_ABI,
      functionName: 'nonces',
      args: [address],
    });
  }
  
  async getEscrowDetails(escrowId) {
    const result = await this.publicClient.readContract({
      address: this.contracts.escrow,
      abi: ESCROW_ABI,
      functionName: 'getEscrowDetails',
      args: [escrowId],
    });
    
    // Destructure the tuple result
    const [buyer, seller, amount, deliveryDeadline, status, token, fundedAt, settledAt, disputeResolved] = result;
    
    return {
      buyer,
      seller,
      amount,
      deliveryDeadline,
      status,
      token,
      fundedAt,
      settledAt,
      disputeResolved,
    };
  }
  
  async getUserBalance(address) {
    return await this.publicClient.readContract({
      address: this.contracts.usdc,
      abi: USDC_ABI,
      functionName: 'balanceOf',
      args: [address],
    });
  }
  
  async getUserAllowance(address) {
    return await this.publicClient.readContract({
      address: this.contracts.usdc,
      abi: USDC_ABI,
      functionName: 'allowance',
      args: [address, this.contracts.escrow],
    });
  }
  
  async getRelayerBalance() {
    return await this.publicClient.getBalance({
      address: this.account.address,
    });
  }
  
  async estimateGas(method, params) {
    try {
      // Map method names to function names
      const methodMap = {
        relayCreateEscrow: 'relayCreateEscrow',
        relayFundEscrow: 'relayFundEscrow',
        relayConfirmDelivery: 'relayConfirmDelivery',
        relayStoreDocument: 'relayStoreDocument',
      };
      
      const functionName = methodMap[method];
      if (!functionName) {
        throw new Error(`Unknown method: ${method}`);
      }
      
      const gas = await this.publicClient.estimateContractGas({
        address: this.contracts.relayer,
        abi: RELAYER_ABI,
        functionName,
        args: params,
        account: this.account,
      });
      
      return gas;
    } catch (error) {
      console.error(`Gas estimation failed for ${method}:`, error);
      throw error;
    }
  }
  
  async executeTransaction(method, params, gasLimit) {
    try {
      // Get current gas price
      const gasPrice = await this.publicClient.getGasPrice();
      const adjustedGasPrice = gasPrice * BigInt(Math.floor((process.env.GAS_PRICE_MULTIPLIER || 1.1) * 100)) / BigInt(100);
      
      // Map method names to function names
      const methodMap = {
        relayCreateEscrow: 'relayCreateEscrow',
        relayFundEscrow: 'relayFundEscrow',
        relayConfirmDelivery: 'relayConfirmDelivery',
        relayStoreDocument: 'relayStoreDocument',
      };
      
      const functionName = methodMap[method];
      if (!functionName) {
        throw new Error(`Unknown method: ${method}`);
      }
      
      // Simulate the transaction first
      let request;
      try {
        const simulation = await this.publicClient.simulateContract({
          address: this.contracts.relayer,
          abi: RELAYER_ABI,
          functionName,
          args: params,
          account: this.account,
          gas: gasLimit,
          gasPrice: adjustedGasPrice,
        });
        request = simulation.request;
      } catch (simError) {
        console.error('❌ Simulation failed:', simError);
        throw simError;
      }
      
      // Execute the transaction
      let hash;
      try {
        hash = await this.walletClient.writeContract(request);
        console.log(`📡 Transaction sent: ${hash}`);
      } catch (writeError) {
        console.error('❌ Write contract failed:', writeError);
        throw writeError;
      }
      
      // Wait for transaction receipt with timeout
      const receipt = await this.publicClient.waitForTransactionReceipt({
        hash,
        confirmations: 1,
        timeout: 10_000, // 10 seconds timeout
      });
      
      console.log(`✅ Transaction confirmed: ${receipt.transactionHash}`);
      console.log(`⛽ Gas used: ${receipt.gasUsed.toString()}`);
      
      return receipt;
    } catch (error) {
      console.error(`Transaction execution failed for ${method}:`, error);
      throw error;
    }
  }
}

module.exports = { ContractService };