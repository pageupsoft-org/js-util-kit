# Browser Utilities Guide

Comprehensive guide for `js-util-kit` browser-specific utilities.

## Overview

The browser module provides utilities for device detection, clipboard operations, downloads, and navigation. All functions require browser APIs and work in modern browsers.

## Exports

| Function | Description | Use Case |
|----------|-------------|----------|
| `isMobileDevice` | Detect mobile via user agent | Responsive logic, feature flags |
| `isTouchDevice` | Detect touch capability | Hover vs tap interactions |
| `copyToClipboard` | Copy text programmatically | Copy-to-clipboard buttons |
| `downloadBlob` | Trigger blob download | Export, report generation |
| `downloadFile` | Download file from URL | File retrieval, asset downloads |
| `openInNewTab` | Open URL in new tab | External links, secure navigation |
| `scrollToElement` | Smooth scroll to element | SPA navigation, focus management |

---

## Prerequisites

🌍 **Browser Only** — all utilities require browser APIs. These do not work in Node.js.

---

## Function Details

### `isMobileDevice`

```typescript
isMobileDevice(): boolean
```

**What:** Detects mobile devices (Android, iPhone, iPad, tablet) via user agent string.

**When:** Serving mobile-specific UI, analytics, feature toggling.

**Why:** Server-side and client-side rendering may need different behavior for mobile.

**Example:**
```typescript
import { isMobileDevice } from 'js-util-kit';

if (isMobileDevice()) {
  enableMobileNavigation();
  setTouchOptimized(true);
}

// In React
const [isMobile, setIsMobile] = useState(isMobileDevice());

// In plain JS
if (isMobileDevice()) {
  document.body.classList.add('mobile');
} else {
  document.body.classList.add('desktop');
}
```

**Note:** User agent detection is not 100% reliable (users can spoof it). Prefer responsive CSS for layout decisions. Use this for feature capability detection.

---

### `isTouchDevice`

```typescript
isTouchDevice(): boolean
```

**What:** Checks for touch capability via `ontouchstart` in window or `maxTouchPoints` on navigator.

**When:** Hover vs tap interactions, gesture-based UI, pointer events.

**Why:** Prevents hover menus from being unusable on touchscreen devices.

**Example:**
```typescript
import { isTouchDevice } from 'js-util-kit';

// Adjust UI for touch
const useHover = !isTouchDevice();

// CSS class approach
if (isTouchDevice()) {
  document.documentElement.classList.add('touch-device');
} else {
  document.documentElement.classList.add('no-touch');
}

// In a tooltip component
function Tooltip({ children, text }: { children: React.ReactNode; text: string }) {
  const touchDevice = isTouchDevice();
  const [visible, setVisible] = useState(false);

  return (
    <div
      onMouseEnter={() => !touchDevice && setVisible(true)}
      onMouseLeave={() => !touchDevice && setVisible(false)}
      onTouchStart={() => touchDevice && setVisible(v => !v)}
    >
      {children}
      {visible && <div className="tooltip">{text}</div>}
    </div>
  );
}
```

---

### `copyToClipboard`

```typescript
copyToClipboard(text: string): Promise<boolean>
```

**What:** Copies text to the system clipboard using the Clipboard API.

**When:** Copy code snippets, share links, copy-to-clipboard buttons.

**Why:** More reliable than `document.execCommand('copy')` and supports async error handling.

**Example:**
```typescript
import { copyToClipboard } from 'js-util-kit';

// Basic usage
async function handleCopy() {
  const copied = await copyToClipboard('https://example.com');
  if (copied) {
    showToast('Link copied!');
  } else {
    showToast('Failed to copy');
  }
}

// Copy code snippet
async function copyCode() {
  const code = `const x = 42;`;
  await copyToClipboard(code);
}

// Fallback for older browsers
async function safeCopy(text: string): Promise<void> {
  const success = await copyToClipboard(text);
  if (!success) {
    // Fallback: select and execCommand (legacy)
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
  }
}

// React hook pattern
function useCopyToClipboard() {
  const copy = async (text: string) => {
    return await copyToClipboard(text);
  };
  return { copy };
}
```

**Returns:** `true` if copy succeeded, `false` if permission denied or unavailable.

**Permission Note:** The Clipboard API requires a secure context (HTTPS) and may show a permission prompt in some browsers.

---

### `downloadBlob`

```typescript
downloadBlob(data: Blob | Uint8Array | ArrayBuffer, filename: string, mimeType?: string): void
```

**What:** Creates a temporary URL and triggers a browser download of a blob.

