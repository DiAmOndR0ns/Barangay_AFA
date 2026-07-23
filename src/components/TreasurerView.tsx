import React, { useState } from 'react';
import { FinancialTransaction, OfficerRole } from '../types';
import { 
  Coins, ArrowUpRight, ArrowDownRight, Plus, 
  Search, ShieldCheck, AlertTriangle, CheckCircle, 
  XCircle, Filter, FileText, Info
} from 'lucide-react';

interface TreasurerViewProps {
  transactions: FinancialTransaction[];
  onAddTransaction: (tx: Omit<FinancialTransaction, 'id' | 'auditedStatus'>) => void;
  onAuditTransaction: (id: string, status: 'Audited' | 'Flagged', notes: string) => void;
  currentRole: OfficerRole;
  onOpenReportModal?: () => void;
}

export default function TreasurerView({
  transactions,
  onAddTransaction,
  onAuditTransaction,
  currentRole,
  onOpenReportModal
}: TreasurerViewProps) {
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [filterAudit, setFilterAudit] = useState<'all' | 'Unaudited' | 'Audited' | 'Flagged'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [selectedTxId, setSelectedTxId] = useState<string | null>(null);

  // Add Transaction Form
  const [txType, setTxType] = useState<'income' | 'expense'>('income');
  const [txCategory, setTxCategory] = useState('Membership Dues');
  const [txAmount, setTxAmount] = useState('');
  const [txDate, setTxDate] = useState(new Date().toISOString().split('T')[0]);
  const [txDesc, setTxDesc] = useState('');

  // Audit Form
  const [auditStatus, setAuditStatus] = useState<'Audited' | 'Flagged'>('Audited');
  const [auditNotes, setAuditNotes] = useState('');

  const CATEGORIES = {
    income: ['Membership Dues', 'Donation', 'Government Grant', 'Produce Sales', 'Coop Fee', 'Other Income'],
    expense: ['Seeds & Seedlings', 'Fertilizer Depot', 'Equipment Purchase', 'Equipment Maintenance', 'Meeting Snacks & Logistics', 'Honorarium', 'Other Expense']
  };

  const calculateBalances = () => {
    let income = 0;
    let expenses = 0;
    transactions.forEach(t => {
      if (t.type === 'income') income += t.amount;
      else expenses += t.amount;
    });
    return {
      total: income - expenses,
      income,
      expenses
    };
  };

  const { total: currentBalance, income: totalIncome, expenses: totalExpenses } = calculateBalances();

  const handleTypeChange = (type: 'income' | 'expense') => {
    setTxType(type);
    setTxCategory(CATEGORIES[type][0]);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!txAmount || parseFloat(txAmount) <= 0 || !txDesc.trim()) return;
    onAddTransaction({
      type: txType,
      category: txCategory,
      amount: parseFloat(txAmount),
      date: txDate,
      description: txDesc,
      recordedBy: 'Treasurer (Gracelyn P Asendiente)'
    });
    setTxAmount('');
    setTxDesc('');
    setTxDate(new Date().toISOString().split('T')[0]);
    setShowAddModal(false);
  };

  const handleAuditClick = (txId: string, defaultStatus: 'Audited' | 'Flagged') => {
    setSelectedTxId(txId);
    setAuditStatus(defaultStatus);
    setAuditNotes('');
    setShowAuditModal(true);
  };

  const handleAuditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTxId) return;
    onAuditTransaction(selectedTxId, auditStatus, auditNotes.trim() || 'No audit comments.');
    setSelectedTxId(null);
    setShowAuditModal(false);
  };

  // Filter Transactions
  const filteredTx = transactions.filter(t => {
    const matchesType = filterType === 'all' || t.type === filterType;
    const matchesAudit = filterAudit === 'all' || t.auditedStatus === filterAudit;
    return matchesType && matchesAudit;
  });

  const isAuditor = currentRole === 'Auditor';

  return (
    <div id="treasurer-view-container" className="space-y-6">
      {/* FINANCIAL OVERVIEW CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total General Funds */}
        <div className="bg-slate-800 border border-slate-700/50 p-5 rounded-2xl shadow-md relative overflow-hidden">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Association General Fund</span>
            <Coins className="w-5 h-5 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-white font-mono">
            PHP {currentBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-[10px] text-emerald-400 mt-1 flex items-center gap-1 font-medium">
            <span>● Account active</span>
            <span className="text-slate-500 font-normal">| Barangay Alegria, Tuburan</span>
          </p>
        </div>

        {/* Total Income */}
        <div className="bg-slate-800 border border-slate-700/50 p-5 rounded-2xl shadow-md relative overflow-hidden">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Income</span>
            <div className="bg-emerald-500/10 p-1.5 rounded-lg border border-emerald-500/10">
              <ArrowUpRight className="w-4 h-4 text-emerald-400" />
            </div>
          </div>
          <div className="text-xl font-bold text-emerald-400 font-mono">
            + PHP {totalIncome.toLocaleString('en-US')}
          </div>
          <p className="text-[10px] text-slate-500 mt-2">Dues, donations, sales & grants</p>
        </div>

        {/* Total Expenses */}
        <div className="bg-slate-800 border border-slate-700/50 p-5 rounded-2xl shadow-md relative overflow-hidden">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Expenditures</span>
            <div className="bg-rose-500/10 p-1.5 rounded-lg border border-rose-500/10">
              <ArrowDownRight className="w-4 h-4 text-rose-400" />
            </div>
          </div>
          <div className="text-xl font-bold text-rose-400 font-mono">
            - PHP {totalExpenses.toLocaleString('en-US')}
          </div>
          <p className="text-[10px] text-slate-500 mt-2">Equipment, snacks, maintenance & seeds</p>
        </div>
      </div>

      {/* OFFICER SUMMARY DESCRIPTION AND TOOLS */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-800 p-4 rounded-2xl border border-slate-700/65">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Coins className="w-5 h-5 text-emerald-400" />
            <span>{isAuditor ? 'Auditor Financial Oversight' : 'Treasurer Financial Ledger'}</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            {isAuditor 
              ? 'Verify association transaction records and highlight any financial discrepancies.' 
              : 'Record all incoming payments, member dues, and association expenses.'}
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {onOpenReportModal && (
            <button
              id="treasurer-report-btn"
              type="button"
              onClick={onOpenReportModal}
              className="flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold bg-slate-900 hover:bg-slate-850 text-emerald-400 border border-emerald-500/30 rounded-xl shadow-sm transition-all w-full md:w-auto cursor-pointer"
            >
              <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{isAuditor ? 'Export Auditor Report' : 'Export Financial Report'}</span>
            </button>
          )}

          {!isAuditor ? (
            <button
              id="record-tx-btn"
              onClick={() => setShowAddModal(true)}
              className="flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-sm transition-all w-full md:w-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Log Transaction</span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5 bg-slate-900 px-3 py-2 rounded-xl border border-slate-700/60 text-xs text-emerald-400 font-semibold w-full md:w-auto justify-center">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>Auditor Active Security Mode</span>
            </div>
          )}
        </div>
      </div>

      {/* FILTER & LEDGER LIST */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between gap-3 bg-slate-900/40 p-3 rounded-xl border border-slate-750">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase shrink-0">
            <Filter className="w-3.5 h-3.5" />
            <span>Filters:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="px-3 py-1.5 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="all">All Types</option>
              <option value="income">Income Only</option>
              <option value="expense">Expenses Only</option>
            </select>

            <select
              value={filterAudit}
              onChange={(e) => setFilterAudit(e.target.value as any)}
              className="px-3 py-1.5 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="all">All Audit Statuses</option>
              <option value="Unaudited">Unaudited</option>
              <option value="Audited">Audited</option>
              <option value="Flagged">Flagged / Action Required</option>
            </select>
          </div>
        </div>

        <div className="space-y-3">
          {filteredTx.length > 0 ? (
            filteredTx.map((tx) => (
              <div 
                key={tx.id} 
                className={`bg-slate-800 border rounded-2xl p-4.5 transition-all shadow-sm flex flex-col md:flex-row justify-between gap-4 ${
                  tx.auditedStatus === 'Flagged' 
                    ? 'border-red-500/30 bg-gradient-to-r from-slate-800 to-red-950/10' 
                    : tx.auditedStatus === 'Audited' 
                    ? 'border-emerald-500/10' 
                    : 'border-slate-700/50'
                }`}
              >
                {/* LHS: Info */}
                <div className="flex items-start gap-3.5">
                  <div className={`p-2.5 rounded-xl shrink-0 border ${
                    tx.type === 'income' 
                      ? 'bg-emerald-950/40 border-emerald-500/20 text-emerald-400' 
                      : 'bg-rose-950/40 border-rose-500/20 text-rose-400'
                  }`}>
                    {tx.type === 'income' ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="text-xs font-semibold text-slate-400 bg-slate-900 px-2 py-0.5 rounded-lg border border-slate-700">
                        {tx.category}
                      </span>
                      <span className="text-xs text-slate-500 font-mono">{tx.date}</span>
                    </div>
                    <p className="text-sm font-semibold text-white mt-1.5">{tx.description}</p>
                    <p className="text-[10px] text-slate-500 mt-1">Logged by: {tx.recordedBy}</p>

                    {/* Audit Details Sub-Block */}
                    {tx.auditedStatus !== 'Unaudited' && (
                      <div className={`mt-3 p-2.5 rounded-xl text-xs border ${
                        tx.auditedStatus === 'Flagged'
                          ? 'bg-red-500/5 border-red-500/20 text-red-300'
                          : 'bg-emerald-500/5 border-emerald-500/10 text-emerald-300'
                      }`}>
                        <div className="flex items-center gap-1.5 font-bold mb-0.5">
                          {tx.auditedStatus === 'Flagged' ? (
                            <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                          ) : (
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          )}
                          <span>
                            {tx.auditedStatus === 'Flagged' ? 'Audit Note / Flagged' : 'Audited and Approved'}
                          </span>
                        </div>
                        <p className="leading-relaxed text-slate-300 italic">"{tx.auditNotes}"</p>
                        <p className="text-[9px] text-slate-500 mt-1 font-mono">
                          By: {tx.auditedBy} on {tx.auditedDate}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* RHS: Value and Action */}
                <div className="flex md:flex-col justify-between items-end gap-3 shrink-0 border-t md:border-t-0 border-slate-750 pt-3 md:pt-0">
                  <div className={`text-lg font-bold font-mono ${tx.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {tx.type === 'income' ? '+' : '-'} PHP {tx.amount.toLocaleString()}
                  </div>

                  {/* Audit Actions (Visible to Auditor) */}
                  {isAuditor ? (
                    tx.auditedStatus === 'Unaudited' ? (
                      <div className="flex gap-2">
                        <button
                          id={`flag-btn-${tx.id}`}
                          onClick={() => handleAuditClick(tx.id, 'Flagged')}
                          className="flex items-center gap-1 text-[11px] font-bold text-red-400 bg-red-950/30 hover:bg-red-900/30 border border-red-500/20 px-2.5 py-1 rounded-lg transition-all"
                        >
                          <AlertTriangle className="w-3 h-3" />
                          <span>Flag</span>
                        </button>
                        <button
                          id={`verify-btn-${tx.id}`}
                          onClick={() => handleAuditClick(tx.id, 'Audited')}
                          className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-950/30 hover:bg-emerald-900/30 border border-emerald-500/20 px-2.5 py-1 rounded-lg transition-all"
                        >
                          <ShieldCheck className="w-3 h-3" />
                          <span>Approve</span>
                        </button>
                      </div>
                    ) : (
                      <button
                        id={`re-audit-${tx.id}`}
                        onClick={() => handleAuditClick(tx.id, tx.auditedStatus === 'Audited' ? 'Audited' : 'Flagged')}
                        className="text-[10px] text-slate-500 hover:text-slate-300 underline font-medium transition-colors"
                      >
                        Re-evaluate Audit
                      </button>
                    )
                  ) : (
                    /* Display Audit Status Badge to Treasurer */
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                      tx.auditedStatus === 'Audited'
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : tx.auditedStatus === 'Flagged'
                        ? 'bg-red-500/10 text-red-400 animate-pulse'
                        : 'bg-slate-700 text-slate-400'
                    }`}>
                      {tx.auditedStatus}
                    </span>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="bg-slate-800 border border-slate-700/50 rounded-2xl p-8 text-center text-slate-500">
              No transactions match selected filter.
            </div>
          )}
        </div>
      </div>

      {/* TREASURER ADD TRANSACTION MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-slate-800 border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-slate-900 px-5 py-4 border-b border-slate-700 flex justify-between items-center">
              <h3 className="font-bold text-white text-base">Record Financial Transaction</h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleAddSubmit} className="p-5 space-y-4">
              {/* Type Switcher */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-2">Ledger Flow</label>
                <div className="grid grid-cols-2 gap-2 bg-slate-900 p-1 rounded-xl border border-slate-750">
                  <button
                    type="button"
                    onClick={() => handleTypeChange('income')}
                    className={`py-2 text-xs font-bold rounded-lg transition-all ${
                      txType === 'income' 
                        ? 'bg-emerald-600 text-white shadow-sm' 
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Income (Inflow)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTypeChange('expense')}
                    className={`py-2 text-xs font-bold rounded-lg transition-all ${
                      txType === 'expense' 
                        ? 'bg-rose-700 text-white shadow-sm' 
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Expenditure (Outflow)
                  </button>
                </div>
              </div>

              {/* Amount and Date */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Amount (PHP)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    placeholder="e.g. 500"
                    value={txAmount}
                    onChange={(e) => setTxAmount(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-900 border border-slate-750 rounded-xl text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={txDate}
                    onChange={(e) => setTxDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-900 border border-slate-750 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Category</label>
                <select
                  value={txCategory}
                  onChange={(e) => setTxCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-900 border border-slate-750 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                >
                  {CATEGORIES[txType].map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Receipt Note & Description</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Details of collection, payee or specific items bought..."
                  value={txDesc}
                  onChange={(e) => setTxDesc(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-900 border border-slate-750 rounded-xl text-white focus:outline-none focus:border-emerald-500 font-sans"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 text-sm font-semibold bg-slate-700 hover:bg-slate-650 text-slate-200 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`flex-1 py-2.5 text-sm font-semibold text-white rounded-xl shadow-sm transition-all ${
                    txType === 'income' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-rose-700 hover:bg-rose-650'
                  }`}
                >
                  Record Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AUDITOR REVIEW MODAL */}
      {showAuditModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-slate-800 border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-slate-900 px-5 py-4 border-b border-slate-700 flex justify-between items-center">
              <h3 className="font-bold text-white text-base">Conduct Financial Audit</h3>
              <button 
                onClick={() => { setSelectedTxId(null); setShowAuditModal(false); }}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleAuditSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-2">Audit Verdict</label>
                <div className="grid grid-cols-2 gap-2 bg-slate-900 p-1 rounded-xl border border-slate-750">
                  <button
                    type="button"
                    onClick={() => setAuditStatus('Audited')}
                    className={`flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-lg transition-all ${
                      auditStatus === 'Audited' 
                        ? 'bg-emerald-600 text-white shadow-sm' 
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Verify & Approve</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAuditStatus('Flagged')}
                    className={`flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-lg transition-all ${
                      auditStatus === 'Flagged' 
                        ? 'bg-rose-700 text-white shadow-sm' 
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Flag / Action Req.</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Audit Explanatory Comments</label>
                <textarea
                  rows={4}
                  required
                  placeholder={
                    auditStatus === 'Audited'
                      ? 'e.g. Matched receipts and verified correct with cash-on-hand.'
                      : 'e.g. Missing receipt or mismatch in totals. Please provide proof of payment.'
                  }
                  value={auditNotes}
                  onChange={(e) => setAuditNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-900 border border-slate-750 rounded-xl text-white focus:outline-none focus:border-emerald-500 font-sans"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => { setSelectedTxId(null); setShowAuditModal(false); }}
                  className="flex-1 py-2.5 text-sm font-semibold bg-slate-700 hover:bg-slate-650 text-slate-200 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-sm transition-all"
                >
                  Submit Audit Decision
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
