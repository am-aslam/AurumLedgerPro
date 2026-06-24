'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import { useExcelLedgerStore, LedgerRow } from '@/store/useExcelLedgerStore';
import { useLedgerStore } from '@/store/useLedgerStore';
import { 
  Trash2, 
  Edit3, 
  CheckCircle, 
  Calendar,
  Layers,
  Sparkles,
  Info,
  Search,
  ArrowRight,
  Plus,
  RefreshCw,
  X
} from 'lucide-react';

interface GridRow {
  id: string;
  accountId: string;
  date: string;
  particular: LedgerRow['particular'];
  grossWeight: number;
  stoneWeight: number;
  netWeight: number;
  touch: number;
  purity: number;
  notes: string;
}

export default function TransactionsPage() {
  const router = useRouter();
  const { 
    accounts, 
    addLedgerRow, 
    deleteLedgerRow, 
    updateLedgerRow,
    currentUser
  } = useExcelLedgerStore();

  const { addAuditLog } = useLedgerStore();
  
  const [mounted, setMounted] = useState(false);
  const [gridRows, setGridRows] = useState<GridRow[]>([]);
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  
  // Custom Autocomplete Searchable Dropdown States
  const [clientSearch, setClientSearch] = useState('');
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [highlightedClientIdx, setHighlightedClientIdx] = useState(0);
  
  // Modal Popups States
  const [showEditPopup, setShowEditPopup] = useState(false);
  const [editPopupRow, setEditPopupRow] = useState<GridRow | null>(null);
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [deletePopupRow, setDeletePopupRow] = useState<GridRow | null>(null);

  // Success message alert
  const [successMsg, setSuccessMsg] = useState('');

  // Section 1 - Form Entry Console state
  const [formData, setFormData] = useState({
    id: '',
    date: new Date().toISOString().split('T')[0],
    accountId: '',
    particular: 'WT RCVD' as LedgerRow['particular'],
    grossWeight: '',
    stoneWeight: '0',
    touch: '99.90',
    notes: ''
  });

  // Load clients and initialize data once mounted
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (accounts.length > 0 && !formData.accountId) {
      setFormData(prev => ({ ...prev, accountId: accounts[0].id }));
      setClientSearch(accounts[0].name);
    }
  }, [accounts, formData.accountId]);

  // Synchronize store data with grid list
  useEffect(() => {
    const allRows: GridRow[] = accounts.flatMap(acc => 
      acc.ledger.map(row => ({
        id: row.id,
        accountId: acc.id,
        date: row.date,
        particular: row.particular || 'WT RCVD',
        grossWeight: row.grossWeight,
        stoneWeight: row.stoneWeight,
        netWeight: row.netWeight,
        touch: row.touch ?? 0,
        purity: row.fineGold ?? row.touch_value ?? 0,
        notes: row.notes || ''
      }))
    ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // descending (newest on top)
    
    setGridRows(allRows);
  }, [accounts]);

  // Autocomplete Filter
  const filteredClients = useMemo(() => {
    return accounts.filter(acc => 
      acc.name.toLowerCase().includes(clientSearch.toLowerCase())
    );
  }, [accounts, clientSearch]);

  // Summaries
  const totals = useMemo(() => {
    let totalGross = 0;
    let totalStone = 0;
    let totalNet = 0;
    let totalFine = 0;

    gridRows.forEach(row => {
      totalGross += row.grossWeight;
      totalStone += row.stoneWeight;
      totalNet += row.netWeight;
      totalFine += row.purity;
    });

    return {
      gross: totalGross.toFixed(3),
      stone: totalStone.toFixed(3),
      net: totalNet.toFixed(3),
      fine: totalFine.toFixed(3)
    };
  }, [gridRows]);

  // Active client object
  const activeClientName = useMemo(() => {
    const client = accounts.find(c => c.id === formData.accountId);
    return client ? client.name : '';
  }, [accounts, formData.accountId]);

  // Net weight & Fine Gold live calculation
  const grossNum = parseFloat(formData.grossWeight) || 0;
  const stoneNum = parseFloat(formData.stoneWeight) || 0;
  const netWeight = parseFloat((grossNum - stoneNum).toFixed(3));
  const touchNum = parseFloat(formData.touch) || 0;
  const fineGold = parseFloat(((netWeight * touchNum) / 100).toFixed(3));

  // Focus utility
  const focusField = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.focus();
      if (el.tagName === 'INPUT' && (el as HTMLInputElement).type !== 'date') {
        (el as HTMLInputElement).select();
      }
    }
  };

  // Clear Form Console
  const handleClearForm = useCallback(() => {
    setFormData({
      id: '',
      date: new Date().toISOString().split('T')[0],
      accountId: accounts[0]?.id || '',
      particular: 'WT RCVD',
      grossWeight: '',
      stoneWeight: '0',
      touch: '99.90',
      notes: ''
    });
    setClientSearch(accounts[0] ? accounts[0].name : '');
    setShowClientDropdown(false);
    focusField('client-input');
  }, [accounts]);

  // Keyboard sequential focus shifting
  const handleFieldKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLSelectElement>, fieldName: string) => {
    if (fieldName === 'client' && showClientDropdown) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlightedClientIdx(prev => Math.min(prev + 1, filteredClients.length - 1));
        return;
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlightedClientIdx(prev => Math.max(prev - 1, 0));
        return;
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const client = filteredClients[highlightedClientIdx];
        if (client) {
          setFormData(prev => ({ ...prev, accountId: client.id }));
          setClientSearch(client.name);
          setShowClientDropdown(false);
          focusField('type-select');
        }
        return;
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setShowClientDropdown(false);
        return;
      }
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      if (fieldName === 'notes') {
        handleSave();
      } else {
        const sequentialFields: Record<string, string> = {
          date: 'client-input',
          client: 'type-select',
          type: 'gross-input',
          gross: 'stone-input',
          stone: 'touch-input',
          touch: 'notes-input'
        };
        const nextField = sequentialFields[fieldName];
        if (nextField) {
          focusField(nextField);
        }
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleClearForm();
    }
  };

  // Save Transaction Entry Row (Add / Update)
  const handleSave = async () => {
    const gross = parseFloat(formData.grossWeight) || 0;
    const stone = parseFloat(formData.stoneWeight) || 0;
    const touch = parseFloat(formData.touch) || 0;

    if (!formData.accountId) {
      alert('Please select a valid Client Name.');
      focusField('client-input');
      return;
    }
    if (gross <= 0) {
      alert('Please enter a valid Gross Weight.');
      focusField('gross-input');
      return;
    }

    if (formData.id) {
      // Editing an existing transaction
      const originalAccount = accounts.find(acc => acc.ledger.some(r => r.id === formData.id));
      if (originalAccount) {
        if (formData.accountId !== originalAccount.id) {
          // Client Name changed! Move row to the new account
          await deleteLedgerRow(originalAccount.id, formData.id);
          await addLedgerRow(formData.accountId, {
            date: formData.date,
            particular: formData.particular,
            grossWeight: gross,
            stoneWeight: stone,
            touch: touch,
            added_touch: touch,
            debit: 0,
            credit: 0,
            notes: formData.notes,
            attachments: []
          });
        } else {
          // Standard update
          await updateLedgerRow(formData.accountId, formData.id, {
            date: formData.date,
            particular: formData.particular,
            grossWeight: gross,
            stoneWeight: stone,
            touch: touch,
            added_touch: touch,
            notes: formData.notes
          });
        }
        setSuccessMsg('Ledger row updated successfully!');
      }
    } else {
      // Creating a new transaction
      await addLedgerRow(formData.accountId, {
        date: formData.date,
        particular: formData.particular,
        grossWeight: gross,
        stoneWeight: stone,
        touch: touch,
        added_touch: touch,
        debit: 0,
        credit: 0,
        notes: formData.notes,
        attachments: []
      });
      setSuccessMsg('Ledger row added successfully!');
    }

    handleClearForm();
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  // Modals confirmation handlers
  const handleConfirmEdit = () => {
    if (!editPopupRow) return;
    
    setFormData({
      id: editPopupRow.id,
      date: editPopupRow.date,
      accountId: editPopupRow.accountId,
      particular: editPopupRow.particular,
      grossWeight: String(editPopupRow.grossWeight),
      stoneWeight: String(editPopupRow.stoneWeight),
      touch: String(editPopupRow.touch),
      notes: editPopupRow.notes
    });
    
    const clientObj = accounts.find(acc => acc.id === editPopupRow.accountId);
    setClientSearch(clientObj ? clientObj.name : '');
    
    setShowEditPopup(false);
    
    // Focus Gross Wt input immediately
    setTimeout(() => {
      focusField('gross-input');
    }, 80);
  };

  const handleConfirmDelete = async () => {
    if (!deletePopupRow) return;

    const dateStr = new Date().toLocaleDateString();
    const timeStr = new Date().toLocaleTimeString();
    const auditDetails = `User Name: ${currentUser.name} | Action Type: DELETION | Transaction ID: ${deletePopupRow.id} | Deleted Record ID: ${deletePopupRow.id} | Date: ${dateStr} | Time: ${timeStr}`;
    
    // Log audit trail
    addAuditLog(currentUser.name, 'Delete Transaction', auditDetails);
    
    // Delete transaction from database
    await deleteLedgerRow(deletePopupRow.accountId, deletePopupRow.id);
    
    setShowDeletePopup(false);
    setDeletePopupRow(null);
    setSelectedRowId(null);
    
    setSuccessMsg('Ledger row deleted successfully and recorded in audit log!');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  // Keyboard navigation window listener
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isTyping = activeEl && (
        activeEl.tagName === 'INPUT' || 
        activeEl.tagName === 'SELECT' || 
        activeEl.tagName === 'TEXTAREA'
      );

      if (e.key === 'Escape') {
        e.preventDefault();
        handleClearForm();
        return;
      }

      if (isTyping && !e.ctrlKey) {
        return; 
      }

      // Ctrl + E: Edit selected
      if (e.ctrlKey && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        if (selectedRowId) {
          const row = gridRows.find(r => r.id === selectedRowId);
          if (row) {
            setEditPopupRow(row);
            setShowEditPopup(true);
          }
        }
        return;
      }

      // Ctrl + Delete: Delete selected
      if (e.ctrlKey && e.key === 'Delete') {
        e.preventDefault();
        if (selectedRowId) {
          const row = gridRows.find(r => r.id === selectedRowId);
          if (row) {
            setDeletePopupRow(row);
            setShowDeletePopup(true);
          }
        }
        return;
      }

      // Table row arrows selection
      if (!isTyping) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          const currentIdx = gridRows.findIndex(r => r.id === selectedRowId);
          if (currentIdx < gridRows.length - 1) {
            setSelectedRowId(gridRows[currentIdx + 1].id);
          } else if (gridRows.length > 0 && selectedRowId === null) {
            setSelectedRowId(gridRows[0].id);
          }
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          const currentIdx = gridRows.findIndex(r => r.id === selectedRowId);
          if (currentIdx > 0) {
            setSelectedRowId(gridRows[currentIdx - 1].id);
          }
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [selectedRowId, gridRows, handleClearForm]);

  if (!mounted) {
    return (
      <AppLayout>
        <div className="min-h-screen flex bg-bg-app items-center justify-center">
          <div className="text-text-muted text-xs font-semibold animate-pulse">Loading Ledger Screen...</div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="bg-[#F8F9FA] text-[#111827] border border-[#D9D9D9] rounded p-5 space-y-6 shadow-xs min-h-[calc(100vh-100px)] font-sans">
        
        {/* Title Header */}
        <div className="flex justify-between items-center select-none border-b border-[#D9D9D9] pb-4">
          <div>
            <h1 className="text-base font-bold tracking-tight text-[#111827] flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#D4AF37]" />
              AurumPro Ledger — Voucher Transactions
            </h1>
            <p className="text-[10px] text-gray-500 mt-0.5">
              Traditional jewellery accounting ledger system. High-density display console, searchable autocomplete client fields, and real-time summaries.
            </p>
          </div>
          <div className="flex items-center space-x-1.5 text-[10px] text-[#10B981] bg-[#10B981]/10 border border-[#10B981]/20 px-2 py-0.5 rounded font-bold">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Accounting Node Online</span>
          </div>
        </div>

        {/* Section 1 — Transaction Entry Row */}
        <div className="bg-white border border-[#D9D9D9] rounded p-3 shadow-xs">
          <div className="text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-2 select-none flex justify-between">
            <span>Transaction Entry Row Console</span>
            <span className="text-gray-400 font-medium">ESC to clear form</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-end">
            
            {/* 1. Date */}
            <div className="flex flex-col space-y-1 md:col-span-1">
              <label className="text-[8px] font-bold text-gray-500 uppercase">Date</label>
              <input
                id="date-input"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                onKeyDown={(e) => handleFieldKeyDown(e, 'date')}
                className="w-full bg-white border border-[#D9D9D9] focus:border-[#D4AF37] outline-none rounded px-2 py-1 text-xs text-[#111827] font-mono h-7"
              />
            </div>

            {/* 2. Client Name Searchable Dropdown */}
            <div className="flex flex-col space-y-1 relative md:col-span-2">
              <label className="text-[8px] font-bold text-gray-500 uppercase">Client Name</label>
              <input
                id="client-input"
                type="text"
                placeholder="Search client..."
                value={clientSearch}
                onChange={(e) => {
                  setClientSearch(e.target.value);
                  setShowClientDropdown(true);
                  setHighlightedClientIdx(0);
                }}
                onFocus={() => setShowClientDropdown(true)}
                onBlur={() => setTimeout(() => setShowClientDropdown(false), 200)}
                onKeyDown={(e) => handleFieldKeyDown(e, 'client')}
                className="w-full bg-white border border-[#D9D9D9] focus:border-[#D4AF37] outline-none rounded px-2 py-1 text-xs text-[#111827] font-bold h-7"
              />
              
              {showClientDropdown && filteredClients.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-[#D9D9D9] rounded shadow-lg max-h-40 overflow-y-auto z-50">
                  {filteredClients.map((client, idx) => {
                    const isHighlighted = idx === highlightedClientIdx;
                    return (
                      <div
                        key={client.id}
                        onMouseDown={() => {
                          setFormData(prev => ({ ...prev, accountId: client.id }));
                          setClientSearch(client.name);
                          setShowClientDropdown(false);
                          focusField('type-select');
                        }}
                        className={`px-3 py-1.5 text-xs font-semibold cursor-pointer border-b border-[#F0F0F0] last:border-b-0 ${
                          isHighlighted ? 'bg-[#D4AF37] text-white' : 'text-[#111827] hover:bg-gray-100'
                        }`}
                      >
                        {client.name}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 3. Type select */}
            <div className="flex flex-col space-y-1 md:col-span-1">
              <label className="text-[8px] font-bold text-gray-500 uppercase">Type</label>
              <select
                id="type-select"
                value={formData.particular}
                onChange={(e) => setFormData(prev => ({ ...prev, particular: e.target.value as LedgerRow['particular'] }))}
                onKeyDown={(e) => handleFieldKeyDown(e, 'type')}
                className="w-full bg-white border border-[#D9D9D9] focus:border-[#D4AF37] outline-none rounded px-2 py-0.5 text-xs text-[#111827] font-semibold h-7 appearance-none cursor-pointer"
              >
                <option value="WT RCVD">WT RCVD</option>
                <option value="Sale">Sale</option>
                <option value="Adjustment">Adjustment</option>
                <option value="Opening Balance">Opening Bal</option>
              </select>
            </div>

            {/* 4. Gross Weight */}
            <div className="flex flex-col space-y-1 md:col-span-1">
              <label className="text-[8px] font-bold text-gray-500 uppercase">Gross Weight</label>
              <input
                id="gross-input"
                type="number"
                step="any"
                placeholder="0.00"
                value={formData.grossWeight}
                onChange={(e) => setFormData(prev => ({ ...prev, grossWeight: e.target.value }))}
                onKeyDown={(e) => handleFieldKeyDown(e, 'gross')}
                className="w-full bg-white border border-[#D9D9D9] focus:border-[#D4AF37] outline-none rounded px-2 py-1 text-xs text-[#111827] font-bold text-right h-7"
              />
            </div>

            {/* 5. Stone Weight */}
            <div className="flex flex-col space-y-1 md:col-span-1">
              <label className="text-[8px] font-bold text-gray-500 uppercase">Stone Weight</label>
              <input
                id="stone-input"
                type="number"
                step="any"
                placeholder="0.00"
                value={formData.stoneWeight}
                onChange={(e) => setFormData(prev => ({ ...prev, stoneWeight: e.target.value }))}
                onKeyDown={(e) => handleFieldKeyDown(e, 'stone')}
                className="w-full bg-white border border-[#D9D9D9] focus:border-[#D4AF37] outline-none rounded px-2 py-1 text-xs text-gray-500 text-right h-7"
              />
            </div>

            {/* 6. Net Weight (Read-only) */}
            <div className="flex flex-col space-y-1 md:col-span-1">
              <label className="text-[8px] font-bold text-gray-500 uppercase bg-gray-100 px-1 py-0.5 rounded leading-none text-center">Net Wt</label>
              <input
                id="net-input"
                type="number"
                value={netWeight.toFixed(3)}
                readOnly
                className="w-full bg-[#F3F4F6] border border-[#D9D9D9] outline-none rounded px-2 py-1 text-xs text-gray-700 font-bold text-right cursor-not-allowed h-7"
              />
            </div>

            {/* 7. Touch */}
            <div className="flex flex-col space-y-1 md:col-span-1">
              <label className="text-[8px] font-bold text-gray-500 uppercase">Touch (%)</label>
              <input
                id="touch-input"
                type="number"
                step="any"
                placeholder="99.90"
                value={formData.touch}
                onChange={(e) => setFormData(prev => ({ ...prev, touch: e.target.value }))}
                onKeyDown={(e) => handleFieldKeyDown(e, 'touch')}
                className="w-full bg-white border border-[#D9D9D9] focus:border-[#D4AF37] outline-none rounded px-2 py-1 text-xs text-[#D4AF37] font-bold text-center h-7"
              />
            </div>

            {/* 8. Fine Gold (Read-only) */}
            <div className="flex flex-col space-y-1 md:col-span-1">
              <label className="text-[8px] font-bold text-gray-500 uppercase bg-gray-100 px-1 py-0.5 rounded leading-none text-center">Fine Gold</label>
              <input
                id="fine-input"
                type="number"
                value={fineGold.toFixed(3)}
                readOnly
                className="w-full bg-[#F3F4F6] border border-[#D9D9D9] outline-none rounded px-2 py-1 text-xs text-gray-700 font-bold text-right cursor-not-allowed h-7"
              />
            </div>

            {/* 9. Notes */}
            <div className="flex flex-col space-y-1 md:col-span-2">
              <label className="text-[8px] font-bold text-gray-500 uppercase">Notes</label>
              <input
                id="notes-input"
                type="text"
                placeholder="Voucher notes memo..."
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                onKeyDown={(e) => handleFieldKeyDown(e, 'notes')}
                className="w-full bg-white border border-[#D9D9D9] focus:border-[#D4AF37] outline-none rounded px-2 py-1 text-xs text-[#111827] font-medium h-7"
              />
            </div>

            {/* Action Trigger */}
            <div className="md:col-span-1">
              <button
                id="action-btn"
                type="button"
                onClick={handleSave}
                className={`w-full py-1 rounded font-bold text-xs text-white shadow-xs transition-colors cursor-pointer select-none h-7 flex items-center justify-center gap-1 ${
                  formData.id ? 'bg-[#10B981] hover:bg-[#0D9465]' : 'bg-[#D4AF37] hover:bg-[#B7952F]'
                }`}
              >
                <span>{formData.id ? 'Update' : 'Add'}</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

          </div>
        </div>

        {/* Success Alert Banner */}
        {successMsg && (
          <div className="bg-[#10B981]/10 border border-[#10B981]/25 p-3 rounded flex items-center space-x-2 text-xs text-[#111827] animate-in fade-in duration-200 select-none">
            <CheckCircle className="w-4 h-4 text-[#10B981] flex-shrink-0" />
            <span className="font-bold">{successMsg}</span>
          </div>
        )}

        {/* Summary Aggregates Header Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 select-none">
          <div className="bg-white border border-[#D9D9D9] p-3.5 rounded shadow-xs flex items-center space-x-3">
            <div className="w-8 h-8 rounded bg-[#D4AF37]/10 flex items-center justify-center font-bold text-[#D4AF37] text-xs">G</div>
            <div>
              <span className="text-[9px] font-bold text-gray-500 uppercase block leading-none">Total Gross Weight</span>
              <span className="text-sm font-bold text-[#111827] block mt-1">{totals.gross} g</span>
            </div>
          </div>
          <div className="bg-white border border-[#D9D9D9] p-3.5 rounded shadow-xs flex items-center space-x-3">
            <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center font-bold text-gray-500 text-xs">S</div>
            <div>
              <span className="text-[9px] font-bold text-gray-500 uppercase block leading-none">Total Stone Weight</span>
              <span className="text-sm font-bold text-[#111827] block mt-1">{totals.stone} g</span>
            </div>
          </div>
          <div className="bg-white border border-[#D9D9D9] p-3.5 rounded shadow-xs flex items-center space-x-3">
            <div className="w-8 h-8 rounded bg-[#10B981]/10 flex items-center justify-center font-bold text-[#10B981] text-xs">N</div>
            <div>
              <span className="text-[9px] font-bold text-gray-500 uppercase block leading-none">Total Net Weight</span>
              <span className="text-sm font-bold text-[#111827] block mt-1">{totals.net} g</span>
            </div>
          </div>
          <div className="bg-white border border-[#D9D9D9] p-3.5 rounded shadow-xs flex items-center space-x-3">
            <div className="w-8 h-8 rounded bg-[#D4AF37]/15 flex items-center justify-center font-bold text-[#D4AF37] text-xs">F</div>
            <div>
              <span className="text-[9px] font-bold text-gray-500 uppercase block leading-none">Total Fine Gold</span>
              <span className="text-sm font-bold text-[#111827] block mt-1">{totals.fine} g</span>
            </div>
          </div>
        </div>

        {/* Section 2 — Ledger Table */}
        <div className="bg-white border border-[#D9D9D9] rounded shadow-sm flex flex-col overflow-hidden">
          <div className="p-3 border-b border-[#D9D9D9] bg-gray-50 flex justify-between items-center select-none">
            <div>
              <h2 className="text-xs font-bold text-[#111827]">Voucher History Records</h2>
              <p className="text-[10px] text-gray-500 mt-0.5">Double click / click row, and press Ctrl+E to edit, or Ctrl+Delete to remove records.</p>
            </div>
            {selectedRowId && (
              <span className="text-[9px] font-bold text-[#D4AF37] uppercase tracking-wider bg-[#D4AF37]/10 px-2 py-0.5 rounded animate-pulse">
                Row Selected
              </span>
            )}
          </div>

          <div className="overflow-x-auto max-h-[50vh] scrollbar-thin">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="sticky top-0 bg-gray-50 z-20 border-b border-[#D9D9D9]">
                <tr className="text-[9px] font-bold text-gray-500 uppercase select-none">
                  <th className="p-2.5 pl-4 w-[11%]">Date</th>
                  <th className="p-2.5 w-[20%]">Client Name</th>
                  <th className="p-2.5 text-right w-[11%]">Gross Wt (g)</th>
                  <th className="p-2.5 text-right w-[11%]">Stone Wt (g)</th>
                  <th className="p-2.5 text-right w-[11%]">Net Wt (g)</th>
                  <th className="p-2.5 text-center w-[10%]">Touch (%)</th>
                  <th className="p-2.5 text-right w-[12%]">Fine Gold (g)</th>
                  <th className="p-2.5">Notes</th>
                  <th className="p-2.5 text-center pr-4 w-[8%]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D9D9D9]/50 font-medium">
                {gridRows.length > 0 ? (
                  gridRows.map((row) => {
                    const isSelected = row.id === selectedRowId;
                    const clientObj = accounts.find(c => c.id === row.accountId);
                    const clientName = clientObj ? clientObj.name : 'Unknown';
                    
                    return (
                      <tr 
                        key={row.id}
                        onClick={() => setSelectedRowId(row.id)}
                        className={`transition-colors border-l-2 ${
                          isSelected 
                            ? 'bg-[#D4AF37]/5 border-[#D4AF37]' 
                            : 'hover:bg-gray-50/70 border-transparent odd:bg-[#FDFDFD]'
                        }`}
                      >
                        {/* 1. Date */}
                        <td className="p-2.5 pl-4 font-mono text-gray-500">
                          {new Date(row.date).toLocaleDateString()}
                        </td>

                        {/* 2. Client Name + Type Badge */}
                        <td className="p-2.5 font-bold text-[#111827]">
                          <div className="flex items-center space-x-1.5">
                            <span>{clientName}</span>
                            <span className={`px-1 py-0.2 text-[8px] rounded font-bold ${
                              row.particular === 'Sale' 
                                ? 'bg-[#EF4444]/10 text-[#EF4444]' 
                                : 'bg-[#10B981]/10 text-[#10B981]'
                            }`}>
                              {row.particular}
                            </span>
                          </div>
                        </td>

                        {/* 3. Gross Weight */}
                        <td className="p-2.5 text-right text-gray-900 font-bold">
                          {row.grossWeight.toFixed(3)}
                        </td>

                        {/* 4. Stone Weight */}
                        <td className="p-2.5 text-right text-gray-500">
                          {row.stoneWeight.toFixed(3)}
                        </td>

                        {/* 5. Net Weight */}
                        <td className="p-2.5 text-right text-gray-900 font-bold">
                          {row.netWeight.toFixed(3)}
                        </td>

                        {/* 6. Touch */}
                        <td className="p-2.5 text-center text-[#D4AF37] font-bold">
                          {row.touch.toFixed(2)}%
                        </td>

                        {/* 7. Fine Gold */}
                        <td className="p-2.5 text-right text-gray-900 font-extrabold">
                          {row.purity.toFixed(3)}
                        </td>

                        {/* 8. Notes */}
                        <td className="p-2.5 text-gray-500 italic max-w-[200px] truncate">
                          {row.notes}
                        </td>

                        {/* 9. Action triggers */}
                        <td className="p-2.5 text-center pr-4">
                          <div className="flex items-center justify-center space-x-2">
                            <button
                              onClick={() => {
                                setEditPopupRow(row);
                                setShowEditPopup(true);
                              }}
                              className="p-1 rounded text-gray-400 hover:text-[#10B981] hover:bg-[#10B981]/5 transition-colors cursor-pointer"
                              title="Edit Row record"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                setDeletePopupRow(row);
                                setShowDeletePopup(true);
                              }}
                              className="p-1 rounded text-gray-400 hover:text-[#EF4444] hover:bg-[#EF4444]/5 transition-colors cursor-pointer"
                              title="Delete Row record"
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
                    <td colSpan={9} className="p-8 text-center text-gray-500 select-none">
                      No voucher transactions logged. Enter a new weight record at the top console to begin.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Keyboard Instructions Info Bar */}
        <div className="bg-[#D4AF37]/5 border border-[#D4AF37]/25 p-3.5 rounded flex items-start space-x-2.5 select-none text-xs">
          <Info className="w-4 h-4 text-[#D4AF37] flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold text-[#D4AF37] block">Operator Keyboard Shortcuts:</span>
            <span className="text-gray-500 leading-relaxed block">
              • Press <span className="font-semibold text-gray-700">Enter / Tab</span> to shift focus forward between entry inputs.<br />
              • Press <span className="font-semibold text-gray-700">Enter</span> on the Notes field to save/update immediately.<br />
              • Press <span className="font-semibold text-gray-700">ESC</span> to reset the console inputs.<br />
              • Select any table row and press <span className="font-semibold text-gray-700">Ctrl + E</span> to edit, or <span className="font-semibold text-gray-700">Ctrl + Delete</span> to delete.
            </span>
          </div>
        </div>

        {/* ==================== POPUP DIALOGS ==================== */}

        {/* Edit Confirmation Modal */}
        {showEditPopup && editPopupRow && (
          <div className="fixed inset-0 bg-black/45 z-50 flex items-center justify-center p-4">
            <div className="bg-white border border-[#D9D9D9] rounded-md shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-100">
              <div className="p-3 border-b border-[#D9D9D9] bg-gray-50 flex justify-between items-center select-none">
                <span className="font-bold text-xs text-[#111827]">Edit Transaction</span>
                <button 
                  onClick={() => setShowEditPopup(false)}
                  className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-4 space-y-4 text-xs">
                <p className="text-gray-600 font-medium">
                  Do you want to edit this transaction? This will populate the Entry Row console with its parameters.
                </p>
                <div className="flex justify-end gap-2 pt-2 border-t border-[#D9D9D9]">
                  <button 
                    onClick={() => setShowEditPopup(false)}
                    className="px-4 py-1.5 border border-[#D9D9D9] rounded font-bold text-gray-500 hover:text-gray-700 bg-white cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleConfirmEdit}
                    className="px-4 py-1.5 bg-[#D4AF37] hover:bg-[#B7952F] rounded font-bold text-white shadow-xs cursor-pointer"
                  >
                    Edit
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeletePopup && deletePopupRow && (
          <div className="fixed inset-0 bg-black/45 z-50 flex items-center justify-center p-4">
            <div className="bg-white border border-[#D9D9D9] rounded-md shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-100">
              <div className="p-3 border-b border-[#D9D9D9] bg-gray-50 flex justify-between items-center select-none">
                <span className="font-bold text-xs text-[#EF4444]">Delete Transaction</span>
                <button 
                  onClick={() => setShowDeletePopup(false)}
                  className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-4 space-y-4 text-xs">
                <p className="text-gray-600 font-medium leading-relaxed">
                  Are you sure you want to delete this transaction?<br />
                  <span className="font-bold text-[#EF4444]">This action cannot be undone.</span>
                </p>
                <div className="flex justify-end gap-2 pt-2 border-t border-[#D9D9D9]">
                  <button 
                    onClick={() => setShowDeletePopup(false)}
                    className="px-4 py-1.5 border border-[#D9D9D9] rounded font-bold text-gray-500 hover:text-gray-700 bg-white cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleConfirmDelete}
                    className="px-4 py-1.5 bg-[#EF4444] hover:bg-[#D93838] rounded font-bold text-white shadow-xs cursor-pointer"
                  >
                    Delete
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
