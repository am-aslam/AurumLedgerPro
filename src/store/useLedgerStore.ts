import { create } from 'zustand';

export interface AuditRecord {
  timestamp: string;
  user: string;
  action: string;
  details?: string;
}

export interface Transaction {
  id: string;
  date: string;
  customerName: string;
  customerId: string;
  type: 'Gold Received' | 'Sale' | 'Purchase' | 'Transfer' | 'Adjustments';
  grossWeight: number; // in grams
  stoneWeight: number; // in grams
  netWeight: number;   // in grams (gross - stone)
  purity: '999' | '995' | '22K' | '18K';
  debit: number;       // in grams (gold sent/sold to them)
  credit: number;      // in grams (gold received from them)
  runningBalance: number; // running net gold position in grams
  currency: string;
  origin: 'SYSTEM' | 'EXCEL_IMPORT' | 'MANUAL';
  invoiceNo: string;
  reference: string;
  notes: string;
  attachments: string[];
  auditHistory: AuditRecord[];
  cashValue?: number; // USD equivalent value for pricing
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  tags: string[];
  balanceGold: number; // positive = customer owes us gold, negative = we owe customer
  receivableCash: number; // cash owed to us
  payableCash: number;    // cash we owe them
  status: 'active' | 'risk' | 'inactive';
}

export interface Settlement {
  id: string;
  date: string;
  customerName: string;
  netWeight: number; // grams netting
  cashValue: number; // USD value
  status: 'Pending' | 'Completed';
  suggestedAction: string;
  riskScore: 'Low' | 'Medium' | 'High';
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  data?: {
    type: 'table' | 'chart';
    headers?: string[];
    rows?: any[][];
    chartData?: any[];
  };
}

interface LedgerState {
  transactions: Transaction[];
  customers: Customer[];
  settlements: Settlement[];
  auditLogs: AuditRecord[];
  chatHistory: ChatMessage[];
  selectedTransactionId: string | null;
  sidebarCollapsed: boolean;
  themeMode: 'light' | 'dark';
  goldRate: number; // base rate in USD/gram
  goldRateChange: number; // percentage change
  
