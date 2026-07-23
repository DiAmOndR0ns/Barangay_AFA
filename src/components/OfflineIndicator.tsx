import React from 'react';
import { RotateCw, AlertCircle } from 'lucide-react';

interface OfflineIndicatorProps {
  isOnline: boolean;
  queueCount: number;
  onSync: () => void;
  isSyncing: boolean;
}

export default function OfflineIndicator({
  isOnline,
  queueCount,
  onSync,
  isSyncing
}: OfflineIndicatorProps) {
  return (
    <div id="offline-indicator-wrapper" className="flex flex-wrap items-center gap-3 bg-slate-550 border border-slate-700/50 rounded-xl px-4 py-2.5 shadow-sm">
      <div className="flex items-center gap-2">
        <div className="relative">
          <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
          {isOnline && (
            <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping -top-0 -left-0" />
          )}
        </div>
        <span className="text-sm font-medium text-slate-200">
          {isOnline ? 'System Online' : 'System Offline (PWA Mode)'}
        </span>
      </div>

      <div className="h-4 w-[1px] bg-slate-700 hidden sm:block" />

      {/* Sync Status Info */}
      <div className="flex items-center gap-2">
        {queueCount > 0 ? (
          <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 rounded-full text-xs font-medium text-amber-400">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>{queueCount} pending sync</span>
          </div>
        ) : (
          <span className="text-xs text-slate-400">All data synchronized</span>
        )}
      </div>

      <div className="flex items-center gap-2 ml-auto">
        {/* Sync Trigger Button */}
        {queueCount > 0 && (
          <button
            id="sync-trigger-btn"
            disabled={!isOnline || isSyncing}
            onClick={onSync}
            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${
              !isOnline
                ? 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed'
                : isSyncing
                ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/30'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white border-transparent shadow-sm'
            }`}
          >
            <RotateCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
          </button>
        )}
      </div>
    </div>
  );
}
