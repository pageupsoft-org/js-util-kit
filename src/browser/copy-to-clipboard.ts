/**
 * Copies text to the system clipboard.
 *
 * Uses the asynchronous Clipboard API when available and falls back to
 * `document.execCommand('copy')` for older browser environments.
 *
 * @param text - The text to copy. Returns `false` for null, undefined, or empty input.
 * @returns A promise that resolves to `true` on success; otherwise `false`.
 *
 * @example
 * await copyToClipboard('hello world'); // => true
 */
export async function copyToClipboard(text: string | null | undefined): Promise<boolean> {
    if (typeof text !== 'string' || text.length === 0) return false;
    if (typeof navigator === 'undefined' || typeof document === 'undefined') return false;

    if (navigator.clipboard?.writeText) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch {
            // Gracefully continue to the documented execCommand fallback.
        }
    }

    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    textarea.style.pointerEvents = 'none';

    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    textarea.setSelectionRange(0, textarea.value.length);

    let copied = false;
    if (typeof document.execCommand === 'function') {
        try {
            copied = document.execCommand('copy');
        } catch {
            copied = false;
        }
    }

    document.body.removeChild(textarea);
    return copied;
}