'use client';

import React, { useState } from 'react';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Users, Hash } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultDisplayName?: string;
  onCreateGroup: (name: string, description: string, displayName: string) => Promise<void>;
  onJoinGroup: (code: string, displayName: string) => Promise<{ error?: string }>;
}

export default function CreateGroupModal({
  open, onOpenChange, defaultDisplayName = '',
  onCreateGroup, onJoinGroup,
}: Props) {
  const [tab, setTab] = useState<'create' | 'join'>('create');

  // Create form
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [myName, setMyName] = useState(defaultDisplayName);
  const [creating, setCreating] = useState(false);

  // Join form
  const [code, setCode] = useState('');
  const [joinName, setJoinName] = useState(defaultDisplayName);
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState('');

  const reset = () => {
    setName(''); setDesc(''); setMyName(defaultDisplayName);
    setCode(''); setJoinName(defaultDisplayName); setJoinError('');
    setCreating(false); setJoining(false); setTab('create');
  };

  const handleOpenChange = (v: boolean) => { if (!v) reset(); onOpenChange(v); };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !myName.trim()) return;
    setCreating(true);
    await onCreateGroup(name.trim(), desc.trim(), myName.trim());
    handleOpenChange(false);
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !joinName.trim()) return;
    setJoining(true); setJoinError('');
    const res = await onJoinGroup(code.trim(), joinName.trim());
    setJoining(false);
    if (res.error) { setJoinError(res.error); }
    else handleOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Group Workspace</DialogTitle>
          <DialogDescription>Create a new group or join an existing one with an invite code.</DialogDescription>
        </DialogHeader>

        {/* Tabs */}
        <div className="grid grid-cols-2 gap-1 bg-secondary rounded-lg p-1">
          {(['create', 'join'] as const).map((t) => (
            <button key={t} type="button" onClick={() => setTab(t)}
              className={`py-2 rounded-md text-sm font-medium transition-all ${
                tab === t ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'
              }`}>
              {t === 'create' ? '✨ Create Group' : '🔗 Join with Code'}
            </button>
          ))}
        </div>

        {tab === 'create' ? (
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Group Name *</Label>
              <Input placeholder="e.g. Goa Trip, Home Expenses, Office Lunch" value={name}
                onChange={(e) => setName(e.target.value)} autoFocus />
            </div>
            <div className="space-y-1.5">
              <Label>Description <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Input placeholder="What is this group for?" value={desc} onChange={(e) => setDesc(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Your Name in this Group *</Label>
              <Input placeholder="How should others see you?" value={myName} onChange={(e) => setMyName(e.target.value)} />
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-900/15 rounded-lg border border-blue-200 dark:border-blue-800 text-xs text-blue-700 dark:text-blue-400">
              <strong>After creating:</strong> share the invite code with friends so they can join from their account.
            </div>
            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>Cancel</Button>
              <Button type="submit" className="flex-1 gap-2" disabled={!name.trim() || !myName.trim() || creating}>
                <Users size={16} /> {creating ? 'Creating…' : 'Create Group'}
              </Button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleJoin} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Invite Code *</Label>
              <div className="relative">
                <Hash size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="e.g. ABC123" value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="pl-8 font-mono tracking-widest uppercase" autoFocus />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Your Name in this Group *</Label>
              <Input placeholder="How should others see you?" value={joinName} onChange={(e) => setJoinName(e.target.value)} />
            </div>
            {joinError && (
              <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded p-2">{joinError}</p>
            )}
            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>Cancel</Button>
              <Button type="submit" className="flex-1 gap-2" disabled={!code.trim() || !joinName.trim() || joining}>
                {joining ? 'Joining…' : '🔗 Join Group'}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
