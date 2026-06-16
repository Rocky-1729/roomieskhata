import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import api from '../utils/api';
import { Home, FileText, Users, Plus, AlertCircle, ArrowLeft } from 'lucide-react';

const CreateRoom = () => {
  const navigate = useNavigate();
  const { updateUserRoom } = useAppStore();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [maxMembers, setMaxMembers] = useState(10);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name) {
      return setError('Please enter a room name');
    }

    setError('');
    setLoading(true);

    try {
      const res = await api.post('/rooms', {
        name,
        description,
        maxMembers: parseInt(maxMembers),
      });

      // Update state
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

      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10">
        <Link to="/join-room" className="inline-flex items-center text-xs text-slate-400 hover:text-white space-x-1 mb-4 transition-colors">
          <ArrowLeft className="h-3 w-3" />
          <span>Back to Join Room</span>
        </Link>
        <h2 className="text-3xl font-extrabold text-white">Create a Room</h2>
        <p className="mt-1.5 text-sm text-slate-400">
          Set up a new ledger room and invite your flatmates.
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
                  className="bg-slate-900 border border-slate-800 focus:border-brand-500 block w-full pl-10 pr-3 py-2.5 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  placeholder="e.g. Flat 302, Green Glen Layout"
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
                  rows="3"
                  className="bg-slate-900 border border-slate-800 focus:border-brand-500 block w-full pl-10 pr-3 py-2 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-brand-500 resize-none"
                  placeholder="e.g. Monthly rent, electricity split, and common kitchen grocery tracking."
                />
              </div>
            </div>

            {/* Max Members */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Max Members Limit</label>
              <div className="mt-1 relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Users className="h-4 w-4 text-slate-500" />
                </div>
                <input
                  type="number"
                  min="2"
                  max="100"
                  value={maxMembers}
                  onChange={(e) => setMaxMembers(e.target.value)}
                  className="bg-slate-900 border border-slate-800 focus:border-brand-500 block w-full pl-10 pr-3 py-2.5 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
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
