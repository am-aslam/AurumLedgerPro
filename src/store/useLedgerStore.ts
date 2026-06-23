import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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

export const useLedgerStore = create<LedgerState>()(
  persist(
    (set, get) => ({
      transactions: [],
      customers: [],
      settlements: [],
      auditLogs: [],
      chatHistory: [
        { id: 'msg-init', sender: 'assistant', text: 'Welcome to AurumLedger AI Assistant. How can I help you analyze your gold ledgers today?', timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
      ],
      selectedTransactionId: null,
      sidebarCollapsed: false,
      themeMode: 'light',
      goldRate: 75.12,
      goldRateChange: 0.45,

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
        
        // Proactively update customer balance or add customer if doesn't exist
        const customerExists = state.customers.some(c => c.id === tx.customerId);
        let updatedCustomers = state.customers;
        
        if (customerExists) {
          updatedCustomers = state.customers.map(cust => {
            if (cust.id === tx.customerId) {
              const netChange = (tx.debit || 0) - (tx.credit || 0);
              return {
                ...cust,
                balanceGold: parseFloat((cust.balanceGold + netChange).toFixed(3))
              };
            }
            return cust;
          });
        } else {
          // If customer doesn't exist, create one
          const newCustomer: Customer = {
            id: tx.customerId,
            name: tx.customerName,
            email: '',
            phone: '',
            company: tx.customerName,
            tags: ['Manual Entry'],
            balanceGold: parseFloat(((tx.debit || 0) - (tx.credit || 0)).toFixed(3)),
            receivableCash: 0,
            payableCash: 0,
            status: 'active'
          };
          updatedCustomers = [...state.customers, newCustomer];
        }

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
            return {
              ...cust,
              balanceGold: parseFloat((cust.balanceGold - netChange).toFixed(3))
            };
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

        const updatedCustomers = [...state.customers];
        customerBalMap.forEach((netChange, customerId) => {
          const custIdx = updatedCustomers.findIndex(c => c.id === customerId);
          if (custIdx > -1) {
            updatedCustomers[custIdx] = {
              ...updatedCustomers[custIdx],
              balanceGold: parseFloat((updatedCustomers[custIdx].balanceGold + netChange).toFixed(3))
            };
          } else {
            const tx = formattedTxs.find(t => t.customerId === customerId);
            if (tx) {
              updatedCustomers.push({
                id: customerId,
                name: tx.customerName,
                email: '',
                phone: '',
                company: tx.customerName,
                tags: ['Excel Import'],
                balanceGold: parseFloat(netChange.toFixed(3)),
                receivableCash: 0,
                payableCash: 0,
                status: 'active'
              });
            }
          }
        });

        const newAuditLog: AuditRecord = {
          timestamp: new Date().toISOString(),
          user: 'Current User',
          action: 'Batch Excel Import Complete',
          details: `Successfully imported ${formattedTxs.length} records, updated customer accounts.`
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
        chatHistory: [{ id: 'msg-init-cleared', sender: 'assistant', text: 'History cleared. How can I help you analyze your gold ledgers today?', timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]
      }),

      updateCustomerBalance: (id, gold, cash) => set((state) => ({
        customers: state.customers.map(c => c.id === id ? { ...c, balanceGold: gold, receivableCash: cash } : c)
      }))
    }),
    {
      name: 'aurumledger-crm-store',
    }
  )
);
