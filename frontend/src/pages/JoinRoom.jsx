import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import api from '../utils/api';
import { Hash, LogIn, Plus, AlertCircle, LogOut } from 'lucide-react';

const JoinRoom = () => {
  const navigate = useNavigate();
  const { updateUserRoom, logout } = useAppStore();

  const [roomCode, setRoomCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!roomCode) {
      return setError('Please enter a room code');
    }

    if (roomCode.trim().length !== 8) {
      return setError('Room code must be exactly 8 characters long');
    }

    setError('');
    setLoading(true);

    try {
      const res = await api.post('/rooms/join', {
        roomCode: roomCode.trim().toUpperCase(),
      });

      // Update active room linkage
      updateUserRoom(res.data.room._id);
      
      // Navigate to dashboard
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to join room. Verify the code.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative gradient */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10">
        <h2 className="text-3xl font-extrabold text-white">Join a Room</h2>
        <p className="mt-1.5 text-sm text-slate-400">
          Enter an 8-digit Room Code to share expenses with your roommates.
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

          <form onSubmit={handleJoin} className="space-y-4">
            {/* Room Code */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Room Code</label>
              <div className="mt-1 relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Hash className="h-4 w-4 text-slate-500" />
                </div>
                <input
                  type="text"
                  required
                  maxLength="8"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value)}
                  className="bg-slate-900 border border-slate-800 focus:border-brand-500 block w-full pl-10 pr-3 py-2.5 rounded-xl text-sm text-slate-100 placeholder-slate-500 uppercase tracking-widest focus:outline-none focus:ring-1 focus:ring-brand-500"
                  placeholder="e.g. ABCD1234"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full glow-btn bg-brand-600 hover:bg-brand-500 text-white py-2.5 rounded-xl font-bold flex items-center justify-center space-x-2 text-sm transition-colors mt-6"
            >
              {loading ? (
                <span>Joining Room...</span>
              ) : (
                <>
                  <LogIn className="h-4 w-4" />
                  <span>Join Room</span>
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="mt-6 flex items-center justify-between">
            <span className="w-1/4 border-b border-slate-800"></span>
            <span className="text-[10px] text-slate-500 uppercase font-semibold">Or Setup a New Flat</span>
            <span className="w-1/4 border-b border-slate-800"></span>
          </div>

          <Link
            to="/create-room"
            className="w-full mt-4 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-200 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center space-x-2 hover:border-slate-700 transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>Create a Room instead</span>
          </Link>

          <button
            onClick={handleLogout}
            className="w-full mt-4 text-xs text-slate-500 hover:text-danger-500 flex items-center justify-center space-x-1 py-1 hover:underline transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Log Out</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default JoinRoom;
