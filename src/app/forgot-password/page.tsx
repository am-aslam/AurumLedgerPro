'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Mail } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-bg-app flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* Brand Logo */}
        <div className="w-12 h-12 rounded bg-primary-gold flex items-center justify-center font-bold text-white text-lg mx-auto shadow-sm">
          AL
        </div>
        <h2 className="mt-6 text-xl font-bold tracking-tight text-text-main">
          Reset password
        </h2>
        <p className="mt-1.5 text-xs text-text-muted">
          Type your account email to receive a secure recovery code
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-card-bg py-8 px-4 border border-border-custom rounded-md shadow-sm sm:px-10">
          {!submitted ? (
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="flex flex-col space-y-1">
                <label htmlFor="email" className="text-[10px] font-bold text-text-muted uppercase tracking-wider">
                  Email address
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

              <button
                type="submit"
                className="w-full py-2 bg-primary-gold hover:opacity-90 text-xs font-bold text-white rounded shadow-sm transition-opacity cursor-pointer"
              >
                Send Password Reset Code
              </button>
            </form>
          ) : (
            <div className="text-center space-y-4 py-4 animate-in fade-in zoom-in-95 duration-150">
              <div className="w-10 h-10 rounded-full bg-success-custom/10 border border-success-custom/20 flex items-center justify-center mx-auto text-success-custom">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-text-main block">Recovery Code Dispatched</span>
                <p className="text-[11px] text-text-muted mt-1 leading-relaxed">
                  We sent a recovery verification link to <span className="font-semibold text-text-main">{email}</span>. Please click the link to configure a new password.
                </p>
              </div>
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-border-custom/50 text-center">
            <Link href="/login" className="inline-flex items-center text-xs font-bold text-primary-gold hover:underline gap-1.5">
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
