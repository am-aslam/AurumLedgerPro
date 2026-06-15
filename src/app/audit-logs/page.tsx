'use client';

import React, { useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { useLedgerStore } from '@/store/useLedgerStore';
import { 
  History, 
  Search, 
  ShieldCheck, 
  AlertOctagon, 
  User, 
  Clock 
} from 'lucide-react';

export default function AuditLogsPage() {
  const { auditLogs } = useLedgerStore();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredLogs = auditLogs.filter(log => 
    log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (log.details && log.details.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <AppLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Title */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-text-main">Compliance Audit Logs</h1>
            <p className="text-xs text-text-muted mt-1 font-medium">Immutable registry of treasury operations, system configurations, and voucher ingestions.</p>
          </div>
          <div className="flex items-center space-x-1.5 text-xs text-success-custom bg-success-custom/10 border border-success-custom/20 px-2.5 py-1 rounded font-bold">
            <ShieldCheck className="w-4 h-4" />
            <span>Audit Trail Validated</span>
          </div>
        </div>

        {/* Filter Input */}
        <div className="bg-card-bg border border-border-custom p-4 rounded-md shadow-sm">
          <div className="relative w-full">
            <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-text-muted" />
            </span>
            <input 
              type="text" 
              placeholder="Search audit trail for actions, compliance officers, or specific logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-bg-app text-xs border border-border-custom rounded-md text-text-main focus:outline-none focus:border-primary-gold transition-colors font-medium placeholder-text-muted"
            />
          </div>
        </div>

        {/* Audit Logs Table */}
        <div className="bg-card-bg border border-border-custom rounded-md shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-bg-app text-text-muted border-b border-border-custom text-[11px] font-bold uppercase tracking-wider">
                  <th className="p-4 pl-5">Timestamp</th>
                  <th className="p-4">Action</th>
                  <th className="p-4">User</th>
                  <th className="p-4 pr-5">Compliance Particulars</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-custom/50">
                {filteredLogs.length > 0 ? (
                  filteredLogs.map((log, idx) => (
                    <tr key={idx} className="hover:bg-bg-app/40">
                      <td className="p-4 pl-5 text-text-muted font-medium whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-text-muted" />
                          <span>{new Date(log.timestamp).toLocaleString()}</span>
                        </div>
                      </td>
                      <td className="p-4 font-bold text-text-main">
                        {log.action}
                      </td>
                      <td className="p-4 text-text-main font-semibold whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <div className="w-5 h-5 rounded-full bg-border-custom flex items-center justify-center">
                            <User className="w-3 h-3 text-text-muted" />
                          </div>
                          <span>{log.user}</span>
                        </div>
                      </td>
                      <td className="p-4 pr-5 text-text-muted leading-relaxed font-medium">
                        {log.details || 'System automated ledger reconciliation checks.'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-text-muted font-medium">
                      No compliance logs matched the current search scope.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
