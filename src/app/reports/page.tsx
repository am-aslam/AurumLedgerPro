'use client';

import React, { useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { useExcelLedgerStore, formatCurrency } from '@/store/useExcelLedgerStore';
import { exportToExcel, exportToCSV, exportToPDF } from '@/lib/exportUtils';
import { 
  Scale, 
  FileText, 
  Download, 
  Printer, 
  CheckCircle2, 
  FileSpreadsheet
} from 'lucide-react';

export default function ReportsPage() {
  const { accounts, partners, goldRate, selectedCurrency } = useExcelLedgerStore();
  const [reportType, setReportType] = useState('account');
  const [targetAccount, setTargetAccount] = useState(accounts[0]?.id || '');
  const [format, setFormat] = useState('pdf');
  const [generated, setGenerated] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      const acc = accounts.find(a => a.id === targetAccount) || accounts[0];
      setGenerated({
        id: `STMT-${Math.floor(10000 + Math.random() * 90000)}`,
        date: new Date().toLocaleDateString(),
        accountName: acc.name,
        balance: acc.currentBalance,
        transactionsCount: acc.ledger.length
      });
    }, 600);
  };

  const triggerDownload = (downloadFormat: string) => {
    if (!generated) return;
    
    // For Account Statement Report Type
    if (reportType === 'account') {
      const acc = accounts.find(a => a.id === targetAccount) || accounts[0];
      const filename = `account_statement_${acc.name.replace(/\s+/g, '_')}_${generated.id}`;
      
      const exportData = acc.ledger.map(row => ({
        'Date': row.date,
        'Particular': row.particular,
        'Gross Weight (g)': row.grossWeight,
        'Stone Weight (g)': row.stoneWeight,
        'Net Weight (g)': row.netWeight,
        'Touch %': row.touch,
        'Debit (g)': row.debit,
        'Credit (g)': row.credit,
        'Balance (g)': row.balance,
        'Notes': row.notes || ''
      }));

      if (downloadFormat === 'xlsx') {
        exportToExcel(exportData, filename, 'Statement');
      } else if (downloadFormat === 'csv') {
        exportToCSV(exportData, filename);
      } else if (downloadFormat === 'pdf') {
        exportToPDF(
          `Statement of Account - ${acc.name}`,
          ['Date', 'Particular', 'Gross (g)', 'Stone (g)', 'Net (g)', 'Touch', 'Debit (g)', 'Credit (g)', 'Balance (g)', 'Notes'],
          ['Date', 'Particular', 'Gross Weight (g)', 'Stone Weight (g)', 'Net Weight (g)', 'Touch %', 'Debit (g)', 'Credit (g)', 'Balance (g)', 'Notes'],
          exportData,
          ['left', 'left', 'right', 'right', 'right', 'center', 'right', 'right', 'right', 'left']
        );
      }
    }
    // For Overall Balances Checklist Report Type
    else if (reportType === 'balance') {
      const filename = `balances_checklist_${generated.id}`;
      const exportData = accounts.map(acc => ({
        'Account Name': acc.name,
        'Fineness Balance (g)': acc.currentBalance,
        [`Valuation (${selectedCurrency})`]: formatCurrency(acc.currentBalance, goldRate, selectedCurrency),
        'Status': acc.status,
        'Last Transaction Date': acc.lastUpdated || 'N/A'
      }));

      if (downloadFormat === 'xlsx') {
        exportToExcel(exportData, filename, 'Balances');
      } else if (downloadFormat === 'csv') {
        exportToCSV(exportData, filename);
      } else if (downloadFormat === 'pdf') {
        exportToPDF(
          `Corporate Client Balances Checklist`,
          ['Account Name', 'Fineness Balance (g)', `Valuation (${selectedCurrency})`, 'Status', 'Last Updated'],
          ['Account Name', 'Fineness Balance (g)', `Valuation (${selectedCurrency})`, 'Status', 'Last Transaction Date'],
          exportData,
          ['left', 'right', 'right', 'center', 'left']
        );
      }
    }
    // For Partner Equity Report Type
    else if (reportType === 'partner') {
      const filename = `partner_equity_report_${generated.id}`;
      const exportData = partners.map(p => ({
        'Partner Name': p.name,
        'Stake (g)': p.capitalBalance,
        'Share %': `${p.profitShare}%`,
        [`Valuation (${selectedCurrency})`]: formatCurrency(p.capitalBalance, goldRate, selectedCurrency)
      }));

      if (downloadFormat === 'xlsx') {
        exportToExcel(exportData, filename, 'Equity');
      } else if (downloadFormat === 'csv') {
        exportToCSV(exportData, filename);
      } else if (downloadFormat === 'pdf') {
        exportToPDF(
          `Vault Partner Equity Report`,
          ['Partner Name', 'Stake (g)', 'Share %', `Valuation (${selectedCurrency})`],
          ['Partner Name', 'Stake (g)', 'Share %', `Valuation (${selectedCurrency})`],
          exportData,
          ['left', 'right', 'center', 'right']
        );
      }
    }
    // For Monthly Throughput Report Type
    else {
      const filename = `throughput_report_${generated.id}`;
      const allRows = accounts.flatMap(acc => acc.ledger.map(row => ({
        'Account Name': acc.name,
        'Date': row.date,
        'Particular': row.particular,
        'Gross (g)': row.grossWeight,
        'Stone (g)': row.stoneWeight,
        'Net (g)': row.netWeight,
        'Touch': row.touch,
        'Debit (g)': row.debit,
        'Credit (g)': row.credit,
        'Running Balance': row.balance
      })));

      if (downloadFormat === 'xlsx') {
        exportToExcel(allRows, filename, 'Throughput');
      } else if (downloadFormat === 'csv') {
        exportToCSV(allRows, filename);
      } else if (downloadFormat === 'pdf') {
        exportToPDF(
          `Monthly Throughput and Transferee Ledger`,
          ['Account Name', 'Date', 'Particular', 'Gross (g)', 'Stone (g)', 'Net (g)', 'Touch', 'Debit (g)', 'Credit (g)', 'Balance'],
          ['Account Name', 'Date', 'Particular', 'Gross (g)', 'Stone (g)', 'Net (g)', 'Touch', 'Debit (g)', 'Credit (g)', 'Running Balance'],
          allRows,
          ['left', 'left', 'left', 'right', 'right', 'right', 'center', 'right', 'right', 'right']
        );
      }
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Title */}
        <div>
          <h1 className="text-xl font-bold tracking-tight text-text-main">Audit Reports</h1>
          <p className="text-xs text-text-muted mt-1">Export statements, balance checklists, and profit sharing summaries.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          {/* Settings Form */}
          <form onSubmit={handleGenerate} className="md:col-span-5 bg-card-bg border border-border-custom p-5 rounded-md shadow-sm space-y-4 text-xs font-semibold">
            <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider border-b pb-2 mb-2">Report Setup</h3>

            <div className="flex flex-col space-y-1">
              <label className="text-[9px] font-bold text-text-muted uppercase tracking-wider">Report Type</label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="bg-bg-app border border-border-custom rounded px-2.5 py-1.5 text-xs text-text-main font-semibold focus:outline-none focus:border-primary-gold"
              >
                <option value="account">Account Statement</option>
                <option value="balance">Overall Balances Checklist</option>
                <option value="partner">Partner Equity Report</option>
                <option value="monthly">Monthly Throughput Report</option>
              </select>
            </div>

            {reportType === 'account' && (
              <div className="flex flex-col space-y-1">
                <label className="text-[9px] font-bold text-text-muted uppercase tracking-wider">Target Account</label>
                <select
                  value={targetAccount}
                  onChange={(e) => setTargetAccount(e.target.value)}
                  className="bg-bg-app border border-border-custom rounded px-2.5 py-1.5 text-xs text-text-main font-semibold focus:outline-none focus:border-primary-gold"
                >
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex flex-col space-y-1">
              <label className="text-[9px] font-bold text-text-muted uppercase tracking-wider">Output File Format</label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => setFormat('pdf')}
                  className={`py-2 border rounded font-bold transition-all ${
                    format === 'pdf' ? 'border-primary-gold bg-primary-gold/10 text-text-main' : 'border-border-custom bg-bg-app text-text-muted'
                  }`}
                >
                  Adobe PDF (.pdf)
                </button>
                <button
                  type="button"
                  onClick={() => setFormat('xlsx')}
                  className={`py-2 border rounded font-bold transition-all ${
                    format === 'xlsx' ? 'border-primary-gold bg-primary-gold/10 text-text-main' : 'border-border-custom bg-bg-app text-text-muted'
                  }`}
                >
                  Excel Workbook (.xlsx)
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 bg-primary-gold hover:opacity-90 disabled:opacity-50 text-xs font-bold text-white rounded shadow-sm transition-opacity"
            >
              {loading ? 'Compiling...' : 'Generate Document'}
            </button>
          </form>

          {/* Preview Panel */}
          <div className="md:col-span-7 flex flex-col min-h-[300px]">
            {generated ? (
              <div className="bg-card-bg border border-border-custom rounded-md shadow-sm p-6 space-y-6 flex-1 flex flex-col justify-between animate-in zoom-in-95 duration-150">
                <div className="space-y-4 text-xs font-mono">
                  <div className="flex justify-between items-start border-b border-border-custom pb-3">
                    <div>
                      <span className="text-[9px] font-bold text-primary-gold uppercase tracking-wider block font-sans">Statement Preview</span>
                      <h4 className="text-sm font-semibold text-text-main mt-0.5">{generated.id}</h4>
                    </div>
                    <CheckCircle2 className="w-5 h-5 text-success-custom" />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-text-muted">Account Profile:</span>
                      <span className="font-bold text-text-main">{generated.accountName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-muted">Compile Date:</span>
                      <span className="text-text-main">{generated.date}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-muted">Vouchers Found:</span>
                      <span className="text-text-main">{generated.transactionsCount} entries</span>
                    </div>
                  </div>

                  <div className="border-t border-border-custom pt-3 mt-4 flex justify-between font-sans text-sm font-bold text-text-main">
                    <span>Reconciled Gold Balance:</span>
                    <div className="text-right">
                      <span className={generated.balance >= 0 ? 'text-text-main block' : 'text-danger-custom block'}>
                        {generated.balance.toFixed(2)} g
                      </span>
                      <span className="text-[10px] text-text-muted font-semibold block mt-0.5">
                        Value: {formatCurrency(generated.balance, goldRate, selectedCurrency)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 border-t border-border-custom/50 pt-4 mt-6">
                  <button
                    onClick={() => triggerDownload(format)}
                    className="flex-1 flex items-center justify-center space-x-1.5 px-3 py-2 text-xs font-bold border border-border-custom rounded hover:border-primary-gold/50 bg-bg-app transition-colors"
                  >
                    <Download className="w-3.5 h-3.5 text-text-muted" />
                    <span>Download {format.toUpperCase()}</span>
                  </button>
                  <button
                    onClick={() => triggerDownload('pdf')}
                    className="flex-1 flex items-center justify-center space-x-1.5 px-3 py-2 text-xs font-bold border border-border-custom rounded hover:border-primary-gold/50 bg-bg-app transition-colors"
                  >
                    <Printer className="w-3.5 h-3.5 text-text-muted" />
                    <span>Print Statement</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-card-bg border border-dashed border-border-custom rounded-md flex-1 flex flex-col items-center justify-center p-8 text-center text-xs text-text-muted font-bold">
                <FileText className="w-8 h-8 text-border-custom mb-2.5" />
                <span>Configure settings and click "Generate Document" to compile the statement.</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
