import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { db } from './db';

export const AUTH_COOKIE = 'mvi_session';
const SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || 'dev-secret-change-me-in-production-please-use-a-long-random-string'
);

/** Default permissions granted to a freshly-created user. */
export const DEFAULT_PERMISSIONS = {
  canViewReports: true,
  canEditReports: true,
  canPrintReports: true,
  canDeleteReports: true,
} as const;

/** Shape of the per-user permission flags persisted on the User record. */
export interface UserPermissions {
  canViewReports: boolean;
  canEditReports: boolean;
  canPrintReports: boolean;
  canDeleteReports: boolean;
}

export interface AuthUser extends UserPermissions {
  id: string;
  email: string;
  name: string;
  role: 'USER' | 'ADMIN';
}

export interface SessionPayload extends UserPermissions {
  sub: string;
  email: string;
  name: string;
  role: string;
}

/** Sign a JWT and return the token string */
export async function signToken(payload: SessionPayload): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(SECRET);
}

/** Verify a JWT token and return the payload, or null if invalid */
export async function verifyToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return {
      sub: payload.sub as string,
      email: payload.email as string,
      name: payload.name as string,
      role: payload.role as string,
      canViewReports: payload.canViewReports !== false,
      canEditReports: payload.canEditReports !== false,
      canPrintReports: payload.canPrintReports !== false,
      canDeleteReports: payload.canDeleteReports !== false,
    };
  } catch {
    return null;
  }
}

/**
 * Resolve the permission flags for a user, given their role.
 * ADMINs always have full access regardless of the stored flags.
 */
function resolvePermissions(
  role: string,
  flags: {
    canViewReports: boolean;
    canEditReports: boolean;
    canPrintReports: boolean;
    canDeleteReports: boolean;
  }
): UserPermissions {
  if (role === 'ADMIN') {
    return {
      canViewReports: true,
      canEditReports: true,
      canPrintReports: true,
      canDeleteReports: true,
    };
  }
  return flags;
}

/** Get the authenticated user from a Next.js request (API route).
 *  Returns null if not authenticated.
 *
 *  Permissions are always read fresh from the database so an admin's
 *  changes take effect on the user's next request (even before their
 *  JWT is re-signed).
 */
export async function getAuthUserFromRequest(
  req: NextRequest
): Promise<AuthUser | null> {
  const token = req.cookies.get(AUTH_COOKIE)?.value;
  if (!token) return null;
  const payload = await verifyToken(token);
  if (!payload) return null;

  // Verify user still exists in DB and pull the latest permission flags
  const user = await db.user.findUnique({
    where: { id: payload.sub },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      canViewReports: true,
      canEditReports: true,
      canPrintReports: true,
      canDeleteReports: true,
    },
  });
  if (!user) return null;

  const role = user.role as 'USER' | 'ADMIN';
  const perms = resolvePermissions(role, {
    canViewReports: user.canViewReports,
    canEditReports: user.canEditReports,
    canPrintReports: user.canPrintReports,
    canDeleteReports: user.canDeleteReports,
  });

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role,
    ...perms,
  };
}

/** Server-component helper to get the current user (reads cookies) */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE)?.value;
  if (!token) return null;
  const payload = await verifyToken(token);
  if (!payload) return null;

  const user = await db.user.findUnique({
    where: { id: payload.sub },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      canViewReports: true,
      canEditReports: true,
      canPrintReports: true,
      canDeleteReports: true,
    },
  });
  if (!user) return null;

  const role = user.role as 'USER' | 'ADMIN';
  const perms = resolvePermissions(role, {
    canViewReports: user.canViewReports,
    canEditReports: user.canEditReports,
    canPrintReports: user.canPrintReports,
    canDeleteReports: user.canDeleteReports,
  });

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role,
    ...perms,
  };
}

/**
 * Helper for API routes: standard 403 response used when a user lacks
 * the permission required to perform an action. The message matches the
 * user-facing "Administrator Approval Required" wording.
 */
export function permissionDeniedResponse(action: string) {
  return NextResponse.json(
    {
      error: `Administrator Approval Required`,
      action,
      message: `You do not have permission to ${action}. Please contact an administrator to request access.`,
    },
    { status: 403 }
  );
}
