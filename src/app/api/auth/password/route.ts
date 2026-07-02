import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { getAuthUserFromRequest } from '@/lib/auth';

// PUT /api/auth/password — change the current user's password
// Requires the current password to be supplied and verified.
export async function PUT(request: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required.' },
        { status: 401 }
      );
    }

    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Both current and new passwords are required.' },
        { status: 400 }
      );
    }

    if (typeof newPassword !== 'string' || newPassword.length < 6) {
      return NextResponse.json(
        { error: 'New password must be at least 6 characters long.' },
        { status: 400 }
      );
    }

    // Fetch the stored hash
    const record = await db.user.findUnique({
      where: { id: user.id },
      select: { passwordHash: true },
    });
    if (!record) {
      return NextResponse.json(
        { error: 'Account not found.' },
        { status: 404 }
      );
    }

    // Verify the current password
    const valid = await bcrypt.compare(currentPassword, record.passwordHash);
    if (!valid) {
      return NextResponse.json(
        { error: 'Your current password is incorrect.' },
        { status: 403 }
      );
    }

    // Don't allow reusing the same password
    const sameAsOld = await bcrypt.compare(newPassword, record.passwordHash);
    if (sameAsOld) {
      return NextResponse.json(
        { error: 'New password must be different from your current password.' },
        { status: 400 }
      );
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await db.user.update({
      where: { id: user.id },
      data: { passwordHash: newHash },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Password change error:', error);
    return NextResponse.json(
      { error: 'Failed to change password. Please try again.' },
      { status: 500 }
    );
  }
}