  // Actions
  addTransaction: (tx: Omit<Transaction, 'id' | 'runningBalance' | 'auditHistory'>) => void;
  deleteTransaction: (id: string) => void;
  setSelectedTransactionId: (id: string | null) => void;
  toggleSidebar: () => void;
  setThemeMode: (mode: 'light' | 'dark') => void;
  addAuditLog: (user: string, action: string, details?: string) => void;
  importTransactions: (newTxs: Omit<Transaction, 'id' | 'runningBalance' | 'auditHistory'>[]) => void;
  addChatMessage: (msg: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  clearChatHistory: () => void;
  updateCustomerBalance: (id: string, gold: number, cash: number) => void;
}

// Initial Mock Customers
const initialCustomers: Customer[] = [
  { id: 'CUST-001', name: 'Al-Jazeera Jewellers', email: 'operations@aljazeera.ae', phone: '+971 4 226 1122', company: 'Al-Jazeera Trading LLC', tags: ['Enterprise', 'Wholesale'], balanceGold: 145.50, receivableCash: 12500, payableCash: 0, status: 'active' },
  { id: 'CUST-002', name: 'Nadir Refining Corp', email: 'compliance@nadirrefining.com', phone: '+90 212 514 9000', company: 'Nadir Metal Refineri A.S.', tags: ['Refinery', 'Tier-1'], balanceGold: -250.00, receivableCash: 0, payableCash: 45000, status: 'active' },
  { id: 'CUST-003', name: 'Valcambi Swiss Trade', email: 'swissdesk@valcambi.ch', phone: '+41 91 640 2600', company: 'Valcambi SA', tags: ['Global Partner', 'Premium'], balanceGold: 890.25, receivableCash: 0, payableCash: 0, status: 'active' },
  { id: 'CUST-004', name: 'Bhavani Bullion', email: 'trade@bhavanigold.in', phone: '+91 22 4004 8888', company: 'Bhavani Gems & Bullion Ltd', tags: ['Wholesale', 'Risk-Check'], balanceGold: 55.40, receivableCash: 3500, payableCash: 0, status: 'risk' },
  { id: 'CUST-005', name: 'Devonshire Bullion', email: 'treasury@devonshire.co.uk', phone: '+44 20 7404 4000', company: 'Devonshire Precious Metals', tags: ['Retail Distributor'], balanceGold: -12.30, receivableCash: 0, payableCash: 1200, status: 'active' },
  { id: 'CUST-006', name: 'Apex Metal Solutions', email: 'logistics@apexmetals.com', phone: '+1 212 990 1202', company: 'Apex Metals Group LLC', tags: ['Industrial'], balanceGold: 0.00, receivableCash: 0, payableCash: 0, status: 'inactive' }
];

// Initial Mock Transactions
const initialTransactions: Transaction[] = [
  {
    id: 'TX-1001',
    date: '2026-06-10',
    customerName: 'Al-Jazeera Jewellers',
    customerId: 'CUST-001',
    type: 'Gold Received',
    grossWeight: 502.50,
    stoneWeight: 2.50,
    netWeight: 500.00,
    purity: '999',
    debit: 0,
    credit: 500.00,
    runningBalance: -500.00,
    currency: 'USD',
    origin: 'SYSTEM',
    invoiceNo: 'INV-2026-041',
    reference: 'REF-9021-AJ',
    notes: 'Received 999 kilo bar for refining and credit balance.',
    attachments: ['receipt_999_bar.pdf', 'assay_report_12.png'],
    auditHistory: [
      { timestamp: '2026-06-10T09:12:00Z', user: 'Sarah Jenkins (Compliance)', action: 'Created Transaction', details: 'Ingested assay receipt details.' },
      { timestamp: '2026-06-10T10:30:00Z', user: 'Vault Admin', action: 'Approved Deposit', details: 'Weight match verified by scale #3.' }
    ],
    cashValue: 37560
  },
  {
    id: 'TX-1002',
    date: '2026-06-11',
    customerName: 'Valcambi Swiss Trade',
    customerId: 'CUST-003',
    type: 'Sale',
    grossWeight: 250.00,
    stoneWeight: 0.00,
    netWeight: 250.00,
    purity: '999',
    debit: 250.00,
    credit: 0,
    runningBalance: -250.00,
    currency: 'EUR',
    origin: 'SYSTEM',
    invoiceNo: 'INV-2026-042',
    reference: 'REF-4921-VC',
    notes: 'Outward trade order executed. Shipped 250g 999 cast bar.',
    attachments: ['waybill_valcambi.pdf'],
    auditHistory: [
      { timestamp: '2026-06-11T14:22:00Z', user: 'Marcus Vance (Sales)', action: 'Dispatched Order', details: 'FedEx Priority Overnight tracking: FX-8821' }
    ],
    cashValue: 18780
  },
  {
    id: 'TX-1003',
    date: '2026-06-12',
    customerName: 'Nadir Refining Corp',
    customerId: 'CUST-002',
    type: 'Purchase',
    grossWeight: 1005.00,
    stoneWeight: 5.00,
    netWeight: 1000.00,
    purity: '995',
    debit: 0,
    credit: 1000.00,
    runningBalance: -1250.00,
    currency: 'USD',
    origin: 'EXCEL_IMPORT',
    invoiceNo: 'INV-2026-043',
    reference: 'REF-ND-202',
    notes: 'Bulk purchase order of 995 bullion raw bars.',
    attachments: ['nadir_assay_995.pdf'],
    auditHistory: [
      { timestamp: '2026-06-12T11:05:00Z', user: 'Automated Importer', action: 'Imported via Excel API', details: 'Nadir Bulk Template parser v2.1' }
    ],
    cashValue: 74800
  },
  {
    id: 'TX-1004',
    date: '2026-06-13',
    customerName: 'Bhavani Bullion',
    customerId: 'CUST-004',
    type: 'Transfer',
    grossWeight: 120.00,
    stoneWeight: 0.00,
    netWeight: 120.00,
    purity: '22K',
    debit: 120.00,
    credit: 0,
    runningBalance: -1130.00,
    currency: 'USD',
    origin: 'MANUAL',
    invoiceNo: 'INV-2026-044',
    reference: 'REF-BHAV-99',
    notes: 'Inter-vault transfer to Bhavani terminal warehouse.',
    attachments: [],
    auditHistory: [
      { timestamp: '2026-06-13T16:45:00Z', user: 'Elena Rostova (Vault Controller)', action: 'Vault Transfer Complete', details: 'Transferred from Main Vault Room A to Terminal 2' }
    ],
    cashValue: 8250
  },
  {
    id: 'TX-1005',
    date: '2026-06-14',
    customerName: 'Al-Jazeera Jewellers',
    customerId: 'CUST-001',
    type: 'Adjustments',
    grossWeight: 10.50,
    stoneWeight: 0.50,
    netWeight: 10.00,
    purity: '18K',
    debit: 10.00,
    credit: 0,
    runningBalance: -1120.00,
    currency: 'USD',
    origin: 'MANUAL',
    invoiceNo: 'ADJ-2026-009',
    reference: 'REF-ADJ-01',
    notes: 'Correction for scrap assay weight mismatch on voucher #0091.',
    attachments: ['scrap_photo.jpeg'],
    auditHistory: [
      { timestamp: '2026-06-14T10:10:00Z', user: 'Sarah Jenkins (Compliance)', action: 'Weight Adjusted', details: 'Approved under manager approval code M-9821' }
    ],
    cashValue: 580
  },
  {
    id: 'TX-1006',
    date: '2026-06-15',
    customerName: 'Valcambi Swiss Trade',
    customerId: 'CUST-003',
    type: 'Gold Received',
    grossWeight: 1000.00,
    stoneWeight: 0.00,
    netWeight: 1000.00,
    purity: '999',
    debit: 0,
    credit: 1000.00,
    runningBalance: -2120.00,
    currency: 'USD',
    origin: 'SYSTEM',
    invoiceNo: 'INV-2026-045',
    reference: 'REF-8891-VC',
    notes: 'Direct physical gold deposit at Zurich security facility.',
    attachments: ['swiss_deposit_receipt.pdf'],
    auditHistory: [
      { timestamp: '2026-06-15T08:00:00Z', user: 'Zurich Vault Desk', action: 'Deposit Ingested', details: 'Sealed box ID: VAL-991' }
    ],
    cashValue: 75120
  }
];

// Initial Settlements
const initialSettlements: Settlement[] = [
  { id: 'SET-001', date: '2026-06-15', customerName: 'Nadir Refining Corp', netWeight: -250.00, cashValue: 18780, status: 'Pending', suggestedAction: 'Offset debt by buying 999 cast bars from Zurich vault', riskScore: 'Low' },
  { id: 'SET-002', date: '2026-06-14', customerName: 'Valcambi Swiss Trade', netWeight: 890.25, cashValue: 66870, status: 'Pending', suggestedAction: 'Execute net gold delivery credit to Zurich hub', riskScore: 'Low' },
  { id: 'SET-003', date: '2026-06-12', customerName: 'Bhavani Bullion', netWeight: 55.40, cashValue: 4160, status: 'Pending', suggestedAction: 'Request physical settlement; client credit limit check flagged', riskScore: 'Medium' },
  { id: 'SET-004', date: '2026-06-10', customerName: 'Al-Jazeera Jewellers', netWeight: 145.50, cashValue: 10927, status: 'Completed', suggestedAction: 'Netting complete. Cash settled on receipt #221', riskScore: 'Low' }
];

// Initial Audit Logs
const initialAuditLogs: AuditRecord[] = [
  { timestamp: '2026-06-15T15:30:12Z', user: 'Sarah Jenkins (Compliance)', action: 'System Configurations Updated', details: 'Updated base assay tolerances for 18K gold scrap.' },
  { timestamp: '2026-06-15T14:12:45Z', user: 'System Automated Scheduler', action: 'Daily Settlement Report', details: 'Scanned 6 active partner ledgers. Generated 3 netting proposals.' },
  { timestamp: '2026-06-15T11:00:00Z', user: 'Vault Admin', action: 'Physical Inventory Audit', details: 'Scale calibration verified. Standard weight margin deviation <0.001g.' },
  { timestamp: '2026-06-14T17:40:22Z', user: 'Marcus Vance (Sales)', action: 'Customer Tag Assigned', details: 'Added CRM tag [Risk-Check] to Bhavani Bullion.' }
];

// Initial AI Assistant conversation history
const initialChatHistory: ChatMessage[] = [
  { id: 'msg-1', sender: 'assistant', text: 'Welcome to AurumLedger AI Assistant. How can I help you analyze your gold ledgers today?', timestamp: '16:15:00' }
];

export const useLedgerStore = create<LedgerState>((set) => ({
  transactions: initialTransactions,
  customers: initialCustomers,
  settlements: initialSettlements,
  auditLogs: initialAuditLogs,
  chatHistory: initialChatHistory,
  selectedTransactionId: 'TX-1001', // Pre-select first transaction for ledger split screen
  sidebarCollapsed: false,
  themeMode: 'light',
  goldRate: 75.12, // USD per gram
  goldRateChange: 0.45, // +0.45%
  
  addTransaction: (tx) => set((state) => {
    const id = `TX-${Math.floor(1000 + Math.random() * 9000)}`;
    const runningBalance = state.transactions.length > 0 
      ? state.transactions[state.transactions.length - 1].runningBalance - (tx.debit || 0) + (tx.credit || 0)
      : - (tx.debit || 0) + (tx.credit || 0);

    const auditHistory: AuditRecord[] = [{
      timestamp: new Date().toISOString(),
      user: 'Current User',
      action: 'Transaction Manual Entry',
      details: tx.notes || 'Manually logged.'
    }];

    const finalTx: Transaction = {
      ...tx,
      id,
      runningBalance,
      auditHistory,
      cashValue: tx.cashValue || tx.netWeight * state.goldRate
    };

    const updatedTxs = [...state.transactions, finalTx];
    
    // Proactively update customer balance as well
    const updatedCustomers = state.customers.map(cust => {
      if (cust.id === tx.customerId) {
        // Debit increases customer liability to us (gold they owe us)
        // Credit decreases their liability to us (gold they gave us)
        const netChange = (tx.debit || 0) - (tx.credit || 0);
        return {
          ...cust,
          balanceGold: cust.balanceGold + netChange
        };
      }
      return cust;
    });

    const newAuditLog: AuditRecord = {
      timestamp: new Date().toISOString(),
      user: 'Current User',
      action: 'Created Transaction',
      details: `Logged ${tx.type} for ${tx.customerName}: ${tx.netWeight}g (${tx.purity})`
    };

    return {
      transactions: updatedTxs,
      customers: updatedCustomers,
      auditLogs: [newAuditLog, ...state.auditLogs]
    };
  }),

  deleteTransaction: (id) => set((state) => {
    const tx = state.transactions.find(t => t.id === id);
    if (!tx) return {};

    const updatedTxs = state.transactions.filter(t => t.id !== id);
    
    // Reverse customer balances
    const updatedCustomers = state.customers.map(cust => {
      if (cust.id === tx.customerId) {
        const netChange = (tx.debit || 0) - (tx.credit || 0);
        return { ...cust, balanceGold: cust.balanceGold - netChange };
      }
      return cust;
    });

    const newAuditLog: AuditRecord = {
      timestamp: new Date().toISOString(),
      user: 'Current User',
      action: 'Deleted Transaction',
      details: `Removed transaction ${id} of ${tx.netWeight}g`
    };

    return {
      transactions: updatedTxs,
      customers: updatedCustomers,
      auditLogs: [newAuditLog, ...state.auditLogs],
      selectedTransactionId: state.selectedTransactionId === id ? null : state.selectedTransactionId
    };
  }),

  setSelectedTransactionId: (id) => set({ selectedTransactionId: id }),
  
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  
  setThemeMode: (mode) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('themeMode', mode);
    }
    set({ themeMode: mode });
  },
  
  addAuditLog: (user, action, details) => set((state) => ({
    auditLogs: [{ timestamp: new Date().toISOString(), user, action, details }, ...state.auditLogs]
  })),

  importTransactions: (newTxs) => set((state) => {
    let runningBalance = state.transactions.length > 0 
      ? state.transactions[state.transactions.length - 1].runningBalance
      : 0;

    const formattedTxs = newTxs.map((tx, idx) => {
      const id = `TX-IMP-${Math.floor(2000 + Math.random() * 8000) + idx}`;
      runningBalance = runningBalance - (tx.debit || 0) + (tx.credit || 0);
      
      return {
        ...tx,
        id,
        runningBalance,
        cashValue: tx.cashValue || tx.netWeight * state.goldRate,
        auditHistory: [{
          timestamp: new Date().toISOString(),
          user: 'System Import Ingest',
          action: 'Excel Upload',
          details: 'Verified column schema and checksum validator.'
        }]
      } as Transaction;
    });

    // Update customer balances from all imported transactions
    const customerBalMap = new Map<string, number>();
    formattedTxs.forEach(t => {
      const current = customerBalMap.get(t.customerId) || 0;
      customerBalMap.set(t.customerId, current + ((t.debit || 0) - (t.credit || 0)));
    });

    const updatedCustomers = state.customers.map(cust => {
      if (customerBalMap.has(cust.id)) {
        return {
          ...cust,
          balanceGold: cust.balanceGold + (customerBalMap.get(cust.id) || 0)
        };
      }
      return cust;
    });

    const newAuditLog: AuditRecord = {
      timestamp: new Date().toISOString(),
      user: 'Current User',
      action: 'Batch Excel Import Complete',
      details: `Successfully imported ${formattedTxs.length} records, updated ${customerBalMap.size} customer accounts.`
    };

    return {
      transactions: [...state.transactions, ...formattedTxs],
      customers: updatedCustomers,
      auditLogs: [newAuditLog, ...state.auditLogs]
    };
  }),

  addChatMessage: (msg) => set((state) => {
    const id = `msg-${Math.floor(Math.random() * 100000)}`;
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    return {
      chatHistory: [...state.chatHistory, { ...msg, id, timestamp }]
    };
  }),

  clearChatHistory: () => set({
    chatHistory: [{ id: 'msg-init', sender: 'assistant', text: 'History cleared. How can I help you analyze your gold ledgers today?', timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]
  }),

  updateCustomerBalance: (id, gold, cash) => set((state) => ({
    customers: state.customers.map(c => c.id === id ? { ...c, balanceGold: gold, receivableCash: cash } : c)
  }))
}));
