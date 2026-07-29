import { Suspense } from 'react';
import LendingsPageClient from './client';

export default function LendingsPage() {
  return (
    <Suspense fallback={<div className="p-6 text-muted-foreground">Loading…</div>}>
      <LendingsPageClient />
    </Suspense>
  );
}
