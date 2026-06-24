'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import { useExcelLedgerStore, LedgerRow, Account } from '@/store/useExcelLedgerStore';
import { exportToExcel, exportToCSV, exportToPDF } from '@/lib/exportUtils';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, 
  Trash2, 
  Plus, 
  Calendar, 
  Sliders, 
  Check, 
  X, 
  User,
  Paperclip,
  Database,
  ArrowRight,
  ChevronDown,
  Search,
  Edit3
} from 'lucide-react';

export default function LedgersPage() {
  const router = useRouter();
  const { 
    accounts, 
    activeAccountId, 
    setActiveAccountId, 
    selectedRowId, 
    setSelectedRowId, 
    addLedgerRow, 
    deleteLedgerRow, 
    updateLedgerCell, 
    updateLedgerRow,
    goldRate 
  } = useExcelLedgerStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'details' | 'audit'>('details');

  // Inline Editing States
  const [editingCell, setEditingCell] = useState<{ rowId: string; field: keyof LedgerRow } | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  // Log Transaction Dialog Modal
  const [showLogModal, setShowLogModal] = useState(false);
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formParticular, setFormParticular] = useState<LedgerRow['particular']>('WT RCVD');
  const [formGross, setFormGross] = useState('');
  const [formStone, setFormStone] = useState('0');
  const [formAddedTouch, setFormAddedTouch] = useState('99.90');
  const [formNotes, setFormNotes] = useState('');

  // Edit Voucher Modal States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editRowId, setEditRowId] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editParticular, setEditParticular] = useState<LedgerRow['particular']>('WT RCVD');
  const [editGross, setEditGross] = useState('');
  const [editStone, setEditStone] = useState('0');
  const [editAddedTouch, setEditAddedTouch] = useState('99.90');
  const [editNotes, setEditNotes] = useState('');

  // Custom Delete Confirmation Modal States
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTargetRowId, setDeleteTargetRowId] = useState('');

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editRowId || !activeAccount) return;
    updateLedgerRow(activeAccount.id, editRowId, {
      date: editDate,
      particular: editParticular,
      grossWeight: parseFloat(editGross) || 0,
      stoneWeight: parseFloat(editStone) || 0,
      touch: parseFloat(editAddedTouch) || 0,
      added_touch: parseFloat(editAddedTouch) || 0,
      notes: editNotes
    });
    setIsEditModalOpen(false);
  };

  const handleExport = (format: 'xlsx' | 'csv' | 'pdf') => {
    if (!activeAccount) return;
    const filename = `${activeAccount.name.replace(/\s+/g, '_')}_ledger_${new Date().toISOString().split('T')[0]}`;
    
    const exportData = activeAccount.ledger.map(row => ({
      'Date': row.date,
      'Particular': row.particular,
      'Gross Weight (g)': row.grossWeight,
      'Stone Weight (g)': row.stoneWeight,
      'Net Weight (g)': row.netWeight,
      'Touch Fineness': row.added_touch ?? 0,
      'Debit (g)': row.debit,
      'Credit (g)': row.credit,
      'Running Balance (g)': row.balance
    }));

    if (format === 'xlsx') {
      exportToExcel(exportData, filename, 'General Ledger');
    } else if (format === 'csv') {
      exportToCSV(exportData, filename);
    } else if (format === 'pdf') {
      exportToPDF(
        `${activeAccount.name} - General Ledger Statement`,
        ['Date', 'Particular', 'Gross (g)', 'Stone (g)', 'Net (g)', 'Touch', 'Debit (g)', 'Credit (g)', 'Balance (g)'],
        ['Date', 'Particular', 'Gross Weight (g)', 'Stone Weight (g)', 'Net Weight (g)', 'Touch Fineness', 'Debit (g)', 'Credit (g)', 'Running Balance (g)'],
        exportData,
        ['left', 'left', 'right', 'right', 'right', 'center', 'right', 'right', 'right']
      );
    }
  };

  // Find active account
  const activeAccount = accounts.find(a => a.id === activeAccountId) || accounts[0];

  if (!activeAccount || accounts.length === 0) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center p-12 bg-card-bg border border-border-custom rounded-md text-center max-w-lg mx-auto my-12 shadow-sm font-sans select-none">
          <FileText className="w-12 h-12 text-text-muted mb-4" />
          <h2 className="text-sm font-bold text-text-main">No Client Accounts Found</h2>
          <p className="text-xs text-text-muted mt-2 max-w-xs leading-relaxed">
            There are currently no clients registered in the vault database. 
            Please navigate to the Balance Sheet to add a client account manually or import an Excel workbook.
          </p>
          <button 
            onClick={() => router.push('/balances')}
            className="mt-6 px-4 py-2 bg-primary-gold hover:opacity-90 text-white font-bold text-xs rounded shadow-xs transition-opacity"
          >
            Go to Balances Sheet
          </button>
        </div>
      </AppLayout>
    );
  }

  // Filtered Ledger Rows
  const filteredLedger = activeAccount ? activeAccount.ledger.filter(row => 
    row.particular.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (row.notes && row.notes.toLowerCase().includes(searchQuery.toLowerCase()))
  ) : [];

  const activeRow = activeAccount?.ledger.find(r => r.id === selectedRowId) || activeAccount?.ledger[0];

  // Inline edit handlers
  const startEditing = (rowId: string, field: keyof LedgerRow, currentVal: any) => {
    setEditingCell({ rowId, field });
    setEditValue(String(currentVal));
  };

  const saveInlineEdit = (rowId: string, field: keyof LedgerRow) => {
    if (!editingCell) return;
    
    let typedValue: any = editValue;
    if (field === 'grossWeight' || field === 'stoneWeight' || field === 'touch' || field === 'added_touch') {
      typedValue = parseFloat(editValue) || 0;
    }
    
    updateLedgerCell(activeAccount.id, rowId, field, typedValue);
    setEditingCell(null);
  };

  const handleCreateTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    const gross = parseFloat(formGross) || 0;
    const stone = parseFloat(formStone) || 0;
    const added_touch = parseFloat(formAddedTouch) || 0;

    addLedgerRow(activeAccount.id, {
      date: formDate,
      particular: formParticular,
      grossWeight: gross,
      stoneWeight: stone,
      touch: added_touch,
      added_touch,
      debit: 0,
      credit: 0,
      notes: formNotes,
      attachments: []
    });

    // Reset Form
    setFormGross('');
    setFormStone('0');
    setFormAddedTouch('99.90');
    setFormNotes('');
    setShowLogModal(false);
  };

  return (
    <AppLayout>
      <div className="flex flex-col h-full space-y-4 font-sans select-none">
        
        {/* Header toolbar */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
          <div className="flex items-center space-x-3">
            <h1 className="text-xl font-bold text-text-main">Account Ledger</h1>
            <div className="relative">
              <select
                value={activeAccountId}
                onChange={(e) => {
                  setActiveAccountId(e.target.value);
                  setSelectedRowId(null);
                }}
                className="bg-card-bg border border-border-custom text-xs font-semibold text-text-main py-1.5 px-3 rounded focus:outline-none focus:border-primary-gold pr-8 appearance-none cursor-pointer"
              >
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id}>{acc.name} Ledger</option>
                ))}
              </select>
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted">
                <ChevronDown className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <button 
              onClick={() => setShowLogModal(true)}
              className="flex items-center space-x-1 px-3 py-1.5 text-xs font-bold text-white bg-primary-gold hover:opacity-90 rounded shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Log Transaction</span>
            </button>
            <div className="inline-flex rounded border border-border-custom bg-sidebar-bg p-0.5 items-center select-none">
              <span className="px-2 text-[10px] font-bold text-text-muted uppercase tracking-wider">Export Ledger:</span>
              <button 
                onClick={() => handleExport('xlsx')} 
                className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-text-muted hover:text-text-main border-l border-border-custom/50"
              >
                Excel
              </button>
              <button 
                onClick={() => handleExport('csv')} 
                className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-text-muted hover:text-text-main border-l border-border-custom/50"
              >
                CSV
              </button>
              <button 
                onClick={() => handleExport('pdf')} 
                className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-text-muted hover:text-text-main border-l border-border-custom/50"
              >
                PDF
              </button>
            </div>
          </div>
        </div>

        {/* Ledger search */}
        <div className="flex bg-card-bg border border-border-custom p-3 rounded-md shadow-xs items-center justify-between">
          <div className="relative w-80">
            <span className="absolute inset-y-0 left-2.5 flex items-center pointer-events-none">
              <Search className="h-3.5 w-3.5 text-text-muted" />
            </span>
            <input 
              type="text" 
              placeholder="Search comments, particulars..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-bg-app text-xs border border-border-custom rounded text-text-main focus:outline-none focus:border-primary-gold font-medium placeholder-text-muted"
            />
          </div>
          <div className="text-[10px] font-bold text-text-muted uppercase tracking-wider">
            Double click cell to edit values inline
          </div>
        </div>

        {/* Workspace Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT: Ledger Table */}
          <div className="lg:col-span-8 bg-card-bg border border-border-custom rounded-md shadow-sm overflow-hidden flex flex-col">
            <div className="overflow-x-auto relative">
              <table className="w-full text-left text-xs border-collapse relative">
                <thead>
                  <tr className="bg-bg-app border-b border-border-custom text-[10px] font-bold text-text-muted uppercase tracking-wider sticky top-0 z-10">
                    <th className="p-3 pl-4">Customer Name</th>
                    <th className="p-3 text-center">Touch</th>
                    <th className="p-3 text-right">Gross Weight</th>
                    <th className="p-3 text-right">Stone Weight</th>
                    <th className="p-3 text-right">Net Weight</th>
                    <th className="p-3 text-right">Fine Gold</th>
                    <th className="p-3">Date</th>
                    <th className="p-3 text-center pr-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-custom/50 font-medium">
                  {filteredLedger.length > 0 ? (
                    filteredLedger.map((row) => {
                      const isSelected = row.id === selectedRowId;
                      return (
                        <tr 
                          key={row.id}
                          onClick={() => setSelectedRowId(row.id)}
                          className={`hover:bg-bg-app cursor-pointer transition-colors duration-150 ${
                            isSelected ? 'bg-bg-app/80 border-l-2 border-primary-gold' : ''
                          }`}
                        >
                          {/* Customer Name */}
                          <td className="p-3 pl-4 text-text-main font-semibold">
                            {activeAccount.name}
                          </td>

                          {/* Touch */}
                          <td className="p-3 text-center">
                            {editingCell?.rowId === row.id && editingCell?.field === 'touch' ? (
                              <input 
                                type="number"
                                step="0.01"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onBlur={() => saveInlineEdit(row.id, 'touch')}
                                onKeyDown={(e) => e.key === 'Enter' && saveInlineEdit(row.id, 'touch')}
                                className="bg-sidebar-bg border border-primary-gold text-[11px] px-1 py-0.5 rounded outline-none focus:ring-0 max-w-[60px] text-center"
                                autoFocus
                              />
                            ) : (
                              <span onDoubleClick={() => startEditing(row.id, 'touch', row.touch)} className="font-mono text-primary-gold font-bold">
                                {row.touch.toFixed(2)}%
                              </span>
                            )}
                          </td>

                          {/* Gross Weight */}
                          <td className="p-3 text-right text-text-muted">
                            {editingCell?.rowId === row.id && editingCell?.field === 'grossWeight' ? (
                              <input 
                                type="number"
                                step="0.001"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onBlur={() => saveInlineEdit(row.id, 'grossWeight')}
                                onKeyDown={(e) => e.key === 'Enter' && saveInlineEdit(row.id, 'grossWeight')}
                                className="bg-sidebar-bg border border-primary-gold text-[11px] px-1 py-0.5 rounded outline-none focus:ring-0 max-w-[80px] text-right"
                                autoFocus
                              />
                            ) : (
                              <span onDoubleClick={() => startEditing(row.id, 'grossWeight', row.grossWeight)}>
                                {row.grossWeight.toFixed(3)}
                              </span>
                            )}
                          </td>

                          {/* Stone Weight */}
                          <td className="p-3 text-right text-text-muted">
                            {editingCell?.rowId === row.id && editingCell?.field === 'stoneWeight' ? (
                              <input 
                                type="number"
                                step="0.001"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onBlur={() => saveInlineEdit(row.id, 'stoneWeight')}
                                onKeyDown={(e) => e.key === 'Enter' && saveInlineEdit(row.id, 'stoneWeight')}
                                className="bg-sidebar-bg border border-primary-gold text-[11px] px-1 py-0.5 rounded outline-none focus:ring-0 max-w-[80px] text-right"
                                autoFocus
                              />
                            ) : (
                              <span onDoubleClick={() => startEditing(row.id, 'stoneWeight', row.stoneWeight)}>
                                {row.stoneWeight.toFixed(3)}
                              </span>
                            )}
                          </td>

                          {/* Net Weight */}
                          <td className="p-3 text-right text-text-main font-semibold">
                            {row.netWeight.toFixed(3)}
                          </td>

                          {/* Fine Gold */}
                          <td className="p-3 text-right text-text-main font-semibold">
                            {(row.fineGold ?? row.touch_value ?? 0).toFixed(3)}
                          </td>

                          {/* Date */}
                          <td className="p-3 font-mono text-text-muted whitespace-nowrap">
                            {editingCell?.rowId === row.id && editingCell?.field === 'date' ? (
                              <input 
                                type="date"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onBlur={() => saveInlineEdit(row.id, 'date')}
                                onKeyDown={(e) => e.key === 'Enter' && saveInlineEdit(row.id, 'date')}
                                className="bg-sidebar-bg border border-primary-gold text-[11px] px-1 py-0.5 rounded outline-none focus:ring-0 max-w-[100px]"
                                autoFocus
                              />
                            ) : (
                              <span onDoubleClick={() => startEditing(row.id, 'date', row.date)}>
                                {new Date(row.date).toLocaleDateString()}
                              </span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="p-3 text-center pr-4">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditRowId(row.id);
                                  setEditDate(row.date);
                                  setEditParticular(row.particular);
                                  setEditGross(String(row.grossWeight));
                                  setEditStone(String(row.stoneWeight));
                                  setEditAddedTouch(String(row.added_touch ?? 0));
                                  setEditNotes(row.notes ?? '');
                                  setIsEditModalOpen(true);
                                }}
                                className="p-1 rounded hover:bg-bg-app text-text-muted hover:text-text-main transition-colors"
                                title="Edit Voucher Row"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteTargetRowId(row.id);
                                  setDeleteConfirmOpen(true);
                                }}
                                className="p-1 rounded hover:bg-danger-custom/10 text-danger-custom transition-colors"
                                title="Delete Voucher Row"
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
                      <td colSpan={9} className="p-8 text-center text-text-muted font-bold">
                        No ledger entries recorded.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {/* Summary details */}
            {activeAccount && (
              <div className="p-4 border-t border-border-custom bg-sidebar-bg/50 flex justify-between items-center text-xs font-semibold">
                <span className="text-text-muted">Total Managed: {activeAccount.ledger.length} lines</span>
                <span className="text-text-main">
                  Closing Fine Balance: <span className={activeAccount.currentBalance >= 0 ? 'text-text-main' : 'text-danger-custom font-bold'}>{activeAccount.currentBalance.toFixed(3)}g</span>
                </span>
              </div>
            )}
          </div>

          {/* RIGHT: Detail Context Panel */}
          <div className="lg:col-span-4 flex flex-col">
            <AnimatePresence mode="wait">
              {activeRow ? (
                <motion.div
                  key={activeRow.id}
                  initial={{ opacity: 0, x: 15 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -15 }}
                  transition={{ duration: 0.15 }}
                  className="bg-card-bg border border-border-custom rounded-md shadow-xs overflow-hidden flex flex-col"
                >
                  {/* Tabs header */}
                  <div className="flex border-b border-border-custom bg-sidebar-bg/40 pr-3">
                    <button
                      onClick={() => setActiveTab('details')}
                      className={`px-4 py-3 text-[10px] font-bold uppercase tracking-wider border-b-2 transition-all ${
                        activeTab === 'details' ? 'border-primary-gold text-text-main bg-card-bg' : 'border-transparent text-text-muted hover:text-text-main'
                      }`}
                    >
                      Transaction Details
                    </button>
                    <button
                      onClick={() => setActiveTab('audit')}
                      className={`px-4 py-3 text-[10px] font-bold uppercase tracking-wider border-b-2 transition-all ${
                        activeTab === 'audit' ? 'border-primary-gold text-text-main bg-card-bg' : 'border-transparent text-text-muted hover:text-text-main'
                      }`}
                    >
                      Audit Trail
                    </button>

                    <button 
                      onClick={() => {
                        setDeleteTargetRowId(activeRow.id);
                        setDeleteConfirmOpen(true);
                      }}
                      className="ml-auto p-1.5 text-text-muted hover:text-danger-custom transition-colors"
                      title="Delete Voucher Row"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Context body */}
                  <div className="p-5 space-y-5">
                    {activeTab === 'details' && (
                      <div className="space-y-5 text-xs">
                        
                        {/* Summary weights cards */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-bg-app border border-border-custom p-3 rounded">
                            <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider block">Posting Date</span>
                            <span className="text-xs font-semibold text-text-main block mt-1 flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-text-muted" />
                              {new Date(activeRow.date).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="bg-bg-app border border-border-custom p-3 rounded">
                            <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider block">Journal Particular</span>
                            <span className="text-xs font-semibold text-text-main block mt-1">{activeRow.particular}</span>
                          </div>
                        </div>

                        {/* Weights parameters */}
                        <div className="space-y-2">
                          <h4 className="text-[9px] font-bold text-text-muted uppercase tracking-wider block">Weights breakdown</h4>
                          <div className="bg-bg-app/50 border border-border-custom rounded divide-y divide-border-custom">
                            <div className="p-2.5 flex justify-between">
                              <span className="text-text-muted font-medium">Gross Weight</span>
                              <span className="font-semibold">{activeRow.grossWeight.toFixed(3)} g</span>
                            </div>
                            <div className="p-2.5 flex justify-between">
                              <span className="text-text-muted font-medium">Stone deductions</span>
                              <span className="font-semibold">{activeRow.stoneWeight.toFixed(3)} g</span>
                            </div>
                            <div className="p-2.5 flex justify-between">
                              <span className="text-text-muted font-medium">Net Weight</span>
                              <span className="font-semibold">{activeRow.netWeight.toFixed(3)} g</span>
                            </div>
                            <div className="p-2.5 flex justify-between">
                              <span className="text-text-muted font-medium">Touch fineness</span>
                              <span className="font-bold text-primary-gold bg-primary-gold/10 px-1.5 py-0.5 rounded leading-none text-[10px]">{activeRow.touch.toFixed(2)}%</span>
                            </div>
                          </div>
                        </div>

                        {/* Posting impact */}
                        <div className="space-y-2">
                          <h4 className="text-[9px] font-bold text-text-muted uppercase tracking-wider block">Ledger fine gold impact</h4>
                          <div className="border border-border-custom rounded overflow-hidden">
                            <table className="w-full text-left text-xs border-collapse">
                              <thead>
                                <tr className="bg-bg-app text-text-muted border-b border-border-custom text-[9px] font-bold uppercase tracking-wider">
                                  <th className="p-2">Account</th>
                                  <th className="p-2 text-right">Debit</th>
                                  <th className="p-2 text-right">Credit</th>
                                </tr>
                              </thead>
                              <tbody>
                                <tr className="border-b border-border-custom/50">
                                  <td className="p-2 font-medium text-text-main truncate max-w-[120px]">{activeAccount.name}</td>
                                  <td className="p-2 text-right text-danger-custom font-bold">{activeRow.debit > 0 ? `${activeRow.debit.toFixed(3)}g` : '-'}</td>
                                  <td className="p-2 text-right text-success-custom font-bold">{activeRow.credit > 0 ? `${activeRow.credit.toFixed(3)}g` : '-'}</td>
                                </tr>
                                <tr>
                                  <td className="p-2 font-medium text-text-muted">Vault Treasury</td>
                                  <td className="p-2 text-right text-text-muted">{activeRow.credit > 0 ? `${activeRow.credit.toFixed(3)}g` : '-'}</td>
                                  <td className="p-2 text-right text-text-muted">{activeRow.debit > 0 ? `${activeRow.debit.toFixed(3)}g` : '-'}</td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* Notes */}
                        <div className="space-y-1.5">
                          <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider block">Description Vouchers</span>
                          <div className="bg-bg-app border border-border-custom p-3.5 rounded min-h-[60px] text-text-main leading-relaxed">
                            {activeRow.notes || 'No comments added to this voucher row.'}
                          </div>
                        </div>

                        {/* Attachments */}
                        {activeRow.attachments && activeRow.attachments.length > 0 && (
                          <div className="space-y-1.5">
                            <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider block">Attachments</span>
                            <div className="space-y-1.5">
                              {activeRow.attachments.map(file => (
                                <div key={file} className="flex justify-between items-center p-2 border border-border-custom bg-bg-app rounded hover:border-primary-gold/45">
                                  <span className="text-text-main truncate pr-2">{file}</span>
                                  <button onClick={() => alert('Download file mockup')} className="text-primary-gold hover:underline font-bold">Get</button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Created/Updated time details */}
                        <div className="pt-2 border-t border-border-custom text-[10px] text-text-muted space-y-1">
                          <div>Created Date: {new Date(activeRow.createdDate).toLocaleString()}</div>
                          <div>Last Modified: {new Date(activeRow.updatedDate).toLocaleString()}</div>
                        </div>
                      </div>
                    )}

                    {activeTab === 'audit' && (
                      <div className="space-y-4 text-xs">
                        <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider block">Immutable audit logs trail</span>
                        {activeRow.auditHistory && activeRow.auditHistory.length > 0 ? (
                          <div className="space-y-3.5">
                            {activeRow.auditHistory.map((audit, idx) => (
                              <div key={idx} className="flex space-x-2.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-success-custom flex-shrink-0 mt-1" />
                                <div>
                                  <div className="font-semibold text-text-main">{audit.action}</div>
                                  <p className="text-[11px] text-text-muted mt-0.5">{audit.details || 'Cell updated inline.'}</p>
                                  <div className="text-[9px] text-text-muted mt-0.5">By: {audit.user} • {new Date(audit.timestamp).toLocaleTimeString()}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center p-6 border border-dashed border-border-custom rounded bg-bg-app text-text-muted font-semibold">
                            No logs recorded.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              ) : (
                <div className="bg-card-bg border border-border-custom rounded-md shadow-xs p-8 text-center text-xs text-text-muted font-bold">
                  Select a ledger row on the left to show context notes drawer.
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* LOG TRANSACTION MODAL DIALOG */}
        {showLogModal && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
            <div className="bg-sidebar-bg border border-border-custom rounded-md shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
              <div className="p-4 border-b border-border-custom bg-bg-app/40 flex justify-between items-center">
                <span className="font-bold text-xs text-text-main">Log Voucher Transaction</span>
                <button onClick={() => setShowLogModal(false)} className="p-1 hover:bg-bg-app rounded text-text-muted hover:text-text-main"><X className="w-4 h-4" /></button>
              </div>

              <form onSubmit={handleCreateTransaction} className="p-5 space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col space-y-1">
                    <label className="text-[9px] font-bold text-text-muted uppercase tracking-wider">Posting Date</label>
                    <input 
                      type="date"
                      value={formDate}
                      onChange={(e) => setFormDate(e.target.value)}
                      className="bg-bg-app border border-border-custom rounded px-2.5 py-1.5 text-xs text-text-main font-semibold focus:outline-none focus:border-primary-gold"
                      required
                    />
                  </div>

                  <div className="flex flex-col space-y-1">
                    <label className="text-[9px] font-bold text-text-muted uppercase tracking-wider">Particular</label>
                    <select 
                      value={formParticular}
                      onChange={(e) => setFormParticular(e.target.value as LedgerRow['particular'])}
                      className="bg-bg-app border border-border-custom rounded px-2.5 py-1.5 text-xs text-text-main font-semibold focus:outline-none focus:border-primary-gold"
                      required
                    >
                      <option value="Opening Balance">Opening Balance</option>
                      <option value="WT RCVD">WT RCVD</option>
                      <option value="Sale">Sale</option>
                      <option value="Adjustment">Adjustment</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="flex flex-col space-y-1">
                    <label className="text-[9px] font-bold text-text-muted uppercase tracking-wider">Gross (g)</label>
                    <input 
                      type="number"
                      step="any"
                      placeholder="100.00"
                      value={formGross}
                      onChange={(e) => setFormGross(e.target.value)}
                      className="bg-bg-app border border-border-custom rounded px-2.5 py-1.5 text-xs text-text-main font-semibold focus:outline-none focus:border-primary-gold placeholder-text-muted/60"
                      required
                    />
                  </div>

                  <div className="flex flex-col space-y-1">
                    <label className="text-[9px] font-bold text-text-muted uppercase tracking-wider">Stone (g)</label>
                    <input 
                      type="number"
                      step="any"
                      placeholder="0.00"
                      value={formStone}
                      onChange={(e) => setFormStone(e.target.value)}
                      className="bg-bg-app border border-border-custom rounded px-2.5 py-1.5 text-xs text-text-main font-semibold focus:outline-none focus:border-primary-gold"
                      required
                    />
                  </div>

                  <div className="flex flex-col space-y-1">
                    <label className="text-[9px] font-bold text-text-muted uppercase tracking-wider">Touch (%)</label>
                    <input 
                      type="number"
                      step="any"
                      placeholder="99.90"
                      value={formAddedTouch}
                      onChange={(e) => setFormAddedTouch(e.target.value)}
                      className="bg-bg-app border border-border-custom rounded px-2.5 py-1.5 text-xs text-text-main font-semibold focus:outline-none focus:border-primary-gold"
                      required
                    />
                  </div>
                </div>

                {(() => {
                  const grossNum = parseFloat(formGross) || 0;
                  const stoneNum = parseFloat(formStone) || 0;
                  const netNum = grossNum - stoneNum;
                  const touchNum = parseFloat(formAddedTouch) || 0;
                  const fineGoldEst = parseFloat(((netNum * touchNum) / 100).toFixed(3));
                  return (
                    <div className="bg-bg-app border border-border-custom p-3 rounded flex justify-between items-center select-none font-sans">
                      <div>
                        <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider block">Net Weight</span>
                        <span className="text-xs font-bold text-text-main block mt-0.5">{netNum.toFixed(3)} g</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider block">Fine Gold (Calculated)</span>
                        <span className="text-xs font-bold text-text-main block mt-0.5">{fineGoldEst.toFixed(3)} g</span>
                      </div>
                    </div>
                  );
                })()}

                <div className="flex flex-col space-y-1">
                  <label className="text-[9px] font-bold text-text-muted uppercase tracking-wider">Voucher Notes</label>
                  <textarea 
                    rows={3}
                    placeholder="Enter description comments..."
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    className="bg-bg-app border border-border-custom rounded px-2.5 py-1.5 text-xs text-text-main font-semibold focus:outline-none focus:border-primary-gold placeholder-text-muted/60 resize-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-border-custom">
                  <button 
                    type="button" 
                    onClick={() => setShowLogModal(false)}
                    className="px-4 py-2 border border-border-custom rounded font-bold text-text-muted hover:text-text-main bg-bg-app"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="px-4 py-2 bg-primary-gold hover:opacity-90 rounded font-bold text-white shadow-xs"
                  >
                    Log Voucher
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* EDIT VOUCHER TRANSACTION MODAL DIALOG */}
        {isEditModalOpen && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
            <div className="bg-sidebar-bg border border-border-custom rounded-md shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
              <div className="p-4 border-b border-border-custom bg-bg-app/40 flex justify-between items-center select-none">
                <span className="font-bold text-xs text-text-main">Edit Voucher Transaction</span>
                <button onClick={() => setIsEditModalOpen(false)} className="p-1 hover:bg-bg-app rounded text-text-muted hover:text-text-main">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleEditSubmit} className="p-5 space-y-4 text-xs font-semibold">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col space-y-1">
                    <label className="text-[9px] font-bold text-text-muted uppercase tracking-wider">Posting Date</label>
                    <input 
                      type="date"
                      value={editDate}
                      onChange={(e) => setEditDate(e.target.value)}
                      className="bg-bg-app border border-border-custom rounded px-2.5 py-1.5 text-xs text-text-main font-semibold focus:outline-none focus:border-primary-gold"
                      required
                    />
                  </div>

                  <div className="flex flex-col space-y-1">
                    <label className="text-[9px] font-bold text-text-muted uppercase tracking-wider">Particular</label>
                    <select 
                      value={editParticular}
                      onChange={(e) => setEditParticular(e.target.value as LedgerRow['particular'])}
                      className="bg-bg-app border border-border-custom rounded px-2.5 py-1.5 text-xs text-text-main font-semibold focus:outline-none focus:border-primary-gold"
                      required
                    >
                      <option value="Opening Balance">Opening Balance</option>
                      <option value="WT RCVD">WT RCVD (Credit Inbound)</option>
                      <option value="Sale">Sale (Debit Outbound)</option>
                      <option value="Adjustment">Adjustment (Audit balance)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="flex flex-col space-y-1">
                    <label className="text-[9px] font-bold text-text-muted uppercase tracking-wider">Gross (g)</label>
                    <input 
                      type="number"
                      step="any"
                      placeholder="0.00"
                      value={editGross}
                      onChange={(e) => setEditGross(e.target.value)}
                      className="bg-bg-app border border-border-custom rounded px-2.5 py-1.5 text-xs text-text-main font-semibold focus:outline-none focus:border-primary-gold placeholder-text-muted/60"
                      required
                    />
                  </div>

                  <div className="flex flex-col space-y-1">
                    <label className="text-[9px] font-bold text-text-muted uppercase tracking-wider">Stone (g)</label>
                    <input 
                      type="number"
                      step="any"
                      placeholder="0.00"
                      value={editStone}
                      onChange={(e) => setEditStone(e.target.value)}
                      className="bg-bg-app border border-border-custom rounded px-2.5 py-1.5 text-xs text-text-main font-semibold focus:outline-none focus:border-primary-gold"
                      required
                    />
                  </div>

                  <div className="flex flex-col space-y-1">
                    <label className="text-[9px] font-bold text-text-muted uppercase tracking-wider">Touch (%)</label>
                    <input 
                      type="number"
                      step="any"
                      placeholder="99.90"
                      value={editAddedTouch}
                      onChange={(e) => setEditAddedTouch(e.target.value)}
                      className="bg-bg-app border border-border-custom rounded px-2.5 py-1.5 text-xs text-text-main font-semibold focus:outline-none focus:border-primary-gold"
                      required
                    />
                  </div>
                </div>

                {(() => {
                  const grossNum = parseFloat(editGross) || 0;
                  const stoneNum = parseFloat(editStone) || 0;
                  const netNum = grossNum - stoneNum;
                  const touchNum = parseFloat(editAddedTouch) || 0;
                  const fineGoldEst = parseFloat(((netNum * touchNum) / 100).toFixed(3));
                  return (
                    <div className="bg-bg-app border border-border-custom p-3 rounded flex justify-between items-center select-none font-sans">
                      <div>
                        <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider block">Net Weight</span>
                        <span className="text-xs font-bold text-text-main block mt-0.5">{netNum.toFixed(3)} g</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider block">Fine Gold (Calculated)</span>
                        <span className="text-xs font-bold text-text-main block mt-0.5">{fineGoldEst.toFixed(3)} g</span>
                      </div>
                    </div>
                  );
                })()}

                <div className="flex flex-col space-y-1">
                  <label className="text-[9px] font-bold text-text-muted uppercase tracking-wider">Voucher Notes</label>
                  <textarea 
                    rows={3}
                    placeholder="Enter description comments..."
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    className="bg-bg-app border border-border-custom rounded px-2.5 py-1.5 text-xs text-text-main font-semibold focus:outline-none focus:border-primary-gold placeholder-text-muted/60 resize-none"
                  />
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
                  Are you sure you want to delete this transaction ledger row record? This action will permanently remove the record from the database.
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
                      if (activeAccount) {
                        deleteLedgerRow(activeAccount.id, deleteTargetRowId);
                      }
                      setDeleteConfirmOpen(false);
                    }}
                    className="px-4 py-2 bg-danger-custom hover:opacity-90 rounded font-bold text-white shadow-xs"
                  >
                    Delete Record
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
