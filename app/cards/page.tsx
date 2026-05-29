import { Metadata } from 'next';
import CardsPage from '@/components/cards/CardsPage';

export const metadata: Metadata = {
  title: 'My Cards - Credit Card Manager',
  description: 'Manage your credit cards and track transactions',
};

export default function Page() {
  return <CardsPage />;
}
