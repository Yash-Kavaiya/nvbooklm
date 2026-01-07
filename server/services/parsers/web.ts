import * as cheerio from 'cheerio';

export interface ParsedWebPage {
    title: string;
    content: string;
    description?: string;
    url: string;
}

/**
 * Parse and extract main content from a web page URL
 */
export async function parseWebPage(url: string): Promise<ParsedWebPage> {
    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; nvbooklm/1.0; +https://nvbooklm.com)',
                'Accept': 'text/html,application/xhtml+xml'
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch page: ${response.statusText}`);
        }

        const html = await response.text();
        return parseHtml(html, url);
    } catch (error) {
        console.error('Web page parsing failed:', error);
        throw new Error(`Failed to parse web page: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Parse HTML content and extract main text
 */
export function parseHtml(html: string, url: string): ParsedWebPage {
    const $ = cheerio.load(html);

    // Remove unwanted elements
    $('script, style, nav, header, footer, aside, .nav, .header, .footer, .sidebar, .advertisement, .ads').remove();

    // Get title
    const title = $('title').text().trim() ||
        $('h1').first().text().trim() ||
        'Untitled';

    // Get meta description
    const description = $('meta[name="description"]').attr('content') ||
        $('meta[property="og:description"]').attr('content');

    // Try to find main content area
    let content = '';
    const mainSelectors = ['article', 'main', '[role="main"]', '.content', '.post-content', '.entry-content', '#content'];

    for (const selector of mainSelectors) {
        const element = $(selector);
        if (element.length > 0) {
            content = element.text();
            break;
        }
    }

    // Fallback to body if no main content found
    if (!content) {
        content = $('body').text();
    }

    // Clean up whitespace
    content = content
        .replace(/\s+/g, ' ')
        .replace(/\n\s*\n/g, '\n\n')
        .trim();

    return {
        title,
        content,
        description,
        url
    };
}
