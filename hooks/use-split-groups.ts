'use client';

import { useState, useEffect, useCallback } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import {
  SplitGroup, SplitGroupMember, SplitExpense,
  SplitExpenseSplit, SplitSettlement, MemberBalance,
} from '@/lib/types';

// ── row-to-type mappers ───────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const toGroup = (r: any): SplitGroup => ({
  id: r.id, name: r.name, description: r.description,
  inviteCode: r.invite_code, createdBy: r.created_by,
  createdAt: r.created_at, isArchived: r.is_archived,
});
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const toMember = (r: any): SplitGroupMember => ({
  id: r.id, groupId: r.group_id, userId: r.user_id,
  displayName: r.display_name, role: r.role, joinedAt: r.joined_at,
});
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const toExpense = (r: any): SplitExpense => ({
  id: r.id, groupId: r.group_id, paidByMemberId: r.paid_by_member_id,
  paidByName: r.paid_by_name, description: r.description, amount: Number(r.amount),
  category: r.category, date: r.date, splitType: r.split_type, createdAt: r.created_at,
});
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const toSplit = (r: any): SplitExpenseSplit => ({
  id: r.id, expenseId: r.expense_id, groupId: r.group_id,
  memberId: r.member_id, memberName: r.member_name,
  amount: Number(r.amount), isSettled: r.is_settled,
});
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const toSettlement = (r: any): SplitSettlement => ({
  id: r.id, groupId: r.group_id, fromMemberId: r.from_member_id,
  fromName: r.from_name, toMemberId: r.to_member_id, toName: r.to_name,
  amount: Number(r.amount), date: r.date, notes: r.notes, createdAt: r.created_at,
});

function genCode() {
  return Math.random().toString(36).slice(2, 5).toUpperCase() +
         Math.random().toString(36).slice(2, 5).toUpperCase();
}

// ── balance calculation ───────────────────────────────────────────────────────

export function calcBalances(
  members: SplitGroupMember[],
  expenses: SplitExpense[],
  splits: SplitExpenseSplit[],
  settlements: SplitSettlement[],
): MemberBalance[] {
  const net: Record<string, number> = {};
  members.forEach((m) => (net[m.id] = 0));

  // For each expense: payer LENT the sum of all other members' splits
  expenses.forEach((exp) => {
    const expSplits = splits.filter((s) => s.expenseId === exp.id);
    expSplits.forEach((s) => {
      if (s.memberId !== exp.paidByMemberId) {
        // payer is owed this amount
        net[exp.paidByMemberId] = (net[exp.paidByMemberId] || 0) + s.amount;
        // splitter owes this amount
        net[s.memberId] = (net[s.memberId] || 0) - s.amount;
      }
    });
  });

  // Settlements
  settlements.forEach((s) => {
    net[s.fromMemberId] = (net[s.fromMemberId] || 0) + s.amount; // they paid, reduce debt
    net[s.toMemberId]   = (net[s.toMemberId]   || 0) - s.amount; // they received, reduce credit
  });

  return members.map((m) => ({
    memberId: m.id, memberName: m.displayName, userId: m.userId,
    netBalance: Math.round((net[m.id] || 0) * 100) / 100,
  }));
}

// ── hook ──────────────────────────────────────────────────────────────────────

export interface UseSplitGroupsResult {
  groups: SplitGroup[];
  loading: boolean;
  tablesReady: boolean;
  createGroup: (name: string, description: string, displayName: string) => Promise<string | null>;
  joinGroup: (inviteCode: string, displayName: string) => Promise<{ error?: string; groupId?: string }>;
  leaveGroup: (groupId: string) => Promise<{ error?: string }>;
  archiveGroup: (groupId: string) => Promise<void>;
  deleteGroup: (groupId: string) => Promise<{ error?: string }>;
  getGroupData: (groupId: string) => Promise<{
    group: SplitGroup | null;
    members: SplitGroupMember[];
    expenses: SplitExpense[];
    splits: SplitExpenseSplit[];
    settlements: SplitSettlement[];
  }>;
  addExpense: (
    groupId: string,
    paidByMemberId: string,
    paidByName: string,
    description: string,
    amount: number,
    category: string,
    date: number,
    splits: { memberId: string; memberName: string; amount: number }[]
  ) => Promise<{ error?: string }>;
  deleteExpense: (expenseId: string, groupId: string) => Promise<void>;
  addSettlement: (
    groupId: string,
    fromMemberId: string, fromName: string,
    toMemberId: string, toName: string,
    amount: number, date: number, notes: string
  ) => Promise<void>;
  myMemberId: (groupId: string, members: SplitGroupMember[]) => string | undefined;
  currentUserId: string | null;
}

