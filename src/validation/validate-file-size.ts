/**
 * Returns `true` when the file size is less than or equal to the given maximum.
 *
 * Works with browser-compatible `File` and `Blob` objects.
 *
 * @param file - The file/blob to validate. Returns `false` for null or undefined.
 * @param maxSizeInBytes - The maximum allowed size in bytes.
 * @returns `true` when `file.size` is within the limit; otherwise `false`.
 *
 * @example
 * validateFileSize(new Blob(['abc']), 5); // => true
 */
export function validateFileSize(
    file: Blob | null | undefined,
    maxSizeInBytes: number
): boolean {
    if (file == null) return false;
    if (!Number.isFinite(maxSizeInBytes) || maxSizeInBytes < 0) return false;

    return file.size <= maxSizeInBytes;
}