'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/auth-provider';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  ShieldCheck,
  Users as UsersIcon,
  KeyRound,
  Loader2,
  Crown,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
  _count: { reports: number };
}

interface AdminUsersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AdminUsersDialog({
  open,
  onOpenChange,
}: AdminUsersDialogProps) {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [resetId, setResetId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users', { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to load users');
      const data = await res.json();
      setUsers(data.users);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) fetchUsers();
  }, [open, fetchUsers]);

  const toggleRole = async (u: AdminUser) => {
    const newRole = u.role === 'ADMIN' ? 'USER' : 'ADMIN';
    setBusyId(u.id);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: u.id,
          action: 'setRole',
          role: newRole,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || 'Failed to update role');
      }
      toast({
        title: 'Role updated',
        description: `${u.name} is now ${newRole === 'ADMIN' ? 'an Admin' : 'a regular user'}.`,
      });
      fetchUsers();
    } catch (err) {
      toast({
        title: 'Update failed',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setBusyId(null);
    }
  };

  const handleResetPassword = async () => {
    if (!resetId || !newPassword || newPassword.length < 6) return;
    setBusyId(resetId);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: resetId,
          action: 'resetPassword',
          newPassword,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || 'Failed to reset password');
      }
      toast({
        title: 'Password reset',
        description: 'The user can now log in with the new password.',
      });
      setResetId(null);
      setNewPassword('');
    } catch (err) {
      toast({
        title: 'Reset failed',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setBusyId(null);
    }
  };

  const formatDate = (s: string) => {
    try {
      return new Date(s).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return s;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UsersIcon className="h-5 w-5 text-slate-600" />
            User Management
          </DialogTitle>
          <DialogDescription>
            Manage all user accounts. Promote users to admin or reset their
            passwords. Admins can view, edit, and delete every report in the
            system.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          </div>
        ) : (
          <div className="border border-slate-200 rounded-lg overflow-hidden mt-2">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="font-semibold text-slate-700">Name</TableHead>
                    <TableHead className="font-semibold text-slate-700">Email</TableHead>
                    <TableHead className="font-semibold text-slate-700">Role</TableHead>
                    <TableHead className="font-semibold text-slate-700 text-center">Reports</TableHead>
                    <TableHead className="font-semibold text-slate-700">Joined</TableHead>
                    <TableHead className="font-semibold text-slate-700 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => {
                    const isSelf = u.id === currentUser?.id;
                    const isResetting = resetId === u.id;
                    return (
                      <React.Fragment key={u.id}>
                        <TableRow className="hover:bg-slate-50">
                          <TableCell className="font-medium text-slate-800">
                            {u.name}
                            {isSelf && (
                              <span className="ml-2 text-[10px] text-slate-400 font-normal">
                                (you)
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-slate-600 text-sm">
                            {u.email}
                          </TableCell>
                          <TableCell>
                            {u.role === 'ADMIN' ? (
                              <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">
                                <Crown className="h-3 w-3 mr-1" />
                                Admin
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="bg-slate-100 text-slate-600 hover:bg-slate-100">
                                User
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-center text-slate-600">
                            {u._count.reports}
                          </TableCell>
                          <TableCell className="text-slate-600 text-sm">
                            {formatDate(u.createdAt)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs"
                                disabled={busyId === u.id || isSelf}
                                onClick={() => toggleRole(u)}
                                title={
                                  isSelf
                                    ? 'You cannot change your own role'
                                    : undefined
                                }
                              >
                                {busyId === u.id ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : u.role === 'ADMIN' ? (
                                  'Demote'
                                ) : (
                                  'Promote'
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs"
                                disabled={busyId === u.id}
                                onClick={() => {
                                  setResetId(isResetting ? null : u.id);
                                  setNewPassword('');
                                }}
                              >
                                <KeyRound className="h-3 w-3 mr-1" />
                                Reset PW
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                        {isResetting && (
                          <TableRow className="bg-amber-50">
                            <TableCell colSpan={6}>
                              <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center py-1">
                                <span className="text-sm text-slate-600 shrink-0">
                                  New password for{' '}
                                  <strong>{u.name}</strong>:
                                </span>
                                <Input
                                  type="text"
                                  placeholder="At least 6 characters"
                                  value={newPassword}
                                  onChange={(e) => setNewPassword(e.target.value)}
                                  className="h-8 text-sm max-w-xs"
                                />
                                <div className="flex gap-1">
                                  <Button
                                    size="sm"
                                    className="h-8 text-xs"
                                    disabled={
                                      busyId === u.id ||
                                      newPassword.length < 6
                                    }
                                    onClick={handleResetPassword}
                                  >
                                    {busyId === u.id ? (
                                      <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                    ) : null}
                                    Confirm
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-8 text-xs"
                                    onClick={() => {
                                      setResetId(null);
                                      setNewPassword('');
                                    }}
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 mt-3 text-xs text-slate-500">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          <span>
            {users.length} user{users.length !== 1 ? 's' : ''} total ·{' '}
            {users.filter((u) => u.role === 'ADMIN').length} admin
            {users.filter((u) => u.role === 'ADMIN').length !== 1 ? 's' : ''}
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
