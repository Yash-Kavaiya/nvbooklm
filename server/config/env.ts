/**
 * Environment configuration with validation
 */
export const env = {
    // Server
    PORT: parseInt(process.env.PORT || '3000', 10),
    NODE_ENV: process.env.NODE_ENV || 'development',

    // Firebase
    FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID || '',
    GOOGLE_APPLICATION_CREDENTIALS: process.env.GOOGLE_APPLICATION_CREDENTIALS,

    // Qdrant
    QDRANT_URL: process.env.QDRANT_URL || 'http://localhost:6333',
    QDRANT_API_KEY: process.env.QDRANT_API_KEY,

    // Gemini AI
    GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',

    // CORS
    CORS_ORIGINS: (process.env.CORS_ORIGINS || 'http://localhost:4200,http://localhost:3000').split(',')
} as const;

/**
 * Validate required environment variables
 */
export function validateEnv(): void {
    const required = ['FIREBASE_PROJECT_ID', 'GEMINI_API_KEY'];
    const missing = required.filter(key => !process.env[key]);

    if (missing.length > 0 && env.NODE_ENV === 'production') {
        throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }

    if (missing.length > 0) {
        console.warn(`⚠️ Missing env vars (dev mode): ${missing.join(', ')}`);
    }
}
