export interface Card {
  id: string;
  name: string;
  cardNumber: string;
  cardHolder: string;
  expiryDate: string;
  issuer: string;
  customBankName?: string;
  creditLimit: number;
  currentBalance: number;
  color: string;
  billingCycleDay: number;
  paymentDueDays: number;
  createdAt: number;
}

export interface Transaction {
  id: string;
  cardId: string;
  amount: number;
  description: string;
  category: string;
  date: number;
  type: 'debit' | 'credit';
}

export interface Loan {
  id: string;
  name: string;
  principal: number;
  currentAmount: number;
  interestRate: number;
  tenureMonths: number;
  startDate: number;
  endDate: number;
  createdAt: number;
}

export interface EMI {
  id: string;
  loanId: string;
  emiAmount: number;
  dueDate: number;
  isPaid: boolean;
  paidDate: number | null;
  createdAt: number;
}

export interface FinancialData {
  cards: Card[];
  transactions: Transaction[];
  loans: Loan[];
  emis: EMI[];
}

export interface UserProfile {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  gender: 'male' | 'female';
  mobile: string;
  createdAt: number;
  updatedAt: number;
}
