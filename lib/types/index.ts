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

export type LendingRepaymentType = 'full' | 'installment';

export interface Lending {
  id: string;
  personName: string;
  phone: string;
  originalAmount: number;
  remainingAmount: number;
  purpose: string;
  lentDate: number;
  dueDate?: number;
  repaymentType: LendingRepaymentType;
  /** Expected monthly instalment amount (only for installment type) */
  monthlyAmount?: number;
  /** Day of month (1-28) monthly payment is due */
  monthlyDueDay?: number;
  notes: string;
  createdAt: number;
}

export interface LendingPayment {
  id: string;
  lendingId: string;
  amount: number;
  date: number;
  notes: string;
  createdAt: number;
}

// ── Split Groups ──────────────────────────────────────────────────────────────

export interface SplitGroup {
  id: string;
  name: string;
  description: string;
  inviteCode: string;
  createdBy: string;
  createdAt: number;
  isArchived: boolean;
}

export interface SplitGroupMember {
  id: string;
  groupId: string;
  userId: string;
  displayName: string;
  role: 'admin' | 'member';
  joinedAt: number;
}

export interface SplitExpense {
  id: string;
  groupId: string;
  paidByMemberId: string;
  paidByName: string;
  description: string;
  amount: number;
  category: string;
  date: number;
  splitType: 'equal' | 'custom';
  createdAt: number;
}

export interface SplitExpenseSplit {
  id: string;
  expenseId: string;
  groupId: string;
  memberId: string;
  memberName: string;
  amount: number;
  isSettled: boolean;
}

export interface SplitSettlement {
  id: string;
  groupId: string;
  fromMemberId: string;
  fromName: string;
  toMemberId: string;
  toName: string;
  amount: number;
  date: number;
  notes: string;
  createdAt: number;
}

/** Net balance per member: positive = owed money, negative = owes money */
export interface MemberBalance {
  memberId: string;
  memberName: string;
  userId: string;
  netBalance: number;
}
