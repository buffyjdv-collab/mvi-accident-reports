'use client';

import React, { useState } from 'react';
import { useAuth } from '@/components/auth-provider';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { LogOut, User as UserIcon, ShieldCheck, ChevronDown } from 'lucide-react';
import AuthDialog from '@/components/auth-dialog';
import { useToast } from '@/hooks/use-toast';

export default function UserMenu() {
  const { user, loading, logout, isAdmin } = useAuth();
  const { toast } = useToast();
  const [authOpen, setAuthOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      toast({ title: 'Logged out', description: 'You have been signed out.' });
    } finally {
      setLoggingOut(false);
    }
  };

  if (loading) {
    return (
      <div className="h-8 w-8 rounded-full bg-slate-700 animate-pulse" />
    );
  }

  if (!user) {
    return (
      <>
        <Button
          onClick={() => setAuthOpen(true)}
          size="sm"
          className="bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          <UserIcon className="h-4 w-4 mr-1.5" />
          <span className="hidden sm:inline">Log In</span>
          <span className="sm:hidden">Login</span>
        </Button>
        <AuthDialog open={authOpen} onOpenChange={setAuthOpen} />
      </>
    );
  }

  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2 rounded-full pl-1 pr-2 py-1 hover:bg-slate-700 transition-colors">
            <Avatar className="h-7 w-7 border border-slate-600">
              <AvatarFallback className="bg-emerald-600 text-white text-xs font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <span className="hidden sm:block text-sm font-medium text-white max-w-[120px] truncate">
              {user.name}
            </span>
            {isAdmin && (
              <Badge className="bg-amber-500 hover:bg-amber-500 text-amber-950 text-[10px] px-1.5 py-0 h-5">
                ADMIN
              </Badge>
            )}
            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel className="flex flex-col gap-1">
            <span className="font-medium">{user.name}</span>
            <span className="text-xs font-normal text-slate-500">
              {user.email}
            </span>
            <span className="mt-1">
              {isAdmin ? (
                <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">
                  <ShieldCheck className="h-3 w-3 mr-1" />
                  Super Admin
                </Badge>
              ) : (
                <Badge variant="secondary" className="bg-slate-100 text-slate-600 hover:bg-slate-100">
                  <UserIcon className="h-3 w-3 mr-1" />
                  Inspector
                </Badge>
              )}
            </span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={handleLogout}
            disabled={loggingOut}
            className="text-red-600 focus:text-red-600 focus:bg-red-50"
          >
            <LogOut className="h-4 w-4 mr-2" />
            {loggingOut ? 'Logging out...' : 'Log Out'}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
