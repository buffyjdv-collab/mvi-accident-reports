import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

const ENV_PATH = resolve(process.cwd(), '.env');

function updateEnvFile(updates: Record<string, string>) {
  let envContent: string;
  try {
    envContent = readFileSync(ENV_PATH, 'utf-8');
  } catch {
    envContent = '';
  }

  for (const [key, value] of Object.entries(updates)) {
    const regex = new RegExp(`^${key}=.*$`, 'm');
    if (regex.test(envContent)) {
      envContent = envContent.replace(regex, `${key}=${value}`);
    } else {
      envContent += `\n${key}=${value}`;
    }
    // Also update process.env for current session
    process.env[key] = value;
  }

  writeFileSync(ENV_PATH, envContent.trim() + '\n', 'utf-8');
}

// GET /api/settings - Retrieve all settings
export async function GET() {
  try {
    const settings = await db.appSetting.findMany();
    const settingsMap: Record<string, string> = {};
    for (const s of settings) {
      settingsMap[s.key] = s.value;
    }
    // Also check env vars as fallback
    if (!settingsMap.googleClientId && process.env.GOOGLE_CLIENT_ID) {
      settingsMap.googleClientId = process.env.GOOGLE_CLIENT_ID;
    }
    if (!settingsMap.googleClientSecret && process.env.GOOGLE_CLIENT_SECRET) {
      settingsMap.googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
    }
    if (!settingsMap.nextauthUrl && process.env.NEXTAUTH_URL) {
      settingsMap.nextauthUrl = process.env.NEXTAUTH_URL;
    }
    return NextResponse.json(settingsMap);
  } catch (error) {
    console.error('Error fetching settings:', error);
    // Fallback to env vars
    return NextResponse.json({
      googleClientId: process.env.GOOGLE_CLIENT_ID || '',
      googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      nextauthUrl: process.env.NEXTAUTH_URL || '',
    });
  }
}

// PUT /api/settings - Save settings (writes to .env file AND database)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { googleClientId, googleClientSecret, nextauthUrl } = body as {
      googleClientId?: string;
      googleClientSecret?: string;
      nextauthUrl?: string;
    };

    // Write to .env file so NextAuth picks it up on restart
    const envUpdates: Record<string, string> = {};
    if (googleClientId !== undefined) envUpdates.GOOGLE_CLIENT_ID = googleClientId;
    if (googleClientSecret !== undefined) envUpdates.GOOGLE_CLIENT_SECRET = googleClientSecret;
    if (nextauthUrl !== undefined) envUpdates.NEXTAUTH_URL = nextauthUrl;

    if (Object.keys(envUpdates).length > 0) {
      try {
        updateEnvFile(envUpdates);
      } catch (e) {
        console.error('Error updating .env file:', e);
      }
    }

    // Also save to database for reading in settings UI
    const updates: Promise<unknown>[] = [];

    if (googleClientId !== undefined) {
      updates.push(
        db.appSetting.upsert({
          where: { key: 'googleClientId' },
          update: { value: googleClientId },
          create: { key: 'googleClientId', value: googleClientId },
        })
      );
    }

    if (googleClientSecret !== undefined) {
      updates.push(
        db.appSetting.upsert({
          where: { key: 'googleClientSecret' },
          update: { value: googleClientSecret },
          create: { key: 'googleClientSecret', value: googleClientSecret },
        })
      );
    }

    if (nextauthUrl !== undefined) {
      updates.push(
        db.appSetting.upsert({
          where: { key: 'nextauthUrl' },
          update: { value: nextauthUrl },
          create: { key: 'nextauthUrl', value: nextauthUrl },
        })
      );
    }

    await Promise.all(updates);

    const needsRestart = Object.keys(envUpdates).length > 0;

    return NextResponse.json({
      success: true,
      message: needsRestart
        ? 'Settings saved. Please restart the server for Google OAuth changes to take effect.'
        : 'Settings saved successfully.',
      needsRestart,
    });
  } catch (error) {
    console.error('Error saving settings:', error);
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
  }
}

// DELETE /api/settings - Clear Google credentials
export async function DELETE() {
  try {
    // Clear from .env
    try {
      updateEnvFile({
        GOOGLE_CLIENT_ID: '',
        GOOGLE_CLIENT_SECRET: '',
      });
    } catch (e) {
      console.error('Error clearing .env:', e);
    }

    // Clear from database
    await db.appSetting.deleteMany({
      where: {
        key: { in: ['googleClientId', 'googleClientSecret'] },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Google credentials cleared. Please restart the server.',
      needsRestart: true,
    });
  } catch (error) {
    console.error('Error clearing settings:', error);
    return NextResponse.json({ error: 'Failed to clear settings' }, { status: 500 });
  }
}
