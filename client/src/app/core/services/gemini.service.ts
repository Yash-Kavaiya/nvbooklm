import { Injectable, inject } from '@angular/core';
import { GoogleGenerativeAI, GenerativeModel, ChatSession } from '@google/generative-ai';
import { environment } from '../../../environments/environment';
import { Message, ChatRequest, ChatResponse, Citation } from '../models';

@Injectable({
    providedIn: 'root'
})
export class GeminiService {
    private genAI: GoogleGenerativeAI;
    private model: GenerativeModel;
    private chatSession: ChatSession | null = null;

    constructor() {
        this.genAI = new GoogleGenerativeAI(environment.gemini.apiKey);
        this.model = this.genAI.getGenerativeModel({ model: environment.gemini.model });
    }

    /**
     * Initialize a new chat session with optional system context
     */
    initChat(systemContext?: string): void {
        const history = systemContext ? [
            { role: 'user' as const, parts: [{ text: `Context: ${systemContext}` }] },
            { role: 'model' as const, parts: [{ text: 'I understand. I will use this context to answer your questions.' }] }
        ] : [];

        this.chatSession = this.model.startChat({ history });
    }

    /**
     * Send a message and get AI response
     */
    async chat(request: ChatRequest, sourceContext?: string): Promise<ChatResponse> {
        if (!this.chatSession) {
            this.initChat(sourceContext);
        }

        const prompt = sourceContext
            ? `Based on the following sources:\n${sourceContext}\n\nUser question: ${request.message}`
            : request.message;

        const result = await this.chatSession!.sendMessage(prompt);
        const response = await result.response;
        const text = response.text();

        const message: Message = {
            id: crypto.randomUUID(),
            role: 'model',
            content: text,
            timestamp: new Date()
        };

        return { message };
    }

    /**
     * Generate a summary from source content
     */
    async summarizeSources(sourceContents: string[]): Promise<string> {
        const prompt = `Please provide a comprehensive summary of the following sources:\n\n${sourceContents.join('\n\n---\n\n')}`;

        const result = await this.model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    }

    /**
     * Generate suggested questions based on sources
     */
    async generateSuggestedQuestions(sourceContents: string[]): Promise<string[]> {
        const prompt = `Based on the following content, suggest 5 insightful questions a user might want to ask:\n\n${sourceContents.join('\n\n')}\n\nReturn only the questions, one per line.`;

        const result = await this.model.generateContent(prompt);
        const response = await result.response;
        return response.text().split('\n').filter(q => q.trim());
    }

    /**
     * Reset the chat session
     */
    resetChat(): void {
        this.chatSession = null;
    }
}
