import { Metadata } from 'next';
import SettingsPage from '@/components/settings/SettingsPage';

export const metadata: Metadata = {
  title: 'Settings - Credit Card Manager',
  description: 'Manage application settings and data',
};

export default function Page() {
  return <SettingsPage />;
}