export function useSplitGroups(): UseSplitGroupsResult {
  const supabase = getSupabaseBrowserClient();
  const [groups, setGroups] = useState<SplitGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [tablesReady, setTablesReady] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [userLoaded, setUserLoaded] = useState(false);

  // Get current user
  useEffect(() => {
    if (!supabase) { setLoading(false); setUserLoaded(true); return; }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    supabase.auth.getUser().then((res: any) => {
      setCurrentUserId(res?.data?.user?.id ?? null);
      setUserLoaded(true);
    });
  }, [supabase]);

  // Load groups
  const loadGroups = useCallback(async () => {
    if (!userLoaded) return; // wait until auth is resolved
    if (!supabase || !currentUserId) { setLoading(false); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('split_group_members')
        .select('group_id')
        .eq('user_id', currentUserId);
      if (error?.code === '42P01') { setTablesReady(false); setLoading(false); return; }
      if (error) {
        console.error('[loadGroups] split_group_members error:', error);
        setLoading(false);
        return;
      }
      if (!data || data.length === 0) { setGroups([]); setLoading(false); return; }
      const ids = (data as { group_id: string }[]).map((r) => r.group_id);
      const { data: gRows, error: gErr } = await supabase.from('split_groups').select('*').in('id', ids).order('created_at', { ascending: false });
      if (gErr) console.error('[loadGroups] split_groups error:', gErr);
      setGroups((gRows ?? []).map((r: Record<string, unknown>) => toGroup(r)));
    } finally {
      setLoading(false);
    }
  }, [supabase, currentUserId, userLoaded]);

  useEffect(() => { loadGroups(); }, [loadGroups]);

  // ── create group ────────────────────────────────────────────────────────────
  const createGroup = useCallback(async (name: string, description: string, displayName: string): Promise<string | null> => {
    if (!supabase || !currentUserId) return null;
    const now = Date.now();
    const { data: gData, error: gErr } = await supabase
      .from('split_groups')
      .insert({ name, description, invite_code: genCode(), created_by: currentUserId, created_at: now, is_archived: false })
      .select()
      .single();
    if (gErr || !gData) {
      console.error('[createGroup] insert error:', gErr);
      return null;
    }
    // add creator as admin member
    const { error: mErr } = await supabase.from('split_group_members').insert({
      group_id: gData.id, user_id: currentUserId,
      display_name: displayName, role: 'admin', joined_at: now,
    });
    if (mErr) console.error('[createGroup] member insert error:', mErr);
    setGroups((prev) => [toGroup(gData), ...prev]);
    return gData.id;
  }, [supabase, currentUserId]);

  // ── join group ──────────────────────────────────────────────────────────────
  const joinGroup = useCallback(async (inviteCode: string, displayName: string) => {
    if (!supabase || !currentUserId) return { error: 'Not authenticated' };
    const { data: gData, error: gErr } = await supabase
      .from('split_groups')
      .select('*')
      .eq('invite_code', inviteCode.toUpperCase().trim())
      .single();
    if (gErr || !gData) return { error: 'Group not found. Check your invite code.' };
    // already a member?
    const { data: existing } = await supabase
      .from('split_group_members')
      .select('id')
      .eq('group_id', gData.id)
      .eq('user_id', currentUserId)
      .maybeSingle();
    if (existing) return { error: 'You are already in this group.', groupId: gData.id };
    const { error: mErr } = await supabase.from('split_group_members').insert({
      group_id: gData.id, user_id: currentUserId,
      display_name: displayName.trim(), role: 'member', joined_at: Date.now(),
    });
    if (mErr) return { error: mErr.message };
    const newGroup = toGroup(gData);
    setGroups((prev) => [newGroup, ...prev.filter((g) => g.id !== newGroup.id)]);
    return { groupId: gData.id };
  }, [supabase, currentUserId]);

  // ── leave group ─────────────────────────────────────────────────────────────
  const leaveGroup = useCallback(async (groupId: string) => {
    if (!supabase || !currentUserId) return { error: 'Not authenticated' };
    const { data: member } = await supabase
      .from('split_group_members')
      .select('id')
      .eq('group_id', groupId).eq('user_id', currentUserId)
      .maybeSingle();
    if (!member) return { error: 'Not a member' };
    // check outstanding balance
    const { data: unsettled } = await supabase
      .from('split_expense_splits')
      .select('amount, is_settled')
      .eq('group_id', groupId).eq('member_id', member.id).eq('is_settled', false);
    if (unsettled && unsettled.length > 0) {
      const total = (unsettled as { amount: number }[]).reduce((s: number, r) => s + Number(r.amount), 0);
      return { error: `You have ₹${total.toLocaleString('en-IN', { maximumFractionDigits: 0 })} in unsettled expenses. Settle up before leaving.` };
    }
    await supabase.from('split_group_members').delete().eq('id', member.id);
    setGroups((prev) => prev.filter((g) => g.id !== groupId));
    return {};
  }, [supabase, currentUserId]);

  // ── archive group ───────────────────────────────────────────────────────────
  const archiveGroup = useCallback(async (groupId: string) => {
    if (!supabase) return;
    await supabase.from('split_groups').update({ is_archived: true }).eq('id', groupId);
    setGroups((prev) => prev.map((g) => g.id === groupId ? { ...g, isArchived: true } : g));
  }, [supabase]);

  // ── delete group ────────────────────────────────────────────────────────────
  const deleteGroup = useCallback(async (groupId: string) => {
    if (!supabase || !currentUserId) return { error: 'Not authenticated' };
    // Only creator can delete
    const group = groups.find((g) => g.id === groupId);
    if (group && group.createdBy !== currentUserId) return { error: 'Only the group creator can delete this group.' };
    // Cascade delete: splits → expenses → settlements → members → group
    // (FK ON DELETE CASCADE handles children, but expenses reference members so order matters)
    await supabase.from('split_expense_splits').delete().eq('group_id', groupId);
    await supabase.from('split_expenses').delete().eq('group_id', groupId);
    await supabase.from('split_settlements').delete().eq('group_id', groupId);
    await supabase.from('split_group_members').delete().eq('group_id', groupId);
    const { error } = await supabase.from('split_groups').delete().eq('id', groupId);
    if (error) return { error: error.message };
    setGroups((prev) => prev.filter((g) => g.id !== groupId));
    return {};
  }, [supabase, currentUserId, groups]);

  // ── get full group data ─────────────────────────────────────────────────────
  const getGroupData = useCallback(async (groupId: string) => {
    const empty = { group: null, members: [], expenses: [], splits: [], settlements: [] };
    if (!supabase) return empty;
    const [gRes, mRes, eRes] = await Promise.all([
      supabase.from('split_groups').select('*').eq('id', groupId).single(),
      supabase.from('split_group_members').select('*').eq('group_id', groupId).order('joined_at'),
      supabase.from('split_expenses').select('*').eq('group_id', groupId).order('date', { ascending: false }),
    ]);
    if (gRes.error || !gRes.data) return empty;
    const expenseIds = (eRes.data ?? []).map((e: { id: string }) => e.id);
    const [splitsRes, settlesRes] = await Promise.all([
      expenseIds.length
        ? supabase.from('split_expense_splits').select('*').in('expense_id', expenseIds)
        : Promise.resolve({ data: [] as unknown[] }),
      supabase.from('split_settlements').select('*').eq('group_id', groupId).order('date', { ascending: false }),
    ]);
    return {
      group: toGroup(gRes.data),
      members: (mRes.data ?? []).map((r: Record<string, unknown>) => toMember(r)),
      expenses: (eRes.data ?? []).map((r: Record<string, unknown>) => toExpense(r)),
      splits: ((splitsRes.data ?? []) as unknown[]).map((r) => toSplit(r)),
      settlements: (settlesRes.data ?? []).map((r: Record<string, unknown>) => toSettlement(r)),
    };
  }, [supabase]);

  // ── add expense ─────────────────────────────────────────────────────────────
  const addExpense = useCallback(async (
    groupId: string, paidByMemberId: string, paidByName: string,
    description: string, amount: number, category: string, date: number,
    splitList: { memberId: string; memberName: string; amount: number }[]
  ) => {
    if (!supabase) return { error: 'Not configured' };
    const now = Date.now();
    const { data: eData, error: eErr } = await supabase
      .from('split_expenses')
      .insert({ group_id: groupId, paid_by_member_id: paidByMemberId, paid_by_name: paidByName, description, amount, category, date, split_type: 'equal', created_at: now })
      .select().single();
    if (eErr || !eData) return { error: eErr?.message ?? 'Failed to add expense' };
    const splitRows = splitList.map((s) => ({
      expense_id: eData.id, group_id: groupId, member_id: s.memberId,
      member_name: s.memberName, amount: s.amount, is_settled: false,
    }));
    const { error: sErr } = await supabase.from('split_expense_splits').insert(splitRows);
    if (sErr) return { error: sErr.message };
    return {};
  }, [supabase]);

  // ── delete expense ──────────────────────────────────────────────────────────
  const deleteExpense = useCallback(async (expenseId: string, groupId: string) => {
    if (!supabase) return;
    await supabase.from('split_expense_splits').delete().eq('expense_id', expenseId);
    await supabase.from('split_expenses').delete().eq('id', expenseId).eq('group_id', groupId);
  }, [supabase]);

  // ── add settlement ──────────────────────────────────────────────────────────
  const addSettlement = useCallback(async (
    groupId: string, fromMemberId: string, fromName: string,
    toMemberId: string, toName: string, amount: number, date: number, notes: string
  ) => {
    if (!supabase) return;
    await supabase.from('split_settlements').insert({
      group_id: groupId, from_member_id: fromMemberId, from_name: fromName,
      to_member_id: toMemberId, to_name: toName, amount, date, notes, created_at: Date.now(),
    });
  }, [supabase]);

  const myMemberId = useCallback(
    (groupId: string, members: SplitGroupMember[]) =>
      members.find((m) => m.userId === currentUserId && m.groupId === groupId)?.id,
    [currentUserId]
  );

  return {
    groups, loading, tablesReady,
    createGroup, joinGroup, leaveGroup, archiveGroup, deleteGroup,
    getGroupData, addExpense, deleteExpense, addSettlement,
    myMemberId, currentUserId,
  };
}
