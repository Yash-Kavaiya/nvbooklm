import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../core/services/auth.service';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [CommonModule, MatButtonModule, MatIconModule, MatCardModule, MatProgressSpinnerModule],
    templateUrl: './login.html',
    styleUrl: './login.scss'
})
export class LoginComponent {
    authService = inject(AuthService);

    async signIn(): Promise<void> {
        try {
            await this.authService.signInWithGoogle();
        } catch (error) {
            console.error('Sign in failed:', error);
        }
    }
}
