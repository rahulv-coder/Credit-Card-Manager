'use client'

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import type { AuthChangeEvent, AuthError, Session, User } from '@supabase/supabase-js'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { Card, Transaction, Loan, EMI, FinancialData, UserProfile } from '@/lib/types'

interface SignUpProfileInput {
  firstName: string
  lastName: string
  gender: 'male' | 'female'
  mobile: string
}

interface DataContextType {
  data: FinancialData
  cards: Card[]
  user: User | null
  profile: UserProfile | null
  authLoading: boolean
  dataLoading: boolean
  authError: string | null
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signUp: (email: string, password: string, profile: SignUpProfileInput) => Promise<{ error: AuthError | null }>
  signOut: () => Promise<{ error: AuthError | null }>
  importData: (imported: FinancialData) => Promise<boolean>
  clearAllData: () => Promise<boolean>
  addCard: (card: Omit<Card, 'id' | 'createdAt'>) => Promise<void>
  updateCard: (id: string, card: Omit<Card, 'id' | 'createdAt'>) => Promise<void>
  deleteCard: (id: string) => Promise<void>
  addTransaction: (transaction: Omit<Transaction, 'id'>) => Promise<void>
  updateTransaction: (id: string, transaction: Omit<Transaction, 'id'>) => Promise<void>
  deleteTransaction: (id: string) => Promise<void>
  addLoan: (loan: Omit<Loan, 'id' | 'createdAt'>) => Promise<string | null>
  updateLoan: (id: string, loan: Omit<Loan, 'id' | 'createdAt'>) => Promise<void>
  deleteLoan: (id: string) => Promise<void>
  addEMI: (emi: Omit<EMI, 'id' | 'createdAt'>) => Promise<void>
  updateEMI: (id: string, emi: Omit<EMI, 'id' | 'createdAt'>) => Promise<void>
  deleteEMI: (id: string) => Promise<void>
}

type CardRow = {
  id: string
  user_id: string
  name: string
  card_number: string
  card_holder: string
  expiry_date: string
  issuer: string
  custom_bank_name: string | null
  credit_limit: number
  current_balance: number
  color: string
  created_at: number
}

type TransactionRow = {
  id: string
  user_id: string
  card_id: string
  amount: number
  description: string
  category: string
  date: number
  type: 'debit' | 'credit'
}

type LoanRow = {
  id: string
  user_id: string
  name: string
  principal: number
  current_amount: number
  interest_rate: number
  tenure_months: number
  start_date: number
  end_date: number
  created_at: number
}

type EmiRow = {
  id: string
  user_id: string
  loan_id: string
  emi_amount: number
  due_date: number
  is_paid: boolean
  paid_date: number | null
  created_at: number
}

type UserProfileRow = {
  user_id: string
  first_name: string
  last_name: string
  email: string
  gender: 'male' | 'female'
  mobile: string
  created_at: number
  updated_at: number
}

const DataContext = createContext<DataContextType | undefined>(undefined)

const defaultData: FinancialData = {
  cards: [],
  transactions: [],
  loans: [],
  emis: [],
}

const mapCardRowToCard = (row: CardRow): Card => ({
  id: row.id,
  name: row.name,
  cardNumber: row.card_number,
  cardHolder: row.card_holder,
  expiryDate: row.expiry_date,
  issuer: row.issuer,
  customBankName: row.custom_bank_name ?? undefined,
  creditLimit: Number(row.credit_limit),
  currentBalance: Number(row.current_balance),
  color: row.color,
  createdAt: row.created_at,
})

const mapTransactionRowToTransaction = (row: TransactionRow): Transaction => ({
  id: row.id,
  cardId: row.card_id,
  amount: Number(row.amount),
  description: row.description,
  category: row.category,
  date: row.date,
  type: row.type,
})

const mapLoanRowToLoan = (row: LoanRow): Loan => ({
  id: row.id,
  name: row.name,
  principal: Number(row.principal),
  currentAmount: Number(row.current_amount),
  interestRate: Number(row.interest_rate),
  tenureMonths: row.tenure_months,
  startDate: row.start_date,
  endDate: row.end_date,
  createdAt: row.created_at,
})

