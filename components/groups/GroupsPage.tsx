'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useSplitGroups } from '@/hooks/use-split-groups';
import { useData } from '@/lib/context/DataContext';
import CreateGroupModal from './CreateGroupModal';
import { Plus, Users, AlertCircle, ExternalLink, Archive } from 'lucide-react';
import { toast } from 'sonner';

const fmt = (n: number) => '₹' + Math.abs(n).toLocaleString('en-IN', { maximumFractionDigits: 0 });

export default function GroupsPage() {
  const router = useRouter();
  const { profile } = useData();
  const { groups, loading, tablesReady, createGroup, joinGroup } = useSplitGroups();
  const [showModal, setShowModal] = useState(false);

  const defaultName = profile
    ? [profile.firstName, profile.lastName].filter(Boolean).join(' ')
    : '';

  const handleCreate = async (name: string, desc: string, displayName: string) => {
    const id = await createGroup(name, desc, displayName);
    if (id) { toast.success(`Group "${name}" created!`); router.push(`/groups/${id}`); }
    else toast.error('Failed to create group. Please check your Supabase setup.');
  };

  const handleJoin = async (code: string, displayName: string) => {
    const res = await joinGroup(code, displayName);
    if (!res.error && res.groupId) {
      toast.success('Joined group!');
      router.push(`/groups/${res.groupId}`);
    }
    return res;
  };

  if (!tablesReady) {
    return (
      <div className="p-4 md:p-6 space-y-6">
        <h1 className="text-3xl font-bold text-foreground">Split Groups</h1>
        <Card className="p-6 border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/10">
          <div className="flex items-start gap-3">
            <AlertCircle size={20} className="text-amber-500 shrink-0 mt-0.5" />
            <div className="space-y-3">
              <h3 className="font-semibold text-foreground">Database Setup Required</h3>
              <p className="text-sm text-muted-foreground">
                Split Groups requires new tables in your Supabase database. Run the SQL migration to enable this feature.
              </p>
              <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Open your Supabase project dashboard</li>
                <li>Go to <strong>SQL Editor</strong></li>
                <li>Paste and run the contents of <code className="bg-secondary px-1 rounded">supabase/schema_split_groups.sql</code></li>
                <li>Refresh this page</li>
              </ol>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  const activeGroups = groups.filter((g) => !g.isArchived);
  const archivedGroups = groups.filter((g) => g.isArchived);

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Split Groups</h1>
          <p className="text-muted-foreground">Share expenses with friends &amp; family</p>
        </div>
        <Button onClick={() => setShowModal(true)} className="gap-2">
          <Plus size={18} /> New Group
        </Button>
      </div>

      {/* Empty state */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-28 bg-secondary rounded-xl animate-pulse" />
          ))}
        </div>
      ) : groups.length === 0 ? (
        <Card className="p-12 border border-border text-center">
          <Users size={40} className="mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-lg font-semibold text-foreground mb-1">No groups yet</p>
          <p className="text-sm text-muted-foreground mb-4">
            Create a group for a trip, household, or any shared expense. Invite friends with a code.
          </p>
          <Button onClick={() => setShowModal(true)} className="gap-2">
            <Plus size={16} /> Create your first group
          </Button>
        </Card>
      ) : (
        <>
          {/* Active groups */}
          <div className="space-y-3">
            {activeGroups.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => router.push(`/groups/${g.id}`)}
                className="w-full text-left"
              >
                <Card className="p-5 border border-border shadow-sm hover:shadow-md hover:border-primary/30 transition-all group">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center text-lg font-bold text-primary shrink-0">
                        {g.name.slice(0, 1).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground">{g.name}</p>
                        {g.description && <p className="text-xs text-muted-foreground truncate">{g.description}</p>}
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-muted-foreground font-mono bg-secondary px-1.5 py-0.5 rounded">
                            Code: {g.inviteCode}
                          </span>
                        </div>
                      </div>
                    </div>
                    <ExternalLink size={16} className="text-muted-foreground group-hover:text-foreground mt-1 shrink-0 transition-colors" />
                  </div>
                </Card>
              </button>
            ))}
          </div>

          {/* Archived groups */}
          {archivedGroups.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Archive size={14} className="text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Archived ({archivedGroups.length})</span>
              </div>
              <div className="space-y-2 opacity-60">
                {archivedGroups.map((g) => (
                  <Card key={g.id} className="p-4 border border-border">
                    <p className="font-medium text-foreground">{g.name}</p>
                    <p className="text-xs text-muted-foreground">Archived</p>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <CreateGroupModal
        open={showModal}
        onOpenChange={setShowModal}
        defaultDisplayName={defaultName}
        onCreateGroup={handleCreate}
        onJoinGroup={handleJoin}
      />
    </div>
  );
}
