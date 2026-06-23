import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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
  deleteAccount: (id: string) => Promise<boolean>;
  updateAccount: (id: string, name: string, status: 'Active' | 'Inactive') => Promise<boolean>;
  addPartnerCapitalTransaction: (partnerId: string, particular: string, amount: number, ref: string) => void;
  addPartner: (name: string, profitShare: number) => void;
  fetchData: (force?: boolean) => Promise<void>;
}

const calculateFineWeight = (net: number, touch: number) => {
  return parseFloat(((net * touch) / 100).toFixed(3));
};

const recalculateAccountBalances = (account: Account): Account => {
  const sortedLedger = [...account.ledger].sort((a, b) => {
    const timeA = new Date(a.date).getTime();
    const timeB = new Date(b.date).getTime();
    if (timeA !== timeB) return timeA - timeB;
    return new Date(a.createdDate).getTime() - new Date(b.createdDate).getTime();
  });

  let runningBalance = 0;
  const updatedLedger = sortedLedger.map((row) => {
    runningBalance = runningBalance - row.debit + row.credit;
    runningBalance = parseFloat(runningBalance.toFixed(3));
    return {
      ...row,
      balance: runningBalance
    };
  });

  const lastUpdated = updatedLedger.length > 0 
    ? updatedLedger[updatedLedger.length - 1].date 
    : new Date().toISOString().split('T')[0];

  return {
    ...account,
    currentBalance: runningBalance,
    lastUpdated,
    ledger: updatedLedger
  };
};

