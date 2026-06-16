import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import api from '../utils/api';
import { 
  Home, 
  FileText, 
  Users, 
  Plus, 
  AlertCircle, 
  ArrowLeft, 
  DollarSign
} from 'lucide-react';

const CreateRoom = () => {
  const navigate = useNavigate();
  const { updateUserRoom } = useAppStore();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [maxMembers, setMaxMembers] = useState(6);
  const [monthlyContribution, setMonthlyContribution] = useState(3750);
  const [roomRent, setRoomRent] = useState(10500);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Live calculations
  const capacity = parseInt(maxMembers) || 1;
  const rent = parseFloat(roomRent) || 0;
  const contribution = parseFloat(monthlyContribution) || 0;
  const rentShare = capacity > 0 ? Math.round(rent / capacity) : 0;
  const initialBudget = Math.max(0, contribution - rentShare);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name) {
      return setError('Please enter a room name');
    }
    if (capacity < 1) {
      return setError('Please enter at least 1 roommate capacity');
    }

    setError('');
    setLoading(true);

    try {
      const res = await api.post('/rooms', {
        name,
        description,
        maxMembers: capacity,
        monthlyContribution: contribution,
        roomRent: rent,
      });

      // Update Zustand state
      updateUserRoom(res.data.room._id);
      
      // Navigate to dashboard
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to create room. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10">
        <Link to="/join-room" className="inline-flex items-center text-xs text-slate-400 hover:text-white space-x-1 mb-4 transition-colors">
          <ArrowLeft className="h-3 w-3" />
          <span>Back to Join Room</span>
        </Link>
        <h2 className="text-3xl font-extrabold text-white tracking-tight">Create a Room</h2>
        <p className="mt-1.5 text-sm text-slate-400">
          Set up a simplified monthly budget ledger and split flat bills.
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="glass-panel py-8 px-6 rounded-2xl shadow-xl">
          {error && (
            <div className="mb-4 bg-danger-500/10 border border-danger-500/20 text-danger-500 px-4 py-2.5 rounded-xl text-xs flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Room Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Room Name</label>
              <div className="mt-1 relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Home className="h-4 w-4 text-slate-500" />
                </div>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-slate-900 border border-slate-800 focus:border-brand-500 block w-full pl-10 pr-3 py-2.5 rounded-xl text-sm text-slate-100 placeholder-slate-550 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  placeholder="e.g. Boys Room A101"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Description (Optional)</label>
              <div className="mt-1 relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 pt-3 flex items-start pointer-events-none">
                  <FileText className="h-4 w-4 text-slate-500" />
                </div>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows="2"
                  className="bg-slate-900 border border-slate-800 focus:border-brand-500 block w-full pl-10 pr-3 py-2 rounded-xl text-sm text-slate-100 placeholder-slate-550 focus:outline-none focus:ring-1 focus:ring-brand-500 resize-none"
                  placeholder="e.g. Flat bills split, common groceries, and settle dashboard."
                />
              </div>
            </div>

            {/* Number of Roommates */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Number of Roommates</label>
              <div className="mt-1 relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Users className="h-4 w-4 text-slate-500" />
                </div>
                <input
                  type="number"
                  min="1"
                  max="100"
                  required
                  value={maxMembers}
                  onChange={(e) => setMaxMembers(e.target.value)}
                  className="bg-slate-900 border border-slate-800 focus:border-brand-500 block w-full pl-10 pr-3 py-2.5 rounded-xl text-sm text-slate-100 placeholder-slate-550 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>
            </div>

            {/* Monthly Contribution */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Monthly Contribution Per Person (₹)</label>
              <div className="mt-1 relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <DollarSign className="h-4 w-4 text-slate-500" />
                </div>
                <input
                  type="number"
                  min="0"
                  required
                  value={monthlyContribution}
                  onChange={(e) => setMonthlyContribution(e.target.value)}
                  className="bg-slate-900 border border-slate-800 focus:border-brand-500 block w-full pl-10 pr-3 py-2.5 rounded-xl text-sm text-slate-100 placeholder-slate-550 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>
            </div>

            {/* Room Rent */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Room Rent (₹)</label>
              <div className="mt-1 relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <DollarSign className="h-4 w-4 text-slate-500" />
                </div>
                <input
                  type="number"
                  min="0"
                  required
                  value={roomRent}
                  onChange={(e) => setRoomRent(e.target.value)}
                  className="bg-slate-900 border border-slate-800 focus:border-brand-500 block w-full pl-10 pr-3 py-2.5 rounded-xl text-sm text-slate-100 placeholder-slate-550 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>
            </div>

            {/* Live Calculation Output Section */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 space-y-2 mt-4">
              <div className="flex justify-between text-xs">
                <span className="text-slate-450 font-semibold">Rent Share Per Person:</span>
                <span className="text-slate-200 font-bold">₹{rentShare.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-xs border-t border-slate-800/60 pt-2">
                <span className="text-slate-450 font-semibold">Initial Remaining Budget:</span>
                <span className="text-brand-400 font-black">₹{initialBudget.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full glow-btn bg-brand-600 hover:bg-brand-500 text-white py-2.5 rounded-xl font-bold flex items-center justify-center space-x-2 text-sm transition-colors mt-6"
            >
              {loading ? (
                <span>Creating Room...</span>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  <span>Create Room</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateRoom;
