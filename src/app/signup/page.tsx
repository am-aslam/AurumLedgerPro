'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router'; // wait in next 13+ App router, use next/navigation
import { useRouter as useAppRouter } from 'next/navigation';
import { ArrowRight, ShieldCheck } from 'lucide-react';

export default function SignupPage() {
  const router = useAppRouter();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      router.push('/verify');
    }, 800);
  };

  return (
    <div className="min-h-screen bg-bg-app flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* Brand Logo */}
        <div className="w-12 h-12 rounded bg-primary-gold flex items-center justify-center font-bold text-white text-lg mx-auto shadow-sm">
          AL
        </div>
        <h2 className="mt-6 text-xl font-bold tracking-tight text-text-main">
          Initialize your Gold Ledger
        </h2>
        <p className="mt-1.5 text-xs text-text-muted">
          Setup your multi-tenant secure auditing node
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-card-bg py-8 px-4 border border-border-custom rounded-md shadow-sm sm:px-10">
          <form className="space-y-4" onSubmit={handleSubmit}>
            {/* Name */}
            <div className="flex flex-col space-y-1">
              <label htmlFor="name" className="text-[10px] font-bold text-text-muted uppercase tracking-wider">
                Full Name
              </label>
              <input
                id="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Alexander Wright"
                className="w-full px-3 py-2 bg-bg-app text-xs border border-border-custom rounded-md text-text-main focus:outline-none focus:border-primary-gold transition-colors font-medium placeholder-text-muted"
              />
            </div>

            {/* Email */}
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

            {/* Company */}
            <div className="flex flex-col space-y-1">
              <label htmlFor="company" className="text-[10px] font-bold text-text-muted uppercase tracking-wider">
                Organization Name
              </label>
              <input
                id="company"
                type="text"
                required
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Aurum Trading LLC"
                className="w-full px-3 py-2 bg-bg-app text-xs border border-border-custom rounded-md text-text-main focus:outline-none focus:border-primary-gold transition-colors font-medium placeholder-text-muted"
              />
            </div>

            {/* Password */}
            <div className="flex flex-col space-y-1">
              <label htmlFor="password" className="text-[10px] font-bold text-text-muted uppercase tracking-wider">
                Access Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 8 characters"
                className="w-full px-3 py-2 bg-bg-app text-xs border border-border-custom rounded-md text-text-main focus:outline-none focus:border-primary-gold transition-colors font-medium placeholder-text-muted"
              />
            </div>

            {/* Ingestion Agreement */}
            <div className="flex items-center space-x-2 pt-1 text-[11px] text-text-muted font-medium select-none">
              <input type="checkbox" required className="rounded border-border-custom text-primary-gold w-3.5 h-3.5" />
              <span>I agree to compliance security guidelines.</span>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2 bg-primary-gold hover:opacity-90 disabled:opacity-50 text-xs font-bold text-white rounded shadow-sm transition-opacity flex justify-center items-center gap-1.5 cursor-pointer"
            >
              {isLoading ? 'Creating Node...' : 'Initialize Workspace'}
              {!isLoading && <ArrowRight className="w-3.5 h-3.5" />}
            </button>
          </form>

          {/* Login link */}
          <div className="mt-6 text-center text-xs">
            <span className="text-text-muted font-medium">Already configured? </span>
            <Link href="/login" className="text-primary-gold font-bold hover:underline">
              Access workspace
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
