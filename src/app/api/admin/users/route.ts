import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { getAuthUserFromRequest, signToken, AUTH_COOKIE } from '@/lib/auth';

// GET /api/admin/users — list all users (ADMIN only)
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required.' },
        { status: 401 }
      );
    }
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden. Administrator access required.' },
        { status: 403 }
      );
    }

    const users = await db.user.findMany({
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        canViewReports: true,
        canEditReports: true,
        canPrintReports: true,
        canDeleteReports: true,
        _count: { select: { reports: true } },
      },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error('Admin list users error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users.' },
      { status: 500 }
    );
  }
}

// POST /api/admin/users — create a new user (ADMIN only)
export async function POST(request: NextRequest) {
  try {
    const admin = await getAuthUserFromRequest(request);
    if (!admin) {
      return NextResponse.json(
        { error: 'Authentication required.' },
        { status: 401 }
      );
    }
    if (admin.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden. Administrator access required.' },
        { status: 403 }
      );
    }

    const {
      name,
      email,
      password,
      role,
      canViewReports,
      canEditReports,
      canPrintReports,
      canDeleteReports,
    } = await request.json();

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Name is required.' }, { status: 400 });
    }
    if (!email || !email.trim()) {
      return NextResponse.json({ error: 'Email is required.' }, { status: 400 });
    }
    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long.' },
        { status: 400 }
      );
    }
    const finalRole = role === 'ADMIN' ? 'ADMIN' : 'USER';

    const normalizedEmail = email.toLowerCase().trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address.' },
        { status: 400 }
      );
    }

    const existing = await db.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    });
    if (existing) {
      return NextResponse.json(
        { error: 'An account with this email already exists.' },
        { status: 409 }
      );
    }

    // Parse permission flags from the request body. A flag is `true` unless
    // the client explicitly sent `false`. ADMINs always have full access, so
    // the stored flags are forced to `true` for admins regardless of input.
    const parseFlag = (v: unknown): boolean => v !== false;
    const permFlags = {
      canViewReports: finalRole === 'ADMIN' ? true : parseFlag(canViewReports),
      canEditReports: finalRole === 'ADMIN' ? true : parseFlag(canEditReports),
      canPrintReports: finalRole === 'ADMIN' ? true : parseFlag(canPrintReports),
      canDeleteReports: finalRole === 'ADMIN' ? true : parseFlag(canDeleteReports),
    };

    const passwordHash = await bcrypt.hash(password, 10);
    const created = await db.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        passwordHash,
        role: finalRole,
        ...permFlags,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        canViewReports: true,
        canEditReports: true,
        canPrintReports: true,
        canDeleteReports: true,
        _count: { select: { reports: true } },
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('Admin create user error:', error);
    return NextResponse.json(
      { error: 'Failed to create user.' },
      { status: 500 }
    );
  }
}
