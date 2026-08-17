import React, { useState, useMemo } from 'react';
import { FinancialTransaction, OfficerRole, OrganizationFund, HogRaisingState } from '../types';
import { INITIAL_FUNDS, INITIAL_HOG_RAISING } from '../initialData';
import { 
  Coins, ArrowUpRight, ArrowDownRight, Plus, 
  Search, ShieldCheck, AlertTriangle, CheckCircle, 
  XCircle, Filter, FileText, Info, Building2, Wallet, Database,
  PiggyBank, TrendingUp, BarChart3, Calendar, Sparkles
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

interface TreasurerViewProps {
  transactions: FinancialTransaction[];
  funds?: OrganizationFund[];
  hogRaising?: HogRaisingState;
  onAddTransaction: (tx: Omit<FinancialTransaction, 'id' | 'auditedStatus'>) => void;
  onAuditTransaction: (id: string, status: 'Audited' | 'Flagged', notes: string) => void;
  currentRole: OfficerRole;
  onOpenReportModal?: () => void;
}

export default function TreasurerView({
  transactions,
  funds = INITIAL_FUNDS,
  hogRaising = INITIAL_HOG_RAISING,
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

  // Hog IGP Chart Filter States
  const [chartYear, setChartYear] = useState<string>('all');
  const [chartProduce, setChartProduce] = useState<string>('Hog Raising');

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

  // Compute available years for the Hog Raising IGP chart
  const availableYears = useMemo(() => {
    const yearsSet = new Set<string>();
    (hogRaising?.expenses || []).forEach(e => {
      if (e.date && e.date.length >= 4) yearsSet.add(e.date.substring(0, 4));
    });
    (hogRaising?.sales || []).forEach(s => {
      if (s.date && s.date.length >= 4) yearsSet.add(s.date.substring(0, 4));
    });
    return Array.from(yearsSet).sort().reverse();
  }, [hogRaising]);

  // Compute available produces
  const availableProduces = useMemo(() => {
    return hogRaising?.produces || ['Hog Raising', 'Poultry Raising', 'Tilapia Breeding'];
  }, [hogRaising]);

  // Aggregate monthly expenses and sales income for the Hog Raising IGP Project
  const monthlyChartData = useMemo(() => {
    if (!hogRaising) return [];

    const map: Record<string, { 
      monthKey: string; 
      monthLabel: string; 
      shortMonth: string;
      income: number; 
      expenses: number; 
      net: number; 
      hogsSold: number;
      feedExpenses: number;
      pigletExpenses: number;
      medExpenses: number;
    }> = {};

    const targetExpenses = (hogRaising.expenses || []).filter(e => {
      const matchesProduce = !chartProduce || chartProduce === 'all' || (e.produce || 'Hog Raising') === chartProduce;
      const matchesYear = chartYear === 'all' || (e.date && e.date.startsWith(chartYear));
      return matchesProduce && matchesYear;
    });

    const targetSales = (hogRaising.sales || []).filter(s => {
      const matchesProduce = !chartProduce || chartProduce === 'all' || (s.produce || 'Hog Raising') === chartProduce;
      const matchesYear = chartYear === 'all' || (s.date && s.date.startsWith(chartYear));
      return matchesProduce && matchesYear;
    });

    targetExpenses.forEach(e => {
      if (!e.date) return;
      const monthKey = e.date.substring(0, 7);
      if (!map[monthKey]) {
        const [y, m] = monthKey.split('-');
        const d = new Date(parseInt(y), parseInt(m) - 1, 1);
        const monthLabel = d.toLocaleString('en-US', { month: 'short', year: 'numeric' });
        const shortMonth = d.toLocaleString('en-US', { month: 'short' });
        map[monthKey] = {
          monthKey,
          monthLabel,
          shortMonth: `${shortMonth} '${y.slice(2)}`,
          income: 0,
          expenses: 0,
          net: 0,
          hogsSold: 0,
          feedExpenses: 0,
          pigletExpenses: 0,
          medExpenses: 0
        };
      }
      const amt = Number(e.amount) || 0;
      map[monthKey].expenses += amt;
      if (e.category === 'Feeds') map[monthKey].feedExpenses += amt;
      else if (e.category === 'Piglets') map[monthKey].pigletExpenses += amt;
      else if (e.category === 'Vitamins/Medicines') map[monthKey].medExpenses += amt;
    });

    targetSales.forEach(s => {
      if (!s.date) return;
      const monthKey = s.date.substring(0, 7);
      if (!map[monthKey]) {
        const [y, m] = monthKey.split('-');
        const d = new Date(parseInt(y), parseInt(m) - 1, 1);
        const monthLabel = d.toLocaleString('en-US', { month: 'short', year: 'numeric' });
        const shortMonth = d.toLocaleString('en-US', { month: 'short' });
        map[monthKey] = {
          monthKey,
          monthLabel,
          shortMonth: `${shortMonth} '${y.slice(2)}`,
          income: 0,
          expenses: 0,
          net: 0,
          hogsSold: 0,
          feedExpenses: 0,
          pigletExpenses: 0,
          medExpenses: 0
        };
      }
      const rev = Number(s.revenue) || 0;
      map[monthKey].income += rev;
      map[monthKey].hogsSold += Number(s.hogsCount || s.produceCount || 0);
    });

    const sortedKeys = Object.keys(map).sort();
    return sortedKeys.map(k => {
      const item = map[k];
      item.net = item.income - item.expenses;
      return item;
    });
  }, [hogRaising, chartProduce, chartYear]);

  // Overall totals for the active IGP chart selection
  const chartTotals = useMemo(() => {
    let totalIncome = 0;
    let totalExpenses = 0;
    let totalHogs = 0;
    monthlyChartData.forEach(d => {
      totalIncome += d.income;
      totalExpenses += d.expenses;
      totalHogs += d.hogsSold;
    });
    return {
      totalIncome,
      totalExpenses,
      net: totalIncome - totalExpenses,
      totalHogs,
      margin: totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0
    };
  }, [monthlyChartData]);

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

      {/* REGISTERED ORGANIZATION FUNDS & TREASURY ACCOUNTS */}
      <div className="bg-slate-800 border border-slate-700/70 p-5 rounded-2xl space-y-4 shadow-md">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-slate-700/60">
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-wide flex items-center gap-2">
              <Wallet className="w-4 h-4 text-emerald-400" />
              <span>Registered Organization Fund Accounts & Database Audits</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Live organizational treasury allocations & capital grant accounts recorded in Aiven PostgreSQL
            </p>
          </div>
          <div className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-xl text-xs font-semibold">
            <Database className="w-3.5 h-3.5" />
            <span>PostgreSQL Synchronized</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {funds.map((fund) => (
            <div key={fund.id} className="bg-slate-900/80 border border-slate-700/60 p-4 rounded-xl space-y-2 relative overflow-hidden">
              <div className="flex justify-between items-start gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded">
                      {fund.code}
                    </span>
                    <h4 className="font-bold text-white text-sm">{fund.name}</h4>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{fund.description}</p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-semibold text-slate-500 block">Allocated Capital</span>
                  <span className="font-mono font-bold text-slate-300">PHP {fund.allocatedAmount.toLocaleString('en-US')}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-semibold text-slate-500 block">Audited Live Balance</span>
                  <span className="font-mono font-black text-emerald-400">PHP {fund.currentBalance.toLocaleString('en-US')}</span>
                </div>
              </div>

              <div className="pt-1.5 flex items-center justify-between text-[11px] text-slate-400 font-medium">
                <span className="truncate">Custodian: <strong className="text-slate-200">{fund.custodian}</strong></span>
                <span className="text-slate-500 shrink-0">Updated: {fund.lastUpdated}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* HOG RAISING IGP MONTHLY EXPENSES VS. INCOME RECHARTS BAR CHART */}
      <div className="bg-slate-800 border border-slate-700/70 p-5 sm:p-6 rounded-2xl space-y-5 shadow-lg relative">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 pb-4 border-b border-slate-700/70">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                <PiggyBank className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <span>Hog Raising IGP — Monthly Expenses vs. Income Trends</span>
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Interactive Recharts
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Visualizing monthly feeds, stock purchases, veterinary care vs. mature hog sales revenue
                </p>
              </div>
            </div>
          </div>

          {/* Interactive Filters */}
          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
            {availableProduces.length > 1 && (
              <div className="flex items-center gap-1.5 bg-slate-900/80 px-2.5 py-1.5 rounded-xl border border-slate-700/60 text-xs">
                <span className="text-slate-400 font-semibold text-[11px]">Project:</span>
                <select
                  value={chartProduce}
                  onChange={(e) => setChartProduce(e.target.value)}
                  className="bg-transparent text-emerald-300 font-bold focus:outline-none cursor-pointer"
                >
                  <option value="all" className="bg-slate-800 text-white">All IGP Projects</option>
                  {availableProduces.map(p => (
                    <option key={p} value={p} className="bg-slate-800 text-white">{p}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex items-center gap-1.5 bg-slate-900/80 px-2.5 py-1.5 rounded-xl border border-slate-700/60 text-xs">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-400 font-semibold text-[11px]">Cycle Year:</span>
              <select
                value={chartYear}
                onChange={(e) => setChartYear(e.target.value)}
                className="bg-transparent text-emerald-300 font-bold focus:outline-none cursor-pointer"
              >
                <option value="all" className="bg-slate-800 text-white">All Years</option>
                {availableYears.map(y => (
                  <option key={y} value={y} className="bg-slate-800 text-white">{y}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* SUMMARY KPI CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-slate-900/80 border border-slate-700/60 p-3.5 rounded-xl">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Total IGP Sales</span>
            <div className="text-lg font-black text-emerald-400 font-mono mt-0.5">
              PHP {chartTotals.totalIncome.toLocaleString('en-US')}
            </div>
            <span className="text-[10px] text-slate-500 mt-1 block">
              {chartTotals.totalHogs} mature hogs sold
            </span>
          </div>

          <div className="bg-slate-900/80 border border-slate-700/60 p-3.5 rounded-xl">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Total IGP Expenses</span>
            <div className="text-lg font-black text-rose-400 font-mono mt-0.5">
              PHP {chartTotals.totalExpenses.toLocaleString('en-US')}
            </div>
            <span className="text-[10px] text-slate-500 mt-1 block">
              Feeds, piglets & veterinary
            </span>
          </div>

          <div className="bg-slate-900/80 border border-slate-700/60 p-3.5 rounded-xl">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Net IGP Cash Flow</span>
            <div className={`text-lg font-black font-mono mt-0.5 ${chartTotals.net >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {chartTotals.net >= 0 ? '+' : ''}PHP {chartTotals.net.toLocaleString('en-US')}
            </div>
            <span className="text-[10px] text-slate-500 mt-1 block">
              {chartTotals.margin > 0 ? `${chartTotals.margin.toFixed(1)}% profit margin` : 'Ongoing rearing cycle'}
            </span>
          </div>

          <div className="bg-slate-900/80 border border-slate-700/60 p-3.5 rounded-xl">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Capital Grant</span>
            <div className="text-lg font-black text-amber-400 font-mono mt-0.5">
              PHP {(hogRaising?.capitalGrant || 1000000).toLocaleString('en-US')}
            </div>
            <span className="text-[10px] text-emerald-400 mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              <span>DOLE & DA Seed Grant</span>
            </span>
          </div>
        </div>

        {/* RECHARTS BAR CHART CANVAS */}
        {monthlyChartData.length > 0 ? (
          <div className="space-y-4">
            <div className="h-[300px] w-full bg-slate-900/50 p-2 sm:p-4 rounded-xl border border-slate-700/50">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={monthlyChartData}
                  margin={{ top: 15, right: 20, left: 10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} opacity={0.6} />
                  <XAxis 
                    dataKey="shortMonth" 
                    stroke="#94a3b8" 
                    tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }}
                    tickLine={{ stroke: '#475569' }}
                  />
                  <YAxis 
                    stroke="#94a3b8" 
                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                    tickLine={{ stroke: '#475569' }}
                    tickFormatter={(val) => `₱${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-slate-900 border border-slate-700 p-3.5 rounded-xl shadow-2xl text-xs space-y-2.5 min-w-[210px]">
                            <div className="flex items-center justify-between border-b border-slate-700/80 pb-1.5">
                              <span className="font-bold text-white text-sm">{data.monthLabel}</span>
                              <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                                {chartProduce === 'all' ? 'All IGP' : chartProduce}
                              </span>
                            </div>

                            <div className="space-y-1.5">
                              <div className="flex justify-between items-center gap-4">
                                <span className="text-emerald-400 flex items-center gap-1.5 font-medium">
                                  <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" />
                                  Sales (Income):
                                </span>
                                <span className="font-mono font-bold text-emerald-300">
                                  PHP {Number(data.income).toLocaleString('en-US')}
                                </span>
                              </div>

                              <div className="flex justify-between items-center gap-4">
                                <span className="text-rose-400 flex items-center gap-1.5 font-medium">
                                  <span className="w-2.5 h-2.5 rounded-sm bg-rose-500 inline-block" />
                                  Total Expenses:
                                </span>
                                <span className="font-mono font-bold text-rose-300">
                                  PHP {Number(data.expenses).toLocaleString('en-US')}
                                </span>
                              </div>

                              {data.feedExpenses > 0 && (
                                <div className="pl-4 text-[11px] text-slate-400 flex justify-between">
                                  <span>• Feeds:</span>
                                  <span className="font-mono">PHP {data.feedExpenses.toLocaleString('en-US')}</span>
                                </div>
                              )}
                              {data.pigletExpenses > 0 && (
                                <div className="pl-4 text-[11px] text-slate-400 flex justify-between">
                                  <span>• Piglets / Stock:</span>
                                  <span className="font-mono">PHP {data.pigletExpenses.toLocaleString('en-US')}</span>
                                </div>
                              )}
                              {data.medExpenses > 0 && (
                                <div className="pl-4 text-[11px] text-slate-400 flex justify-between">
                                  <span>• Vitamins / Meds:</span>
                                  <span className="font-mono">PHP {data.medExpenses.toLocaleString('en-US')}</span>
                                </div>
                              )}
                            </div>

                            <div className="pt-2 border-t border-slate-800 flex justify-between items-center gap-4">
                              <span className="text-slate-300 font-semibold">Net Cash Flow:</span>
                              <span className={`font-mono font-bold ${data.net >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {data.net >= 0 ? '+' : ''}PHP {Number(data.net).toLocaleString('en-US')}
                              </span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend 
                    verticalAlign="top"
                    align="right"
                    iconType="circle"
                    wrapperStyle={{ paddingBottom: '10px', fontSize: '12px' }}
                    formatter={(value) => <span className="text-slate-300 font-medium text-xs mr-3">{value}</span>}
                  />
                  <Bar 
                    dataKey="income" 
                    name="Hog Sales (Income)" 
                    fill="#10B981" 
                    radius={[6, 6, 0, 0]} 
                    maxBarSize={42} 
                  />
                  <Bar 
                    dataKey="expenses" 
                    name="IGP Expenses (Feeds & Stock)" 
                    fill="#F43F5E" 
                    radius={[6, 6, 0, 0]} 
                    maxBarSize={42} 
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* MONTHLY SUMMARY CHIPS */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 pt-1">
              {monthlyChartData.map((m) => (
                <div key={m.monthKey} className="bg-slate-900/60 border border-slate-700/60 p-2.5 rounded-xl space-y-1 text-xs">
                  <span className="font-bold text-slate-300 block">{m.shortMonth}</span>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-emerald-400 font-mono">+{m.income >= 1000 ? `${(m.income/1000).toFixed(0)}k` : m.income}</span>
                    <span className="text-rose-400 font-mono">-{m.expenses >= 1000 ? `${(m.expenses/1000).toFixed(0)}k` : m.expenses}</span>
                  </div>
                  <div className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded text-center ${
                    m.net >= 0 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                  }`}>
                    {m.net >= 0 ? '+' : ''}₱{Math.abs(m.net).toLocaleString('en-US')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-slate-900/60 border border-slate-700/60 p-8 rounded-xl text-center space-y-2">
            <BarChart3 className="w-8 h-8 text-slate-500 mx-auto" />
            <p className="text-sm font-bold text-slate-300">Walay natala nga transaksyon sa napili nga tuig o proyekto.</p>
            <p className="text-xs text-slate-500">I-adjust ang filters o mag-log og bag-ong expenses/sales sa Hog Raising tab.</p>
          </div>
        )}
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
