import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { put, del } from '@vercel/blob';
import { db } from '@/lib/db';
import {
  getCurrentUser,
  UnauthorizedError,
  ForbiddenError,
} from '@/lib/auth';

// ----- Storage configuration -----
// Vercel Blob is used in production (when BLOB_READ_WRITE_TOKEN is set),
// which persists files in Vercel's object store and returns public https URLs.
// In local development (no token), we fall back to writing files to
// public/uploads/reports/ so the dev workflow still works without any
// external service. Stored image1Path/image2Path will be either a full
// https URL (Vercel Blob) or a relative /uploads/... path (local).
const USE_VERCEL_BLOB = !!process.env.BLOB_READ_WRITE_TOKEN;
const LOCAL_UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'reports');

const MAX_BYTES = 8 * 1024 * 1024; // 8 MB per image
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

async function getOwnedReport(id: string) {
  const user = await getCurrentUser();
  if (!user) throw new UnauthorizedError();

  const report = await db.accidentReport.findUnique({ where: { id } });
  if (!report) return { user, report: null };

  const isAdmin = user.role === 'ADMIN';
  if (!isAdmin && report.userId !== user.id) {
    throw new ForbiddenError();
  }
  return { user, report };
}

function safeExt(mime: string): string {
  switch (mime) {
    case 'image/jpeg':
      return '.jpg';
    case 'image/png':
      return '.png';
    case 'image/webp':
      return '.webp';
    case 'image/gif':
      return '.gif';
    default:
      return '.bin';
  }
}

/**
 * Delete a previously-stored image. Works for both Vercel Blob URLs
 * (https://...) and local relative paths (/uploads/...).
 */
async function deleteStored(storedPath: string | null | undefined): Promise<void> {
  if (!storedPath) return;
  if (storedPath.startsWith('http')) {
    try {
      await del(storedPath);
    } catch (err) {
      // Don't fail the request if the old blob is already gone.
      console.warn('Failed to delete old blob:', err);
    }
    return;
  }
  // Local filesystem path
  const abs = path.join(process.cwd(), 'public', storedPath);
  await fs.rm(abs, { force: true });
}

// POST /api/reports/[id]/images
// Multipart form-data fields: image1?, image2?
// Each image replaces the existing one for that slot.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { report } = await getOwnedReport(id);
    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    const formData = await request.formData();
    const updates: { image1Path?: string | null; image2Path?: string | null } = {};

    if (!USE_VERCEL_BLOB) {
      await fs.mkdir(LOCAL_UPLOAD_DIR, { recursive: true });
    }

    for (const slot of ['image1', 'image2'] as const) {
      const file = formData.get(slot);
      if (!(file instanceof File) || file.size === 0) continue;

      if (!ALLOWED.includes(file.type)) {
        return NextResponse.json(
          { error: `Unsupported file type for ${slot}: ${file.type}. Use JPG, PNG, WEBP, or GIF.` },
          { status: 400 }
        );
      }
      if (file.size > MAX_BYTES) {
        return NextResponse.json(
          { error: `${slot} is too large (max 8 MB).` },
          { status: 400 }
        );
      }

      // Remove the old file for this slot
      const currentPath = slot === 'image1' ? report.image1Path : report.image2Path;
      await deleteStored(currentPath);

      const ext = safeExt(file.type);
      const baseName = `${id}_${slot}_${Date.now()}${ext}`;

      let storedPath: string;
      if (USE_VERCEL_BLOB) {
        // Upload to Vercel Blob. Returns a public https URL.
        const blob = await put(`reports/${baseName}`, file, {
          access: 'public',
          addRandomSuffix: false,
          contentType: file.type,
        });
        storedPath = blob.url;
      } else {
        // Local filesystem fallback (dev only)
        const buffer = Buffer.from(await file.arrayBuffer());
        await fs.writeFile(path.join(LOCAL_UPLOAD_DIR, baseName), buffer);
        storedPath = `/uploads/reports/${baseName}`;
      }

      updates[slot === 'image1' ? 'image1Path' : 'image2Path'] = storedPath;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No image files provided.' },
        { status: 400 }
      );
    }

    const updated = await db.accidentReport.update({
      where: { id },
      data: updates,
    });

    return NextResponse.json({
      image1Path: updated.image1Path,
      image2Path: updated.image2Path,
    });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json(
        { error: 'Please log in to upload images.' },
        { status: 401 }
      );
    }
    if (error instanceof ForbiddenError) {
      return NextResponse.json(
        { error: 'You can only upload images to your own reports.' },
        { status: 403 }
      );
    }
    console.error('Error uploading images:', error);
    return NextResponse.json({ error: 'Failed to upload images' }, { status: 500 });
  }
}

// DELETE /api/reports/[id]/images?slot=image1|image2
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { report } = await getOwnedReport(id);
    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    const slot = request.nextUrl.searchParams.get('slot');
    if (slot !== 'image1' && slot !== 'image2') {
      return NextResponse.json(
        { error: 'Invalid slot. Use ?slot=image1 or ?slot=image2.' },
        { status: 400 }
      );
    }

    const currentPath = slot === 'image1' ? report.image1Path : report.image2Path;
    await deleteStored(currentPath);

    const updated = await db.accidentReport.update({
      where: { id },
      data: slot === 'image1' ? { image1Path: null } : { image2Path: null },
    });

    return NextResponse.json({
      image1Path: updated.image1Path,
      image2Path: updated.image2Path,
    });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json(
        { error: 'Please log in to delete images.' },
        { status: 401 }
      );
    }
    if (error instanceof ForbiddenError) {
      return NextResponse.json(
        { error: 'You can only delete images from your own reports.' },
        { status: 403 }
      );
    }
    console.error('Error deleting image:', error);
    return NextResponse.json({ error: 'Failed to delete image' }, { status: 500 });
  }
}
