import { Metadata } from 'next';
import EMIsPage from '@/components/emis/EMIsPage';

export const metadata: Metadata = {
  title: 'EMIs - Credit Card Manager',
  description: 'Track and manage your EMI payments',
};

export default function Page() {
  return <EMIsPage />;
}
