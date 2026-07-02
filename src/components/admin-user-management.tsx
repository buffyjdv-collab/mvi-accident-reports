'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/auth-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Users,
  UserPlus,
  Loader2,
  ShieldCheck,
  Pencil,
  Trash2,
  Mail,
  KeyRound,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'USER' | 'ADMIN';
  createdAt: string;
  _count: { reports: number };
}

type EditForm = {
  name: string;
  email: string;
  role: 'USER' | 'ADMIN';
  password: string;
};

export default function AdminUserManagement() {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);

  // Add-user dialog
  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'USER' as 'USER' | 'ADMIN',
  });
  const [addSaving, setAddSaving] = useState(false);

  // Edit-user dialog
  const [editTarget, setEditTarget] = useState<AdminUser | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({
    name: '',
    email: '',
    role: 'USER',
    password: '',
  });
  const [editSaving, setEditSaving] = useState(false);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
  const [deleteSaving, setDeleteSaving] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load users');
      setUsers(data);
    } catch (err) {
      toast({
        title: 'Could not load users',
        description: err instanceof Error ? err.message : undefined,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const openAdd = () => {
    setAddForm({ name: '', email: '', password: '', role: 'USER' });
    setAddOpen(true);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddSaving(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create user');
      setUsers((prev) => [...prev, data]);
      setAddOpen(false);
      toast({
        title: 'User created',
        description: `${data.name} (${data.email}) added as ${data.role}.`,
      });
    } catch (err) {
      toast({
        title: 'Could not create user',
        description: err instanceof Error ? err.message : undefined,
        variant: 'destructive',
      });
    } finally {
      setAddSaving(false);
    }
  };

  const openEdit = (u: AdminUser) => {
    setEditTarget(u);
    setEditForm({
      name: u.name,
      email: u.email,
      role: u.role,
      password: '',
    });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;
    setEditSaving(true);
    try {
      const payload: Record<string, string> = {
        name: editForm.name,
        email: editForm.email,
        role: editForm.role,
      };
      if (editForm.password) payload.password = editForm.password;
      const res = await fetch(`/api/admin/users/${editTarget.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update user');
      setUsers((prev) =>
        prev.map((u) => (u.id === editTarget.id ? data : u))
      );
      setEditTarget(null);
      toast({
        title: 'User updated',
        description: `${data.name}'s account has been updated.`,
      });
    } catch (err) {
      toast({
        title: 'Could not update user',
        description: err instanceof Error ? err.message : undefined,
        variant: 'destructive',
      });
    } finally {
      setEditSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteSaving(true);
    try {
      const res = await fetch(`/api/admin/users/${deleteTarget.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete user');
      setUsers((prev) => prev.filter((u) => u.id !== deleteTarget.id));
      setDeleteTarget(null);
      toast({
        title: 'User deleted',
        description: `${deleteTarget.name}'s account has been removed.`,
      });
    } catch (err) {
      toast({
        title: 'Could not delete user',
        description: err instanceof Error ? err.message : undefined,
        variant: 'destructive',
      });
    } finally {
      setDeleteSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
            <Users className="h-6 w-6 text-slate-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              User Management
            </h2>
            <p className="text-sm text-slate-500">
              Create, edit, and remove user accounts. Control who has admin
              access.
            </p>
          </div>
        </div>
        <Button onClick={openAdd}>
          <UserPlus className="h-4 w-4 mr-2" />
          Add User
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-5">
            <p className="text-2xl font-bold text-slate-900">{users.length}</p>
            <p className="text-xs text-slate-500 mt-1">Total Users</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-2xl font-bold text-amber-600">
              {users.filter((u) => u.role === 'ADMIN').length}
            </p>
            <p className="text-xs text-slate-500 mt-1">Administrators</p>
          </CardContent>
        </Card>
        <Card className="col-span-2 sm:col-span-1">
          <CardContent className="pt-5">
            <p className="text-2xl font-bold text-slate-700">
              {users.reduce((sum, u) => sum + u._count.reports, 0)}
            </p>
            <p className="text-xs text-slate-500 mt-1">Total Reports</p>
          </CardContent>
        </Card>
      </div>

      {/* Users table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">All Users</CardTitle>
          <CardDescription>
            {loading ? 'Loading...' : `${users.length} account(s)`}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-[60vh] overflow-y-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-white z-10">
                <TableRow>
                  <TableHead className="w-[30%]">Name</TableHead>
                  <TableHead className="w-[35%]">Email</TableHead>
                  <TableHead className="w-[15%]">Role</TableHead>
                  <TableHead className="w-[10%] text-right">Reports</TableHead>
                  <TableHead className="w-[10%] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10">
                      <Loader2 className="h-5 w-5 animate-spin mx-auto text-slate-400" />
                    </TableCell>
                  </TableRow>
                ) : users.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center py-10 text-slate-500"
                    >
                      No users found.
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((u) => {
                    const isSelf = u.id === currentUser?.id;
                    return (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium text-slate-900">
                          <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-700 text-sm font-semibold">
                              {u.name.charAt(0).toUpperCase()}
                            </div>
                            <span>
                              {u.name}
                              {isSelf && (
                                <span className="ml-2 text-[10px] text-slate-400 font-normal">
                                  (you)
                                </span>
                              )}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-slate-600">
                          {u.email}
                        </TableCell>
                        <TableCell>
                          {u.role === 'ADMIN' ? (
                            <Badge className="bg-amber-500 text-amber-950 hover:bg-amber-500">
                              <ShieldCheck className="h-3 w-3 mr-1" />
                              ADMIN
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="text-slate-600"
                            >
                              USER
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right text-slate-600">
                          {u._count.reports}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEdit(u)}
                              disabled={isSelf}
                              title={
                                isSelf
                                  ? 'Use the Profile page to edit your own account'
                                  : 'Edit user'
                              }
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteTarget(u)}
                              disabled={isSelf}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              title={
                                isSelf
                                  ? "You can't delete your own account"
                                  : 'Delete user'
                              }
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add user dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>
              Create a new account. The user can sign in immediately with these
              credentials.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="add-name">Full Name</Label>
              <Input
                id="add-name"
                value={addForm.name}
                onChange={(e) =>
                  setAddForm((f) => ({ ...f, name: e.target.value }))
                }
                required
                placeholder="Full name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-email">Email</Label>
              <Input
                id="add-email"
                type="email"
                value={addForm.email}
                onChange={(e) =>
                  setAddForm((f) => ({ ...f, email: e.target.value }))
                }
                required
                placeholder="you@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-password">Password</Label>
              <Input
                id="add-password"
                type="text"
                value={addForm.password}
                onChange={(e) =>
                  setAddForm((f) => ({ ...f, password: e.target.value }))
                }
                required
                placeholder="At least 6 characters"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-role">Role</Label>
              <Select
                value={addForm.role}
                onValueChange={(v: 'USER' | 'ADMIN') =>
                  setAddForm((f) => ({ ...f, role: v }))
                }
              >
                <SelectTrigger id="add-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USER">USER — can manage own reports</SelectItem>
                  <SelectItem value="ADMIN">
                    ADMIN — full access, manage all users
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={addSaving}>
                {addSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create User'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit user dialog */}
      <Dialog
        open={!!editTarget}
        onOpenChange={(o) => !o && setEditTarget(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update {editTarget?.name}&apos;s account details, role, or set a
              new password.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Full Name</Label>
              <Input
                id="edit-name"
                value={editForm.name}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, name: e.target.value }))
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={editForm.email}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, email: e.target.value }))
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-role">Role</Label>
              <Select
                value={editForm.role}
                onValueChange={(v: 'USER' | 'ADMIN') =>
                  setEditForm((f) => ({ ...f, role: v }))
                }
              >
                <SelectTrigger id="edit-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USER">USER</SelectItem>
                  <SelectItem value="ADMIN">ADMIN</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-password">
                <span className="flex items-center gap-1.5">
                  <KeyRound className="h-3.5 w-3.5" />
                  New Password
                  <span className="text-xs font-normal text-slate-400">
                    (leave blank to keep current)
                  </span>
                </span>
              </Label>
              <Input
                id="edit-password"
                type="password"
                value={editForm.password}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, password: e.target.value }))
                }
                placeholder="••••••••"
                autoComplete="new-password"
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditTarget(null)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={editSaving}>
                {editSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this user?</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to permanently delete{' '}
              <span className="font-semibold text-slate-900">
                {deleteTarget?.name}
              </span>{' '}
              (
              <span className="inline-flex items-center">
                <Mail className="h-3 w-3 mr-1" />
                {deleteTarget?.email}
              </span>
              ). Their reports will remain in the system but become unowned
              (admin-only). This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteSaving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteSaving}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleteSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete User'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
