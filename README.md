# Lisk Escrow Platform

A blockchain-based escrow platform for secure international trade transactions built on Lisk.

## 🚀 Overview

This platform enables trustless cross-border trade by holding funds in smart contract escrow until delivery is confirmed. Buyers create contracts, sellers fulfill them, and payments are automatically released upon successful delivery verification.

## 🏗 Architecture

```
lisk-escrow/
├── frontend/     # Next.js web application
├── contract/     # Solidity smart contracts
├── indexer/      # Ponder event indexer
```

## 💼 Key Features

- **Secure Escrow**: Funds locked in smart contracts until delivery confirmed
- **Document Verification**: On-chain document hash storage for shipping proof
- **Multi-Wallet Support**: MetaMask, WalletConnect, and email-based wallets
- **Real-time Updates**: Blockchain events indexed for instant UI updates
- **Simple Workflow**: Only 3 fields needed to create a contract

## 🔄 Transaction Flow

1. **Create** → Buyer initiates contract with seller's email
2. **Fund** → Buyer deposits USDC into escrow
3. **Ship** → Seller uploads shipping documents
4. **Release** → Buyer confirms delivery and releases payment

## 🛠 Tech Stack

- **Blockchain**: Lisk (EVM-compatible)
- **Smart Contracts**: Solidity + Foundry
- **Frontend**: Next.js, TypeScript, Wagmi, TailwindCSS
- **Indexer**: Ponder
- **Storage**: Supabase (documents & user data)
- **Deployment**: Vercel (frontend), Railway/Render (indexer)

## 🚦 Getting Started

### Prerequisites

- Node.js 18+
- Foundry (for smart contracts)
- Supabase account
- Wallet with Lisk testnet tokens

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/lisk-escrow.git
cd lisk-escrow

# Install frontend dependencies
cd frontend
npm install

# Install indexer dependencies
cd ../indexer
npm install
```

### Environment Setup

Create `.env.local` in frontend directory:

```env
NEXT_PUBLIC_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=...
```

### Development

```bash
# Run frontend
cd frontend
npm run dev

# Run indexer
cd indexer
ponder dev

# Deploy contracts
cd contract
forge script Deploy --rpc-url $LISK_RPC --broadcast
```

## 📱 User Flows

### For Buyers

1. Connect wallet
2. Create contract (email + PDF + amount)
3. Fund the escrow
4. Review documents when ready
5. Release payment or dispute

### For Sellers

1. Connect wallet
2. See new contracts in dashboard
3. Ship goods
4. Upload shipping documents
5. Receive payment upon confirmation

## 🔐 Security

- Smart contracts hold funds in escrow
- Document hashes stored on-chain for verification
- No centralized control over funds
- Dispute resolution mechanism built-in

Built with ❤️ for the Lisk ecosystem
