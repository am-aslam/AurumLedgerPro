'use client';

import React, { useState, useRef, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import { useLedgerStore, ChatMessage } from '@/store/useLedgerStore';
import { 
  Sparkles, 
  Send, 
  Trash2, 
  ArrowRight,
  Database,
  Grid,
  TrendingUp,
  User,
  RefreshCw,
  Clock
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip 
} from 'recharts';

export default function AIAssistantPage() {
  const { chatHistory, addChatMessage, clearChatHistory, customers, settlements, goldRate } = useLedgerStore();
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isTyping]);

  const handleSend = (text: string) => {
    if (!text.trim()) return;

    // 1. Add user message
    addChatMessage({ sender: 'user', text });
    setInputText('');
    setIsTyping(true);

    // 2. Generate simulated AI response based on keywords
    setTimeout(() => {
      setIsTyping(false);
      
      const lowerText = text.toLowerCase();
      let replyText = "I parsed your treasury request, but couldn't find a matching script. You can try selecting one of the template prompts below.";
      let replyData: ChatMessage['data'] = undefined;

      if (lowerText.includes('owing') || lowerText.includes('50 grams') || lowerText.includes('50g')) {
        replyText = "Here are all active partner accounts with a net gold liability exceeding 50.00 grams. You can click on their ledger profiles inside the Customers CRM directory to initiate settlements.";
        
        // Find customers with balanceGold > 50
        const owingCustomers = customers.filter(c => c.balanceGold > 50);
        replyData = {
          type: 'table',
          headers: ['Customer Name', 'Tags', 'Gold Balance', 'Receivable Cash'],
          rows: owingCustomers.map(c => [c.name, c.tags.join(', '), `${c.balanceGold.toFixed(2)} g`, `$${c.receivableCash}`])
        };
      } else if (lowerText.includes('monthly report') || lowerText.includes('generate report')) {
        replyText = "Ingested monthly volume data for Q2 2026. Trade throughput has increased by 14.5% month-on-month, primarily driven by refining volume increases from Nadir Refining Corp.";
        replyData = {
          type: 'chart',
          chartData: [
            { month: 'Jan', Volume: 3200 },
            { month: 'Feb', Volume: 4100 },
            { month: 'Mar', Volume: 5800 },
            { month: 'Apr', Volume: 4900 },
            { month: 'May', Volume: 6300 },
            { month: 'Jun', Volume: 7200 }
          ]
        };
      } else if (lowerText.includes('settlement mismatches') || lowerText.includes('mismatch')) {
        replyText = "Audit checks executed against Zurich Spot rates. We found 3 pending settlements requiring netting authorization to prevent credit exposure limits.";
        
        const pendingSets = settlements.filter(s => s.status === 'Pending');
        replyData = {
          type: 'table',
          headers: ['Settlement ID', 'Partner Account', 'Net Weight', 'Suggested Action'],
          rows: pendingSets.map(s => [s.id, s.customerName, `${s.netWeight.toFixed(2)} g`, s.suggestedAction])
        };
      }

      addChatMessage({
        sender: 'assistant',
        text: replyText,
        data: replyData
      });
    }, 1200);
  };

  const suggestions = [
    { label: "Owed > 50g", query: "Show customers owing more than 50 grams." },
    { label: "Monthly Growth", query: "Generate monthly report." },
    { label: "Risk Netting", query: "Find settlement mismatches." }
  ];

  return (
    <AppLayout>
      <div className="flex flex-col h-[calc(100vh-130px)] space-y-4">
        {/* Title Header */}
        <div className="flex justify-between items-center flex-shrink-0">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-text-main flex items-center gap-1.5">
              <Sparkles className="w-5 h-5 text-primary-gold" />
              AurumLedger Copilot
            </h1>
            <p className="text-xs text-text-muted mt-1 font-medium">Enterprise NLP assistant for automated netting proposals and vault auditing.</p>
          </div>
          <button 
            onClick={clearChatHistory}
            className="p-2 border border-border-custom hover:bg-bg-app text-text-muted hover:text-text-main rounded transition-colors"
            title="Clear Chat History"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Chat Feed Workspace */}
        <div className="flex-1 bg-card-bg border border-border-custom rounded-md shadow-sm overflow-hidden flex flex-col justify-between min-h-0">
          {/* Scrollable messages box */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
            {chatHistory.map((msg) => (
              <div 
                key={msg.id}
                className={`flex space-x-3.5 max-w-2xl text-xs ${
                  msg.sender === 'user' ? 'ml-auto flex-row-reverse space-x-reverse' : ''
                }`}
              >
                {/* Avatar Icon */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border flex-shrink-0 ${
                  msg.sender === 'assistant' 
                    ? 'bg-primary-gold/10 border-primary-gold/30' 
                    : 'bg-border-custom border-border-custom'
                }`}>
                  {msg.sender === 'assistant' ? (
                    <Sparkles className="w-4.5 h-4.5 text-primary-gold" />
                  ) : (
                    <User className="w-4.5 h-4.5 text-text-main" />
                  )}
                </div>

                {/* Text Bubble */}
                <div className="space-y-3">
                  <div className={`p-4 rounded-md shadow-inner text-xs leading-relaxed font-medium ${
                    msg.sender === 'user' 
                      ? 'bg-primary-gold text-white font-semibold' 
                      : 'bg-bg-app text-text-main border border-border-custom'
                  }`}>
                    {msg.text}
                  </div>

                  {/* Render Custom Data Attachments (Tables / Charts) inline */}
                  {msg.data && msg.sender === 'assistant' && (
                    <div className="border border-border-custom rounded-md bg-sidebar-bg p-4 space-y-3.5 animate-in fade-in zoom-in-95 duration-200">
                      
                      {/* TABLE INLINE */}
                      {msg.data.type === 'table' && msg.data.headers && msg.data.rows && (
                        <div className="overflow-x-auto border border-border-custom rounded">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="bg-bg-app border-b border-border-custom text-[10px] font-bold text-text-muted uppercase tracking-wider">
                                {msg.data.headers.map((h, i) => <th key={i} className="p-2">{h}</th>)}
                              </tr>
                            </thead>
                            <tbody>
                              {msg.data.rows.map((row, rowIdx) => (
                                <tr key={rowIdx} className="border-b border-border-custom last:border-0 hover:bg-bg-app/50">
                                  {row.map((cell, cellIdx) => (
                                    <td key={cellIdx} className="p-2 font-medium text-text-main whitespace-nowrap">{cell}</td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}

                      {/* CHART INLINE */}
                      {msg.data.type === 'chart' && msg.data.chartData && (
                        <div className="h-44 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={msg.data.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                              <XAxis dataKey="month" stroke="#9CA3AF" fontSize={9} tickLine={false} />
                              <YAxis stroke="#9CA3AF" fontSize={9} tickLine={false} axisLine={false} />
                              <Tooltip contentStyle={{ fontSize: '10px' }} />
                              <Bar dataKey="Volume" fill="#D4AF37" radius={[2, 2, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      )}

                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Typing Skeleton Loader */}
            {isTyping && (
              <div className="flex space-x-3.5 max-w-lg text-xs animate-pulse">
                <div className="w-8 h-8 rounded-full bg-primary-gold/10 border border-primary-gold/30 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-4.5 h-4.5 text-primary-gold animate-spin" />
                </div>
                <div className="bg-bg-app border border-border-custom p-4 rounded-md space-y-2 flex-1">
                  <div className="h-3 bg-border-custom rounded w-3/4"></div>
                  <div className="h-3 bg-border-custom rounded w-1/2"></div>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Prompt Suggestions footer */}
          <div className="p-4 bg-bg-app/20 border-t border-border-custom space-y-3 flex-shrink-0">
            <div className="flex flex-wrap gap-2 justify-center">
              {suggestions.map((s) => (
                <button
                  key={s.label}
                  onClick={() => handleSend(s.query)}
                  className="flex items-center space-x-1 px-3 py-1.5 border border-border-custom bg-sidebar-bg rounded-full text-xs font-bold text-text-muted hover:text-primary-gold hover:border-primary-gold/50 transition-colors shadow-sm cursor-pointer select-none"
                >
                  <Sparkles className="w-3.5 h-3.5 text-primary-gold" />
                  <span>{s.label}</span>
                </button>
              ))}
            </div>

            {/* Input bar Form */}
            <form 
              onSubmit={(e) => { e.preventDefault(); handleSend(inputText); }}
              className="flex items-center bg-sidebar-bg border border-border-custom rounded-md overflow-hidden p-1 shadow-sm focus-within:border-primary-gold transition-colors"
            >
              <input
                type="text"
                placeholder="Ask Copilot e.g., 'Show customers owing more than 50 grams'..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="flex-1 bg-transparent px-4 py-2 border-0 outline-none text-xs text-text-main placeholder-text-muted font-medium focus:ring-0"
              />
              <button 
                type="submit"
                className="p-2 bg-primary-gold hover:opacity-90 text-white rounded shadow-sm transition-opacity"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
