'use client';

import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle2, Database, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface DbCheck {
  status: string;
  detail?: string;
}

interface HealthResponse {
  status: 'healthy' | 'unhealthy';
  checks: Record<string, DbCheck>;
  steps_to_fix?: string[];
}

export default function DatabaseStatus() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSetup, setShowSetup] = useState(false);

  const checkHealth = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api');
      const data: HealthResponse = await res.json();
      setHealth(data);
    } catch {
      setHealth({ status: 'unhealthy', checks: { api: { status: 'ERROR', detail: 'API not reachable' } } });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  const isHealthy = health?.status === 'healthy';

  return (
    <>
      {/* Status Indicator in Header */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => isHealthy ? checkHealth() : setShowSetup(true)}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer"
          title={isHealthy ? 'Database connected' : 'Database error — click for help'}
        >
          {loading ? (
            <RefreshCw className="h-3.5 w-3.5 animate-spin text-slate-400" />
          ) : isHealthy ? (
            <>
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-emerald-400 hidden sm:inline">DB Connected</span>
            </>
          ) : (
            <>
              <AlertCircle className="h-3.5 w-3.5 text-amber-400" />
              <span className="text-amber-400 hidden sm:inline">DB Error</span>
            </>
          )}
        </button>
      </div>

      {/* Setup Dialog */}
      <Dialog open={showSetup} onOpenChange={setShowSetup}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-slate-600" />
              Database Setup Required
            </DialogTitle>
            <DialogDescription>
              Your app cannot save or load reports because the database is not connected. Follow these steps to fix it.
            </DialogDescription>
          </DialogHeader>

          {/* Current Status */}
          <div className="space-y-2 my-4">
            <h3 className="font-semibold text-sm text-slate-700">Current Status:</h3>
            {health && Object.entries(health.checks).map(([key, check]) => (
              <div
                key={key}
                className={`flex items-start gap-2 p-3 rounded-lg text-sm ${
                  check.status === 'ok' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                }`}
              >
                {check.status === 'ok' ? (
                  <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
                ) : (
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                )}
                <div>
                  <span className="font-medium capitalize">{key}:</span>{' '}
                  {check.detail || check.status}
                </div>
              </div>
            ))}
          </div>

          {/* Fix Steps */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-slate-700">How to Fix:</h3>

            <div className="border border-slate-200 rounded-lg p-4 space-y-3">
              <div className="flex gap-3">
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-slate-800 text-white text-sm font-bold shrink-0">1</span>
                <div>
                  <p className="font-medium text-slate-800">Create a free PostgreSQL database</p>
                  <p className="text-sm text-slate-500 mt-1">
                    Go to{' '}
                    <a href="https://neon.tech" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                      neon.tech
                    </a>{' '}
                    → Sign up with GitHub → Click &quot;New Project&quot; → Name it &quot;accident-reports&quot;
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-slate-800 text-white text-sm font-bold shrink-0">2</span>
                <div>
                  <p className="font-medium text-slate-800">Copy the connection string</p>
                  <p className="text-sm text-slate-500 mt-1">
                    In your Neon project dashboard → Click &quot;Dashboard&quot; → Copy the connection string. It looks like:
                  </p>
                  <code className="block mt-2 p-2 bg-slate-100 rounded text-xs text-slate-700 break-all">
                    postgresql://neondb_owner:AbCdEfG123@ep-cool-name-12345.us-east-2.aws.neon.tech/neondb?sslmode=require
                  </code>
                </div>
              </div>

              <div className="flex gap-3">
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-slate-800 text-white text-sm font-bold shrink-0">3</span>
                <div>
                  <p className="font-medium text-slate-800">Set DATABASE_URL in Vercel</p>
                  <p className="text-sm text-slate-500 mt-1">
                    Vercel Dashboard → Your Project → Settings → Environment Variables → Add:
                  </p>
                  <div className="mt-2 space-y-1">
                    <div className="flex gap-2 items-center">
                      <code className="p-1.5 bg-slate-100 rounded text-xs font-mono">DATABASE_URL</code>
                      <span className="text-xs text-slate-500">=</span>
                      <code className="p-1.5 bg-slate-100 rounded text-xs font-mono break-all">your-connection-string</code>
                    </div>
                  </div>
                  <p className="text-xs text-amber-600 mt-2 font-medium">
                    ⚠️ Make sure to check all environments: Production ✅ Preview ✅ Development ✅
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-slate-800 text-white text-sm font-bold shrink-0">4</span>
                <div>
                  <p className="font-medium text-slate-800">Create database tables</p>
                  <p className="text-sm text-slate-500 mt-1">
                    Run this command on your local machine (replace with your real Neon URL):
                  </p>
                  <code className="block mt-2 p-2 bg-slate-100 rounded text-xs text-slate-700 break-all">
                    DATABASE_URL=&quot;postgresql://neondb_owner:password@ep-xxx.neon.tech/neondb?sslmode=require&quot; npx prisma db push
                  </code>
                  <p className="text-xs text-emerald-600 mt-1 font-medium">
                    You should see: &quot;🚀 Your database is now in sync with your Prisma schema&quot;
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-slate-800 text-white text-sm font-bold shrink-0">5</span>
                <div>
                  <p className="font-medium text-slate-800">Redeploy on Vercel</p>
                  <p className="text-sm text-slate-500 mt-1">
                    Go to Vercel → Deployments → Click &quot;Redeploy&quot; on the latest deployment
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <Button onClick={checkHealth} variant="outline" className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Re-check Database
            </Button>
            <Button onClick={() => setShowSetup(false)} className="bg-slate-800 hover:bg-slate-700">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
