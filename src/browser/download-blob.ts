/**
 * Triggers a download for a `Blob` in the browser.
 *
 * This is the browser-specific download helper and can be reused by any
 * future file-utility wrappers that need Blob download behavior.
 *
 * @param blob - The blob data to download. Returns `false` for null or undefined.
 * @param filename - The target file name. Returns `false` for null, undefined, or empty input.
 * @returns `true` when a download was triggered; otherwise `false`.
 *
 * @example
 * downloadBlob(new Blob(['content']), 'report.txt'); // => true
 */
export function downloadBlob(blob: Blob | null | undefined, filename: string | null | undefined): boolean {
    if (blob == null) return false;
    if (typeof filename !== 'string' || filename.trim().length === 0) return false;
    if (typeof window === 'undefined' || typeof document === 'undefined') return false;

    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = filename.trim();
    anchor.style.display = 'none';

    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(objectUrl);

    return true;
}