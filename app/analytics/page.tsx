import { Suspense } from 'react';
import AnalyticsClientPage from './client';

export default function AnalyticsPage() {
  return (
    <Suspense fallback={<div className="p-6 text-muted-foreground">Loading…</div>}>
      <AnalyticsClientPage />
    </Suspense>
  );
}
