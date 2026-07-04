/**
 * Triggers a browser download for the provided blob.
 *
 * Uses a temporary anchor element and object URL, then revokes the URL after
 * triggering the download.
 *
 * @param blob - The file data to download. Returns `false` for null or undefined.
 * @param fileName - The target filename. Returns `false` for null, undefined, or empty values.
 * @returns `true` when a download trigger is executed; otherwise `false`.
 *
 * @example
 * downloadFile(new Blob(['hello']), 'hello.txt'); // => true
 */
export function downloadFile(
    blob: Blob | null | undefined,
    fileName: string | null | undefined
): boolean {
    if (blob == null) return false;
    if (typeof fileName !== 'string' || fileName.trim().length === 0) return false;

    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement('a');

    anchor.href = objectUrl;
    anchor.download = fileName.trim();
    anchor.style.display = 'none';

    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(objectUrl);

    return true;
}