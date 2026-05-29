import { Metadata } from 'next';
import LoansPage from '@/components/loans/LoansPage';

export const metadata: Metadata = {
  title: 'Loans - Credit Card Manager',
  description: 'Manage your loans and track loan details',
};

export default function Page() {
  return <LoansPage />;
}
