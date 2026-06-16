import React, { useState, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import api, { API_URL } from '../utils/api';
import { 
  Plus, 
  Search, 
  Calendar, 
  User, 
  SlidersHorizontal,
  Home, 
  Zap, 
  Wifi, 
  Coins, 
  ChevronLeft, 
  ChevronRight,
  Edit2,
  Trash2,
  Image as ImageIcon,
  Check,
  X,
  AlertCircle,
  Egg,
  Fuel,
  Droplet,
  Flame,
  ShoppingBag,
  UtensilsCrossed
} from 'lucide-react';

const Expenses = () => {
  const { 
    user, 
    members, 
    balances, 
    setBalancesAndSettlements,
    expenses,
    setExpenses
  } = useAppStore();

  // Filter States
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedMember, setSelectedMember] = useState('');
  
  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalExpensesCount, setTotalExpensesCount] = useState(0);

  // Modal States (Add/Edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null); // null for Add, expense object for Edit
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Other');
  const [paidBy, setPaidBy] = useState(user?._id || '');
  const [splitAmong, setSplitAmong] = useState([]);
  const [receiptFile, setReceiptFile] = useState(null);
  
  const [modalError, setModalError] = useState('');
  const [modalLoading, setModalLoading] = useState(false);
  
  // Lightbox
  const [lightboxUrl, setLightboxUrl] = useState(null);

  // Fetch expenses based on filters and pagination
  const fetchExpenses = async () => {
    try {
      let url = `/expenses?page=${currentPage}&limit=12`;
      if (selectedMonth) url += `&month=${selectedMonth}`;
      if (selectedCategory) url += `&category=${selectedCategory}`;
      if (selectedMember) url += `&memberId=${selectedMember}`;

      const res = await api.get(url);
      setExpenses(res.data.expenses);
      setTotalPages(res.data.pagination.pages);
      setTotalExpensesCount(res.data.pagination.total);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (user?.activeRoomId) {
      fetchExpenses();
    }
  }, [user?.activeRoomId, currentPage, selectedMonth, selectedCategory, selectedMember]);

  // Reset page to 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedMonth, selectedCategory, selectedMember]);

  // Populate form when editing an expense
  useEffect(() => {
    if (editingExpense) {
      setTitle(editingExpense.title);
      setAmount(editingExpense.amount.toString());
      setCategory(editingExpense.category);
      setPaidBy(editingExpense.paidBy?._id || editingExpense.paidBy);
      setSplitAmong(editingExpense.splitAmong.map(s => s._id || s));
    } else {
      setTitle('');
      setAmount('');
      setCategory('Other');
      setPaidBy(user?._id || '');
      setSplitAmong(members.map(m => m._id));
    }
    setReceiptFile(null);
    setModalError('');
  }, [editingExpense, isModalOpen, members, user]);

  const toggleMemberInSplit = (memberId) => {
    if (splitAmong.includes(memberId)) {
      setSplitAmong(splitAmong.filter(id => id !== memberId));
    } else {
      setSplitAmong([...splitAmong, memberId]);
    }
  };

  const handleSaveExpense = async (e) => {
    e.preventDefault();
    if (!title || !amount) {
      return setModalError('Please enter description and amount');
    }
    if (parseFloat(amount) <= 0) {
      return setModalError('Amount must be positive');
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

      let res;
      if (editingExpense) {
        res = await api.put(`/expenses/${editingExpense._id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        
        // Update local array
        const updated = expenses.map(e => e._id === editingExpense._id ? res.data.expense : e);
        setExpenses(updated);
      } else {
        res = await api.post('/expenses', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        
        // Add to local array
        setExpenses([res.data.expense, ...expenses]);
      }

      setBalancesAndSettlements(res.data.balances, res.data.settlements);
      setIsModalOpen(false);
      setEditingExpense(null);
    } catch (err) {
      console.error(err);
      setModalError(err.response?.data?.message || 'Failed to save expense');
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteExpense = async (expenseId) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) return;
    try {
      const res = await api.delete(`/expenses/${expenseId}`);
      setExpenses(expenses.filter(e => e._id !== expenseId));
      setBalancesAndSettlements(res.data.balances, res.data.settlements);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to delete expense');
    }
  };

  const getCategoryIcon = (cat) => {
    const iconClass = "h-5 w-5";
    switch (cat) {
      case 'Rent': return <Home className={`${iconClass} text-indigo-400`} />;
      case 'Electricity': return <Zap className={`${iconClass} text-yellow-400`} />;
      case 'WiFi': return <Wifi className={`${iconClass} text-blue-400`} />;
      case 'Vegetables': return <ShoppingBag className={`${iconClass} text-emerald-400`} />;
      case 'Eggs': return <Egg className={`${iconClass} text-amber-200`} />;
      case 'Chicken': return <UtensilsCrossed className={`${iconClass} text-red-400`} />;
      case 'Milk': return <ShoppingBag className={`${iconClass} text-slate-350`} />;
      case 'Petrol': return <Fuel className={`${iconClass} text-purple-400`} />;
      case 'Water': return <Droplet className={`${iconClass} text-sky-400`} />;
      case 'Gas': return <Flame className={`${iconClass} text-orange-400`} />;
      default: return <Coins className={`${iconClass} text-slate-400`} />;
    }
  };

  const handleOpenLightbox = (url) => {
    // Resolve local storage uploads prefix if not cloud
    if (url.startsWith('/uploads')) {
      const baseApiUrl = API_URL.replace('/api/v1', '');
      setLightboxUrl(`${baseApiUrl}${url}`);
    } else {
      setLightboxUrl(url);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Expenses</h1>
          <p className="text-xs text-slate-400 mt-0.5">Track and edit shared roommate bills ({totalExpensesCount} total)</p>
        </div>
        <button
          onClick={() => {
            setEditingExpense(null);
            setIsModalOpen(true);
          }}
          className="glow-btn bg-brand-600 text-white px-4 py-2.5 rounded-xl font-bold flex items-center justify-center space-x-2 text-sm shadow-lg shadow-brand-500/20 hover:bg-brand-500 transition-colors"
        >
          <Plus className="h-4.5 w-4.5" />
          <span>Add Expense</span>
        </button>
      </div>

      {/* Filters Card */}
      <div className="glass-panel p-4 rounded-2xl">
        <div className="flex items-center space-x-2 text-slate-300 mb-3 text-xs font-semibold uppercase tracking-wider">
          <SlidersHorizontal className="h-4 w-4 text-brand-400" />
          <span>Filter Expenses</span>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Month */}
          <div>
            <div className="relative rounded-xl shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Calendar className="h-4 w-4 text-slate-500" />
              </div>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-slate-900 border border-slate-800 focus:border-brand-500 block w-full pl-10 pr-3 py-2 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-slate-900 border border-slate-800 focus:border-brand-500 block w-full px-3 py-2 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              <option value="">All Categories</option>
              {['Rent', 'Electricity', 'WiFi', 'Vegetables', 'Eggs', 'Chicken', 'Milk', 'Petrol', 'Water', 'Gas', 'Other'].map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Paid By Member */}
          <div>
            <div className="relative rounded-xl shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-4 w-4 text-slate-500" />
              </div>
              <select
                value={selectedMember}
                onChange={(e) => setSelectedMember(e.target.value)}
                className="bg-slate-900 border border-slate-800 focus:border-brand-500 block w-full pl-10 pr-3 py-2 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500"
              >
                <option value="">All Roommates</option>
                {members.map(m => (
                  <option key={m._id} value={m._id}>{m.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Clear filters trigger */}
        {(selectedMonth || selectedCategory || selectedMember) && (
          <button
            onClick={() => {
              setSelectedMonth('');
              setSelectedCategory('');
              setSelectedMember('');
            }}
            className="mt-3 text-[11px] text-brand-450 hover:underline hover:text-brand-300 font-semibold"
          >
            Clear Active Filters
          </button>
        )}
      </div>

      {/* Expenses List */}
      <div className="space-y-3">
        {expenses.length === 0 ? (
          <div className="glass-panel py-12 rounded-2xl text-center">
            <Coins className="h-12 w-12 text-slate-600 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-400">No expenses found</p>
            <p className="text-xs text-slate-500 mt-1">Try resetting the filters or add a new shared expense.</p>
          </div>
        ) : (
          expenses.map((expense) => {
            const isOwner = expense.paidBy?._id?.toString() === user?._id?.toString();
            // Check if user is room admin to enable admin delete/edit override
            const memberRecord = members.find(m => m._id === user?._id);
            const isAdmin = memberRecord?.role === 'admin';

            return (
              <div key={expense._id} className="glass-card p-4 rounded-xl flex items-center justify-between gap-4">
                {/* Category Icon & description */}
                <div className="flex items-center space-x-3 min-w-0">
                  <div className="h-10 w-10 bg-slate-950/80 rounded-xl flex items-center justify-center flex-shrink-0">
                    {getCategoryIcon(expense.category)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-200 truncate">{expense.title}</p>
                    <p className="text-slate-500 text-[11px] mt-0.5 truncate">
                      Paid by <span className="font-semibold text-slate-400">{expense.paidBy?.name || 'Deleted'}</span> • Split among {expense.splitAmong?.length} members
                    </p>
                    <p className="text-[10px] text-slate-600 mt-0.5">
                      {new Date(expense.date).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                    </p>
                  </div>
                </div>

                {/* Amount, Receipt & actions */}
                <div className="flex items-center space-x-4 flex-shrink-0">
                  <div className="text-right">
                    <p className="text-sm font-black text-white">₹{expense.amount.toFixed(2)}</p>
                    <span className="text-[10px] bg-slate-900 border border-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-medium mt-1 inline-block">
                      {expense.category}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-1.5 border-l border-slate-800 pl-4">
                    {expense.receiptUrl && (
                      <button
                        onClick={() => handleOpenLightbox(expense.receiptUrl)}
                        className="p-1.5 text-slate-500 hover:text-brand-400 rounded-lg hover:bg-slate-900"
                        title="View Receipt"
                      >
                        <ImageIcon className="h-4.5 w-4.5" />
                      </button>
                    )}

                    {(isOwner || isAdmin) && (
                      <>
                        <button
                          onClick={() => {
                            setEditingExpense(expense);
                            setIsModalOpen(true);
                          }}
                          className="p-1.5 text-slate-500 hover:text-brand-400 rounded-lg hover:bg-slate-900"
                          title="Edit"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteExpense(expense._id)}
                          className="p-1.5 text-slate-500 hover:text-danger-500 rounded-lg hover:bg-slate-900"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-slate-900 pt-4 mt-6">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="bg-slate-900 border border-slate-800 text-slate-350 hover:bg-slate-850 hover:text-white px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1 disabled:opacity-40 disabled:pointer-events-none transition-all"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Previous</span>
          </button>
          
          <span className="text-xs text-slate-400">
            Page {currentPage} of {totalPages}
          </span>

          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="bg-slate-900 border border-slate-800 text-slate-355 hover:bg-slate-855 hover:text-white px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1 disabled:opacity-40 disabled:pointer-events-none transition-all"
          >
            <span>Next</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl p-6 relative overflow-y-auto max-h-[90vh]">
            <button
              onClick={() => {
                setIsModalOpen(false);
                setEditingExpense(null);
              }}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-850 rounded-lg"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-lg font-bold text-white flex items-center space-x-2">
              <ImageIcon className="h-5 w-5 text-brand-400" />
              <span>{editingExpense ? 'Modify Expense' : 'Add Shared Expense'}</span>
            </h3>

            {modalError && (
              <div className="mt-4 bg-danger-500/10 border border-danger-500/20 text-danger-500 px-4 py-2.5 rounded-xl text-xs flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleSaveExpense} className="mt-4 space-y-4">
              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Description / Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="bg-slate-950 border border-slate-800 focus:border-brand-500 block w-full px-3 py-2 rounded-xl text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-brand-500 mt-1"
                  placeholder="e.g. Chicken & Eggs, LPG Cylinders"
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
                    placeholder="e.g. 120"
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
                          onChange={() => {}}
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
                    <ImageIcon className="h-4 w-4" />
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

      {/* Lightbox for Receipt Image */}
      {lightboxUrl && (
        <div 
          onClick={() => setLightboxUrl(null)}
          className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[100] flex items-center justify-center p-4 cursor-zoom-out"
        >
          <button className="absolute top-4 right-4 p-2 bg-slate-900 border border-slate-800 text-slate-200 rounded-xl">
            <X className="h-5 w-5" />
          </button>
          <img 
            src={lightboxUrl} 
            alt="Receipt Lightbox" 
            className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl border border-slate-800"
            onClick={(e) => e.stopPropagation()} // stop close on image click
          />
        </div>
      )}
    </div>
  );
};

export default Expenses;
