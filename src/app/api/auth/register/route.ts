import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { signToken, AUTH_COOKIE } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email, and password are all required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    const existing = await db.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (existing) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      );
    }

    // First user becomes admin
    const userCount = await db.user.count();
    const role = userCount === 0 ? 'ADMIN' : 'USER';

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await db.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        passwordHash,
        role,
      },
    });

    // New self-registered users start with full permissions; ADMIN always
    // has full access regardless of stored flags.
    const isAdmin = user.role === 'ADMIN';
    const perms = {
      canViewReports: isAdmin ? true : user.canViewReports,
      canEditReports: isAdmin ? true : user.canEditReports,
      canPrintReports: isAdmin ? true : user.canPrintReports,
      canDeleteReports: isAdmin ? true : user.canDeleteReports,
    };

    const token = await signToken({
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      ...perms,
    });

    const res = NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      ...perms,
    });

    res.cookies.set(AUTH_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return res;
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json(
      { error: 'Registration failed. Please try again.' },
      { status: 500 }
    );
  }
}
