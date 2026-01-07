export interface Notebook {
    id: string;
    title: string;
    createdAt: Date;
    updatedAt: Date;
    sources: string[]; // Source IDs
    coverGradient?: string;
    userId?: string;
}

export interface CreateNotebookRequest {
    title: string;
    coverGradient?: string;
}

export interface UpdateNotebookRequest {
    title?: string;
    coverGradient?: string;
}
