import { Context, Next } from 'hono';
import { getAuthAdmin } from '../config/firebase';
import { DecodedIdToken } from 'firebase-admin/auth';

// Extend Hono context with user info
declare module 'hono' {
    interface ContextVariableMap {
        user: DecodedIdToken | null;
        userId: string | null;
    }
}

/**
 * Authentication middleware
 * Extracts and verifies Firebase ID token from Authorization header
 */
export async function authMiddleware(c: Context, next: Next): Promise<Response | void> {
    const authHeader = c.req.header('Authorization');

    if (!authHeader?.startsWith('Bearer ')) {
        c.set('user', null);
        c.set('userId', null);
        return next();
    }

    const token = authHeader.substring(7);

    try {
        const auth = getAuthAdmin();
        const decodedToken = await auth.verifyIdToken(token);

        c.set('user', decodedToken);
        c.set('userId', decodedToken.uid);
    } catch (error) {
        console.error('Token verification failed:', error);
        c.set('user', null);
        c.set('userId', null);
    }

    return next();
}

/**
 * Require authentication - use after authMiddleware
 * Returns 401 if user is not authenticated
 */
export async function requireAuth(c: Context, next: Next): Promise<Response | void> {
    const userId = c.get('userId');

    if (!userId) {
        return c.json({ error: 'Unauthorized', message: 'Valid authentication required' }, 401);
    }

    return next();
}

/**
 * Get authenticated user ID or throw
 */
export function getAuthenticatedUserId(c: Context): string {
    const userId = c.get('userId');
    if (!userId) {
        throw new Error('User not authenticated');
    }
    return userId;
}
