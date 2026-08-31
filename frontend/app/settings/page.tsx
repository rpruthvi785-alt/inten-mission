'use client';

import React, { useState, useEffect } from 'react';
import {
  Settings, Server, CheckCircle2, Trash2,
  ExternalLink, Wifi, WifiOff, RefreshCw, ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';
import {
  getApiBaseUrl,
  getApiOverrideUrl,
  setApiOverrideUrl,
} from '../../lib/api';

type HealthStatus = 'idle' | 'checking' | 'ok' | 'error';

export default function SettingsPage() {
  const [backendUrl, setBackendUrl] = useState('');
  const [savedUrl, setSavedUrl] = useState('');
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(null);
  const [saveMsg, setSaveMsg] = useState('');
  const [healthStatus, setHealthStatus] = useState<HealthStatus>('idle');
  const [healthMsg, setHealthMsg] = useState('');
  const [healthData, setHealthData] = useState<any>(null);

  useEffect(() => {
    const override = getApiOverrideUrl();
    const resolved = getApiBaseUrl();
    setBackendUrl(override);
    setSavedUrl(override);
    setResolvedUrl(resolved);
  }, []);

  const handleSave = () => {
    const clean = backendUrl.trim().replace(/\/+$/, '');
    setApiOverrideUrl(clean);
    setSavedUrl(clean);
    setResolvedUrl(clean || getApiBaseUrl());
    setSaveMsg(clean ? 'Backend URL saved successfully.' : 'Backend URL cleared.');
    setHealthStatus('idle');
    setHealthData(null);
    setTimeout(() => setSaveMsg(''), 4000);
  };

  const handleClear = () => {
    setApiOverrideUrl('');
    setBackendUrl('');
    setSavedUrl('');
    setResolvedUrl(getApiBaseUrl());
    setSaveMsg('Backend URL override cleared. Using default.');
    setHealthStatus('idle');
    setHealthData(null);
    setTimeout(() => setSaveMsg(''), 4000);
  };

  const handleHealthCheck = async () => {
    const url = (backendUrl.trim() || resolvedUrl || '').replace(/\/+$/, '');
    if (!url) {
      setHealthStatus('error');
      setHealthMsg('No backend URL configured. Enter a URL first.');
      return;
    }

    setHealthStatus('checking');
    setHealthMsg('');
    setHealthData(null);

    try {
      let res = await fetch(`${url}/api/health`).catch(() => null);
      if (!res || !res.ok) {
        res = await fetch(`${url}/health`).catch(() => null);
      }
      if (res && res.ok) {
        const data = await res.json().catch(() => ({}));
        setHealthStatus('ok');
        setHealthData(data);
        setHealthMsg(`Backend is online. (${res.status} OK)`);
      } else {
        setHealthStatus('error');
        setHealthMsg(`Server responded with HTTP ${res ? res.status : 'ERR'}. Check the URL.`);
      }
    } catch (e: any) {
      setHealthStatus('error');
      if (e.message?.includes('Failed to fetch') || e.message?.includes('NetworkError')) {
        setHealthMsg(`Cannot reach ${url}. Check the URL and ensure the server is running.`);
      } else {
        setHealthMsg(e.message || 'Unknown connection error.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100 px-4 py-8 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Back to dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
              <Settings className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-400" />
              Settings
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
              Configure your backend server connection and application preferences.
            </p>
          </div>
        </div>

        {/* ── Backend URL Card ── */}
        <section className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-5">
          <div className="flex items-center gap-2.5">
            <Server className="w-5 h-5 text-indigo-400 shrink-0" />
            <div>
              <h2 className="font-bold text-white text-sm sm:text-base">Backend Server URL</h2>
              <p className="text-slate-400 text-xs mt-0.5">
                Set the URL of your deployed backend API server.
              </p>
            </div>
          </div>

          {/* Current resolved URL */}
          <div className="bg-slate-950/50 border border-slate-700/50 rounded-xl p-3 text-xs font-mono">
            <span className="text-slate-500 font-sans">Currently active: </span>
            {resolvedUrl ? (
              <span className="text-emerald-400 break-all">{resolvedUrl}</span>
            ) : (
              <span className="text-rose-400">Not configured</span>
            )}
          </div>

          {/* URL Input */}
          <div className="space-y-2">
            <label htmlFor="backend-url" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Runtime Override URL
            </label>
            <input
              id="backend-url"
              type="url"
              value={backendUrl}
              onChange={(e) => setBackendUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              placeholder="https://your-backend.railway.app"
              className="w-full px-3 py-2.5 bg-slate-950/70 border border-slate-600 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono placeholder:text-slate-500"
            />
            <p className="text-[11px] text-slate-500 leading-relaxed">
              This is saved in your browser's localStorage and overrides the build-time
              environment variable. Use this when accessing the app from GitHub Pages.
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <button
              id="save-backend-url"
              onClick={handleSave}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-colors min-h-[40px]"
            >
              <CheckCircle2 className="w-4 h-4" />
              Save URL
            </button>
            <button
              id="test-health"
              onClick={handleHealthCheck}
              disabled={healthStatus === 'checking'}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-slate-200 bg-slate-700 hover:bg-slate-600 rounded-xl transition-colors disabled:opacity-50 min-h-[40px]"
            >
              <RefreshCw className={`w-4 h-4 ${healthStatus === 'checking' ? 'animate-spin' : ''}`} />
              Test Connection
            </button>
            {savedUrl && (
              <button
                id="clear-backend-url"
                onClick={handleClear}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-rose-300 bg-rose-950/40 border border-rose-800/50 hover:bg-rose-900/40 rounded-xl transition-colors min-h-[40px]"
              >
                <Trash2 className="w-4 h-4" />
                Clear
              </button>
            )}
          </div>

          {/* Save Message */}
          {saveMsg && (
            <div className="flex items-center gap-2 text-xs text-emerald-300 bg-emerald-950/30 border border-emerald-800/40 rounded-lg p-2.5">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>{saveMsg}</span>
            </div>
          )}

          {/* Health Check Result */}
          {healthStatus !== 'idle' && (
            <div className={`rounded-xl p-3.5 text-xs space-y-2 border ${
              healthStatus === 'checking'
                ? 'bg-slate-800/50 border-slate-700 text-slate-300'
                : healthStatus === 'ok'
                ? 'bg-emerald-950/40 border-emerald-800/50 text-emerald-200'
                : 'bg-rose-950/40 border-rose-800/50 text-rose-200'
            }`}>
              <div className="flex items-center gap-2 font-semibold">
                {healthStatus === 'checking' ? (
                  <span className="flex items-center gap-1.5"><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Connecting...</span>
                ) : healthStatus === 'ok' ? (
                  <span className="flex items-center gap-1.5"><Wifi className="w-3.5 h-3.5 text-emerald-400" /> {healthMsg}</span>
                ) : (
                  <span className="flex items-center gap-1.5"><WifiOff className="w-3.5 h-3.5 text-rose-400" /> Connection Failed</span>
                )}
              </div>
              {healthStatus === 'error' && healthMsg && (
                <p className="leading-relaxed">{healthMsg}</p>
              )}
              {healthStatus === 'ok' && healthData && (
                <div className="font-mono bg-emerald-950/30 rounded-lg p-2.5 space-y-1 text-[10px] border border-emerald-900/40">
                  <p><span className="text-emerald-500">service:</span> {healthData.service || '–'}</p>
                  <p><span className="text-emerald-500">database:</span> {healthData.database?.status || '–'} ({healthData.database?.type || '–'})</p>
                  <p><span className="text-emerald-500">timestamp:</span> {healthData.timestamp || '–'}</p>
                </div>
              )}
            </div>
          )}
        </section>

        {/* ── Deploy Guide Card ── */}
        <section className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4">
          <h2 className="font-bold text-white text-sm sm:text-base flex items-center gap-2">
            <ExternalLink className="w-4 h-4 text-indigo-400" />
            Deploy Backend (Railway — Free Tier)
          </h2>
          <ol className="space-y-3 text-xs text-slate-300 list-none">
            {[
              { n: '1', text: 'Go to railway.app and create a free account.' },
              { n: '2', text: 'Click "New Project" → "Deploy from GitHub repo" → select your repo.' },
              { n: '3', text: 'Set the Root Directory to: backend' },
              { n: '4', text: 'Add environment variables from backend/.env.example' },
              { n: '5', text: 'Railway will auto-detect Node.js and deploy using railway.toml' },
              { n: '6', text: 'Copy your Railway URL (e.g. https://inten-match.railway.app)' },
              { n: '7', text: 'Paste it above → Save URL → Test Connection' },
              { n: '8', text: 'Add it to GitHub Actions secret NEXT_PUBLIC_API_URL for future builds' },
            ].map(({ n, text }) => (
              <li key={n} className="flex items-start gap-3">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-900/60 border border-indigo-700/60 text-indigo-300 flex items-center justify-center text-[10px] font-bold">
                  {n}
                </span>
                <span className="leading-relaxed pt-0.5">{text}</span>
              </li>
            ))}
          </ol>
          <a
            href="https://railway.app"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 hover:underline transition-colors"
          >
            Open Railway.app <ExternalLink className="w-3 h-3" />
          </a>
        </section>

        {/* ── GitHub Actions Secret Guide ── */}
        <section className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-3">
          <h2 className="font-bold text-white text-sm sm:text-base">
            Bake Backend URL into GitHub Pages Build
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Once you have a permanent backend URL, add it as a GitHub Actions secret so it gets
            baked into the static frontend bundle — no manual configuration needed on any device.
          </p>
          <div className="bg-slate-950/60 border border-slate-700/50 rounded-xl p-3 text-xs font-mono space-y-1">
            <p className="text-slate-400 font-sans font-semibold mb-2">Steps:</p>
            <p>1. GitHub repo → Settings → Secrets and variables → Actions</p>
            <p>2. New repository secret: <span className="text-indigo-300">NEXT_PUBLIC_API_URL</span></p>
            <p>3. Value: <span className="text-emerald-400">https://your-backend.railway.app</span></p>
            <p className="mt-3 font-sans text-slate-400">In .github/workflows/deploy.yml:</p>
            <p className="text-amber-300">NEXT_PUBLIC_API_URL: &#36;&#123;&#123; secrets.NEXT_PUBLIC_API_URL &#125;&#125;</p>
          </div>
        </section>

      </div>
    </div>
  );
}
