import React, { useState, useEffect } from 'react';
import { Database, CheckCircle2, AlertCircle, RefreshCw, X, Server, ShieldCheck, Key, ArrowRight, Layers } from 'lucide-react';

interface AivenTestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface TestResult {
  connected: boolean;
  status: 'success' | 'missing_config' | 'connection_error';
  message: string;
  details?: {
    databaseName: string;
    serverTime: string;
    version: string;
    publicTablesCount: number;
  };
  errorDetails?: string;
}

interface MigrationSummary {
  users: number;
  members: number;
  meetings: number;
  resolutions: number;
  financialTransactions: number;
  announcements: number;
  systemLogs: number;
  hogRaising: number;
  products: number;
  activities: number;
  funds?: number;
}

export const AivenTestModal: React.FC<AivenTestModalProps> = ({ isOpen, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);
  const [migrating, setMigrating] = useState(false);
  const [migrationSummary, setMigrationSummary] = useState<MigrationSummary | null>(null);
  const [migrationMessage, setMigrationMessage] = useState<string | null>(null);

  const runConnectionTest = async () => {
    setLoading(true);
    setResult(null);
    try {
      const response = await fetch('/api/db-test');
      const text = await response.text();
      let data: any;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(text.substring(0, 300) || `Server returned status ${response.status}`);
      }
      setResult(data);
    } catch (err: any) {
      setResult({
        connected: false,
        status: 'connection_error',
        message: 'Could not reach server endpoint (/api/db-test). The server may still be initializing or returned an unexpected response.',
        errorDetails: err.message || err.toString(),
      });
    } finally {
      setLoading(false);
    }
  };

  const runSeedMigration = async () => {
    setMigrating(true);
    setMigrationMessage(null);
    try {
      const response = await fetch('/api/migrate-seed', { method: 'POST' });
      const text = await response.text();
      let data: any;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(text.substring(0, 300) || `Server returned status ${response.status}`);
      }
      if (data.success) {
        setMigrationSummary(data.summary);
        setMigrationMessage('✅ Seed data successfully migrated to Aiven PostgreSQL!');
        // Refresh connection test to show updated table count
        runConnectionTest();
      } else {
        setMigrationMessage(`❌ Migration failed: ${data.message}`);
      }
    } catch (err: any) {
      setMigrationMessage(`❌ Error contacting migration endpoint: ${err.message}`);
    } finally {
      setMigrating(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      runConnectionTest();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#FAF8F5] w-full max-w-xl rounded-3xl border-2 border-[#2D6A4F] shadow-2xl overflow-hidden text-[#1C2826] animate-in fade-in zoom-in duration-200">
        
        {/* MODAL HEADER */}
        <div className="bg-[#1B4332] text-white p-5 px-6 flex items-center justify-between border-b border-[#2D6A4F]">
          <div className="flex items-center gap-3">
            <div className="bg-[#D8F3DC] p-2.5 rounded-2xl text-[#1B4332]">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black font-display text-white tracking-tight">
                Aiven PostgreSQL Cloud Database
              </h3>
              <p className="text-xs text-[#D8F3DC]/80 font-medium">
                Connection Status & Seed Data Migration Tool
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-xl transition-colors text-white/80 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="p-6 space-y-6 text-sm">
          
          {/* Action Header */}
          <div className="flex items-center justify-between bg-[#E8F5E9] p-4 rounded-2xl border border-[#A5D6A7]">
            <div className="flex items-center gap-2">
              <Server className="w-5 h-5 text-[#1B4332]" />
              <span className="font-bold text-[#1B4332] text-xs sm:text-sm">
                Target: Managed Aiven PostgreSQL Cloud
              </span>
            </div>
            <button
              onClick={runConnectionTest}
              disabled={loading || migrating}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1B4332] hover:bg-[#2D6A4F] text-white font-bold text-xs rounded-xl transition-all cursor-pointer disabled:opacity-50 shadow-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'Testing...' : 'Retest Connection'}</span>
            </button>
          </div>

          {/* LOADING STATE */}
          {loading && (
            <div className="py-8 flex flex-col items-center justify-center space-y-3 text-center">
              <RefreshCw className="w-8 h-8 text-[#2D6A4F] animate-spin" />
              <p className="text-xs font-bold text-[#2D6A4F]">Ping Aiven PostgreSQL database...</p>
              <p className="text-[11px] text-slate-500">Establishing SSL handshake & querying PostgreSQL system tables</p>
            </div>
          )}

          {/* RESULTS STATE */}
          {!loading && result && (
            <div className="space-y-4">
              
              {/* SUCCESS STATE */}
              {result.connected && result.status === 'success' && (
                <div className="bg-emerald-50 border-2 border-emerald-500 p-5 rounded-2xl text-emerald-950 space-y-4">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                    <div>
                      <h4 className="font-black text-emerald-900 text-base">Database Connected!</h4>
                      <p className="text-xs font-semibold text-emerald-700">{result.message}</p>
                    </div>
                  </div>

                  {result.details && (
                    <div className="pt-3 border-t border-emerald-200/80 grid grid-cols-2 gap-3 text-xs font-mono">
                      <div className="bg-white/80 p-2.5 rounded-xl border border-emerald-200">
                        <span className="text-[10px] text-emerald-700 block uppercase font-sans font-bold">Database Name</span>
                        <span className="font-bold text-emerald-900">{result.details.databaseName}</span>
                      </div>
                      <div className="bg-white/80 p-2.5 rounded-xl border border-emerald-200">
                        <span className="text-[10px] text-emerald-700 block uppercase font-sans font-bold">Public Tables</span>
                        <span className="font-bold text-emerald-900">{result.details.publicTablesCount} tables active</span>
                      </div>
                      <div className="bg-white/80 p-2.5 rounded-xl border border-emerald-200 col-span-2">
                        <span className="text-[10px] text-emerald-700 block uppercase font-sans font-bold">PostgreSQL Engine</span>
                        <span className="font-bold text-emerald-900 text-[11px] truncate block">{result.details.version}</span>
                      </div>
                    </div>
                  )}

                  {/* SEED MIGRATION SECTION */}
                  <div className="mt-4 pt-4 border-t border-emerald-300 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-emerald-950 font-bold text-xs">
                        <Layers className="w-4 h-4 text-emerald-700" />
                        <span>Seed Data Migration Status</span>
                      </div>
                      <button
                        onClick={runSeedMigration}
                        disabled={migrating}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2D6A4F] hover:bg-[#1B4332] text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-xs disabled:opacity-50"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${migrating ? 'animate-spin' : ''}`} />
                        <span>{migrating ? 'Migrating Data...' : 'Re-Migrate Seed Data'}</span>
                      </button>
                    </div>

                    {migrationMessage && (
                      <p className="text-xs font-bold text-emerald-900 bg-white/90 p-2.5 rounded-xl border border-emerald-300">
                        {migrationMessage}
                      </p>
                    )}

                    {migrationSummary && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 font-mono text-[11px]">
                        <div className="bg-white p-2 rounded-lg border border-emerald-200">
                          <span className="text-emerald-700 block text-[9px] font-sans font-bold">USERS</span>
                          <span className="font-bold text-emerald-950">{migrationSummary.users} rows</span>
                        </div>
                        <div className="bg-white p-2 rounded-lg border border-emerald-200">
                          <span className="text-emerald-700 block text-[9px] font-sans font-bold">MEMBERS</span>
                          <span className="font-bold text-emerald-950">{migrationSummary.members} rows</span>
                        </div>
                        <div className="bg-white p-2 rounded-lg border border-emerald-200">
                          <span className="text-emerald-700 block text-[9px] font-sans font-bold">MEETINGS</span>
                          <span className="font-bold text-emerald-950">{migrationSummary.meetings} rows</span>
                        </div>
                        <div className="bg-white p-2 rounded-lg border border-emerald-200">
                          <span className="text-emerald-700 block text-[9px] font-sans font-bold">RESOLUTIONS</span>
                          <span className="font-bold text-emerald-950">{migrationSummary.resolutions} rows</span>
                        </div>
                        <div className="bg-white p-2 rounded-lg border border-emerald-200">
                          <span className="text-emerald-700 block text-[9px] font-sans font-bold">TRANSACTIONS</span>
                          <span className="font-bold text-emerald-950">{migrationSummary.financialTransactions} rows</span>
                        </div>
                        <div className="bg-white p-2 rounded-lg border border-emerald-200">
                          <span className="text-emerald-700 block text-[9px] font-sans font-bold">FUNDS</span>
                          <span className="font-bold text-emerald-950">{migrationSummary.funds ?? 4} funds</span>
                        </div>
                        <div className="bg-white p-2 rounded-lg border border-emerald-200">
                          <span className="text-emerald-700 block text-[9px] font-sans font-bold">PRODUCTS</span>
                          <span className="font-bold text-emerald-950">{migrationSummary.products} rows</span>
                        </div>
                      </div>
                    )}
                  </div>

                </div>
              )}

              {/* MISSING CONFIG STATE */}
              {!result.connected && result.status === 'missing_config' && (
                <div className="bg-amber-50 border-2 border-amber-400 p-5 rounded-2xl text-amber-950 space-y-4">
                  <div className="flex items-center gap-2.5">
                    <AlertCircle className="w-6 h-6 text-amber-600 shrink-0" />
                    <div>
                      <h4 className="font-black text-amber-900 text-base">DATABASE_URL Not Configured</h4>
                      <p className="text-xs font-semibold text-amber-800">{result.message}</p>
                    </div>
                  </div>

                  <div className="bg-white/90 p-4 rounded-xl border border-amber-200 space-y-2 text-xs">
                    <div className="flex items-center gap-2 text-amber-900 font-bold">
                      <Key className="w-4 h-4 text-amber-600" />
                      <span>How to add your Aiven Connection String:</span>
                    </div>
                    <ol className="list-decimal list-inside text-amber-900 space-y-1.5 pl-1 font-medium text-[12px]">
                      <li>Open the <strong>Settings</strong> menu in AI Studio (gear icon top right).</li>
                      <li>Find the environment variable <strong>DATABASE_URL</strong>.</li>
                      <li>Paste your Aiven URI:
                        <code className="block mt-1 bg-amber-100 p-2 rounded text-[11px] font-mono break-all font-bold text-amber-950">
                          postgres://avnadmin:YOUR_PASSWORD@your-aiven-host.aivencloud.com:12345/defaultdb?sslmode=require
                        </code>
                      </li>
                      <li>Save settings and click <strong>"Retest Connection"</strong> above!</li>
                    </ol>
                  </div>
                </div>
              )}

              {/* CONNECTION ERROR STATE */}
              {!result.connected && result.status === 'connection_error' && (
                <div className="bg-rose-50 border-2 border-rose-400 p-5 rounded-2xl text-rose-950 space-y-3">
                  <div className="flex items-center gap-2.5">
                    <AlertCircle className="w-6 h-6 text-rose-600 shrink-0" />
                    <div>
                      <h4 className="font-black text-rose-900 text-base">Connection Failed</h4>
                      <p className="text-xs font-semibold text-rose-800">{result.message}</p>
                    </div>
                  </div>

                  {result.errorDetails && (
                    <div className="bg-rose-950 text-rose-200 p-3 rounded-xl font-mono text-[11px] overflow-x-auto max-h-32 border border-rose-800">
                      {result.errorDetails}
                    </div>
                  )}

                  {/* Troubleshooting Guide */}
                  <div className="bg-white/90 p-3.5 rounded-xl border border-rose-200 text-xs text-rose-950 space-y-2">
                    <span className="font-bold text-rose-900 block uppercase text-[10px] tracking-wider">Top 4 Common Fixes:</span>
                    <ul className="space-y-1.5 list-disc list-inside text-[11px] leading-relaxed">
                      <li><strong>Aiven IP Filter:</strong> In your Aiven Console &gt; Service &gt; <em>IP Filter</em>, make sure access is allowed or set to <code className="bg-rose-100 px-1 py-0.5 rounded font-mono font-bold">0.0.0.0/0</code> so Cloud Run can connect.</li>
                      <li><strong>Special Characters in Password:</strong> If your password contains symbols like <code className="bg-rose-100 px-1 py-0.5 rounded font-mono">@ # % & ?</code>, URL-encode them (e.g. replace <code className="bg-rose-100 px-1 py-0.5 rounded font-mono">@</code> with <code className="bg-rose-100 px-1 py-0.5 rounded font-mono">%40</code>).</li>
                      <li><strong>Aiven Service State:</strong> Ensure your PostgreSQL service is in <strong>RUNNING</strong> state (not Powered Off or Rebuilding).</li>
                      <li><strong>Service URI Format:</strong> Use the complete Service URI from Aiven: <code className="bg-rose-100 px-1 py-0.5 rounded font-mono text-[10px] break-all">postgres://avnadmin:PASSWORD@HOST:PORT/defaultdb?sslmode=require</code></li>
                    </ul>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* FOOTER NOTES */}
          <div className="bg-[#F0EAE1] p-4 rounded-2xl border border-[#D5C8B5] text-xs text-[#4A3B2C] flex items-start gap-2.5">
            <ShieldCheck className="w-5 h-5 text-[#2D6A4F] shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-[#1C2826]">Database Security Guarantee:</p>
              <p className="text-[11px] text-[#2D3A22] mt-0.5 font-medium">
                Your Aiven connection credentials remain strictly protected inside server environment variables (<code className="font-bold">DATABASE_URL</code>) and are never exposed to the client browser.
              </p>
            </div>
          </div>

        </div>

        {/* MODAL FOOTER */}
        <div className="bg-[#EFEAE1] px-6 py-4 border-t border-[#D5C8B5] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-[#1B4332] hover:bg-[#2D6A4F] text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
