/**
 * Converts a file/blob to a Base64 data URL string.
 *
 * Uses `FileReader.readAsDataURL` and rejects with a clear error message when
 * input is invalid or file reading fails.
 *
 * @param file - The file/blob to convert. Rejects for null or undefined input.
 * @returns A promise resolving to a Base64 data URL string.
 *
 * @example
 * await convertFileToBase64(new Blob(['hello'], { type: 'text/plain' }));
 */
export function convertFileToBase64(file: Blob | null | undefined): Promise<string> {
    if (!(file instanceof Blob)) {
        return Promise.reject(new Error('`file` must be a Blob or File instance.'));
    }

    return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => {
            if (typeof reader.result === 'string') {
                resolve(reader.result);
                return;
            }

            reject(new Error('Failed to convert file to Base64 string.'));
        };

        reader.onerror = () => {
            reject(new Error('Failed to read file as Base64.'));
        };

        reader.readAsDataURL(file);
    });
}