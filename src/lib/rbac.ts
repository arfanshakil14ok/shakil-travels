import { getCurrentUser } from './auth';
import type { AuthUser, PermissionCode } from '@/types';

export class AuthorizationError extends Error {
  constructor(message = 'Unauthorized: Insufficient permissions') {
    super(message);
    this.name = 'AuthorizationError';
  }
}

export class AuthenticationError extends Error {
  constructor(message = 'Unauthenticated: Please log in') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

/**
 * Checks if user possesses the requested permission or is SUPER_ADMIN
 */
export function hasPermission(user: AuthUser | null, code: PermissionCode): boolean {
  if (!user || !user.isActive) return false;
  if (user.role.name === 'SUPER_ADMIN') return true;
  return user.permissions.includes(code);
}

/**
 * Server-side guard: Ensures valid authenticated session
 */
export async function requireAuth(): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new AuthenticationError();
  }
  return user;
}

/**
 * Server-side guard: Ensures user is authenticated AND possesses the specific permission
 */
export async function requirePermission(code: PermissionCode): Promise<AuthUser> {
  const user = await requireAuth();
  if (!hasPermission(user, code)) {
    throw new AuthorizationError(`Access denied: requires ${code} permission`);
  }
  return user;
}

/**
 * Server-side guard: Ensures user has one of the allowed roles, or is SUPER_ADMIN
 */
export async function requireRole(allowedRoles: string[]): Promise<AuthUser> {
  const user = await requireAuth();
  if (user.role.name === 'SUPER_ADMIN') {
    return user;
  }
  if (!allowedRoles.includes(user.role.name)) {
    throw new AuthorizationError(`Access denied: requires one of [${allowedRoles.join(', ')}] role`);
  }
  return user;
}

/**
 * Server-side guard: Ensures user is explicitly SUPER_ADMIN
 */
export async function requireSuperAdmin(): Promise<AuthUser> {
  const user = await requireAuth();
  if (user.role.name !== 'SUPER_ADMIN') {
    throw new AuthorizationError('Access denied: requires SUPER_ADMIN privilege');
  }
  return user;
}

