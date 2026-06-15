'use client';

import React, { useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { useLedgerStore, Customer, Transaction } from '@/store/useLedgerStore';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Filter, 
  Plus, 
  Mail, 
  Phone, 
  Building,
  User,
  ArrowUpRight, 
  ArrowDownLeft, 
  History, 
  FileSpreadsheet,
  Download,
  Printer,
  ChevronRight,
  X,
  CreditCard,
  Scale
} from 'lucide-react';

export default function CustomersPage() {
  const { customers, transactions, goldRate } = useLedgerStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'risk' | 'inactive'>('all');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [drawerTab, setDrawerTab] = useState<'history' | 'summary' | 'statement'>('history');

  // Filtered customers
  const filteredCustomers = customers.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          c.company.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const activeCustomer = customers.find(c => c.id === selectedCustomerId);
  
  // Find transactions for active customer
  const customerTxs = transactions.filter(t => t.customerId === selectedCustomerId);

  // Statement computations
  const totalCredits = customerTxs.reduce((sum, t) => sum + (t.credit || 0), 0);
  const totalDebits = customerTxs.reduce((sum, t) => sum + (t.debit || 0), 0);
  const netEnding = (activeCustomer?.balanceGold || 0);

  return (
    <AppLayout>
      <div className="space-y-6 relative h-full">
        {/* Title and Button Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-text-main">Customer CRM Directory</h1>
            <p className="text-xs text-text-muted mt-1">Manage partner accounts, credit configurations, and statement reconciliation.</p>
          </div>
          <button 
            onClick={() => alert('New Customer Registration Mockup')}
            className="flex items-center space-x-1 px-3 py-2 text-xs font-bold text-white bg-primary-gold hover:opacity-90 rounded shadow-sm transition-opacity"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Customer</span>
          </button>
        </div>

        {/* Search and Filter Row */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-card-bg border border-border-custom p-4 rounded-md shadow-sm">
          {/* Search bar */}
          <div className="relative w-full sm:w-80">
            <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-text-muted" />
            </span>
            <input 
              type="text" 
              placeholder="Search customers name or company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 bg-bg-app text-xs border border-border-custom rounded-md text-text-main focus:outline-none focus:border-primary-gold transition-colors font-medium placeholder-text-muted"
            />
          </div>

          {/* Tab Filter buttons */}
          <div className="flex space-x-1.5 border border-border-custom bg-bg-app p-1 rounded">
            {(['all', 'active', 'risk', 'inactive'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1 rounded text-xs font-bold uppercase tracking-wider transition-colors ${
                  statusFilter === status 
                    ? 'bg-sidebar-bg text-text-main shadow-sm' 
                    : 'text-text-muted hover:text-text-main'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Directory Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredCustomers.map((c) => {
            const isOwed = c.balanceGold > 0;
            return (
              <div 
                key={c.id} 
                className="bg-card-bg border border-border-custom rounded-md shadow-sm hover:border-primary-gold/40 transition-all cursor-pointer p-5 flex flex-col justify-between"
                onClick={() => { setSelectedCustomerId(c.id); setDrawerTab('history'); }}
              >
                <div>
                  {/* Card Header */}
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-sm font-semibold text-text-main hover:text-primary-gold transition-colors">{c.name}</h3>
                      <p className="text-[11px] text-text-muted mt-0.5">{c.company}</p>
                    </div>
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                      c.status === 'active' ? 'bg-success-custom/10 text-success-custom' :
                      c.status === 'risk' ? 'bg-warning-custom/10 text-warning-custom' :
                      'bg-text-muted/10 text-text-muted'
                    }`}>
                      {c.status}
                    </span>
                  </div>

                  {/* Customer Tags */}
                  <div className="flex flex-wrap gap-1 mt-3">
                    {c.tags.map(tag => (
                      <span key={tag} className="text-[9px] font-bold bg-bg-app px-2 py-0.5 rounded text-text-muted border border-border-custom/80">{tag}</span>
                    ))}
                  </div>
                </div>

                {/* Ledger balances summary */}
                <div className="mt-6 pt-4 border-t border-border-custom/50 flex justify-between items-end">
                  <div>
                    <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider block">Net Gold Account</span>
                    <span className={`text-base font-bold block mt-0.5 ${c.balanceGold >= 0 ? 'text-text-main' : 'text-danger-custom'}`}>
                      {c.balanceGold.toFixed(2)} g
                    </span>
                    <span className="text-[10px] text-text-muted block mt-0.5">
                      ${(Math.abs(c.balanceGold) * goldRate).toLocaleString(undefined, { maximumFractionDigits: 0 })} USD
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-text-muted" />
                </div>
              </div>
            );
          })}
        </div>

        {/* CRM Slide-Over Drawer Container */}
        <AnimatePresence>
          {selectedCustomerId && activeCustomer && (
            <>
              {/* Backdrop */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.3 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black z-40"
                onClick={() => setSelectedCustomerId(null)}
              />

              {/* Slide-over drawer */}
              <motion.div 
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed top-0 bottom-0 right-0 w-full sm:w-[500px] bg-sidebar-bg border-l border-border-custom z-50 shadow-2xl flex flex-col"
              >
                {/* Drawer Header */}
                <div className="p-6 border-b border-border-custom flex items-start justify-between bg-bg-app/40">
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-primary-gold uppercase tracking-wider block">Customer Profile</span>
                    <h2 className="text-base font-bold text-text-main">{activeCustomer.name}</h2>
                    <p className="text-xs text-text-muted">{activeCustomer.company}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {activeCustomer.tags.map(t => (
                        <span key={t} className="text-[9px] font-bold bg-bg-app px-2 py-0.5 rounded text-text-muted border border-border-custom/80">{t}</span>
                      ))}
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelectedCustomerId(null)}
                    className="p-1.5 rounded-md hover:bg-bg-app text-text-muted hover:text-text-main transition-colors"
                  >
                    <X className="w-4.5 h-4.5" />
                  </button>
                </div>

                {/* Balance Cards Summary inside drawer */}
                <div className="p-6 grid grid-cols-2 gap-4 border-b border-border-custom bg-bg-app/20">
                  <div className="bg-card-bg border border-border-custom p-4 rounded-md">
                    <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider block">Net Gold Position</span>
                    <span className={`text-lg font-bold block mt-1 ${activeCustomer.balanceGold >= 0 ? 'text-text-main' : 'text-danger-custom'}`}>
                      {activeCustomer.balanceGold.toFixed(2)} g
                    </span>
                    <span className="text-[10px] text-text-muted block mt-0.5">
                      ${(activeCustomer.balanceGold * goldRate).toLocaleString(undefined, { maximumFractionDigits: 0 })} USD
                    </span>
                  </div>
                  <div className="bg-card-bg border border-border-custom p-4 rounded-md">
                    <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider block">Cash Ledger</span>
                    <span className="text-lg font-bold block mt-1 text-text-main">
                      ${(activeCustomer.receivableCash - activeCustomer.payableCash).toLocaleString()}
                    </span>
                    <span className="text-[10px] text-text-muted block mt-0.5">
                      Receivable: ${activeCustomer.receivableCash.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Tabs selection */}
                <div className="flex border-b border-border-custom px-3">
                  <button
                    onClick={() => setDrawerTab('history')}
                    className={`px-4 py-3 text-[11px] font-bold uppercase tracking-wider border-b-2 transition-all ${
                      drawerTab === 'history' 
                        ? 'border-primary-gold text-text-main' 
                        : 'border-transparent text-text-muted hover:text-text-main'
                    }`}
                  >
                    Voucher History
                  </button>
                  <button
                    onClick={() => setDrawerTab('summary')}
                    className={`px-4 py-3 text-[11px] font-bold uppercase tracking-wider border-b-2 transition-all ${
                      drawerTab === 'summary' 
                        ? 'border-primary-gold text-text-main' 
                        : 'border-transparent text-text-muted hover:text-text-main'
                    }`}
                  >
                    Profile Details
                  </button>
                  <button
                    onClick={() => setDrawerTab('statement')}
                    className={`px-4 py-3 text-[11px] font-bold uppercase tracking-wider border-b-2 transition-all ${
                      drawerTab === 'statement' 
                        ? 'border-primary-gold text-text-main' 
                        : 'border-transparent text-text-muted hover:text-text-main'
                    }`}
                  >
                    Statement Generator
                  </button>
                </div>

                {/* Drawer tab viewport */}
                <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
                  {drawerTab === 'history' && (
                    <div className="space-y-4">
                      <h4 className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2">Recent Gold Postings</h4>
                      {customerTxs.length > 0 ? (
                        <div className="space-y-3">
                          {customerTxs.map((tx) => (
                            <div key={tx.id} className="border border-border-custom rounded-md p-3.5 hover:border-primary-gold/45 transition-colors">
                              <div className="flex justify-between items-start">
                                <div className="space-y-0.5">
                                  <span className="text-[10px] text-text-muted font-bold block">{new Date(tx.date).toLocaleDateString()}</span>
                                  <span className="text-xs font-semibold text-text-main">{tx.type} ({tx.purity})</span>
                                </div>
                                <span className={`text-xs font-bold ${tx.credit > 0 ? 'text-success-custom' : 'text-text-main'}`}>
                                  {tx.credit > 0 ? `+${tx.credit}g` : `-${tx.debit}g`}
                                </span>
                              </div>
                              <p className="text-[11px] text-text-muted mt-2">{tx.notes}</p>
                              <div className="flex justify-between items-center text-[10px] text-text-muted mt-2.5 pt-2 border-t border-border-custom/40">
                                <span>Ref: {tx.reference}</span>
                                <span className="font-mono bg-bg-app px-1.5 py-0.5 rounded border">{tx.invoiceNo}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center p-8 border border-dashed border-border-custom bg-bg-app/40 rounded text-xs text-text-muted font-medium">
                          No transactions found on this account.
                        </div>
                      )}
                    </div>
                  )}

                  {drawerTab === 'summary' && (
                    <div className="space-y-6 text-xs text-text-main">
                      <div>
                        <h4 className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2.5">Contact Particulars</h4>
                        <div className="bg-bg-app border border-border-custom rounded-md divide-y divide-border-custom">
                          <div className="p-3 flex items-center justify-between">
                            <span className="text-text-muted flex items-center font-medium"><Mail className="w-3.5 h-3.5 mr-2 text-text-muted" /> Email</span>
                            <span className="font-semibold">{activeCustomer.email}</span>
                          </div>
                          <div className="p-3 flex items-center justify-between">
                            <span className="text-text-muted flex items-center font-medium"><Phone className="w-3.5 h-3.5 mr-2 text-text-muted" /> Phone</span>
                            <span className="font-semibold">{activeCustomer.phone}</span>
                          </div>
                          <div className="p-3 flex items-center justify-between">
                            <span className="text-text-muted flex items-center font-medium"><Building className="w-3.5 h-3.5 mr-2 text-text-muted" /> Corporate Entity</span>
                            <span className="font-semibold">{activeCustomer.company}</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2.5">Treasury Guidelines</h4>
                        <div className="bg-bg-app border border-border-custom rounded-md p-4 space-y-3">
                          <div className="flex justify-between">
                            <span className="text-text-muted font-medium">Credit Limit Fine Gold</span>
                            <span className="font-semibold">2,500.00 g</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-text-muted font-medium">Settlement Terms</span>
                            <span className="font-semibold">Net-30 Physical Delivery</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-text-muted font-medium">Risk Profile</span>
                            <span className="font-bold uppercase text-primary-gold bg-primary-gold/10 px-1.5 py-0.5 rounded leading-none text-[10px]">{activeCustomer.status}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {drawerTab === 'statement' && (
                    <div className="space-y-6">
                      <h4 className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2">Statement Generator Preview</h4>
                      
                      {/* Statement Visual Template */}
                      <div className="border border-border-custom bg-sidebar-bg p-4 rounded-md shadow-sm space-y-4 text-xs font-mono">
                        <div className="flex justify-between items-start border-b border-border-custom pb-3">
                          <div>
                            <span className="font-bold text-text-main block">AURUMLEDGER PRO</span>
                            <span className="text-[10px] text-text-muted block mt-0.5">Treasury Dept, Zurich</span>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-text-main block">VOUCHER STATEMENT</span>
                            <span className="text-[10px] text-text-muted block mt-0.5">As of June 15, 2026</span>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex justify-between text-[11px]">
                            <span className="text-text-muted">Client Name:</span>
                            <span className="font-bold text-text-main">{activeCustomer.name}</span>
                          </div>
                          <div className="flex justify-between text-[11px]">
                            <span className="text-text-muted">Statement Period:</span>
                            <span className="text-text-main font-semibold">01-June-2026 to 15-June-2026</span>
                          </div>
                        </div>

                        <div className="border-y border-border-custom py-2.5 my-2 space-y-1.5">
                          <div className="flex justify-between text-[11px]">
                            <span className="text-text-muted">Inbound Gold Credits:</span>
                            <span className="text-success-custom font-bold">+{totalCredits.toFixed(2)} g</span>
                          </div>
                          <div className="flex justify-between text-[11px]">
                            <span className="text-text-muted">Outbound Gold Debits:</span>
                            <span className="text-text-main font-bold">-{totalDebits.toFixed(2)} g</span>
                          </div>
                        </div>

                        <div className="flex justify-between text-xs font-bold text-text-main pt-1.5">
                          <span>Ending Net Position:</span>
                          <span className={netEnding >= 0 ? 'text-text-main' : 'text-danger-custom'}>
                            {netEnding.toFixed(2)} g
                          </span>
                        </div>
                      </div>

                      {/* Export buttons */}
                      <div className="flex gap-3">
                        <button 
                          onClick={() => alert('PDF Statement download started')}
                          className="flex-1 flex items-center justify-center space-x-1.5 px-3 py-2 text-xs font-bold border border-border-custom rounded hover:border-primary-gold/50 bg-bg-app transition-colors"
                        >
                          <Printer className="w-3.5 h-3.5 text-text-muted" />
                          <span>Print / PDF</span>
                        </button>
                        <button 
                          onClick={() => alert('Excel statement CSV output')}
                          className="flex-1 flex items-center justify-center space-x-1.5 px-3 py-2 text-xs font-bold border border-border-custom rounded hover:border-primary-gold/50 bg-bg-app transition-colors"
                        >
                          <Download className="w-3.5 h-3.5 text-text-muted" />
                          <span>CSV / Excel</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </AppLayout>
  );
}
