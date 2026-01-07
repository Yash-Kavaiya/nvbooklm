import { GoogleGenerativeAI } from '@google/generative-ai';
import { getQdrantClient, COLLECTION_NAME } from '../config/qdrant';
import { env } from '../config/env';

let genAI: GoogleGenerativeAI | null = null;

function getGenAI(): GoogleGenerativeAI {
    if (!genAI) {
        genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
    }
    return genAI;
}

export interface RetrievedContext {
    text: string;
    sourceId: string;
    sourceTitle: string;
    chunkIndex: number;
    score: number;
}

export interface ChatWithContext {
    response: string;
    citations: Citation[];
}

export interface Citation {
    sourceId: string;
    sourceTitle: string;
    text: string;
}

/**
 * Search for relevant context using semantic similarity
 */
export async function searchContext(
    query: string,
    notebookId: string,
    limit: number = 5
): Promise<RetrievedContext[]> {
    const qdrant = getQdrantClient();
    const ai = getGenAI();

    // Generate query embedding
    const model = ai.getGenerativeModel({ model: 'text-embedding-004' });
    const embedResult = await model.embedContent({
        content: { parts: [{ text: query }] },
        taskType: 'RETRIEVAL_QUERY'
    });
    const queryVector = embedResult.embedding.values;

    // Search Qdrant
    const results = await qdrant.search(COLLECTION_NAME, {
        vector: queryVector,
        filter: {
            must: [{ key: 'notebookId', match: { value: notebookId } }]
        },
        limit,
        with_payload: true,
        score_threshold: 0.5
    });

    return results.map(result => ({
        text: result.payload?.text as string,
        sourceId: result.payload?.sourceId as string,
        sourceTitle: result.payload?.sourceTitle as string,
        chunkIndex: result.payload?.chunkIndex as number,
        score: result.score
    }));
}

/**
 * Generate AI response with RAG context
 */
export async function chatWithRag(
    query: string,
    notebookId: string,
    conversationHistory: { role: string; content: string }[] = []
): Promise<ChatWithContext> {
    const ai = getGenAI();
    const model = ai.getGenerativeModel({ model: 'gemini-2.0-flash' });

    // Retrieve relevant context
    const contexts = await searchContext(query, notebookId);

    // Build context string
    const contextText = contexts.map((ctx, i) =>
        `[Source ${i + 1}: ${ctx.sourceTitle}]\n${ctx.text}`
    ).join('\n\n---\n\n');

    // Build prompt with context
    const systemPrompt = `You are a helpful AI assistant for the nvbooklm notebook application. 
Answer questions based on the provided source materials. 
Always cite your sources by mentioning the source title when using information from them.
If the sources don't contain relevant information, say so clearly.

SOURCES:
${contextText || 'No relevant sources found for this query.'}`;

    // Prepare chat history
    const history = conversationHistory.map(msg => ({
        role: msg.role as 'user' | 'model',
        parts: [{ text: msg.content }]
    }));

    // Create chat session with context
    const chat = model.startChat({
        history: [
            { role: 'user', parts: [{ text: systemPrompt }] },
            { role: 'model', parts: [{ text: 'I understand. I will answer questions based on the provided sources and cite them appropriately.' }] },
            ...history
        ]
    });

    // Send query and get response
    const result = await chat.sendMessage(query);
    const response = result.response.text();

    // Build citations from used contexts
    const citations: Citation[] = contexts
        .filter(ctx => response.toLowerCase().includes(ctx.sourceTitle.toLowerCase().slice(0, 20)))
        .map(ctx => ({
            sourceId: ctx.sourceId,
            sourceTitle: ctx.sourceTitle,
            text: ctx.text.slice(0, 200) + '...'
        }));

    return {
        response,
        citations
    };
}

/**
 * Generate summary of notebook sources
 */
export async function generateSummary(notebookId: string): Promise<string> {
    const qdrant = getQdrantClient();
    const ai = getGenAI();
    const model = ai.getGenerativeModel({ model: 'gemini-2.0-flash' });

    // Get some representative chunks from each source
    const results = await qdrant.scroll(COLLECTION_NAME, {
        filter: {
            must: [{ key: 'notebookId', match: { value: notebookId } }]
        },
        limit: 20,
        with_payload: true
    });

    if (results.points.length === 0) {
        return 'No sources have been processed yet.';
    }

    const sourceTexts = results.points.map(p => p.payload?.text as string).join('\n\n');

    const prompt = `Based on the following source excerpts, provide a concise summary of the main topics and key information covered:

${sourceTexts}

Provide a clear, well-organized summary in 2-3 paragraphs.`;

    const result = await model.generateContent(prompt);
    return result.response.text();
}

/**
 * Generate suggested questions based on sources
 */
export async function generateSuggestedQuestions(notebookId: string): Promise<string[]> {
    const qdrant = getQdrantClient();
    const ai = getGenAI();
    const model = ai.getGenerativeModel({ model: 'gemini-2.0-flash' });

    // Get sample content
    const results = await qdrant.scroll(COLLECTION_NAME, {
        filter: {
            must: [{ key: 'notebookId', match: { value: notebookId } }]
        },
        limit: 10,
        with_payload: true
    });

    if (results.points.length === 0) {
        return ['What sources should I add to this notebook?'];
    }

    const sourceTexts = results.points.map(p => p.payload?.text as string).join('\n\n');

    const prompt = `Based on the following content, suggest 5 insightful questions that a user might want to ask:

${sourceTexts}

Return only the questions, one per line, without numbering.`;

    const result = await model.generateContent(prompt);
    return result.response.text().split('\n').filter(q => q.trim()).slice(0, 5);
}
