import React, { useState, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import api from '../utils/api';
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  PieChart as PieIcon,
  Crown,
  ChevronRight,
  ShieldCheck,
  UserCheck
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

const Members = () => {
  const { user, members, balances } = useAppStore();

  const [activeMemberId, setActiveMemberId] = useState(user?._id || '');
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);

  const activeMemberName = members.find(m => m._id === activeMemberId)?.name || 'Roommate';

  // Fetch Member Analytics from server
  const fetchMemberAnalytics = async (memberId) => {
    if (!memberId) return;
    setLoading(true);
    try {
      const res = await api.get(`/dashboard/member-analytics/${memberId}`);
      setAnalytics(res.data.analytics);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeMemberId) {
      fetchMemberAnalytics(activeMemberId);
    }
  }, [activeMemberId, balances]);

  const COLORS = ['#6366f1', '#10b981', '#a855f7', '#f43f5e', '#f59e0b', '#3b82f6', '#14b8a6', '#64748b'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Room Members</h1>
        <p className="text-xs text-slate-400 mt-0.5">View roommate details and individual spending analytics</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Members List */}
        <div className="glass-panel p-4 rounded-2xl h-fit space-y-3 lg:col-span-1">
          <div className="flex items-center space-x-2 border-b border-slate-800 pb-3 mb-3">
            <Users className="h-4.5 w-4.5 text-brand-400" />
            <h2 className="text-sm font-bold text-slate-200">Room Members</h2>
          </div>

          <div className="space-y-2">
            {members.map((member) => {
              const isActive = member._id === activeMemberId;
              const isMe = member._id === user?._id;
              
              // Find total paid from balances array
              const balanceRecord = balances.find(b => b.user?._id === member._id);
              const paidAmount = balanceRecord ? balanceRecord.totalPaid : 0;

              return (
                <div
                  key={member._id}
                  onClick={() => setActiveMemberId(member._id)}
                  className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                    isActive 
                      ? 'bg-brand-650 border-brand-500 shadow-md shadow-brand-500/5 text-white' 
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <img
                      src={member.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${member.name}`}
                      alt="avatar"
                      className="h-8 w-8 rounded-full bg-slate-950 border border-slate-800 flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center space-x-1.5">
                        <p className={`text-xs font-bold truncate ${isActive ? 'text-white' : 'text-slate-200'}`}>
                          {member.name} {isMe ? '(You)' : ''}
                        </p>
                        {member.role === 'admin' && (
                          <Crown className="h-3.5 w-3.5 text-amber-450" title="Room Admin" />
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500 truncate mt-0.5">{member.email}</p>
                    </div>
                  </div>
                  
                  <div className="text-right flex items-center space-x-1 flex-shrink-0">
                    <span className={`text-xs font-black ${isActive ? 'text-white' : 'text-slate-300'}`}>
                      ₹{paidAmount.toFixed(0)}
                    </span>
                    <ChevronRight className="h-4 w-4 text-slate-500" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Analytics Panel */}
        <div className="lg:col-span-2 space-y-4">
          <div className="glass-panel p-5 rounded-2xl">
            <h2 className="text-sm font-bold text-slate-200 flex items-center space-x-2 border-b border-slate-800 pb-3">
              <UserCheck className="h-4.5 w-4.5 text-brand-450" />
              <span>Spend Analytics: {activeMemberName}</span>
            </h2>

            {loading ? (
              <div className="py-20 text-center text-xs text-slate-550">Loading analytics...</div>
            ) : !analytics ? (
              <div className="py-20 text-center text-xs text-slate-550">Select a roommate to inspect analytics</div>
            ) : (
              <div className="mt-4 space-y-6">
                {/* Analytics summary rows */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-900">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Paid contribution</span>
                    <p className="text-xl font-black text-white mt-1">₹{analytics.totalPaid.toLocaleString('en-IN')}</p>
                    <span className="text-[9px] text-slate-500">Absolute spend tracked in this room</span>
                  </div>
                  <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-900">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Room Contribution Share</span>
                    <p className="text-xl font-black text-brand-400 mt-1">{analytics.contributionPercentage}%</p>
                    <span className="text-[9px] text-slate-500">Of room's total expenses (₹{analytics.roomTotal.toLocaleString('en-IN')})</span>
                  </div>
                </div>

                {/* Subcharts */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Member Category Breakdown Pie */}
                  <div className="bg-slate-950/20 p-4 rounded-xl border border-slate-900/60 h-64 flex flex-col">
                    <span className="text-[11px] font-bold text-slate-400 flex items-center space-x-1.5 mb-2">
                      <PieIcon className="h-3.5 w-3.5" />
                      <span>Spending Categories</span>
                    </span>
                    <div className="flex-1 relative">
                      {analytics.categoryBreakdown.length === 0 ? (
                        <div className="absolute inset-0 flex items-center justify-center text-[10px] text-slate-550">
                          No category purchases by this roommate.
                        </div>
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={analytics.categoryBreakdown}
                              cx="50%"
                              cy="50%"
                              innerRadius={45}
                              outerRadius={65}
                              paddingAngle={2}
                              dataKey="value"
                            >
                              {analytics.categoryBreakdown.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip 
                              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px' }}
                              itemStyle={{ color: '#fff', fontSize: '10px' }}
                            />
                            <Legend 
                              iconSize={6}
                              formatter={(value) => <span className="text-[10px] text-slate-400">{value}</span>}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </div>

                  {/* Monthly Trend Bar chart */}
                  <div className="bg-slate-950/20 p-4 rounded-xl border border-slate-900/60 h-64 flex flex-col">
                    <span className="text-[11px] font-bold text-slate-400 flex items-center space-x-1.5 mb-2">
                      <TrendingUp className="h-3.5 w-3.5" />
                      <span>Monthly Spending Trend</span>
                    </span>
                    <div className="flex-1 relative">
                      {analytics.monthlyTrend.length === 0 ? (
                        <div className="absolute inset-0 flex items-center justify-center text-[10px] text-slate-550">
                          No monthly timeline data.
                        </div>
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={analytics.monthlyTrend}>
                            <XAxis dataKey="month" stroke="#64748b" fontSize={8} tickLine={false} />
                            <YAxis stroke="#64748b" fontSize={8} tickLine={false} />
                            <Tooltip 
                              cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px' }}
                              itemStyle={{ color: '#fff', fontSize: '10px' }}
                            />
                            <Bar dataKey="total" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Members;
