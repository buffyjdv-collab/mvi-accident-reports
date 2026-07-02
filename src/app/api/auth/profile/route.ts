import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { getAuthUserFromRequest, signToken, AUTH_COOKIE } from '@/lib/auth';

// PUT /api/auth/profile — update the current user's name and email
export async function PUT(request: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required.' },
        { status: 401 }
      );
    }

    const { name, email } = await request.json();

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json(
        { error: 'Name is required.' },
        { status: 400 }
      );
    }
    if (!email || typeof email !== 'string' || !email.trim()) {
      return NextResponse.json(
        { error: 'Email is required.' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const trimmedName = name.trim();

    // Basic email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address.' },
        { status: 400 }
      );
    }

    // Check email uniqueness (exclude the current user)
    const conflict = await db.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    });
    if (conflict && conflict.id !== user.id) {
      return NextResponse.json(
        { error: 'Another account already uses this email.' },
        { status: 409 }
      );
    }

    const updated = await db.user.update({
      where: { id: user.id },
      data: { name: trimmedName, email: normalizedEmail },
      select: { id: true, name: true, email: true, role: true },
    });

    // Re-sign the JWT so name/email in the token stay fresh
    const token = await signToken({
      sub: updated.id,
      email: updated.email,
      name: updated.name,
      role: updated.role,
    });

    const res = NextResponse.json(updated);
    res.cookies.set(AUTH_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });
    return res;
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      { error: 'Failed to update profile. Please try again.' },
      { status: 500 }
    );
  }
}
