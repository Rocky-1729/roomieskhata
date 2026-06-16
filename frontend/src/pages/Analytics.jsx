import React, { useState, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import api from '../utils/api';
import { 
  TrendingUp, 
  PieChart as PieIcon, 
  Award, 
  AlertTriangle, 
  Wallet, 
  Home,
  Zap,
  Wifi,
  Utensils,
  Fuel,
  Flame,
  Receipt
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend
} from 'recharts';

const getCategoryIcon = (category) => {
  const normalized = category?.toLowerCase();
  switch (normalized) {
    case 'rent': return <Home className="h-3.5 w-3.5" />;
    case 'electricity': return <Zap className="h-3.5 w-3.5" />;
    case 'wifi': return <Wifi className="h-3.5 w-3.5" />;
    case 'vegetables':
    case 'eggs':
    case 'chicken':
    case 'milk':
      return <Utensils className="h-3.5 w-3.5" />;
    case 'petrol': return <Fuel className="h-3.5 w-3.5" />;
    case 'gas': return <Flame className="h-3.5 w-3.5" />;
    default: return <Receipt className="h-3.5 w-3.5" />;
  }
};

const getCategoryBgColor = (category) => {
  const normalized = category?.toLowerCase();
  switch (normalized) {
    case 'rent': return 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/25';
    case 'electricity': return 'bg-amber-500/10 text-amber-400 border border-amber-500/25';
    case 'wifi': return 'bg-sky-500/10 text-sky-400 border border-sky-500/25';
    case 'vegetables': return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25';
    case 'eggs': return 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/25';
    case 'chicken': return 'bg-rose-500/10 text-rose-400 border border-rose-500/25';
    case 'milk': return 'bg-slate-200/10 text-slate-200 border border-slate-200/25';
    case 'petrol': return 'bg-teal-500/10 text-teal-400 border border-teal-500/25';
    case 'gas': return 'bg-orange-500/10 text-orange-400 border border-orange-500/25';
    default: return 'bg-slate-500/10 text-slate-400 border border-slate-500/25';
  }
};

const Analytics = () => {
  const { user } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [summaryData, setSummaryData] = useState({
    charts: {
      categoryPie: [],
      memberBar: [],
      topCategories: [],
      topMembers: [],
    },
    insights: {
      highestCategory: { name: 'None', value: 0 },
      highestSpender: { name: 'None', spent: 0 },
      efficientMember: { name: 'None', remaining: 0 },
      totalRemainingBudget: 0,
      overspendingAlerts: [],
    }
  });

  useEffect(() => {
    if (!user?.activeRoomId) return;
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const res = await api.get('/dashboard/summary');
        setSummaryData(res.data.summary);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [user?.activeRoomId]);

  const COLORS = ['#6366f1', '#10b981', '#a855f7', '#f43f5e', '#f59e0b', '#3b82f6', '#14b8a6', '#f472b6', '#38bdf8', '#64748b'];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-brand-500"></div>
      </div>
    );
  }

  const { charts, insights } = summaryData;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Analytics & Insights</h1>
        <p className="text-xs text-slate-400 mt-0.5">Automated analytics, charts, and budget trends for your room.</p>
      </div>

      {/* Insights Section */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {/* Highest Spending Category */}
        <div className="glass-card p-5 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Top Category</span>
            <div className="h-8 w-8 bg-indigo-500/10 rounded-lg flex items-center justify-center text-indigo-400">
              <PieIcon className="h-4 w-4" />
            </div>
          </div>
          <p className="text-xl font-black text-white mt-3">{insights?.highestCategory?.name || 'None'}</p>
          <p className="text-xs font-semibold text-slate-400 mt-1">₹{(insights?.highestCategory?.value || 0).toLocaleString('en-IN')}</p>
          <p className="text-[9px] text-slate-500 mt-1.5">Consumed most money in current month</p>
        </div>

        {/* Highest Spending Member */}
        <div className="glass-card p-5 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Top Spender</span>
            <div className="h-8 w-8 bg-brand-500/10 rounded-lg flex items-center justify-center text-brand-400">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <p className="text-xl font-black text-white mt-3">{insights?.highestSpender?.name || 'None'}</p>
          <p className="text-xs font-semibold text-slate-400 mt-1">₹{(insights?.highestSpender?.spent || 0).toLocaleString('en-IN')}</p>
          <p className="text-[9px] text-slate-500 mt-1.5">Highest recorded roommate spent</p>
        </div>

        {/* Most Efficient Member */}
        <div className="glass-card p-5 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Most Efficient</span>
            <div className="h-8 w-8 bg-emerald-500/10 rounded-lg flex items-center justify-center text-emerald-400">
              <Award className="h-4 w-4" />
            </div>
          </div>
          <p className="text-xl font-black text-white mt-3">{insights?.efficientMember?.name || 'None'}</p>
          <p className="text-xs font-semibold text-emerald-450 mt-1">₹{(insights?.efficientMember?.remaining || 0).toLocaleString('en-IN')} Left</p>
          <p className="text-[9px] text-slate-500 mt-1.5">Roommate with highest budget buffer</p>
        </div>

        {/* Remaining Room Budget */}
        <div className="glass-card p-5 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Remaining Pool</span>
            <div className="h-8 w-8 bg-blue-500/10 rounded-lg flex items-center justify-center text-blue-400">
              <Wallet className="h-4 w-4" />
            </div>
          </div>
          <p className="text-xl font-black text-white mt-3">₹{(insights?.totalRemainingBudget || 0).toLocaleString('en-IN')}</p>
          <p className="text-xs font-semibold text-slate-400 mt-1">Total Room Buffer</p>
          <p className="text-[9px] text-slate-500 mt-1.5">Unspent room budget balance</p>
        </div>
      </div>

      {/* Overspending Alerts Banner if any */}
      {insights?.overspendingAlerts && insights.overspendingAlerts.length > 0 && (
        <div className="bg-danger-500/10 border border-danger-500/25 rounded-2xl p-4 flex items-start space-x-3.5">
          <AlertTriangle className="h-5 w-5 text-danger-500 mt-0.5 flex-shrink-0" />
          <div className="text-xs">
            <h4 className="font-bold text-danger-500">Over Budget Alerts</h4>
            <div className="text-slate-300 mt-1.5 space-y-1">
              {insights.overspendingAlerts.map((a, i) => (
                <p key={i}>
                  ⚠ Roommate <strong className="text-white">{a.name}</strong> has exceeded their allocated budget by <strong className="text-danger-400">₹{a.extra.toLocaleString('en-IN')}</strong>.
                </p>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Category Wise Pie */}
        <div className="glass-panel p-5 rounded-2xl flex flex-col h-80">
          <h2 className="text-sm font-bold text-slate-200">Category Wise Expense Distribution</h2>
          <div className="flex-1 mt-4 relative">
            {!charts?.categoryPie || charts.categoryPie.length === 0 ? (
              <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-500">
                No monthly expenses logged.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={charts.categoryPie}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {charts.categoryPie.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value, name, props) => [
                      `₹${value.toLocaleString('en-IN')} (${props.payload.percentage || 0}%)`, 
                      name
                    ]}
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px' }}
                    itemStyle={{ color: '#fff', fontSize: '12px' }}
                  />
                  <Legend 
                    layout="vertical" 
                    align="right" 
                    verticalAlign="middle"
                    iconType="circle"
                    formatter={(value) => {
                      const item = charts.categoryPie.find(c => c.name === value);
                      const pct = item ? ` (${item.percentage}%)` : '';
                      return <span className="text-xs text-slate-350">{value}{pct}</span>;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Chart 2: Member Spending Comparison */}
        <div className="glass-panel p-5 rounded-2xl flex flex-col h-80">
          <h2 className="text-sm font-bold text-slate-200">Member Spending Comparison</h2>
          <div className="flex-1 mt-4 relative">
            {!charts?.memberBar || charts.memberBar.length === 0 ? (
              <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-500">
                No roommate spending logged.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.memberBar} margin={{ bottom: 10 }}>
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <Tooltip 
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px' }}
                    itemStyle={{ color: '#6366f1', fontSize: '12px' }}
                  />
                  <Bar dataKey="spent" name="Total Spent" fill="#6366f1" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Ranked Lists Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ranked List 1: Top Spending Categories */}
        <div className="glass-panel p-5 rounded-2xl flex flex-col min-h-[340px]">
          <h2 className="text-sm font-bold text-slate-200">Top Spending Categories</h2>
          <div className="flex-1 mt-4 space-y-3">
            {!charts?.topCategories || charts.topCategories.length === 0 ? (
              <div className="flex items-center justify-center h-full min-h-[200px] text-xs text-slate-500">
                No category spending data available.
              </div>
            ) : (
              charts.topCategories.map((item, index) => {
                const percentage = item.percentage || 0;
                const rank = index + 1;
                let rankBadge = 'bg-slate-800 text-slate-400 border border-slate-700';
                if (rank === 1) rankBadge = 'bg-amber-500/15 text-amber-400 border border-amber-500/30';
                else if (rank === 2) rankBadge = 'bg-slate-300/15 text-slate-300 border border-slate-300/30';
                else if (rank === 3) rankBadge = 'bg-orange-500/15 text-orange-400 border border-orange-500/30';

                return (
                  <div key={item.name} className="flex items-center space-x-3.5 p-3 rounded-xl bg-slate-900/40 border border-slate-800/50">
                    <span className={`w-7 h-7 flex items-center justify-center rounded-lg text-xs font-black flex-shrink-0 ${rankBadge}`}>
                      #{rank}
                    </span>
                    <div className={`w-8 h-8 flex items-center justify-center rounded-lg flex-shrink-0 ${getCategoryBgColor(item.name)}`}>
                      {getCategoryIcon(item.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-xs font-bold text-slate-200 truncate">{item.name}</span>
                        <span className="text-xs font-bold text-slate-350">₹{item.value.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className="bg-brand-500 h-1.5 rounded-full transition-all duration-500" 
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                    <div className="text-[10px] font-black text-slate-400 w-8 text-right flex-shrink-0">
                      {percentage}%
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Ranked List 2: Top Spending Members */}
        <div className="glass-panel p-5 rounded-2xl flex flex-col min-h-[340px]">
          <h2 className="text-sm font-bold text-slate-200">Top Spending Roommates</h2>
          <div className="flex-1 mt-4 space-y-3">
            {!charts?.topMembers || charts.topMembers.length === 0 ? (
              <div className="flex items-center justify-center h-full min-h-[200px] text-xs text-slate-500">
                No roommate spending data available.
              </div>
            ) : (
              charts.topMembers.map((item, index) => {
                const maxSpent = charts.topMembers[0]?.spent || 1;
                const memberPct = maxSpent > 0 ? Math.round((item.spent / maxSpent) * 100) : 0;
                const rank = index + 1;
                let rankBadge = 'bg-slate-800 text-slate-400 border border-slate-700';
                if (rank === 1) rankBadge = 'bg-amber-500/15 text-amber-400 border border-amber-500/30';
                else if (rank === 2) rankBadge = 'bg-slate-300/15 text-slate-300 border border-slate-300/30';
                else if (rank === 3) rankBadge = 'bg-orange-500/15 text-orange-400 border border-orange-500/30';

                return (
                  <div key={item.name} className="flex items-center space-x-3.5 p-3 rounded-xl bg-slate-900/40 border border-slate-800/50">
                    <span className={`w-7 h-7 flex items-center justify-center rounded-lg text-xs font-black flex-shrink-0 ${rankBadge}`}>
                      #{rank}
                    </span>
                    <img
                      src={item.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${item.name}`}
                      alt={item.name}
                      className="h-8 w-8 rounded-full bg-slate-950 border border-slate-800 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-xs font-bold text-slate-200 truncate">{item.name}</span>
                        <span className="text-xs font-bold text-brand-400">₹{item.spent.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className="bg-brand-500 h-1.5 rounded-full transition-all duration-500" 
                          style={{ width: `${memberPct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
