import React, { useState, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import api from '../utils/api';
import { 
  ArrowLeftRight, 
  Clock, 
  DollarSign, 
  ArrowRight, 
  CheckCircle,
  X,
  AlertCircle,
  QrCode,
  Smartphone
} from 'lucide-react';

const Settle = () => {
  const { user, balances, settlements, members, setBalancesAndSettlements } = useAppStore();

  const [settlementHistory, setSettlementHistory] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Logger Form state
  const [payerId, setPayerId] = useState('');
  const [payeeId, setPayeeId] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [customUpi, setCustomUpi] = useState('');
  
  const [modalError, setModalError] = useState('');
  const [modalLoading, setModalLoading] = useState(false);

  // UPI QR Code state
  const [activeQrUrl, setActiveQrUrl] = useState(null);
  const [qrPayeeName, setQrPayeeName] = useState('');
  const [qrAmount, setQrAmount] = useState('');

  // Fetch settlement history
  const fetchHistory = async () => {
    try {
      const res = await api.get('/settlements/history');
      setSettlementHistory(res.data.settlements);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (user?.activeRoomId) {
      fetchHistory();
    }
  }, [user?.activeRoomId, balances]);

  const handleLogPayment = async (e) => {
    e.preventDefault();
    if (!payerId || !payeeId || !amount) {
      return setModalError('Please specify payer, payee and amount');
    }

    if (payerId === payeeId) {
      return setModalError('Payer and Payee cannot be the same person');
    }

    if (parseFloat(amount) <= 0) {
      return setModalError('Amount must be greater than zero');
    }

    setModalError('');
    setModalLoading(true);

    try {
      const res = await api.post('/settlements', {
        payerId,
        payeeId,
        amount: parseFloat(amount),
        paymentMethod,
      });

      // Update Zustand balances/settlements
      setBalancesAndSettlements(res.data.balances, res.data.settlements);
      
      // Close modal
      setIsModalOpen(false);
      
      // Reset form
      setPayerId('');
      setPayeeId('');
      setAmount('');
      setPaymentMethod('Cash');
    } catch (err) {
      console.error(err);
      setModalError(err.response?.data?.message || 'Failed to record payment');
    } finally {
      setModalLoading(false);
    }
  };

  // Helper to open Logger Modal and prepopulate
  const handleQuickSettle = (fromId, toId, recAmount) => {
    setPayerId(fromId);
    setPayeeId(toId);
    setAmount(recAmount.toString());
    setPaymentMethod('UPI');
    setIsModalOpen(true);
  };

  // Generates a UPI Deep Link and displays QR Modal
  const generateUpiQr = (payeeName, recommendedAmount) => {
    // UPI ID placeholder if not configured in settings
    // In real app, we fetch the payee user's upiId from the database
    // For demo/ease of use, we will prompt user or generate standard address using payee email prefix
    const payeeMember = members.find(m => m.name === payeeName);
    let upiAddress = '';
    
    if (payeeMember) {
      // Simulate UPI ID generation from email for demonstration: e.g. hari@oksbi
      const emailPrefix = payeeMember.email.split('@')[0];
      upiAddress = `${emailPrefix}@oksbi`;
    } else {
      upiAddress = 'roomiesledger@oksbi';
    }

    setQrPayeeName(payeeName);
    setQrAmount(recommendedAmount.toFixed(2));

    // Construct standard UPI Pay URL scheme
    // format: upi://pay?pa=address&pn=name&am=amount&cu=INR
    const upiUrl = `upi://pay?pa=${encodeURIComponent(upiAddress)}&pn=${encodeURIComponent(payeeName)}&am=${recommendedAmount.toFixed(2)}&cu=INR`;
    
    // Generate QR code using QRServer API
    const qrCodeServiceUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(upiUrl)}`;
    
    setActiveQrUrl(qrCodeServiceUrl);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Settle Up</h1>
          <p className="text-xs text-slate-400 mt-0.5">Clear balances and log cash/UPI transfers between roommates</p>
        </div>
        <button
          onClick={() => {
            setPayerId(user?._id || '');
            setIsModalOpen(true);
          }}
          className="glow-btn bg-brand-600 text-white px-4 py-2.5 rounded-xl font-bold flex items-center justify-center space-x-2 text-sm shadow-lg shadow-brand-500/20 hover:bg-brand-500 transition-colors"
        >
          <DollarSign className="h-4.5 w-4.5" />
          <span>Record a Payment</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Recommendations */}
        <div className="glass-panel p-5 rounded-2xl flex flex-col">
          <div className="flex items-center space-x-2 border-b border-slate-800 pb-3 mb-4">
            <ArrowLeftRight className="h-4.5 w-4.5 text-brand-400" />
            <h2 className="text-sm font-bold text-slate-200">Recommended Settlements</h2>
          </div>

          <div className="flex-1 space-y-4">
            {settlements.length === 0 ? (
              <div className="text-center py-12 flex flex-col justify-center items-center h-full">
                <CheckCircle className="h-12 w-12 text-emerald-400 mb-3" />
                <p className="text-sm font-bold text-slate-300">All Roomies Settled!</p>
                <p className="text-xs text-slate-500 mt-1">No debts outstanding inside the group.</p>
              </div>
            ) : (
              settlements.map((s, idx) => {
                const isMyDebt = s.from === user?._id;
                
                return (
                  <div key={idx} className="glass-card p-4 rounded-xl flex items-center justify-between gap-4">
                    <div className="flex items-center space-x-3">
                      <div className="text-xs">
                        <span className={`font-bold ${isMyDebt ? 'text-rose-400' : 'text-slate-300'}`}>{s.fromName}</span>
                        <span className="text-slate-500 mx-1.5">owes</span>
                        <span className="font-bold text-slate-200">{s.toName}</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-extrabold text-white">₹{s.amount.toFixed(2)}</span>
                      
                      {/* Settle Actions */}
                      <div className="flex items-center space-x-1.5 border-l border-slate-800 pl-3">
                        <button
                          onClick={() => generateUpiQr(s.toName, s.amount)}
                          className="p-1.5 text-slate-400 hover:text-brand-450 rounded-lg hover:bg-slate-900"
                          title="Generate UPI QR Code"
                        >
                          <QrCode className="h-4.5 w-4.5" />
                        </button>
                        <button
                          onClick={() => handleQuickSettle(s.from, s.to, s.amount)}
                          className="bg-brand-600/10 hover:bg-brand-600 text-brand-400 hover:text-white px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all"
                        >
                          Log Paid
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: History of Settlements */}
        <div className="glass-panel p-5 rounded-2xl flex flex-col">
          <div className="flex items-center space-x-2 border-b border-slate-800 pb-3 mb-4">
            <Clock className="h-4.5 w-4.5 text-brand-400" />
            <h2 className="text-sm font-bold text-slate-200">Past Payments History</h2>
          </div>

          <div className="flex-1 space-y-4 max-h-[450px] overflow-y-auto pr-1">
            {settlementHistory.length === 0 ? (
              <p className="text-center text-xs py-12 text-slate-500">No settlements logged yet</p>
            ) : (
              settlementHistory.map((sh) => (
                <div key={sh._id} className="text-xs bg-slate-950/40 border border-slate-900 p-3.5 rounded-xl flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <img
                      src={sh.payerId?.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${sh.payerId?.name}`}
                      alt="avatar"
                      className="h-7 w-7 rounded-full bg-slate-900 border border-slate-800"
                    />
                    <div>
                      <p className="text-slate-200">
                        <span className="font-semibold text-slate-300">{sh.payerId?.name}</span> paid{' '}
                        <span className="font-semibold text-slate-350">{sh.payeeId?.name}</span>
                      </p>
                      <p className="text-slate-500 text-[10px] mt-0.5">
                        {new Date(sh.date).toLocaleDateString()} via {sh.paymentMethod}
                      </p>
                    </div>
                  </div>
                  <span className="font-extrabold text-emerald-450">₹{sh.amount.toFixed(2)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Settlement Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl shadow-2xl p-6 relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-850 rounded-lg"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-lg font-bold text-white flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-brand-400" />
              <span>Log Settlement Payment</span>
            </h3>

            {modalError && (
              <div className="mt-4 bg-danger-500/10 border border-danger-500/20 text-danger-500 px-4 py-2.5 rounded-xl text-xs flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleLogPayment} className="mt-4 space-y-4">
              {/* Payer */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Payer (Who Paid)</label>
                <select
                  value={payerId}
                  onChange={(e) => setPayerId(e.target.value)}
                  className="bg-slate-950 border border-slate-800 focus:border-brand-500 block w-full px-3 py-2 rounded-xl text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-brand-500 mt-1"
                >
                  <option value="">Select Payer</option>
                  {members.map(member => (
                    <option key={member._id} value={member._id}>{member.name} {member._id === user?._id ? '(You)' : ''}</option>
                  ))}
                </select>
              </div>

              {/* Payee */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Payee (Who Received)</label>
                <select
                  value={payeeId}
                  onChange={(e) => setPayeeId(e.target.value)}
                  className="bg-slate-950 border border-slate-800 focus:border-brand-500 block w-full px-3 py-2 rounded-xl text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-brand-500 mt-1"
                >
                  <option value="">Select Payee</option>
                  {members.map(member => (
                    <option key={member._id} value={member._id}>{member.name} {member._id === user?._id ? '(You)' : ''}</option>
                  ))}
                </select>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Amount Paid (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="bg-slate-950 border border-slate-800 focus:border-brand-500 block w-full px-3 py-2 rounded-xl text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-brand-500 mt-1"
                  placeholder="e.g. 500"
                />
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="bg-slate-950 border border-slate-800 focus:border-brand-500 block w-full px-3 py-2 rounded-xl text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-brand-500 mt-1"
                >
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={modalLoading}
                className="w-full glow-btn bg-brand-600 hover:bg-brand-500 text-white py-2.5 rounded-xl font-bold flex items-center justify-center space-x-2 text-sm transition-colors mt-6"
              >
                {modalLoading ? <span>Logging Payment...</span> : <span>Log Payment</span>}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* UPI QR Display Modal */}
      {activeQrUrl && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-2xl shadow-2xl p-6 relative text-center">
            <button
              onClick={() => setActiveQrUrl(null)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-850 rounded-lg"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-base font-bold text-white mb-1">Scan & Pay via UPI</h3>
            <p className="text-xs text-slate-400">Pay to <span className="font-semibold text-slate-200">{qrPayeeName}</span></p>

            <div className="bg-white p-3 rounded-2xl inline-block mt-4 shadow-inner">
              <img src={activeQrUrl} alt="UPI QR Code" className="h-44 w-44 object-contain" />
            </div>

            <div className="mt-4 bg-slate-950/50 border border-slate-850 p-3 rounded-xl flex items-center justify-center space-x-2 text-xs">
              <Smartphone className="h-4 w-4 text-brand-400" />
              <span className="text-slate-300 font-medium">Pay Recommended Amount: ₹{qrAmount}</span>
            </div>

            <p className="text-[10px] text-slate-500 mt-3">Scan this code using any UPI app (GPay, PhonePe, Paytm) to complete transfer.</p>

            <button
              onClick={() => setActiveQrUrl(null)}
              className="w-full mt-5 bg-slate-800 hover:bg-slate-750 text-slate-200 py-2 rounded-xl text-xs font-semibold"
            >
              Close QR Code
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settle;
