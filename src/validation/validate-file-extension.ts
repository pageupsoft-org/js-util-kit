/**
 * Returns `true` when the filename has an allowed extension.
 *
 * Extension matching is case-insensitive and supports allowed values with or
 * without a leading dot.
 *
 * @param fileName - The filename to validate. Returns `false` for null or undefined.
 * @param allowedExtensions - The list of allowed extensions. Returns `false` for null or undefined.
 * @returns `true` when the filename extension is in the allowed list; otherwise `false`.
 *
 * @example
 * validateFileExtension('report.PDF', ['pdf', '.docx']); // => true
 */
export function validateFileExtension(
    fileName: string | null | undefined,
    allowedExtensions: readonly string[] | null | undefined
): boolean {
    if (fileName == null || allowedExtensions == null || allowedExtensions.length === 0) {
        return false;
    }

    const normalizedFileName = fileName.trim();
    if (normalizedFileName.length === 0) return false;

    const dotIndex = normalizedFileName.lastIndexOf('.');
    if (dotIndex === -1 || dotIndex === normalizedFileName.length - 1) return false;

    const fileExtension = normalizedFileName.slice(dotIndex + 1).toLowerCase();
    const normalizedAllowedExtensions = allowedExtensions
        .map((extension) => extension.trim().replace(/^\./, '').toLowerCase())
        .filter((extension) => extension.length > 0);

    return normalizedAllowedExtensions.includes(fileExtension);
}