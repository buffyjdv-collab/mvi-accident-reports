import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  hashPassword,
  createSessionToken,
  setSessionCookie,
  ROLE,
} from '@/lib/auth';

// POST /api/auth/signup - Register a new user account
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password } = body as {
      name?: string;
      email?: string;
      password?: string;
    };

    // Validate input
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return NextResponse.json(
        { error: 'Name must be at least 2 characters long.' },
        { status: 400 }
      );
    }
    if (!email || typeof email !== 'string' || !/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json(
        { error: 'A valid email address is required.' },
        { status: 400 }
      );
    }
    if (
      !password ||
      typeof password !== 'string' ||
      password.length < 6
    ) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long.' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check if user already exists
    const existing = await db.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (existing) {
      return NextResponse.json(
        { error: 'An account with this email already exists. Please log in instead.' },
        { status: 409 }
      );
    }

    // First user becomes admin automatically; subsequent users are regular users
    const userCount = await db.user.count();
    const role = userCount === 0 ? ROLE.ADMIN : ROLE.USER;

    const passwordHash = await hashPassword(password);
    const user = await db.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        passwordHash,
        role,
      },
      select: { id: true, email: true, name: true, role: true },
    });

    const token = await createSessionToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });
    await setSessionCookie(token);

    return NextResponse.json(
      {
        message:
          role === ROLE.ADMIN
            ? 'Account created. You are the first user, so you have been granted Super Admin privileges.'
            : 'Account created successfully.',
        user,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Failed to create account. Please try again.' },
      { status: 500 }
    );
  }
}
