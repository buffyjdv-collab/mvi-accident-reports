'use client';

import React, { useState } from 'react';
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
import { Loader2, Save, KeyRound, UserCircle, ShieldCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function ProfileSettings() {
  const { user, updateProfile, changePassword } = useAuth();
  const { toast } = useToast();

  // Profile form state
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileDirty, setProfileDirty] = useState(false);

  // Password form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwSaving, setPwSaving] = useState(false);

  const handleProfileChange = (nextName: string, nextEmail: string) => {
    setName(nextName);
    setEmail(nextEmail);
    setProfileDirty(
      nextName !== (user?.name ?? '') || nextEmail !== (user?.email ?? '')
    );
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    try {
      await updateProfile(name, email);
      setProfileDirty(false);
      toast({
        title: 'Profile updated',
        description: 'Your name and email have been saved.',
      });
    } catch (err) {
      toast({
        title: 'Could not update profile',
        description: err instanceof Error ? err.message : 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setProfileSaving(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast({
        title: 'Passwords do not match',
        description: 'New password and confirmation must be identical.',
        variant: 'destructive',
      });
      return;
    }
    if (newPassword.length < 6) {
      toast({
        title: 'Password too short',
        description: 'New password must be at least 6 characters long.',
        variant: 'destructive',
      });
      return;
    }
    setPwSaving(true);
    try {
      await changePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast({
        title: 'Password changed',
        description: 'Use your new password the next time you sign in.',
      });
    } catch (err) {
      toast({
        title: 'Could not change password',
        description: err instanceof Error ? err.message : 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setPwSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
          <UserCircle className="h-6 w-6 text-slate-600" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-slate-900">My Profile</h2>
          <p className="text-sm text-slate-500">
            Manage your account information and password.
          </p>
        </div>
      </div>

      {/* Account info card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-800 text-white text-lg font-semibold">
                {(user?.name ?? '?').charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-slate-900">{user?.name}</p>
                <p className="text-sm text-slate-500">{user?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                className={
                  user?.role === 'ADMIN'
                    ? 'bg-amber-500 text-amber-950 hover:bg-amber-500'
                    : 'bg-slate-200 text-slate-700 hover:bg-slate-200'
                }
              >
                {user?.role === 'ADMIN' ? (
                  <ShieldCheck className="h-3 w-3 mr-1" />
                ) : null}
                {user?.role}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Account Details</CardTitle>
          <CardDescription>
            Update your full name and email address.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="profile-name">Full Name</Label>
              <Input
                id="profile-name"
                type="text"
                value={name}
                onChange={(e) =>
                  handleProfileChange(e.target.value, email)
                }
                placeholder="Your full name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile-email">Email Address</Label>
              <Input
                id="profile-email"
                type="email"
                value={email}
                onChange={(e) =>
                  handleProfileChange(name, e.target.value)
                }
                placeholder="you@example.com"
                required
              />
            </div>
            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={profileSaving || !profileDirty}
              >
                {profileSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Password change form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-slate-600" />
            Change Password
          </CardTitle>
          <CardDescription>
            Enter your current password to set a new one.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-pw">Current Password</Label>
              <Input
                id="current-pw"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="new-pw">New Password</Label>
                <Input
                  id="new-pw"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  required
                  autoComplete="new-password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-pw">Confirm New Password</Label>
                <Input
                  id="confirm-pw"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  required
                  autoComplete="new-password"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={
                  pwSaving ||
                  !currentPassword ||
                  !newPassword ||
                  !confirmPassword
                }
              >
                {pwSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <KeyRound className="h-4 w-4 mr-2" />
                    Update Password
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
