import { createPublicClient, createWalletClient, http, formatEther, parseEther, parseAbi, keccak256, encodePacked } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

// Chain configuration
const localhost = {
  id: 31337,
  name: 'Localhost',
  network: 'localhost',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: { http: ['http://localhost:8545'] },
  },
};

// Contract addresses
const CONTRACTS = {
  USDC: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
  ESCROW: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
  RELAYER: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
};

// ABIs
const USDC_ABI = parseAbi([
  'function balanceOf(address) view returns (uint256)',
  'function faucet()',
  'function approve(address,uint256) returns (bool)',
  'function allowance(address,address) view returns (uint256)',
]);

const ESCROW_ABI = parseAbi([
  'function createEscrow(address,uint256,address,uint256) returns (bytes32)',
  'function fundEscrow(bytes32)',
  'function confirmDelivery(bytes32)',
  'function storeDocumentHash(bytes32,bytes32)',
  'function getEscrowDetails(bytes32) view returns (address,address,uint256,uint256,uint8,address,uint256,uint256,bool)',
  'function startDispute(bytes32,string)',
  'event EscrowCreated(bytes32 indexed escrowId, address indexed buyer, address indexed seller, uint256 amount, uint256 deliveryDeadline)',
  'event EscrowFunded(bytes32 indexed escrowId, uint256 fundedAt)',
]);

// Test accounts
const ACCOUNTS = {
  buyer: {
    address: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
    privateKey: '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d',
  },
  seller: {
    address: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
    privateKey: '0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a',
  },
};

class EscrowCLI {
  constructor() {
    this.publicClient = createPublicClient({
      chain: localhost,
      transport: http(),
    });
    
    this.currentAccount = null;
    this.walletClient = null;
    this.escrowId = null;
  }

  async start() {
    console.clear();
    console.log(chalk.blue.bold('🔐 Lisk Escrow CLI Test Tool\n'));
    
    await this.selectAccount();
    await this.mainMenu();
  }

  async selectAccount() {
    const { account } = await inquirer.prompt([
      {
        type: 'list',
        name: 'account',
        message: 'Select test account:',
        choices: [
          { name: 'Buyer (0x7099...79C8)', value: 'buyer' },
          { name: 'Seller (0x3C44...293BC)', value: 'seller' },
        ],
      },
    ]);

    this.currentAccount = ACCOUNTS[account];
    const privateAccount = privateKeyToAccount(this.currentAccount.privateKey);
    
    this.walletClient = createWalletClient({
      account: privateAccount,
      chain: localhost,
      transport: http(),
    });

    console.log(chalk.green(`✓ Selected ${account} account: ${this.currentAccount.address}\n`));
  }