export const useExcelLedgerStore = create<ExcelLedgerState>()(
  persist(
    (set, get) => ({
      accounts: [],
      partners: [],
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
      addVaultUser: (user) => set((state) => ({
        vaultUsers: [...state.vaultUsers, { ...user, status: 'Active' }]
      })),

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
        // No-op on persistent client store.
      },

      addAccount: async (name, status, grossWeight, stoneWeight, touch, added_touch = 0) => {
        const id = `acc-${Math.floor(100000 + Math.random() * 900000)}`;
        const grossNum = parseFloat(grossWeight as any) || 0;
        const stoneNum = parseFloat(stoneWeight as any) || 0;
        const netWeight = parseFloat((grossNum - stoneNum).toFixed(3));
        const touchNum = parseFloat(touch as any) || 0;
        const addedTouchNum = parseFloat(added_touch as any) || 0;
        const credit = calculateFineWeight(netWeight, touchNum);

        const newAccount: Account = {
          id,
          name,
          status,
          currentBalance: 0,
          lastUpdated: new Date().toISOString(),
          ledger: []
        };

        if (grossNum > 0) {
          const openingRow: LedgerRow = {
            id: `row-${Math.floor(100000 + Math.random() * 900000)}`,
            date: new Date().toISOString().split('T')[0],
            particular: 'Opening Balance',
            grossWeight: grossNum,
            stoneWeight: stoneNum,
            netWeight,
            touch: touchNum,
            added_touch: addedTouchNum,
            touch_value: parseFloat(((netWeight * addedTouchNum) / 100).toFixed(3)),
            debit: 0,
            credit,
            balance: credit,
            notes: 'Initial opening balance',
            createdDate: new Date().toISOString(),
            updatedDate: new Date().toISOString(),
            attachments: [],
            auditHistory: [{ timestamp: new Date().toISOString(), user: 'System', action: 'Initialized balance' }]
          };
          newAccount.ledger.push(openingRow);
          newAccount.currentBalance = credit;
        }

        set((state) => {
          const updatedAccounts = [...state.accounts, newAccount];
          return {
            accounts: updatedAccounts,
            activeAccountId: state.activeAccountId || id
          };
        });
        return true;
      },

      deleteAccount: async (id) => {
        set((state) => {
          const updatedAccounts = state.accounts.filter((acc) => acc.id !== id);
          const nextActiveId = state.activeAccountId === id
            ? (updatedAccounts[0]?.id || '')
            : state.activeAccountId;
          return {
            accounts: updatedAccounts,
            activeAccountId: nextActiveId
          };
        });
        return true;
      },

      updateAccount: async (id, name, status) => {
        set((state) => {
          const updatedAccounts = state.accounts.map((acc) => {
            if (acc.id === id) {
              return {
                ...acc,
                name,
                status,
                lastUpdated: new Date().toISOString()
              };
            }
            return acc;
          });
          return { accounts: updatedAccounts };
        });
        return true;
      },

      addLedgerRow: (accountId, row) => {
        const grossNum = parseFloat(row.grossWeight as any) || 0;
        const stoneNum = parseFloat(row.stoneWeight as any) || 0;
        const netWeight = parseFloat((grossNum - stoneNum).toFixed(3));
        const touchNum = parseFloat(row.touch as any) || 0;
        const addedTouchNum = parseFloat(row.added_touch as any) || 0;
        const touchValue = parseFloat(((netWeight * addedTouchNum) / 100).toFixed(3));

        const isCredit = row.particular === 'Opening Balance' || row.particular === 'WT RCVD';
        const credit = isCredit ? touchValue : 0;
        const debit = !isCredit ? touchValue : 0;

        const newRow: LedgerRow = {
          ...row,
          id: `row-${Math.floor(100000 + Math.random() * 900000)}`,
          grossWeight: grossNum,
          stoneWeight: stoneNum,
          netWeight,
          touch: touchNum,
          added_touch: addedTouchNum,
          touch_value: touchValue,
          debit,
          credit,
          balance: 0,
          notes: row.notes || '',
          attachments: row.attachments || [],
          createdDate: new Date().toISOString(),
          updatedDate: new Date().toISOString(),
          auditHistory: [{ timestamp: new Date().toISOString(), user: 'System', action: 'Added transaction row' }]
        };

        set((state) => {
          const updatedAccounts = state.accounts.map((acc) => {
            if (acc.id === accountId) {
              const updatedAcc = {
                ...acc,
                ledger: [...acc.ledger, newRow]
              };
              return recalculateAccountBalances(updatedAcc);
            }
            return acc;
          });
          return { accounts: updatedAccounts };
        });
      },

      deleteLedgerRow: (accountId, rowId) => {
        set((state) => {
          const updatedAccounts = state.accounts.map((acc) => {
            if (acc.id === accountId) {
              const updatedAcc = {
                ...acc,
                ledger: acc.ledger.filter((r) => r.id !== rowId)
              };
              return recalculateAccountBalances(updatedAcc);
            }
            return acc;
          });
          return { accounts: updatedAccounts };
        });
      },

      updateLedgerCell: (accountId, rowId, field, value) => {
        set((state) => {
          const updatedAccounts = state.accounts.map((acc) => {
            if (acc.id === accountId) {
              const updatedLedger = acc.ledger.map((row) => {
                if (row.id === rowId) {
                  const updatedRow = {
                    ...row,
                    [field]: value,
                    updatedDate: new Date().toISOString()
                  };
                  
                  if (field === 'grossWeight' || field === 'stoneWeight' || field === 'added_touch' || field === 'particular') {
                    const grossNum = parseFloat(updatedRow.grossWeight as any) || 0;
                    const stoneNum = parseFloat(updatedRow.stoneWeight as any) || 0;
                    const netWeight = parseFloat((grossNum - stoneNum).toFixed(3));
                    const addedTouchNum = parseFloat(updatedRow.added_touch as any) || 0;
                    const touchValue = parseFloat(((netWeight * addedTouchNum) / 100).toFixed(3));
                    const isCredit = updatedRow.particular === 'Opening Balance' || updatedRow.particular === 'WT RCVD';
                    
                    updatedRow.netWeight = netWeight;
                    updatedRow.touch_value = touchValue;
                    updatedRow.credit = isCredit ? touchValue : 0;
                    updatedRow.debit = !isCredit ? touchValue : 0;
                  }
                  
                  return updatedRow;
                }
                return row;
              });
              
              return recalculateAccountBalances({
                ...acc,
                ledger: updatedLedger
              });
            }
            return acc;
          });
          return { accounts: updatedAccounts };
        });
      },

      updateLedgerRow: async (accountId, rowId, rowUpdates) => {
        set((state) => {
          const updatedAccounts = state.accounts.map((acc) => {
            if (acc.id === accountId) {
              const updatedLedger = acc.ledger.map((row) => {
                if (row.id === rowId) {
                  const updatedRow = {
                    ...row,
                    ...rowUpdates,
                    updatedDate: new Date().toISOString()
                  };
                  
                  const grossNum = parseFloat(updatedRow.grossWeight as any) || 0;
                  const stoneNum = parseFloat(updatedRow.stoneWeight as any) || 0;
                  const netWeight = parseFloat((grossNum - stoneNum).toFixed(3));
                  const addedTouchNum = parseFloat(updatedRow.added_touch as any) || 0;
                  const touchValue = parseFloat(((netWeight * addedTouchNum) / 100).toFixed(3));
                  const isCredit = updatedRow.particular === 'Opening Balance' || updatedRow.particular === 'WT RCVD';
                  
                  updatedRow.netWeight = netWeight;
                  updatedRow.touch_value = touchValue;
                  updatedRow.credit = isCredit ? touchValue : 0;
                  updatedRow.debit = !isCredit ? touchValue : 0;
                  
                  return updatedRow;
                }
                return row;
              });
              
              return recalculateAccountBalances({
                ...acc,
                ledger: updatedLedger
              });
            }
            return acc;
          });
          return { accounts: updatedAccounts };
        });
      },

      importExcelData: (accountName, rows) => {
        set((state) => {
          const targetAccount = state.accounts.find(
            (acc) => acc.name.toLowerCase() === accountName.trim().toLowerCase()
          );
          
          const newRows: LedgerRow[] = rows.map((row, idx) => {
            const grossNum = parseFloat(row.grossWeight as any) || 0;
            const stoneNum = parseFloat(row.stoneWeight as any) || 0;
            const netWeight = parseFloat((grossNum - stoneNum).toFixed(3));
            const touchNum = parseFloat(row.touch as any) || 0;
            const addedTouchNum = parseFloat(row.added_touch as any) || 0;
            const touchValue = parseFloat(((netWeight * addedTouchNum) / 100).toFixed(3));
            
            const isCredit = row.particular === 'Opening Balance' || row.particular === 'WT RCVD';
            const credit = isCredit ? touchValue : 0;
            const debit = !isCredit ? touchValue : 0;
            
            return {
              ...row,
              id: `row-import-${Date.now()}-${idx}`,
              grossWeight: grossNum,
              stoneWeight: stoneNum,
              netWeight,
              touch: touchNum,
              added_touch: addedTouchNum,
              touch_value: touchValue,
              debit,
              credit,
              balance: 0,
              notes: row.notes || '',
              attachments: row.attachments || [],
              createdDate: new Date().toISOString(),
              updatedDate: new Date().toISOString()
            };
          });
          
          let updatedAccounts;
          let targetAccountId = '';
          
          if (targetAccount) {
            targetAccountId = targetAccount.id;
            updatedAccounts = state.accounts.map((acc) => {
              if (acc.id === targetAccountId) {
                const updated = {
                  ...acc,
                  ledger: [...acc.ledger, ...newRows]
                };
                return recalculateAccountBalances(updated);
              }
              return acc;
            });
          } else {
            targetAccountId = `acc-${Math.floor(100000 + Math.random() * 900000)}`;
            const newAcc: Account = {
              id: targetAccountId,
              name: accountName.trim(),
              status: 'Active',
              currentBalance: 0,
              lastUpdated: new Date().toISOString(),
              ledger: newRows
            };
            const recalculated = recalculateAccountBalances(newAcc);
            updatedAccounts = [...state.accounts, recalculated];
          }
          
          return {
            accounts: updatedAccounts,
            activeAccountId: state.activeAccountId || targetAccountId
          };
        });
      },

      addPartner: (name, profitShare) => {
        const id = `partner-${Math.floor(100000 + Math.random() * 900000)}`;
        const newPartner: PartnerCapital = {
          id,
          name,
          capitalBalance: 0,
          profitShare,
          history: []
        };
        set((state) => ({
          partners: [...state.partners, newPartner]
        }));
      },

      addPartnerCapitalTransaction: (partnerId, particular, amount, ref) => {
        set((state) => {
          const updatedPartners = state.partners.map((partner) => {
            if (partner.id === partnerId) {
              const newTx = {
                date: new Date().toISOString().split('T')[0],
                particular,
                amount: parseFloat(amount as any) || 0,
                ref
              };
              const updatedHistory = [...partner.history, newTx];
              const newBalance = partner.capitalBalance + (parseFloat(amount as any) || 0);
              return {
                ...partner,
                capitalBalance: parseFloat(newBalance.toFixed(3)),
                history: updatedHistory
              };
            }
            return partner;
          });
          return { partners: updatedPartners };
        });
      }
    }),
    {
      name: 'aurumledger-excel-store',
    }
  )
);

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
