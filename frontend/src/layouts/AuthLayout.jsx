import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';

const AuthLayout = () => {
  const { token, user } = useAppStore();

  // If already authenticated, redirect to app
  if (token && user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative gradients */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="flex items-center justify-center space-x-2">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-brand-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-brand-500/20">
            <span className="text-white font-extrabold text-xl">₹</span>
          </div>
          <h2 className="text-center text-3xl font-extrabold text-white tracking-tight">
            Roomies <span className="bg-gradient-to-r from-brand-400 to-indigo-400 bg-clip-text text-transparent">Khata</span>
          </h2>
        </div>
        <p className="mt-2 text-center text-sm text-slate-400">
          Track. Split. Settle.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10 px-4">
        <div className="glass-panel py-8 px-6 sm:px-10 rounded-2xl shadow-xl">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
