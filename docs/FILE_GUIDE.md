# File Utilities Guide

Comprehensive guide for `js-util-kit` file utilities.

## Overview

The file module provides utilities for working with files and file metadata. Some functions are universal (work everywhere) while others require browser APIs.

## Exports

| Function | Environment | Description |
|----------|------------|-------------|
| `getFileExtension` | Universal | Extract file extension from path |
| `formatFileSize` | Universal | Format bytes as human-readable string |
| `downloadFile` | Browser Only | Download file from URL |
| `convertFileToBase64` | Browser Only | Convert File/Blob to base64 string |

---

## Prerequisites

| Function | Browser | Node.js |
|----------|---------|---------|
| `getFileExtension` | Yes | Yes |
| `formatFileSize` | Yes | Yes |
| `downloadFile` | Yes | No |
| `convertFileToBase64` | Yes | No |

---

## Function Details

### `getFileExtension`

```typescript
getFileExtension(filepath: string): string | undefined
```

**What:** Extracts the file extension (including the dot) from a file path or filename.

**When:** Validating uploads, determining file type, routing by extension.

**Why:** Consistent, reliable extension extraction without regex hand-rolling.

**Example:**
```typescript
import { getFileExtension } from 'js-util-kit';

getFileExtension('photo.jpg');            // '.jpg'
getFileExtension('/path/to/document.pdf'); // '.pdf'
getFileExtension('archive.tar.gz');       // '.gz'
getFileExtension('noextension');          // undefined
getFileExtension('.hidden');              // undefined
getFileExtension('file.name.with.dots.ts'); // '.ts'
getFileExtension('');                      // undefined
```

---

### `formatFileSize`

```typescript
formatFileSize(bytes: number): string
```

**What:** Converts bytes to a human-readable string (B, KB, MB, GB, TB).

**When:** Displaying file sizes in UIs, upload progress, storage usage.

**Why:** Consistent formatting with appropriate units and precision.

**Example:**
```typescript
import { formatFileSize } from 'js-util-kit';

formatFileSize(0);                  // '0 B'
formatFileSize(500);                // '500 B'
formatFileSize(1024);               // '1 KB'
formatFileSize(1536);               // '1.5 KB'
formatFileSize(1048576);            // '1 MB'
formatFileSize(1073741824);         // '1 GB'
formatFileSize(5368709120);         // '5 GB'
formatFileSize(1099511627776);      // '1 TB'

// Large file
formatFileSize(2684354560);         // '2.5 GB'
```

---

### `downloadFile`

```typescript
downloadFile(url: string, filename?: string): Promise<void>
```

**What:** Fetches a file from a URL and triggers a browser download.

**When:** Downloading documents, images, reports, user-generated files.

**Why:** Single API call handles fetch + trigger download workflow.

**Example:**
```typescript
import { downloadFile } from 'js-util-kit';

// Download a PDF
await downloadFile('/api/reports/invoice-123.pdf', 'invoice.pdf');

// Download a generated chart
await downloadFile('/api/charts/sales-2026.png', 'sales-chart.png');

// Download without custom filename
await downloadFile('/files/data.xlsx');
```

---

### `convertFileToBase64`

```typescript
convertFileToBase64(file: File | Blob): Promise<string>
```

**What:** Reads a `File` or `Blob` and returns a base64-encoded data URL string.

**When:** Previewing images before upload, sending files to APIs that expect base64, embedding files in HTML/email.

**Why:** Avoids manual `FileReader` promise wrapping.

**Example:**
```typescript
import { convertFileToBase64 } from 'js-util-kit';

// Image preview before upload
async function handleFileSelect(input: HTMLInputElement): Promise<void> {
  const file = input.files?.[0];
  if (!file) return;

  const base64 = await convertFileToBase64(file);
  // base64 = 'data:image/jpeg;base64,/9j/4AAQSkZJRg...'

  // Show preview
  const img = document.createElement('img');
  img.src = base64;
  document.body.appendChild(img); // Shows image preview
}

// Upload to API expecting base64
async function uploadImage(file: File): Promise<void> {
  const base64 = await convertFileToBase64(file);
  await fetch('/api/upload', {
    method: 'POST',
    body: JSON.stringify({ data: base64, filename: file.name }),
  });
}
```

---

## Common Patterns

### File Upload Validation
```typescript
import { getFileExtension, formatFileSize, validateFileExtension, validateFileSize } from 'js-util-kit';

function validateUpload(file: File): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  const extCheck = validateFileExtension(file.name, ['.jpg', '.jpeg', '.png', '.webp', '.pdf']);
  if (!extCheck.valid) {
    errors.push(`Invalid file type. Allowed: ${extCheck.extension}. Allowed: .jpg, .jpeg, .png, .webp, .pdf`);
  }

  const sizeCheck = validateFileSize(file.size, { maxBytes: 10 * 1024 * 1024 });
  if (!sizeCheck.valid) {
    errors.push(`File too large. Max: ${formatFileSize(sizeCheck.maxBytes)}`);
  }

  return { valid: errors.length === 0, errors };
}
```

### File Size Display with Progress
```typescript
import { formatFileSize } from 'js-util-kit';

function renderUploadProgress(bytesLoaded: number, bytesTotal: number): string {
  const pct = Math.round((bytesLoaded / bytesTotal) * 100);
  const loadedStr = formatFileSize(bytesLoaded);
  const totalStr = formatFileSize(bytesTotal);
  return `${loadedStr} / ${totalStr} (${pct}%)`;
}
```

---

## Environment Compatibility

| Function | Browser | Node.js | Dependencies |
|----------|---------|---------|--------------|
| `getFileExtension` | Yes | Yes | None |
| `formatFileSize` | Yes | Yes | None |
| `downloadFile` | Yes | No | fetch API |
| `convertFileToBase64` | Yes | No | FileReader API |