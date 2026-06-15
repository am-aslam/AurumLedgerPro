'use client';

import React, { useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { useExcelLedgerStore } from '@/store/useExcelLedgerStore';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  UploadCloud, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  ChevronRight,
  Database,
  RefreshCw,
  FileText
} from 'lucide-react';

export default function ExcelImportPage() {
  const { importExcelData, accounts } = useExcelLedgerStore();
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState('');
  const [selectedSheet, setSelectedSheet] = useState('Al-Jazeera');
  const [importProgress, setImportProgress] = useState(0);

  // Mock parsed sheet workbook preview
  const sheets = ['Al-Jazeera', 'Nadir_Refinery', 'Valcambi_Trades'];

  const mockParsedData = [
    { Date: '2026-06-14', Particular: 'WT RCVD', Gross: '150.00', Stone: '0.00', Touch: '99.90', Ref: 'EXC-101' },
    { Date: '2026-06-15', Particular: 'Sale', Gross: '50.00', Stone: '0.00', Touch: '99.50', Ref: 'EXC-102' },
    { Date: '2026-06-15', Particular: 'WT RCVD', Gross: '600.00', Stone: '2.00', Touch: '99.90', Ref: 'EXC-103' }
  ];

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFileName(e.dataTransfer.files[0].name);
      setCurrentStep(2);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFileName(e.target.files[0].name);
      setCurrentStep(2);
    }
  };

  const triggerImport = () => {
    setCurrentStep(5);
    setImportProgress(0);

    const interval = setInterval(() => {
      setImportProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          
          // Map raw data rows to state store
          const mappedRows = mockParsedData.map(row => {
            const gross = parseFloat(row.Gross) || 0;
            const stone = parseFloat(row.Stone) || 0;
            return {
              date: row.Date,
              particular: row.Particular as any,
              grossWeight: gross,
              stoneWeight: stone,
              netWeight: gross - stone,
              touch: parseFloat(row.Touch) || 100,
              debit: 0,
              credit: 0,
              notes: `Excel Ingest ref: ${row.Ref}`
            };
          });

          // Commit to store
          importExcelData(selectedSheet === 'Al-Jazeera' ? 'Al-Jazeera Jewellers' : 'Refinery Imports', mappedRows);

          return 100;
        }
        return prev + 25;
      });
    }, 300);
  };

  const stepList = [
    { num: 1, label: 'Upload File' },
    { num: 2, label: 'Preview Sheets' },
    { num: 3, label: 'Select Sheets' },
    { num: 4, label: 'Review Data' },
    { num: 5, label: 'Import' }
  ];

  return (
    <AppLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Title */}
        <div>
          <h1 className="text-xl font-bold tracking-tight text-text-main">Excel Workbook Ingestor</h1>
          <p className="text-xs text-text-muted mt-1">Ingest legacy sheets directly. Review layout configurations, validate row weights, and commit.</p>
        </div>

        {/* Horizontal step indicators */}
        <div className="bg-card-bg border border-border-custom p-4 rounded-md shadow-sm flex justify-between items-center overflow-x-auto select-none">
          {stepList.map((step, idx) => (
            <React.Fragment key={step.num}>
              <div className="flex items-center space-x-2 flex-shrink-0">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  currentStep === step.num ? 'bg-primary-gold text-white' :
                  currentStep > step.num ? 'bg-success-custom/20 text-success-custom' :
                  'bg-bg-app border border-border-custom text-text-muted'
                }`}>
                  {currentStep > step.num ? '✓' : step.num}
                </div>
                <span className={`text-xs font-bold ${
                  currentStep === step.num ? 'text-text-main' : 'text-text-muted'
                }`}>{step.label}</span>
              </div>
              {idx < stepList.length - 1 && (
                <ChevronRight className="w-4 h-4 text-border-custom flex-shrink-0" />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Wizard Main Panel */}
        <div className="bg-card-bg border border-border-custom rounded-md shadow-sm overflow-hidden min-h-[360px] flex flex-col justify-between">
          <div className="p-6 flex-1 flex flex-col justify-center text-xs font-semibold">
            <AnimatePresence mode="wait">
              
              {/* Step 1: Upload */}
              {currentStep === 1 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6 text-center max-w-lg mx-auto py-8"
                >
                  <div 
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-lg p-10 flex flex-col items-center justify-center space-y-3 cursor-pointer transition-colors ${
                      dragActive ? 'border-primary-gold bg-primary-gold/5' : 'border-border-custom hover:border-primary-gold/50 bg-bg-app/40'
                    }`}
                  >
                    <UploadCloud className="w-10 h-10 text-text-muted" />
                    <div>
                      <span className="text-xs font-bold text-text-main block">Drag and drop your gold ledger workbook here</span>
                      <span className="text-[10px] text-text-muted mt-1 block">Supports .xlsx, .xls, and .csv files (max 10MB)</span>
                    </div>
                    <label className="px-3 py-1.5 bg-sidebar-bg border border-border-custom rounded hover:border-primary-gold/50 text-[11px] font-bold text-text-main cursor-pointer shadow-xs transition-colors">
                      Browse Files
                      <input type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={handleFileSelect} />
                    </label>
                  </div>
                </motion.div>
              )}

              {/* Step 2: Preview Sheets */}
              {currentStep === 2 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4"
                >
                  <div className="flex justify-between items-center border-b pb-3">
                    <span className="text-xs font-bold text-text-main flex items-center gap-1.5">
                      <FileSpreadsheet className="w-4 h-4 text-primary-gold" />
                      Ingested Workbook: {fileName || 'Precious_Metals_Q2.xlsx'}
                    </span>
                    <button onClick={() => { setFileName(''); setCurrentStep(1); }} className="text-danger-custom text-[10px] font-bold uppercase hover:underline">Remove</button>
                  </div>
                  
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block">Found Sheets:</span>
                    <div className="flex gap-2">
                      {sheets.map(s => (
                        <span key={s} className="bg-bg-app border border-border-custom px-3 py-1.5 rounded text-xs font-semibold text-text-main">{s}</span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 3: Select Sheets */}
              {currentStep === 3 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4 max-w-sm mx-auto"
                >
                  <span className="text-xs font-bold text-text-main block">Select Active Target Sheet to Ingest:</span>
                  <select
                    value={selectedSheet}
                    onChange={(e) => setSelectedSheet(e.target.value)}
                    className="bg-bg-app border border-border-custom rounded px-2.5 py-1.5 text-xs text-text-main font-semibold focus:outline-none focus:border-primary-gold w-full"
                  >
                    {sheets.map(s => (
                      <option key={s} value={s}>{s} Ledger Worksheet</option>
                    ))}
                  </select>
                </motion.div>
              )}

              {/* Step 4: Review Data */}
              {currentStep === 4 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4"
                >
                  <span className="text-xs font-bold text-text-main block border-b pb-2">Voucher Rows Validation Summary</span>
                  
                  <div className="grid grid-cols-4 gap-4">
                    <div className="bg-bg-app border border-border-custom p-3 rounded">
                      <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider block">Rows Scanned</span>
                      <span className="text-sm font-bold text-text-main mt-1 block">{mockParsedData.length} lines</span>
                    </div>
                    <div className="bg-bg-app border border-border-custom p-3 rounded">
                      <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider block">CRM Matches</span>
                      <span className="text-sm font-bold text-text-main mt-1 block">1 Account</span>
                    </div>
                    <div className="bg-bg-app border border-border-custom p-3 rounded">
                      <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider block">Errors</span>
                      <span className="text-sm font-bold text-success-custom mt-1 block">0 Issues</span>
                    </div>
                    <div className="bg-bg-app border border-border-custom p-3 rounded">
                      <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider block">Warnings</span>
                      <span className="text-sm font-bold text-text-main mt-1 block">0 Logs</span>
                    </div>
                  </div>

                  {/* Preview Table */}
                  <div className="border border-border-custom rounded overflow-x-auto mt-2">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-bg-app text-text-muted border-b border-border-custom text-[10px] font-bold uppercase">
                          <th className="p-2">Date</th>
                          <th className="p-2">Particular</th>
                          <th className="p-2 text-right">Gross (g)</th>
                          <th className="p-2 text-right">Stone (g)</th>
                          <th className="p-2 text-center">Touch %</th>
                          <th className="p-2">Ref</th>
                        </tr>
                      </thead>
                      <tbody>
                        {mockParsedData.map((row, idx) => (
                          <tr key={idx} className="border-b last:border-0 hover:bg-bg-app/30">
                            <td className="p-2 font-mono">{row.Date}</td>
                            <td className="p-2">{row.Particular}</td>
                            <td className="p-2 text-right">{row.Gross}</td>
                            <td className="p-2 text-right">{row.Stone}</td>
                            <td className="p-2 text-center font-mono">{row.Touch}%</td>
                            <td className="p-2 text-text-muted font-mono">{row.Ref}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              )}

              {/* Step 5: Ingesting success */}
              {currentStep === 5 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6 text-center max-w-sm mx-auto py-8"
                >
                  {importProgress < 100 ? (
                    <div className="space-y-4">
                      <RefreshCw className="w-8 h-8 text-primary-gold animate-spin mx-auto" />
                      <div>
                        <span className="text-xs font-bold text-text-main block">Commiting Ingestion Records...</span>
                        <span className="text-[10px] text-text-muted mt-1 block">Recalculating ledger rows running balances</span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4 animate-in zoom-in-95 duration-200">
                      <CheckCircle2 className="w-10 h-10 text-success-custom mx-auto" />
                      <div>
                        <span className="text-xs font-bold text-text-main block">Workbook Ingested Successfully!</span>
                        <span className="text-[10px] text-text-muted mt-1 block">
                          Appended 3 rows to {selectedSheet === 'Al-Jazeera' ? 'Al-Jazeera Jewellers' : 'Refinery Imports'} Ledger account.
                        </span>
                      </div>
                      <button 
                        onClick={() => setCurrentStep(1)}
                        className="px-4 py-2 bg-primary-gold hover:opacity-90 rounded font-bold text-white shadow"
                      >
                        Upload Another File
                      </button>
                    </div>
                  )}
                </motion.div>
              )}

            </AnimatePresence>
          </div>

          {/* Controls Footer */}
          {currentStep < 5 && (
            <div className="p-4 bg-bg-app/40 border-t border-border-custom flex justify-between select-none">
              <button 
                onClick={() => setCurrentStep(prev => (prev > 1 ? (prev - 1) : 1) as any)}
                className="px-3 py-1.5 border border-border-custom bg-sidebar-bg rounded text-xs font-bold text-text-muted hover:text-text-main disabled:opacity-50 transition-colors"
                disabled={currentStep === 1}
              >
                Back
              </button>

              <button 
                onClick={() => {
                  if (currentStep === 4) {
                    triggerImport();
                  } else {
                    setCurrentStep(prev => (prev < 4 ? (prev + 1) : 4) as any);
                  }
                }}
                className="px-3 py-1.5 bg-primary-gold text-white font-bold rounded text-xs flex items-center space-x-1 hover:opacity-90 transition-opacity"
              >
                <span>{currentStep === 4 ? 'Ingest Worksheet' : 'Continue'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
