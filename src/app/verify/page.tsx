'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, ArrowRight } from 'lucide-react';

export default function VerificationPage() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const demoCode = '882045';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code !== demoCode) {
      setErrorMsg('Invalid verification code. Please enter the simulated code.');
      return;
    }
    setErrorMsg('');
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      router.push('/dashboard');
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
          Verify your credentials
        </h2>
        <p className="mt-1.5 text-xs text-text-muted">
          A simulated 6-digit OTP verification code has been generated for your node
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-card-bg py-8 px-4 border border-border-custom rounded-md shadow-sm sm:px-10">
          
          <div className="bg-primary-gold/5 border border-primary-gold/25 p-3 rounded text-center mb-5 select-none animate-in fade-in duration-300">
            <span className="text-[9px] font-bold text-text-muted uppercase tracking-widest block">Simulated OTP Code</span>
            <span className="text-base font-extrabold text-primary-gold tracking-widest block mt-0.5">{demoCode}</span>
          </div>

          {errorMsg && (
            <div className="bg-danger-custom/10 border border-danger-custom/25 p-2.5 rounded text-center text-[11px] font-semibold text-danger-custom mb-4 animate-in fade-in">
              {errorMsg}
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="flex flex-col space-y-1">
              <label htmlFor="code" className="text-[10px] font-bold text-text-muted uppercase tracking-wider text-center">
                Security Verification Code
              </label>
              <input
                id="code"
                type="text"
                required
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                placeholder="0 0 0 0 0 0"
                className="w-full px-3 py-3 bg-bg-app text-center text-lg tracking-widest border border-border-custom rounded-md text-text-main focus:outline-none focus:border-primary-gold transition-colors font-bold placeholder-text-muted"
              />
            </div>

            <button
              type="submit"
              disabled={code.length !== 6 || isLoading}
              className="w-full py-2 bg-primary-gold hover:opacity-90 disabled:opacity-50 text-xs font-bold text-white rounded shadow-sm transition-opacity flex justify-center items-center gap-1.5 cursor-pointer"
            >
              {isLoading ? 'Verifying...' : 'Verify & Continue'}
              {!isLoading && <ArrowRight className="w-3.5 h-3.5" />}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-text-muted">
            <span>Didn't receive the email? </span>
            <button 
              onClick={() => alert('Code resent mockup')} 
              className="text-primary-gold font-bold hover:underline"
            >
              Resend Code
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
