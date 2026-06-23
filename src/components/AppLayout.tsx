'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import TopNavbar from './TopNavbar';
import { useExcelLedgerStore } from '@/store/useExcelLedgerStore';
import { Menu, X } from 'lucide-react';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { sidebarCollapsed, fetchData } = useExcelLedgerStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-bg-app flex items-center justify-center">
        <div className="text-text-muted text-xs font-semibold animate-pulse">Loading AurumLedger Pro...</div>
      </div>
    );
  }

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
        {mobileMenuOpen && (
          <button 
            onClick={() => setMobileMenuOpen(false)}
            className="absolute top-4 right-[-48px] bg-sidebar-bg p-2 rounded-r border-y border-r border-border-custom text-text-main hover:text-primary-gold shadow-md"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 relative h-screen overflow-hidden">
        {/* Top Navigation */}
        <TopNavbar onMenuClick={() => setMobileMenuOpen(true)} />

        {/* Content Viewport */}
        <main className="flex-1 overflow-y-auto scrollbar-thin p-6 md:p-8 bg-bg-app">
          {children}
        </main>
      </div>
    </div>
  );
}
