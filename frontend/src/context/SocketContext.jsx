import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { useAppStore } from '../store/useAppStore';

const SocketContext = createContext(null);

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const { 
    user, 
    token, 
    addExpense, 
    setBalancesAndSettlements, 
    addActivity, 
    addNotification,
    expenses,
    setExpenses
  } = useAppStore();

  useEffect(() => {
    // If not authenticated, disconnect if exists
    if (!token || !user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    const SOCKET_SERVER_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
    
    // Connect to websocket server
    const newSocket = io(SOCKET_SERVER_URL, {
      auth: { token },
      transports: ['websocket'],
    });

    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Socket client connected successfully');
      if (user.activeRoomId) {
        newSocket.emit('join_room', { roomId: user.activeRoomId });
      }
    });

    // Real-time listener: Expense Created
    newSocket.on('expense_created', (data) => {
      console.log('Socket event received: expense_created', data);
      addExpense(data.expense);
      setBalancesAndSettlements(data.balances, data.settlements);
      if (data.activityLog) addActivity(data.activityLog);
      
      addNotification({
        _id: `socket-notif-${Date.now()}`,
        title: 'Expense Added',
        message: data.activityLog ? data.activityLog.details : 'A new expense was added.',
        type: 'expense_added',
        isRead: false,
        createdAt: new Date(),
      });
    });

    // Real-time listener: Expense Updated
    newSocket.on('expense_updated', (data) => {
      console.log('Socket event received: expense_updated', data);
      setBalancesAndSettlements(data.balances, data.settlements);
      if (data.activityLog) addActivity(data.activityLog);
      
      // Update in local array
      const currentExpenses = useAppStore.getState().expenses;
      const updated = currentExpenses.map(e => e._id === data.expense._id ? data.expense : e);
      setExpenses(updated);

      addNotification({
        _id: `socket-notif-${Date.now()}`,
        title: 'Expense Updated',
        message: data.activityLog ? data.activityLog.details : 'An expense was modified.',
        type: 'expense_updated',
        isRead: false,
        createdAt: new Date(),
      });
    });

    // Real-time listener: Expense Deleted
    newSocket.on('expense_deleted', (data) => {
      console.log('Socket event received: expense_deleted', data);
      setBalancesAndSettlements(data.balances, data.settlements);
      if (data.activityLog) addActivity(data.activityLog);
      
      // Filter out deleted
      const currentExpenses = useAppStore.getState().expenses;
      const filtered = currentExpenses.filter(e => e._id !== data.expenseId);
      setExpenses(filtered);

      addNotification({
        _id: `socket-notif-${Date.now()}`,
        title: 'Expense Deleted',
        message: data.activityLog ? data.activityLog.details : 'An expense was deleted.',
        type: 'expense_deleted',
        isRead: false,
        createdAt: new Date(),
      });
    });

    // Real-time listener: Member Joined
    newSocket.on('member_joined', (data) => {
      console.log('Socket event received: member_joined', data);
      if (data.activityLog) addActivity(data.activityLog);
      
      addNotification({
        _id: `socket-notif-${Date.now()}`,
        title: 'New Member Joined',
        message: `${data.user.name} has joined the room.`,
        type: 'member_joined',
        isRead: false,
        createdAt: new Date(),
      });
    });

    // Real-time listener: Settlement Logged
    newSocket.on('settlement_logged', (data) => {
      console.log('Socket event received: settlement_logged', data);
      setBalancesAndSettlements(data.balances, data.settlements);
      if (data.activityLog) addActivity(data.activityLog);

      addNotification({
        _id: `socket-notif-${Date.now()}`,
        title: 'Payment Logged',
        message: data.activityLog ? data.activityLog.details : 'A payment was recorded.',
        type: 'settlement_completed',
        isRead: false,
        createdAt: new Date(),
      });
    });

    return () => {
      newSocket.disconnect();
    };
  }, [token, user?.activeRoomId]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};