  async mainMenu() {
    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'What would you like to do?',
        choices: [
          { name: '💰 Get USDC from faucet', value: 'faucet' },
          { name: '📊 Check balances', value: 'balance' },
          { name: '📋 List my escrows', value: 'list' },
          { name: '✅ Approve USDC spending', value: 'approve' },
          { name: '📝 Create new escrow', value: 'create' },
          { name: '💸 Fund escrow', value: 'fund' },
          { name: '📄 Store document', value: 'document' },
          { name: '✅ Confirm delivery', value: 'confirm' },
          { name: '🔍 Check escrow details', value: 'details' },
          { name: '⚡ Test gasless transaction', value: 'gasless' },
          { name: '🔄 Switch account', value: 'switch' },
          { name: '❌ Exit', value: 'exit' },
        ],
      },
    ]);

    switch (action) {
      case 'faucet':
        await this.getFaucet();
        break;
      case 'balance':
        await this.checkBalance();
        break;
      case 'list':
        await this.listEscrows();
        break;
      case 'approve':
        await this.approveUSDC();
        break;
      case 'create':
        await this.createEscrow();
        break;
      case 'fund':
        await this.fundEscrow();
        break;
      case 'document':
        await this.storeDocument();
        break;
      case 'confirm':
        await this.confirmDelivery();
        break;
      case 'details':
        await this.checkEscrowDetails();
        break;
      case 'gasless':
        await this.testGasless();
        break;
      case 'switch':
        await this.selectAccount();
        await this.mainMenu();
        return;
      case 'exit':
        console.log(chalk.yellow('\nGoodbye! 👋'));
        process.exit(0);
    }

    await this.continuePrompt();
  }

  async getFaucet() {
    const spinner = ora('Getting USDC from faucet...').start();
    
    try {
      const hash = await this.walletClient.writeContract({
        address: CONTRACTS.USDC,
        abi: USDC_ABI,
        functionName: 'faucet',
      });
      
      await this.publicClient.waitForTransactionReceipt({ hash });
      
      spinner.succeed(chalk.green('Got 1000 USDC from faucet!'));
      console.log(chalk.gray(`Transaction: ${hash}`));
    } catch (error) {
      spinner.fail(chalk.red('Failed to get USDC'));
      console.error(chalk.red(error.message));
    }
  }

  async listEscrows() {
    const spinner = ora('Fetching escrows...').start();
    
    try {
      // Get all EscrowCreated events where current account is buyer or seller
      const createdLogs = await this.publicClient.getLogs({
        address: CONTRACTS.ESCROW,
        event: parseAbi(['event EscrowCreated(bytes32 indexed escrowId, address indexed buyer, address indexed seller, uint256 amount, uint256 deliveryDeadline)'])[0],
        fromBlock: 0n,
        toBlock: 'latest',
      });
      
      // Filter for escrows involving current account
      const myEscrows = [];
      const statusNames = ['Created', 'Funded', 'Documents Pending', 'Settled', 'Disputed', 'Refunded'];
      
      for (const log of createdLogs) {
        const buyer = log.args.buyer;
        const seller = log.args.seller;
        
        if (buyer === this.currentAccount.address || seller === this.currentAccount.address) {
          const escrowId = log.args.escrowId;
          
          // Get current details
          const details = await this.publicClient.readContract({
            address: CONTRACTS.ESCROW,
            abi: ESCROW_ABI,
            functionName: 'getEscrowDetails',
            args: [escrowId],
          });
          
          const [, , amount, deadline, status] = details;
          
          myEscrows.push({
            id: escrowId,
            role: buyer === this.currentAccount.address ? 'Buyer' : 'Seller',
            counterparty: buyer === this.currentAccount.address ? seller : buyer,
            amount: Number(amount) / 10**6,
            status: statusNames[status],
            deadline: new Date(Number(deadline) * 1000),
          });
        }
      }
      
      spinner.stop();
      
      if (myEscrows.length === 0) {
        console.log(chalk.yellow('\nNo escrows found for your account.'));
      } else {
        console.log(chalk.blue(`\n📋 Your Escrows (${myEscrows.length}):\n`));
        
        myEscrows.forEach((escrow, index) => {
          console.log(chalk.white(`${index + 1}. Escrow ID: ${escrow.id}`));
          console.log(`   Role: ${chalk.cyan(escrow.role)}`);
          console.log(`   ${escrow.role === 'Buyer' ? 'Seller' : 'Buyer'}: ${escrow.counterparty}`);
          console.log(`   Amount: ${escrow.amount} USDC`);
          console.log(`   Status: ${chalk.green(escrow.status)}`);
          console.log(`   Deadline: ${escrow.deadline.toLocaleString()}`);
          console.log('');
        });
        
        // Store the last escrow ID for convenience
        if (myEscrows.length > 0) {
          this.escrowId = myEscrows[myEscrows.length - 1].id;
        }
      }
    } catch (error) {
      spinner.fail(chalk.red('Failed to fetch escrows'));
      console.error(chalk.red(error.message));
    }
  }

  async checkBalance() {
    const spinner = ora('Checking balances...').start();
    
    try {
      // ETH balance
      const ethBalance = await this.publicClient.getBalance({
        address: this.currentAccount.address,
      });
      
      // USDC balance
      const usdcBalance = await this.publicClient.readContract({
        address: CONTRACTS.USDC,
        abi: USDC_ABI,
        functionName: 'balanceOf',
        args: [this.currentAccount.address],
      });
      
      spinner.stop();
      
      console.log(chalk.blue('\n💰 Balances:'));
      console.log(`  ETH: ${formatEther(ethBalance)} ETH`);
      console.log(`  USDC: ${Number(usdcBalance) / 10**6} USDC`);
    } catch (error) {
      spinner.fail(chalk.red('Failed to check balance'));
      console.error(chalk.red(error.message));
    }
  }

  async approveUSDC() {
    const { amount } = await inquirer.prompt([
      {
        type: 'input',
        name: 'amount',
        message: 'Amount to approve (USDC):',
        default: '100',
        validate: (value) => !isNaN(value) && parseFloat(value) > 0,
      },
    ]);

    const spinner = ora('Approving USDC...').start();
    
    try {
      const hash = await this.walletClient.writeContract({
        address: CONTRACTS.USDC,
        abi: USDC_ABI,
        functionName: 'approve',
        args: [CONTRACTS.ESCROW, BigInt(Math.floor(parseFloat(amount) * 10**6))],
      });
      
      await this.publicClient.waitForTransactionReceipt({ hash });
      
      spinner.succeed(chalk.green(`Approved ${amount} USDC for escrow contract!`));
      console.log(chalk.gray(`Transaction: ${hash}`));
    } catch (error) {
      spinner.fail(chalk.red('Failed to approve USDC'));
      console.error(chalk.red(error.message));
    }
  }

  async createEscrow() {
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'seller',
        message: 'Seller address:',
        default: ACCOUNTS.seller.address,
      },
      {
        type: 'input',
        name: 'amount',
        message: 'Amount (USDC):',
        default: '100',
        validate: (value) => !isNaN(value) && parseFloat(value) > 0,
      },
      {
        type: 'input',
        name: 'days',
        message: 'Delivery deadline (days from now):',
        default: '7',
        validate: (value) => !isNaN(value) && parseInt(value) > 0,
      },
    ]);

    const spinner = ora('Creating escrow...').start();
    
    try {
      const deadline = Math.floor(Date.now() / 1000) + (parseInt(answers.days) * 86400);
      
      const hash = await this.walletClient.writeContract({
        address: CONTRACTS.ESCROW,
        abi: ESCROW_ABI,
        functionName: 'createEscrow',
        args: [answers.seller, BigInt(Math.floor(parseFloat(answers.amount) * 10**6)), CONTRACTS.USDC, BigInt(deadline)],
      });
      
      const receipt = await this.publicClient.waitForTransactionReceipt({ hash });
      
      // Extract escrow ID from logs
      const escrowId = receipt.logs[0].topics[1];
      this.escrowId = escrowId;
      
      spinner.succeed(chalk.green('Escrow created successfully!'));
      console.log(chalk.gray(`Escrow ID: ${escrowId}`));
      console.log(chalk.gray(`Transaction: ${hash}`));
    } catch (error) {
      spinner.fail(chalk.red('Failed to create escrow'));
      console.error(chalk.red(error.message));
    }
  }

  async fundEscrow() {
    const spinner = ora('Finding fundable escrows...').start();
    
    try {
      // Get all EscrowCreated events where current account is buyer
      const createdLogs = await this.publicClient.getLogs({
        address: CONTRACTS.ESCROW,
        event: parseAbi(['event EscrowCreated(bytes32 indexed escrowId, address indexed buyer, address indexed seller, uint256 amount, uint256 deliveryDeadline)'])[0],
        fromBlock: 0n,
        toBlock: 'latest',
      });
      
      // Filter for escrows where current account is buyer and status is CREATED
      const fundableEscrows = [];
      const statusNames = ['Created', 'Funded', 'Documents Pending', 'Settled', 'Disputed', 'Refunded'];
      
      for (const log of createdLogs) {
        const buyer = log.args.buyer;
        
        if (buyer === this.currentAccount.address) {
          const escrowId = log.args.escrowId;
          
          // Get current details
          const details = await this.publicClient.readContract({
            address: CONTRACTS.ESCROW,
            abi: ESCROW_ABI,
            functionName: 'getEscrowDetails',
            args: [escrowId],
          });
          
          const [, seller, amount, deadline, status] = details;
          
          // Only show CREATED escrows (status 0)
          if (status === 0) {
            fundableEscrows.push({
              id: escrowId,
              seller,
              amount: Number(amount) / 10**6,
              status: statusNames[status],
              deadline: new Date(Number(deadline) * 1000),
              displayName: `${Number(amount) / 10**6} USDC to ${seller.slice(0, 8)}...${seller.slice(-6)} (${statusNames[status]})`,
            });
          }
        }
      }
      
      spinner.stop();
      
      if (fundableEscrows.length === 0) {
        console.log(chalk.yellow('\nNo fundable escrows found for your account.'));
        console.log(chalk.gray('Create an escrow first, then you can fund it.'));
        return;
      }

      const { selectedEscrow } = await inquirer.prompt([
        {
          type: 'list',
          name: 'selectedEscrow',
          message: 'Select escrow to fund:',
          choices: fundableEscrows.map(escrow => ({
            name: escrow.displayName,
            value: escrow.id,
          })),
        },
      ]);

      const fundSpinner = ora('Funding escrow...').start();
      
      try {
        const hash = await this.walletClient.writeContract({
          address: CONTRACTS.ESCROW,
          abi: ESCROW_ABI,
          functionName: 'fundEscrow',
          args: [selectedEscrow],
        });
        
        await this.publicClient.waitForTransactionReceipt({ hash });
        
        fundSpinner.succeed(chalk.green('Escrow funded successfully!'));
        console.log(chalk.gray(`Transaction: ${hash}`));
      } catch (error) {
        fundSpinner.fail(chalk.red('Failed to fund escrow'));
        console.error(chalk.red(error.message));
      }
    } catch (error) {
      spinner.fail(chalk.red('Failed to find fundable escrows'));
      console.error(chalk.red(error.message));
    }
  }

  async storeDocument() {
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'escrowId',
        message: 'Escrow ID:',
        default: this.escrowId,
        validate: (value) => value && value.startsWith('0x'),
      },
      {
        type: 'input',
        name: 'documentHash',
        message: 'Document hash:',
        default: '0x' + '1234567890abcdef'.repeat(4),
      },
    ]);

    const spinner = ora('Storing document...').start();
    
    try {
      const hash = await this.walletClient.writeContract({
        address: CONTRACTS.ESCROW,
        abi: ESCROW_ABI,
        functionName: 'storeDocumentHash',
        args: [answers.escrowId, answers.documentHash],
      });
      
      await this.publicClient.waitForTransactionReceipt({ hash });
      
      spinner.succeed(chalk.green('Document stored successfully!'));
      console.log(chalk.gray(`Transaction: ${hash}`));
    } catch (error) {
      spinner.fail(chalk.red('Failed to store document'));
      console.error(chalk.red(error.message));
    }
  }

  async confirmDelivery() {
    const { escrowId } = await inquirer.prompt([
      {
        type: 'input',
        name: 'escrowId',
        message: 'Escrow ID:',
        default: this.escrowId,
        validate: (value) => value && value.startsWith('0x'),
      },
    ]);

    const spinner = ora('Confirming delivery...').start();
    
    try {
      const hash = await this.walletClient.writeContract({
        address: CONTRACTS.ESCROW,
        abi: ESCROW_ABI,
        functionName: 'confirmDelivery',
        args: [escrowId],
      });
      
      await this.publicClient.waitForTransactionReceipt({ hash });
      
      spinner.succeed(chalk.green('Delivery confirmed! Funds released to seller.'));
      console.log(chalk.gray(`Transaction: ${hash}`));
    } catch (error) {
      spinner.fail(chalk.red('Failed to confirm delivery'));
      console.error(chalk.red(error.message));
    }
  }

  async checkEscrowDetails() {
    const { escrowId } = await inquirer.prompt([
      {
        type: 'input',
        name: 'escrowId',
        message: 'Escrow ID:',
        default: this.escrowId,
        validate: (value) => value && value.startsWith('0x'),
      },
    ]);

    const spinner = ora('Fetching escrow details...').start();
    
    try {
      const details = await this.publicClient.readContract({
        address: CONTRACTS.ESCROW,
        abi: ESCROW_ABI,
        functionName: 'getEscrowDetails',
        args: [escrowId],
      });
      
      spinner.stop();
      
      const [buyer, seller, amount, deadline, status, , fundedAt, settledAt] = details;
      const statusNames = ['Created', 'Funded', 'Documents Pending', 'Settled', 'Disputed', 'Refunded'];
      
      console.log(chalk.blue('\n📋 Escrow Details:'));
      console.log(`  ID: ${escrowId}`);
      console.log(`  Buyer: ${buyer}`);
      console.log(`  Seller: ${seller}`);
      console.log(`  Amount: ${Number(amount) / 10**6} USDC`);
      console.log(`  Status: ${statusNames[status]}`);
      console.log(`  Deadline: ${new Date(Number(deadline) * 1000).toLocaleString()}`);
      if (fundedAt > 0) console.log(`  Funded: ${new Date(Number(fundedAt) * 1000).toLocaleString()}`);
      if (settledAt > 0) console.log(`  Settled: ${new Date(Number(settledAt) * 1000).toLocaleString()}`);
    } catch (error) {
      spinner.fail(chalk.red('Failed to get escrow details'));
      console.error(chalk.red(error.message));
    }
  }

  async testGasless() {
    console.log(chalk.yellow('\n⚡ Testing Gasless Transactions\n'));
    
    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'Which gasless action to test?',
        choices: [
          { name: '📝 Create escrow (gasless)', value: 'create' },
          { name: '💸 Fund escrow (gasless)', value: 'fund' },
          { name: '📄 Store document (gasless)', value: 'document' },
          { name: '✅ Confirm delivery (gasless)', value: 'confirm' },
          { name: '← Back', value: 'back' },
        ],
      },
    ]);

    if (action === 'back') return;

    // Check if relayer is running
    try {
      const response = await fetch(`${process.env.RELAYER_URL || 'http://localhost:3001'}/health`);
      if (!response.ok) throw new Error('Relayer not responding');
    } catch (error) {
      console.log(chalk.red('\n❌ Relayer service is not running!'));
      console.log(chalk.gray('Start it with: cd relayer && npm start\n'));
      return;
    }

    switch (action) {
      case 'create':
        await this.createEscrowGasless();
        break;
      case 'fund':
        await this.fundEscrowGasless();
        break;
      case 'document':
        await this.storeDocumentGasless();
        break;
      case 'confirm':
        await this.confirmDeliveryGasless();
        break;
    }
  }

  async createEscrowGasless() {
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'seller',
        message: 'Seller address:',
        default: ACCOUNTS.seller.address,
      },
      {
        type: 'input',
        name: 'amount',
        message: 'Amount (USDC):',
        default: '100',
      },
      {
        type: 'input',
        name: 'days',
        message: 'Delivery deadline (days):',
        default: '7',
      },
    ]);

    const spinner = ora('Creating gasless escrow...').start();

    try {
      const deadline = Math.floor(Date.now() / 1000) + (parseInt(answers.days) * 86400);
      const amount = BigInt(Math.floor(parseFloat(answers.amount) * 10**6));
      
      // Get nonce from relayer
      const nonceResponse = await fetch(`${process.env.RELAYER_URL}/nonce/${this.currentAccount.address}`, {
        headers: { 'x-api-key': process.env.API_KEY },
      });
      const { nonce } = await nonceResponse.json();

      // Create EIP-712 signature
      const domain = {
        name: 'LiskEscrow',
        version: '1',
        chainId: localhost.id,
        verifyingContract: CONTRACTS.ESCROW,
      };

      const types = {
        CreateEscrow: [
          { name: 'seller', type: 'address' },
          { name: 'amount', type: 'uint256' },
          { name: 'token', type: 'address' },
          { name: 'deliveryDeadline', type: 'uint256' },
          { name: 'nonce', type: 'uint256' },
        ],
      };

      const value = {
        seller: answers.seller,
        amount,
        token: CONTRACTS.USDC,
        deliveryDeadline: BigInt(deadline),
        nonce: BigInt(nonce),
      };

      const signature = await this.walletClient.signTypedData({
        domain,
        types,
        primaryType: 'CreateEscrow',
        message: value,
      });

      // Send to relayer
      const response = await fetch(`${process.env.RELAYER_URL}/relay/create-escrow`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.API_KEY,
        },
        body: JSON.stringify({
          seller: answers.seller,
          amount: amount.toString(),
          token: CONTRACTS.USDC,
          deliveryDeadline: deadline,
          buyer: this.currentAccount.address,
          signature,
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        spinner.succeed(chalk.green('Escrow created via gasless transaction!'));
        console.log(chalk.gray(`Escrow ID: ${result.escrowId}`));
        console.log(chalk.gray(`TX: ${result.transactionHash}`));
        console.log(chalk.blue('✨ You paid no gas!'));
        this.escrowId = result.escrowId;
      } else {
        throw new Error(result.error || 'Failed to create escrow');
      }
    } catch (error) {
      spinner.fail(chalk.red('Failed to create gasless escrow'));
      console.error(chalk.red(error.message));
    }
  }

  async fundEscrowGasless() {
    const spinner = ora('Finding fundable escrows...').start();
    
    try {
      // Get all EscrowCreated events where current account is buyer
      const createdLogs = await this.publicClient.getLogs({
        address: CONTRACTS.ESCROW,
        event: parseAbi(['event EscrowCreated(bytes32 indexed escrowId, address indexed buyer, address indexed seller, uint256 amount, uint256 deliveryDeadline)'])[0],
        fromBlock: 0n,
        toBlock: 'latest',
      });
      
      // Filter for escrows where current account is buyer and status is CREATED
      const fundableEscrows = [];
      const statusNames = ['Created', 'Funded', 'Documents Pending', 'Settled', 'Disputed', 'Refunded'];
      
      for (const log of createdLogs) {
        const buyer = log.args.buyer;
        
        if (buyer === this.currentAccount.address) {
          const escrowId = log.args.escrowId;
          
          // Get current details
          const details = await this.publicClient.readContract({
            address: CONTRACTS.ESCROW,
            abi: ESCROW_ABI,
            functionName: 'getEscrowDetails',
            args: [escrowId],
          });
          
          const [, seller, amount, deadline, status] = details;
          
          // Only show CREATED escrows (status 0)
          if (status === 0) {
            fundableEscrows.push({
              id: escrowId,
              seller,
              amount: Number(amount) / 10**6,
              status: statusNames[status],
              deadline: new Date(Number(deadline) * 1000),
              displayName: `${Number(amount) / 10**6} USDC to ${seller.slice(0, 8)}...${seller.slice(-6)} (${statusNames[status]})`,
            });
          }
        }
      }
      
      spinner.stop();
      
      if (fundableEscrows.length === 0) {
        console.log(chalk.yellow('\nNo fundable escrows found for your account.'));
        console.log(chalk.gray('Create an escrow first, then you can fund it.'));
        return;
      }

      const { selectedEscrow } = await inquirer.prompt([
        {
          type: 'list',
          name: 'selectedEscrow',
          message: 'Select escrow to fund (gasless):',
          choices: fundableEscrows.map(escrow => ({
            name: escrow.displayName,
            value: escrow.id,
          })),
        },
      ]);

      const fundSpinner = ora('Funding escrow via gasless transaction...').start();
      
      try {
        // Get nonce from relayer
      const nonceResponse = await fetch(`${process.env.RELAYER_URL}/nonce/${this.currentAccount.address}`, {
        headers: { 'x-api-key': process.env.API_KEY },
      });
      const { nonce } = await nonceResponse.json();

      // Create EIP-712 signature
      const domain = {
        name: 'LiskEscrow',
        version: '1',
        chainId: localhost.id,
        verifyingContract: CONTRACTS.ESCROW,
      };

      const types = {
        FundEscrow: [
          { name: 'escrowId', type: 'bytes32' },
          { name: 'nonce', type: 'uint256' },
        ],
      };

      const value = {
        escrowId: selectedEscrow,
        nonce: BigInt(nonce),
      };

      const signature = await this.walletClient.signTypedData({
        domain,
        types,
        primaryType: 'FundEscrow',
        message: value,
      });

      // Send to relayer
      const response = await fetch(`${process.env.RELAYER_URL}/relay/fund-escrow`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.API_KEY,
        },
        body: JSON.stringify({
          escrowId: selectedEscrow,
          buyer: this.currentAccount.address,
          signature,
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        fundSpinner.succeed(chalk.green('Escrow funded via gasless transaction!'));
        console.log(chalk.gray(`TX: ${result.transactionHash}`));
        console.log(chalk.blue('✨ You paid no gas!'));
      } else {
        throw new Error(result.error || 'Failed to fund escrow');
      }
      } catch (error) {
        fundSpinner.fail(chalk.red('Failed to fund gasless escrow'));
        console.error(chalk.red(error.message));
      }
    } catch (error) {
      spinner.fail(chalk.red('Failed to find fundable escrows'));
      console.error(chalk.red(error.message));
    }
  }

  async storeDocumentGasless() {
    const spinner = ora('Finding escrows needing documents...').start();
    
    try {
      // Get all EscrowCreated events where current account is seller
      const createdLogs = await this.publicClient.getLogs({
        address: CONTRACTS.ESCROW,
        event: parseAbi(['event EscrowCreated(bytes32 indexed escrowId, address indexed buyer, address indexed seller, uint256 amount, uint256 deliveryDeadline)'])[0],
        fromBlock: 0n,
        toBlock: 'latest',
      });
      
      // Filter for escrows where current account is seller and status is FUNDED
      const documentableEscrows = [];
      const statusNames = ['Created', 'Funded', 'Documents Pending', 'Settled', 'Disputed', 'Refunded'];
      
      for (const log of createdLogs) {
        const seller = log.args.seller;
        
        if (seller === this.currentAccount.address) {
          const escrowId = log.args.escrowId;
          
          // Get current details
          const details = await this.publicClient.readContract({
            address: CONTRACTS.ESCROW,
            abi: ESCROW_ABI,
            functionName: 'getEscrowDetails',
            args: [escrowId],
          });
          
          const [buyer, , amount, deadline, status] = details;
          
          // Only show FUNDED escrows (status 1) that need documents
          if (status === 1) {
            documentableEscrows.push({
              id: escrowId,
              buyer,
              amount: Number(amount) / 10**6,
              status: statusNames[status],
              deadline: new Date(Number(deadline) * 1000),
              displayName: `${Number(amount) / 10**6} USDC from ${buyer.slice(0, 8)}...${buyer.slice(-6)} (${statusNames[status]})`,
            });
          }
        }
      }
      
      spinner.stop();
      
      if (documentableEscrows.length === 0) {
        console.log(chalk.yellow('\nNo escrows found that need documents.'));
        console.log(chalk.gray('Escrows must be funded before you can upload documents.'));
        return;
      }

      const answers = await inquirer.prompt([
        {
          type: 'list',
          name: 'escrowId',
          message: 'Select escrow to upload documents to:',
          choices: documentableEscrows.map(escrow => ({
            name: escrow.displayName,
            value: escrow.id,
          })),
        },
        {
          type: 'input',
          name: 'documentHash',
          message: 'Document hash:',
          default: '0x' + '1234567890abcdef'.repeat(4),
          validate: (value) => value && value.startsWith('0x') && value.length === 66,
        },
      ]);

      const docSpinner = ora('Storing document via gasless transaction...').start();
      
      try {
        // Get nonce from relayer
        const nonceResponse = await fetch(`${process.env.RELAYER_URL}/nonce/${this.currentAccount.address}`, {
        headers: { 'x-api-key': process.env.API_KEY },
      });
      const { nonce } = await nonceResponse.json();

      // Create EIP-712 signature
      const domain = {
        name: 'LiskEscrow',
        version: '1',
        chainId: localhost.id,
        verifyingContract: CONTRACTS.ESCROW,
      };

      const types = {
        StoreDocument: [
          { name: 'escrowId', type: 'bytes32' },
          { name: 'documentHash', type: 'bytes32' },
          { name: 'nonce', type: 'uint256' },
        ],
      };

      const value = {
        escrowId: answers.escrowId,
        documentHash: answers.documentHash,
        nonce: BigInt(nonce),
      };

      const signature = await this.walletClient.signTypedData({
        domain,
        types,
        primaryType: 'StoreDocument',
        message: value,
      });

      // Send to relayer
      const response = await fetch(`${process.env.RELAYER_URL}/relay/store-document`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.API_KEY,
        },
        body: JSON.stringify({
          escrowId: answers.escrowId,
          documentHash: answers.documentHash,
          seller: this.currentAccount.address,
          signature,
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        docSpinner.succeed(chalk.green('Document stored via gasless transaction!'));
        console.log(chalk.gray(`TX: ${result.transactionHash}`));
        console.log(chalk.blue('✨ You paid no gas!'));
      } else {
        throw new Error(result.error || 'Failed to store document');
      }
      } catch (error) {
        docSpinner.fail(chalk.red('Failed to store document gaslessly'));
        console.error(chalk.red(error.message));
      }
    } catch (error) {
      spinner.fail(chalk.red('Failed to find escrows needing documents'));
      console.error(chalk.red(error.message));
    }
  }

  async confirmDeliveryGasless() {
    const spinner = ora('Finding escrows ready for delivery confirmation...').start();
    
    try {
      // Get all EscrowCreated events where current account is buyer
      const createdLogs = await this.publicClient.getLogs({
        address: CONTRACTS.ESCROW,
        event: parseAbi(['event EscrowCreated(bytes32 indexed escrowId, address indexed buyer, address indexed seller, uint256 amount, uint256 deliveryDeadline)'])[0],
        fromBlock: 0n,
        toBlock: 'latest',
      });
      
      // Filter for escrows where current account is buyer and status is DOCUMENTS_PENDING
      const confirmableEscrows = [];
      const statusNames = ['Created', 'Funded', 'Documents Pending', 'Settled', 'Disputed', 'Refunded'];
      
      for (const log of createdLogs) {
        const buyer = log.args.buyer;
        
        if (buyer === this.currentAccount.address) {
          const escrowId = log.args.escrowId;
          
          // Get current details
          const details = await this.publicClient.readContract({
            address: CONTRACTS.ESCROW,
            abi: ESCROW_ABI,
            functionName: 'getEscrowDetails',
            args: [escrowId],
          });
          
          const [, seller, amount, deadline, status] = details;
          
          // Only show DOCUMENTS_PENDING escrows (status 2) ready for confirmation
          if (status === 2) {
            confirmableEscrows.push({
              id: escrowId,
              seller,
              amount: Number(amount) / 10**6,
              status: statusNames[status],
              deadline: new Date(Number(deadline) * 1000),
              displayName: `${Number(amount) / 10**6} USDC to ${seller.slice(0, 8)}...${seller.slice(-6)} (${statusNames[status]})`,
            });
          }
        }
      }
      
      spinner.stop();
      
      if (confirmableEscrows.length === 0) {
        console.log(chalk.yellow('\nNo escrows ready for delivery confirmation.'));
        console.log(chalk.gray('Escrows must have documents uploaded before you can confirm delivery.'));
        return;
      }

      const { selectedEscrow } = await inquirer.prompt([
        {
          type: 'list',
          name: 'selectedEscrow',
          message: 'Select escrow to confirm delivery:',
          choices: confirmableEscrows.map(escrow => ({
            name: escrow.displayName,
            value: escrow.id,
          })),
        },
      ]);

      const confirmSpinner = ora('Confirming delivery via gasless transaction...').start();
      
      try {
        // Get nonce from relayer
        const nonceResponse = await fetch(`${process.env.RELAYER_URL}/nonce/${this.currentAccount.address}`, {
        headers: { 'x-api-key': process.env.API_KEY },
      });
      const { nonce } = await nonceResponse.json();

      // Create EIP-712 signature
      const domain = {
        name: 'LiskEscrow',
        version: '1',
        chainId: localhost.id,
        verifyingContract: CONTRACTS.ESCROW,
      };

      const types = {
        ConfirmDelivery: [
          { name: 'escrowId', type: 'bytes32' },
          { name: 'nonce', type: 'uint256' },
        ],
      };

      const value = {
        escrowId: selectedEscrow,
        nonce: BigInt(nonce),
      };

      const signature = await this.walletClient.signTypedData({
        domain,
        types,
        primaryType: 'ConfirmDelivery',
        message: value,
      });

      // Send to relayer
      const response = await fetch(`${process.env.RELAYER_URL}/relay/confirm-delivery`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.API_KEY,
        },
        body: JSON.stringify({
          escrowId: selectedEscrow,
          buyer: this.currentAccount.address,
          signature,
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        confirmSpinner.succeed(chalk.green('Delivery confirmed via gasless transaction!'));
        console.log(chalk.gray(`TX: ${result.transactionHash}`));
        console.log(chalk.blue('✨ You paid no gas! Funds released to seller.'));
      } else {
        throw new Error(result.error || 'Failed to confirm delivery');
      }
      } catch (error) {
        confirmSpinner.fail(chalk.red('Failed to confirm delivery gaslessly'));
        console.error(chalk.red(error.message));
      }
    } catch (error) {
      spinner.fail(chalk.red('Failed to find confirmable escrows'));
      console.error(chalk.red(error.message));
    }
  }

  async continuePrompt() {
    await inquirer.prompt([
      {
        type: 'input',
        name: 'continue',
        message: '\nPress Enter to continue...',
      },
    ]);
    
    console.clear();
    console.log(chalk.blue.bold('🔐 Lisk Escrow CLI Test Tool\n'));
    await this.mainMenu();
  }
}

// Start the CLI
const cli = new EscrowCLI();
cli.start().catch(console.error);