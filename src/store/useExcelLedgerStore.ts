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
  added_touch?: number; // Added Touch % (e.g. 92)
  touch_value?: number; // Calculated Touch = (Net Weight * Added Touch) / 100
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

export interface VaultUser {
  name: string;
  email: string;
  role: 'Super Admin' | 'Operator' | 'Viewer';
  status: 'Active' | 'Inactive';
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
  vaultUsers: VaultUser[];
  addVaultUser: (user: Omit<VaultUser, 'status'>) => void;

  // Actions
  setActiveAccountId: (id: string) => void;
  setSelectedRowId: (id: string | null) => void;
  toggleSidebar: () => void;
  setThemeMode: (mode: 'light' | 'dark') => void;
  addLedgerRow: (accountId: string, row: Omit<LedgerRow, 'id' | 'netWeight' | 'balance' | 'createdDate' | 'updatedDate'>) => void;
  deleteLedgerRow: (accountId: string, rowId: string) => void;
  updateLedgerCell: (accountId: string, rowId: string, field: keyof LedgerRow, value: any) => void;
  updateLedgerRow: (accountId: string, rowId: string, row: Partial<Omit<LedgerRow, 'id' | 'netWeight' | 'balance' | 'createdDate' | 'updatedDate'>>) => Promise<void>;
  importExcelData: (accountName: string, rows: Omit<LedgerRow, 'id' | 'balance' | 'createdDate' | 'updatedDate'>[]) => void;
  addAccount: (name: string, status: 'Active' | 'Inactive', grossWeight: number, stoneWeight: number, touch: number, added_touch?: number) => Promise<boolean>;
  deleteAccount: (id: string) => Promise<void>;
  updateAccount: (id: string, name: string, status: 'Active' | 'Inactive') => Promise<void>;
  addPartnerCapitalTransaction: (partnerId: string, particular: string, amount: number, ref: string) => void;
  addPartner: (name: string, profitShare: number) => void;
  fetchData: (force?: boolean) => Promise<void>;
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

export const useExcelLedgerStore = create<ExcelLedgerState>((set, get) => ({
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
  vaultUsers: [],
  addVaultUser: async (user) => {
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user),
      });
      if (res.ok) {
        await get().fetchData(true);
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to add vault user');
      }
    } catch (e) {
      console.error('Error adding vault user:', e);
    }
  },

  setActiveAccountId: (id) => set({ activeAccountId: id }),
  setSelectedRowId: (id) => set({ selectedRowId: id }),
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setThemeMode: (mode) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('themeMode', mode);
    }
    set({ themeMode: mode });
  },

  fetchData: async (force = false) => {
    if (!force && get().accounts.length > 0) {
      return;
    }
    try {
      const [accountsRes, partnersRes, usersRes] = await Promise.all([
        fetch('/api/accounts'),
        fetch('/api/partners'),
        fetch('/api/users')
      ]);

      if (!accountsRes.ok) throw new Error('Failed to fetch accounts');
      if (!partnersRes.ok) throw new Error('Failed to fetch partners');
      if (!usersRes.ok) throw new Error('Failed to fetch users');

      const [accountsData, partnersData, usersData] = await Promise.all([
        accountsRes.json(),
        partnersRes.json(),
        usersRes.json()
      ]);
      
      set({
        accounts: Array.isArray(accountsData) ? accountsData : [],
        partners: Array.isArray(partnersData) ? partnersData : [],
        vaultUsers: Array.isArray(usersData) ? usersData : [],
        activeAccountId: get().activeAccountId || (accountsData[0]?.id || '')
      });
    } catch (e) {
      console.error('Error fetching data from database:', e);
    }
  },

  addAccount: async (name, status, grossWeight, stoneWeight, touch, added_touch = 0) => {
    try {
      const res = await fetch('/api/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, status, grossWeight, stoneWeight, touch, added_touch }),
      });
      if (res.ok) {
        await get().fetchData(true);
        return true;
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to create client account');
        return false;
      }
    } catch (e) {
      console.error('Error creating account:', e);
      return false;
    }
  },

  deleteAccount: async (id) => {
    try {
      const res = await fetch(`/api/accounts/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        await get().fetchData(true);
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to delete client account');
      }
    } catch (e) {
      console.error('Error deleting account:', e);
    }
  },

  updateAccount: async (id, name, status) => {
    try {
      const res = await fetch(`/api/accounts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, status }),
      });
      if (res.ok) {
        await get().fetchData(true);
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to update client account');
      }
    } catch (e) {
      console.error('Error updating account:', e);
    }
  },

  addLedgerRow: async (accountId, row) => {
    try {
      const res = await fetch('/api/ledgers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId, ...row }),
      });
      if (res.ok) {
        await get().fetchData(true);
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to add transaction row');
      }
    } catch (e) {
      console.error('Error adding ledger row:', e);
    }
  },

  deleteLedgerRow: async (accountId, rowId) => {
    try {
      const res = await fetch(`/api/ledgers/${rowId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        await get().fetchData(true);
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to delete transaction row');
      }
    } catch (e) {
      console.error('Error deleting ledger row:', e);
    }
  },

  updateLedgerCell: async (accountId, rowId, field, value) => {
    try {
      const res = await fetch(`/api/ledgers/${rowId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ field, value }),
      });
      if (res.ok) {
        await get().fetchData(true);
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to update transaction cell');
      }
    } catch (e) {
      console.error('Error updating ledger cell:', e);
    }
  },

  updateLedgerRow: async (accountId, rowId, row) => {
    try {
      const res = await fetch(`/api/ledgers/${rowId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(row),
      });
      if (res.ok) {
        await get().fetchData(true);
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to update transaction row');
      }
    } catch (e) {
      console.error('Error updating ledger row:', e);
    }
  },

  importExcelData: async (accountName, rows) => {
    try {
      const res = await fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountName, rows }),
      });
      if (res.ok) {
        await get().fetchData(true);
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to import excel data');
      }
    } catch (e) {
      console.error('Error importing excel data:', e);
    }
  },

  addPartnerCapitalTransaction: async (partnerId, particular, amount, ref) => {
    try {
      const res = await fetch(`/api/partners/${partnerId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ particular, amount, ref }),
      });
      if (res.ok) {
        await get().fetchData(true);
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to add partner capital transaction');
      }
    } catch (e) {
      console.error('Error adding partner transaction:', e);
    }
  },

  addPartner: async (name, profitShare) => {
    try {
      const res = await fetch('/api/partners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, profitShare }),
      });
      if (res.ok) {
        await get().fetchData(true);
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to create partner');
      }
    } catch (e) {
      console.error('Error creating partner:', e);
    }
  }
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
