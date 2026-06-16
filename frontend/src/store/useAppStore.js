import { create } from 'zustand';

const getInitialUser = () => {
  try {
    const user = localStorage.getItem('roomies_user');
    return user ? JSON.parse(user) : null;
  } catch (error) {
    return null;
  }
};

const getInitialToken = () => {
  return localStorage.getItem('roomies_token') || null;
};

export const useAppStore = create((set, get) => ({
  user: getInitialUser(),
  token: getInitialToken(),
  room: null,
  members: [],
  balances: [],
  settlements: [],
  expenses: [],
  activities: [],
  notifications: [],
  loading: false,

  setLoading: (loading) => set({ loading }),
  
  setAuth: (user, token) => {
    localStorage.setItem('roomies_token', token);
    localStorage.setItem('roomies_user', JSON.stringify(user));
    set({ user, token });
  },

  updateUserRoom: (roomId) => {
    const currentUser = get().user;
    if (currentUser) {
      const updated = { ...currentUser, activeRoomId: roomId };
      localStorage.setItem('roomies_user', JSON.stringify(updated));
      set({ user: updated });
    }
  },

  logout: () => {
    localStorage.removeItem('roomies_token');
    localStorage.removeItem('roomies_user');
    set({
      user: null,
      token: null,
      room: null,
      members: [],
      balances: [],
      expenses: [],
      activities: [],
      notifications: [],
    });
  },

  setRoomData: (room, members) => set({ room, members }),
  setBalancesAndSettlements: (balances, settlements) => set({ balances, settlements }),
  setExpenses: (expenses) => set({ expenses }),
  setActivities: (activities) => set({ activities }),
  setNotifications: (notifications) => set({ notifications }),
  
  addExpense: (expense) => set((state) => ({ 
    expenses: [expense, ...state.expenses] 
  })),
  
  addActivity: (activity) => set((state) => ({ 
    activities: [activity, ...state.activities] 
  })),
  
  addNotification: (notification) => set((state) => ({ 
    notifications: [notification, ...state.notifications] 
  })),
}));
