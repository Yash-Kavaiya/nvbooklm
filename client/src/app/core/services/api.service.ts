import { Injectable, inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

export interface ApiResponse<T> {
    data?: T;
    error?: string;
}

@Injectable({
    providedIn: 'root'
})
export class ApiService {
    private authService = inject(AuthService);
    private baseUrl = environment.apiUrl;

    /**
     * Make authenticated GET request
     */
    async get<T>(endpoint: string): Promise<T> {
        const headers = await this.getHeaders();
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            method: 'GET',
            headers
        });
        return this.handleResponse<T>(response);
    }

    /**
     * Make authenticated POST request
     */
    async post<T>(endpoint: string, body: any): Promise<T> {
        const headers = await this.getHeaders();
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            method: 'POST',
            headers,
            body: JSON.stringify(body)
        });
        return this.handleResponse<T>(response);
    }

    /**
     * Make authenticated PUT request
     */
    async put<T>(endpoint: string, body: any): Promise<T> {
        const headers = await this.getHeaders();
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            method: 'PUT',
            headers,
            body: JSON.stringify(body)
        });
        return this.handleResponse<T>(response);
    }

    /**
     * Make authenticated DELETE request
     */
    async delete<T>(endpoint: string): Promise<T> {
        const headers = await this.getHeaders();
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            method: 'DELETE',
            headers
        });
        return this.handleResponse<T>(response);
    }

    /**
     * Get headers with auth token
     */
    private async getHeaders(): Promise<Record<string, string>> {
        const authHeaders = await this.authService.getAuthHeader();
        return {
            'Content-Type': 'application/json',
            ...authHeaders
        };
    }

    /**
     * Handle API response
     */
    private async handleResponse<T>(response: Response): Promise<T> {
        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: response.statusText }));
            throw new Error(error.error || error.message || 'API request failed');
        }
        return response.json();
    }
}
