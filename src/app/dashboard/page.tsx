'use client';

import React, { useEffect, useState, useMemo } from 'react';
import AppLayout from '@/components/AppLayout';
import { useExcelLedgerStore, formatCurrency } from '@/store/useExcelLedgerStore';
import { 
  TrendingUp, 
  Layers, 
  ArrowUpRight, 
  ArrowDownRight, 
  Activity, 
  Users, 
  ShieldCheck,
  FileSpreadsheet
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  BarChart, 
  Bar, 
  Cell,
  PieChart,
  Pie
} from 'recharts';

export default function Dashboard() {
  const { accounts, partners, goldRate, selectedCurrency } = useExcelLedgerStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Excel KPIs calculations
  const totalGoldBalance = accounts.reduce((sum, a) => sum + a.currentBalance, 0);
  const totalPositive = accounts.reduce((sum, a) => a.currentBalance > 0 ? sum + a.currentBalance : sum, 0);
  const totalNegative = accounts.reduce((sum, a) => a.currentBalance < 0 ? sum + Math.abs(a.currentBalance) : sum, 0);
  
  const activeAccountsCount = accounts.filter(a => a.status === 'Active').length;
  const totalTransactionsCount = accounts.reduce((sum, a) => sum + a.ledger.length, 0);
  const totalPartnerCapital = partners.reduce((sum, p) => sum + p.capitalBalance, 0);

  // Dynamic currency conversion multipliers
  const currencySymbol = selectedCurrency === 'INR' ? '₹' : selectedCurrency === 'AED' ? 'AED ' : selectedCurrency === 'EUR' ? '€' : '$';
  const currencyFactor = selectedCurrency === 'INR' ? 83.50 : selectedCurrency === 'AED' ? 3.67 : selectedCurrency === 'EUR' ? 0.92 : 1.0;

  // Extract dynamic monthly transaction volumes (grams) from live ledger rows
  const monthlyData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Initialize monthly aggregators
    const volumeMap: Record<string, number> = {};
    months.forEach(m => { volumeMap[m] = 0; });

    // Sum debit + credit gold weight of transactions for each month
    accounts.forEach(acc => {
      acc.ledger.forEach(row => {
        try {
          const dateObj = new Date(row.date);
          const monthName = months[dateObj.getMonth()];
          if (monthName) {
            volumeMap[monthName] += (row.debit + row.credit);
          }
        } catch (e) {
          // Ignore malformed date strings
        }
      });
    });

    return months.map(m => ({
      month: m,
      Volume: parseFloat(volumeMap[m].toFixed(2))
    }));
  }, [accounts]);

  // Count accounts created via Excel sheets ingestion dynamically
  const importedAccountsCount = useMemo(() => {
    return accounts.filter(a =>
      a.ledger.some(row => 
        row.notes?.toLowerCase().includes('excel ingest') || 
        row.auditHistory?.some(h => h.user.toLowerCase().includes('import'))
      )
    ).length;
  }, [accounts]);

  // Chart 2: Balance Distribution (Pie Chart of Positive accounts)
  const positiveAccounts = accounts.filter(a => a.currentBalance > 0);
  const distributionData = positiveAccounts.map(a => ({
    name: a.name,
    value: Math.round(a.currentBalance)
  }));
  const COLORS = ['#D4AF37', '#9CA3AF', '#4B5563', '#111827'];

  // Top Accounts by Balance magnitude
  const sortedAccounts = [...accounts].sort((a, b) => Math.abs(b.currentBalance) - Math.abs(a.currentBalance));

  // Flatten all ledger rows to find recent transactions
  const allTxs = accounts.flatMap(a => 
    a.ledger.map(row => ({
      ...row,
      accountName: a.name
    }))
  ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Title */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-text-main">Excel Dashboard Controller</h1>
            <p className="text-xs text-text-muted mt-1">Summary view of the gold trading ledger sheets converted into active database objects.</p>
          </div>
          <span className="text-[10px] font-bold text-success-custom bg-success-custom/10 border border-success-custom/25 px-2.5 py-1 rounded flex items-center gap-1 uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Vault Synced</span>
          </span>
        </div>

        {/* Excel metric cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Card 1: Total Gold Balance */}
          <div className="bg-card-bg border border-border-custom p-5 rounded shadow-sm hover:border-primary-gold/45 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider">Total Gold Balance</span>
              <Layers className="w-4 h-4 text-primary-gold" />
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-text-main">
                {totalGoldBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} g
              </span>
              <span className="text-xs block text-text-muted mt-1">
                Value: {formatCurrency(totalGoldBalance, goldRate, selectedCurrency)}
              </span>
            </div>
          </div>

          {/* Card 2: Total Positive Balances */}
          <div className="bg-card-bg border border-border-custom p-5 rounded shadow-sm hover:border-primary-gold/45 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider">Total Positive (Owed)</span>
              <ArrowUpRight className="w-4 h-4 text-success-custom" />
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-text-main">
                {totalPositive.toLocaleString(undefined, { minimumFractionDigits: 2 })} g
              </span>
              <span className="text-xs block text-text-muted mt-1 font-semibold text-success-custom">
                Assets: {formatCurrency(totalPositive, goldRate, selectedCurrency)}
              </span>
            </div>
          </div>

          {/* Card 3: Total Negative Balances */}
          <div className="bg-card-bg border border-border-custom p-5 rounded shadow-sm hover:border-primary-gold/45 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider">Total Negative (Payable)</span>
              <ArrowDownRight className="w-4 h-4 text-danger-custom" />
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-text-main">
                {totalNegative.toLocaleString(undefined, { minimumFractionDigits: 2 })} g
              </span>
              <span className="text-xs block text-text-muted mt-1 font-semibold text-danger-custom">
                Liabilities: {formatCurrency(totalNegative, goldRate, selectedCurrency)}
              </span>
            </div>
          </div>

          {/* Card 4: Multi-tenant Accounts Count */}
          <div className="bg-card-bg border border-border-custom p-5 rounded shadow-sm hover:border-primary-gold/45 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider">Active Ledgers</span>
              <Users className="w-4 h-4 text-text-muted" />
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-text-main">
                {activeAccountsCount} Accounts
              </span>
              <span className="text-xs block text-text-muted mt-1">
                Total Transaction Vouchers: {totalTransactionsCount}
              </span>
            </div>
          </div>

        </div>

        {/* Secondary KPI Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-card-bg border border-border-custom p-4 rounded flex items-center justify-between shadow-sm">
            <div>
              <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block">Partner Capital Managed</span>
              <div className="flex items-baseline space-x-1.5 mt-1">
                <span className="text-sm font-bold text-text-main">{totalPartnerCapital.toFixed(2)} g</span>
                <span className="text-[10px] text-text-muted font-medium">({formatCurrency(totalPartnerCapital, goldRate, selectedCurrency)})</span>
              </div>
            </div>
            <div className="text-[10px] text-text-muted font-semibold bg-bg-app border px-2 py-1 rounded">{partners.length} {partners.length === 1 ? 'Partner' : 'Partners'}</div>
          </div>

          <div className="bg-card-bg border border-border-custom p-4 rounded flex items-center justify-between shadow-sm">
            <div>
              <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block">Recent Excel Imports</span>
              <span className="text-base font-bold text-text-main block mt-1">{importedAccountsCount} Sheets Ingested</span>
            </div>
            <FileSpreadsheet className="w-4 h-4 text-text-muted" />
          </div>
        </div>

        {/* Recharts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chart 1: Monthly Transactions (BarChart) */}
          <div className="lg:col-span-2 bg-card-bg border border-border-custom p-5 rounded shadow-sm h-[320px] flex flex-col">
            <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-4">Monthly Transaction Volumes (Grams)</h3>
            <div className="flex-1 min-h-0">
              {mounted ? (
                accounts.length > 0 && totalTransactionsCount > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <XAxis dataKey="month" stroke="#9CA3AF" fontSize={10} tickLine={false} />
                      <YAxis stroke="#9CA3AF" fontSize={10} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: 'var(--sidebar)', borderColor: 'var(--border)', fontSize: '11px', color: 'var(--text-main)' }} />
                      <Bar dataKey="Volume" fill="#D4AF37" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-text-muted font-bold text-center">
                    No transactions posted in ledger sheets.
                  </div>
                )
              ) : (
                <div className="w-full h-full bg-border-custom/20 animate-pulse rounded" />
              )}
            </div>
          </div>

          {/* Chart 2: Balance Distribution (Pie) */}
          <div className="bg-card-bg border border-border-custom p-5 rounded shadow-sm h-[320px] flex flex-col justify-between">
            <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider">Asset Balance Share</h3>
            <div className="flex-1 min-h-0 flex items-center justify-center relative">
              {mounted ? (
                distributionData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={distributionData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {distributionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: 'var(--sidebar)', borderColor: 'var(--border)', fontSize: '11px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-xs text-text-muted font-bold text-center px-4 leading-relaxed">
                    No active asset balances to distribute.
                  </div>
                )
              ) : (
                <div className="w-32 h-32 rounded-full border-4 border-t-transparent border-primary-gold/30 animate-spin" />
              )}
              {distributionData.length > 0 && (
                <div className="absolute flex flex-col items-center">
                  <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Fine Gold</span>
                  <span className="text-xs font-bold text-text-main">Shares</span>
                </div>
              )}
            </div>
            <div className="space-y-1 mt-2">
              {distributionData.slice(0, 3).map((item, idx) => (
                <div key={item.name} className="flex justify-between items-center text-[10px] font-semibold">
                  <div className="flex items-center space-x-1.5 min-w-0">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                    <span className="text-text-muted truncate">{item.name}</span>
                  </div>
                  <span className="text-text-main">{item.value}g</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Lists: Top Accounts & Activity */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Top Accounts */}
          <div className="bg-card-bg border border-border-custom p-5 rounded shadow-sm flex flex-col h-[280px]">
            <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-4">Top Accounts Balance Summary</h3>
            <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 scrollbar-thin">
              {sortedAccounts.length > 0 ? (
                sortedAccounts.map(acc => {
                  const percentage = Math.min(Math.round((Math.abs(acc.currentBalance) / 1500) * 100), 100);
                  return (
                    <div key={acc.id} className="text-xs space-y-1">
                      <div className="flex justify-between font-semibold">
                        <span className="text-text-main">{acc.name}</span>
                        <span className={acc.currentBalance >= 0 ? 'text-text-main' : 'text-danger-custom'}>
                          {acc.currentBalance.toFixed(2)} g
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-bg-app rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${acc.currentBalance >= 0 ? 'bg-primary-gold' : 'bg-danger-custom'}`} 
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-xs text-text-muted font-bold text-center py-12">
                  No accounts registered yet.
                </div>
              )}
            </div>
          </div>

          {/* Recent Ledger Activity */}
          <div className="bg-card-bg border border-border-custom p-5 rounded shadow-sm flex flex-col h-[280px]">
            <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-4">Recent Ledger Postings</h3>
            <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin">
              {allTxs.length > 0 ? (
                allTxs.slice(0, 4).map((tx, idx) => (
                  <div key={idx} className="flex space-x-3 text-xs">
                    <div className="flex flex-col items-center">
                      <span className="w-2.5 h-2.5 rounded-full bg-primary-gold ring-4 ring-primary-gold/10 flex-shrink-0 mt-1"></span>
                      {idx < allTxs.slice(0, 4).length - 1 && <span className="w-[1px] h-full bg-border-custom mt-1.5" />}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-text-main truncate">{tx.accountName}</span>
                        <span className="text-[10px] text-text-muted bg-bg-app px-1.5 py-0.5 rounded border border-border-custom font-semibold">{tx.particular}</span>
                      </div>
                      <p className="text-[11px] text-text-muted truncate mt-0.5">{tx.notes || 'No description comments.'}</p>
                      <span className="text-[9px] text-text-muted block mt-0.5">{new Date(tx.date).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-xs text-text-muted font-bold text-center py-12">
                  No recent postings. Create vouchers to populate.
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </AppLayout>
  );
}
