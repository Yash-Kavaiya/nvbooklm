import { Injectable, signal, inject } from '@angular/core';
import { Notebook, CreateNotebookRequest, UpdateNotebookRequest } from '../models';
import { ApiService } from './api.service';

interface NotebooksResponse {
    notebooks: Notebook[];
}

interface NotebookResponse {
    notebook: Notebook;
}

@Injectable({
    providedIn: 'root'
})
export class NotebookService {
    private api = inject(ApiService);

    // Signal-based state management
    private notebooksSignal = signal<Notebook[]>([]);
    private currentNotebookSignal = signal<Notebook | null>(null);
    private loadingSignal = signal<boolean>(false);
    private errorSignal = signal<string | null>(null);

    // Public readonly signals
    readonly notebooks = this.notebooksSignal.asReadonly();
    readonly currentNotebook = this.currentNotebookSignal.asReadonly();
    readonly loading = this.loadingSignal.asReadonly();
    readonly error = this.errorSignal.asReadonly();

    // Gradient presets for notebook covers
    private readonly gradientPresets = [
        'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        'linear-gradient(135deg, #FF9A9E 0%, #FECFEF 99%)',
        'linear-gradient(120deg, #a1c4fd 0%, #c2e9fb 100%)',
        'linear-gradient(to top, #a8edea 0%, #fed6e3 100%)',
        'linear-gradient(135deg, #76B900 0%, #1A1A1A 100%)', // NVIDIA theme
        'linear-gradient(to right, #fc5c7d 0%, #6a82fb 100%)',
        'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        'linear-gradient(to top, #30cfd0 0%, #330867 100%)'
    ];

    /**
     * Load all notebooks from API
     */
    async loadNotebooks(): Promise<void> {
        this.loadingSignal.set(true);
        this.errorSignal.set(null);

        try {
            const response = await this.api.get<NotebooksResponse>('/api/notebooks');
            const notebooks = response.notebooks.map(nb => ({
                ...nb,
                createdAt: new Date(nb.createdAt),
                updatedAt: new Date(nb.updatedAt)
            }));
            this.notebooksSignal.set(notebooks);
        } catch (error) {
            console.error('Failed to load notebooks:', error);
            this.errorSignal.set(error instanceof Error ? error.message : 'Failed to load notebooks');
            this.notebooksSignal.set([]);
        } finally {
            this.loadingSignal.set(false);
        }
    }

    /**
     * Get a notebook by ID
     */
    getNotebook(id: string): Notebook | undefined {
        return this.notebooksSignal().find(nb => nb.id === id);
    }

    /**
     * Set the current active notebook
     */
    async setCurrentNotebook(id: string): Promise<void> {
        // Try from cache first
        let notebook = this.getNotebook(id);

        if (!notebook) {
            // Fetch from API
            try {
                const response = await this.api.get<NotebookResponse>(`/api/notebooks/${id}`);
                notebook = {
                    ...response.notebook,
                    createdAt: new Date(response.notebook.createdAt),
                    updatedAt: new Date(response.notebook.updatedAt)
                };
            } catch (error) {
                console.error('Failed to fetch notebook:', error);
            }
        }

        this.currentNotebookSignal.set(notebook || null);
    }

    /**
     * Create a new notebook
     */
    async createNotebook(request: CreateNotebookRequest): Promise<Notebook | null> {
        this.loadingSignal.set(true);

        try {
            const payload = {
                ...request,
                coverGradient: request.coverGradient || this.getRandomGradient()
            };

            const response = await this.api.post<NotebookResponse>('/api/notebooks', payload);
            const notebook = {
                ...response.notebook,
                createdAt: new Date(response.notebook.createdAt),
                updatedAt: new Date(response.notebook.updatedAt)
            };

            this.notebooksSignal.update(notebooks => [...notebooks, notebook]);
            return notebook;
        } catch (error) {
            console.error('Failed to create notebook:', error);
            this.errorSignal.set(error instanceof Error ? error.message : 'Failed to create notebook');
            return null;
        } finally {
            this.loadingSignal.set(false);
        }
    }

    /**
     * Update an existing notebook
     */
    async updateNotebook(id: string, request: UpdateNotebookRequest): Promise<Notebook | null> {
        try {
            const response = await this.api.put<NotebookResponse>(`/api/notebooks/${id}`, request);
            const notebook = {
                ...response.notebook,
                createdAt: new Date(response.notebook.createdAt),
                updatedAt: new Date(response.notebook.updatedAt)
            };

            this.notebooksSignal.update(notebooks =>
                notebooks.map(nb => nb.id === id ? notebook : nb)
            );

            if (this.currentNotebookSignal()?.id === id) {
                this.currentNotebookSignal.set(notebook);
            }

            return notebook;
        } catch (error) {
            console.error('Failed to update notebook:', error);
            return null;
        }
    }

    /**
     * Delete a notebook
     */
    async deleteNotebook(id: string): Promise<boolean> {
        try {
            await this.api.delete(`/api/notebooks/${id}`);
            this.notebooksSignal.update(notebooks => notebooks.filter(nb => nb.id !== id));

            if (this.currentNotebookSignal()?.id === id) {
                this.currentNotebookSignal.set(null);
            }

            return true;
        } catch (error) {
            console.error('Failed to delete notebook:', error);
            return false;
        }
    }

    /**
     * Get a random gradient for notebook cover
     */
    getRandomGradient(): string {
        return this.gradientPresets[Math.floor(Math.random() * this.gradientPresets.length)];
    }
}
