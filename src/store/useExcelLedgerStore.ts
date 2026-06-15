import { create } from 'zustand';

export interface AuditRecord {
  timestamp: string;
  user: string;
  action: string;
  details?: string;
}

export interface LedgerRow {
  id: string;
  date: string;
  particular: string; // opening balance, WT RCVD, sale, adjustments
  grossWeight: number;
  stoneWeight: number;
  netWeight: number; // gross - stone
  touch: number; // e.g. 99.90, 99.50, 91.60, 75.00
  debit: number; // gold debited (outward)
  credit: number; // gold credited (inbound)
  balance: number; // fine gold running balance
  notes?: string;
  attachments?: string[];
  createdDate: string;
  updatedDate: string;
  auditHistory?: AuditRecord[];
}

export interface Account {
  id: string;
  name: string;
  currentBalance: number; // total fine gold balance
  status: 'Active' | 'Inactive';
  lastUpdated: string;
  ledger: LedgerRow[];
}

export interface PartnerCapital {
  id: string;
  name: string;
  capitalBalance: number; // grams of fine gold
  profitShare: number; // e.g. 45%
  history: Array<{
    date: string;
    particular: string;
    amount: number;
    ref: string;
  }>;
}

export interface UserSession {
  name: string;
  email: string;
}

interface ExcelLedgerState {
  accounts: Account[];
  partners: PartnerCapital[];
  activeAccountId: string;
  selectedRowId: string | null;
  sidebarCollapsed: boolean;
  themeMode: 'light' | 'dark';
  goldRate: number; // USD per gram
  selectedCurrency: 'USD' | 'INR' | 'AED' | 'EUR';
  setSelectedCurrency: (currency: 'USD' | 'INR' | 'AED' | 'EUR') => void;
  globalSearchQuery: string;
  setGlobalSearchQuery: (query: string) => void;
  currentUser: UserSession;
  setCurrentUser: (user: UserSession) => void;

  // Actions
  setActiveAccountId: (id: string) => void;
  setSelectedRowId: (id: string | null) => void;
  toggleSidebar: () => void;
  setThemeMode: (mode: 'light' | 'dark') => void;
  addLedgerRow: (accountId: string, row: Omit<LedgerRow, 'id' | 'netWeight' | 'balance' | 'createdDate' | 'updatedDate'>) => void;
  deleteLedgerRow: (accountId: string, rowId: string) => void;
  updateLedgerCell: (accountId: string, rowId: string, field: keyof LedgerRow, value: any) => void;
  importExcelData: (accountName: string, rows: Omit<LedgerRow, 'id' | 'balance' | 'createdDate' | 'updatedDate'>[]) => void;
  addAccount: (name: string, status: 'Active' | 'Inactive', grossWeight: number, stoneWeight: number, touch: number) => void;
  addPartnerCapitalTransaction: (partnerId: string, particular: string, amount: number, ref: string) => void;
  addPartner: (name: string, profitShare: number) => void;
}

const calculateFineWeight = (net: number, touch: number) => {
  return parseFloat(((net * touch) / 100).toFixed(3));
};

