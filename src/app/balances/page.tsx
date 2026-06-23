'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import { useExcelLedgerStore, Account, formatCurrency } from '@/store/useExcelLedgerStore';
import { 
  exportToExcel, 
  exportToCSV, 
  exportToPDF 
} from '@/lib/exportUtils';
import { 
  Search, 
  ArrowUpDown, 
  Download, 
  ExternalLink,
  ChevronRight,
  Filter,
  Plus,
  X,
  CheckCircle,
  Edit3,
  Trash2
} from 'lucide-react';

export default function BalancesPage() {
  const router = useRouter();
  const { 
    accounts, 
    setActiveAccountId, 
    addAccount, 
    deleteAccount,
    updateAccount,
    goldRate,
    selectedCurrency,
    globalSearchQuery,
    setGlobalSearchQuery
  } = useExcelLedgerStore();
  
  // Search & Filter States
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Inactive'>('All');
  const [sortBy, setSortBy] = useState<keyof Account>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Modal Dialog States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientStatus, setNewClientStatus] = useState<'Active' | 'Inactive'>('Active');
  const [grossWeight, setGrossWeight] = useState('');
  const [stoneWeight, setStoneWeight] = useState('0');
  const [addedTouch, setAddedTouch] = useState('99.90');
  const [toastMessage, setToastMessage] = useState('');

  // Edit Modal States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editAccountId, setEditAccountId] = useState('');
  const [editClientName, setEditClientName] = useState('');
  const [editClientStatus, setEditClientStatus] = useState<'Active' | 'Inactive'>('Active');

  // Custom Delete Confirmation Modal States
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState('');
  const [deleteTargetName, setDeleteTargetName] = useState('');

  // Auto-calculated weight previews
  const grossNum = parseFloat(grossWeight) || 0;
  const stoneNum = parseFloat(stoneWeight) || 0;
  const netNum = grossNum - stoneNum;
  const addedTouchNum = parseFloat(addedTouch) || 0;
  const fineEst = parseFloat(((netNum * addedTouchNum) / 100).toFixed(3));

  // Handle row click
  const handleAccountClick = (id: string) => {
    setActiveAccountId(id);
    router.push('/ledgers');
  };

  // Sorting Handler
  const handleSort = (field: keyof Account) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  // Filter & Sort
  const processedAccounts = useMemo(() => {
    return accounts
      .map(acc => {
        const grossBalance = acc.ledger ? acc.ledger.reduce((sum, row) => {
          const isCredit = row.particular === 'Opening Balance' || row.particular === 'WT RCVD';
          return sum + (isCredit ? row.grossWeight : -row.grossWeight);
        }, 0) : 0;
        return {
          ...acc,
          grossBalance: parseFloat(grossBalance.toFixed(3))
        };
      })
      .filter(acc => {
        const matchesSearch = acc.name.toLowerCase().includes(globalSearchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'All' || acc.status === statusFilter;
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        const key = sortBy === 'currentBalance' ? 'grossBalance' : sortBy;
        const valA = (a as any)[key];
        const valB = (b as any)[key];

        if (typeof valA === 'number' && typeof valB === 'number') {
          return sortOrder === 'asc' ? valA - valB : valB - valA;
        }

        const strA = String(valA).toLowerCase();
        const strB = String(valB).toLowerCase();

        if (strA < strB) return sortOrder === 'asc' ? -1 : 1;
        if (strA > strB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
  }, [accounts, globalSearchQuery, statusFilter, sortBy, sortOrder]);

  // Handle manual client addition
  const handleAddClientSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName.trim()) return;

    // Check for duplicates
    const duplicate = accounts.some(acc => acc.name.toLowerCase() === newClientName.trim().toLowerCase());
    if (duplicate) {
      alert('A client account with this name already exists.');
      return;
    }

    addAccount(newClientName.trim(), newClientStatus, grossNum, stoneNum, addedTouchNum, addedTouchNum).then((success) => {
      if (success) {
        // Reset Form & show toast
        setNewClientName('');
        setNewClientStatus('Active');
        setGrossWeight('');
        setStoneWeight('0');
        setAddedTouch('99.90');
        setIsModalOpen(false);
        
        setToastMessage('Client account registered successfully!');
        setTimeout(() => setToastMessage(''), 3000);
      }
    });
  };

  // Handle Edit Client Submit
  const handleEditClientSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editClientName.trim()) return;

    // Check for duplicates (excluding currently edited account)
    const duplicate = accounts.some(acc => acc.id !== editAccountId && acc.name.toLowerCase() === editClientName.trim().toLowerCase());
    if (duplicate) {
      alert('A client account with this name already exists.');
      return;
    }

    updateAccount(editAccountId, editClientName.trim(), editClientStatus);

    setIsEditModalOpen(false);
    setToastMessage('Client account updated successfully!');
    setTimeout(() => setToastMessage(''), 3000);
  };

  // Handle Exports
  const handleExport = (format: 'xlsx' | 'csv' | 'pdf') => {
    const filename = `balances_sheet_${new Date().toISOString().split('T')[0]}`;
    
    // Format flat data for Excel/CSV spreadsheet mapping
    const exportData = processedAccounts.map(acc => ({
      'Account Name': acc.name,
      'Current Gross Balance (g)': acc.grossBalance,
      [`Valuation (${selectedCurrency})`]: formatCurrency(acc.currentBalance, goldRate, selectedCurrency),
      'Status': acc.status,
      'Last Updated': acc.lastUpdated || 'N/A'
    }));

    if (format === 'xlsx') {
      exportToExcel(exportData, filename, 'Client Balances');
    } else if (format === 'csv') {
      exportToCSV(exportData, filename);
    } else if (format === 'pdf') {
      exportToPDF(
        'Client Liability Balances Grid',
        ['Account Name', 'Current Gross Balance (g)', `Valuation (${selectedCurrency})`, 'Status', 'Last Updated'],
        ['Account Name', 'Current Gross Balance (g)', `Valuation (${selectedCurrency})`, 'Status', 'Last Updated'],
        exportData,
        ['left', 'right', 'right', 'center', 'left']
      );
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Title and Toolbar */}
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-text-main">BALANCE Sheet</h1>
            <p className="text-xs text-text-muted mt-1">Direct digital replacement of the BALANCE worksheet. Overview of all client vault liability accounts.</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-2 select-none">
            {/* Create Manual Client */}
            <button 
              onClick={() => setIsModalOpen(true)}
              className="flex items-center space-x-1 px-3 py-2 text-xs font-bold text-white bg-primary-gold hover:opacity-90 rounded shadow-sm transition-opacity"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Client</span>
            </button>

            {/* Export options */}
            <div className="inline-flex rounded border border-border-custom bg-sidebar-bg p-0.5 items-center">
              <span className="px-2 text-[10px] font-bold text-text-muted uppercase tracking-wider">Export As:</span>
              <button 
                onClick={() => handleExport('xlsx')} 
                className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-text-muted hover:text-text-main border-l border-border-custom/50"
              >
                Excel
              </button>
              <button 
                onClick={() => handleExport('csv')} 
                className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-text-muted hover:text-text-main border-l border-border-custom/50"
              >
                CSV
              </button>
              <button 
                onClick={() => handleExport('pdf')} 
                className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-text-muted hover:text-text-main border-l border-border-custom/50"
              >
                PDF
              </button>
            </div>
          </div>
        </div>

        {/* Toast Notification Alert */}
        {toastMessage && (
          <div className="bg-success-custom/10 border border-success-custom/25 p-3 rounded-md flex items-center space-x-2 text-xs text-text-main animate-in fade-in slide-in-from-top-1 duration-200">
            <CheckCircle className="w-4 h-4 text-success-custom flex-shrink-0" />
            <span className="font-bold">{toastMessage}</span>
          </div>
        )}

        {/* Filter Toolbar */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-card-bg border border-border-custom p-4 rounded-md shadow-sm">
          {/* Search bar */}
          <div className="relative w-full sm:w-80">
            <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-text-muted" />
            </span>
            <input 
              type="text" 
              placeholder="Search account name..."
              value={globalSearchQuery}
              onChange={(e) => setGlobalSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 bg-bg-app text-xs border border-border-custom rounded-md text-text-main focus:outline-none focus:border-primary-gold transition-colors font-medium placeholder-text-muted"
            />
          </div>

          {/* Status filters */}
          <div className="flex items-center space-x-3 w-full sm:w-auto">
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider flex items-center gap-1">
              <Filter className="w-3 h-3" />
              Status Filter
            </span>
            <div className="flex space-x-1 border border-border-custom bg-bg-app p-0.5 rounded">
              {(['All', 'Active', 'Inactive'] as const).map(status => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-colors ${
                    statusFilter === status 
                      ? 'bg-sidebar-bg text-text-main shadow-xs' 
                      : 'text-text-muted hover:text-text-main'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Balance Grid Table */}
        <div className="bg-card-bg border border-border-custom rounded-md shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-bg-app border-b border-border-custom text-[11px] font-bold text-text-muted uppercase tracking-wider select-none">
                  <th className="p-3.5 pl-5 cursor-pointer hover:bg-border-custom/30" onClick={() => handleSort('name')}>
                    <div className="flex items-center gap-1">
                      <span>Account Name</span>
                      <ArrowUpDown className="w-3 h-3 text-text-muted" />
                    </div>
                  </th>
                  <th className="p-3.5 text-right cursor-pointer hover:bg-border-custom/30" onClick={() => handleSort('currentBalance')}>
                    <div className="flex items-center justify-end gap-1">
                      <span>Current Gross Balance</span>
                      <ArrowUpDown className="w-3 h-3 text-text-muted" />
                    </div>
                  </th>
                  <th className="p-3.5 text-right">Cash Valuation ({selectedCurrency})</th>
                  <th className="p-3.5 text-center">Status</th>
                  <th className="p-3.5">Last Updated</th>
                  <th className="p-3.5 text-center pr-5">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-custom/50 font-medium">
                {processedAccounts.length > 0 ? (
                  processedAccounts.map(acc => {
                    return (
                      <tr 
                        key={acc.id}
                        onClick={() => handleAccountClick(acc.id)}
                        className="hover:bg-bg-app cursor-pointer transition-colors"
                      >
                        <td className="p-3.5 pl-5 text-text-main font-semibold">
                          {acc.name}
                        </td>
                        <td className={`p-3.5 text-right font-bold ${
                          acc.grossBalance >= 0 ? 'text-text-main' : 'text-danger-custom'
                        }`}>
                          {acc.grossBalance.toFixed(2)} g
                        </td>
                        <td className="p-3.5 text-right text-text-muted">
                          {formatCurrency(acc.currentBalance, goldRate, selectedCurrency)}
                        </td>
                        <td className="p-3.5 text-center">
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            acc.status === 'Active' ? 'bg-success-custom/10 text-success-custom' : 'bg-text-muted/10 text-text-muted'
                          }`}>
                            {acc.status}
                          </span>
                        </td>
                        <td className="p-3.5 text-text-muted">
                          {acc.lastUpdated ? new Date(acc.lastUpdated).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="p-3.5 text-center pr-5">
                          <div className="flex items-center justify-center gap-1.5">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAccountClick(acc.id);
                              }}
                              className="p-1 rounded hover:bg-bg-app text-primary-gold"
                              title="Open Ledger Sheet"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditAccountId(acc.id);
                                setEditClientName(acc.name);
                                setEditClientStatus(acc.status);
                                setIsEditModalOpen(true);
                              }}
                              className="p-1 rounded hover:bg-bg-app text-text-muted hover:text-text-main"
                              title="Edit Account"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteTargetId(acc.id);
                                setDeleteTargetName(acc.name);
                                setDeleteConfirmOpen(true);
                              }}
                              className="p-1 rounded hover:bg-danger-custom/10 text-danger-custom"
                              title="Delete Account"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-text-muted font-bold">
                      No accounts matched search parameters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ADD CLIENT DIALOG MODAL */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
            <div className="bg-sidebar-bg border border-border-custom rounded-md shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
              <div className="p-4 border-b border-border-custom bg-bg-app/40 flex justify-between items-center select-none">
                <span className="font-bold text-xs text-text-main">Register Client Account</span>
                <button 
                  onClick={() => setIsModalOpen(false)} 
                  className="p-1 hover:bg-bg-app rounded text-text-muted hover:text-text-main"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddClientSubmit} className="p-5 space-y-4 text-xs">
                <div className="flex flex-col space-y-1">
                  <label className="text-[9px] font-bold text-text-muted uppercase tracking-wider">Client Name / Business Entity</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Damascus Goldsmiths Ltd"
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                    className="bg-bg-app border border-border-custom rounded px-2.5 py-1.5 text-xs text-text-main font-semibold focus:outline-none focus:border-primary-gold placeholder-text-muted/60"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col space-y-1">
                    <label className="text-[9px] font-bold text-text-muted uppercase tracking-wider">Account Status</label>
                    <select
                      value={newClientStatus}
                      onChange={(e) => setNewClientStatus(e.target.value as 'Active' | 'Inactive')}
                      className="bg-bg-app border border-border-custom rounded px-2.5 py-1.5 text-xs text-text-main font-semibold focus:outline-none focus:border-primary-gold"
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>

                  <div className="flex flex-col space-y-1">
                    <label className="text-[9px] font-bold text-text-muted uppercase tracking-wider">Purity %</label>
                    <input 
                      type="number"
                      step="0.01"
                      placeholder="e.g. 99.90"
                      value={addedTouch}
                      onChange={(e) => setAddedTouch(e.target.value)}
                      className="bg-bg-app border border-border-custom rounded px-2.5 py-1.5 text-xs text-text-main font-semibold focus:outline-none focus:border-primary-gold placeholder-text-muted/60"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="flex flex-col space-y-1">
                    <label className="text-[9px] font-bold text-text-muted uppercase tracking-wider">Gross (g)</label>
                    <input 
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={grossWeight}
                      onChange={(e) => setGrossWeight(e.target.value)}
                      className="bg-bg-app border border-border-custom rounded px-2 py-1.5 text-xs text-text-main font-semibold focus:outline-none focus:border-primary-gold placeholder-text-muted/60"
                    />
                  </div>

                  <div className="flex flex-col space-y-1">
                    <label className="text-[9px] font-bold text-text-muted uppercase tracking-wider">Stone (g)</label>
                    <input 
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={stoneWeight}
                      onChange={(e) => setStoneWeight(e.target.value)}
                      className="bg-bg-app border border-border-custom rounded px-2 py-1.5 text-xs text-text-main font-semibold focus:outline-none focus:border-primary-gold"
                    />
                  </div>

                  <div className="flex flex-col space-y-1">
                    <label className="text-[9px] font-bold text-text-muted uppercase tracking-wider">Net (g)</label>
                    <input 
                      type="text"
                      value={netNum.toFixed(2)}
                      disabled
                      className="bg-bg-app border border-border-custom/50 text-text-muted rounded px-2 py-1.5 text-xs font-semibold cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="bg-bg-app border border-border-custom p-3 rounded flex justify-between items-center select-none font-sans">
                  <div>
                    <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider block">Net Weight</span>
                    <span className="text-xs font-bold text-text-main block mt-0.5">{netNum.toFixed(2)} g</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider block">Calculated Touch</span>
                    <span className="text-xs font-bold text-text-main block mt-0.5">{fineEst.toFixed(3)} g</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider block">Estimated USD Value</span>
                    <span className="text-xs font-bold text-text-main block mt-0.5">${(fineEst * goldRate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-border-custom">
                  <button 
                    type="button" 
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 border border-border-custom rounded font-bold text-text-muted hover:text-text-main bg-bg-app"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="px-4 py-2 bg-primary-gold hover:opacity-90 rounded font-bold text-white shadow-xs"
                  >
                    Create Account
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* EDIT CLIENT DIALOG MODAL */}
        {isEditModalOpen && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
            <div className="bg-sidebar-bg border border-border-custom rounded-md shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
              <div className="p-4 border-b border-border-custom bg-bg-app/40 flex justify-between items-center select-none">
                <span className="font-bold text-xs text-text-main">Edit Client Account</span>
                <button 
                  onClick={() => setIsEditModalOpen(false)} 
                  className="p-1 hover:bg-bg-app rounded text-text-muted hover:text-text-main"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleEditClientSubmit} className="p-5 space-y-4 text-xs font-semibold">
                <div className="flex flex-col space-y-1">
                  <label className="text-[9px] font-bold text-text-muted uppercase tracking-wider">Client Name / Business Entity</label>
                  <input 
                    type="text" 
                    value={editClientName}
                    onChange={(e) => setEditClientName(e.target.value)}
                    className="bg-bg-app border border-border-custom rounded px-2.5 py-1.5 text-xs text-text-main font-semibold focus:outline-none focus:border-primary-gold"
                    required
                  />
                </div>

                <div className="flex flex-col space-y-1">
                  <label className="text-[9px] font-bold text-text-muted uppercase tracking-wider">Account Status</label>
                  <select
                    value={editClientStatus}
                    onChange={(e) => setEditClientStatus(e.target.value as 'Active' | 'Inactive')}
                    className="bg-bg-app border border-border-custom rounded px-2.5 py-1.5 text-xs text-text-main font-semibold focus:outline-none focus:border-primary-gold"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-border-custom">
                  <button 
                    type="button" 
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-4 py-2 border border-border-custom rounded font-bold text-text-muted hover:text-text-main bg-bg-app"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="px-4 py-2 bg-primary-gold hover:opacity-90 rounded font-bold text-white shadow-xs"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* CUSTOM DELETE CONFIRMATION MODAL CARD */}
        {deleteConfirmOpen && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
            <div className="bg-sidebar-bg border border-border-custom rounded-md shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-150">
              <div className="p-4 border-b border-border-custom bg-bg-app/40 flex justify-between items-center select-none">
                <span className="font-bold text-xs text-text-main">Confirm Deletion</span>
                <button onClick={() => setDeleteConfirmOpen(false)} className="p-1 hover:bg-bg-app rounded text-text-muted hover:text-text-main">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-5 space-y-4 text-xs font-semibold">
                <p className="text-text-muted leading-relaxed">
                  Are you sure you want to delete client account <span className="text-text-main font-bold">"{deleteTargetName}"</span>? This will permanently delete all associated transaction ledger rows.
                </p>
                <div className="flex justify-end gap-2 pt-2 border-t border-border-custom">
                  <button 
                    type="button" 
                    onClick={() => setDeleteConfirmOpen(false)}
                    className="px-4 py-2 border border-border-custom rounded font-bold text-text-muted hover:text-text-main bg-bg-app"
                  >
                    Cancel
                  </button>
                  <button 
                    type="button"
                    onClick={() => {
                      deleteAccount(deleteTargetId);
                      setToastMessage('Client account deleted successfully!');
                      setTimeout(() => setToastMessage(''), 3000);
                      setDeleteConfirmOpen(false);
                    }}
                    className="px-4 py-2 bg-danger-custom hover:opacity-90 rounded font-bold text-white shadow-xs"
                  >
                    Delete Account
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
