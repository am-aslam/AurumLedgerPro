'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import { useExcelLedgerStore, LedgerRow } from '@/store/useExcelLedgerStore';
import { ShieldCheck, ArrowRight, LayoutGrid, CheckCircle } from 'lucide-react';

export default function TransactionsPage() {
  const router = useRouter();
  const { accounts, addLedgerRow, goldRate } = useExcelLedgerStore();
  const [successMsg, setSuccessMsg] = useState(false);

  // Form States
  const [targetAccount, setTargetAccount] = useState(accounts[0]?.id || '');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [particular, setParticular] = useState<LedgerRow['particular']>('WT RCVD');
  const [gross, setGross] = useState('');
  const [stone, setStone] = useState('0');
  const [touch, setTouch] = useState('99.90');
  const [notes, setNotes] = useState('');

  // Auto-calculated fields
  const grossNum = parseFloat(gross) || 0;
  const stoneNum = parseFloat(stone) || 0;
  const netWeight = grossNum - stoneNum;
  const touchNum = parseFloat(touch) || 100;
  const fineWeight = parseFloat(((netWeight * touchNum) / 100).toFixed(3));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetAccount) return;

    addLedgerRow(targetAccount, {
      date,
      particular,
      grossWeight: grossNum,
      stoneWeight: stoneNum,
      touch: touchNum,
      debit: 0,
      credit: 0,
      notes,
      attachments: []
    });

    setSuccessMsg(true);
    setGross('');
    setStone('0');
    setNotes('');
  };

  return (
    <AppLayout>
      <div className="space-y-6 max-w-xl mx-auto">
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

            {/* Touch Purity */}
            <div className="flex flex-col space-y-1">
              <label className="text-[9px] font-bold text-text-muted uppercase tracking-wider">Assay Touch %</label>
              <input 
                type="number"
                step="0.01"
                placeholder="e.g. 99.90"
                value={touch}
                onChange={(e) => setTouch(e.target.value)}
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
                step="0.01"
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
                step="0.01"
                placeholder="0.00"
                value={stone}
                onChange={(e) => setStone(e.target.value)}
                className="bg-bg-app border border-border-custom rounded px-2.5 py-1.5 text-xs text-text-main font-semibold focus:outline-none focus:border-primary-gold"
                required
              />
            </div>
          </div>

          {/* Calculator Estimation Card */}
          <div className="bg-bg-app border border-border-custom p-4 rounded-md flex justify-between items-center">
            <div>
              <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider block">Estimated Fine Gold Position</span>
              <span className="text-sm font-bold text-text-main block mt-1">{fineWeight.toFixed(2)} g</span>
              <span className="text-[10px] text-text-muted block mt-0.5">Net weight: {netWeight.toFixed(2)}g</span>
            </div>
            <div className="text-right">
              <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider block">Calculated Value (USD)</span>
              <span className="text-sm font-bold text-text-main block mt-1">
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
      </div>
    </AppLayout>
  );
}
