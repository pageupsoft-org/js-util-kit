const FILE_SIZE_UNITS = ['B', 'KB', 'MB', 'GB', 'TB'];

/**
 * Formats a byte value into a human-readable file-size string.
 *
 * Uses binary units (base 1024): B, KB, MB, GB, TB.
 *
 * @param bytes - The byte value to format. Returns `'0 B'` for null, undefined, negative, or non-finite values.
 * @returns A human-readable file-size string.
 *
 * @example
 * formatFileSize(1572864); // => '1.5 MB'
 */
export function formatFileSize(bytes: number | null | undefined): string {
    if (typeof bytes !== 'number' || !Number.isFinite(bytes) || bytes < 0) {
        return '0 B';
    }

    if (bytes === 0) return '0 B';

    const unitIndex = Math.min(
        Math.floor(Math.log(bytes) / Math.log(1024)),
        FILE_SIZE_UNITS.length - 1
    );
    const value = bytes / 1024 ** unitIndex;
    const formattedValue = value >= 10 || unitIndex === 0
        ? value.toFixed(0)
        : value.toFixed(1);

    return `${formattedValue} ${FILE_SIZE_UNITS[unitIndex]}`;
}