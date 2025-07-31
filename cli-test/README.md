# Lisk Escrow CLI Test Tool

Interactive CLI tool for testing the Lisk Escrow smart contracts and gasless transactions.

## Prerequisites

1. Make sure Anvil is running:
   ```bash
   anvil
   ```

2. Deploy contracts (if not already deployed):
   ```bash
   cd ../contract
   forge script script/Deploy.s.sol --rpc-url http://localhost:8545 --broadcast
   ```

3. Start the relayer service:
   ```bash
   cd ../relayer
   npm start
   ```

## Installation

```bash
cd cli-test
npm install
```

## Usage

```bash
npm start
```

## Features

- 💰 Get USDC from faucet
- 📊 Check ETH and USDC balances
- ✅ Approve USDC spending
- 📝 Create new escrow contracts
- 💸 Fund escrows
- 📄 Store documents
- ✅ Confirm delivery
- 🔍 Check escrow details
- ⚡ Test gasless transactions
- 🔄 Switch between buyer/seller accounts

## Test Flow

1. Select buyer account
2. Get USDC from faucet
3. Approve escrow contract
4. Create new escrow
5. Fund the escrow
6. Switch to seller account
7. Store document
8. Switch back to buyer
9. Confirm delivery

## Test Accounts

- **Buyer**: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8
- **Seller**: 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC

Both accounts have ETH from Anvil for gas fees.