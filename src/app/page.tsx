'use client';

import React, { useState } from 'react';
import { AccidentReport } from '@/lib/report-types';
import AccidentReportForm from '@/components/accident-report-form';
import AccidentRecordsTable from '@/components/accident-records-table';
import AccidentPrintView from '@/components/accident-print-view';
import ProfileSettings from '@/components/profile-settings';
import AdminUserManagement from '@/components/admin-user-management';
import { FileText, List, Printer, LogOut, Loader2, UserCircle, UserCog, Settings } from 'lucide-react';
import DatabaseStatus from '@/components/database-status';
import { useAuth } from '@/components/auth-provider';
import LoginScreen from '@/components/login-screen';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// Tab definitions. The Admin tab is conditionally shown to ADMIN users below.
const baseTabs = [
  { value: 'new-report', label: 'New Report', shortLabel: 'New', icon: FileText },
  { value: 'records', label: 'Records', shortLabel: 'Records', icon: List },
  { value: 'print-report', label: 'Print Report', shortLabel: 'Print', icon: Printer },
  { value: 'profile', label: 'Profile', shortLabel: 'Profile', icon: Settings },
] as const;

const adminTab = { value: 'admin', label: 'Admin', shortLabel: 'Admin', icon: UserCog } as const;

export default function Home() {
  const { user, loading, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('new-report');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [printReport, setPrintReport] = useState<AccidentReport | null>(null);
  const [editReport, setEditReport] = useState<AccidentReport | null>(null);

  const handleEditReport = (report: AccidentReport) => {
    setEditReport(report);
    setActiveTab('new-report');
  };

  const handleEditCancel = () => {
    setEditReport(null);
    setActiveTab('records');
  };

  const handleFormSubmitted = () => {
    setRefreshTrigger((prev) => prev + 1);
    setEditReport(null);
    setActiveTab('records');
  };

  const handlePrintReport = (report: AccidentReport) => {
    setPrintReport(report);
    setActiveTab('print-report');
  };

  const handleBackFromPrint = () => {
    setActiveTab('records');
  };

  // Auth gate: show loading spinner while session is being checked
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <Loader2 className="h-10 w-10 animate-spin text-slate-400" />
        <p className="mt-3 text-slate-500 text-sm">Loading...</p>
      </div>
    );
  }

  // Not logged in: show login screen
  if (!user) {
    return <LoginScreen />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Header */}
      <header className="bg-slate-800 text-white shadow-lg print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <img src="/logo.png?v=2" alt="Logo" className="h-10 w-10 object-contain rounded-lg" />
              <div>
                <h1 className="text-lg font-bold tracking-tight">
                  Accident Inspection Report
                </h1>
                <p className="text-xs text-slate-400">
                  Motor Vehicles Inspector — Report Management System
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* User badge */}
              <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-700/60">
                <UserCircle className="h-4 w-4 text-slate-300" />
                <div className="flex flex-col items-end leading-tight">
                  <span className="text-xs font-medium text-white">{user.name}</span>
                  <span className="text-[10px] text-slate-400">{user.email}</span>
                </div>
                {user.role === 'ADMIN' && (
                  <Badge className="bg-amber-500 text-amber-950 hover:bg-amber-500 text-[10px] px-1.5 py-0 h-4">
                    ADMIN
                  </Badge>
                )}
              </div>
              <DatabaseStatus />
              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                className="text-slate-300 hover:text-white hover:bg-slate-700"
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline ml-1.5">Sign Out</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-slate-200 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex gap-1 -mb-px overflow-x-auto" role="tablist">
            {[...baseTabs, ...(user.role === 'ADMIN' ? [adminTab] : [])].map((tab) => {
              const isActive = activeTab === tab.value;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.value}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveTab(tab.value)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    isActive
                      ? 'border-slate-800 text-slate-800'
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.shortLabel}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 print:p-0">
        <div className={activeTab === 'new-report' ? '' : 'hidden'}>
          <AccidentReportForm
            onSubmitted={handleFormSubmitted}
            editReport={editReport}
            onEditCancel={handleEditCancel}
          />
        </div>
        <div className={activeTab === 'records' ? '' : 'hidden'}>
          <AccidentRecordsTable
            refreshTrigger={refreshTrigger}
            onPrintReport={handlePrintReport}
            onEditReport={handleEditReport}
          />
        </div>
        <div className={activeTab === 'print-report' ? '' : 'hidden'}>
          <AccidentPrintView report={printReport} onBack={handleBackFromPrint} />
        </div>
        <div className={activeTab === 'profile' ? '' : 'hidden'}>
          <ProfileSettings />
        </div>
        {user.role === 'ADMIN' && (
          <div className={activeTab === 'admin' ? '' : 'hidden'}>
            <AdminUserManagement />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-800 text-slate-400 mt-auto print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
            <p>Motor Vehicles Inspector — Accident Inspection Report System</p>
            <div className="flex items-center gap-3">
              <p>Government of India — Transport Department</p>
              <span className="text-slate-500 text-[10px]">
                Build: {process.env.NEXT_PUBLIC_BUILD_TIME || 'dev'} · {process.env.NEXT_PUBLIC_GIT_SHA || 'local'}
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
