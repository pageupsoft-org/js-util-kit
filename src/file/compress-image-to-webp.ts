import { formatFileSize } from './format-file-size.js';

export type CompressImageResult = 
  | { 
      success: true; 
      file: File;
      originalSizeInBytes: number;
      compressedSizeInBytes: number;
      width: number;
      height: number;
      savingsPercentage: number;
    }
  | { success: false; error: string };

/**
 * Compresses an image file by converting it to WebP format using Canvas API.
 * Designed for browser environments.
 * Logs original and compressed file sizes to the console.
 * 
 * @param file - The image file to compress.
 * @param quality - The image quality between 0.1 and 1.0 (defaults to 0.7). Lower values yield higher compression (smaller file size) but lower visual quality. Higher values yield better visual quality but larger file sizes. If a value outside this range is provided, it falls back to 0.7.
 * @returns A promise resolving to a success or failure result object.
 */
export async function compressImageToWebp(
  file: File,
  quality: number = 0.7
): Promise<CompressImageResult> {
  // Validate quality (fallback to 0.7 if outside 0.1-1.0 range)
  const finalQuality = (typeof quality === 'number' && quality >= 0.1 && quality <= 1.0) 
    ? quality 
    : 0.7;

  // Early validation
  if (!file || !file.type?.startsWith('image/')) {
    return { success: false, error: 'Invalid file type. Only images are supported.' };
  }

  return new Promise((resolve) => {
    // Ensure we are in a browser environment before using DOM APIs
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      resolve({ success: false, error: 'This function can only be used in a browser environment.' });
      return;
    }

    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve({ success: false, error: 'Failed to get canvas context.' });
        return;
      }

      ctx.drawImage(img, 0, 0);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve({ success: false, error: 'Failed to compress image.' });
            return;
          }

          const originalSize = file.size;
          const compressedSize = blob.size;
          const savings = ((originalSize - compressedSize) / originalSize) * 100;

          console.log(
            `[ImageCompression] "${file.name}" | Original: ${formatFileSize(originalSize)} | Compressed (WebP): ${formatFileSize(compressedSize)} | Savings: ${savings.toFixed(1)}%`
          );

          // Create a new File with .webp extension
          const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
          const compressedFile = new File([blob], `${nameWithoutExt}.webp`, {
            type: 'image/webp',
          });

          resolve({ 
            success: true, 
            file: compressedFile,
            originalSizeInBytes: originalSize,
            compressedSizeInBytes: compressedSize,
            width: canvas.width,
            height: canvas.height,
            savingsPercentage: Number(savings.toFixed(2))
          });
        },
        'image/webp',
        finalQuality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({ success: false, error: `Failed to load image: ${file.name}` });
    };

    img.src = url;
  });
}