**When:** Exporting reports, downloading generated files, saving user data.

**Why:** No server round-trip needed; files are generated client-side.

**Example:**
```typescript
import { downloadBlob } from 'js-util-kit';

// Download JSON data
const data = { users: [{ id: 1, name: 'John' }] };
const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
downloadBlob(blob, 'users-export.json');

// Download CSV
const csv = 'name,email\nJohn,john@example.com';
downloadBlob(new Blob([csv], { type: 'text/csv' }), 'contacts.csv');

// Download binary data (e.g., image from canvas)
const canvas = document.querySelector('canvas')!;
canvas.toBlob((blob) => {
  if (blob) downloadBlob(blob, 'screenshot.png', 'image/png');
});
```

---

### `downloadFile`

```typescript
downloadFile(url: string, filename?: string): Promise<void>
```

**What:** Fetches a file from a URL and triggers browser download.

**When:** Downloading assets, files, documents from your server.

**Why:** Simple API that handles fetching and triggering the browser download in one call.

**Example:**
```typescript
import { downloadFile } from 'js-util-kit';

// Download a PDF report
await downloadFile('/api/reports/invoice-123.pdf', 'invoice.pdf');

// Download an image
await downloadFile('https://example.com/photo.jpg', 'my-photo.jpg');

// Download without custom filename (uses server filename)
await downloadFile('/files/data.xlsx');
```

---

### `openInNewTab`

```typescript
openInNewTab(url: string): Window | null
```

**What:** Opens a URL in a new browser tab using `window.open`.

**When:** External links in components, opening docs, secure navigation.

**Why:** Ensures consistent behavior across browsers. Prevents `noopener` security issues (rel attribute).

**Example:**
```typescript
import { openInNewTab } from 'js-util-kit';

function handleExternalLink(url: string): void {
  openInNewTab(url);
}

// In a React component
function ExternalLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" onClick={() => openInNewTab(href)}>
      {children}
    </a>
  );
}
```

**Security:** The new window is opened with `noopener` to prevent `window.opener` access (reversal tabnabbing attack).

---

### `scrollToElement`

```typescript
scrollToElement(element: HTMLElement, options?: ScrollOptions): void

interface ScrollOptions {
  behavior?: 'auto' | 'smooth';
  block?: 'start' | 'center' | 'end' | 'nearest';
  inline?: 'start' | 'center' | 'end' | 'nearest';
  offset?: number;  // pixels offset from element top
}
```

**What:** Smoothly scrolls the page to a specific element.

**When:** Single-page application navigation, form focus after submission, scrolling to error messages.

**Why:** Native `scrollIntoView` lacks offset support and smooth scrolling consistency.

**Example:**
```typescript
import { scrollToElement } from 'js-util-kit';

// Scroll to error summary after form validation
function handleSubmit() {
  const firstError = document.querySelector('.error-message');
  if (firstError) {
    scrollToElement(firstError, { behavior: 'smooth', block: 'center', offset: -80 });
  }
}

// Scroll to a section after navigation
function navigateToSection(sectionId: string): void {
  const el = document.getElementById(sectionId);
  if (el) {
    scrollToElement(el, { behavior: 'smooth' });
  }
}

// Scroll to element with header offset (common for fixed navbars)
scrollToElement(targetEl, { offset: -64 }); // 64px for navbar height
```

---

## Common Patterns

### Responsive Feature Detection
```typescript
import { isMobileDevice, isTouchDevice } from 'js-util-kit';

function getDeviceCapabilities() {
  return {
    isMobile: isMobileDevice(),
    hasTouch: isTouchDevice(),
    hoverSupported: !isTouchDevice(),
    isTablet: isMobileDevice() && isTouchDevice() && window.innerWidth > 768,
  };
}
```

### Download Report
```typescript
import { downloadBlob } from 'js-util-kit';

async function exportReport(data: unknown): Promise<void> {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const timestamp = new Date().toISOString().split('T')[0];
  downloadBlob(blob, `report-${timestamp}.json`);
}
```

---

## Environment Compatibility

| Function | Browser | Node.js | Notes |
|----------|---------|---------|-------|
| `isMobileDevice` | Yes | No | UA string parsing |
| `isTouchDevice` | Yes | No | Requires `window` |
| `copyToClipboard` | Yes | No | Requires Clipboard API |
| `downloadBlob` | Yes | No | Requires `URL.createObjectURL` |
| `downloadFile` | Yes | No | Requires `fetch` and `URL` |
| `openInNewTab` | Yes | No | Requires `window.open` |
| `scrollToElement` | Yes | No | Requires DOM element |