// Initial Mock Ledger rows for Al-Jazeera Jewellers
const alJazeeraLedger: LedgerRow[] = [
  {
    id: 'row-1',
    date: '2026-06-01',
    particular: 'Opening Balance',
    grossWeight: 500.00,
    stoneWeight: 0.00,
    netWeight: 500.00,
    touch: 99.90,
    debit: 0,
    credit: 499.50, // Fine Gold: (500 * 99.90)/100
    balance: 499.50,
    notes: 'Starting balance forward from Excel workbook Sheet1.',
    createdDate: '2026-06-01T09:00:00Z',
    updatedDate: '2026-06-01T09:00:00Z',
    attachments: ['opening_bal_sheet.pdf'],
    auditHistory: [{ timestamp: '2026-06-01T09:00:00Z', user: 'System Ingest', action: 'Initialized balance' }]
  },
  {
    id: 'row-2',
    date: '2026-06-05',
    particular: 'WT RCVD',
    grossWeight: 250.50,
    stoneWeight: 0.50,
    netWeight: 250.00,
    touch: 99.50,
    debit: 0,
    credit: 248.75, // Fine Gold: (250 * 99.50)/100
    balance: 748.25,
    notes: 'Physical bullion bar deposit.',
    createdDate: '2026-06-05T14:30:00Z',
    updatedDate: '2026-06-05T14:30:00Z',
    attachments: ['assay_receipt.jpg'],
    auditHistory: [{ timestamp: '2026-06-05T14:30:00Z', user: 'Vault Operator', action: 'Approved deposit' }]
  },
  {
    id: 'row-3',
    date: '2026-06-10',
    particular: 'Sale',
    grossWeight: 100.00,
    stoneWeight: 0.00,
    netWeight: 100.00,
    touch: 99.90,
    debit: 99.90,
    credit: 0,
    balance: 648.35,
    notes: 'Outward bullion delivery order.',
    createdDate: '2026-06-10T11:00:00Z',
    updatedDate: '2026-06-10T11:00:00Z',
    attachments: [],
    auditHistory: [{ timestamp: '2026-06-10T11:00:00Z', user: 'Sales Rep', action: 'Order dispatched' }]
  },
  {
    id: 'row-4',
    date: '2026-06-12',
    particular: 'Adjustment',
    grossWeight: 5.20,
    stoneWeight: 0.20,
    netWeight: 5.00,
    touch: 91.60,
    debit: 4.58, // Fine Gold: (5 * 91.6)/100
    credit: 0,
    balance: 643.77,
    notes: 'Assay calibration weight correction.',
    createdDate: '2026-06-12T16:00:00Z',
    updatedDate: '2026-06-12T16:00:00Z',
    attachments: [],
    auditHistory: [{ timestamp: '2026-06-12T16:00:00Z', user: 'Audit Admin', action: 'Calibration adjusted' }]
  }
];

const nadirLedger: LedgerRow[] = [
  {
    id: 'row-5',
    date: '2026-06-02',
    particular: 'Opening Balance',
    grossWeight: 1000.00,
    stoneWeight: 0.00,
    netWeight: 1000.00,
    touch: 99.90,
    debit: 999.00,
    credit: 0,
    balance: -999.00,
    notes: 'Owed refinery balance forward.',
    createdDate: '2026-06-02T10:00:00Z',
    updatedDate: '2026-06-02T10:00:00Z',
    auditHistory: []
  },
  {
    id: 'row-6',
    date: '2026-06-08',
    particular: 'WT RCVD',
    grossWeight: 500.00,
    stoneWeight: 0.00,
    netWeight: 500.00,
    touch: 99.50,
    debit: 0,
    credit: 497.50,
    balance: -501.50,
    notes: 'Refined gold bar release.',
    createdDate: '2026-06-08T15:00:00Z',
    updatedDate: '2026-06-08T15:00:00Z',
    auditHistory: []
  }
];

const initialAccounts: Account[] = [];

const initialPartners: PartnerCapital[] = [];

