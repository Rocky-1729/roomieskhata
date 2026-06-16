import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import api from '../utils/api';
import { 
  Plus, 
  ArrowUpRight, 
  ArrowDownLeft, 
  DollarSign, 
  Receipt, 
  Activity, 
  ArrowRight,
  PlusCircle,
  FileImage,
  X,
  AlertCircle
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

const Dashboard = () => {
  const navigate = useNavigate();
  const { 
    user, 
    room, 
    members, 
    balances, 
    settlements, 
    activities, 
    setBalancesAndSettlements, 
    addExpense,
    addActivity,
    setActivities
  } = useAppStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Other');
  const [paidBy, setPaidBy] = useState(user?._id || '');
  const [splitAmong, setSplitAmong] = useState([]);
  const [receiptFile, setReceiptFile] = useState(null);
  
  const [modalError, setModalError] = useState('');
  const [modalLoading, setModalLoading] = useState(false);

  // Initialize splitAmong with all members when modal opens
  useEffect(() => {
    if (isModalOpen && members.length > 0) {
      setSplitAmong(members.map(m => m._id));
      setPaidBy(user?._id || '');
    }
  }, [isModalOpen, members, user]);

  // Fetch recent activities
  useEffect(() => {
    if (!user?.activeRoomId) return;
    const fetchActivities = async () => {
      try {
        const res = await api.get('/activity?limit=5');
        setActivities(res.data.activities);
      } catch (err) {
        console.error(err);
      }
    };
    fetchActivities();
  }, [user?.activeRoomId]);

  // Calculate my balance details
  const myBalanceDetails = balances.find(b => b.user?._id === user?._id);
  const myNetBalance = myBalanceDetails ? myBalanceDetails.netBalance : 0;
  const myTotalPaid = myBalanceDetails ? myBalanceDetails.totalPaid : 0;

  // Calculate total room expenses
  const totalRoomExpenses = balances.reduce((sum, b) => sum + (b.totalPaid || 0), 0);

  // Prepare Recharts Category Data
  const categories = {};
  // Let's populate mock if empty, but retrieve actual from dashboard stats when available.
  // We can calculate from all expenses or just show actuals. Let's fetch the summary from the backend for charts.
  const [summaryData, setSummaryData] = useState({
    categoryBreakdown: [],
    topContributors: []
  });

  useEffect(() => {
    if (!user?.activeRoomId) return;
    const fetchSummary = async () => {
      try {
        const res = await api.get('/dashboard/summary');
        setSummaryData(res.data.summary);
      } catch (err) {
        console.error(err);
      }
    };
    fetchSummary();
  }, [user?.activeRoomId, balances]);

  const COLORS = ['#6366f1', '#10b981', '#a855f7', '#f43f5e', '#f59e0b', '#3b82f6', '#14b8a6', '#64748b'];

  const toggleMemberInSplit = (memberId) => {
    if (splitAmong.includes(memberId)) {
      setSplitAmong(splitAmong.filter(id => id !== memberId));
    } else {
      setSplitAmong([...splitAmong, memberId]);
    }
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!title || !amount) {
      return setModalError('Please enter description and amount');
    }
    if (parseFloat(amount) <= 0) {
      return setModalError('Amount must be greater than zero');
    }
    if (splitAmong.length === 0) {
      return setModalError('Expense must be split with at least one member');
    }

    setModalError('');
    setModalLoading(true);

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('amount', amount);
      formData.append('category', category);
      formData.append('paidBy', paidBy);
      formData.append('splitAmong', JSON.stringify(splitAmong));
      if (receiptFile) {
        formData.append('receipt', receiptFile);
      }

      const res = await api.post('/expenses', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      // Update Zustand store
      addExpense(res.data.expense);
      setBalancesAndSettlements(res.data.balances, res.data.settlements);
      
      // Close modal
      setIsModalOpen(false);
      // Reset form
      setTitle('');
      setAmount('');
      setCategory('Other');
      setReceiptFile(null);
    } catch (err) {
      console.error(err);
      setModalError(err.response?.data?.message || 'Failed to log expense');
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Dashboard</h1>
          <p className="text-xs text-slate-400 mt-0.5">Welcome back, {user?.name}. Here's the state of {room?.name || 'your room'}.</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsModalOpen(true)}
            className="glow-btn bg-brand-600 text-white px-4 py-2.5 rounded-xl font-bold flex items-center justify-center space-x-2 text-sm shadow-lg shadow-brand-500/20 hover:bg-brand-500 transition-colors flex-1 sm:flex-initial"
          >
            <Plus className="h-4.5 w-4.5" />
            <span>Add Expense</span>
          </button>
          <Link
            to="/settle"
            className="bg-slate-900 border border-slate-800 hover:bg-slate-850 hover:border-slate-700 text-slate-200 px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center space-x-2 transition-all flex-1 sm:flex-initial"
          >
            <DollarSign className="h-4 w-4" />
            <span>Settle Up</span>
          </Link>
        </div>
      </div>

      {/* 2. Metric Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Total Room Spending */}
        <div className="glass-card p-5 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Room Spend</span>
            <div className="h-8 w-8 bg-brand-500/10 rounded-lg flex items-center justify-center text-brand-400">
              <Receipt className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-white mt-3">₹{totalRoomExpenses.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</p>
          <p className="text-[10px] text-slate-500 mt-1">Sum of all active room bills</p>
        </div>

        {/* Card 2: Your Total Paid */}
        <div className="glass-card p-5 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">You Paid</span>
            <div className="h-8 w-8 bg-blue-500/10 rounded-lg flex items-center justify-center text-blue-400">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-white mt-3">₹{myTotalPaid.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</p>
          <p className="text-[10px] text-slate-500 mt-1">Your absolute spending in room</p>
        </div>

        {/* Card 3: Net Balance */}
        <div className={`glass-card p-5 rounded-2xl border ${myNetBalance > 0.01 ? 'border-emerald-500/20' : myNetBalance < -0.01 ? 'border-rose-500/20' : 'border-slate-800/50'}`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Net Balance</span>
            <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${
              myNetBalance > 0.01 
                ? 'bg-emerald-500/10 text-emerald-400' 
                : myNetBalance < -0.01 
                  ? 'bg-rose-500/10 text-rose-400' 
                  : 'bg-slate-800 text-slate-400'
            }`}>
              {myNetBalance > 0.01 ? <ArrowUpRight className="h-4 w-4" /> : myNetBalance < -0.01 ? <ArrowDownLeft className="h-4 w-4" /> : <DollarSign className="h-4 w-4" />}
            </div>
          </div>
          <p className={`text-2xl font-black mt-3 ${myNetBalance > 0.01 ? 'text-emerald-400' : myNetBalance < -0.01 ? 'text-rose-400' : 'text-slate-300'}`}>
            {myNetBalance > 0.01 ? '+' : ''}₹{Math.abs(myNetBalance).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </p>
          <p className="text-[10px] text-slate-500 mt-1">
            {myNetBalance > 0.01 ? 'You will receive from roommates' : myNetBalance < -0.01 ? 'You owe your roommates' : 'You are completely settled!'}
          </p>
        </div>
      </div>

      {/* 3. Charts Area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart A: Spending Breakdown */}
        <div className="glass-panel p-5 rounded-2xl flex flex-col h-80">
          <h2 className="text-sm font-bold text-slate-200">Category Breakdown</h2>
          <div className="flex-1 mt-4 relative">
            {summaryData.categoryBreakdown.length === 0 ? (
              <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-500">
                No expense categories logged yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={summaryData.categoryBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {summaryData.categoryBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px' }}
                    itemStyle={{ color: '#fff', fontSize: '12px' }}
                  />
                  <Legend 
                    layout="vertical" 
                    align="right" 
                    verticalAlign="middle"
                    iconType="circle"
                    formatter={(value) => <span className="text-xs text-slate-300">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Chart B: Room Contributor stats */}
        <div className="glass-panel p-5 rounded-2xl flex flex-col h-80">
          <h2 className="text-sm font-bold text-slate-200">Who Paid What</h2>
          <div className="flex-1 mt-4 relative">
            {summaryData.topContributors.length === 0 ? (
              <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-500">
                No roommate paid items yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={summaryData.topContributors.map(c => ({ name: c.user?.name || 'Unknown', Paid: c.totalPaid }))}>
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <Tooltip 
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px' }}
                    itemStyle={{ color: '#fff', fontSize: '12px' }}
                  />
                  <Bar dataKey="Paid" fill="#6366f1" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* 4. Bottom Activity list */}
      <div className="glass-panel p-5 rounded-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <div className="flex items-center space-x-2">
            <Activity className="h-4.5 w-4.5 text-brand-400" />
            <h2 className="text-sm font-bold text-slate-200">Recent Activity Timeline</h2>
          </div>
          <Link to="/timeline" className="text-xs text-brand-400 hover:text-brand-300 font-semibold flex items-center space-x-1">
            <span>View All</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="space-y-4">
          {activities.length === 0 ? (
            <p className="text-center text-xs py-6 text-slate-500">No activity logged in this room yet</p>
          ) : (
            activities.map((act) => (
              <div key={act._id} className="flex items-start justify-between text-xs">
                <div className="flex items-start space-x-2.5">
                  <img
                    src={act.userId?.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${act.userId?.name}`}
                    alt="avatar"
                    className="h-7 w-7 rounded-full bg-slate-800 mt-0.5 border border-slate-700"
                  />
                  <div>
                    <p className="text-slate-200 font-medium">{act.details}</p>
                    <p className="text-slate-500 text-[10px] mt-0.5">{new Date(act.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} • {new Date(act.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 5. Add Expense overlay Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl p-6 relative overflow-y-auto max-h-[90vh]">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-850 rounded-lg"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-lg font-bold text-white flex items-center space-x-2">
              <PlusCircle className="h-5 w-5 text-brand-400" />
              <span>Add Shared Expense</span>
            </h3>

            {modalError && (
              <div className="mt-4 bg-danger-500/10 border border-danger-500/20 text-danger-500 px-4 py-2.5 rounded-xl text-xs flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleAddExpense} className="mt-4 space-y-4">
              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Description / Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="bg-slate-950 border border-slate-800 focus:border-brand-500 block w-full px-3 py-2 rounded-xl text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-brand-500 mt-1"
                  placeholder="e.g. Chicken & Eggs, Electricity bill"
                />
              </div>

              {/* Amount & Category */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Amount (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="bg-slate-950 border border-slate-800 focus:border-brand-500 block w-full px-3 py-2 rounded-xl text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-brand-500 mt-1"
                    placeholder="e.g. 850"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="bg-slate-950 border border-slate-800 focus:border-brand-500 block w-full px-3 py-2 rounded-xl text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-brand-500 mt-1"
                  >
                    {['Rent', 'Electricity', 'WiFi', 'Vegetables', 'Eggs', 'Chicken', 'Milk', 'Petrol', 'Water', 'Gas', 'Other'].map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Paid By */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Paid By</label>
                <select
                  value={paidBy}
                  onChange={(e) => setPaidBy(e.target.value)}
                  className="bg-slate-950 border border-slate-800 focus:border-brand-500 block w-full px-3 py-2 rounded-xl text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-brand-500 mt-1"
                >
                  {members.map(member => (
                    <option key={member._id} value={member._id}>{member.name} {member._id === user?._id ? '(You)' : ''}</option>
                  ))}
                </select>
              </div>

              {/* Split Among Members Checklist */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Split Among</label>
                <div className="mt-2 bg-slate-950/60 rounded-xl border border-slate-850 p-3 max-h-32 overflow-y-auto space-y-2">
                  {members.map((member) => {
                    const isChecked = splitAmong.includes(member._id);
                    return (
                      <div 
                        key={member._id} 
                        onClick={() => toggleMemberInSplit(member._id)}
                        className="flex items-center space-x-2 cursor-pointer hover:bg-slate-900/60 p-1.5 rounded-lg transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}} // handled by click of parent wrapper
                          className="rounded text-brand-600 focus:ring-brand-500 h-4 w-4 bg-slate-900 border-slate-800"
                        />
                        <span className="text-xs text-slate-350">{member.name} {member._id === user?._id ? '(You)' : ''}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Receipt File */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Attach Receipt (Optional)</label>
                <div className="mt-1 flex items-center space-x-3">
                  <label className="glow-btn bg-slate-850 hover:bg-slate-800 border border-slate-800 text-slate-200 px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer flex items-center space-x-1">
                    <FileImage className="h-4 w-4" />
                    <span>Upload Image</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setReceiptFile(e.target.files[0])}
                      className="hidden"
                    />
                  </label>
                  {receiptFile && (
                    <div className="flex items-center space-x-1.5 text-xs text-slate-400 bg-slate-850 px-2.5 py-1.5 rounded-xl">
                      <span className="truncate max-w-[150px]">{receiptFile.name}</span>
                      <button type="button" onClick={() => setReceiptFile(null)} className="text-danger-500 hover:text-danger-400">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={modalLoading}
                className="w-full glow-btn bg-brand-600 hover:bg-brand-500 text-white py-2.5 rounded-xl font-bold flex items-center justify-center space-x-2 text-sm transition-colors mt-6"
              >
                {modalLoading ? <span>Saving Expense...</span> : <span>Save Expense</span>}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
