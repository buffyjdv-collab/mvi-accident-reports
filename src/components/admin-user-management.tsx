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
  Lock,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'USER' | 'ADMIN';
  createdAt: string;
  canViewReports: boolean;
  canEditReports: boolean;
  canPrintReports: boolean;
  canDeleteReports: boolean;
  _count: { reports: number };
}

type PermissionFlags = {
  canViewReports: boolean;
  canEditReports: boolean;
  canPrintReports: boolean;
  canDeleteReports: boolean;
};

type EditForm = {
  name: string;
  email: string;
  role: 'USER' | 'ADMIN';
  password: string;
} & PermissionFlags;

/** A single permission row: label + description + on/off switch. */
function PermissionToggle({
  label,
  description,
  checked,
  disabled,
  onCheckedChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onCheckedChange: (v: boolean) => void;
}) {
  return (
    <div
      className={`flex items-center justify-between gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 ${
        disabled ? 'opacity-60' : ''
      }`}
    >
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-700">{label}</p>
        <p className="text-[11px] text-slate-400 truncate">{description}</p>
      </div>
      <Switch
        checked={checked}
        disabled={disabled}
        onCheckedChange={onCheckedChange}
      />
    </div>
  );
}

/** Compact read-only permission chips used in the users table. */
function PermissionChips({ user }: { user: AdminUser }) {
  if (user.role === 'ADMIN') {
    return (
      <span className="inline-flex items-center text-[11px] font-medium text-amber-700">
        <ShieldCheck className="h-3 w-3 mr-1" />
        Full access
      </span>
    );
  }
  const flags: { key: keyof PermissionFlags; label: string }[] = [
    { key: 'canViewReports', label: 'View' },
    { key: 'canEditReports', label: 'Edit' },
    { key: 'canPrintReports', label: 'Print' },
    { key: 'canDeleteReports', label: 'Delete' },
  ];
  return (
    <div className="flex flex-wrap gap-1">
      {flags.map((f) => {
        const on = user[f.key];
        return (
          <span
            key={f.key}
            className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border ${
              on
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-red-50 text-red-600 border-red-200'
            }`}
            title={on ? `Can ${f.label.toLowerCase()}` : `Cannot ${f.label.toLowerCase()}`}
          >
            {on ? f.label : <span className="line-through">{f.label}</span>}
          </span>
        );
      })}
    </div>
  );
}

export default function AdminUserManagement() {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);

  // Add-user dialog
  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState<{
    name: string;
    email: string;
    password: string;
    role: 'USER' | 'ADMIN';
  } & PermissionFlags>({
    name: '',
    email: '',
    password: '',
    role: 'USER',
    canViewReports: true,
    canEditReports: true,
    canPrintReports: true,
    canDeleteReports: true,
  });
  const [addSaving, setAddSaving] = useState(false);

  // Edit-user dialog
  const [editTarget, setEditTarget] = useState<AdminUser | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({
    name: '',
    email: '',
    role: 'USER',
    password: '',
    canViewReports: true,
    canEditReports: true,
    canPrintReports: true,
    canDeleteReports: true,
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
    setAddForm({
      name: '',
      email: '',
      password: '',
      role: 'USER',
      canViewReports: true,
      canEditReports: true,
      canPrintReports: true,
      canDeleteReports: true,
    });
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
      canViewReports: u.canViewReports,
      canEditReports: u.canEditReports,
      canPrintReports: u.canPrintReports,
      canDeleteReports: u.canDeleteReports,
    });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;
    setEditSaving(true);
    try {
      const payload: Record<string, string | boolean> = {
        name: editForm.name,
        email: editForm.email,
        role: editForm.role,
        canViewReports: editForm.canViewReports,
        canEditReports: editForm.canEditReports,
        canPrintReports: editForm.canPrintReports,
        canDeleteReports: editForm.canDeleteReports,
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
                  <TableHead className="w-[22%]">Name</TableHead>
                  <TableHead className="w-[22%]">Email</TableHead>
                  <TableHead className="w-[9%]">Role</TableHead>
                  <TableHead className="w-[27%]">Permissions</TableHead>
                  <TableHead className="w-[10%] text-right">Reports</TableHead>
                  <TableHead className="w-[10%] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10">
                      <Loader2 className="h-5 w-5 animate-spin mx-auto text-slate-400" />
                    </TableCell>
                  </TableRow>
                ) : users.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
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
                        <TableCell>
                          <PermissionChips user={u} />
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
            {/* Permissions */}
            <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50/60 p-3">
              <div className="flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5 text-slate-500" />
                <span className="text-sm font-medium text-slate-700">
                  Report Permissions
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                {addForm.role === 'ADMIN'
                  ? 'Administrators always have full access to all reports.'
                  : 'Control which actions this user can perform on accident reports. Disabled actions show "Administrator Approval Required".'}
              </p>
              <div className="grid grid-cols-2 gap-2">
                <PermissionToggle
                  label="View"
                  description="See & open reports"
                  checked={addForm.canViewReports}
                  disabled={addForm.role === 'ADMIN'}
                  onCheckedChange={(v) =>
                    setAddForm((f) => ({ ...f, canViewReports: v }))
                  }
                />
                <PermissionToggle
                  label="Edit"
                  description="Create & edit reports"
                  checked={addForm.canEditReports}
                  disabled={addForm.role === 'ADMIN'}
                  onCheckedChange={(v) =>
                    setAddForm((f) => ({ ...f, canEditReports: v }))
                  }
                />
                <PermissionToggle
                  label="Print"
                  description="Print reports"
                  checked={addForm.canPrintReports}
                  disabled={addForm.role === 'ADMIN'}
                  onCheckedChange={(v) =>
                    setAddForm((f) => ({ ...f, canPrintReports: v }))
                  }
                />
                <PermissionToggle
                  label="Delete"
                  description="Delete reports"
                  checked={addForm.canDeleteReports}
                  disabled={addForm.role === 'ADMIN'}
                  onCheckedChange={(v) =>
                    setAddForm((f) => ({ ...f, canDeleteReports: v }))
                  }
                />
              </div>
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
            {/* Permissions */}
            <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50/60 p-3">
              <div className="flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5 text-slate-500" />
                <span className="text-sm font-medium text-slate-700">
                  Report Permissions
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                {editForm.role === 'ADMIN'
                  ? 'Administrators always have full access to all reports.'
                  : 'Control which actions this user can perform on accident reports. Disabled actions show "Administrator Approval Required".'}
              </p>
              <div className="grid grid-cols-2 gap-2">
                <PermissionToggle
                  label="View"
                  description="See & open reports"
                  checked={editForm.canViewReports}
                  disabled={editForm.role === 'ADMIN'}
                  onCheckedChange={(v) =>
                    setEditForm((f) => ({ ...f, canViewReports: v }))
                  }
                />
                <PermissionToggle
                  label="Edit"
                  description="Create & edit reports"
                  checked={editForm.canEditReports}
                  disabled={editForm.role === 'ADMIN'}
                  onCheckedChange={(v) =>
                    setEditForm((f) => ({ ...f, canEditReports: v }))
                  }
                />
                <PermissionToggle
                  label="Print"
                  description="Print reports"
                  checked={editForm.canPrintReports}
                  disabled={editForm.role === 'ADMIN'}
                  onCheckedChange={(v) =>
                    setEditForm((f) => ({ ...f, canPrintReports: v }))
                  }
                />
                <PermissionToggle
                  label="Delete"
                  description="Delete reports"
                  checked={editForm.canDeleteReports}
                  disabled={editForm.role === 'ADMIN'}
                  onCheckedChange={(v) =>
                    setEditForm((f) => ({ ...f, canDeleteReports: v }))
                  }
                />
              </div>
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
