import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Auth guard - redirects to login if not authenticated
 */
export const authGuard: CanActivateFn = () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    // Wait for auth to initialize
    if (authService.loading()) {
        return true; // Will be handled by app initialization
    }

    if (authService.isAuthenticated()) {
        return true;
    }

    return router.createUrlTree(['/login']);
};

/**
 * Guest guard - redirects to home if already authenticated
 */
export const guestGuard: CanActivateFn = () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (authService.loading()) {
        return true;
    }

    if (!authService.isAuthenticated()) {
        return true;
    }

    return router.createUrlTree(['/']);
};
