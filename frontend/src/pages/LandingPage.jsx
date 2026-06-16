import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { 
  ArrowRight, 
  Receipt, 
  ArrowLeftRight, 
  TrendingUp, 
  Zap, 
  Lock, 
  FileText,
  Smartphone
} from 'lucide-react';

const LandingPage = () => {
  const { token, user } = useAppStore();

  // Redirect to dashboard if logged in
  if (token && user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 overflow-hidden relative selection:bg-brand-500 selection:text-white">
      {/* Background radial glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-b from-brand-600/10 via-brand-700/5 to-transparent rounded-full blur-3xl -z-10"></div>
      
      {/* Navigation Header */}
      <header className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between z-10 relative">
        <div className="flex items-center space-x-2">
          <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-brand-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-brand-500/20">
            <span className="text-white font-extrabold text-sm">₹</span>
          </div>
          <span className="font-black text-xl tracking-tight text-white">
            Roomies <span className="bg-gradient-to-r from-brand-400 to-indigo-400 bg-clip-text text-transparent">Khata</span>
          </span>
        </div>
        <div className="flex items-center space-x-4">
          <Link to="/login" className="text-sm font-semibold text-slate-300 hover:text-white transition-colors">
            Log In
          </Link>
          <Link 
            to="/signup" 
            className="glow-btn bg-brand-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-brand-500/20 hover:bg-brand-500 transition-colors"
          >
            Get Started
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-24 text-center z-10 relative">
        <div className="max-w-3xl mx-auto">
          <div className="inline-flex items-center space-x-2 bg-slate-900 border border-slate-800 rounded-full px-3 py-1 text-xs text-brand-400 font-medium mb-6">
            <Zap className="h-3.5 w-3.5" />
            <span>Simplify Roommate Expense Management</span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-tight">
            Track. Split. Settle.<br />
            <span className="bg-gradient-to-r from-brand-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
              No Roommate Drama.
            </span>
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Roomies Khata makes sharing rent, wifi, electricity, and groceries effortless. Split bills in real-time, compute optimal settlements, and attach receipt images automatically.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              to="/signup" 
              className="glow-btn w-full sm:w-auto bg-gradient-to-r from-brand-500 to-indigo-600 text-white px-8 py-4 rounded-xl text-base font-bold shadow-lg shadow-brand-500/25 flex items-center justify-center space-x-2"
            >
              <span>Create Free Account</span>
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link 
              to="/login" 
              className="w-full sm:w-auto bg-slate-900 hover:bg-slate-850 text-slate-200 border border-slate-800 hover:border-slate-700 px-8 py-4 rounded-xl text-base font-bold transition-all flex items-center justify-center"
            >
              Log In Instead
            </Link>
          </div>
        </div>

        {/* Feature Grid */}
        <section className="mt-28">
          <h2 className="text-3xl font-extrabold text-white">Designed for Shared Living</h2>
          <p className="text-slate-400 mt-2">Everything you need to handle roommate expenses transparently.</p>
          
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
            {/* Feat 1 */}
            <div className="glass-card p-6 rounded-2xl">
              <div className="h-10 w-10 bg-brand-500/10 rounded-xl flex items-center justify-center mb-4 text-brand-400">
                <Receipt className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-200">Rent & Utility Splitting</h3>
              <p className="text-sm text-slate-400 mt-2">
                Easily split electricity bills, internet subscriptions, LPG gas cylinders, and rent with customizable shares.
              </p>
            </div>
            
            {/* Feat 2 */}
            <div className="glass-card p-6 rounded-2xl">
              <div className="h-10 w-10 bg-emerald-500/10 rounded-xl flex items-center justify-center mb-4 text-emerald-400">
                <ArrowLeftRight className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-200">Auto Split Engine</h3>
              <p className="text-sm text-slate-400 mt-2">
                Our greedy cash-flow simplification engine computes exactly who owes whom, cutting down transactions to a minimum.
              </p>
            </div>

            {/* Feat 3 */}
            <div className="glass-card p-6 rounded-2xl">
              <div className="h-10 w-10 bg-indigo-500/10 rounded-xl flex items-center justify-center mb-4 text-indigo-400">
                <Zap className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-200">Real-Time WebSocket Sync</h3>
              <p className="text-sm text-slate-400 mt-2">
                Adding an expense updates the whole room instantly. Activity logs appear in real-time on all screens via Socket.io.
              </p>
            </div>

            {/* Feat 4 */}
            <div className="glass-card p-6 rounded-2xl">
              <div className="h-10 w-10 bg-purple-500/10 rounded-xl flex items-center justify-center mb-4 text-purple-400">
                <FileText className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-200">Receipt Management</h3>
              <p className="text-sm text-slate-400 mt-2">
                Upload images of grocery bills, gas invoices, and WiFi screenshots to back up room purchases.
              </p>
            </div>
          </div>
        </section>

        {/* Categories Section */}
        <section className="mt-24 bg-slate-900/40 border border-slate-800/60 p-8 sm:p-12 rounded-3xl max-w-5xl mx-auto text-left relative overflow-hidden">
          <div className="absolute top-0 right-0 w-72 h-72 bg-indigo-600/5 rounded-full blur-3xl -z-10"></div>
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="max-w-md">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-100 leading-tight">
                Tracks Specific Grocery Items
              </h2>
              <p className="text-slate-400 mt-3 text-sm sm:text-base leading-relaxed">
                Vegetables, eggs, chicken, milk, and petroleum items have dedicated categories. Get deep analytical trends on what consumes your budget most.
              </p>
            </div>
            <div className="flex flex-wrap gap-2.5 max-w-md">
              {['Rent', 'Electricity', 'WiFi', 'Vegetables', 'Eggs', 'Chicken', 'Milk', 'Petrol', 'Water', 'Gas', 'Other'].map((cat) => (
                <span 
                  key={cat} 
                  className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700/50 hover:bg-slate-750 transition-colors cursor-default"
                >
                  {cat}
                </span>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-8 text-center text-xs text-slate-500">
        <p>© 2026 Roomies Khata. Built with Vite, Tailwind CSS, Express, and MongoDB.</p>
      </footer>
    </div>
  );
};

export default LandingPage;
