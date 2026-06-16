import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import api from '../utils/api';
import { 
  Settings as SettingsIcon, 
  Home, 
  User, 
  LogOut, 
  Copy, 
  Check, 
  Trash2, 
  ArrowLeft,
  AlertTriangle,
  CheckCircle,
  HelpCircle
} from 'lucide-react';

const Settings = () => {
  const navigate = useNavigate();
  const { user, room, members, logout, setRoomData, updateUserRoom } = useAppStore();

  const [roomName, setRoomName] = useState(room?.name || '');
  const [description, setDescription] = useState(room?.description || '');
  const [maxMembers, setMaxMembers] = useState(room?.maxMembers || 10);
  
  const [copied, setCopied] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (room) {
      setRoomName(room.name);
      setDescription(room.description || '');
      setMaxMembers(room.maxMembers);
    }
  }, [room]);

  const isAdmin = room?.adminId === user?._id;

  const copyInviteCode = () => {
    if (!room?.roomCode) return;
    navigator.clipboard.writeText(room.roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleUpdateRoom = async (e) => {
    e.preventDefault();
    if (!roomName) return setErrorMsg('Room name is required');
    
    setLoading(true);
    setErrorMsg('');
    setStatusMsg('');

    try {
      const res = await api.put('/rooms/my-room', {
        name: roomName,
        description,
        maxMembers: parseInt(maxMembers)
      });
      
      // Update store
      setRoomData(res.data.room, members);
      setStatusMsg('Room configuration updated successfully!');
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || 'Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveRoom = async () => {
    const confirmMsg = isAdmin && members.length > 1
      ? 'Warning: You are the Room Admin. Leaving will transfer admin rights to the next oldest roommate. Are you sure you want to leave?'
      : 'Are you sure you want to leave this room? Your expenses will remain, but you will no longer belong to this room ledger.';
      
    if (!window.confirm(confirmMsg)) return;

    setLoading(true);
    try {
      await api.post('/rooms/leave');
      updateUserRoom(null);
      navigate('/join-room');
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to leave room');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRoom = async () => {
    if (!window.confirm('CRITICAL WARNING: This will permanently delete this room AND wipe all expense history, logs, settlements, and member links. This action CANNOT be undone. Proceed?')) return;

    setLoading(true);
    try {
      await api.delete('/rooms/my-room');
      updateUserRoom(null);
      navigate('/join-room');
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to delete room');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Settings</h1>
        <p className="text-xs text-slate-400 mt-0.5">Manage room parameters, copy invite details, and configure account</p>
      </div>

      {statusMsg && (
        <div className="bg-success-500/10 border border-success-500/20 text-success-500 px-4 py-3 rounded-xl text-xs flex items-center space-x-2">
          <CheckCircle className="h-4 w-4" />
          <span>{statusMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="bg-danger-500/10 border border-danger-500/20 text-danger-500 px-4 py-3 rounded-xl text-xs flex items-center space-x-2">
          <AlertTriangle className="h-4 w-4" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* 1. Room Configuration Card */}
      {room ? (
        <div className="glass-panel p-5 rounded-2xl">
          <h2 className="text-sm font-bold text-slate-200 flex items-center space-x-2 border-b border-slate-800 pb-3 mb-4">
            <Home className="h-4.5 w-4.5 text-brand-400" />
            <span>Room settings ({isAdmin ? 'Admin View' : 'Member View'})</span>
          </h2>

          {isAdmin ? (
            <form onSubmit={handleUpdateRoom} className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Room Name</label>
                <input
                  type="text"
                  required
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  className="bg-slate-950 border border-slate-800 focus:border-brand-500 block w-full px-3 py-2.5 rounded-xl text-sm text-slate-100 placeholder-slate-650 focus:outline-none focus:ring-1 focus:ring-brand-500 mt-1"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows="3"
                  className="bg-slate-950 border border-slate-800 focus:border-brand-500 block w-full px-3 py-2.5 rounded-xl text-sm text-slate-100 placeholder-slate-650 focus:outline-none focus:ring-1 focus:ring-brand-500 resize-none mt-1"
                />
              </div>

              {/* Max Members */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Max Members Limit</label>
                <input
                  type="number"
                  min="2"
                  max="100"
                  value={maxMembers}
                  onChange={(e) => setMaxMembers(e.target.value)}
                  className="bg-slate-950 border border-slate-800 focus:border-brand-500 block w-full px-3 py-2.5 rounded-xl text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-brand-500 mt-1"
                />
              </div>

              <div className="flex items-center justify-between pt-3">
                {/* Invite Code display */}
                <div className="flex items-center space-x-2 text-xs">
                  <span className="text-slate-500">Invite Code:</span>
                  <span className="font-mono font-bold text-slate-200 bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-850">
                    {room.roomCode}
                  </span>
                  <button
                    type="button"
                    onClick={copyInviteCode}
                    className="p-1.5 text-slate-450 hover:text-white rounded-lg hover:bg-slate-850"
                  >
                    {copied ? <Check className="h-4 w-4 text-emerald-450" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="glow-btn bg-brand-650 hover:bg-brand-600 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md shadow-brand-500/10"
                >
                  Save Changes
                </button>
              </div>
            </form>
          ) : (
            // Non-admin view
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-2 py-2 border-b border-slate-850/50">
                <span className="text-slate-500">Room Name:</span>
                <span className="col-span-2 text-slate-200 font-semibold">{room.name}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 py-2 border-b border-slate-850/50">
                <span className="text-slate-500">Description:</span>
                <span className="col-span-2 text-slate-400">{room.description || 'No description provided'}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 py-2 border-b border-slate-850/50">
                <span className="text-slate-500">Member Limit:</span>
                <span className="col-span-2 text-slate-305">{members.length} / {room.maxMembers} roommates</span>
              </div>
              <div className="flex items-center justify-between pt-4">
                <div className="flex items-center space-x-2">
                  <span className="text-slate-500">Invite Code:</span>
                  <span className="font-mono font-bold text-slate-200 bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-850">
                    {room.roomCode}
                  </span>
                  <button
                    type="button"
                    onClick={copyInviteCode}
                    className="p-1.5 text-slate-450 hover:text-white rounded-lg hover:bg-slate-850"
                  >
                    {copied ? <Check className="h-4 w-4 text-emerald-450" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : null}

      {/* 2. User Account Card */}
      <div className="glass-panel p-5 rounded-2xl">
        <h2 className="text-sm font-bold text-slate-200 flex items-center space-x-2 border-b border-slate-800 pb-3 mb-4">
          <User className="h-4.5 w-4.5 text-brand-400" />
          <span>User Profile</span>
        </h2>
        
        <div className="flex items-center space-x-4">
          <img
            src={user?.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${user?.name}`}
            alt="User Avatar"
            className="h-12 w-12 rounded-full border border-slate-800 bg-slate-900"
          />
          <div className="text-xs">
            <p className="text-slate-200 font-bold text-sm">{user?.name}</p>
            <p className="text-slate-500 mt-0.5">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* 3. Danger Zone Actions */}
      <div className="glass-panel p-5 rounded-2xl border border-rose-500/15">
        <h2 className="text-sm font-bold text-rose-450 flex items-center space-x-2 border-b border-slate-800 pb-3 mb-4">
          <AlertTriangle className="h-4.5 w-4.5 text-rose-500" />
          <span>Danger Zone</span>
        </h2>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="text-xs max-w-md">
            <p className="font-bold text-slate-200">Leave Active Room</p>
            <p className="text-slate-500 mt-0.5">Exit this room ledger. Expenses you logged will remain, but you won't belong to the group anymore.</p>
          </div>
          <button
            onClick={handleLeaveRoom}
            disabled={loading}
            className="bg-slate-900 border border-slate-800 text-rose-400 hover:text-white hover:bg-rose-600 hover:border-rose-600 px-4 py-2.5 rounded-xl text-xs font-bold transition-all sm:w-auto"
          >
            Leave Room
          </button>
        </div>

        {isAdmin && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-t border-slate-850/50 pt-4 mt-4">
            <div className="text-xs max-w-md">
              <p className="font-bold text-slate-200">Delete Room Ledger</p>
              <p className="text-slate-500 mt-0.5">Wipes this room completely including all member mappings, bills, receipt images, and payments. Irreversible!</p>
            </div>
            <button
              onClick={handleDeleteRoom}
              disabled={loading}
              className="bg-rose-950/20 border border-rose-800/30 text-rose-400 hover:text-white hover:bg-rose-600 hover:border-rose-600 px-4 py-2.5 rounded-xl text-xs font-bold transition-all sm:w-auto flex items-center justify-center space-x-1.5"
            >
              <Trash2 className="h-4 w-4" />
              <span>Delete Room</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;
