import { YoutubeTranscript } from 'youtube-transcript';

export interface ParsedYouTube {
    title: string;
    transcript: string;
    videoId: string;
    segments: TranscriptSegment[];
}

export interface TranscriptSegment {
    text: string;
    offset: number;
    duration: number;
}

/**
 * Extract transcript from YouTube video URL
 */
export async function parseYouTubeVideo(url: string): Promise<ParsedYouTube> {
    const videoId = extractVideoId(url);
    if (!videoId) {
        throw new Error('Invalid YouTube URL');
    }

    try {
        const transcriptData = await YoutubeTranscript.fetchTranscript(videoId);

        const segments: TranscriptSegment[] = transcriptData.map(item => ({
            text: item.text,
            offset: item.offset,
            duration: item.duration
        }));

        // Combine all transcript text
        const transcript = segments.map(s => s.text).join(' ');

        // Try to get video title (fetch from oEmbed)
        const title = await fetchVideoTitle(videoId);

        return {
            title,
            transcript,
            videoId,
            segments
        };
    } catch (error) {
        console.error('YouTube transcript extraction failed:', error);
        throw new Error(`Failed to extract transcript: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Extract video ID from various YouTube URL formats
 */
export function extractVideoId(url: string): string | null {
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
        /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/
    ];

    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
    }

    return null;
}

/**
 * Fetch video title from YouTube oEmbed API
 */
async function fetchVideoTitle(videoId: string): Promise<string> {
    try {
        const response = await fetch(
            `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
        );

        if (response.ok) {
            const data = await response.json();
            return data.title || 'YouTube Video';
        }
    } catch {
        // Ignore errors, return default
    }

    return 'YouTube Video';
}
