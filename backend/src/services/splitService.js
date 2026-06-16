const RoomMember = require('../models/RoomMember');
const Expense = require('../models/Expense');
const User = require('../models/User');

/**
 * Calculates net balances and generates optimized settlement recommendations
 * @param {string} roomId 
 * @returns {Promise<{balances: Array, settlements: Array}>}
 */
const calculateBalances = async (roomId) => {
  // Get all room members
  const members = await RoomMember.find({ roomId }).populate('userId', 'name email avatarUrl');
  
  // Initialize balances map
  const balances = {};
  const memberDetails = {};
  const totalPaid = {}; // Keep track of absolute amount paid by each user
  
  members.forEach(member => {
    if (member.userId) {
      const uId = member.userId._id.toString();
      balances[uId] = 0;
      totalPaid[uId] = 0;
      memberDetails[uId] = {
        _id: member.userId._id,
        name: member.userId.name,
        email: member.userId.email,
        avatarUrl: member.userId.avatarUrl,
        role: member.role
      };
    }
  });

  // Fetch all expenses in the room
  const expenses = await Expense.find({ roomId });

  // Compute net balances and total paid
  expenses.forEach(expense => {
    const payerId = expense.paidBy.toString();
    const amount = expense.amount;
    const splitCount = expense.splitAmong.length;

    if (splitCount === 0) return;

    const share = amount / splitCount;

    // Track absolute paid amount
    if (totalPaid[payerId] !== undefined) {
      totalPaid[payerId] += amount;
    }

    // Add to payer's net balance
    if (balances[payerId] !== undefined) {
      balances[payerId] += amount;
    }

    // Deduct share from everyone in the split
    expense.splitAmong.forEach(userId => {
      const uId = userId.toString();
      if (balances[uId] !== undefined) {
        balances[uId] -= share;
      }
    });
  });

  // Format balances array
  const balanceArray = Object.keys(balances).map(userId => {
    return {
      user: memberDetails[userId],
      netBalance: Math.round(balances[userId] * 100) / 100,
      totalPaid: Math.round(totalPaid[userId] * 100) / 100
    };
  });

  // Prepare groups for simplified debt settlement algorithm
  const creditors = [];
  const debtors = [];

  balanceArray.forEach(item => {
    if (item.netBalance > 0.01) {
      creditors.push({ userId: item.user._id.toString(), name: item.user.name, balance: item.netBalance });
    } else if (item.netBalance < -0.01) {
      debtors.push({ userId: item.user._id.toString(), name: item.user.name, balance: item.netBalance });
    }
  });

  // Sort creditors descending, debtors ascending (most negative first)
  creditors.sort((a, b) => b.balance - a.balance);
  debtors.sort((a, b) => a.balance - b.balance);

  const settlements = [];
  let i = 0; // debtor index
  let j = 0; // creditor index

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];

    const oweAmount = -debtor.balance;
    const creditAmount = creditor.balance;

    const settledAmount = Math.min(oweAmount, creditAmount);

    settlements.push({
      from: debtor.userId,
      fromName: debtor.name,
      to: creditor.userId,
      toName: creditor.name,
      amount: Math.round(settledAmount * 100) / 100
    });

    debtor.balance += settledAmount;
    creditor.balance -= settledAmount;

    // Move to next debtor/creditor if their balance is fully settled
    if (Math.abs(debtor.balance) < 0.01) {
      i++;
    }
    if (Math.abs(creditor.balance) < 0.01) {
      j++;
    }
  }

  return {
    balances: balanceArray,
    settlements
  };
};

module.exports = {
  calculateBalances
};