const mapEmiRowToEmi = (row: EmiRow): EMI => ({
  id: row.id,
  loanId: row.loan_id,
  emiAmount: Number(row.emi_amount),
  dueDate: row.due_date,
  isPaid: row.is_paid,
  paidDate: row.paid_date,
  createdAt: row.created_at,
})

const createId = () => Math.random().toString(36).slice(2, 11) + Date.now().toString(36)

const mapProfileRowToProfile = (row: UserProfileRow): UserProfile => ({
  userId: row.user_id,
  firstName: row.first_name,
  lastName: row.last_name,
  email: row.email,
  gender: row.gender,
  mobile: row.mobile,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
})

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const supabase = getSupabaseBrowserClient()

  const [data, setData] = useState<FinancialData>(defaultData)
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [dataLoading, setDataLoading] = useState(true)
  const [authError, setAuthError] = useState<string | null>(null)

  useEffect(() => {
    if (!supabase) {
      setAuthError('Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.')
      setAuthLoading(false)
      setDataLoading(false)
      return
    }

    let isMounted = true

    const initializeAuth = async () => {
      const { data: authData, error } = await supabase.auth.getUser()
      if (!isMounted) {
        return
      }

      if (error) {
        setAuthError(error.message)
      } else {
        setAuthError(null)
      }

      setUser(authData.user ?? null)
      setAuthLoading(false)
    }

    initializeAuth()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
      setUser(session?.user ?? null)
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [supabase])

  useEffect(() => {
    if (!supabase) {
      setData(defaultData)
      setDataLoading(false)
      return
    }

    if (!user) {
      setData(defaultData)
      setProfile(null)
      setDataLoading(false)
      return
    }

    const loadData = async () => {
      setDataLoading(true)

      const [{ data: cardsData, error: cardsError }, { data: transactionsData, error: transactionsError }, { data: loansData, error: loansError }, { data: emisData, error: emisError }, { data: profileData, error: profileError }] = await Promise.all([
        supabase.from('cards').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('transactions').select('*').eq('user_id', user.id),
        supabase.from('loans').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('emis').select('*').eq('user_id', user.id),
        supabase.from('user_profiles').select('*').eq('user_id', user.id).maybeSingle(),
      ])

      if (cardsError || transactionsError || loansError || emisError || profileError) {
        setAuthError(cardsError?.message || transactionsError?.message || loansError?.message || emisError?.message || profileError?.message || 'Failed to load data')
        setData(defaultData)
        setProfile(null)
      } else {
        setAuthError(null)
        setData({
          cards: (cardsData as CardRow[] | null)?.map(mapCardRowToCard) ?? [],
          transactions: (transactionsData as TransactionRow[] | null)?.map(mapTransactionRowToTransaction) ?? [],
          loans: (loansData as LoanRow[] | null)?.map(mapLoanRowToLoan) ?? [],
          emis: (emisData as EmiRow[] | null)?.map(mapEmiRowToEmi) ?? [],
        })

        if (profileData) {
          setProfile(mapProfileRowToProfile(profileData as UserProfileRow))
        } else {
          const metadata = user.user_metadata ?? {}
          const firstName = typeof metadata.first_name === 'string' ? metadata.first_name : ''
          const lastName = typeof metadata.last_name === 'string' ? metadata.last_name : ''
          const gender = metadata.gender === 'female' ? 'female' : 'male'
          const mobile = typeof metadata.mobile === 'string' ? metadata.mobile : ''
          const now = Date.now()

          if (firstName && lastName && mobile) {
            const upsertResult = await supabase.from('user_profiles').upsert({
              user_id: user.id,
              first_name: firstName,
              last_name: lastName,
              email: user.email ?? '',
              gender,
              mobile,
              created_at: now,
              updated_at: now,
            }).select('*').single()

            if (!upsertResult.error && upsertResult.data) {
              setProfile(mapProfileRowToProfile(upsertResult.data as UserProfileRow))
            }
          }
        }
      }

      setDataLoading(false)
    }

    loadData()
  }, [supabase, user])

  const signIn = async (email: string, password: string) => {
    if (!supabase) {
      return { error: { message: 'Supabase is not configured' } as AuthError }
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error }
  }

  const signUp = async (email: string, password: string, signupProfile: SignUpProfileInput) => {
    if (!supabase) {
      return { error: { message: 'Supabase is not configured' } as AuthError }
    }

    const { data: signUpData, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: signupProfile.firstName,
          last_name: signupProfile.lastName,
          gender: signupProfile.gender,
          mobile: signupProfile.mobile,
        },
      },
    })

    if (!error && signUpData.user && signUpData.session) {
      const now = Date.now()
      const upsertResult = await supabase.from('user_profiles').upsert({
        user_id: signUpData.user.id,
        first_name: signupProfile.firstName,
        last_name: signupProfile.lastName,
        email,
        gender: signupProfile.gender,
        mobile: signupProfile.mobile,
        created_at: now,
        updated_at: now,
      }).select('*').single()

      if (!upsertResult.error && upsertResult.data) {
        setProfile(mapProfileRowToProfile(upsertResult.data as UserProfileRow))
      }
    }

    return { error }
  }

  const signOut = async () => {
    if (!supabase) {
      return { error: { message: 'Supabase is not configured' } as AuthError }
    }

    const { error } = await supabase.auth.signOut()
    if (!error) {
      setProfile(null)
      setData(defaultData)
    }
    return { error }
  }

  const importData = async (imported: FinancialData): Promise<boolean> => {
    if (!supabase || !user) return false

    const cardsPayload = imported.cards.map((card) => ({
      id: card.id,
      user_id: user.id,
      name: card.name,
      card_number: card.cardNumber,
      card_holder: card.cardHolder,
      expiry_date: card.expiryDate,
      issuer: card.issuer,
      custom_bank_name: card.customBankName ?? null,
      credit_limit: card.creditLimit,
      current_balance: card.currentBalance,
      color: card.color,
      created_at: card.createdAt,
    }))

    const transactionsPayload = imported.transactions.map((transaction) => ({
      id: transaction.id,
      user_id: user.id,
      card_id: transaction.cardId,
      amount: transaction.amount,
      description: transaction.description,
      category: transaction.category,
      date: transaction.date,
      type: transaction.type,
    }))

    const loansPayload = imported.loans.map((loan) => ({
      id: loan.id,
      user_id: user.id,
      name: loan.name,
      principal: loan.principal,
      current_amount: loan.currentAmount,
      interest_rate: loan.interestRate,
      tenure_months: loan.tenureMonths,
      start_date: loan.startDate,
      end_date: loan.endDate,
      created_at: loan.createdAt,
    }))

    const emisPayload = imported.emis.map((emi) => ({
      id: emi.id,
      user_id: user.id,
      loan_id: emi.loanId,
      emi_amount: emi.emiAmount,
      due_date: emi.dueDate,
      is_paid: emi.isPaid,
      paid_date: emi.paidDate,
      created_at: emi.createdAt,
    }))

    const deleteEmis = await supabase.from('emis').delete().eq('user_id', user.id)
    if (deleteEmis.error) return false

    const deleteTransactions = await supabase.from('transactions').delete().eq('user_id', user.id)
    if (deleteTransactions.error) return false

    const deleteLoans = await supabase.from('loans').delete().eq('user_id', user.id)
    if (deleteLoans.error) return false

    const deleteCards = await supabase.from('cards').delete().eq('user_id', user.id)
    if (deleteCards.error) return false

    if (cardsPayload.length > 0) {
      const insertCards = await supabase.from('cards').insert(cardsPayload)
      if (insertCards.error) return false
    }

    if (loansPayload.length > 0) {
      const insertLoans = await supabase.from('loans').insert(loansPayload)
      if (insertLoans.error) return false
    }

    if (transactionsPayload.length > 0) {
      const insertTransactions = await supabase.from('transactions').insert(transactionsPayload)
      if (insertTransactions.error) return false
    }

    if (emisPayload.length > 0) {
      const insertEmis = await supabase.from('emis').insert(emisPayload)
      if (insertEmis.error) return false
    }

    setData(imported)
    return true
  }

  const clearAllData = async (): Promise<boolean> => {
    if (!supabase || !user) return false

    const deleteEmis = await supabase.from('emis').delete().eq('user_id', user.id)
    if (deleteEmis.error) return false

    const deleteTransactions = await supabase.from('transactions').delete().eq('user_id', user.id)
    if (deleteTransactions.error) return false

    const deleteLoans = await supabase.from('loans').delete().eq('user_id', user.id)
    if (deleteLoans.error) return false

    const deleteCards = await supabase.from('cards').delete().eq('user_id', user.id)
    if (deleteCards.error) return false

    setData(defaultData)
    return true
  }

  const addCard = async (card: Omit<Card, 'id' | 'createdAt'>) => {
    if (!supabase || !user) return

    const newCard: Card = {
      ...card,
      id: createId(),
      createdAt: Date.now(),
    }

    const payload = {
      id: newCard.id,
      user_id: user.id,
      name: newCard.name,
      card_number: newCard.cardNumber,
      card_holder: newCard.cardHolder,
      expiry_date: newCard.expiryDate,
      issuer: newCard.issuer,
      custom_bank_name: newCard.customBankName ?? null,
      credit_limit: newCard.creditLimit,
      current_balance: newCard.currentBalance,
      color: newCard.color,
      created_at: newCard.createdAt,
    }

    const { error } = await supabase.from('cards').insert(payload)
    if (!error) {
      setData((prev) => ({ ...prev, cards: [newCard, ...prev.cards] }))
    }
  }

  const updateCard = async (id: string, card: Omit<Card, 'id' | 'createdAt'>) => {
    if (!supabase || !user) return

    const existing = data.cards.find((c) => c.id === id)
    if (!existing) return

    const updatedCard: Card = { ...card, id, createdAt: existing.createdAt }

    const { error } = await supabase
      .from('cards')
      .update({
        name: updatedCard.name,
        card_number: updatedCard.cardNumber,
        card_holder: updatedCard.cardHolder,
        expiry_date: updatedCard.expiryDate,
        issuer: updatedCard.issuer,
        custom_bank_name: updatedCard.customBankName ?? null,
        credit_limit: updatedCard.creditLimit,
        current_balance: updatedCard.currentBalance,
        color: updatedCard.color,
      })
      .eq('id', id)
      .eq('user_id', user.id)

    if (!error) {
      setData((prev) => ({
        ...prev,
        cards: prev.cards.map((c) => (c.id === id ? updatedCard : c)),
      }))
    }
  }

  const deleteCard = async (id: string) => {
    if (!supabase || !user) return

    const { error } = await supabase.from('cards').delete().eq('id', id).eq('user_id', user.id)
    if (!error) {
      setData((prev) => ({
        ...prev,
        cards: prev.cards.filter((c) => c.id !== id),
        transactions: prev.transactions.filter((t) => t.cardId !== id),
      }))
    }
  }

  const addTransaction = async (transaction: Omit<Transaction, 'id'>) => {
    if (!supabase || !user) return

    const newTransaction: Transaction = {
      ...transaction,
      id: createId(),
    }

    const { error } = await supabase.from('transactions').insert({
      id: newTransaction.id,
      user_id: user.id,
      card_id: newTransaction.cardId,
      amount: newTransaction.amount,
      description: newTransaction.description,
      category: newTransaction.category,
      date: newTransaction.date,
      type: newTransaction.type,
    })

    if (!error) {
      setData((prev) => ({
        ...prev,
        transactions: [newTransaction, ...prev.transactions],
      }))
    }
  }

  const updateTransaction = async (id: string, transaction: Omit<Transaction, 'id'>) => {
    if (!supabase || !user) return

    const updated: Transaction = { ...transaction, id }

    const { error } = await supabase
      .from('transactions')
      .update({
        card_id: updated.cardId,
        amount: updated.amount,
        description: updated.description,
        category: updated.category,
        date: updated.date,
        type: updated.type,
      })
      .eq('id', id)
      .eq('user_id', user.id)

    if (!error) {
      setData((prev) => ({
        ...prev,
        transactions: prev.transactions.map((t) => (t.id === id ? updated : t)),
      }))
    }
  }

  const deleteTransaction = async (id: string) => {
    if (!supabase || !user) return

    const { error } = await supabase.from('transactions').delete().eq('id', id).eq('user_id', user.id)
    if (!error) {
      setData((prev) => ({
        ...prev,
        transactions: prev.transactions.filter((t) => t.id !== id),
      }))
    }
  }

  const addLoan = async (loan: Omit<Loan, 'id' | 'createdAt'>): Promise<string | null> => {
    if (!supabase || !user) return null

    const newLoan: Loan = {
      ...loan,
      id: createId(),
      createdAt: Date.now(),
    }

    const { error } = await supabase.from('loans').insert({
      id: newLoan.id,
      user_id: user.id,
      name: newLoan.name,
      principal: newLoan.principal,
      current_amount: newLoan.currentAmount,
      interest_rate: newLoan.interestRate,
      tenure_months: newLoan.tenureMonths,
      start_date: newLoan.startDate,
      end_date: newLoan.endDate,
      created_at: newLoan.createdAt,
    })

    if (!error) {
      setData((prev) => ({
        ...prev,
        loans: [newLoan, ...prev.loans],
      }))
      return newLoan.id
    }

    return null
  }

  const updateLoan = async (id: string, loan: Omit<Loan, 'id' | 'createdAt'>) => {
    if (!supabase || !user) return

    const existing = data.loans.find((l) => l.id === id)
    if (!existing) return

    const updated: Loan = { ...loan, id, createdAt: existing.createdAt }

    const { error } = await supabase
      .from('loans')
      .update({
        name: updated.name,
        principal: updated.principal,
        current_amount: updated.currentAmount,
        interest_rate: updated.interestRate,
        tenure_months: updated.tenureMonths,
        start_date: updated.startDate,
        end_date: updated.endDate,
      })
      .eq('id', id)
      .eq('user_id', user.id)

    if (!error) {
      setData((prev) => ({
        ...prev,
        loans: prev.loans.map((l) => (l.id === id ? updated : l)),
      }))
    }
  }

  const deleteLoan = async (id: string) => {
    if (!supabase || !user) return

    const { error } = await supabase.from('loans').delete().eq('id', id).eq('user_id', user.id)
    if (!error) {
      setData((prev) => ({
        ...prev,
        loans: prev.loans.filter((l) => l.id !== id),
        emis: prev.emis.filter((e) => e.loanId !== id),
      }))
    }
  }

  const addEMI = async (emi: Omit<EMI, 'id' | 'createdAt'>) => {
    if (!supabase || !user) return

    const newEMI: EMI = {
      ...emi,
      id: createId(),
      createdAt: Date.now(),
    }

    const { error } = await supabase.from('emis').insert({
      id: newEMI.id,
      user_id: user.id,
      loan_id: newEMI.loanId,
      emi_amount: newEMI.emiAmount,
      due_date: newEMI.dueDate,
      is_paid: newEMI.isPaid,
      paid_date: newEMI.paidDate,
      created_at: newEMI.createdAt,
    })

    if (!error) {
      setData((prev) => ({
        ...prev,
        emis: [newEMI, ...prev.emis],
      }))
    }
  }

  const updateEMI = async (id: string, emi: Omit<EMI, 'id' | 'createdAt'>) => {
    if (!supabase || !user) return

    const existing = data.emis.find((e) => e.id === id)
    if (!existing) return

    const updated: EMI = { ...emi, id, createdAt: existing.createdAt }

    const { error } = await supabase
      .from('emis')
      .update({
        loan_id: updated.loanId,
        emi_amount: updated.emiAmount,
        due_date: updated.dueDate,
        is_paid: updated.isPaid,
        paid_date: updated.paidDate,
      })
      .eq('id', id)
      .eq('user_id', user.id)

    if (!error) {
      setData((prev) => ({
        ...prev,
        emis: prev.emis.map((e) => (e.id === id ? updated : e)),
      }))
    }
  }

  const deleteEMI = async (id: string) => {
    if (!supabase || !user) return

    const { error } = await supabase.from('emis').delete().eq('id', id).eq('user_id', user.id)
    if (!error) {
      setData((prev) => ({
        ...prev,
        emis: prev.emis.filter((e) => e.id !== id),
      }))
    }
  }

  if (authLoading || dataLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  return (
    <DataContext.Provider
      value={{
        data,
        cards: data.cards,
        user,
        profile,
        authLoading,
        dataLoading,
        authError,
        signIn,
        signUp,
        signOut,
        importData,
        clearAllData,
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
      }}
    >
      {children}
    </DataContext.Provider>
  )
}

export const useData = () => {
  const context = useContext(DataContext)
  if (!context) {
    throw new Error('useData must be used within a DataProvider')
  }
  return context
}
