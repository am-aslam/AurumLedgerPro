'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShieldCheck, ArrowRight, X } from 'lucide-react';
import { useExcelLedgerStore } from '@/store/useExcelLedgerStore';

export default function LoginPage() {
  const router = useRouter();
  const { setCurrentUser } = useExcelLedgerStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Google Sign In Simulated Modal States
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleCustomName, setGoogleCustomName] = useState('');
  const [googleCustomEmail, setGoogleCustomEmail] = useState('');
  const [isCustomAccount, setIsCustomAccount] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate auth login
    setTimeout(() => {
      const nameFromEmail = email.split('@')[0].split(/[._-]/).map(part => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
      setCurrentUser({ name: nameFromEmail || 'Active Auditor', email });
      setIsLoading(false);
      router.push('/dashboard');
    }, 800);
  };

  const handleGoogleSignIn = (name: string, email: string) => {
    setIsLoading(true);
    setShowGoogleModal(false);
    setTimeout(() => {
      setCurrentUser({ name, email });
      setIsLoading(false);
      router.push('/dashboard');
    }, 800);
  };

  const handleCustomGoogleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!googleCustomName.trim() || !googleCustomEmail.trim()) return;
    handleGoogleSignIn(googleCustomName, googleCustomEmail);
  };

  return (
    <div className="min-h-screen bg-bg-app flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* Brand Logo */}
        <div className="w-12 h-12 rounded bg-primary-gold flex items-center justify-center font-bold text-white text-lg mx-auto shadow-sm">
          AL
        </div>
        <h2 className="mt-6 text-xl font-bold tracking-tight text-text-main">
          Sign in to AurumLedger Pro
        </h2>
        <p className="mt-1.5 text-xs text-text-muted">
          Enterprise Gold Ledger Auditing Workspace
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-card-bg py-8 px-4 border border-border-custom rounded-md shadow-sm sm:px-10">
          <form className="space-y-5" onSubmit={handleSubmit}>
            {/* Email input */}
            <div className="flex flex-col space-y-1">
              <label htmlFor="email" className="text-[10px] font-bold text-text-muted uppercase tracking-wider">
                Corporate Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full px-3 py-2 bg-bg-app text-xs border border-border-custom rounded-md text-text-main focus:outline-none focus:border-primary-gold transition-colors font-medium placeholder-text-muted"
              />
            </div>

            {/* Password input */}
            <div className="flex flex-col space-y-1">
              <div className="flex justify-between items-center">
                <label htmlFor="password" className="text-[10px] font-bold text-text-muted uppercase tracking-wider">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-[10px] font-bold text-primary-gold hover:underline"
                >
                  Forgot your password?
                </Link>
              </div>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 bg-bg-app text-xs border border-border-custom rounded-md text-text-main focus:outline-none focus:border-primary-gold transition-colors font-medium placeholder-text-muted"
              />
            </div>

            {/* Action button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2 bg-primary-gold hover:opacity-90 disabled:opacity-50 text-xs font-bold text-white rounded shadow-sm transition-opacity flex justify-center items-center gap-1.5 cursor-pointer"
            >
              {isLoading ? 'Connecting...' : 'Sign In'}
              {!isLoading && <ArrowRight className="w-3.5 h-3.5" />}
            </button>
          </form>

          {/* Social login line */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border-custom"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-card-bg px-2 text-text-muted font-medium">Or continue with SSO</span>
              </div>
            </div>

            <div className="mt-4">
              <button
                type="button"
                onClick={() => setShowGoogleModal(true)}
                className="w-full flex items-center justify-center space-x-2 py-2 border border-border-custom rounded hover:border-primary-gold/40 bg-bg-app text-xs font-bold text-text-main transition-colors cursor-pointer"
              >
                <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                </svg>
                <span>Sign in with Google</span>
              </button>
            </div>
          </div>

          {/* Signup link */}
          <div className="mt-6 text-center text-xs">
            <span className="text-text-muted font-medium">Don't have an account? </span>
            <Link href="/signup" className="text-primary-gold font-bold hover:underline">
              Create free workspace
            </Link>
          </div>
        </div>
      </div>

      {/* SIMULATED GOOGLE SSO MODAL */}
      {showGoogleModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white text-gray-900 rounded-lg shadow-2xl w-full max-w-sm overflow-hidden border border-gray-200 font-sans text-xs flex flex-col">
            
            {/* Google Header */}
            <div className="p-5 flex flex-col items-center border-b border-gray-100 text-center">
              <svg className="w-6 h-6 mb-2" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
              </svg>
              <h3 className="text-sm font-semibold text-gray-800">Sign in with Google</h3>
              <p className="text-[11px] text-gray-500 mt-1">to continue to AurumLedger Pro</p>
            </div>

            {/* Accounts list */}
            <div className="p-4 flex-grow overflow-y-auto">
              {!isCustomAccount ? (
                <div className="space-y-2.5">
                  <button
                    onClick={() => handleGoogleSignIn('Alexander Wright', 'alex.wright@gmail.com')}
                    className="w-full flex items-center justify-between p-2.5 border border-gray-200 rounded-md hover:bg-gray-50 text-left transition-colors font-medium text-gray-700"
                  >
                    <div>
                      <span className="block font-semibold text-xs text-gray-800">Alexander Wright</span>
                      <span className="block text-[10px] text-gray-500">alex.wright@gmail.com</span>
                    </div>
                    <span className="text-[10px] text-gray-400">Google Verified</span>
                  </button>

                  <button
                    onClick={() => handleGoogleSignIn('Zurich Treasury', 'zurich.treasury@gmail.com')}
                    className="w-full flex items-center justify-between p-2.5 border border-gray-200 rounded-md hover:bg-gray-50 text-left transition-colors font-medium text-gray-700"
                  >
                    <div>
                      <span className="block font-semibold text-xs text-gray-800">Zurich Treasury</span>
                      <span className="block text-[10px] text-gray-500">zurich.treasury@gmail.com</span>
                    </div>
                    <span className="text-[10px] text-gray-400">Google Verified</span>
                  </button>

                  <button
                    onClick={() => setIsCustomAccount(true)}
                    className="w-full p-2.5 border border-dashed border-gray-300 rounded-md hover:bg-gray-50 text-center font-bold text-gray-500 transition-colors"
                  >
                    Use another account
                  </button>
                </div>
              ) : (
                <form onSubmit={handleCustomGoogleSubmit} className="space-y-3">
                  <div className="flex flex-col space-y-1">
                    <label className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Full Name</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Google User Name"
                      value={googleCustomName}
                      onChange={(e) => setGoogleCustomName(e.target.value)}
                      className="bg-white border border-gray-300 rounded px-2.5 py-1.5 text-xs text-gray-900 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="flex flex-col space-y-1">
                    <label className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Google Email</label>
                    <input 
                      type="email" 
                      required
                      placeholder="user@gmail.com"
                      value={googleCustomEmail}
                      onChange={(e) => setGoogleCustomEmail(e.target.value)}
                      className="bg-white border border-gray-300 rounded px-2.5 py-1.5 text-xs text-gray-900 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button 
                      type="button"
                      onClick={() => setIsCustomAccount(false)}
                      className="px-3 py-1.5 border border-gray-300 rounded font-semibold text-gray-600 hover:bg-gray-50"
                    >
                      Back
                    </button>
                    <button 
                      type="submit"
                      className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 rounded font-bold text-white shadow-xs"
                    >
                      Sign In
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Footer close */}
            <div className="p-3 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button
                type="button"
                onClick={() => { setShowGoogleModal(false); setIsCustomAccount(false); }}
                className="px-3 py-1.5 border border-gray-300 bg-white rounded font-semibold text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
