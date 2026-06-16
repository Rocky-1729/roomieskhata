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
  AlertCircle,
  Wallet,
  TrendingUp,
  ShieldCheck,
  CheckCircle,
  HelpCircle,
  Users,
  Home
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

  // Calculate my settle net balance
  const myBalanceDetails = balances.find(b => b.user?._id === user?._id);
  const myNetBalance = myBalanceDetails ? myBalanceDetails.netBalance : 0;

  // Retrieve dashboard summary metrics
  const [summaryData, setSummaryData] = useState({
    categoryBreakdown: [],
    topContributors: [],
    roomBudget: {
      totalMembers: 0,
      roomRent: 0,
      rentShare: 0,
      monthlyContribution: 0,
      totalRoomExpenses: 0,
      totalRemainingBudget: 0,
      totalExtraExpenses: 0,
    },
    myBudget: {
      allocatedBudget: 0,
      rentShare: 0,
      spent: 0,
      remaining: 0,
      extra: 0,
      status: 'Within Budget',
    },
    memberTable: [],
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
      
      // Re-fetch summary data to update budget metrics
      const sumRes = await api.get('/dashboard/summary');
      setSummaryData(sumRes.data.summary);
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

      {/* 2. My Budget Dashboard */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">My Budget Status</h2>
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
          {/* Allocated Budget */}
          <div className="glass-card p-5 rounded-2xl">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Allocated Budget</span>
              <div className="h-8 w-8 bg-brand-500/10 rounded-lg flex items-center justify-center text-brand-400">
                <Wallet className="h-4 w-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-white mt-3">₹{(summaryData.myBudget?.allocatedBudget || 0).toLocaleString('en-IN')}</p>
            <p className="text-[10px] text-slate-500 mt-1">Your monthly contribution</p>
          </div>

          {/* Rent Share */}
          <div className="glass-card p-5 rounded-2xl">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Rent Share</span>
              <div className="h-8 w-8 bg-indigo-550/15 rounded-lg flex items-center justify-center text-indigo-400">
                <Home className="h-4 w-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-white mt-3">₹{(summaryData.myBudget?.rentShare || 0).toLocaleString('en-IN')}</p>
            <p className="text-[10px] text-slate-500 mt-1">Deducted from budget</p>
          </div>

          {/* Spent (Expenses) */}
          <div className="glass-card p-5 rounded-2xl">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-455 uppercase tracking-wider">Expenses</span>
              <div className="h-8 w-8 bg-blue-500/10 rounded-lg flex items-center justify-center text-blue-400">
                <TrendingUp className="h-4 w-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-white mt-3">₹{(summaryData.myBudget?.spent || 0).toLocaleString('en-IN')}</p>
            <p className="text-[10px] text-slate-500 mt-1">Your spent this month</p>
          </div>

          {/* Remaining */}
          <div className="glass-card p-5 rounded-2xl">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-455 uppercase tracking-wider">Remaining</span>
              <div className="h-8 w-8 bg-emerald-500/10 rounded-lg flex items-center justify-center text-emerald-400">
                <ShieldCheck className="h-4 w-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-white mt-3">₹{(summaryData.myBudget?.remaining || 0).toLocaleString('en-IN')}</p>
            <p className="text-[10px] text-slate-500 mt-1">Available balance</p>
          </div>

          {/* Extra Spending */}
          <div className={`glass-card p-5 rounded-2xl border ${summaryData.myBudget?.extra > 0 ? 'border-danger-500/20 bg-danger-950/5' : 'border-slate-800/50'}`}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-455 uppercase tracking-wider">Extra</span>
              <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${summaryData.myBudget?.extra > 0 ? 'bg-danger-500/10 text-danger-400' : 'bg-slate-850 text-slate-550'}`}>
                <AlertCircle className="h-4 w-4" />
              </div>
            </div>
            <div className="flex items-baseline space-x-1.5 mt-3">
              <p className="text-2xl font-black text-white">₹{(summaryData.myBudget?.extra || 0).toLocaleString('en-IN')}</p>
              {summaryData.myBudget?.extra > 0 && (
                <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-md bg-danger-500/10 border border-danger-500/20 text-danger-400">
                  ⚠ Over Budget
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-500 mt-1">Exceeded budget limit</p>
          </div>
        </div>
      </div>

      {/* 2.5 Room Budget Overview */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Room Dashboard Overview</h2>
        <div className="grid grid-cols-2 sm:grid-cols-7 gap-4">
          {/* Members */}
          <div className="glass-card p-4 rounded-2xl">
            <span className="text-[9px] font-bold text-slate-450 uppercase tracking-wider">Total Members</span>
            <p className="text-lg font-black text-white mt-1">{(summaryData.roomBudget?.totalMembers || 0)}</p>
            <p className="text-[8px] text-slate-550 mt-0.5">Active in room</p>
          </div>

          {/* Room Rent */}
          <div className="glass-card p-4 rounded-2xl">
            <span className="text-[9px] font-bold text-slate-450 uppercase tracking-wider">Room Rent</span>
            <p className="text-lg font-black text-white mt-1">₹{(summaryData.roomBudget?.roomRent || 0).toLocaleString('en-IN')}</p>
            <p className="text-[8px] text-slate-550 mt-0.5">Total monthly rent</p>
          </div>

          {/* Rent Share Per Person */}
          <div className="glass-card p-4 rounded-2xl">
            <span className="text-[9px] font-bold text-slate-450 uppercase tracking-wider">Rent Share</span>
            <p className="text-lg font-black text-white mt-1">₹{(summaryData.roomBudget?.rentShare || 0).toLocaleString('en-IN')}</p>
            <p className="text-[8px] text-slate-550 mt-0.5">Rent share per person</p>
          </div>

          {/* Monthly Contribution Per Person */}
          <div className="glass-card p-4 rounded-2xl">
            <span className="text-[9px] font-bold text-slate-450 uppercase tracking-wider">Contribution</span>
            <p className="text-lg font-black text-white mt-1">₹{(summaryData.roomBudget?.monthlyContribution || 0).toLocaleString('en-IN')}</p>
            <p className="text-[8px] text-slate-550 mt-0.5">Allocated budget</p>
          </div>

          {/* Total Room Expenses */}
          <div className="glass-card p-4 rounded-2xl">
            <span className="text-[9px] font-bold text-slate-455 uppercase tracking-wider">Room Expenses</span>
            <p className="text-lg font-black text-white mt-1">₹{(summaryData.roomBudget?.totalRoomExpenses || 0).toLocaleString('en-IN')}</p>
            <p className="text-[8px] text-slate-550 mt-0.5">Recorded this month</p>
          </div>

          {/* Total Remaining Budget */}
          <div className="glass-card p-4 rounded-2xl">
            <span className="text-[9px] font-bold text-slate-450 uppercase tracking-wider">Remaining Pool</span>
            <p className="text-lg font-black text-emerald-400 mt-1">₹{(summaryData.roomBudget?.totalRemainingBudget || 0).toLocaleString('en-IN')}</p>
            <p className="text-[8px] text-slate-550 mt-0.5">Room unspent budget</p>
          </div>

          {/* Total Extra Expenses */}
          <div className={`glass-card p-4 rounded-2xl border ${summaryData.roomBudget?.totalExtraExpenses > 0 ? 'border-danger-500/20' : 'border-slate-800/50'}`}>
            <span className="text-[9px] font-bold text-slate-450 uppercase tracking-wider">Extra Expenses</span>
            <p className={`text-lg font-black mt-1 ${summaryData.roomBudget?.totalExtraExpenses > 0 ? 'text-danger-400' : 'text-slate-350'}`}>
              ₹{(summaryData.roomBudget?.totalExtraExpenses || 0).toLocaleString('en-IN')}
            </p>
            <p className="text-[8px] text-slate-550 mt-0.5">Total roommate excesses</p>
          </div>
        </div>
      </div>

      {/* 3. Member Table Grid */}
      <div className="glass-panel p-5 rounded-2xl">
        <h2 className="text-sm font-bold text-slate-200 border-b border-slate-800 pb-3 mb-4">Member Budget & Spending Table</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-[10px] text-slate-400 uppercase font-semibold">
                <th className="py-2.5 px-3">Name</th>
                <th className="py-2.5 px-3">Budget</th>
                <th className="py-2.5 px-3">Spent</th>
                <th className="py-2.5 px-3">Remaining</th>
                <th className="py-2.5 px-3">Extra</th>
                <th className="py-2.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850 text-xs">
              {(summaryData.memberTable || []).map((m) => (
                <tr key={m.userId} className="hover:bg-slate-900/40 transition-colors">
                  <td className="py-3 px-3 flex items-center space-x-2">
                    <img
                      src={m.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${m.name}`}
                      alt="avatar"
                      className="h-6 w-6 rounded-full bg-slate-800 border border-slate-700"
                    />
                    <span className="font-semibold text-slate-200">{m.name} {m.userId === user?._id ? '(You)' : ''}</span>
                  </td>
                  <td className="py-3 px-3 text-slate-350">₹{m.budget.toLocaleString('en-IN')}</td>
                  <td className="py-3 px-3 text-slate-200 font-medium">₹{m.spent.toLocaleString('en-IN')}</td>
                  <td className="py-3 px-3 text-emerald-450 font-medium">₹{m.remaining.toLocaleString('en-IN')}</td>
                  <td className={`py-3 px-3 font-semibold ${m.extra > 0 ? 'text-danger-400' : 'text-slate-500'}`}>₹{m.extra.toLocaleString('en-IN')}</td>
                  <td className="py-3 px-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      m.status === 'Over Budget'
                        ? 'bg-danger-500/10 border border-danger-500/20 text-danger-400'
                        : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-455'
                    }`}>
                      {m.status}
                    </span>
                  </td>
                </tr>
              ))}
              {(!summaryData.memberTable || summaryData.memberTable.length === 0) && (
                <tr>
                  <td colSpan="6" className="py-6 text-center text-xs text-slate-500">No member statistics found</td>
                </tr>
              )}
            </tbody>
          </table>
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
                    <p className="text-slate-200 font-medium whitespace-pre-line">{act.details}</p>
                    <p className="text-slate-500 text-[10px] mt-1">{new Date(act.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} • {new Date(act.createdAt).toLocaleDateString()}</p>
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

            <form onSubmit={handleAddExpense} className="space-y-4 mt-4">
              {/* Title Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Description</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="bg-slate-950 border border-slate-800 focus:border-brand-500 block w-full px-3 py-2 rounded-xl text-sm text-slate-100 placeholder-slate-650 focus:outline-none focus:ring-1 focus:ring-brand-500 mt-1"
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
                    className="bg-slate-950 border border-slate-800 focus:border-brand-500 block w-full px-3 py-2 rounded-xl text-sm text-slate-100 placeholder-slate-650 focus:outline-none focus:ring-1 focus:ring-brand-500 mt-1"
                    placeholder="e.g. 850"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="bg-slate-950 border border-slate-800 focus:border-brand-500 block w-full px-3 py-2.5 rounded-xl text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-brand-500 mt-1"
                  >
                    {['Rent', 'Electricity', 'WiFi', 'Vegetables', 'Eggs', 'Chicken', 'Milk', 'Petrol', 'Gas', 'Other'].map(cat => (
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
                  className="bg-slate-950 border border-slate-800 focus:border-brand-500 block w-full px-3 py-2.5 rounded-xl text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-brand-500 mt-1"
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
