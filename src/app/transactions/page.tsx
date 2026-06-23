'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import { useExcelLedgerStore, LedgerRow } from '@/store/useExcelLedgerStore';
import { ShieldCheck, ArrowRight, LayoutGrid, CheckCircle, Trash2, Edit3, X } from 'lucide-react';

export default function TransactionsPage() {
  const router = useRouter();
  const { accounts, addLedgerRow, deleteLedgerRow, updateLedgerRow, goldRate } = useExcelLedgerStore();
  const [successMsg, setSuccessMsg] = useState(false);

  // Form States
  const [targetAccount, setTargetAccount] = useState(accounts[0]?.id || '');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [particular, setParticular] = useState<LedgerRow['particular']>('WT RCVD');
  const [gross, setGross] = useState('');
  const [stone, setStone] = useState('0');
  const [addedTouch, setAddedTouch] = useState('99.90');
  const [notes, setNotes] = useState('');

  // Edit Modal States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editRowId, setEditRowId] = useState('');
  const [editAccountId, setEditAccountId] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editParticular, setEditParticular] = useState<LedgerRow['particular']>('WT RCVD');
  const [editGross, setEditGross] = useState('');
  const [editStone, setEditStone] = useState('0');
  const [editAddedTouch, setEditAddedTouch] = useState('99.90');
  const [editNotes, setEditNotes] = useState('');

  // Custom Delete Confirmation Modal States
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTargetRowId, setDeleteTargetRowId] = useState('');
  const [deleteTargetAccountId, setDeleteTargetAccountId] = useState('');

  // Auto-calculated fields
  const grossNum = parseFloat(gross) || 0;
  const stoneNum = parseFloat(stone) || 0;
  const netWeight = grossNum - stoneNum;
  const addedTouchNum = parseFloat(addedTouch) || 0;
  const fineWeight = parseFloat(((netWeight * addedTouchNum) / 100).toFixed(3));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetAccount) return;

    addLedgerRow(targetAccount, {
      date,
      particular,
      grossWeight: grossNum,
      stoneWeight: stoneNum,
      touch: addedTouchNum,
      added_touch: addedTouchNum,
      debit: 0,
      credit: 0,
      notes,
      attachments: []
    });

    setSuccessMsg(true);
    setGross('');
    setStone('0');
    setAddedTouch('99.90');
    setNotes('');
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editRowId || !editAccountId) return;
    updateLedgerRow(editAccountId, editRowId, {
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

  return (
    <AppLayout>
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Title */}
        <div>
          <h1 className="text-xl font-bold tracking-tight text-text-main">Voucher Transactions</h1>
          <p className="text-xs text-text-muted mt-1">Record a new fine gold voucher transaction. Select target account and post weight calculations.</p>
        </div>

        {/* Success Alert */}
        {successMsg && (
          <div className="bg-success-custom/10 border border-success-custom/25 p-4 rounded-md flex justify-between items-center text-xs animate-in zoom-in-95 duration-150">
            <div className="flex items-center space-x-2.5">
              <CheckCircle className="w-5 h-5 text-success-custom" />
              <div>
                <span className="font-bold text-text-main block">Voucher Posted Successfully!</span>
                <span className="text-[11px] text-text-muted mt-0.5">Customer balance and timeline reports updated in database.</span>
              </div>
            </div>
            <button 
              onClick={() => router.push('/ledgers')}
              className="px-3 py-1.5 bg-sidebar-bg border border-border-custom hover:border-primary-gold/40 text-text-main font-bold rounded"
            >
              View Ledger
            </button>
          </div>
        )}

        {/* Creator Form */}
        <form onSubmit={handleSubmit} className="bg-card-bg border border-border-custom p-6 rounded-md shadow-sm space-y-5 text-xs font-semibold">
          
          <div className="grid grid-cols-2 gap-4">
            {/* Target Account */}
            <div className="flex flex-col space-y-1">
              <label className="text-[9px] font-bold text-text-muted uppercase tracking-wider">Target Client Account</label>
              <select
                value={targetAccount}
                onChange={(e) => setTargetAccount(e.target.value)}
                className="bg-bg-app border border-border-custom rounded px-2.5 py-1.5 text-xs text-text-main font-semibold focus:outline-none focus:border-primary-gold"
                required
              >
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id}>{acc.name}</option>
                ))}
              </select>
            </div>

            {/* Posting Date */}
            <div className="flex flex-col space-y-1">
              <label className="text-[9px] font-bold text-text-muted uppercase tracking-wider">Voucher Posting Date</label>
              <input 
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="bg-bg-app border border-border-custom rounded px-2.5 py-1.5 text-xs text-text-main font-semibold focus:outline-none focus:border-primary-gold"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Particular Type */}
            <div className="flex flex-col space-y-1">
              <label className="text-[9px] font-bold text-text-muted uppercase tracking-wider">Particular Category</label>
              <select 
                value={particular}
                onChange={(e) => setParticular(e.target.value as LedgerRow['particular'])}
                className="bg-bg-app border border-border-custom rounded px-2.5 py-1.5 text-xs text-text-main font-semibold focus:outline-none focus:border-primary-gold"
                required
              >
                <option value="Opening Balance">Opening Balance</option>
                <option value="WT RCVD">WT RCVD (Credit Inbound)</option>
                <option value="Sale">Sale (Debit Outbound)</option>
                <option value="Adjustment">Adjustment (Audit balance)</option>
              </select>
            </div>

            {/* Purity / Touch */}
            <div className="flex flex-col space-y-1">
              <label className="text-[9px] font-bold text-text-muted uppercase tracking-wider">Purity %</label>
              <input 
                type="number"
                step="any"
                placeholder="e.g. 99.90"
                value={addedTouch}
                onChange={(e) => setAddedTouch(e.target.value)}
                className="bg-bg-app border border-border-custom rounded px-2.5 py-1.5 text-xs text-text-main font-semibold focus:outline-none focus:border-primary-gold"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Gross Weight */}
            <div className="flex flex-col space-y-1">
              <label className="text-[9px] font-bold text-text-muted uppercase tracking-wider">Gross Weight (grams)</label>
              <input 
                type="number"
                step="any"
                placeholder="0.00"
                value={gross}
                onChange={(e) => setGross(e.target.value)}
                className="bg-bg-app border border-border-custom rounded px-2.5 py-1.5 text-xs text-text-main font-semibold focus:outline-none focus:border-primary-gold placeholder-text-muted/60"
                required
              />
            </div>

            {/* Stone Deduction */}
            <div className="flex flex-col space-y-1">
              <label className="text-[9px] font-bold text-text-muted uppercase tracking-wider">Stone Deduction (grams)</label>
              <input 
                type="number"
                step="any"
                placeholder="0.00"
                value={stone}
                onChange={(e) => setStone(e.target.value)}
                className="bg-bg-app border border-border-custom rounded px-2.5 py-1.5 text-xs text-text-main font-semibold focus:outline-none focus:border-primary-gold"
                required
              />
            </div>
          </div>

          {/* Calculator Estimation Card */}
          <div className="bg-bg-app border border-border-custom p-4 rounded-md flex justify-between items-center select-none">
            <div className="space-y-1">
              <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider block">Net Weight</span>
              <span className="text-sm font-bold text-text-main block">{netWeight.toFixed(2)} g</span>
            </div>
            <div className="space-y-1 text-center">
              <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider block">Calculated Touch</span>
              <span className="text-sm font-bold text-text-main block">{fineWeight.toFixed(3)} g</span>
            </div>
            <div className="space-y-1 text-right">
              <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider block">Estimated USD Value</span>
              <span className="text-sm font-bold text-text-main block">
                ${(fineWeight * goldRate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Notes description */}
          <div className="flex flex-col space-y-1">
            <label className="text-[9px] font-bold text-text-muted uppercase tracking-wider">Voucher Notes / particulars</label>
            <textarea 
              rows={3}
              placeholder="Assay details, melt receipts comments..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="bg-bg-app border border-border-custom rounded px-2.5 py-1.5 text-xs text-text-main font-semibold focus:outline-none focus:border-primary-gold placeholder-text-muted/60 resize-none"
            />
          </div>

          {/* Action triggers */}
          <div className="flex justify-end gap-2 pt-2 border-t border-border-custom">
            <button 
              type="button"
              onClick={() => router.push('/ledgers')}
              className="px-4 py-2 border border-border-custom rounded bg-bg-app font-bold text-text-muted hover:text-text-main transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="px-4 py-2 bg-primary-gold hover:opacity-90 rounded font-bold text-white shadow-xs transition-opacity flex items-center gap-1 cursor-pointer"
            >
              <span>Post Transaction</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </form>

        {/* Table of all voucher transactions */}
        <div className="bg-card-bg border border-border-custom rounded-md shadow-sm overflow-hidden mt-8">
          <div className="p-4 border-b border-border-custom bg-bg-app/40 select-none">
            <h2 className="text-xs font-bold text-text-main">Recorded Voucher Ledger History</h2>
            <p className="text-[10px] text-text-muted mt-0.5">Audit log of all physical transactions registered across active vault accounts.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-bg-app border-b border-border-custom text-[10px] font-bold text-text-muted uppercase tracking-wider select-none">
                  <th className="p-3 pl-4">Customer Name</th>
                  <th className="p-3 text-center">Purity</th>
                  <th className="p-3 text-right">Gross Weight</th>
                  <th className="p-3 text-right">Stone Weight</th>
                  <th className="p-3 text-right">Net Weight</th>
                  <th className="p-3 text-right">Touch</th>
                  <th className="p-3">Date</th>
                  <th className="p-3 text-center pr-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-custom/50 font-medium">
                {(() => {
                  const allRows = accounts.flatMap(acc => acc.ledger.map(row => ({
                    ...row,
                    customerName: acc.name,
                    accountId: acc.id
                  }))).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

                  return allRows.length > 0 ? (
                    allRows.map((row) => (
                      <tr 
                        key={row.id}
                        className="hover:bg-bg-app transition-colors duration-150"
                      >
                        <td className="p-3 pl-4 text-text-main font-semibold">
                          {row.customerName}
                        </td>
                        <td className="p-3 text-center font-mono text-primary-gold font-bold">
                          {(row.added_touch ?? 0).toFixed(2)}%
                        </td>
                        <td className="p-3 text-right text-text-muted">
                          {row.grossWeight.toFixed(2)}
                        </td>
                        <td className="p-3 text-right text-text-muted">
                          {row.stoneWeight.toFixed(2)}
                        </td>
                        <td className="p-3 text-right text-text-main font-semibold">
                          {row.netWeight.toFixed(2)}
                        </td>
                        <td className="p-3 text-right text-text-main font-semibold">
                          {(row.touch_value ?? 0).toFixed(3)}
                        </td>
                        <td className="p-3 font-mono text-text-muted whitespace-nowrap">
                          {new Date(row.date).toLocaleDateString()}
                        </td>
                        <td className="p-3 text-center pr-4">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditRowId(row.id);
                                setEditAccountId(row.accountId);
                                setEditDate(row.date);
                                setEditParticular(row.particular);
                                setEditGross(String(row.grossWeight));
                                setEditStone(String(row.stoneWeight));
                                setEditAddedTouch(String(row.added_touch ?? 0));
                                setEditNotes(row.notes ?? '');
                                setIsEditModalOpen(true);
                              }}
                              className="p-1 rounded hover:bg-bg-app text-text-muted hover:text-text-main transition-colors"
                              title="Edit Transaction"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteTargetRowId(row.id);
                                setDeleteTargetAccountId(row.accountId);
                                setDeleteConfirmOpen(true);
                              }}
                              className="p-1 rounded hover:bg-danger-custom/10 text-danger-custom transition-colors"
                              title="Delete Transaction"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-text-muted font-bold">
                        No transactions registered in system database.
                      </td>
                    </tr>
                  );
                })()}
              </tbody>
            </table>
          </div>
        </div>

        {/* EDIT TRANSACTION MODAL DIALOG */}
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
                    <label className="text-[9px] font-bold text-text-muted uppercase tracking-wider">Purity %</label>
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
                  const addedTouchNum = parseFloat(editAddedTouch) || 0;
                  const touchValEst = parseFloat(((netNum * addedTouchNum) / 100).toFixed(3));
                  return (
                    <div className="bg-bg-app border border-border-custom p-3 rounded flex justify-between items-center select-none font-sans">
                      <div>
                        <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider block">Net Weight</span>
                        <span className="text-xs font-bold text-text-main block mt-0.5">{netNum.toFixed(2)} g</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider block">Calculated Touch</span>
                        <span className="text-xs font-bold text-text-main block mt-0.5">{touchValEst.toFixed(3)} g</span>
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
                  Are you sure you want to delete this transaction record? This action will permanently remove the record from the database.
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
                      deleteLedgerRow(deleteTargetAccountId, deleteTargetRowId);
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
