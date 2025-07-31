# Dashboard Routes - Contract Data Requirements

## Overview

This document outlines what data from the smart contract is needed for each dashboard route. Keep it simple - only essential contract data.

## Contract Flow

1. **Buyer creates contract** → fills seller email, amount, details
2. **Seller receives notification** → sees new contract in dashboard
3. **Contract Status Flow**:
   - `CREATED` - Contract created by buyer, waiting for funding
   - `FUNDED` - Buyer has deposited funds to escrow
   - `DOCUMENTS_PENDING` - Shipped, waiting for delivery documents
   - `SETTLED` - Delivery confirmed, funds released to seller

## Routes and Required Contract Data

### 1. `/dashboard` - Main Dashboard

**Purpose**: Overview of user's escrow activity

**Data Source**: Ponder indexer (listening to contract events)

**Events Indexed by Ponder**:

```solidity
event EscrowCreated(bytes32 indexed escrowId, address indexed buyer, address indexed seller, uint256 amount, uint256 deliveryDeadline)
event EscrowFunded(bytes32 indexed escrowId, uint256 timestamp)
event DocumentsUploaded(bytes32 indexed escrowId, bytes32 documentHash, uint256 timestamp)
event DeliveryConfirmed(bytes32 indexed escrowId, uint256 timestamp)
event PaymentReleased(bytes32 indexed escrowId, address recipient, uint256 amount)
event EscrowCancelled(bytes32 indexed escrowId)
event DisputeInitiated(bytes32 indexed escrowId, address initiator)
```

**Ponder API Query**:

```typescript
// Get all escrows for a user (as buyer OR seller)
const userEscrows = await ponder.query({
  where: {
    OR: [{ buyer: userAddress }, { seller: userAddress }],
  },
});
```

**Display Data**:

- Total active escrows (filter by status)
- Total completed escrows (status: SETTLED)
- Total volume (sum of amounts)
- Recent activity list (sorted by timestamp)
- Separate sections for "As Buyer" and "As Seller"
- **For Sellers**: New contracts (status: CREATED) appear automatically

### 2. `/contracts` - Contract List

**Purpose**: List all user's escrow contracts

**Data Source**: Ponder indexer (same events as dashboard)

**Ponder API Query**:

```typescript
// Get paginated escrows with filters
const contracts = await ponder.query({
  where: {
    OR: [{ buyer: userAddress }, { seller: userAddress }],
    status: filterStatus, // optional filter
  },
  orderBy: { createdAt: 'desc' },
  limit: 20,
  offset: page * 20,
});
```

**Display Data**:

- Contract ID
- Role (Buyer/Seller)
- Counterparty address
- Amount
- Status
- Created date
- Delivery deadline

### 3. `/contracts/new` - Create New Contract (Buyer Flow)

**Purpose**: Buyer creates a new escrow contract

**Frontend Form Inputs**:

- Seller's email address
- Purchase Order document (PDF)
- Contract amount (USDC only)

**Backend Process**:

1. Lookup seller's wallet address by email (or send invite if new user)
2. Call smart contract:

```solidity
createEscrow(
    address seller,
    uint256 amount,
    uint256 deliveryDeadline
) returns (bytes32 escrowId)
```

**After Creation**:

- Status: `CREATED`
- Buyer sees "Fund Contract" button
- Seller sees new contract in their dashboard automatically (via Ponder indexing)

### 4. `/transactions` - Transaction History

**Purpose**: Show all blockchain transactions

**Data Source**: Ponder indexer transaction history

**Ponder API Query**:

```typescript
// Get all transactions for user
const transactions = await ponder.query({
  table: 'transactions',
  where: {
    OR: [{ from: userAddress }, { to: userAddress }],
  },
  orderBy: { timestamp: 'desc' },
});
```

**Display Data**:

- Transaction type (Create, Fund, Confirm, Release, Dispute)
- Amount
- Date/time
- Transaction hash
- Status

### 5. `/invoices` - Invoice Management

**Purpose**: Generate invoices for completed escrows

