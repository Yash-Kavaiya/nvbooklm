import { getDb, Collections } from '../config/firebase';
import { Timestamp } from 'firebase-admin/firestore';
import { incrementSourceCount } from './notebook';

export type SourceType = 'pdf' | 'doc' | 'web' | 'text' | 'youtube';
export type ProcessingStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface Source {
    id: string;
    notebookId: string;
    userId: string;
    title: string;
    type: SourceType;
    url?: string;
    fileName?: string;
    fileSize?: number;
    content?: string;
    chunkCount?: number;
    processingStatus: ProcessingStatus;
    processingError?: string;
    uploadedAt: Date;
    processedAt?: Date;
}

export interface AddSourceInput {
    title: string;
    type: SourceType;
    url?: string;
    fileName?: string;
    fileSize?: number;
    content?: string;
}

/**
 * Add a new source to a notebook
 */
export async function addSource(
    notebookId: string,
    userId: string,
    input: AddSourceInput
): Promise<Source> {
    const db = getDb();
    const ref = db.collection(Collections.SOURCES).doc();

    const source: Omit<Source, 'id'> = {
        notebookId,
        userId,
        title: input.title,
        type: input.type,
        url: input.url,
        fileName: input.fileName,
        fileSize: input.fileSize,
        content: input.content,
        processingStatus: 'pending',
        uploadedAt: new Date()
    };

    await ref.set(source);
    await incrementSourceCount(notebookId, 1);

    return { id: ref.id, ...source };
}

/**
 * Get all sources for a notebook
 */
export async function getSources(notebookId: string, userId: string): Promise<Source[]> {
    const db = getDb();
    const snapshot = await db
        .collection(Collections.SOURCES)
        .where('notebookId', '==', notebookId)
        .where('userId', '==', userId)
        .orderBy('uploadedAt', 'desc')
        .get();

    return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            ...data,
            uploadedAt: (data.uploadedAt as Timestamp).toDate(),
            processedAt: data.processedAt ? (data.processedAt as Timestamp).toDate() : undefined
        } as Source;
    });
}

/**
 * Get a specific source
 */
export async function getSource(sourceId: string, userId: string): Promise<Source | null> {
    const db = getDb();
    const doc = await db.collection(Collections.SOURCES).doc(sourceId).get();

    if (!doc.exists) return null;

    const data = doc.data()!;
    if (data.userId !== userId) return null;

    return {
        id: doc.id,
        ...data,
        uploadedAt: (data.uploadedAt as Timestamp).toDate(),
        processedAt: data.processedAt ? (data.processedAt as Timestamp).toDate() : undefined
    } as Source;
}

/**
 * Update source processing status
 */
export async function updateSourceStatus(
    sourceId: string,
    status: ProcessingStatus,
    options?: { error?: string; chunkCount?: number }
): Promise<void> {
    const db = getDb();
    const update: Record<string, any> = {
        processingStatus: status
    };

    if (status === 'completed') {
        update.processedAt = new Date();
        if (options?.chunkCount) {
            update.chunkCount = options.chunkCount;
        }
    }

    if (status === 'failed' && options?.error) {
        update.processingError = options.error;
    }

    await db.collection(Collections.SOURCES).doc(sourceId).update(update);
}

/**
 * Update source content after parsing
 */
export async function updateSourceContent(sourceId: string, content: string): Promise<void> {
    const db = getDb();
    await db.collection(Collections.SOURCES).doc(sourceId).update({ content });
}

/**
 * Delete a source
 */
export async function deleteSource(sourceId: string, userId: string): Promise<boolean> {
    const db = getDb();
    const ref = db.collection(Collections.SOURCES).doc(sourceId);
    const doc = await ref.get();

    if (!doc.exists || doc.data()?.userId !== userId) return false;

    const notebookId = doc.data()!.notebookId;
    await ref.delete();
    await incrementSourceCount(notebookId, -1);

    return true;
}
