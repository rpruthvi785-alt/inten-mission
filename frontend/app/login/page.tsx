'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  FileCheck, Lock, User, ArrowRight, Loader2, Eye, EyeOff,
  AlertCircle, WifiOff, ShieldCheck, Server, CheckCircle2, Settings,
} from 'lucide-react';
import {
  login,
  getApiBaseUrl,
  isBackendConfigured,
  getApiOverrideUrl,
  setApiOverrideUrl,
  BACKEND_NOT_CONFIGURED,
} from '../../lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [errorType, setErrorType] = useState<'auth' | 'network' | 'config' | ''>('');

  // Runtime backend URL config state
  const [backendUrl, setBackendUrl] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlSaved, setUrlSaved] = useState(false);
  const [isConfigured, setIsConfigured] = useState(true);
  const [resolvedApiUrl, setResolvedApiUrl] = useState<string | null>(null);

  // Hydrate on client
  useEffect(() => {
    const configured = isBackendConfigured();
    const resolved = getApiBaseUrl();
    setIsConfigured(configured);
    setResolvedApiUrl(resolved);
    setBackendUrl(getApiOverrideUrl());
    if (!configured) {
      setShowUrlInput(true);
    }
  }, []);

  const handleSaveUrl = () => {
    const clean = backendUrl.trim().replace(/\/+$/, '');
    if (!clean) return;
    setApiOverrideUrl(clean);
    setIsConfigured(true);
    setResolvedApiUrl(clean);
    setUrlSaved(true);
    setShowUrlInput(false);
    setError('');
    setErrorType('');
    setTimeout(() => setUrlSaved(false), 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError('Please enter both username and password.');
      setErrorType('auth');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setErrorType('');
      await login(username.trim(), password);
      router.push('/dashboard');
    } catch (err: any) {
      const code = err?.code;
      const msg = err?.message || 'Login failed.';

      if (code === BACKEND_NOT_CONFIGURED) {
        setErrorType('config');
        setError(msg);
        setShowUrlInput(true);
      } else if (
        msg.includes('Backend server is unavailable') ||
        msg.includes('Failed to fetch') ||
        msg.includes('Unable to connect')
      ) {
        setErrorType('network');
        setError(msg);
      } else {
        setErrorType('auth');
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex flex-col justify-center items-center px-4 py-8 sm:px-6 lg:px-8 overflow-x-hidden text-slate-100 selection:bg-indigo-500 selection:text-white">

      {/* Brand Header */}
      <div className="w-full max-w-md mx-auto text-center mb-6 sm:mb-8">
        <div className="inline-flex items-center justify-center p-3.5 bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white rounded-2xl shadow-xl shadow-indigo-500/20 mb-3 sm:mb-4 ring-1 ring-white/20">
          <FileCheck className="w-7 h-7 sm:w-8 sm:h-8" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Three-Way Match Engine
        </h1>
        <p className="mt-1.5 text-xs sm:text-sm text-slate-400 max-w-xs sm:max-w-sm mx-auto leading-relaxed">
          Automated PO, GRN &amp; Invoice reconciliation with AI OCR extraction
        </p>
      </div>

      <div className="w-full max-w-[440px] mx-auto space-y-4">

        {/* ── Backend Not Configured Banner ── */}
        {!isConfigured && (
          <div className="bg-amber-950/50 border border-amber-700/70 rounded-2xl p-4 text-amber-200 text-xs space-y-3">
            <div className="flex items-start gap-2.5">
              <Server className="w-4 h-4 mt-0.5 shrink-0 text-amber-400" />
              <div>
                <p className="font-bold text-sm text-amber-100 mb-1">Backend Server Not Configured</p>
                <p className="leading-relaxed text-amber-300">
                  This app is running on GitHub Pages. To use it, enter the URL of your deployed backend server below.
                </p>
              </div>
            </div>
            <div className="bg-amber-900/30 rounded-xl p-3 text-[11px] font-mono text-amber-300 space-y-1 border border-amber-800/40">
              <p className="font-sans font-semibold text-amber-200 text-xs mb-1">Example backend URLs:</p>
              <p>https://inten-match.railway.app</p>
              <p>https://your-backend.onrender.com</p>
              <p>https://api.yourdomain.com</p>
            </div>
          </div>
        )}

        {/* URL Saved Confirmation */}
        {urlSaved && (
          <div className="bg-emerald-950/50 border border-emerald-700/60 rounded-xl p-3 flex items-center gap-2 text-emerald-300 text-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Backend URL saved. You can now sign in.</span>
          </div>
        )}

        {/* ── Runtime Backend URL Input ── */}
        {showUrlInput && (
          <div className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4 text-indigo-400 shrink-0" />
              <p className="text-xs font-semibold text-slate-200">Set Backend Server URL</p>
            </div>
            <div className="flex gap-2">
              <input
                type="url"
                id="backend-url-input"
                value={backendUrl}
                onChange={(e) => setBackendUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveUrl()}
                placeholder="https://your-backend.railway.app"
                className="flex-1 px-3 py-2 bg-slate-950/70 border border-slate-600 rounded-xl text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono placeholder:text-slate-500"
              />
              <button
                type="button"
                onClick={handleSaveUrl}
                disabled={!backendUrl.trim()}
                className="px-3 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-colors disabled:opacity-40 whitespace-nowrap"
              >
                Save
              </button>
            </div>
            {isConfigured && (
              <button
                type="button"
                onClick={() => setShowUrlInput(false)}
                className="text-[11px] text-slate-500 hover:text-slate-300 transition-colors"
              >
                Cancel — use {resolvedApiUrl}
              </button>
            )}
          </div>
        )}

        {/* ── Login Card ── */}
        <div className="bg-slate-900/85 backdrop-blur-md py-7 px-5 sm:px-8 shadow-2xl rounded-2xl border border-slate-800 ring-1 ring-white/5">
          <form className="space-y-4 sm:space-y-5" onSubmit={handleSubmit} noValidate>
            {/* Username */}
            <div>
              <label
                htmlFor="username-input"
                className="block text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5"
              >
                Username
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  id="username-input"
                  type="text"
                  required
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-950/70 border border-slate-700/80 rounded-xl text-white text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all font-mono placeholder:text-slate-500"
                  placeholder="admin"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password-input"
                className="block text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  id="password-input"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-950/70 border border-slate-700/80 rounded-xl text-white text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all font-mono placeholder:text-slate-500"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-1 rounded-md transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error Banner */}
            {error && (
              <div
                className={`p-3 rounded-xl border flex items-start gap-2.5 text-xs transition-all ${
                  errorType === 'network'
                    ? 'bg-amber-950/40 border-amber-800/80 text-amber-200'
                    : errorType === 'config'
                    ? 'bg-slate-800/60 border-slate-600/80 text-slate-200'
                    : 'bg-rose-950/50 border-rose-800/80 text-rose-200'
                }`}
                role="alert"
              >
                {errorType === 'network' ? (
                  <WifiOff className="w-4 h-4 mt-0.5 shrink-0 text-amber-400" />
                ) : errorType === 'config' ? (
                  <Server className="w-4 h-4 mt-0.5 shrink-0 text-slate-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-rose-400" />
                )}
                <div className="leading-relaxed">
                  <p className="font-semibold mb-0.5">
                    {errorType === 'network'
                      ? 'Connection Error'
                      : errorType === 'config'
                      ? 'Backend Not Configured'
                      : 'Authentication Failed'}
                  </p>
                  <p>{error}</p>
                  {errorType === 'network' && resolvedApiUrl && (
                    <p className="mt-1 font-mono text-[10px] text-amber-400 break-all">
                      Attempted: {resolvedApiUrl}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !isConfigured}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl shadow-lg shadow-indigo-600/25 text-sm sm:text-base font-semibold text-white bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-indigo-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 pt-5 border-t border-slate-800/90 space-y-3">
            <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Default credentials: admin / admin123</span>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 text-[11px]">
              <button
                type="button"
                onClick={() => { setUsername('admin'); setPassword('admin123'); setError(''); }}
                className="text-indigo-400 hover:text-indigo-300 hover:underline transition-all bg-indigo-950/40 border border-indigo-800/50 py-1.5 px-3 rounded-lg font-mono"
              >
                Fill Demo Credentials
              </button>
              <button
                type="button"
                onClick={() => setShowUrlInput(!showUrlInput)}
                className="text-slate-500 hover:text-slate-300 transition-all py-1.5 px-3 rounded-lg border border-slate-700/50 hover:border-slate-600 flex items-center gap-1"
              >
                <Settings className="w-3 h-3" />
                <span>Configure Backend URL</span>
              </button>
            </div>
          </div>
        </div>

        {/* API status footer */}
        <div className="text-center text-[10px] text-slate-600 font-mono pb-2">
          {resolvedApiUrl
            ? `API: ${resolvedApiUrl}`
            : 'API: Not configured — set backend URL above'}
        </div>
      </div>
    </div>
  );
}
