const { parseEther, keccak256, toHex, stringToHex, verifyTypedData, getAddress } = require('viem');

class RelayerService {
  constructor(contractService) {
    this.contracts = contractService;
    
    // EIP-712 domain
    this.domain = {
      name: 'LiskEscrow',
      version: '1',
      chainId: parseInt(process.env.CHAIN_ID || '31337'), // Default to localhost
      verifyingContract: process.env.ESCROW_CONTRACT,
    };
    
    // EIP-712 types
    this.types = {
      CreateEscrow: [
        { name: 'seller', type: 'address' },
        { name: 'amount', type: 'uint256' },
        { name: 'token', type: 'address' },
        { name: 'deliveryDeadline', type: 'uint256' },
        { name: 'nonce', type: 'uint256' },
      ],
      FundEscrow: [
        { name: 'escrowId', type: 'bytes32' },
        { name: 'nonce', type: 'uint256' },
      ],
      ConfirmDelivery: [
        { name: 'escrowId', type: 'bytes32' },
        { name: 'nonce', type: 'uint256' },
      ],
      StoreDocument: [
        { name: 'escrowId', type: 'bytes32' },
        { name: 'documentHash', type: 'bytes32' },
        { name: 'nonce', type: 'uint256' },
      ],
    };
  }
  
  async relayCreateEscrow(params) {
    const { seller, amount, token, deliveryDeadline, buyer, signature } = params;
    
    console.log(`📝 Creating escrow for buyer: ${buyer}`);
    
    // Validate signature format
    if (!signature.startsWith('0x') || signature.length !== 132) {
      throw new Error('Invalid signature format');
    }
    
    // Get nonce
    const nonce = await this.contracts.getNonce(buyer);
    
    // Verify signature
    const message = {
      seller: getAddress(seller),
      amount: BigInt(amount),
      token: getAddress(token),
      deliveryDeadline: BigInt(deliveryDeadline),
      nonce: BigInt(nonce),
    };
    
    const isValid = await verifyTypedData({
      address: buyer,
      domain: this.domain,
      types: { CreateEscrow: this.types.CreateEscrow },
      primaryType: 'CreateEscrow',
      message,
      signature,
    });
    
    if (!isValid) {
      throw new Error('Invalid signature');
    }
    
    console.log(`✅ Signature verified for buyer: ${buyer}`);
    
    // Check relayer balance
    const balance = await this.contracts.getRelayerBalance();
    if (balance < parseEther('0.01')) {
      throw new Error('Relayer balance too low');
    }
    
    // Estimate gas
    const gasLimit = await this.contracts.estimateGas('relayCreateEscrow', [
      seller,
      amount,
      token,
      deliveryDeadline,
      buyer,
      signature,
    ]);
    
    // Execute transaction
    const receipt = await this.contracts.executeTransaction(
      'relayCreateEscrow',
      [seller, amount, token, deliveryDeadline, buyer, signature],
      gasLimit
    );
    
    console.log(`📦 Transaction receipt received`);
    console.log(`   Logs count: ${receipt.logs.length}`);
    
    // Extract escrow ID from logs
    let escrowId;
    try {
      escrowId = this.extractEscrowIdFromLogs(receipt.logs);
    } catch (error) {
      console.error('Failed to extract escrow ID:', error);
      // Fallback: return transaction hash as temporary ID
      escrowId = receipt.transactionHash;
    }
    
    return {
      success: true,
      escrowId,
      transactionHash: receipt.transactionHash,
      gasUsed: receipt.gasUsed.toString(),
    };
  }
  
