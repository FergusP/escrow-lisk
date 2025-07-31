import { ethers } from 'ethers';
import { TypedDataDomain, TypedDataField } from '@ethersproject/abstract-signer';

// EIP-712 Domain
const DOMAIN: TypedDataDomain = {
  name: 'LiskEscrow',
  version: '1',
  chainId: 4202, // Lisk testnet
  verifyingContract: '', // Will be set after deployment
};

// EIP-712 Types
const TYPES = {
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

export class GaslessTransactionService {
  private relayerUrl: string;
  private escrowContract: string;
  private signer: ethers.Signer;

  constructor(relayerUrl: string, escrowContract: string, signer: ethers.Signer) {
    this.relayerUrl = relayerUrl;
    this.escrowContract = escrowContract;
    this.signer = signer;
    DOMAIN.verifyingContract = escrowContract;
  }

  async createEscrow(
    seller: string,
    amount: string,
    token: string,
    deliveryDeadline: number
  ) {
    const userAddress = await this.signer.getAddress();
    const nonce = await this.getNonce(userAddress);

    const message = {
      seller,
      amount,
      token,
      deliveryDeadline,
      nonce,
    };

    const signature = await this.signer._signTypedData(DOMAIN, { CreateEscrow: TYPES.CreateEscrow }, message);

    // Send to relayer
    const response = await fetch(`${this.relayerUrl}/relay/create-escrow`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...message,
        buyer: userAddress,
        signature,
      }),
    });

    return response.json();
  }

  async fundEscrow(escrowId: string) {
    const userAddress = await this.signer.getAddress();
    const nonce = await this.getNonce(userAddress);

    const message = {
      escrowId,
      nonce,
    };

    const signature = await this.signer._signTypedData(DOMAIN, { FundEscrow: TYPES.FundEscrow }, message);

    const response = await fetch(`${this.relayerUrl}/relay/fund-escrow`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        escrowId,
        buyer: userAddress,
        signature,
      }),
    });

    return response.json();
  }

  async confirmDelivery(escrowId: string) {
    const userAddress = await this.signer.getAddress();
    const nonce = await this.getNonce(userAddress);

    const message = {
      escrowId,
      nonce,
    };

    const signature = await this.signer._signTypedData(DOMAIN, { ConfirmDelivery: TYPES.ConfirmDelivery }, message);

    const response = await fetch(`${this.relayerUrl}/relay/confirm-delivery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        escrowId,
        buyer: userAddress,
        signature,
      }),
    });

    return response.json();
  }

  async storeDocument(escrowId: string, documentHash: string) {
    const userAddress = await this.signer.getAddress();
    const nonce = await this.getNonce(userAddress);

    const message = {
      escrowId,
      documentHash,
      nonce,
    };

    const signature = await this.signer._signTypedData(DOMAIN, { StoreDocument: TYPES.StoreDocument }, message);

    const response = await fetch(`${this.relayerUrl}/relay/store-document`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        escrowId,
        documentHash,
        seller: userAddress,
        signature,
      }),
    });

    return response.json();
  }

  private async getNonce(address: string): Promise<number> {
    // Get nonce from contract
    // This would be implemented with contract read
    const response = await fetch(`${this.relayerUrl}/nonce/${address}`);
    const data = await response.json();
    return data.nonce;
  }
}