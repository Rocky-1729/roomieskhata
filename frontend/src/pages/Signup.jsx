import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import { useAppStore } from '../store/useAppStore';
import api from '../utils/api';
import { User, Mail, Lock, UserPlus, AlertCircle, Chrome } from 'lucide-react';

const Signup = () => {
  const navigate = useNavigate();
  const { setAuth } = useAppStore();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) {
      return setError('Please fill in all fields');
    }

    if (password.length < 6) {
      return setError('Password must be at least 6 characters long');
    }

    setError('');
    setLoading(true);

    try {
      const res = await api.post('/auth/signup', { name, email, password });
      setAuth(res.data, res.data.token);
      navigate('/join-room');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Registration failed. Try a different email.');
    } finally {
      setLoading(false);
    }
  };

  const hasGoogleConfig = import.meta.env.VITE_GOOGLE_CLIENT_ID && import.meta.env.VITE_GOOGLE_CLIENT_ID !== 'placeholder_google_client_id';

  const handleRealGoogleLogin = async (accessToken) => {
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/google', { idToken: accessToken });
      setAuth(res.data, res.data.token);
      navigate('/join-room');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Google signup failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleMockGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/google', { idToken: 'google_mock_user_999888' });
      setAuth(res.data, res.data.token);
      navigate('/join-room');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Google signup failed.');
    } finally {
      setLoading(false);
    }
  };

  const triggerGoogleLogin = useGoogleLogin({
    onSuccess: (tokenResponse) => handleRealGoogleLogin(tokenResponse.access_token),
    onError: (err) => {
      console.error('Google OAuth failed:', err);
      setError('Google Sign-in failed.');
    }
  });

  const handleGoogleClick = () => {
    if (hasGoogleConfig) {
      triggerGoogleLogin();
    } else {
      handleMockGoogleLogin();
    }
  };

  return (
    <div>
      <h3 className="text-xl font-bold text-white text-center">Get Started</h3>
      <p className="text-xs text-slate-400 text-center mt-1">Create an account to track shared rooms expenses</p>

      {error && (
        <div className="mt-4 bg-danger-500/10 border border-danger-500/20 text-danger-500 px-4 py-2.5 rounded-xl text-xs flex items-center space-x-2 animate-pulse">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSignup} className="mt-6 space-y-4">
        {/* Name */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Your Name</label>
          <div className="mt-1 relative rounded-xl shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <User className="h-4 w-4 text-slate-500" />
            </div>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-slate-900 border border-slate-800 focus:border-brand-500 block w-full pl-10 pr-3 py-2.5 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              placeholder="e.g. Hari Kumar"
            />
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Email Address</label>
          <div className="mt-1 relative rounded-xl shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className="h-4 w-4 text-slate-500" />
            </div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-slate-900 border border-slate-800 focus:border-brand-500 block w-full pl-10 pr-3 py-2.5 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              placeholder="e.g. hari@gmail.com"
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Password</label>
          <div className="mt-1 relative rounded-xl shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-4 w-4 text-slate-500" />
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-slate-900 border border-slate-800 focus:border-brand-500 block w-full pl-10 pr-3 py-2.5 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              placeholder="Min. 6 characters"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full glow-btn bg-brand-600 hover:bg-brand-500 text-white py-2.5 rounded-xl font-bold flex items-center justify-center space-x-2 text-sm transition-colors mt-6"
        >
          {loading ? (
            <span>Creating Account...</span>
          ) : (
            <>
              <UserPlus className="h-4 w-4" />
              <span>Create Account</span>
            </>
          )}
        </button>
      </form>

      {/* Divider */}
      <div className="mt-6 flex items-center justify-between">
        <span className="w-1/5 border-b border-slate-800"></span>
        <span className="text-xs text-slate-500 uppercase font-semibold">Or continue with</span>
        <span className="w-1/5 border-b border-slate-800"></span>
      </div>

      {/* Google Login Trigger */}
      <button
        onClick={handleGoogleClick}
        disabled={loading}
        className="w-full mt-4 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-200 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center space-x-2 hover:border-slate-700 transition-all"
      >
        <Chrome className="h-4 w-4 text-brand-400" />
        <span>Sign up with Google</span>
      </button>

      <p className="mt-8 text-center text-xs text-slate-400">
        Already have a ledger account?{' '}
        <Link to="/login" className="text-brand-400 hover:text-brand-300 font-bold">
          Log In
        </Link>
      </p>
    </div>
  );
};

export default Signup;
