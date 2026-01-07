import { QdrantClient } from '@qdrant/js-client-rest';

let client: QdrantClient | null = null;

const COLLECTION_NAME = 'nvbooklm_sources';
const VECTOR_SIZE = 768; // Gemini embedding dimension

/**
 * Initialize Qdrant client
 */
export function getQdrantClient(): QdrantClient {
    if (!client) {
        const url = process.env.QDRANT_URL || 'http://localhost:6333';
        const apiKey = process.env.QDRANT_API_KEY;

        client = new QdrantClient({
            url,
            ...(apiKey && { apiKey })
        });

        console.log('✅ Qdrant client initialized');
    }
    return client;
}

/**
 * Ensure the collection exists with proper schema
 */
export async function ensureCollection(): Promise<void> {
    const qdrant = getQdrantClient();

    try {
        const collections = await qdrant.getCollections();
        const exists = collections.collections.some(c => c.name === COLLECTION_NAME);

        if (!exists) {
            await qdrant.createCollection(COLLECTION_NAME, {
                vectors: {
                    size: VECTOR_SIZE,
                    distance: 'Cosine'
                }
            });

            // Create payload indexes for filtering
            await qdrant.createPayloadIndex(COLLECTION_NAME, {
                field_name: 'notebookId',
                field_schema: 'keyword'
            });

            await qdrant.createPayloadIndex(COLLECTION_NAME, {
                field_name: 'sourceId',
                field_schema: 'keyword'
            });

            console.log(`✅ Created Qdrant collection: ${COLLECTION_NAME}`);
        }
    } catch (error) {
        console.error('Failed to initialize Qdrant collection:', error);
        throw error;
    }
}

export { COLLECTION_NAME, VECTOR_SIZE };
