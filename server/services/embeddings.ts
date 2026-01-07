import { GoogleGenerativeAI } from '@google/generative-ai';
import { getQdrantClient, COLLECTION_NAME, VECTOR_SIZE } from '../config/qdrant';
import { env } from '../config/env';
import { v4 as uuidv4 } from 'uuid';

const CHUNK_SIZE = 1000; // characters per chunk
const CHUNK_OVERLAP = 200; // overlap between chunks

let genAI: GoogleGenerativeAI | null = null;

function getGenAI(): GoogleGenerativeAI {
    if (!genAI) {
        genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
    }
    return genAI;
}

export interface TextChunk {
    id: string;
    text: string;
    index: number;
}

export interface EmbeddingResult {
    chunkId: string;
    embedding: number[];
}

/**
 * Split text into overlapping chunks for embedding
 */
export function chunkText(text: string, chunkSize = CHUNK_SIZE, overlap = CHUNK_OVERLAP): TextChunk[] {
    const chunks: TextChunk[] = [];
    let start = 0;
    let index = 0;

    while (start < text.length) {
        const end = Math.min(start + chunkSize, text.length);
        let chunkEnd = end;

        // Try to break at sentence boundary
        if (end < text.length) {
            const lastPeriod = text.lastIndexOf('.', end);
            const lastNewline = text.lastIndexOf('\n', end);
            const breakPoint = Math.max(lastPeriod, lastNewline);

            if (breakPoint > start + chunkSize / 2) {
                chunkEnd = breakPoint + 1;
            }
        }

        chunks.push({
            id: uuidv4(),
            text: text.slice(start, chunkEnd).trim(),
            index
        });

        start = chunkEnd - overlap;
        if (start >= text.length - overlap) break;
        index++;
    }

    return chunks;
}

/**
 * Generate embeddings using Gemini
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
    const ai = getGenAI();
    const model = ai.getGenerativeModel({ model: 'text-embedding-004' });

    const embeddings: number[][] = [];

    // Process in batches of 100 (Gemini limit)
    const batchSize = 100;
    for (let i = 0; i < texts.length; i += batchSize) {
        const batch = texts.slice(i, i + batchSize);
        const result = await model.batchEmbedContents({
            requests: batch.map(text => ({
                content: { parts: [{ text }] },
                taskType: 'RETRIEVAL_DOCUMENT'
            }))
        });

        embeddings.push(...result.embeddings.map(e => e.values));
    }

    return embeddings;
}

/**
 * Store text chunks with embeddings in Qdrant
 */
export async function storeEmbeddings(
    chunks: TextChunk[],
    embeddings: number[][],
    metadata: {
        notebookId: string;
        sourceId: string;
        sourceTitle: string;
    }
): Promise<void> {
    const qdrant = getQdrantClient();

    const points = chunks.map((chunk, i) => ({
        id: chunk.id,
        vector: embeddings[i],
        payload: {
            text: chunk.text,
            chunkIndex: chunk.index,
            notebookId: metadata.notebookId,
            sourceId: metadata.sourceId,
            sourceTitle: metadata.sourceTitle
        }
    }));

    await qdrant.upsert(COLLECTION_NAME, {
        wait: true,
        points
    });
}

/**
 * Process source content: chunk, embed, and store
 */
export async function processSourceContent(
    content: string,
    metadata: {
        notebookId: string;
        sourceId: string;
        sourceTitle: string;
    }
): Promise<number> {
    // Chunk the text
    const chunks = chunkText(content);

    if (chunks.length === 0) {
        console.warn('No chunks generated from content');
        return 0;
    }

    // Generate embeddings
    const texts = chunks.map(c => c.text);
    const embeddings = await generateEmbeddings(texts);

    // Store in Qdrant
    await storeEmbeddings(chunks, embeddings, metadata);

    console.log(`✅ Stored ${chunks.length} chunks for source ${metadata.sourceId}`);
    return chunks.length;
}

/**
 * Delete all embeddings for a source
 */
export async function deleteSourceEmbeddings(sourceId: string): Promise<void> {
    const qdrant = getQdrantClient();

    await qdrant.delete(COLLECTION_NAME, {
        filter: {
            must: [{ key: 'sourceId', match: { value: sourceId } }]
        }
    });
}
