'use client';

import React, { useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { useLedgerStore, Settlement } from '@/store/useLedgerStore';
import { 
  Scale, 
  ArrowUpRight, 
  ArrowDownLeft, 
  ShieldAlert, 
  CheckCircle2, 
  Layers,
  ArrowRight,
  TrendingUp,
  FileText
} from 'lucide-react';

export default function SettlementCenter() {
  const { settlements, customers, goldRate, addAuditLog } = useLedgerStore();
  const [activeSettlements, setActiveSettlements] = useState<Settlement[]>(settlements);

  // Compute stats
  const pendingSettlements = activeSettlements.filter(s => s.status === 'Pending');
  const completedSettlements = activeSettlements.filter(s => s.status === 'Completed');

  const totalReceivables = customers.reduce((sum, c) => c.balanceGold > 0 ? sum + c.balanceGold : sum, 0);
  const totalPayables = customers.reduce((sum, c) => c.balanceGold < 0 ? sum + Math.abs(c.balanceGold) : sum, 0);
  const netPosition = totalReceivables - totalPayables;

  // Handle Authorizing Settlement Netting
  const handleApproveSettlement = (id: string) => {
    setActiveSettlements(prev => prev.map(s => {
      if (s.id === id) {
        addAuditLog('Compliance Manager', 'Settlement Authorized', `Cleared netting offsets for ${s.customerName}: ${Math.abs(s.netWeight)}g value.`);
        return { ...s, status: 'Completed' };
      }
      return s;
    }));
    alert(`Settlement ${id} authorized and committed to blockchain auditing ledger.`);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Title */}
        <div>
          <h1 className="text-xl font-bold tracking-tight text-text-main">Settlement Netting Center</h1>
          <p className="text-xs text-text-muted mt-1">Net outstanding receivables and payables automatically to reduce liquidity risks.</p>
        </div>

        {/* Global Net Gold Position Widgets */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-card-bg border border-border-custom p-4 rounded shadow-sm">
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block">Net Receivables Exposure</span>
            <span className="text-lg font-bold text-text-main block mt-1">+{totalReceivables.toFixed(2)} g</span>
            <span className="text-[10px] text-text-muted block mt-0.5">${(totalReceivables * goldRate).toLocaleString(undefined, { maximumFractionDigits: 0 })} USD</span>
          </div>

          <div className="bg-card-bg border border-border-custom p-4 rounded shadow-sm">
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block">Net Payables Exposure</span>
            <span className="text-lg font-bold text-danger-custom block mt-1">-{totalPayables.toFixed(2)} g</span>
            <span className="text-[10px] text-text-muted block mt-0.5">${(totalPayables * goldRate).toLocaleString(undefined, { maximumFractionDigits: 0 })} USD</span>
          </div>

          <div className="bg-card-bg border border-border-custom p-4 rounded shadow-sm hover:border-primary-gold/40 transition-colors">
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block">Global Net Balance Position</span>
            <span className={`text-lg font-bold block mt-1 ${netPosition >= 0 ? 'text-success-custom' : 'text-danger-custom'}`}>
              {netPosition >= 0 ? '+' : ''}{netPosition.toFixed(2)} g
            </span>
            <span className="text-[10px] text-text-muted block mt-0.5">${(netPosition * goldRate).toLocaleString(undefined, { maximumFractionDigits: 0 })} USD equivalent</span>
          </div>
        </div>

        {/* Main Content Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: Suggested Settlements List */}
          <div className="lg:col-span-8 space-y-4">
            <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider">Automated Netting Proposals</h3>
            
            {pendingSettlements.length > 0 ? (
              <div className="space-y-4">
                {pendingSettlements.map((set) => (
                  <div key={set.id} className="bg-card-bg border border-border-custom p-5 rounded-md shadow-sm hover:border-primary-gold/40 transition-all space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-0.5">
                        <span className="text-[9px] font-bold bg-bg-app px-2 py-0.5 rounded border border-border-custom text-text-muted">{set.id}</span>
                        <h4 className="text-sm font-semibold text-text-main mt-1.5">{set.customerName}</h4>
                      </div>
                      <div className="text-right">
                        <span className={`text-xs font-bold block ${set.netWeight >= 0 ? 'text-text-main' : 'text-danger-custom'}`}>
                          {set.netWeight >= 0 ? `+${set.netWeight}` : `${set.netWeight}`} g
                        </span>
                        <span className="text-[10px] text-text-muted mt-0.5 block">${set.cashValue.toLocaleString()} USD</span>
                      </div>
                    </div>

                    <div className="border border-border-custom bg-bg-app/40 p-3 rounded text-xs flex justify-between items-center text-text-muted font-medium">
                      <span className="flex items-center gap-1.5 truncate max-w-[80%]">
                        <Layers className="w-3.5 h-3.5 text-primary-gold flex-shrink-0" />
                        <span>Proposal: {set.suggestedAction}</span>
                      </span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                        set.riskScore === 'High' ? 'bg-danger-custom/10 text-danger-custom' :
                        set.riskScore === 'Medium' ? 'bg-warning-custom/10 text-warning-custom' :
                        'bg-success-custom/10 text-success-custom'
                      }`}>{set.riskScore} Risk</span>
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t border-border-custom/50">
                      <button 
                        onClick={() => alert('Proposal rejected')}
                        className="px-3 py-1.5 border border-border-custom bg-sidebar-bg rounded text-xs font-bold text-text-muted hover:text-text-main transition-colors"
                      >
                        Bypass
                      </button>
                      <button 
                        onClick={() => handleApproveSettlement(set.id)}
                        className="px-3 py-1.5 bg-primary-gold text-white font-bold rounded text-xs flex items-center space-x-1 hover:opacity-90 transition-opacity"
                      >
                        <span>Authorize Netting</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center p-8 border border-dashed border-border-custom bg-card-bg rounded text-xs text-text-muted font-medium">
                No active settlement proposals. All balances are fully reconciled.
              </div>
            )}
          </div>

          {/* Right Panel: Risk Accounts and Audits */}
          <div className="lg:col-span-4 space-y-6">
            {/* Risk Profiles */}
            <div className="bg-card-bg border border-border-custom rounded-md p-5 shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-warning-custom" />
                Risk Exposure Accounts
              </h3>
              
              <div className="space-y-3">
                {customers.filter(c => c.status === 'risk').map(c => (
                  <div key={c.id} className="border border-border-custom rounded p-3 text-xs bg-bg-app/40 space-y-1.5 hover:border-warning-custom/40 transition-colors">
                    <div className="flex justify-between font-medium">
                      <span className="text-text-main font-semibold">{c.name}</span>
                      <span className="text-warning-custom font-bold">Flagged CRM</span>
                    </div>
                    <div className="flex justify-between text-text-muted">
                      <span>Gold Balance:</span>
                      <span className="font-semibold">{c.balanceGold.toFixed(2)} g</span>
                    </div>
                    <div className="flex justify-between text-text-muted">
                      <span>Credit Capacity:</span>
                      <span className="font-semibold">90% Utilization</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Completed Settlements Feed */}
            <div className="bg-card-bg border border-border-custom rounded-md p-5 shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-success-custom" />
                Settlement Archives
              </h3>

              <div className="space-y-3.5 max-h-[220px] overflow-y-auto pr-1 scrollbar-thin">
                {completedSettlements.map((set) => (
                  <div key={set.id} className="text-xs border-b border-border-custom/50 last:border-0 pb-2.5">
                    <div className="flex justify-between items-start font-medium">
                      <span className="text-text-main font-semibold">{set.customerName}</span>
                      <span className="text-success-custom font-bold">Settled</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-text-muted mt-1 font-medium">
                      <span>Net fine weight: {Math.abs(set.netWeight)}g</span>
                      <span>ID: {set.id}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
