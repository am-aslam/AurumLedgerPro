'use client';

import React, { useEffect, useState, useMemo } from 'react';
import AppLayout from '@/components/AppLayout';
import { useExcelLedgerStore, formatCurrency } from '@/store/useExcelLedgerStore';
import { exportToExcel, exportToCSV, exportToPDF } from '@/lib/exportUtils';
import { Briefcase, Percent, Download, Users, ArrowUpRight, ArrowDownRight, X } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';

export default function PartnerCapitalPage() {
  const { partners, goldRate, selectedCurrency, addPartnerCapitalTransaction, addPartner } = useExcelLedgerStore();
  const [mounted, setMounted] = useState(false);

  // Modal states
  const [isContributionOpen, setIsContributionOpen] = useState(false);
  const [isRedemptionOpen, setIsRedemptionOpen] = useState(false);
  const [isRegisterPartnerOpen, setIsRegisterPartnerOpen] = useState(false);
  
  // Modal input states
  const [selectedPartnerId, setSelectedPartnerId] = useState('');
  const [inputAmount, setInputAmount] = useState('');
  const [inputParticular, setInputParticular] = useState('');
  const [inputRef, setInputRef] = useState('');

  // Register Partner states
  const [newPartnerName, setNewPartnerName] = useState('');
  const [newPartnerProfitShare, setNewPartnerProfitShare] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  const totalCapitalWeight = partners.reduce((sum, p) => sum + p.capitalBalance, 0);

  // Dynamically calculate baseline capital and chronological growth trend
  const trendData = useMemo(() => {
    const totalTransactionsSum = partners
      .flatMap(p => p.history)
      .reduce((sum, h) => sum + h.amount, 0);
    
    let runningWeight = totalCapitalWeight - totalTransactionsSum;
    const dateMap = new Map<string, number>();

    const sortedHistories = partners
      .flatMap(p => p.history)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    if (sortedHistories.length > 0) {
      const firstDate = new Date(sortedHistories[0].date);
      const dayBefore = new Date(firstDate.getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      dateMap.set(dayBefore, runningWeight);
    } else {
      const todayStr = new Date().toISOString().split('T')[0];
      dateMap.set(todayStr, totalCapitalWeight);
    }

    sortedHistories.forEach(h => {
      runningWeight = parseFloat((runningWeight + h.amount).toFixed(3));
      dateMap.set(h.date, runningWeight);
    });

    return Array.from(dateMap.entries()).map(([date, weight]) => {
      const parts = date.split('-');
      const formattedDate = parts.length === 3 ? `${parts[1]}-${parts[2]}` : date;
      return {
        date: formattedDate,
        weight
      };
    });
  }, [partners, totalCapitalWeight]);

  const openContributionModal = () => {
    if (partners.length > 0) {
      setSelectedPartnerId(partners[0].id);
    } else {
      setSelectedPartnerId('');
    }
    setInputAmount('');
    setInputParticular('Capital Contribution');
    setInputRef(`VOUCH-CAP-${Math.floor(1000 + Math.random() * 9000)}`);
    setIsContributionOpen(true);
  };

  const openRedemptionModal = () => {
    if (partners.length > 0) {
      setSelectedPartnerId(partners[0].id);
    } else {
      setSelectedPartnerId('');
    }
    setInputAmount('');
    setInputParticular('Equity Drawdown');
    setInputRef(`VOUCH-RED-${Math.floor(1000 + Math.random() * 9000)}`);
    setIsRedemptionOpen(true);
  };

  const handleRegisterPartnerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const profitNum = parseFloat(newPartnerProfitShare);
    if (!newPartnerName.trim()) {
      alert('Please enter a valid partner name.');
      return;
    }
    if (isNaN(profitNum) || profitNum < 0 || profitNum > 100) {
      alert('Please enter a profit share percentage between 0 and 100.');
      return;
    }
    addPartner(newPartnerName, profitNum);
    setIsRegisterPartnerOpen(false);
    setNewPartnerName('');
    setNewPartnerProfitShare('');
  };

  const handleContributionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(inputAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      alert('Please enter a valid amount greater than 0.');
      return;
    }
    addPartnerCapitalTransaction(selectedPartnerId, inputParticular, amountNum, inputRef);
    setIsContributionOpen(false);
  };

  const handleRedemptionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(inputAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      alert('Please enter a valid amount greater than 0.');
      return;
    }
    const partner = partners.find(p => p.id === selectedPartnerId);
    if (!partner) return;
    if (amountNum > partner.capitalBalance) {
      alert(`Insufficient balance. Partner only has ${partner.capitalBalance} g available.`);
      return;
    }
    addPartnerCapitalTransaction(selectedPartnerId, inputParticular, -amountNum, inputRef);
    setIsRedemptionOpen(false);
  };

  const currentPartner = partners.find(p => p.id === selectedPartnerId);

  const handleExport = (format: 'xlsx' | 'csv' | 'pdf') => {
    const filename = `partner_capital_${new Date().toISOString().split('T')[0]}`;
    
    const exportData = partners.map(p => ({
      'Partner ID': p.id,
      'Partner Name': p.name,
      'Capital Balance (g)': p.capitalBalance,
      'Profit Share %': p.profitShare,
      [`Valuation (${selectedCurrency})`]: formatCurrency(p.capitalBalance, goldRate, selectedCurrency)
    }));

    if (format === 'xlsx') {
      exportToExcel(exportData, filename, 'Partner Capital');
    } else if (format === 'csv') {
      exportToCSV(exportData, filename);
    } else if (format === 'pdf') {
      exportToPDF(
        'Partner Capital Balance Shares',
        ['Partner ID', 'Partner Name', 'Capital Balance (g)', 'Profit Share %', `Valuation (${selectedCurrency})`],
        ['Partner ID', 'Partner Name', 'Capital Balance (g)', 'Profit Share %', `Valuation (${selectedCurrency})`],
        exportData,
        ['left', 'left', 'right', 'center', 'right']
      );
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Title */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-text-main">Partner Capital Account</h1>
            <p className="text-xs text-text-muted mt-1">Replication of the Excel workbook capital section. Track equity storage weights and profit splits.</p>
          </div>
          
          <div className="inline-flex rounded border border-border-custom bg-sidebar-bg p-0.5 items-center select-none">
            <span className="px-2 text-[10px] font-bold text-text-muted uppercase tracking-wider">Export:</span>
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

        {/* Global Summary */}
        <div className="bg-card-bg border border-border-custom p-6 rounded shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 select-none">
          <div>
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block">Total Vault Partner Gold Managed</span>
            <span className="text-2xl font-bold text-text-main mt-1 block">
              {totalCapitalWeight.toLocaleString(undefined, { minimumFractionDigits: 2 })} g
            </span>
            <span className="text-xs text-text-muted mt-0.5 block">Estimated valuation: {formatCurrency(totalCapitalWeight, goldRate, selectedCurrency)}</span>
          </div>

          <div className="flex space-x-2">
            <button 
              onClick={() => setIsRegisterPartnerOpen(true)}
              className="px-3 py-2 text-xs font-bold border border-border-custom bg-sidebar-bg text-text-muted hover:text-text-main rounded transition-colors"
            >
              Register Partner
            </button>
            <button 
              onClick={openContributionModal}
              className="px-3 py-2 text-xs font-bold text-white bg-primary-gold hover:opacity-90 rounded shadow-xs animate-in fade-in disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={partners.length === 0}
            >
              Add Contribution
            </button>
            <button 
              onClick={openRedemptionModal}
              className="px-3 py-2 text-xs font-bold border border-border-custom bg-sidebar-bg text-text-muted hover:text-text-main rounded transition-colors animate-in fade-in disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={partners.length === 0}
            >
              Redeem Capital
            </button>
          </div>
        </div>

        {/* Partners detail cards */}
        {partners.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 select-none">
            {partners.map(p => {
              return (
                <div key={p.id} className="bg-card-bg border border-border-custom rounded-md p-5 shadow-sm space-y-4 animate-in fade-in">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[9px] font-bold bg-bg-app px-2 py-0.5 rounded border border-border-custom text-text-muted">{p.id}</span>
                      <h4 className="text-sm font-semibold text-text-main mt-1.5">{p.name}</h4>
                    </div>
                    <span className="text-xs font-bold text-primary-gold flex items-center gap-0.5">
                      <Percent className="w-3 h-3" />
                      {p.profitShare} share
                    </span>
                  </div>

                  <div className="space-y-1 mt-4">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-text-muted">Managed Stake</span>
                      <span className="text-text-main">{p.capitalBalance.toFixed(2)} g</span>
                    </div>
                    <div className="w-full h-1.5 bg-bg-app rounded-full overflow-hidden">
                      <div className="h-full bg-primary-gold rounded-full" style={{ width: `${p.profitShare}%` }} />
                    </div>
                    <span className="text-[10px] text-text-muted block mt-1 font-semibold">Value: {formatCurrency(p.capitalBalance, goldRate, selectedCurrency)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-card-bg border border-border-custom p-10 text-center rounded-md shadow-sm select-none">
            <Users className="w-8 h-8 text-text-muted mx-auto mb-2 opacity-50" />
            <h3 className="text-xs font-bold text-text-main">No Capital Partners Found</h3>
            <p className="text-[11px] text-text-muted mt-1 max-w-xs mx-auto">Register dynamic partners manually or import equity storage spreadsheets to track balances.</p>
          </div>
        )}

        {/* Trend & History Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Trend Chart (col span 7) */}
          <div className="lg:col-span-7 bg-card-bg border border-border-custom p-5 rounded shadow-sm h-[320px] flex flex-col">
            <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-4">Capital Growth Trend (Fine Grams)</h3>
            <div className="flex-1 min-h-0">
              {mounted ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="capGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#D4AF37" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" stroke="#9CA3AF" fontSize={10} tickLine={false} />
                    <YAxis stroke="#9CA3AF" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: 'var(--sidebar)', borderColor: 'var(--border)', fontSize: '11px' }} />
                    <Area type="monotone" dataKey="weight" stroke="#D4AF37" strokeWidth={2} fillOpacity={1} fill="url(#capGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-full bg-border-custom/20 animate-pulse rounded" />
              )}
            </div>
          </div>

          {/* History lines (col span 5) */}
          <div className="lg:col-span-5 bg-card-bg border border-border-custom rounded-md shadow-sm overflow-hidden flex flex-col h-[320px]">
            <div className="p-4 border-b border-border-custom bg-sidebar-bg/50">
              <span className="text-xs font-bold text-text-muted uppercase tracking-wider block">Capital Contribution Audits</span>
            </div>
            
            <div className="flex-1 overflow-y-auto divide-y divide-border-custom/40 p-4 space-y-4 scrollbar-thin">
              {partners
                .flatMap(p => p.history.map(h => ({ ...h, partnerName: p.name })))
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map((h, idx) => (
                  <div key={idx} className="text-xs flex justify-between items-start pb-3 border-b border-border-custom/30 last:border-0">
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-text-muted font-bold block">{new Date(h.date).toLocaleDateString()}</span>
                      <span className="text-text-main font-semibold block">{h.partnerName}</span>
                      <span className="text-[10px] text-text-muted block">{h.particular} (Ref: {h.ref})</span>
                    </div>
                    <span className={`font-bold ${h.amount > 0 ? 'text-success-custom' : 'text-danger-custom'}`}>
                      {h.amount > 0 ? `+${h.amount.toFixed(2)}` : `${h.amount.toFixed(2)}`} g
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* ADD CONTRIBUTION DIALOG MODAL */}
        {isContributionOpen && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-sidebar-bg border border-border-custom rounded-md shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
              <div className="p-4 border-b border-border-custom bg-bg-app/40 flex justify-between items-center select-none">
                <span className="font-bold text-xs text-text-main">Log Capital Contribution</span>
                <button 
                  onClick={() => setIsContributionOpen(false)} 
                  className="p-1 hover:bg-bg-app rounded text-text-muted hover:text-text-main"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleContributionSubmit} className="p-5 space-y-4 text-xs">
                <div className="flex flex-col space-y-1">
                  <label className="text-[9px] font-bold text-text-muted uppercase tracking-wider">Select Partner Account</label>
                  <select
                    value={selectedPartnerId}
                    onChange={(e) => setSelectedPartnerId(e.target.value)}
                    className="bg-bg-app border border-border-custom rounded px-2.5 py-1.5 text-xs text-text-main font-semibold focus:outline-none focus:border-primary-gold"
                    required
                  >
                    {partners.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.id})</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col space-y-1">
                    <label className="text-[9px] font-bold text-text-muted uppercase tracking-wider">Gold Weight (g)</label>
                    <input 
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={inputAmount}
                      onChange={(e) => setInputAmount(e.target.value)}
                      className="bg-bg-app border border-border-custom rounded px-2.5 py-1.5 text-xs text-text-main font-semibold focus:outline-none focus:border-primary-gold placeholder-text-muted/60"
                      required
                    />
                  </div>

                  <div className="flex flex-col space-y-1">
                    <label className="text-[9px] font-bold text-text-muted uppercase tracking-wider">Voucher Ref ID</label>
                    <input 
                      type="text"
                      value={inputRef}
                      onChange={(e) => setInputRef(e.target.value)}
                      className="bg-bg-app border border-border-custom rounded px-2.5 py-1.5 text-xs text-text-main font-semibold focus:outline-none focus:border-primary-gold"
                      required
                    />
                  </div>
                </div>

                <div className="flex flex-col space-y-1">
                  <label className="text-[9px] font-bold text-text-muted uppercase tracking-wider">Particular / Description</label>
                  <input 
                    type="text"
                    value={inputParticular}
                    onChange={(e) => setInputParticular(e.target.value)}
                    className="bg-bg-app border border-border-custom rounded px-2.5 py-1.5 text-xs text-text-main font-semibold focus:outline-none focus:border-primary-gold"
                    required
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-border-custom">
                  <button 
                    type="button" 
                    onClick={() => setIsContributionOpen(false)}
                    className="px-4 py-2 border border-border-custom rounded font-bold text-text-muted hover:text-text-main bg-bg-app"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="px-4 py-2 bg-primary-gold hover:opacity-90 rounded font-bold text-white shadow-xs"
                  >
                    Submit Contribution
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* REDEEM CAPITAL DIALOG MODAL */}
        {isRedemptionOpen && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-sidebar-bg border border-border-custom rounded-md shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
              <div className="p-4 border-b border-border-custom bg-bg-app/40 flex justify-between items-center select-none">
                <span className="font-bold text-xs text-text-main">Log Equity Redemption</span>
                <button 
                  onClick={() => setIsRedemptionOpen(false)} 
                  className="p-1 hover:bg-bg-app rounded text-text-muted hover:text-text-main"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleRedemptionSubmit} className="p-5 space-y-4 text-xs">
                <div className="flex flex-col space-y-1">
                  <label className="text-[9px] font-bold text-text-muted uppercase tracking-wider">Select Partner Account</label>
                  <select
                    value={selectedPartnerId}
                    onChange={(e) => setSelectedPartnerId(e.target.value)}
                    className="bg-bg-app border border-border-custom rounded px-2.5 py-1.5 text-xs text-text-main font-semibold focus:outline-none focus:border-primary-gold"
                    required
                  >
                    {partners.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.id})</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col space-y-1">
                    <label className="text-[9px] font-bold text-text-muted uppercase tracking-wider">Redeem Weight (g)</label>
                    <input 
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={inputAmount}
                      onChange={(e) => setInputAmount(e.target.value)}
                      className="bg-bg-app border border-border-custom rounded px-2.5 py-1.5 text-xs text-text-main font-semibold focus:outline-none focus:border-primary-gold placeholder-text-muted/60"
                      required
                    />
                  </div>

                  <div className="flex flex-col space-y-1">
                    <label className="text-[9px] font-bold text-text-muted uppercase tracking-wider">Voucher Ref ID</label>
                    <input 
                      type="text"
                      value={inputRef}
                      onChange={(e) => setInputRef(e.target.value)}
                      className="bg-bg-app border border-border-custom rounded px-2.5 py-1.5 text-xs text-text-main font-semibold focus:outline-none focus:border-primary-gold"
                      required
                    />
                  </div>
                </div>

                <div className="flex flex-col space-y-1">
                  <label className="text-[9px] font-bold text-text-muted uppercase tracking-wider">Particular / Description</label>
                  <input 
                    type="text"
                    value={inputParticular}
                    onChange={(e) => setInputParticular(e.target.value)}
                    className="bg-bg-app border border-border-custom rounded px-2.5 py-1.5 text-xs text-text-main font-semibold focus:outline-none focus:border-primary-gold"
                    required
                  />
                </div>

                {/* Balance Summary Panel */}
                <div className="bg-bg-app border border-border-custom p-3 rounded flex justify-between items-center select-none font-sans">
                  <div>
                    <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider block">Current Partner Balance</span>
                    <span className="text-xs font-bold text-text-main block mt-0.5">{currentPartner ? currentPartner.capitalBalance.toFixed(2) : 0} g</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider block">Remaining Balance</span>
                    <span className="text-xs font-bold text-text-main block mt-0.5">
                      {currentPartner ? Math.max(0, currentPartner.capitalBalance - (parseFloat(inputAmount) || 0)).toFixed(2) : 0} g
                    </span>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-border-custom">
                  <button 
                    type="button" 
                    onClick={() => setIsRedemptionOpen(false)}
                    className="px-4 py-2 border border-border-custom rounded font-bold text-text-muted hover:text-text-main bg-bg-app"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="px-4 py-2 bg-primary-gold hover:opacity-90 rounded font-bold text-white shadow-xs"
                  >
                    Redeem Capital
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* REGISTER PARTNER DIALOG MODAL */}
        {isRegisterPartnerOpen && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-sidebar-bg border border-border-custom rounded-md shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
              <div className="p-4 border-b border-border-custom bg-bg-app/40 flex justify-between items-center select-none">
                <span className="font-bold text-xs text-text-main">Register Equity Partner</span>
                <button 
                  onClick={() => setIsRegisterPartnerOpen(false)} 
                  className="p-1 hover:bg-bg-app rounded text-text-muted hover:text-text-main"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleRegisterPartnerSubmit} className="p-5 space-y-4 text-xs">
                <div className="flex flex-col space-y-1">
                  <label className="text-[9px] font-bold text-text-muted uppercase tracking-wider">Partner Name / Entity</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Zurich Precious Metals Group"
                    value={newPartnerName}
                    onChange={(e) => setNewPartnerName(e.target.value)}
                    className="bg-bg-app border border-border-custom rounded px-2.5 py-1.5 text-xs text-text-main font-semibold focus:outline-none focus:border-primary-gold placeholder-text-muted/60"
                    required
                  />
                </div>

                <div className="flex flex-col space-y-1">
                  <label className="text-[9px] font-bold text-text-muted uppercase tracking-wider">Profit Share %</label>
                  <input 
                    type="number"
                    step="0.1"
                    placeholder="e.g. 25.0"
                    value={newPartnerProfitShare}
                    onChange={(e) => setNewPartnerProfitShare(e.target.value)}
                    className="bg-bg-app border border-border-custom rounded px-2.5 py-1.5 text-xs text-text-main font-semibold focus:outline-none focus:border-primary-gold placeholder-text-muted/60"
                    required
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-border-custom">
                  <button 
                    type="button" 
                    onClick={() => setIsRegisterPartnerOpen(false)}
                    className="px-4 py-2 border border-border-custom rounded font-bold text-text-muted hover:text-text-main bg-bg-app"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="px-4 py-2 bg-primary-gold hover:opacity-90 rounded font-bold text-white shadow-xs"
                  >
                    Register Partner
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </AppLayout>
  );
}
