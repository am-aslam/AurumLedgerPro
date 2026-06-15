'use client';

import React, { useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { useExcelLedgerStore } from '@/store/useExcelLedgerStore';
import { 
  Settings, 
  Building, 
  User, 
  Users, 
  ShieldAlert, 
  FileSpreadsheet, 
  Database,
  CheckCircle2
} from 'lucide-react';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'company' | 'users' | 'backup'>('company');
  const { currentUser } = useExcelLedgerStore();

  // Mock Users List
  const users = [
    { name: currentUser?.name || 'Alexander Wright', email: currentUser?.email || 'alex.wright@aurumledger.pro', role: 'Super Admin', status: 'Active' },
    { name: 'Elena Rostova', email: 'elena.rostova@aurumledger.pro', role: 'Operator', status: 'Active' },
    { name: 'Marcus Vance', email: 'marcus.vance@aurumledger.pro', role: 'Viewer', status: 'Active' }
  ];

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Settings configurations saved successfully.');
  };

  return (
    <AppLayout>
      <div className="space-y-6 max-w-3xl mx-auto">
        {/* Title */}
        <div>
          <h1 className="text-xl font-bold tracking-tight text-text-main">Configurations</h1>
          <p className="text-xs text-text-muted mt-1">Configure company profiles, vault user roles, and backup schedules.</p>
        </div>

        {/* Settings wrapper */}
        <div className="bg-card-bg border border-border-custom rounded-md shadow-sm overflow-hidden flex flex-col md:flex-row min-h-[350px]">
          
          {/* Left sub-tabs */}
          <div className="w-full md:w-48 border-r border-border-custom bg-sidebar-bg/50 flex flex-col p-2 select-none">
            <button
              onClick={() => setActiveTab('company')}
              className={`flex items-center space-x-2.5 px-3 py-2 rounded text-xs font-bold transition-colors text-left ${
                activeTab === 'company' ? 'bg-bg-app text-text-main border-l-2 border-primary-gold pl-2' : 'text-text-muted hover:bg-bg-app hover:text-text-main'
              }`}
            >
              <Building className="w-4 h-4 text-text-muted" />
              <span>Company Profile</span>
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`flex items-center space-x-2.5 px-3 py-2 rounded text-xs font-bold transition-colors text-left ${
                activeTab === 'users' ? 'bg-bg-app text-text-main border-l-2 border-primary-gold pl-2' : 'text-text-muted hover:bg-bg-app hover:text-text-main'
              }`}
            >
              <Users className="w-4 h-4 text-text-muted" />
              <span>Users & Roles</span>
            </button>
            <button
              onClick={() => setActiveTab('backup')}
              className={`flex items-center space-x-2.5 px-3 py-2 rounded text-xs font-bold transition-colors text-left ${
                activeTab === 'backup' ? 'bg-bg-app text-text-main border-l-2 border-primary-gold pl-2' : 'text-text-muted hover:bg-bg-app hover:text-text-main'
              }`}
            >
              <Database className="w-4 h-4 text-text-muted" />
              <span>Backups & Imports</span>
            </button>
          </div>

          {/* Right tab contents */}
          <div className="flex-1 p-6 text-xs font-semibold text-text-main">
            {activeTab === 'company' && (
              <form onSubmit={handleSave} className="space-y-4">
                <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider border-b pb-2 mb-2">Corporate Information</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col space-y-1">
                    <label className="text-[9px] font-bold text-text-muted uppercase tracking-wider">Company Name</label>
                    <input 
                      type="text" 
                      defaultValue="Aurum Trading LLC"
                      className="bg-bg-app border border-border-custom rounded px-2.5 py-1.5 text-xs focus:outline-none focus:border-primary-gold"
                      required
                    />
                  </div>
                  <div className="flex flex-col space-y-1">
                    <label className="text-[9px] font-bold text-text-muted uppercase tracking-wider">VAT / Trade License</label>
                    <input 
                      type="text" 
                      defaultValue="TR-LICENSE-Dubai-992A"
                      className="bg-bg-app border border-border-custom rounded px-2.5 py-1.5 text-xs focus:outline-none focus:border-primary-gold"
                      required
                    />
                  </div>
                </div>

                <div className="flex flex-col space-y-1">
                  <label className="text-[9px] font-bold text-text-muted uppercase tracking-wider">Storage Facility Office</label>
                  <input 
                    type="text" 
                    defaultValue="Zurich Security Terminal 1A, Switzerland"
                    className="bg-bg-app border border-border-custom rounded px-2.5 py-1.5 text-xs focus:outline-none focus:border-primary-gold"
                    required
                  />
                </div>

                <button type="submit" className="px-3 py-1.5 bg-primary-gold text-white font-bold rounded shadow-xs hover:opacity-90">
                  Save Profile
                </button>
              </form>
            )}

            {activeTab === 'users' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b pb-2">
                  <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider">Authorized Vault Users</h3>
                  <button onClick={() => alert('Invite user modal')} className="px-2.5 py-1 bg-bg-app border border-border-custom text-[10px] font-bold uppercase hover:border-primary-gold/45 rounded">Invite Auditor</button>
                </div>

                <div className="border border-border-custom rounded overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-bg-app text-text-muted border-b border-border-custom text-[9px] font-bold uppercase">
                        <th className="p-2.5 pl-4">Name</th>
                        <th className="p-2.5">Email</th>
                        <th className="p-2.5">Role</th>
                        <th className="p-2.5 pr-4 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u, idx) => (
                        <tr key={idx} className="border-b last:border-0 hover:bg-bg-app/30">
                          <td className="p-2.5 pl-4 font-bold">{u.name}</td>
                          <td className="p-2.5 font-medium text-text-muted">{u.email}</td>
                          <td className="p-2.5 text-primary-gold font-bold">{u.role}</td>
                          <td className="p-2.5 text-center pr-4">
                            <span className="bg-success-custom/10 text-success-custom px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider">{u.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'backup' && (
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider border-b pb-2 mb-2">Backups and Imports Setup</h3>

                <div className="bg-bg-app border border-border-custom p-4 rounded-md space-y-3">
                  <div className="flex justify-between">
                    <span className="text-text-muted font-medium">Auto backups scheduled</span>
                    <span className="text-text-main font-bold">Every 24 Hours</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted font-medium">Backup destination node</span>
                    <span className="text-text-main font-bold">Zurich Vault Server B</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted font-medium">Excel columns mapping memory</span>
                    <span className="text-success-custom font-bold">Enabled</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button onClick={() => alert('Database manual backup trigger')} className="px-3 py-1.5 bg-primary-gold text-white font-bold rounded shadow-xs hover:opacity-90">Backup Database Now</button>
                  <button onClick={() => alert('Download backup history')} className="px-3 py-1.5 border border-border-custom bg-sidebar-bg text-text-muted hover:text-text-main rounded font-bold transition-colors">Download Backups History</button>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </AppLayout>
  );
}
