import { downloadBlob } from './download-blob.js';

/**
 * Fetches a file from a URL and triggers a browser download.
 *
 * @param url - The URL to fetch the file from.
 * @param filename - Optional custom filename for the download.
 * @returns A promise that resolves when the download is triggered.
 * @throws {TypeError} When `url` is not a non-empty string.
 * @throws {Error} When called outside a browser environment (no `window`/`document`).
 *
 * @example
 * await downloadFile('/api/reports/invoice-123.pdf', 'invoice.pdf');
 * @example
 * await downloadFile('https://example.com/photo.jpg', 'my-photo.jpg');
 * @example
 * await downloadFile('/files/data.xlsx'); // uses server-provided filename
 */
export async function downloadFile(url: string, filename?: string): Promise<void> {
    if (!url || typeof url !== 'string') {
        throw new TypeError('URL must be a non-empty string');
    }
    if (typeof window === 'undefined' || typeof document === 'undefined') {
        throw new Error('downloadFile is only available in a browser environment.');
    }

    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
    }

    const blob = await response.blob();

    // Try to extract filename from response headers if not provided
    let finalFilename = filename;
    if (!finalFilename) {
        const contentDisposition = response.headers.get('content-disposition');
        if (contentDisposition) {
            const match = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
            if (match && match[1]) {
                finalFilename = match[1].replace(/['"]/g, '');
            }
        }
    }

    // Fallback to URL-based filename
    if (!finalFilename) {
        const urlPath = new URL(url, window.location.origin).pathname;
        finalFilename = urlPath.split('/').pop() || 'download';
    }

    downloadBlob(blob, finalFilename);
}