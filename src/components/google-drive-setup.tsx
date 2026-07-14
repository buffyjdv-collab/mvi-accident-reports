'use client';

import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Cloud,
  Settings,
  CheckCircle2,
  Circle,
  ExternalLink,
  Copy,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  Save,
  AlertTriangle,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface GoogleDriveSetupProps {
  onConfigured?: () => void;
}

export default function GoogleDriveSetup({ onConfigured }: GoogleDriveSetupProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [nextauthUrl, setNextauthUrl] = useState('');
  const [showSecret, setShowSecret] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        if (data.googleClientId) setClientId(data.googleClientId);
        if (data.googleClientSecret) setClientSecret(data.googleClientSecret);
        if (data.nextauthUrl) setNextauthUrl(data.nextauthUrl);
        if (data.googleClientId && data.googleClientSecret) {
          setIsConfigured(true);
        }
      }
      // Always use the current browser origin as the NextAuth URL
      if (typeof window !== 'undefined') {
        const baseUrl = window.location.origin;
        setNextauthUrl(baseUrl);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!clientId.trim() || !clientSecret.trim()) {
      toast({
        title: 'Missing Fields',
        description: 'Please enter both Google Client ID and Client Secret.',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          googleClientId: clientId.trim(),
          googleClientSecret: clientSecret.trim(),
          nextauthUrl: nextauthUrl.trim() || undefined,
        }),
      });

      if (!res.ok) throw new Error('Failed to save settings');

      const data = await res.json();
      setIsConfigured(true);
      toast({
        title: 'Google Drive Configured',
        description: data.needsRestart
          ? 'Credentials saved! The server needs a moment to pick up the changes. You can now sign in with Google.'
          : 'You can now sign in with Google and save reports to Drive.',
      });

      if (onConfigured) onConfigured();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save settings',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleClear = async () => {
    try {
      await fetch('/api/settings', { method: 'DELETE' });
      setClientId('');
      setClientSecret('');
      setIsConfigured(false);
      setCurrentStep(1);
      toast({ title: 'Google Credentials Cleared' });
    } catch {
      toast({ title: 'Error clearing credentials', variant: 'destructive' });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied to clipboard' });
  };

  const callbackUrl = `${nextauthUrl || 'https://your-domain.com'}/api/auth/callback/google`;

  const steps = [
    {
      number: 1,
      title: 'Go to Google Cloud Console',
      description: 'Create a new project or select an existing one.',
      action: (
        <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-slate-700 underline hover:text-slate-900">
          Open Google Cloud Console <ExternalLink className="h-3 w-3" />
        </a>
      ),
    },
    {
      number: 2,
      title: 'Enable Google Drive API & Google Sheets API',
      description: 'Go to APIs & Services > Library. Enable both "Google Drive API" and "Google Sheets API".',
      action: (
        <div className="flex flex-col gap-1">
          <a href="https://console.cloud.google.com/apis/library/drive.googleapis.com" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-slate-700 underline hover:text-slate-900">
            Open Drive API <ExternalLink className="h-3 w-3" />
          </a>
          <a href="https://console.cloud.google.com/apis/library/sheets.googleapis.com" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-slate-700 underline hover:text-slate-900">
            Open Sheets API <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      ),
    },
    {
      number: 3,
      title: 'Configure OAuth Consent Screen',
      description: 'Go to APIs & Services > OAuth consent screen. Choose "External", add your email as test user. IMPORTANT: Add these scopes manually:',
      action: (
        <div className="mt-1 space-y-1">
          <a href="https://console.cloud.google.com/apis/credentials/consent" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-slate-700 underline hover:text-slate-900">
            Open Consent Screen <ExternalLink className="h-3 w-3" />
          </a>
          <div className="space-y-0.5 ml-1">
            <div className="flex items-center gap-1">
              <code className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded">https://www.googleapis.com/auth/drive.file</code>
              <Button variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={() => copyToClipboard('https://www.googleapis.com/auth/drive.file')}>
                <Copy className="h-2.5 w-2.5" />
              </Button>
            </div>
            <div className="flex items-center gap-1">
              <code className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded">https://www.googleapis.com/auth/spreadsheets</code>
              <Button variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={() => copyToClipboard('https://www.googleapis.com/auth/spreadsheets')}>
                <Copy className="h-2.5 w-2.5" />
              </Button>
            </div>
          </div>
        </div>
      ),
    },
    {
      number: 4,
      title: 'Create OAuth 2.0 Credentials',
      description: 'Go to APIs & Services > Credentials > Create Credentials > OAuth 2.0 Client ID. Select "Web application".',
      action: (
        <a href="https://console.cloud.google.com/apis/credentials/oauthclient" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-slate-700 underline hover:text-slate-900">
          Open Credentials Page <ExternalLink className="h-3 w-3" />
        </a>
      ),
    },
    {
      number: 5,
      title: '⚠️ Add Authorized Redirect URI (CRITICAL)',
      description: 'In the OAuth client settings under "Authorized redirect URIs", add this EXACT URL. If this doesn\'t match, sign-in will fail:',
      action: (
        <div className="mt-2 space-y-2">
          <div className="flex items-center gap-2">
            <code className="text-xs bg-amber-50 border border-amber-300 text-amber-900 px-2 py-1.5 rounded font-mono break-all flex-1 select-all">
              {callbackUrl}
            </code>
            <Button variant="outline" size="sm" className="shrink-0 h-8 border-amber-400" onClick={() => copyToClipboard(callbackUrl)}>
              <Copy className="h-3.5 w-3.5 mr-1" />
              Copy
            </Button>
          </div>
          <p className="text-[10px] text-red-600 font-medium">
            ⚠️ This URL must be added EXACTLY as shown. Sign-in will NOT work without it!
          </p>
        </div>
      ),
    },
    {
      number: 6,
      title: 'Copy Credentials Below',
      description: 'Copy the Client ID and Client Secret from the OAuth 2.0 credentials page and paste them below.',
      action: null,
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        Checking Drive status...
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant={isConfigured ? 'ghost' : 'outline'}
          size="sm"
          className={isConfigured
            ? 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50'
            : 'border-amber-300 text-amber-700 hover:bg-amber-50'}
        >
          {isConfigured ? (
            <>
              <Cloud className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Drive Connected</span>
            </>
          ) : (
            <>
              <Settings className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Setup Google Drive</span>
              <span className="sm:hidden">Setup</span>
            </>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-slate-800">
            <Cloud className="h-5 w-5" />
            Google Drive & Sheets Setup
          </DialogTitle>
          <DialogDescription className="text-slate-500">
            Configure Google credentials to save reports to Google Drive and Google Sheets.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Status Banner */}
          {isConfigured ? (
            <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-emerald-800">Google Drive & Sheets configured</p>
                <p className="text-xs text-emerald-600">Sign in with Google to save reports to Drive and Sheets.</p>
              </div>
              <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={handleClear}>
                Disconnect
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
              <p className="text-sm text-amber-800">
                Google Drive is not configured. Follow the steps below to set it up.
              </p>
            </div>
          )}

          {/* Setup Steps */}
          <div className="space-y-3">
            <h3 className="font-semibold text-slate-700 text-sm">Setup Guide</h3>
            {steps.map((step) => (
              <div key={step.number} className={`flex gap-3 ${step.number === 5 ? 'p-2 -mx-2 bg-amber-50/50 rounded-lg border border-amber-200' : ''}`}>
                <div className="shrink-0 mt-0.5">
                  {currentStep > step.number ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  ) : currentStep === step.number ? (
                    <Circle className="h-5 w-5 text-slate-800 fill-slate-800" />
                  ) : (
                    <Circle className="h-5 w-5 text-slate-300" />
                  )}
                </div>
                <div className="flex-1">
                  <p className={`text-sm font-medium ${step.number === 5 ? 'text-amber-800' : 'text-slate-700'}`}>
                    Step {step.number}: {step.title}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">{step.description}</p>
                  {step.action && <div className="mt-1.5">{step.action}</div>}
                </div>
              </div>
            ))}
          </div>

          {/* Credential Input */}
          <div className="border-t border-slate-200 pt-4 space-y-3">
            <h3 className="font-semibold text-slate-700 text-sm">Enter Your Credentials</h3>

            <div className="space-y-2">
              <Label htmlFor="nextauthUrl" className="text-xs text-slate-600">
                Application URL (for redirect URI)
              </Label>
              <Input
                id="nextauthUrl"
                value={nextauthUrl}
                onChange={(e) => setNextauthUrl(e.target.value)}
                placeholder="https://your-domain.com"
                className="text-sm"
              />
              <p className="text-xs text-slate-400">
                Your redirect URI: <code className="text-slate-600 font-medium">{nextauthUrl}/api/auth/callback/google</code>
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="clientId" className="text-xs text-slate-600">
                Google Client ID
              </Label>
              <Input
                id="clientId"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                placeholder="123456789-abc.apps.googleusercontent.com"
                className="text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="clientSecret" className="text-xs text-slate-600">
                Google Client Secret
              </Label>
              <div className="relative">
                <Input
                  id="clientSecret"
                  type={showSecret ? 'text' : 'password'}
                  value={clientSecret}
                  onChange={(e) => setClientSecret(e.target.value)}
                  placeholder="GOCSPX-xxxxxxxxxxxx"
                  className="text-sm pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                  onClick={() => setShowSecret(!showSecret)}
                >
                  {showSecret ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </Button>
              </div>
            </div>

            <Button
              onClick={handleSave}
              disabled={saving || !clientId.trim() || !clientSecret.trim()}
              className="w-full bg-slate-800 hover:bg-slate-700 text-white"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Google Credentials
                </>
              )}
            </Button>

            {/* Important note about re-signing in */}
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-xs font-semibold text-red-800 mb-1">⚠️ CRITICAL: Enable Google Sheets API & Re-sign In</p>
              <ol className="text-xs text-red-700 space-y-1 list-decimal list-inside">
                <li>Make sure <strong>Google Sheets API</strong> is enabled in your Google Cloud Console (Step 2 above)</li>
                <li>Make sure <strong>Google Drive API</strong> is also enabled</li>
                <li><strong>Sign out</strong> from this app (click Sign Out button)</li>
                <li><strong>Sign in again</strong> — Google will ask for new permissions including Sheets access</li>
                <li>When the consent screen appears, <strong>allow ALL permissions</strong> (Drive + Sheets)</li>
                <li>If &quot;permission denied&quot; error persists, sign out and sign in again</li>
              </ol>
            </div>
          </div>

          {/* Troubleshooting section */}
          <div className="border-t border-slate-200 pt-4 space-y-2">
            <h3 className="font-semibold text-slate-700 text-sm flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Troubleshooting Sign-In Issues
            </h3>
            <div className="text-xs text-slate-600 space-y-2">
              <p><strong>If &quot;Sign in with Google&quot; fails:</strong></p>
              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li>Check that the <strong>Authorized redirect URI</strong> in Google Cloud Console matches exactly:<br />
                  <code className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded select-all">{callbackUrl}</code>
                </li>
                <li>Make sure <strong>Google Drive API</strong> and <strong>Google Sheets API</strong> are both enabled in your Google Cloud project</li>
                <li>Check that your email is added as a <strong>test user</strong> on the OAuth consent screen</li>
                <li>Verify the <strong>Client ID</strong> and <strong>Client Secret</strong> are correct (no extra spaces)</li>
                <li>Try signing out completely, then sign in again</li>
                <li>Clear your browser cookies for this site, then try again</li>
              </ol>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
