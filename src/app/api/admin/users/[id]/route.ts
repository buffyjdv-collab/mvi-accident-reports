import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { getAuthUserFromRequest } from '@/lib/auth';

type Params = { params: Promise<{ id: string }> };

// PUT /api/admin/users/[id] — update a user's name, email, role, or password
export async function PUT(request: NextRequest, { params }: Params) {
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

    const { id } = await params;
    if (id === admin.id) {
      return NextResponse.json(
        { error: 'Use the Profile page to edit your own account.' },
        { status: 400 }
      );
    }

    const target = await db.user.findUnique({
      where: { id },
      select: { id: true, role: true },
    });
    if (!target) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    const body = await request.json();
    const data: {
      name?: string;
      email?: string;
      role?: string;
      passwordHash?: string;
    } = {};

    if (typeof body.name === 'string' && body.name.trim()) {
      data.name = body.name.trim();
    }

    if (typeof body.email === 'string' && body.email.trim()) {
      const normalizedEmail = body.email.toLowerCase().trim();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(normalizedEmail)) {
        return NextResponse.json(
          { error: 'Please enter a valid email address.' },
          { status: 400 }
        );
      }
      const conflict = await db.user.findUnique({
        where: { email: normalizedEmail },
        select: { id: true },
      });
      if (conflict && conflict.id !== id) {
        return NextResponse.json(
          { error: 'Another account already uses this email.' },
          { status: 409 }
        );
      }
      data.email = normalizedEmail;
    }

    if (typeof body.role === 'string') {
      if (body.role !== 'ADMIN' && body.role !== 'USER') {
        return NextResponse.json(
          { error: 'Role must be either USER or ADMIN.' },
          { status: 400 }
        );
      }
      // Prevent the last admin from demoting themselves (guardrail)
      if (target.role === 'ADMIN' && body.role === 'USER') {
        const adminCount = await db.user.count({ where: { role: 'ADMIN' } });
        if (adminCount <= 1) {
          return NextResponse.json(
            { error: 'Cannot demote the last remaining administrator.' },
            { status: 400 }
          );
        }
      }
      data.role = body.role;
    }

    if (typeof body.password === 'string' && body.password.length > 0) {
      if (body.password.length < 6) {
        return NextResponse.json(
          { error: 'Password must be at least 6 characters long.' },
          { status: 400 }
        );
      }
      data.passwordHash = await bcrypt.hash(body.password, 10);
    }

    const updated = await db.user.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        _count: { select: { reports: true } },
      },
    });
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Admin update user error:', error);
    return NextResponse.json(
      { error: 'Failed to update user.' },
      { status: 500 }
  );
  }
}

// DELETE /api/admin/users/[id] — delete a user (not self, not last admin)
export async function DELETE(request: NextRequest, { params }: Params) {
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

    const { id } = await params;
    if (id === admin.id) {
      return NextResponse.json(
        { error: 'You cannot delete your own account.' },
        { status: 400 }
      );
    }

    const target = await db.user.findUnique({
      where: { id },
      select: { id: true, role: true },
    });
    if (!target) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    if (target.role === 'ADMIN') {
      const adminCount = await db.user.count({ where: { role: 'ADMIN' } });
      if (adminCount <= 1) {
        return NextResponse.json(
          { error: 'Cannot delete the last remaining administrator.' },
          { status: 400 }
        );
      }
    }

    // Reports authored by this user keep their userId but the relation
    // is SetNull on delete (per schema), so they become unowned (admin-only).
    await db.user.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin delete user error:', error);
    return NextResponse.json(
      { error: 'Failed to delete user.' },
      { status: 500 }
    );
  }
}
