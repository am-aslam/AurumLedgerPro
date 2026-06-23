'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useExcelLedgerStore } from '@/store/useExcelLedgerStore';
import { 
  Search, 
  Bell, 
  ChevronDown, 
  Sun, 
  Moon, 
  Building,
  User,
  LogOut,
  Sliders,
  Menu
} from 'lucide-react';

export default function TopNavbar({ onMenuClick }: { onMenuClick?: () => void }) {
  const router = useRouter();
  const { 
    themeMode, 
    setThemeMode, 
    goldRate, 
    accounts,
    setActiveAccountId,
    selectedCurrency,
    setSelectedCurrency,
    globalSearchQuery,
    setGlobalSearchQuery,
    currentUser
  } = useExcelLedgerStore();

  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);

  // Sync theme with DOM documentElement
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('themeMode') as 'light' | 'dark';
      if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
        setThemeMode(savedTheme);
      }
    }
  }, [setThemeMode]);

  useEffect(() => {
    const root = window.document.documentElement;
    if (themeMode === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [themeMode]);

  // Convert gold rate for the live widget
  const currencySymbol = selectedCurrency === 'INR' ? '₹' : selectedCurrency === 'AED' ? 'AED ' : selectedCurrency === 'EUR' ? '€' : '$';
  const currencyFactor = selectedCurrency === 'INR' ? 83.50 : selectedCurrency === 'AED' ? 3.67 : selectedCurrency === 'EUR' ? 0.92 : 1.0;
  const convertedGoldRate = goldRate * currencyFactor;

  // Filter clients dynamically as user searches
  const matchingAccounts = globalSearchQuery.trim()
    ? accounts.filter(acc => acc.name.toLowerCase().includes(globalSearchQuery.toLowerCase()))
    : [];

  return (
    <header className="h-16 border-b border-border-custom bg-sidebar-bg px-4 md:px-6 flex items-center justify-between select-none relative z-40">
      
      {/* Left Search / Static Brand Name */}
      <div className="flex items-center space-x-3 md:space-x-6">
        {onMenuClick && (
          <button 
            onClick={onMenuClick}
            className="p-1.5 md:hidden text-text-muted hover:text-text-main hover:bg-bg-app rounded transition-colors mr-0.5"
            aria-label="Toggle Navigation Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        
        {/* Static Corporate Vault Indicator */}
        <div className="flex items-center space-x-2 px-2.5 py-1.5 text-xs font-bold uppercase tracking-wider text-text-main border border-primary-gold bg-primary-gold/5 rounded">
          <Building className="w-3.5 h-3.5 text-primary-gold" />
          <span className="hidden sm:inline">Aurumledger Pro</span>
        </div>

        {/* Global Search Bar */}
        <div className="relative w-64 max-w-xs hidden md:block">
          <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-text-muted" />
          </span>
          <input 
            type="text" 
            placeholder="Search clients, entities..."
            value={globalSearchQuery}
            onChange={(e) => setGlobalSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 bg-bg-app text-xs border border-border-custom rounded-md text-text-main focus:outline-none focus:border-primary-gold transition-colors font-medium placeholder-text-muted"
          />

          {/* Dynamic Search Results Dropdown */}
          {globalSearchQuery.trim() !== '' && (
            <div className="absolute left-0 right-0 mt-1 bg-sidebar-bg border border-border-custom rounded-md shadow-lg py-1 z-50 max-h-48 overflow-y-auto">
              {matchingAccounts.length > 0 ? (
                matchingAccounts.map(acc => (
                  <button
                    key={acc.id}
                    onClick={() => {
                      setActiveAccountId(acc.id);
                      setGlobalSearchQuery('');
                      router.push('/ledgers');
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-bg-app text-xs font-semibold text-text-main border-b border-border-custom/30 last:border-0 block"
                  >
                    <div className="flex justify-between items-center">
                      <span className="truncate pr-2">{acc.name}</span>
                      <span className="text-[10px] text-primary-gold font-bold flex-shrink-0">Open Ledger</span>
                    </div>
                  </button>
                ))
              ) : (
                <div className="px-3 py-2 text-xs text-text-muted text-center font-semibold">No clients match query</div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right Widgets: Currency Switcher, Gold Rate, Notifications, Theme, Profile */}
      <div className="flex items-center space-x-2 md:space-x-4">
        
        {/* Currency Switcher Toggle */}
        <div className="hidden md:inline-flex rounded border border-border-custom bg-bg-app p-0.5 items-center">
          {(['USD', 'INR', 'AED', 'EUR'] as const).map(cur => (
            <button
              key={cur}
              onClick={() => setSelectedCurrency(cur)}
              className={`px-2 py-1 text-[9px] font-bold rounded transition-colors ${
                selectedCurrency === cur 
                  ? 'bg-sidebar-bg text-text-main shadow-xs' 
                  : 'text-text-muted hover:text-text-main'
              }`}
            >
              {cur}
            </button>
          ))}
        </div>

        {/* Responsive Currency Dropdown */}
        <div className="md:hidden">
          <select
            value={selectedCurrency}
            onChange={(e) => setSelectedCurrency(e.target.value as any)}
            className="bg-bg-app border border-border-custom rounded px-1.5 py-1 text-[9px] font-extrabold text-text-main focus:outline-none focus:border-primary-gold"
          >
            <option value="USD">USD</option>
            <option value="INR">INR</option>
            <option value="AED">AED</option>
            <option value="EUR">EUR</option>
          </select>
        </div>

        {/* Live Gold Rate Widget */}
        <div className="items-center space-x-2 bg-bg-app border border-border-custom rounded px-2.5 py-1.5 select-none hidden sm:flex">
          <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider hidden md:inline">Gold Spot:</span>
          <span className="text-xs font-semibold text-text-main">
            {currencySymbol}{convertedGoldRate.toFixed(2)}/g
          </span>
        </div>

        {/* Dark/Light mode toggle */}
        <button 
          onClick={() => setThemeMode(themeMode === 'light' ? 'dark' : 'light')}
          className="p-2 rounded hover:bg-bg-app text-text-muted hover:text-text-main transition-colors border border-transparent hover:border-border-custom"
        >
          {themeMode === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-primary-gold" />}
        </button>

        {/* Notifications Center */}
        <div className="relative">
          <button 
            onClick={() => setShowNotifDropdown(!showNotifDropdown)}
            className="p-2 rounded hover:bg-bg-app text-text-muted hover:text-text-main transition-colors border border-transparent hover:border-border-custom relative"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-danger-custom rounded-full ring-2 ring-sidebar-bg"></span>
          </button>

          {showNotifDropdown && (
            <div className="absolute right-0 mt-2 w-72 bg-sidebar-bg border border-border-custom rounded-md shadow-lg py-1 text-sm text-text-main z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-4 py-2 border-b border-border-custom font-semibold text-xs text-text-muted uppercase tracking-wider">
                Notifications
              </div>
              <div className="px-4 py-3 text-xs text-text-muted text-center font-medium">
                No new alerts. Ledger sync complete.
              </div>
            </div>
          )}
        </div>

        {/* User Profile */}
        <div className="relative">
          <button 
            onClick={() => setShowProfileDropdown(!showProfileDropdown)}
            className="flex items-center space-x-2 border-l border-border-custom pl-4 hover:opacity-85 transition-opacity"
          >
            <div className="w-8 h-8 rounded-full bg-border-custom flex items-center justify-center border border-primary-gold/50 shadow-inner">
              <User className="w-4 h-4 text-text-main" />
            </div>
            <div className="text-left hidden lg:block">
              <span className="text-xs font-semibold text-text-main block leading-none">{currentUser?.name || 'Alexander Wright'}</span>
              <span className="text-[9px] text-text-muted block font-medium">Head Auditor</span>
            </div>
            <ChevronDown className="w-3 h-3 text-text-muted" />
          </button>

          {showProfileDropdown && (
            <div className="absolute right-0 mt-2 w-48 bg-sidebar-bg border border-border-custom rounded-md shadow-lg py-1 text-sm text-text-main z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-4 py-2 border-b border-border-custom">
                <span className="text-xs font-bold block">{currentUser?.name || 'Alexander Wright'}</span>
                <span className="text-[10px] text-text-muted">{currentUser?.email || 'alex.wright@aurumledger.pro'}</span>
              </div>
              <a href="/settings" className="flex items-center px-4 py-2 text-xs font-medium hover:bg-bg-app text-text-main transition-colors">
                <Sliders className="w-3.5 h-3.5 mr-2 text-text-muted" />
                Preferences
              </a>
              <a href="/login" className="w-full text-left flex items-center px-4 py-2 text-xs font-medium hover:bg-bg-app text-danger-custom transition-colors border-t border-border-custom/50 mt-1">
                <LogOut className="w-3.5 h-3.5 mr-2" />
                Sign Out
              </a>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
