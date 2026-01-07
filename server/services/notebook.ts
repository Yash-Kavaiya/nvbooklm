import { getDb, Collections } from '../config/firebase';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';

export interface Notebook {
    id: string;
    userId: string;
    title: string;
    createdAt: Date;
    updatedAt: Date;
    sourceCount: number;
    coverGradient?: string;
}

export interface CreateNotebookInput {
    title: string;
    coverGradient?: string;
}

export interface UpdateNotebookInput {
    title?: string;
    coverGradient?: string;
}

/**
 * Create a new notebook
 */
export async function createNotebook(userId: string, input: CreateNotebookInput): Promise<Notebook> {
    const db = getDb();
    const ref = db.collection(Collections.NOTEBOOKS).doc();

    const now = new Date();
    const notebook: Omit<Notebook, 'id'> = {
        userId,
        title: input.title || 'Untitled Notebook',
        createdAt: now,
        updatedAt: now,
        sourceCount: 0,
        coverGradient: input.coverGradient
    };

    await ref.set(notebook);

    return { id: ref.id, ...notebook };
}

/**
 * Get all notebooks for a user
 */
export async function getNotebooks(userId: string): Promise<Notebook[]> {
    const db = getDb();
    const snapshot = await db
        .collection(Collections.NOTEBOOKS)
        .where('userId', '==', userId)
        .orderBy('updatedAt', 'desc')
        .get();

    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: (doc.data().createdAt as Timestamp).toDate(),
        updatedAt: (doc.data().updatedAt as Timestamp).toDate()
    })) as Notebook[];
}

/**
 * Get a specific notebook
 */
export async function getNotebook(notebookId: string, userId: string): Promise<Notebook | null> {
    const db = getDb();
    const doc = await db.collection(Collections.NOTEBOOKS).doc(notebookId).get();

    if (!doc.exists) return null;

    const data = doc.data()!;
    if (data.userId !== userId) return null;

    return {
        id: doc.id,
        ...data,
        createdAt: (data.createdAt as Timestamp).toDate(),
        updatedAt: (data.updatedAt as Timestamp).toDate()
    } as Notebook;
}

/**
 * Update a notebook
 */
export async function updateNotebook(
    notebookId: string,
    userId: string,
    input: UpdateNotebookInput
): Promise<Notebook | null> {
    const db = getDb();
    const ref = db.collection(Collections.NOTEBOOKS).doc(notebookId);
    const doc = await ref.get();

    if (!doc.exists || doc.data()?.userId !== userId) return null;

    await ref.update({
        ...input,
        updatedAt: new Date()
    });

    return getNotebook(notebookId, userId);
}

/**
 * Delete a notebook and all its sources
 */
export async function deleteNotebook(notebookId: string, userId: string): Promise<boolean> {
    const db = getDb();
    const ref = db.collection(Collections.NOTEBOOKS).doc(notebookId);
    const doc = await ref.get();

    if (!doc.exists || doc.data()?.userId !== userId) return false;

    // Delete all sources in this notebook
    const sourcesSnapshot = await db
        .collection(Collections.SOURCES)
        .where('notebookId', '==', notebookId)
        .get();

    const batch = db.batch();
    sourcesSnapshot.docs.forEach(doc => batch.delete(doc.ref));
    batch.delete(ref);

    await batch.commit();
    return true;
}

/**
 * Increment source count
 */
export async function incrementSourceCount(notebookId: string, delta: number = 1): Promise<void> {
    const db = getDb();
    await db.collection(Collections.NOTEBOOKS).doc(notebookId).update({
        sourceCount: FieldValue.increment(delta),
        updatedAt: new Date()
    });
}
