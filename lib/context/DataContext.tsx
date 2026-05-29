'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Card, Transaction, Loan, EMI, FinancialData } from '@/lib/types';
import { v4 as uuidv4 } from 'crypto';

interface DataContextType {
  data: FinancialData;
  addCard: (card: Omit<Card, 'id' | 'createdAt'>) => void;
  updateCard: (id: string, card: Omit<Card, 'id' | 'createdAt'>) => void;
  deleteCard: (id: string) => void;
  addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  updateTransaction: (id: string, transaction: Omit<Transaction, 'id'>) => void;
  deleteTransaction: (id: string) => void;
  addLoan: (loan: Omit<Loan, 'id' | 'createdAt'>) => void;
  updateLoan: (id: string, loan: Omit<Loan, 'id' | 'createdAt'>) => void;
  deleteLoan: (id: string) => void;
  addEMI: (emi: Omit<EMI, 'id' | 'createdAt'>) => void;
  updateEMI: (id: string, emi: Omit<EMI, 'id' | 'createdAt'>) => void;
  deleteEMI: (id: string) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const STORAGE_KEY = 'financial_data';

const generateId = () => {
  return Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
};

const defaultData: FinancialData = {
  cards: [],
  transactions: [],
  loans: [],
  emis: [],
};

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const [data, setData] = useState<FinancialData>(defaultData);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setData(parsed);
      }
    } catch (error) {
      console.error('Error loading data from localStorage:', error);
    }
    setIsLoaded(true);
  }, []);

  // Save to localStorage whenever data changes
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } catch (error) {
        console.error('Error saving data to localStorage:', error);
      }
    }
  }, [data, isLoaded]);

  const addCard = (card: Omit<Card, 'id' | 'createdAt'>) => {
    const newCard: Card = {
      ...card,
      id: generateId(),
      createdAt: Date.now(),
    };
    setData(prev => ({
      ...prev,
      cards: [...prev.cards, newCard],
    }));
  };

  const updateCard = (id: string, card: Omit<Card, 'id' | 'createdAt'>) => {
    setData(prev => ({
      ...prev,
      cards: prev.cards.map(c => c.id === id ? { ...card, id, createdAt: c.createdAt } : c),
    }));
  };

  const deleteCard = (id: string) => {
    setData(prev => ({
      ...prev,
      cards: prev.cards.filter(c => c.id !== id),
      transactions: prev.transactions.filter(t => t.cardId !== id),
    }));
  };

  const addTransaction = (transaction: Omit<Transaction, 'id'>) => {
    const newTransaction: Transaction = {
      ...transaction,
      id: generateId(),
    };
    setData(prev => ({
      ...prev,
      transactions: [...prev.transactions, newTransaction],
    }));
  };

  const updateTransaction = (id: string, transaction: Omit<Transaction, 'id'>) => {
    setData(prev => ({
      ...prev,
      transactions: prev.transactions.map(t => t.id === id ? { ...transaction, id } : t),
    }));
  };

  const deleteTransaction = (id: string) => {
    setData(prev => ({
      ...prev,
      transactions: prev.transactions.filter(t => t.id !== id),
    }));
  };

  const addLoan = (loan: Omit<Loan, 'id' | 'createdAt'>) => {
    const newLoan: Loan = {
      ...loan,
      id: generateId(),
      createdAt: Date.now(),
    };
    setData(prev => ({
      ...prev,
      loans: [...prev.loans, newLoan],
    }));
  };

  const updateLoan = (id: string, loan: Omit<Loan, 'id' | 'createdAt'>) => {
    setData(prev => ({
      ...prev,
      loans: prev.loans.map(l => l.id === id ? { ...loan, id, createdAt: l.createdAt } : l),
    }));
  };

  const deleteLoan = (id: string) => {
    setData(prev => ({
      ...prev,
      loans: prev.loans.filter(l => l.id !== id),
      emis: prev.emis.filter(e => e.loanId !== id),
    }));
  };

  const addEMI = (emi: Omit<EMI, 'id' | 'createdAt'>) => {
    const newEMI: EMI = {
      ...emi,
      id: generateId(),
      createdAt: Date.now(),
    };
    setData(prev => ({
      ...prev,
      emis: [...prev.emis, newEMI],
    }));
  };

  const updateEMI = (id: string, emi: Omit<EMI, 'id' | 'createdAt'>) => {
    setData(prev => ({
      ...prev,
      emis: prev.emis.map(e => e.id === id ? { ...emi, id, createdAt: e.createdAt } : e),
    }));
  };

  const deleteEMI = (id: string) => {
    setData(prev => ({
      ...prev,
      emis: prev.emis.filter(e => e.id !== id),
    }));
  };

  if (!isLoaded) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <DataContext.Provider value={{
      data,
      addCard,
      updateCard,
      deleteCard,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      addLoan,
      updateLoan,
      deleteLoan,
      addEMI,
      updateEMI,
      deleteEMI,
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
