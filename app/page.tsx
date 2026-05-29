import { Metadata } from 'next';
import Dashboard from '@/components/dashboard/Dashboard';

export const metadata: Metadata = {
  title: 'Dashboard - Credit Card Manager',
  description: 'View your financial overview and recent transactions',
};

export default function DashboardPage() {
  return <Dashboard />;
}
