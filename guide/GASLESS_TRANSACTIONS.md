# Gasless Transactions Implementation

## Overview

This escrow platform implements gasless transactions so users don't need to pay for gas. All transaction fees are sponsored by the platform through a relayer service.

## Architecture

### 1. Smart Contract Components

- **LiskEscrow.sol**: Main escrow contract with meta-transaction support
- **MockUSDC.sol**: Test USDC token with faucet functionality
- **EscrowRelayer.sol**: Relayer contract that forwards meta-transactions

### 2. How It Works

1. **User Signs Message**: User signs transaction data off-chain (no gas needed)
2. **Send to Relayer**: Frontend sends signed message to relayer service
3. **Relayer Executes**: Relayer verifies signature and executes on-chain
4. **Relayer Pays Gas**: All gas costs are paid by the relayer

## Key Components

### Trusted Forwarder

The `trustedForwarder` is the only address allowed to submit meta-transactions on behalf of users:

- Prevents unauthorized parties from executing transactions
- Set to the EscrowRelayer contract address
- Can be updated by contract owner if needed

### EIP-712 Signatures

We use EIP-712 typed data signatures for security:

```solidity
// User signs structured data like this:
CreateEscrow {
    seller: address,
    amount: uint256,
    token: address,
    deliveryDeadline: uint256,
    nonce: uint256
}
```

### Nonce Management

Each user has a nonce to prevent replay attacks:

- Incremented with each transaction
- Stored in the escrow contract
- Checked during signature verification

## Frontend Integration

```typescript
// Initialize gasless service
const gaslessService = new GaslessTransactionService(
  RELAYER_URL,
  ESCROW_CONTRACT,
  signer
);

// Create escrow without paying gas
const escrowId = await gaslessService.createEscrow(
  sellerAddress,
  amount,
  usdcAddress,
  deadline
);

// Fund escrow without paying gas
await gaslessService.fundEscrow(escrowId);
```

## MockUSDC Features

### Faucet Function

Users can claim free USDC for testing:

```solidity
// Claim 1000 USDC (once per day)
usdc.faucet();
```

### Approve and Call

Combines approval and contract call in one transaction:

```solidity
// Approve escrow and fund in one tx
usdc.approveAndCall(
  escrowAddress,
  amount,
  abi.encodeWithSelector(escrow.fundEscrow.selector, escrowId)
);
```

## Relayer Service Setup

The relayer service (not included in this repo) should:

1. Accept signed messages via REST API
2. Verify signatures match expected format
3. Check user hasn't exceeded rate limits
4. Submit transaction to blockchain
5. Return transaction hash to frontend

## Security Considerations

1. **Signature Verification**: All signatures verified on-chain
2. **Nonce Protection**: Prevents replay attacks
3. **Trusted Forwarder**: Only authorized relayer can submit
4. **Rate Limiting**: Implement in relayer service
5. **Balance Checks**: Ensure users have sufficient USDC

## Cost Analysis

### Who Pays What:

- **Users**: Pay 0 gas fees
- **Platform**: Pays all gas costs through relayer
- **Revenue**: Platform earns from successful trades (removed per request)

### Estimated Gas Costs:

- Create Escrow: ~150,000 gas
- Fund Escrow: ~100,000 gas
- Upload Document: ~80,000 gas
- Confirm Delivery: ~120,000 gas

## Testing Gasless Transactions

1. Deploy contracts with test script
2. Fund relayer with native tokens for gas
3. Users claim USDC from faucet
4. Test all escrow functions without paying gas

## Benefits

1. **Better UX**: Users don't need native tokens
2. **Onboarding**: Easier for new blockchain users
3. **Predictable Costs**: Platform controls all gas expenses
4. **Security**: Meta-transactions are cryptographically secure