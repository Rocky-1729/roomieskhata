import React, { useState, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import api from '../utils/api';
import { Activity, Clock, ChevronLeft, ChevronRight, MessageSquareCode } from 'lucide-react';

const Timeline = () => {
  const { user, activities, setActivities } = useAppStore();
  
  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalActivities, setTotalActivities] = useState(0);

  const fetchActivities = async () => {
    try {
      const res = await api.get(`/activity?page=${currentPage}&limit=25`);
      setActivities(res.data.activities);
      setTotalPages(res.data.pagination.pages);
      setTotalActivities(res.data.pagination.total);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (user?.activeRoomId) {
      fetchActivities();
    }
  }, [user?.activeRoomId, currentPage]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Timeline</h1>
        <p className="text-xs text-slate-400 mt-0.5">Chronological history of room actions ({totalActivities} activities)</p>
      </div>

      {/* Timeline List */}
      <div className="glass-panel p-6 rounded-2xl relative">
        {activities.length === 0 ? (
          <div className="text-center py-12">
            <Activity className="h-12 w-12 text-slate-650 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-400">No activity logged yet</p>
          </div>
        ) : (
          <div className="relative border-l-2 border-slate-800 ml-4 py-2 space-y-8">
            {activities.map((act) => (
              <div key={act._id} className="relative pl-7 group">
                {/* Timeline node dot */}
                <div className="absolute -left-[9px] top-1.5 bg-slate-900 border-2 border-slate-700 h-4.5 w-4.5 rounded-full group-hover:border-brand-500 transition-colors flex items-center justify-center">
                  <div className="h-1.5 w-1.5 bg-slate-450 rounded-full group-hover:bg-brand-400 transition-colors"></div>
                </div>

                {/* Timeline content */}
                <div className="flex items-start space-x-3 text-sm">
                  <img
                    src={act.userId?.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${act.userId?.name}`}
                    alt="avatar"
                    className="h-8 w-8 rounded-full bg-slate-800 border border-slate-700"
                  />
                  <div>
                    <p className="text-slate-200 font-medium leading-relaxed">{act.details}</p>
                    <div className="flex items-center space-x-1.5 text-slate-500 text-[10px] mt-1">
                      <Clock className="h-3 w-3" />
                      <span>
                        {new Date(act.createdAt).toLocaleDateString()} at{' '}
                        {new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
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
    </div>
  );
};

export default Timeline;
