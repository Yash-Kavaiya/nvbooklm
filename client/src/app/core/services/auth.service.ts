import { Injectable, signal, computed, inject } from '@angular/core';
import {
    Auth,
    signInWithPopup,
    signOut,
    GoogleAuthProvider,
    User,
    onAuthStateChanged,
    getIdToken
} from '@angular/fire/auth';
import { Router } from '@angular/router';

export interface AuthUser {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
}

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private auth = inject(Auth);
    private router = inject(Router);

    // Signal-based state
    private userSignal = signal<AuthUser | null>(null);
    private loadingSignal = signal<boolean>(true);
    private tokenSignal = signal<string | null>(null);

    // Public readonly signals
    readonly user = this.userSignal.asReadonly();
    readonly loading = this.loadingSignal.asReadonly();
    readonly isAuthenticated = computed(() => !!this.userSignal());

    constructor() {
        this.initAuthListener();
    }

    /**
     * Initialize auth state listener
     */
    private initAuthListener(): void {
        onAuthStateChanged(this.auth, async (user) => {
            if (user) {
                this.userSignal.set({
                    uid: user.uid,
                    email: user.email,
                    displayName: user.displayName,
                    photoURL: user.photoURL
                });

                // Get and store token
                const token = await getIdToken(user);
                this.tokenSignal.set(token);
            } else {
                this.userSignal.set(null);
                this.tokenSignal.set(null);
            }
            this.loadingSignal.set(false);
        });
    }

    /**
     * Sign in with Google popup
     */
    async signInWithGoogle(): Promise<void> {
        try {
            this.loadingSignal.set(true);
            const provider = new GoogleAuthProvider();
            await signInWithPopup(this.auth, provider);
            this.router.navigate(['/']);
        } catch (error) {
            console.error('Google sign-in failed:', error);
            throw error;
        } finally {
            this.loadingSignal.set(false);
        }
    }

    /**
     * Sign out
     */
    async signOut(): Promise<void> {
        try {
            await signOut(this.auth);
            this.router.navigate(['/login']);
        } catch (error) {
            console.error('Sign-out failed:', error);
            throw error;
        }
    }

    /**
     * Get current auth token for API requests
     */
    async getToken(): Promise<string | null> {
        const user = this.auth.currentUser;
        if (!user) return null;

        // Refresh token if needed
        const token = await getIdToken(user, true);
        this.tokenSignal.set(token);
        return token;
    }

    /**
     * Get authorization header for API calls
     */
    async getAuthHeader(): Promise<Record<string, string>> {
        const token = await this.getToken();
        return token ? { Authorization: `Bearer ${token}` } : {};
    }
}
