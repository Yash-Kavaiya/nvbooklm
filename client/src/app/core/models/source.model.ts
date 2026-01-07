export type SourceType = 'pdf' | 'doc' | 'web' | 'text' | 'youtube';

export interface Source {
    id: string;
    notebookId: string;
    title: string;
    type: SourceType;
    content?: string;
    url?: string;
    fileName?: string;
    fileSize?: number;
    uploadedAt: Date;
    selected?: boolean;
}

export interface AddSourceRequest {
    type: SourceType;
    title: string;
    content?: string;
    url?: string;
    file?: File;
}
