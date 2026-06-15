'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useExcelLedgerStore } from '@/store/useExcelLedgerStore';
import { 
  LayoutDashboard, 
  ArrowLeftRight, 
  BookOpen, 
  Scale, 
  FileSpreadsheet, 
  Settings, 
  Menu,
  Briefcase,
  Layers,
  CircleDot
} from 'lucide-react';

export default function Sidebar({ forceExpanded = false }: { forceExpanded?: boolean }) {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebar } = useExcelLedgerStore();

  const isCollapsed = sidebarCollapsed && !forceExpanded;

  const isActive = (path: string) => pathname === path;

  const renderIcon = (name: string, active: boolean) => {
    const className = `w-4 h-4 transition-colors duration-150 ${
      active ? 'text-primary-gold' : 'text-text-muted group-hover:text-text-main'
    }`;

    switch (name) {
      case 'Dashboard': return <LayoutDashboard className={className} />;
      case 'Balances': return <Layers className={className} />;
      case 'Ledgers': return <BookOpen className={className} />;
      case 'Transactions': return <ArrowLeftRight className={className} />;
      case 'Import': return <FileSpreadsheet className={className} />;
      case 'Capital': return <Briefcase className={className} />;
      case 'Reports': return <Scale className={className} />;
      case 'Settings': return <Settings className={className} />;
      default: return <CircleDot className={className} />;
    }
  };

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: 'Dashboard' },
    { label: 'Balances Grid', path: '/balances', icon: 'Balances' },
    { label: 'General Ledgers', path: '/ledgers', icon: 'Ledgers' },
    { label: 'Voucher Transactions', path: '/transactions', icon: 'Transactions' },
    { label: 'Excel Workbook Import', path: '/excel-imports', icon: 'Import' },
    { label: 'Partner Capital', path: '/capital', icon: 'Capital' },
    { label: 'Reports & Statements', path: '/reports', icon: 'Reports' },
    { label: 'Settings', path: '/settings', icon: 'Settings' }
  ];

  return (
    <aside 
      className={`bg-sidebar-bg border-r border-border-custom flex flex-col transition-all duration-300 ease-in-out ${
        isCollapsed ? 'w-16' : 'w-64'
      } min-h-screen select-none relative`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-border-custom">
        {!isCollapsed && (
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded bg-primary-gold flex items-center justify-center font-bold text-white text-sm shadow-sm">
              AL
            </div>
            <div>
              <span className="font-semibold text-sm tracking-tight text-text-main">AurumLedger</span>
              <span className="text-[10px] block text-primary-gold font-medium leading-none">EXCEL PRO</span>
            </div>
          </div>
        )}
        {isCollapsed && (
          <div className="w-8 h-8 rounded bg-primary-gold flex items-center justify-center font-bold text-white text-xs mx-auto shadow-sm">
            AL
          </div>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1.5 scrollbar-thin">
        {navItems.map((item) => {
          const active = isActive(item.path);
          return (
            <Link
              key={item.label}
              href={item.path}
              className={`flex items-center px-3 py-2 rounded-md text-xs font-semibold transition-colors group ${
                active 
                  ? 'bg-bg-app text-text-main border-l-2 border-primary-gold pl-2.5' 
                  : 'text-text-muted hover:bg-bg-app hover:text-text-main border-l-2 border-transparent'
              }`}
            >
              <div className="flex items-center space-x-3">
                {renderIcon(item.icon, active)}
                {!isCollapsed && <span>{item.label}</span>}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Collapse Button */}
      {!forceExpanded && (
        <div className="p-3 border-t border-border-custom flex items-center justify-center">
          <button 
            onClick={toggleSidebar}
            className="p-2 rounded-md hover:bg-bg-app text-text-muted hover:text-text-main transition-colors w-full flex justify-center items-center gap-2"
          >
            <Menu className="w-4 h-4" />
            {!isCollapsed && <span className="text-xs font-medium">Collapse Menu</span>}
          </button>
        </div>
      )}
    </aside>
  );
}
