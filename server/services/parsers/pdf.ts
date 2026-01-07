import pdfParse from 'pdf-parse';

export interface ParsedPdf {
    text: string;
    pageCount: number;
    info: {
        title?: string;
        author?: string;
    };
}

/**
 * Parse PDF buffer and extract text content
 */
export async function parsePdf(buffer: Buffer): Promise<ParsedPdf> {
    try {
        const data = await pdfParse(buffer);

        return {
            text: data.text.trim(),
            pageCount: data.numpages,
            info: {
                title: data.info?.Title,
                author: data.info?.Author
            }
        };
    } catch (error) {
        console.error('PDF parsing failed:', error);
        throw new Error(`Failed to parse PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Parse PDF from URL
 */
export async function parsePdfFromUrl(url: string): Promise<ParsedPdf> {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to fetch PDF: ${response.statusText}`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    return parsePdf(buffer);
}
