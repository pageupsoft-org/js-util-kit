/**
 * Returns the file extension from a filename.
 *
 * For names with multiple dots, only the final segment is returned. Returns an
 * empty string when no extension is present.
 *
 * @param fileName - The filename to inspect. Returns an empty string for null or undefined.
 * @returns The extension without a leading dot, or an empty string.
 *
 * @example
 * getFileExtension('archive.tar.gz'); // => 'gz'
 */
export function getFileExtension(fileName: string | null | undefined): string {
    if (typeof fileName !== 'string') return '';

    const normalizedFileName = fileName.trim();
    if (normalizedFileName.length === 0) return '';

    const lastDotIndex = normalizedFileName.lastIndexOf('.');
    if (lastDotIndex <= 0 || lastDotIndex === normalizedFileName.length - 1) {
        return '';
    }

    return normalizedFileName.slice(lastDotIndex + 1);
}