**Data Source**: Ponder indexer (filtered by status)

**Ponder API Query**:

```typescript
// Get completed escrows where user is seller
const completedSales = await ponder.query({
  where: {
    seller: userAddress,
    status: 'COMPLETED',
  },
  orderBy: { completedAt: 'desc' },
});
```

**Off-chain Data**:

- Invoice number (generated)
- Tax calculations
- PDF generation
- Invoice metadata

### 6. `/compliance` - Document Storage

**Purpose**: Store trade documents on-chain (hashes only)

**Contract Functions Needed**:

```solidity
// Store document hash
storeDocumentHash(bytes32 escrowId, bytes32 documentHash)

// Verify document
verifyDocumentHash(bytes32 escrowId, bytes32 documentHash) returns (bool exists, uint256 timestamp)

// Get all document hashes for escrow
getDocumentHashes(bytes32 escrowId) returns (bytes32[] hashes)
```

**Display Data**:

- Document name (off-chain)
- Upload date
- Verification status
- Associated contract

### 7. `/taxes` - Tax Calculator

**Purpose**: Estimate taxes for trades

**Data Source**: Ponder indexer with date filtering

**Ponder API Query**:

```typescript
// Get completed trades in tax period
const taxableTrades = await ponder.query({
  where: {
    OR: [{ buyer: userAddress }, { seller: userAddress }],
    status: 'COMPLETED',
    completedAt: {
      gte: startDate,
      lte: endDate,
    },
  },
});
```

**Off-chain Calculations**:

- Import/export duties
- VAT estimates
- Country-specific rates

### 8. `/support` - Help Center

**Purpose**: Support tickets and help

**Contract Functions Needed**:

- None (fully off-chain)

**Off-chain Data**:

- Support tickets
- FAQ content
- Contact forms

### 9. `/contracts/[id]` - Contract Detail Page

**Purpose**: View detailed contract information and take actions

**Data Source**: Ponder indexer for contract details

**Display Data**:

- Contract parties (buyer/seller info)
- Contract amount and status
- Uploaded documents with download links
- Timeline of events
- Purchase Order document

**Buyer Actions** (when status = DOCUMENTS_PENDING):

- **Release Funds** button → calls `confirmDelivery()`
- **Reject Documents** button → calls `initiateDispute()`

## Summary of Architecture

### Data Flow

1. **Smart Contract** emits events for all state changes
2. **Ponder** listens to events and indexes them into a queryable database
3. **Frontend** queries Ponder API instead of calling contract read functions
4. **Frontend** calls contract write functions directly for user actions

### Core Contract Write Functions (Called from Frontend)

```solidity
1. createEscrow(address seller, uint256 amount, uint256 deadline) returns (bytes32)
2. fundEscrow(bytes32 escrowId) payable
3. confirmDelivery(bytes32 escrowId)
4. storeDocumentHash(bytes32 escrowId, bytes32 hash)
5. initiateDispute(bytes32 escrowId, string reason)
```

### Essential Events (Indexed by Ponder)

```solidity
1. EscrowCreated(escrowId, buyer, seller, amount, deadline)
2. EscrowFunded(escrowId, timestamp)
3. DocumentsUploaded(escrowId, documentHash, timestamp)
4. DeliveryConfirmed(escrowId, timestamp)
5. PaymentReleased(escrowId, recipient, amount)
6. DisputeInitiated(escrowId, initiator, reason)
```

### Status Flow

```
CREATED → FUNDED → DOCUMENTS_PENDING → SETTLED
   ↓         ↓              ↓
CANCELLED  DISPUTED      DISPUTED
```

### Benefits of Using Ponder

- No need for complex contract read functions
- Fast queries with filtering and pagination
- Historical data readily available
- Reduced RPC calls and gas costs
- Better UX with instant data updates

## Notes

- Keep contract simple - only store essential data on-chain
- Use events for transaction history instead of storing arrays
- Store metadata (descriptions, notes, etc.) off-chain
- Contract amounts should be in smallest unit (wei for ETH, 6 decimals for USDC)
