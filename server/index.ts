import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';

// Config
import { env, validateEnv } from './config/env';
import { initializeFirebase } from './config/firebase';
import { ensureCollection } from './config/qdrant';

// Middleware
import { authMiddleware, requireAuth, getAuthenticatedUserId } from './middleware/auth';

// Services
import * as notebookService from './services/notebook';
import * as sourceService from './services/source';
import * as rag from './services/rag';
import { processSourceContent, deleteSourceEmbeddings } from './services/embeddings';
import { parsePdf, parsePdfFromUrl } from './services/parsers/pdf';
import { parseWebPage } from './services/parsers/web';
import { parseYouTubeVideo } from './services/parsers/youtube';

// Initialize app
const app = new Hono();

// Validate environment
validateEnv();

// Initialize services
try {
    initializeFirebase();
} catch (error) {
    console.warn('Firebase init skipped (dev mode):', error);
}

// Initialize Qdrant collection (async)
ensureCollection().catch(err => {
    console.warn('Qdrant collection init failed (may not be running):', err.message);
});

// Middleware
app.use('*', logger());
app.use('*', cors({
    origin: env.CORS_ORIGINS,
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
}));
app.use('/api/*', authMiddleware);

// ========== Public Routes ==========

app.get('/api/health', (c) => {
    return c.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'nvbooklm-api'
    });
});

// ========== Protected Routes (require auth) ==========

// Notebooks
app.get('/api/notebooks', requireAuth, async (c) => {
    const userId = getAuthenticatedUserId(c);
    const notebooks = await notebookService.getNotebooks(userId);
    return c.json({ notebooks });
});

app.get('/api/notebooks/:id', requireAuth, async (c) => {
    const userId = getAuthenticatedUserId(c);
    const notebookId = c.req.param('id');
    const notebook = await notebookService.getNotebook(notebookId, userId);

    if (!notebook) {
        return c.json({ error: 'Notebook not found' }, 404);
    }
    return c.json({ notebook });
});

app.post('/api/notebooks', requireAuth, async (c) => {
    const userId = getAuthenticatedUserId(c);
    const body = await c.req.json();
    const notebook = await notebookService.createNotebook(userId, body);
    return c.json({ notebook }, 201);
});

app.put('/api/notebooks/:id', requireAuth, async (c) => {
    const userId = getAuthenticatedUserId(c);
    const notebookId = c.req.param('id');
    const body = await c.req.json();
    const notebook = await notebookService.updateNotebook(notebookId, userId, body);

    if (!notebook) {
        return c.json({ error: 'Notebook not found' }, 404);
    }
    return c.json({ notebook });
});

app.delete('/api/notebooks/:id', requireAuth, async (c) => {
    const userId = getAuthenticatedUserId(c);
    const notebookId = c.req.param('id');
    const deleted = await notebookService.deleteNotebook(notebookId, userId);

    if (!deleted) {
        return c.json({ error: 'Notebook not found' }, 404);
    }
    return c.json({ success: true });
});

// Sources
app.get('/api/notebooks/:id/sources', requireAuth, async (c) => {
    const userId = getAuthenticatedUserId(c);
    const notebookId = c.req.param('id');
    const sources = await sourceService.getSources(notebookId, userId);
    return c.json({ sources });
});

app.post('/api/notebooks/:id/sources', requireAuth, async (c) => {
    const userId = getAuthenticatedUserId(c);
    const notebookId = c.req.param('id');
    const body = await c.req.json();

    // Create source record
    const source = await sourceService.addSource(notebookId, userId, body);

    // Process source asynchronously
    processSourceAsync(source.id, userId, body);

    return c.json({ source }, 201);
});

app.delete('/api/sources/:id', requireAuth, async (c) => {
    const userId = getAuthenticatedUserId(c);
    const sourceId = c.req.param('id');

    // Delete embeddings first
    await deleteSourceEmbeddings(sourceId);

    const deleted = await sourceService.deleteSource(sourceId, userId);
    if (!deleted) {
        return c.json({ error: 'Source not found' }, 404);
    }
    return c.json({ success: true });
});

// Chat
app.post('/api/notebooks/:id/chat', requireAuth, async (c) => {
    const userId = getAuthenticatedUserId(c);
    const notebookId = c.req.param('id');
    const { message, history = [] } = await c.req.json();

    // Verify notebook access
    const notebook = await notebookService.getNotebook(notebookId, userId);
    if (!notebook) {
        return c.json({ error: 'Notebook not found' }, 404);
    }

    try {
        const result = await rag.chatWithRag(message, notebookId, history);
        return c.json({
            response: result.response,
            citations: result.citations
        });
    } catch (error) {
        console.error('Chat error:', error);
        return c.json({ error: 'Failed to generate response' }, 500);
    }
});

// Notebook utilities
app.get('/api/notebooks/:id/summary', requireAuth, async (c) => {
    const userId = getAuthenticatedUserId(c);
    const notebookId = c.req.param('id');

    const notebook = await notebookService.getNotebook(notebookId, userId);
    if (!notebook) {
        return c.json({ error: 'Notebook not found' }, 404);
    }

    const summary = await rag.generateSummary(notebookId);
    return c.json({ summary });
});

app.get('/api/notebooks/:id/suggested-questions', requireAuth, async (c) => {
    const userId = getAuthenticatedUserId(c);
    const notebookId = c.req.param('id');

    const notebook = await notebookService.getNotebook(notebookId, userId);
    if (!notebook) {
        return c.json({ error: 'Notebook not found' }, 404);
    }

    const questions = await rag.generateSuggestedQuestions(notebookId);
    return c.json({ questions });
});

// ========== Async Source Processing ==========

async function processSourceAsync(sourceId: string, userId: string, input: any) {
    try {
        await sourceService.updateSourceStatus(sourceId, 'processing');

        let content = input.content;
        let title = input.title;

        // Parse content based on type
        if (input.type === 'web' && input.url) {
            const parsed = await parseWebPage(input.url);
            content = parsed.content;
            title = title || parsed.title;
        } else if (input.type === 'youtube' && input.url) {
            const parsed = await parseYouTubeVideo(input.url);
            content = parsed.transcript;
            title = title || parsed.title;
        } else if (input.type === 'pdf' && input.url) {
            const parsed = await parsePdfFromUrl(input.url);
            content = parsed.text;
            title = title || parsed.info.title || 'PDF Document';
        }

        if (!content) {
            throw new Error('No content to process');
        }

        // Update source with parsed content
        await sourceService.updateSourceContent(sourceId, content);

        // Get source details for metadata
        const source = await sourceService.getSource(sourceId, userId);
        if (!source) throw new Error('Source not found');

        // Generate embeddings and store
        const chunkCount = await processSourceContent(content, {
            notebookId: source.notebookId,
            sourceId,
            sourceTitle: title
        });

        await sourceService.updateSourceStatus(sourceId, 'completed', { chunkCount });
        console.log(`✅ Source ${sourceId} processed: ${chunkCount} chunks`);

    } catch (error) {
        console.error(`Source processing failed for ${sourceId}:`, error);
        await sourceService.updateSourceStatus(sourceId, 'failed', {
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}

// Start server
console.log(`🚀 nvbooklm API server running at http://localhost:${env.PORT}`);

export default {
    port: env.PORT,
    fetch: app.fetch,
};