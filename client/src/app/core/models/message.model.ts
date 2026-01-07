export type MessageRole = 'user' | 'model' | 'system';

export interface Message {
    id: string;
    role: MessageRole;
    content: string;
    timestamp: Date;
    sources?: string[]; // Referenced source IDs for citations
    isLoading?: boolean;
}

export interface ChatRequest {
    message: string;
    notebookId: string;
    sourceIds?: string[]; // Specific sources to reference
}

export interface ChatResponse {
    message: Message;
    citations?: Citation[];
}

export interface Citation {
    sourceId: string;
    excerpt: string;
    relevance: number;
}
