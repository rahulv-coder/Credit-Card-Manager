'use client';
import { use } from 'react';
import GroupDetailPage from '@/components/groups/GroupDetailPage';
export default function GroupDetailRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <GroupDetailPage groupId={id} />;
}
