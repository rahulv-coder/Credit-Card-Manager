import { Card, Transaction, EMI, Loan } from '@/lib/types';

export const calculateCardBalance = (cardId: string, transactions: Transaction[]) => {
  return transactions
    .filter(t => t.cardId === cardId && t.type === 'debit')
    .reduce((sum, t) => sum + t.amount, 0);
};

export const calculateTotalBalance = (cards: Card[], transactions: Transaction[]) => {
  return cards.reduce((sum, card) => {
    const balance = calculateCardBalance(card.id, transactions);
    return sum + balance;
  }, 0);
};

export const calculateTotalCreditLimit = (cards: Card[]) => {
  return cards.reduce((sum, card) => sum + card.creditLimit, 0);
};

export const calculateAvailableCredit = (cards: Card[], transactions: Transaction[]) => {
  const totalLimit = calculateTotalCreditLimit(cards);
  const totalSpent = calculateTotalBalance(cards, transactions);
  return Math.max(0, totalLimit - totalSpent);
};

export const calculateTotalEMIDue = (emis: EMI[]) => {
  const now = new Date();
  const currentMonth = now.getFullYear() * 12 + now.getMonth();
  
  return emis
    .filter(emi => {
      const emiDate = new Date(emi.dueDate);
      const emiMonth = emiDate.getFullYear() * 12 + emiDate.getMonth();
      return emiMonth === currentMonth && !emi.isPaid;
    })
    .reduce((sum, emi) => sum + emi.emiAmount, 0);
};

export const calculateTotalLoanOutstanding = (loans: Loan[]) => {
  return loans.reduce((sum, loan) => sum + loan.currentAmount, 0);
};

export const getSpendingByCategory = (transactions: Transaction[]) => {
  const spending: { [key: string]: number } = {};
  
  transactions
    .filter(t => t.type === 'debit')
    .forEach(t => {
      if (!spending[t.category]) {
        spending[t.category] = 0;
      }
      spending[t.category] += t.amount;
    });
  
  return Object.entries(spending).map(([category, amount]) => ({
    category,
    amount,
  }));
};

export const getMonthlySummary = (transactions: Transaction[]) => {
  const monthlyData: { [key: string]: number } = {};
  
  transactions
    .filter(t => t.type === 'debit')
    .forEach(t => {
      const date = new Date(t.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = 0;
      }
      monthlyData[monthKey] += t.amount;
    });
  
  return Object.entries(monthlyData)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([month, amount]) => ({
      month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
      amount,
    }));
};

export const getUpcomingEMIs = (emis: EMI[], limit = 5) => {
  const now = Date.now();
  return emis
    .filter(emi => emi.dueDate >= now && !emi.isPaid)
    .sort((a, b) => a.dueDate - b.dueDate)
    .slice(0, limit);
};

export const getRecentTransactions = (transactions: Transaction[], limit = 5) => {
  return transactions
    .sort((a, b) => b.date - a.date)
    .slice(0, limit);
};

export const calculateEMI = (principal: number, annualRate: number, monthsDuration: number) => {
  const monthlyRate = annualRate / 12 / 100;
  if (monthlyRate === 0) {
    return principal / monthsDuration;
  }
  const emi = (principal * monthlyRate * Math.pow(1 + monthlyRate, monthsDuration)) / 
              (Math.pow(1 + monthlyRate, monthsDuration) - 1);
  return Math.round(emi * 100) / 100;
};
