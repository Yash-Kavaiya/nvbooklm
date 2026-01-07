import { Injectable, signal } from '@angular/core';
import { Source, SourceType, AddSourceRequest } from '../models';

@Injectable({
    providedIn: 'root'
})
export class SourceService {
    private sourcesSignal = signal<Map<string, Source[]>>(new Map());
    private loadingSignal = signal<boolean>(false);

    readonly loading = this.loadingSignal.asReadonly();

    /**
     * Get sources for a specific notebook
     */
    getSources(notebookId: string): Source[] {
        return this.sourcesSignal().get(notebookId) || [];
    }

    /**
     * Get selected sources for a notebook
     */
    getSelectedSources(notebookId: string): Source[] {
        return this.getSources(notebookId).filter(s => s.selected);
    }

    /**
     * Add a new source to a notebook
     */
    addSource(notebookId: string, request: AddSourceRequest): Source {
        const newSource: Source = {
            id: crypto.randomUUID(),
            notebookId,
            title: request.title,
            type: request.type,
            content: request.content,
            url: request.url,
            uploadedAt: new Date(),
            selected: true
        };

        this.sourcesSignal.update(map => {
            const newMap = new Map(map);
            const existing = newMap.get(notebookId) || [];
            newMap.set(notebookId, [...existing, newSource]);
            return newMap;
        });

        return newSource;
    }

    /**
     * Remove a source from a notebook
     */
    removeSource(notebookId: string, sourceId: string): boolean {
        const sources = this.getSources(notebookId);
        const filtered = sources.filter(s => s.id !== sourceId);

        if (filtered.length === sources.length) return false;

        this.sourcesSignal.update(map => {
            const newMap = new Map(map);
            newMap.set(notebookId, filtered);
            return newMap;
        });

        return true;
    }

    /**
     * Toggle source selection
     */
    toggleSourceSelection(notebookId: string, sourceId: string): void {
        this.sourcesSignal.update(map => {
            const newMap = new Map(map);
            const sources = newMap.get(notebookId) || [];
            const updated = sources.map(s =>
                s.id === sourceId ? { ...s, selected: !s.selected } : s
            );
            newMap.set(notebookId, updated);
            return newMap;
        });
    }

    /**
     * Select all sources in a notebook
     */
    selectAll(notebookId: string): void {
        this.updateAllSelections(notebookId, true);
    }

    /**
     * Deselect all sources in a notebook
     */
    deselectAll(notebookId: string): void {
        this.updateAllSelections(notebookId, false);
    }

    private updateAllSelections(notebookId: string, selected: boolean): void {
        this.sourcesSignal.update(map => {
            const newMap = new Map(map);
            const sources = newMap.get(notebookId) || [];
            const updated = sources.map(s => ({ ...s, selected }));
            newMap.set(notebookId, updated);
            return newMap;
        });
    }

    /**
     * Get icon for source type
     */
    getSourceIcon(type: SourceType): string {
        const icons: Record<SourceType, string> = {
            pdf: 'picture_as_pdf',
            doc: 'description',
            web: 'language',
            text: 'article',
            youtube: 'play_circle'
        };
        return icons[type] || 'insert_drive_file';
    }

    /**
     * Parse content from a file (placeholder for future implementation)
     */
    async parseFileContent(file: File): Promise<string> {
        // TODO: Implement actual file parsing
        // For now, return placeholder
        return `[Content from ${file.name} - parsing not yet implemented]`;
    }

    /**
     * Fetch content from a URL (placeholder for future implementation)
     */
    async fetchUrlContent(url: string): Promise<string> {
        // TODO: Implement URL content fetching via backend
        return `[Content from ${url} - fetching not yet implemented]`;
    }
}
