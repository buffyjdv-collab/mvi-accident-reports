import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { signToken, AUTH_COOKIE } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // ADMIN always gets full permissions; users get their stored flags.
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
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return res;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Login failed. Please try again.' },
      { status: 500 }
    );
  }
}
