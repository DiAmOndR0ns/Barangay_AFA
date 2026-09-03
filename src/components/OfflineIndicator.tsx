import React, { useState } from 'react';
import { 
  RotateCw, 
  AlertCircle, 
  Database, 
  HardDrive, 
  CheckCircle2, 
  X, 
  RefreshCw,
  Server,
  Zap
} from 'lucide-react';
import { DatabaseStatus } from '../types';

interface OfflineIndicatorProps {
  isOnline: boolean;
  queueCount: number;
  onSync: () => void;
  isSyncing: boolean;
  dbStatus?: DatabaseStatus;
  onCheckDb?: () => void;
}

export default function OfflineIndicator({
  isOnline,
  queueCount,
  onSync,
  isSyncing,
  dbStatus,
  onCheckDb
}: OfflineIndicatorProps) {
  const [showDbModal, setShowDbModal] = useState(false);

  const isConnected = dbStatus?.connected === true;
  const isConfigured = dbStatus?.configured === true;
  const isChecking = dbStatus?.checking === true;
  const providerName = dbStatus?.provider || (isConfigured ? 'Supabase' : 'Local Storage');

  return (
    <>
      <div 
        id="offline-indicator-wrapper" 
        className="flex flex-wrap items-center gap-2.5 bg-slate-850/90 border border-slate-700/60 rounded-xl px-3 py-1.5 shadow-sm text-xs"
      >
        {/* Network Online/Offline Dot */}
        <div className="flex items-center gap-1.5 pr-1" title={isOnline ? "Network is connected" : "Network is offline"}>
          <div className="relative flex items-center justify-center">
            <div className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            {isOnline && (
              <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-70 animate-ping" />
            )}
          </div>
          <span className="text-[11px] font-medium text-slate-300 hidden md:inline">
            {isOnline ? 'Online' : 'Offline'}
          </span>
        </div>

        <div className="h-3.5 w-[1px] bg-slate-700/80" />

        {/* Database Connection Status Badge (Clickable to view details) */}
        <button
          id="database-status-badge"
          type="button"
          onClick={() => setShowDbModal(true)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-semibold text-[11px] transition-all cursor-pointer select-none ${
            isChecking
              ? 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
              : isConnected
              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/25 hover:border-emerald-500/50'
              : isConfigured
              ? 'bg-rose-500/15 text-rose-300 border-rose-500/30 hover:bg-rose-500/25 hover:border-rose-500/50'
              : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-750'
          }`}
          title="Click to view Database Connection details"
        >
          {isChecking ? (
            <>
              <RefreshCw className="w-3 h-3 animate-spin text-slate-400" />
              <span>Checking DB...</span>
            </>
          ) : isConnected ? (
            <>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
              </span>
              <Database className="w-3 h-3 text-emerald-400" />
              <span className="font-bold">{providerName}: Connected</span>
            </>
          ) : isConfigured ? (
            <>
              <AlertCircle className="w-3 h-3 text-rose-400" />
              <span className="font-bold">{providerName}: Disconnected</span>
            </>
          ) : (
            <>
              <HardDrive className="w-3 h-3 text-slate-400" />
              <span className="text-slate-300">Local Storage</span>
            </>
          )}
        </button>

        {/* Sync Status Info */}
        {queueCount > 0 ? (
          <div className="flex items-center gap-1 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-md text-[11px] font-semibold text-amber-400">
            <AlertCircle className="w-3 h-3" />
            <span>{queueCount} pending</span>
          </div>
        ) : null}

        {/* Sync Trigger Button */}
        {queueCount > 0 && (
          <button
            id="sync-trigger-btn"
            disabled={!isOnline || isSyncing}
            onClick={onSync}
            className={`flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
              !isOnline
                ? 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed'
                : isSyncing
                ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/30'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white border-transparent shadow-sm'
            }`}
          >
            <RotateCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Syncing...' : 'Sync'}</span>
          </button>
        )}
      </div>

      {/* MODAL: DATABASE CONNECTION AUDIT & DETAILS */}
      {showDbModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-4"
          onClick={() => setShowDbModal(false)}
        >
          <div 
            className="bg-slate-900 border border-slate-750 text-slate-100 rounded-2xl w-full max-w-md shadow-2xl p-5 space-y-4 relative text-left"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-xl ${isConnected ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-300'}`}>
                  <Server className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white font-display">
                    Database Connection Status
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Live audit & sync engine connectivity
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowDbModal(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Status Card */}
            <div className={`p-4 rounded-xl border space-y-2 ${
              isConnected
                ? 'bg-emerald-950/30 border-emerald-500/40'
                : isConfigured
                ? 'bg-rose-950/30 border-rose-500/40'
                : 'bg-slate-800/60 border-slate-750'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Target Provider
                </span>
                <span className={`text-xs font-black px-2 py-0.5 rounded-full ${
                  isConnected 
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                    : isConfigured
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    : 'bg-slate-700 text-slate-300'
                }`}>
                  {isConnected ? '● Connected' : isConfigured ? '✕ Disconnected' : '○ Local Storage'}
                </span>
              </div>

              <div className="text-base font-extrabold text-white flex items-center gap-1.5">
                {isConnected ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : isConfigured ? (
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                ) : (
                  <HardDrive className="w-4 h-4 text-slate-400 shrink-0" />
                )}
                <span>{providerName}</span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                {dbStatus?.message || (
                  isConnected 
                    ? 'Your application is connected to the cloud database. Member registrations, funds, meetings, and logs are automatically synchronized.'
                    : isConfigured
                    ? 'A connection string is configured, but the database could not be reached. Verify your credentials, password, and network access.'
                    : 'Running in offline-first mode. All data is saved safely in your browser local storage.'
                )}
              </p>

              {dbStatus?.database && (
                <div className="pt-1 text-[11px] text-slate-400 flex items-center gap-1">
                  <span>Database:</span>
                  <code className="bg-slate-900/80 px-1.5 py-0.5 rounded text-emerald-300 font-mono text-[10px]">
                    {dbStatus.database}
                  </code>
                </div>
              )}

              {dbStatus?.timestamp && (
                <div className="text-[10px] text-slate-500">
                  Last verified: {new Date(dbStatus.timestamp).toLocaleTimeString()}
                </div>
              )}
            </div>

            {/* Quick Explanation / Setup Tips */}
            <div className="bg-slate-800/40 border border-slate-750 p-3 rounded-xl space-y-1.5 text-xs text-slate-300">
              <span className="font-bold text-white block text-[11px] uppercase tracking-wider flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>How Connection Works</span>
              </span>
              <p className="text-[11px] leading-relaxed text-slate-400">
                {isConnected ? (
                  <>Changes made in the portal are immediately mirrored to Supabase. When offline, changes queue up locally and sync when back online.</>
                ) : (
                  <>To connect Supabase, configure your <code className="bg-slate-900 px-1 py-0.5 rounded text-amber-300 font-mono text-[10px]">DATABASE_URL</code> in project settings. The tables will auto-initialize on first connection.</>
                )}
              </p>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                disabled={isChecking}
                onClick={() => {
                  if (onCheckDb) onCheckDb();
                }}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-750 text-white rounded-xl text-xs font-bold transition-all border border-slate-700 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} />
                <span>{isChecking ? 'Checking...' : 'Test Connection'}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowDbModal(false)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
