'use client';

import { useData } from '@/lib/context/DataContext';
import AnalyticsPage from '@/components/analytics/AnalyticsPage';

export default function AnalyticsClientPage() {
  const { data } = useData();
  return <AnalyticsPage transactions={data.transactions} cards={data.cards} />;
}
