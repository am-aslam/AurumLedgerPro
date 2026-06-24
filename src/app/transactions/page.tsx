'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import { useExcelLedgerStore, LedgerRow } from '@/store/useExcelLedgerStore';
import { 
  Trash2, 
  CheckCircle, 
  Info,
  Calendar,
  Layers,
  Scale,
  Sparkles,
  ChevronDown
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
    updateLedgerRow 
  } = useExcelLedgerStore();
  
  const [mounted, setMounted] = useState(false);
  const [gridRows, setGridRows] = useState<GridRow[]>([]);
  const [activeRowId, setActiveRowId] = useState<string | null>(null);
  const [focusedRowOriginal, setFocusedRowOriginal] = useState<string | null>(null);
  const [selectedClientFilter, setSelectedClientFilter] = useState<string>('All');
  
  // Custom Toast Notification States
  const [successMsg, setSuccessMsg] = useState('');

  // New Row local state
  const [newRowData, setNewRowData] = useState({
    accountId: '',
    date: new Date().toISOString().split('T')[0],
    particular: 'WT RCVD' as LedgerRow['particular'],
    grossWeight: '',
    stoneWeight: '0',
    touch: '99.90',
    notes: ''
  });

  // Client mounting check
  useEffect(() => {
    setMounted(true);
  }, []);

  // Set default client account ID for the new row once accounts are loaded
  useEffect(() => {
    if (accounts.length > 0 && !newRowData.accountId) {
      setNewRowData(prev => ({ ...prev, accountId: accounts[0].id }));
    }
  }, [accounts, newRowData.accountId]);

  // Synchronize gridRows state with store accounts data
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
        touch: row.added_touch ?? row.touch ?? 0,
        purity: row.touch_value ?? 0,
        notes: row.notes || ''
      }))
    ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    setGridRows(allRows);
  }, [accounts]);

  // Filtered rows matching the selected client filter
  const filteredRows = useMemo(() => {
    if (selectedClientFilter === 'All') return gridRows;
    return gridRows.filter(row => row.accountId === selectedClientFilter);
  }, [gridRows, selectedClientFilter]);

  // Totals calculations
  const totals = useMemo(() => {
    let totalGross = 0;
    let totalStone = 0;
    let totalNet = 0;
    let totalPurity = 0;

    filteredRows.forEach(row => {
      totalGross += row.grossWeight;
      totalStone += row.stoneWeight;
      totalNet += row.netWeight;
      totalPurity += row.purity;
    });

    return {
      gross: totalGross.toFixed(2),
      stone: totalStone.toFixed(2),
      net: totalNet.toFixed(2),
      purity: totalPurity.toFixed(3)
    };
  }, [filteredRows]);

  // Fallback screen if there are no registered client accounts
  if (mounted && accounts.length === 0) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center p-12 bg-card-bg border border-border-custom rounded-md text-center max-w-lg mx-auto my-12 shadow-sm font-sans select-none animate-in fade-in duration-200">
          <Layers className="w-12 h-12 text-text-muted mb-4" />
          <h2 className="text-sm font-bold text-text-main">No Client Accounts Found</h2>
          <p className="text-xs text-text-muted mt-2 max-w-xs leading-relaxed">
            There are currently no clients registered in the vault database. 
            Please navigate to the Balance Sheet to add a client account manually before posting transactions.
          </p>
          <button 
            onClick={() => router.push('/balances')}
            className="mt-6 px-4 py-2 bg-primary-gold hover:opacity-90 text-white font-bold text-xs rounded shadow-xs transition-opacity cursor-pointer"
          >
            Go to Balances Sheet
          </button>
        </div>
      </AppLayout>
    );
  }

  // Focus a specific cell by ID
  const focusCell = (rowIndex: number, colIndex: number) => {
    const el = document.getElementById(`cell-${rowIndex}-${colIndex}`);
    if (el) {
      el.focus();
      if (el.tagName === 'INPUT' && (el as HTMLInputElement).type !== 'date') {
        (el as HTMLInputElement).select();
      }
    }
  };

  // Focus tracking to prevent unnecessary store updates
  const handleFocus = (row: GridRow) => {
    setFocusedRowOriginal(JSON.stringify(row));
    setActiveRowId(row.id);
  };

  const handleFocusNewRow = () => {
    setActiveRowId('new-row');
  };

  // Local grid updates
  const handleCellChange = (rowIndex: number, field: keyof GridRow, val: any) => {
    const updated = [...gridRows];
    const row = { ...updated[rowIndex], [field]: val };
    
    // Auto-calculate Net Weight and Purity instantly
    if (field === 'grossWeight' || field === 'stoneWeight' || field === 'touch') {
      const gross = parseFloat(row.grossWeight as any) || 0;
      const stone = parseFloat(row.stoneWeight as any) || 0;
      const net = parseFloat((gross - stone).toFixed(3));
      const touchVal = parseFloat(row.touch as any) || 0;
      const purityVal = parseFloat(((net * touchVal) / 100).toFixed(3));
      
      row.netWeight = net;
      row.purity = purityVal;
    }
    
    updated[rowIndex] = row;
    setGridRows(updated);
  };

  // Save row updates on cell blur
  const handleBlur = (rowIndex: number) => {
    const row = gridRows[rowIndex];
    if (!row) return;
    const currentStr = JSON.stringify(row);
    if (currentStr !== focusedRowOriginal) {
      saveRowToStore(row);
    }
  };

  // Call store method to persist state
  const saveRowToStore = async (row: GridRow) => {
    const originalAccount = accounts.find(acc => acc.ledger.some(r => r.id === row.id));
    if (!originalAccount) return;

    if (row.accountId !== originalAccount.id) {
      // Client Name changed! Move row to the new account
      await deleteLedgerRow(originalAccount.id, row.id);
      await addLedgerRow(row.accountId, {
        date: row.date,
        particular: row.particular,
        grossWeight: row.grossWeight,
        stoneWeight: row.stoneWeight,
        touch: row.touch,
        added_touch: row.touch,
        debit: 0,
        credit: 0,
        notes: row.notes,
        attachments: []
      });
    } else {
      // Standard update
      await updateLedgerRow(row.accountId, row.id, {
        date: row.date,
        particular: row.particular,
        grossWeight: row.grossWeight,
        stoneWeight: row.stoneWeight,
        touch: row.touch,
        added_touch: row.touch,
        notes: row.notes
      });
    }
  };

  // Keyboard navigation logic
  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement | HTMLSelectElement>,
    rowIndex: number,
    colIndex: number,
    isNewRow: boolean
  ) => {
    const totalRows = gridRows.length;

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (rowIndex > 0) {
        focusCell(rowIndex - 1, colIndex);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (rowIndex < totalRows) { // includes new row at index totalRows
        focusCell(rowIndex + 1, colIndex);
      }
    } else if (e.key === 'ArrowLeft') {
      const target = e.currentTarget;
      const isStart = target.tagName === 'SELECT' || (target as HTMLInputElement).selectionStart === 0;
      if (isStart && colIndex > 0) {
        e.preventDefault();
        // Skip read-only fields or handle directly
        const prevCol = colIndex - 1 === 7 ? 6 : (colIndex - 1 === 5 ? 4 : colIndex - 1);
        focusCell(rowIndex, prevCol);
      }
    } else if (e.key === 'ArrowRight') {
      const target = e.currentTarget;
      const isEnd = target.tagName === 'SELECT' || 
                    (target as HTMLInputElement).selectionStart === (target as HTMLInputElement).value.length;
      if (isEnd && colIndex < 8) {
        e.preventDefault();
        const nextCol = colIndex + 1 === 5 ? 6 : (colIndex + 1 === 7 ? 8 : colIndex + 1);
        focusCell(rowIndex, nextCol);
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (isNewRow) {
        if (colIndex === 6 || colIndex === 8) { // touch or notes
          handleCreateNewRowFromGrid();
        } else {
          // Tab through editables
          const nextCols: Record<number, number> = { 0: 1, 1: 2, 2: 3, 3: 4, 4: 6, 6: 8 };
          const targetCol = nextCols[colIndex];
          if (targetCol !== undefined) focusCell(rowIndex, targetCol);
        }
      } else {
        if (rowIndex < totalRows - 1) {
          focusCell(rowIndex + 1, colIndex);
        } else {
          focusCell(totalRows, colIndex);
        }
      }
    } else if (e.key === 'Tab') {
      if (e.shiftKey) {
        // Shift+Tab
        if (colIndex === 6) { // Skip Net Wt (5)
          e.preventDefault();
          focusCell(rowIndex, 4);
        } else if (colIndex === 8) { // Skip Purity (7)
          e.preventDefault();
          focusCell(rowIndex, 6);
        } else if (colIndex === 0 && rowIndex > 0) {
          e.preventDefault();
          focusCell(rowIndex - 1, 8); // focus Notes of previous row
        }
      } else {
        // Tab
        if (colIndex === 4) { // Skip Net Wt (5)
          e.preventDefault();
          focusCell(rowIndex, 6);
        } else if (colIndex === 6) { // Skip Purity (7)
          e.preventDefault();
          focusCell(rowIndex, 8);
        } else if (colIndex === 8) {
          if (!isNewRow) {
            e.preventDefault();
            if (rowIndex < totalRows - 1) {
              focusCell(rowIndex + 1, 0);
            } else {
              focusCell(totalRows, 0);
            }
          }
        }
      }
    }
  };

  // Add new row entry
  const handleCreateNewRowFromGrid = () => {
    const activeAccountId = selectedClientFilter === 'All' 
      ? (newRowData.accountId || accounts[0]?.id)
      : selectedClientFilter;

    if (!activeAccountId) return;
    const gross = parseFloat(newRowData.grossWeight) || 0;
    if (gross <= 0) {
      alert('Please enter a valid Gross Weight.');
      focusCell(gridRows.length, 3);
      return;
    }

    const stone = parseFloat(newRowData.stoneWeight) || 0;
    const touch = parseFloat(newRowData.touch) || 0;

    addLedgerRow(activeAccountId, {
      date: newRowData.date,
      particular: newRowData.particular,
      grossWeight: gross,
      stoneWeight: stone,
      touch: touch,
      added_touch: touch,
      debit: 0,
      credit: 0,
      notes: newRowData.notes || 'Logged via Jewellery Ledger Redesign',
      attachments: []
    });

    // Reset entry state
    setNewRowData(prev => ({
      ...prev,
      grossWeight: '',
      stoneWeight: '0',
      touch: '99.90',
      notes: ''
    }));

    setSuccessMsg('Ledger row successfully saved to database!');
    setTimeout(() => setSuccessMsg(''), 3000);

    // Keep focus in the entry row
    setTimeout(() => {
      focusCell(gridRows.length, 3); // focus Gross Wt of new row
    }, 60);
  };

  // Calculations for New Row
  const newGrossNum = parseFloat(newRowData.grossWeight) || 0;
  const newStoneNum = parseFloat(newRowData.stoneWeight) || 0;
  const newNetWeight = newGrossNum - newStoneNum;
  const newTouchNum = parseFloat(newRowData.touch) || 0;
  const newPurityVal = (newNetWeight * newTouchNum) / 100;

  if (!mounted) {
    return (
      <AppLayout>
        <div className="min-h-screen flex bg-bg-app items-center justify-center">
          <div className="text-text-muted text-xs font-semibold animate-pulse">Loading Ledger Grid...</div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6 max-w-7xl mx-auto flex flex-col h-[calc(100vh-100px)]">
        
        {/* Title Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 select-none">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-text-main flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary-gold" />
              Voucher Transactions Ledger
            </h1>
            <p className="text-xs text-text-muted mt-1">
              Jewellery-style general ledger interface. Arrow key navigation, auto-calculating purity weights, and instant client-side persistence.
            </p>
          </div>

          {/* Client Filter Dropdown */}
          <div className="flex items-center space-x-3 bg-card-bg border border-border-custom px-3 py-1.5 rounded-md shadow-xs">
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider flex items-center gap-1">
              <ChevronDown className="w-3.5 h-3.5" />
              Client Sheet:
            </span>
            <select
              value={selectedClientFilter}
              onChange={(e) => {
                setSelectedClientFilter(e.target.value);
                setActiveRowId(null);
              }}
              className="bg-transparent text-xs font-semibold text-text-main focus:outline-none cursor-pointer pr-4"
            >
              <option value="All">All Clients (Consolidated)</option>
              {accounts.map(acc => (
                <option key={acc.id} value={acc.id}>{acc.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Success Alert Toast */}
        {successMsg && (
          <div className="bg-success-custom/10 border border-success-custom/25 p-3 rounded flex items-center space-x-2 text-xs text-text-main animate-in fade-in duration-200">
            <CheckCircle className="w-4 h-4 text-success-custom flex-shrink-0" />
            <span className="font-bold">{successMsg}</span>
          </div>
        )}

        {/* Real-time aggregates summary cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 select-none">
          <div className="bg-card-bg/60 backdrop-blur-md border border-border-custom p-3.5 rounded-md shadow-xs flex items-center space-x-3.5">
            <div className="w-8 h-8 rounded bg-primary-gold/10 flex items-center justify-center font-bold text-primary-gold text-xs shadow-inner">G</div>
            <div>
              <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider block leading-none">Gross Weight</span>
              <span className="text-sm font-bold text-text-main block mt-1">{totals.gross} g</span>
            </div>
          </div>
          <div className="bg-card-bg/60 backdrop-blur-md border border-border-custom p-3.5 rounded-md shadow-xs flex items-center space-x-3.5">
            <div className="w-8 h-8 rounded bg-text-muted/10 flex items-center justify-center font-bold text-text-muted text-xs shadow-inner">S</div>
            <div>
              <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider block leading-none">Stone Deduction</span>
              <span className="text-sm font-bold text-text-main block mt-1">{totals.stone} g</span>
            </div>
          </div>
          <div className="bg-card-bg/60 backdrop-blur-md border border-border-custom p-3.5 rounded-md shadow-xs flex items-center space-x-3.5">
            <div className="w-8 h-8 rounded bg-success-custom/10 flex items-center justify-center font-bold text-success-custom text-xs shadow-inner">N</div>
            <div>
              <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider block leading-none">Net Weight</span>
              <span className="text-sm font-bold text-text-main block mt-1">{totals.net} g</span>
            </div>
          </div>
          <div className="bg-card-bg/60 backdrop-blur-md border border-border-custom p-3.5 rounded-md shadow-xs flex items-center space-x-3.5">
            <div className="w-8 h-8 rounded bg-warning-custom/10 flex items-center justify-center font-bold text-warning-custom text-xs shadow-inner">P</div>
            <div>
              <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider block leading-none">Total Purity</span>
              <span className="text-sm font-bold text-text-main block mt-1">{totals.purity} g</span>
            </div>
          </div>
        </div>

        {/* Ledger grid board */}
        <div className="flex-1 bg-card-bg border border-border-custom rounded-md shadow-lg flex flex-col overflow-hidden relative">
          
          <div className="flex-1 overflow-y-auto scrollbar-thin">
            <table className="w-full text-left text-xs border-collapse relative">
              
              {/* Sticky header */}
              <thead className="sticky top-0 bg-sidebar-bg/95 backdrop-blur-sm z-20 border-b border-border-custom shadow-xs">
                <tr className="text-[10px] font-bold text-text-muted uppercase tracking-wider select-none">
                  <th className="p-3 pl-4 w-[11%]">Date</th>
                  <th className="p-3 w-[15%]">Client Name</th>
                  <th className="p-3 w-[11%]">Type</th>
                  <th className="p-3 text-right w-[11%]">Gross Wt (g)</th>
                  <th className="p-3 text-right w-[11%]">Stone Wt (g)</th>
                  <th className="p-3 text-right w-[11%] bg-success-custom/[0.02]">Net Wt (g)</th>
                  <th className="p-3 text-center w-[10%]">Touch (%)</th>
                  <th className="p-3 text-right w-[12%] bg-warning-custom/[0.02]">Purity (g)</th>
                  <th className="p-3">Voucher Notes</th>
                  <th className="p-3 text-center pr-4 w-[5%]">Delete</th>
                </tr>
              </thead>

              {/* Grid rows list */}
              <tbody className="divide-y divide-border-custom/50 font-medium">
                {filteredRows.length > 0 ? (
                  filteredRows.map((row, idx) => {
                    const isRowFocused = row.id === activeRowId;
                    return (
                      <tr 
                        key={row.id}
                        className={`transition-colors duration-100 ${
                          isRowFocused ? 'bg-primary-gold/[0.02]' : 'hover:bg-bg-app/40'
                        }`}
                      >
                        {/* 0. Date */}
                        <td className="p-1 pl-4">
                          <input 
                            id={`cell-${idx}-0`}
                            type="date"
                            value={row.date}
                            onChange={(e) => handleCellChange(idx, 'date', e.target.value)}
                            onFocus={() => handleFocus(row)}
                            onBlur={() => handleBlur(idx)}
                            onKeyDown={(e) => handleKeyDown(e, idx, 0, false)}
                            className="w-full bg-transparent p-1.5 focus:outline-none border-0 text-text-main font-mono"
                          />
                        </td>

                        {/* 1. Client Name select */}
                        <td className="p-1">
                          <select
                            id={`cell-${idx}-1`}
                            value={row.accountId}
                            onChange={(e) => handleCellChange(idx, 'accountId', e.target.value)}
                            onFocus={() => handleFocus(row)}
                            onBlur={() => handleBlur(idx)}
                            onKeyDown={(e) => handleKeyDown(e, idx, 1, false)}
                            className="w-full bg-transparent p-1.5 focus:outline-none border-0 text-text-main font-semibold appearance-none cursor-pointer"
                          >
                            {accounts.map(acc => (
                              <option key={acc.id} value={acc.id} className="bg-sidebar-bg text-text-main">
                                {acc.name}
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* 2. Type select */}
                        <td className="p-1">
                          <select
                            id={`cell-${idx}-2`}
                            value={row.particular}
                            onChange={(e) => handleCellChange(idx, 'particular', e.target.value)}
                            onFocus={() => handleFocus(row)}
                            onBlur={() => handleBlur(idx)}
                            onKeyDown={(e) => handleKeyDown(e, idx, 2, false)}
                            className={`w-full bg-transparent p-1.5 focus:outline-none border-0 font-bold appearance-none cursor-pointer ${
                              row.particular === 'Sale' ? 'text-danger-custom' : 'text-success-custom'
                            }`}
                          >
                            <option value="WT RCVD" className="bg-sidebar-bg text-success-custom">WT RCVD</option>
                            <option value="Sale" className="bg-sidebar-bg text-danger-custom">Sale</option>
                            <option value="Adjustment" className="bg-sidebar-bg text-warning-custom">Adjustment</option>
                            <option value="Opening Balance" className="bg-sidebar-bg text-text-main">Opening Bal</option>
                          </select>
                        </td>

                        {/* 3. Gross Wt input */}
                        <td className="p-1">
                          <input 
                            id={`cell-${idx}-3`}
                            type="number"
                            step="any"
                            value={row.grossWeight === 0 ? '' : row.grossWeight}
                            onChange={(e) => handleCellChange(idx, 'grossWeight', e.target.value)}
                            onFocus={() => handleFocus(row)}
                            onBlur={() => handleBlur(idx)}
                            onKeyDown={(e) => handleKeyDown(e, idx, 3, false)}
                            className="w-full bg-transparent p-1.5 focus:outline-none border-0 text-right text-text-main font-bold placeholder-text-muted/40"
                            placeholder="0.00"
                          />
                        </td>

                        {/* 4. Stone Wt input */}
                        <td className="p-1">
                          <input 
                            id={`cell-${idx}-4`}
                            type="number"
                            step="any"
                            value={row.stoneWeight}
                            onChange={(e) => handleCellChange(idx, 'stoneWeight', e.target.value)}
                            onFocus={() => handleFocus(row)}
                            onBlur={() => handleBlur(idx)}
                            onKeyDown={(e) => handleKeyDown(e, idx, 4, false)}
                            className="w-full bg-transparent p-1.5 focus:outline-none border-0 text-right text-text-muted"
                          />
                        </td>

                        {/* 5. Net Wt display (read-only) */}
                        <td className="p-1 bg-success-custom/[0.01]">
                          <input 
                            id={`cell-${idx}-5`}
                            type="number"
                            value={row.netWeight.toFixed(2)}
                            readOnly
                            onFocus={() => handleFocus(row)}
                            onBlur={() => handleBlur(idx)}
                            onKeyDown={(e) => handleKeyDown(e, idx, 5, false)}
                            className="w-full bg-transparent p-1.5 focus:outline-none border-0 text-right font-bold text-success-custom cursor-default"
                          />
                        </td>

                        {/* 6. Touch input */}
                        <td className="p-1">
                          <input 
                            id={`cell-${idx}-6`}
                            type="number"
                            step="any"
                            value={row.touch}
                            onChange={(e) => handleCellChange(idx, 'touch', e.target.value)}
                            onFocus={() => handleFocus(row)}
                            onBlur={() => handleBlur(idx)}
                            onKeyDown={(e) => handleKeyDown(e, idx, 6, false)}
                            className="w-full bg-transparent p-1.5 focus:outline-none border-0 text-center font-bold text-primary-gold"
                          />
                        </td>

                        {/* 7. Purity display (read-only) */}
                        <td className="p-1 bg-warning-custom/[0.01]">
                          <input 
                            id={`cell-${idx}-7`}
                            type="number"
                            value={row.purity.toFixed(3)}
                            readOnly
                            onFocus={() => handleFocus(row)}
                            onBlur={() => handleBlur(idx)}
                            onKeyDown={(e) => handleKeyDown(e, idx, 7, false)}
                            className="w-full bg-transparent p-1.5 focus:outline-none border-0 text-right font-bold text-warning-custom cursor-default"
                          />
                        </td>

                        {/* 8. Notes input */}
                        <td className="p-1">
                          <input 
                            id={`cell-${idx}-8`}
                            type="text"
                            value={row.notes}
                            onChange={(e) => handleCellChange(idx, 'notes', e.target.value)}
                            onFocus={() => handleFocus(row)}
                            onBlur={() => handleBlur(idx)}
                            onKeyDown={(e) => handleKeyDown(e, idx, 8, false)}
                            className="w-full bg-transparent p-1.5 focus:outline-none border-0 text-text-main placeholder-text-muted/40 font-medium"
                            placeholder="Add memo notes..."
                          />
                        </td>

                        {/* Delete action */}
                        <td className="p-1 text-center pr-4">
                          <button
                            onClick={async () => {
                              if (confirm('Are you sure you want to delete this ledger row record?')) {
                                await deleteLedgerRow(row.accountId, row.id);
                              }
                            }}
                            className="p-1.5 rounded hover:bg-danger-custom/10 text-danger-custom transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>

                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={10} className="p-8 text-center text-text-muted font-bold select-none">
                      No records matched. Enter weight values below to start logging vouchers.
                    </td>
                  </tr>
                )}

                {/* FAST ENTRY BLANK ROW AT THE BOTTOM */}
                <tr className="bg-primary-gold/[0.01] border-t-2 border-primary-gold/10">
                  {/* Date */}
                  <td className="p-1 pl-4">
                    <input 
                      id={`cell-${filteredRows.length}-0`}
                      type="date"
                      value={newRowData.date}
                      onChange={(e) => setNewRowData(prev => ({ ...prev, date: e.target.value }))}
                      onFocus={handleFocusNewRow}
                      onKeyDown={(e) => handleKeyDown(e, filteredRows.length, 0, true)}
                      className="w-full bg-transparent p-1.5 focus:outline-none border-0 text-text-main font-mono"
                    />
                  </td>

                  {/* Client Select */}
                  <td className="p-1">
                    <select
                      id={`cell-${filteredRows.length}-1`}
                      value={selectedClientFilter === 'All' ? newRowData.accountId : selectedClientFilter}
                      onChange={(e) => setNewRowData(prev => ({ ...prev, accountId: e.target.value }))}
                      onFocus={handleFocusNewRow}
                      onKeyDown={(e) => handleKeyDown(e, filteredRows.length, 1, true)}
                      disabled={selectedClientFilter !== 'All'}
                      className="w-full bg-transparent p-1.5 focus:outline-none border-0 text-text-main font-semibold appearance-none cursor-pointer disabled:opacity-90 disabled:cursor-not-allowed"
                    >
                      {accounts.map(acc => (
                        <option key={acc.id} value={acc.id} className="bg-sidebar-bg text-text-main">
                          {acc.name}
                        </option>
                      ))}
                    </select>
                  </td>

                  {/* Particular Category select */}
                  <td className="p-1">
                    <select
                      id={`cell-${filteredRows.length}-2`}
                      value={newRowData.particular}
                      onChange={(e) => setNewRowData(prev => ({ ...prev, particular: e.target.value as LedgerRow['particular'] }))}
                      onFocus={handleFocusNewRow}
                      onKeyDown={(e) => handleKeyDown(e, filteredRows.length, 2, true)}
                      className={`w-full bg-transparent p-1.5 focus:outline-none border-0 font-bold appearance-none cursor-pointer ${
                        newRowData.particular === 'Sale' ? 'text-danger-custom' : 'text-success-custom'
                      }`}
                    >
                      <option value="WT RCVD" className="bg-sidebar-bg text-success-custom">WT RCVD</option>
                      <option value="Sale" className="bg-sidebar-bg text-danger-custom">Sale</option>
                      <option value="Adjustment" className="bg-sidebar-bg text-warning-custom">Adjustment</option>
                      <option value="Opening Balance" className="bg-sidebar-bg text-text-main">Opening Bal</option>
                    </select>
                  </td>

                  {/* Gross Weight */}
                  <td className="p-1">
                    <input 
                      id={`cell-${filteredRows.length}-3`}
                      type="number"
                      step="any"
                      value={newRowData.grossWeight}
                      onChange={(e) => setNewRowData(prev => ({ ...prev, grossWeight: e.target.value }))}
                      onFocus={handleFocusNewRow}
                      onKeyDown={(e) => handleKeyDown(e, filteredRows.length, 3, true)}
                      className="w-full bg-transparent p-1.5 focus:outline-none border-0 text-right text-text-main font-bold placeholder-primary-gold/40 border-b border-dashed border-primary-gold/30 focus:border-solid focus:border-b-0"
                      placeholder="Enter Gross"
                    />
                  </td>

                  {/* Stone Weight */}
                  <td className="p-1">
                    <input 
                      id={`cell-${filteredRows.length}-4`}
                      type="number"
                      step="any"
                      value={newRowData.stoneWeight}
                      onChange={(e) => setNewRowData(prev => ({ ...prev, stoneWeight: e.target.value }))}
                      onFocus={handleFocusNewRow}
                      onKeyDown={(e) => handleKeyDown(e, filteredRows.length, 4, true)}
                      className="w-full bg-transparent p-1.5 focus:outline-none border-0 text-right text-text-muted"
                    />
                  </td>

                  {/* Net Weight Display */}
                  <td className="p-1 bg-success-custom/[0.01]">
                    <input 
                      id={`cell-${filteredRows.length}-5`}
                      type="number"
                      value={newNetWeight.toFixed(2)}
                      readOnly
                      onFocus={handleFocusNewRow}
                      onKeyDown={(e) => handleKeyDown(e, filteredRows.length, 5, true)}
                      className="w-full bg-transparent p-1.5 focus:outline-none border-0 text-right font-bold text-success-custom cursor-default"
                    />
                  </td>

                  {/* Touch input */}
                  <td className="p-1">
                    <input 
                      id={`cell-${filteredRows.length}-6`}
                      type="number"
                      step="any"
                      value={newRowData.touch}
                      onChange={(e) => setNewRowData(prev => ({ ...prev, touch: e.target.value }))}
                      onFocus={handleFocusNewRow}
                      onKeyDown={(e) => handleKeyDown(e, filteredRows.length, 6, true)}
                      className="w-full bg-transparent p-1.5 focus:outline-none border-0 text-center font-bold text-primary-gold"
                    />
                  </td>

                  {/* Purity Display */}
                  <td className="p-1 bg-warning-custom/[0.01]">
                    <input 
                      id={`cell-${filteredRows.length}-7`}
                      type="number"
                      value={newPurityVal.toFixed(3)}
                      readOnly
                      onFocus={handleFocusNewRow}
                      onKeyDown={(e) => handleKeyDown(e, filteredRows.length, 7, true)}
                      className="w-full bg-transparent p-1.5 focus:outline-none border-0 text-right font-bold text-warning-custom cursor-default"
                    />
                  </td>

                  {/* Notes memo */}
                  <td className="p-1">
                    <input 
                      id={`cell-${filteredRows.length}-8`}
                      type="text"
                      value={newRowData.notes}
                      onChange={(e) => setNewRowData(prev => ({ ...prev, notes: e.target.value }))}
                      onFocus={handleFocusNewRow}
                      onKeyDown={(e) => handleKeyDown(e, filteredRows.length, 8, true)}
                      className="w-full bg-transparent p-1.5 focus:outline-none border-0 text-text-main placeholder-text-muted/40 font-medium"
                      placeholder="Add memo notes..."
                    />
                  </td>

                  {/* Save row action */}
                  <td className="p-1 text-center pr-4">
                    <button
                      onClick={handleCreateNewRowFromGrid}
                      className="px-2 py-1 text-[10px] bg-primary-gold hover:opacity-90 font-bold text-white rounded shadow-xs transition-opacity cursor-pointer whitespace-nowrap"
                    >
                      Save Row
                    </button>
                  </td>

                </tr>
              </tbody>

              {/* Sticky bottom totals footer */}
              <tfoot className="sticky bottom-0 bg-sidebar-bg/95 backdrop-blur-sm z-20 border-t-2 border-primary-gold/60 shadow-lg">
                <tr className="text-text-main font-bold select-none">
                  <td colSpan={3} className="p-3 pl-5 text-[10px] font-bold text-text-muted uppercase tracking-wider">
                    Total Sheets Summary
                  </td>
                  <td className="p-3 text-right text-text-main font-bold border-r border-border-custom/50">
                    {totals.gross}
                  </td>
                  <td className="p-3 text-right text-text-muted font-semibold border-r border-border-custom/50">
                    {totals.stone}
                  </td>
                  <td className="p-3 text-right text-success-custom font-extrabold bg-success-custom/[0.02] border-r border-border-custom/50">
                    {totals.net}
                  </td>
                  <td className="p-3 text-center text-text-muted font-medium border-r border-border-custom/50">
                    —
                  </td>
                  <td className="p-3 text-right text-warning-custom font-extrabold bg-warning-custom/[0.02] border-r border-border-custom/50">
                    {totals.purity}
                  </td>
                  <td colSpan={2} className="p-3 text-text-muted text-[10px] italic font-medium">
                    Consolidated Jewellery Ledger
                  </td>
                </tr>
              </tfoot>

            </table>
          </div>

        </div>

        {/* Informative usage guidelines */}
        <div className="flex items-start space-x-2 bg-primary-gold/5 border border-primary-gold/20 p-3 rounded-md text-xs text-text-main select-none">
          <Info className="w-4 h-4 text-primary-gold flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold text-primary-gold block">Keyboard Navigation Instructions:</span>
            <span className="text-text-muted leading-relaxed block">
              • Navigate cells with <span className="font-semibold text-text-main">Arrow keys</span>.<br />
              • Press <span className="font-semibold text-text-main">Enter</span> on the Touch or Notes field of the bottom row to quickly post a transaction and start the next.<br />
              • Editing is auto-saved directly when you change cells or press Enter.
            </span>
          </div>
        </div>

      </div>
    </AppLayout>
  );
}