  async relayFundEscrow(params) {
    const { escrowId, buyer, signature } = params;
    
    console.log(`💰 Funding escrow: ${escrowId}`);
    
    // Get nonce
    const nonce = await this.contracts.getNonce(buyer);
    
    // Verify signature
    const message = {
      escrowId,
      nonce: BigInt(nonce),
    };
    
    const isValid = await verifyTypedData({
      address: buyer,
      domain: this.domain,
      types: { FundEscrow: this.types.FundEscrow },
      primaryType: 'FundEscrow',
      message,
      signature,
    });
    
    if (!isValid) {
      throw new Error('Invalid signature');
    }
    
    console.log(`✅ Signature verified for buyer: ${buyer}`);
    
    // Check user has sufficient USDC balance
    const escrowDetails = await this.contracts.getEscrowDetails(escrowId);
    const userBalance = await this.contracts.getUserBalance(buyer);
    const userAllowance = await this.contracts.getUserAllowance(buyer);
    
    if (userBalance < escrowDetails.amount) {
      throw new Error('Insufficient USDC balance');
    }
    
    if (userAllowance < escrowDetails.amount) {
      throw new Error('Insufficient USDC allowance');
    }
    
    // Estimate gas
    const gasLimit = await this.contracts.estimateGas('relayFundEscrow', [
      escrowId,
      buyer,
      signature,
    ]);
    
    // Execute transaction
    const receipt = await this.contracts.executeTransaction(
      'relayFundEscrow',
      [escrowId, buyer, signature],
      gasLimit
    );
    
    return {
      success: true,
      transactionHash: receipt.transactionHash,
      gasUsed: receipt.gasUsed.toString(),
    };
  }
  
  async relayConfirmDelivery(params) {
    const { escrowId, buyer, signature } = params;
    
    console.log(`✅ Confirming delivery: ${escrowId}`);
    
    // Get nonce
    const nonce = await this.contracts.getNonce(buyer);
    
    // Verify signature
    const message = {
      escrowId,
      nonce: BigInt(nonce),
    };
    
    const isValid = await verifyTypedData({
      address: buyer,
      domain: this.domain,
      types: { ConfirmDelivery: this.types.ConfirmDelivery },
      primaryType: 'ConfirmDelivery',
      message,
      signature,
    });
    
    if (!isValid) {
      throw new Error('Invalid signature');
    }
    
    console.log(`✅ Signature verified for buyer: ${buyer}`);
    
    // Estimate gas
    const gasLimit = await this.contracts.estimateGas('relayConfirmDelivery', [
      escrowId,
      buyer,
      signature,
    ]);
    
    // Execute transaction
    const receipt = await this.contracts.executeTransaction(
      'relayConfirmDelivery',
      [escrowId, buyer, signature],
      gasLimit
    );
    
    return {
      success: true,
      transactionHash: receipt.transactionHash,
      gasUsed: receipt.gasUsed.toString(),
    };
  }
  
  async relayStoreDocument(params) {
    const { escrowId, documentHash, seller, signature } = params;
    
    console.log(`📄 Storing document for escrow: ${escrowId}`);
    
    // Validate document hash
    if (!documentHash.startsWith('0x') || documentHash.length !== 66) {
      throw new Error('Invalid document hash format');
    }
    
    // Get nonce
    const nonce = await this.contracts.getNonce(seller);
    
    // Verify signature
    const message = {
      escrowId,
      documentHash,
      nonce: BigInt(nonce),
    };
    
    const isValid = await verifyTypedData({
      address: seller,
      domain: this.domain,
      types: { StoreDocument: this.types.StoreDocument },
      primaryType: 'StoreDocument',
      message,
      signature,
    });
    
    if (!isValid) {
      throw new Error('Invalid signature');
    }
    
    console.log(`✅ Signature verified for seller: ${seller}`);
    
    // Estimate gas
    const gasLimit = await this.contracts.estimateGas('relayStoreDocument', [
      escrowId,
      documentHash,
      seller,
      signature,
    ]);
    
    // Execute transaction
    const receipt = await this.contracts.executeTransaction(
      'relayStoreDocument',
      [escrowId, documentHash, seller, signature],
      gasLimit
    );
    
    return {
      success: true,
      transactionHash: receipt.transactionHash,
      gasUsed: receipt.gasUsed.toString(),
    };
  }
  
  extractEscrowIdFromLogs(logs) {
    // Look for EscrowCreated event log
    for (const log of logs) {
      if (log.topics && log.topics.length > 0) {
        // EscrowCreated event signature
        const eventSig = keccak256(toHex('EscrowCreated(bytes32,address,address,uint256,uint256)'));
        if (log.topics[0] === eventSig) {
          return log.topics[1]; // escrowId is the first indexed parameter
        }
      }
    }
    
    throw new Error('EscrowCreated event not found in transaction logs');
  }
}

module.exports = { RelayerService };