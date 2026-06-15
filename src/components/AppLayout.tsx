'use client';

import React, { useState } from 'react';
import Sidebar from './Sidebar';
import TopNavbar from './TopNavbar';
import { useExcelLedgerStore } from '@/store/useExcelLedgerStore';
import { Menu, X } from 'lucide-react';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { sidebarCollapsed } = useExcelLedgerStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-bg-app text-fg-app font-sans antialiased overflow-hidden">
      {/* Desktop Sidebar (hidden on mobile) */}
      <div className="hidden md:flex">
        <Sidebar />
      </div>

      {/* Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/40 z-50 md:hidden animate-in fade-in duration-200"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Sidebar Slider */}
      <div 
        className={`fixed top-0 bottom-0 left-0 z-50 md:hidden transition-transform duration-300 ease-in-out transform ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Sidebar forceExpanded />
        {/* Floating Close Button for Mobile Menu */}
        <button 
          onClick={() => setMobileMenuOpen(false)}
          className="absolute top-4 right-[-48px] bg-sidebar-bg p-2 rounded-r border-y border-r border-border-custom text-text-main hover:text-primary-gold shadow-md"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 relative h-screen overflow-hidden">
        {/* Top Navigation */}
        <div className="flex items-center">
          {/* Mobile Menu Trigger */}
          <button 
            onClick={() => setMobileMenuOpen(true)}
            className="p-4 md:hidden border-b border-border-custom bg-sidebar-bg text-text-muted hover:text-text-main hover:bg-bg-app transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex-1 min-w-0">
            <TopNavbar />
          </div>
        </div>

        {/* Content Viewport */}
        <main className="flex-1 overflow-y-auto scrollbar-thin p-6 md:p-8 bg-bg-app">
          {children}
        </main>
      </div>
    </div>
  );
}
