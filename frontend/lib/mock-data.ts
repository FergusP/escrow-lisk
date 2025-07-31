export interface User {
  id: string;
  name: string;
  email: string;
  company: string;
  country: string;
  walletAddress: string;
  avatar?: string;
}

export interface Contract {
  id: string;
  contractNumber: string;
  seller: User;
  buyer: User;
  amount: number;
  currency: string;
  status: 'draft' | 'active' | 'funded' | 'shipped' | 'delivered' | 'completed' | 'disputed';
  createdAt: string;
  fundedAt?: string;
  shippedAt?: string;
  deliveredAt?: string;
  completedAt?: string;
  period: string;
  description: string;
  milestones?: Milestone[];
}

export interface Milestone {
  id: string;
  percentage: number;
  description: string;
  status: 'pending' | 'completed' | 'released';
  amount: number;
}

export interface Transaction {
  id: string;
  from?: string;
  to?: string;
  amount: number;
  currency: string;
  type: 'received' | 'withdrawn' | 'funded' | 'released';
  status: 'pending' | 'completed' | 'failed';
  date: string;
  description: string;
  contractId?: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  seller: User;
  buyer: User;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  total: number;
  currency: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  createdAt: string;
  dueDate: string;
  paidAt?: string;
  contractId?: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

// Mock Users
export const mockUsers: User[] = [
  {
    id: '1',
    name: 'Barly Vallendito',
    email: 'barly@openhouse.com',
    company: 'Open House',
    country: 'United States',
    walletAddress: '0x1234...5678',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Barly'
  },
  {
    id: '2',
    name: 'Leslie Alexander',
    email: 'lesliealex@gmail.com',
    company: 'Abstergo Ltd.',
    country: 'Australia',
    walletAddress: '0x2345...6789',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Leslie'
  },
  {
    id: '3',
    name: 'Jacob Jones',
    email: 'jacobjones@gmail.com',
    company: 'Ganymede Ltd.',
    country: 'United States',
    walletAddress: '0x3456...7890',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jacob'
  },
  {
    id: '4',
    name: 'Darrell Steward',
    email: 'darrellsteward@gmail.com',
    company: 'Tech Innovations',
    country: 'Canada',
    walletAddress: '0x4567...8901',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Darrell'
  },
  {
    id: '5',
    name: 'Courtney Henry',
    email: 'courtneyhenry@gmail.com',
    company: 'Global Traders',
    country: 'United Kingdom',
    walletAddress: '0x5678...9012',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Courtney'
  }
];

// Mock Contracts
export const mockContracts: Contract[] = [
  {
    id: '1',
    contractNumber: 'CTR-2024-001',
    seller: mockUsers[1], // Leslie Alexander - Abstergo Ltd.
    buyer: mockUsers[0], // Barly Vallendito
    amount: 8000,
    currency: 'USDC',
    status: 'active',
    createdAt: '2021-08-01T10:00:00Z',
    period: 'Aug 1st, 2021 - Dec 30th, 2021',
    description: 'Software development services'
  },
  {
    id: '2',
    contractNumber: 'CTR-2024-002',
    seller: mockUsers[2], // Jacob Jones - Ganymede Ltd.
    buyer: mockUsers[0], // Barly Vallendito
    amount: 15000,
    currency: 'USDC',
    status: 'funded',
    createdAt: '2021-07-01T10:00:00Z',
    fundedAt: '2021-07-02T10:00:00Z',
    period: 'Jul 1st, 2021 - Aug 30th, 2022',
    description: 'Marketing campaign services',
    milestones: [
      { id: '1', percentage: 30, description: 'Initial setup', status: 'completed', amount: 4500 },
      { id: '2', percentage: 40, description: 'Campaign launch', status: 'pending', amount: 6000 },
      { id: '3', percentage: 30, description: 'Final delivery', status: 'pending', amount: 4500 }
    ]
  },
  {
    id: '3',
    contractNumber: 'CTR-2024-003',
    seller: mockUsers[0], // Barly Vallendito
    buyer: mockUsers[3], // Darrell Steward
    amount: 5000,
    currency: 'USDC',
    status: 'completed',
    createdAt: '2021-06-01T10:00:00Z',
    fundedAt: '2021-06-01T14:00:00Z',
    shippedAt: '2021-06-05T10:00:00Z',
    deliveredAt: '2021-06-10T10:00:00Z',
    completedAt: '2021-06-10T14:00:00Z',
    period: 'Jun 1st, 2021 - Jun 10th, 2021',
    description: 'Consulting services'
  }
];

// Mock Transactions
export const mockTransactions: Transaction[] = [
  {
    id: '1',
    from: 'Abstergo Ltd.',
    amount: 15000,
    currency: 'USDC',
    type: 'received',
    status: 'completed',
    date: '2021-08-12T10:00:00Z',
    description: 'Payment received for CTR-2024-001',
    contractId: '1'
  },
  {
    id: '2',
    to: 'Barly Vallendito - Wise',
    amount: 20000,
    currency: 'USDC',
    type: 'withdrawn',
    status: 'completed',
    date: '2021-08-11T10:00:00Z',
    description: 'Withdrawal to bank account'
  },
  {
    id: '3',
    from: 'Ganymede Ltd.',
    amount: 10000,
    currency: 'USDC',
    type: 'received',
    status: 'completed',
    date: '2021-08-10T10:00:00Z',
    description: 'Milestone payment for CTR-2024-002',
    contractId: '2'
  },
  {
    id: '4',
    to: 'Alex James',
    amount: 15000,
    currency: 'USDC',
    type: 'released',
    status: 'pending',
    date: '2021-08-10T09:00:00Z',
    description: 'Payment release - Paypal'
  }
];

// Mock Invoices
export const mockInvoices: Invoice[] = [
  {
    id: '1',
    invoiceNumber: 'INV-2024-001',
    seller: mockUsers[1], // Abstergo Ltd.
    buyer: mockUsers[0], // Barly Vallendito
    items: [
      { id: '1', description: 'Software Development - Phase 1', quantity: 1, unitPrice: 5000, total: 5000 },
      { id: '2', description: 'Software Development - Phase 2', quantity: 1, unitPrice: 3000, total: 3000 }
    ],
    subtotal: 8000,
    tax: 0,
    total: 8000,
    currency: 'USDC',
    status: 'paid',
    createdAt: '2021-08-01T10:00:00Z',
    dueDate: '2021-08-15T10:00:00Z',
    paidAt: '2021-08-02T10:00:00Z',
    contractId: '1'
  },
  {
    id: '2',
    invoiceNumber: 'INV-2024-002',
    seller: mockUsers[2], // Ganymede Ltd.
    buyer: mockUsers[0], // Barly Vallendito
    items: [
      { id: '1', description: 'Marketing Campaign Setup', quantity: 1, unitPrice: 10000, total: 10000 },
      { id: '2', description: 'Social Media Management', quantity: 3, unitPrice: 1666.67, total: 5000 }
    ],
    subtotal: 15000,
    tax: 0,
    total: 15000,
    currency: 'USDC',
    status: 'sent',
    createdAt: '2021-07-01T10:00:00Z',
    dueDate: '2021-07-30T10:00:00Z',
    contractId: '2'
  }
];

// Mock earnings data for charts
export const mockEarningsData = [
  { month: 'Apr', earnings: 5000 },
  { month: 'May', earnings: 10000 },
  { month: 'Jun', earnings: 8000 },
  { month: 'Jul', earnings: 15000 },
  { month: 'Aug', earnings: 25000 },
  { month: 'Sep', earnings: 20000 }
];

// Helper functions
export const getCurrentUser = () => mockUsers[0]; // Barly Vallendito as logged in user

export const getContractsByUser = (userId: string) => {
  return mockContracts.filter(
    contract => contract.buyer.id === userId || contract.seller.id === userId
  );
};

export const getTransactionsByUser = (userId: string) => {
  // In a real app, we'd filter by user's wallet address
  return mockTransactions;
};

export const getInvoicesByUser = (userId: string) => {
  return mockInvoices.filter(
    invoice => invoice.buyer.id === userId || invoice.seller.id === userId
  );
};

// Mock Support Data
export interface SupportTicket {
  id: string;
  title: string;
  description: string;
  category: 'technical' | 'billing' | 'contract' | 'general';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  createdAt: string;
  updatedAt: string;
  responses: number;
  userId: string;
}

export interface SupportMessage {
  id: string;
  ticketId: string;
  message: string;
  sender: 'user' | 'support';
  senderName: string;
  timestamp: string;
  attachments?: string[];
}

export const mockSupportTickets: SupportTicket[] = [
  {
    id: 'TKT-001',
    title: 'Unable to release funds from escrow',
    description: 'I completed the delivery but the release funds button is not working. I can see the contract is in "delivered" status but when I click release, nothing happens.',
    category: 'technical',
    priority: 'high',
    status: 'in_progress',
    createdAt: '2024-01-25T10:00:00Z',
    updatedAt: '2024-01-25T14:30:00Z',
    responses: 3,
    userId: '1'
  },
  {
    id: 'TKT-002',
    title: 'Question about international tax rates',
    description: 'Need clarification on VAT calculation for EU shipments. The calculator is showing 21% but I thought it should be 19% for Germany.',
    category: 'general',
    priority: 'medium',
    status: 'resolved',
    createdAt: '2024-01-23T09:15:00Z',
    updatedAt: '2024-01-24T16:20:00Z',
    responses: 5,
    userId: '1'
  },
  {
    id: 'TKT-003',
    title: 'Invoice generation error',
    description: 'Getting "PDF generation failed" error when trying to generate invoice for contract CTR-2024-005. This is urgent as client is waiting.',
    category: 'technical',
    priority: 'medium',
    status: 'open',
    createdAt: '2024-01-22T14:45:00Z',
    updatedAt: '2024-01-22T14:45:00Z',
    responses: 0,
    userId: '1'
  },
  {
    id: 'TKT-004',
    title: 'Dispute resolution process',
    description: 'My buyer is claiming goods were damaged but they look fine to me. How do I proceed with dispute resolution?',
    category: 'contract',
    priority: 'high',
    status: 'in_progress',
    createdAt: '2024-01-20T11:30:00Z',
    updatedAt: '2024-01-21T09:45:00Z',
    responses: 7,
    userId: '1'
  }
];

export const mockSupportMessages: SupportMessage[] = [
  {
    id: '1',
    ticketId: 'TKT-001',
    message: 'I completed the delivery but the release funds button is not working. I can see the contract is in "delivered" status but when I click release, nothing happens.',
    sender: 'user',
    senderName: 'Barly Vallendito',
    timestamp: '2024-01-25T10:00:00Z'
  },
  {
    id: '2',
    ticketId: 'TKT-001',
    message: 'Hi Barly, thank you for reaching out. I can see the issue on our end. It looks like there was a temporary network congestion. Can you please try refreshing the page and attempting the release again?',
    sender: 'support',
    senderName: 'Sarah (Support Team)',
    timestamp: '2024-01-25T11:15:00Z'
  },
  {
    id: '3',
    ticketId: 'TKT-001',
    message: 'I tried refreshing but still getting the same issue. The button highlights when I hover but clicking does nothing.',
    sender: 'user',
    senderName: 'Barly Vallendito',
    timestamp: '2024-01-25T12:30:00Z'
  },
  {
    id: '4',
    ticketId: 'TKT-001',
    message: 'I can see there\'s a browser compatibility issue. We\'re pushing a fix now. In the meantime, could you try using Chrome or Firefox? The fix should be live within the next hour.',
    sender: 'support',
    senderName: 'Mike (Technical Team)',
    timestamp: '2024-01-25T14:30:00Z'
  }
];

export const getSupportTicketsByUser = (userId: string) => {
  return mockSupportTickets.filter(ticket => ticket.userId === userId);
};

export const getSupportMessagesByTicket = (ticketId: string) => {
  return mockSupportMessages.filter(message => message.ticketId === ticketId);
};