export const useExcelLedgerStore = create<ExcelLedgerState>((set) => ({
  accounts: initialAccounts,
  partners: initialPartners,
  activeAccountId: '',
  selectedRowId: null,
  sidebarCollapsed: false,
  themeMode: 'light',
  goldRate: 75.12,
  selectedCurrency: 'USD',
  setSelectedCurrency: (currency) => set({ selectedCurrency: currency }),
  globalSearchQuery: '',
  setGlobalSearchQuery: (query) => set({ globalSearchQuery: query }),
  currentUser: { name: 'Alexander Wright', email: 'alex.wright@aurumledger.pro' },
  setCurrentUser: (user) => set({ currentUser: user }),

  setActiveAccountId: (id) => set({ activeAccountId: id }),
  setSelectedRowId: (id) => set({ selectedRowId: id }),
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setThemeMode: (mode) => set({ themeMode: mode }),

  addAccount: (name, status, grossWeight, stoneWeight, touch) => set((state) => {
    const isAlready = state.accounts.some(acc => acc.name.toLowerCase() === name.toLowerCase());
    if (isAlready) return {}; // Return empty to make no change

    const accountId = `acc-${Math.floor(100 + Math.random() * 900)}`;
    const ledger: LedgerRow[] = [];
    const netWeight = grossWeight - stoneWeight;
    const fineWeight = parseFloat(((netWeight * touch) / 100).toFixed(3));

    if (fineWeight !== 0) {
      const dateStr = new Date().toISOString().split('T')[0];

      ledger.push({
        id: `row-${Math.floor(1000 + Math.random() * 9000)}`,
        date: dateStr,
        particular: 'Opening Balance',
        grossWeight,
        stoneWeight,
        netWeight,
        touch,
        debit: 0,
        credit: fineWeight,
        balance: fineWeight,
        notes: 'Manual account initialization physical gold opening balance.',
        createdDate: new Date().toISOString(),
        updatedDate: new Date().toISOString(),
        attachments: [],
        auditHistory: [{ timestamp: new Date().toISOString(), user: 'Current User', action: 'Created account with physical opening balance' }]
      });
    }

    const newAccount: Account = {
      id: accountId,
      name,
      currentBalance: fineWeight,
      status,
      lastUpdated: new Date().toISOString().split('T')[0],
      ledger
    };

    return {
      accounts: [...state.accounts, newAccount],
      activeAccountId: accountId
    };
  }),

  addLedgerRow: (accountId, row) => set((state) => {
    const netWeight = row.grossWeight - row.stoneWeight;
    const fineWeight = calculateFineWeight(netWeight, row.touch);

    const isCredit = row.particular === 'Opening Balance' || row.particular === 'WT RCVD';
    const finalCredit = isCredit ? fineWeight : 0;
    const finalDebit = !isCredit ? fineWeight : 0;

    const newRow: LedgerRow = {
      ...row,
      id: `row-${Math.floor(1000 + Math.random() * 9000)}`,
      netWeight,
      debit: finalDebit,
      credit: finalCredit,
      balance: 0, // recalculated below
      createdDate: new Date().toISOString(),
      updatedDate: new Date().toISOString(),
      auditHistory: [{ timestamp: new Date().toISOString(), user: 'Current User', action: 'Created transaction row' }]
    };

    const updatedAccounts = state.accounts.map(acc => {
      if (acc.id === accountId) {
        const sortedLedger = [...acc.ledger, newRow].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        // Recalculate running balance
        let balance = 0;
        const recalculatedLedger = sortedLedger.map(item => {
          balance = balance - item.debit + item.credit;
          return { ...item, balance: parseFloat(balance.toFixed(3)) };
        });

        return {
          ...acc,
          currentBalance: parseFloat(balance.toFixed(3)),
          lastUpdated: newRow.date,
          ledger: recalculatedLedger
        };
      }
      return acc;
    });

    return { accounts: updatedAccounts };
  }),

  deleteLedgerRow: (accountId, rowId) => set((state) => {
    const updatedAccounts = state.accounts.map(acc => {
      if (acc.id === accountId) {
        const filteredLedger = acc.ledger.filter(r => r.id !== rowId);
        
        let balance = 0;
        const recalculatedLedger = filteredLedger.map(item => {
          balance = balance - item.debit + item.credit;
          return { ...item, balance: parseFloat(balance.toFixed(3)) };
        });

        return {
          ...acc,
          currentBalance: parseFloat(balance.toFixed(3)),
          ledger: recalculatedLedger
        };
      }
      return acc;
    });

    return { 
      accounts: updatedAccounts,
      selectedRowId: state.selectedRowId === rowId ? null : state.selectedRowId
    };
  }),

  updateLedgerCell: (accountId, rowId, field, value) => set((state) => {
    const updatedAccounts = state.accounts.map(acc => {
      if (acc.id === accountId) {
        const updatedLedger = acc.ledger.map(row => {
          if (row.id === rowId) {
            const updatedRow = { 
              ...row, 
              [field]: value, 
              updatedDate: new Date().toISOString()
            };

            // Recalculate weights if gross, stone or touch changed
            if (field === 'grossWeight' || field === 'stoneWeight' || field === 'touch' || field === 'particular') {
              updatedRow.netWeight = updatedRow.grossWeight - updatedRow.stoneWeight;
              const fineWeight = calculateFineWeight(updatedRow.netWeight, updatedRow.touch);
              
              const isCredit = updatedRow.particular === 'Opening Balance' || updatedRow.particular === 'WT RCVD';
              updatedRow.credit = isCredit ? fineWeight : 0;
              updatedRow.debit = !isCredit ? fineWeight : 0;
            }

            const audit = {
              timestamp: new Date().toISOString(),
              user: 'Current User',
              action: 'Modified cell',
              details: `Field "${String(field)}" edited to "${String(value)}"`
            };
            updatedRow.auditHistory = [...(row.auditHistory || []), audit];

            return updatedRow;
          }
          return row;
        });

        // Recalculate running balance
        let balance = 0;
        const recalculatedLedger = updatedLedger.map(item => {
          balance = balance - item.debit + item.credit;
          return { ...item, balance: parseFloat(balance.toFixed(3)) };
        });

        return {
          ...acc,
          currentBalance: parseFloat(balance.toFixed(3)),
          ledger: recalculatedLedger
        };
      }
      return acc;
    });

    return { accounts: updatedAccounts };
  }),

  importExcelData: (accountName, rows) => set((state) => {
    // Check if account already exists
    let account = state.accounts.find(a => a.name.toLowerCase() === accountName.toLowerCase());
    
    const newRows: LedgerRow[] = rows.map((r, idx) => {
      const netWeight = r.grossWeight - r.stoneWeight;
      const fineWeight = calculateFineWeight(netWeight, r.touch);
      const isCredit = r.particular === 'Opening Balance' || r.particular === 'WT RCVD';

      return {
        ...r,
        id: `row-imp-${Math.floor(2000 + Math.random() * 8000) + idx}`,
        netWeight,
        debit: !isCredit ? fineWeight : 0,
        credit: isCredit ? fineWeight : 0,
        balance: 0,
        createdDate: new Date().toISOString(),
        updatedDate: new Date().toISOString(),
        auditHistory: [{ timestamp: new Date().toISOString(), user: 'Import Engine', action: 'Imported from Excel workbook' }]
      };
    });

    const updatedAccounts = state.accounts.map(acc => {
      if (account && acc.id === account.id) {
        const mergedLedger = [...acc.ledger, ...newRows].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        let balance = 0;
        const recalculatedLedger = mergedLedger.map(item => {
          balance = balance - item.debit + item.credit;
          return { ...item, balance: parseFloat(balance.toFixed(3)) };
        });

        return {
          ...acc,
          currentBalance: parseFloat(balance.toFixed(3)),
          lastUpdated: new Date().toISOString().split('T')[0],
          ledger: recalculatedLedger
        };
      }
      return acc;
    });

    // If account did not exist, create a new one
    if (!account) {
      let balance = 0;
      const recalculatedLedger = newRows.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map(item => {
        balance = balance - item.debit + item.credit;
        return { ...item, balance: parseFloat(balance.toFixed(3)) };
      });

      const newAccount: Account = {
        id: `acc-${Math.floor(100 + Math.random() * 900)}`,
        name: accountName,
        currentBalance: parseFloat(balance.toFixed(3)),
        status: 'Active',
        lastUpdated: new Date().toISOString().split('T')[0],
        ledger: recalculatedLedger
      };

      return { accounts: [...state.accounts, newAccount] };
    }

    return { accounts: updatedAccounts };
  }),

  addPartnerCapitalTransaction: (partnerId, particular, amount, ref) => set((state) => {
    const updatedPartners = state.partners.map(p => {
      if (p.id === partnerId) {
        const dateStr = new Date().toISOString().split('T')[0];
        const newHistoryItem = {
          date: dateStr,
          particular,
          amount,
          ref
        };
        const newBalance = parseFloat((p.capitalBalance + amount).toFixed(3));
        return {
          ...p,
          capitalBalance: newBalance,
          history: [newHistoryItem, ...p.history]
        };
      }
      return p;
    });
    return { partners: updatedPartners };
  }),

  addPartner: (name, profitShare) => set((state) => {
    const partnerId = `p-${Math.floor(100 + Math.random() * 900)}`;
    const newPartner: PartnerCapital = {
      id: partnerId,
      name,
      capitalBalance: 0,
      profitShare,
      history: []
    };
    return {
      partners: [...state.partners, newPartner]
    };
  })
}));

export const formatCurrency = (valInGrams: number, goldRateInUSD: number, currencyCode: 'USD' | 'INR' | 'AED' | 'EUR') => {
  const valueInUSD = Math.abs(valInGrams) * goldRateInUSD;
  let rate = 1.0;
  let symbol = '$';
  
  if (currencyCode === 'INR') {
    rate = 83.50;
    symbol = '₹';
  } else if (currencyCode === 'AED') {
    rate = 3.67;
    symbol = 'AED ';
  } else if (currencyCode === 'EUR') {
    rate = 0.92;
    symbol = '€';
  }

  const converted = valueInUSD * rate;
  return `${symbol}${converted.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};
