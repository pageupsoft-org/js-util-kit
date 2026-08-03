# Contributing

Thanks for contributing to `@rsiddha/js-utils`.

Read the [Style Guide](docs/STYLE_GUIDE.md) before writing any code. Every pull request is held to those conventions.

---

## Setup

```bash
npm install
npm run build       # compile once
npm run dev         # watch mode
```

---

## Adding a New Utility

Follow these steps exactly — they keep the barrel exports and structure consistent.

### 1. Identify the domain

Pick the folder that best matches the input type: `array/`, `number/`, `string/`.
If no folder fits, propose a new domain in your PR description.

### 2. Create the file

`src/<domain>/<function-name-in-kebab-case>.ts`

```ts
/**
 * One-sentence description.
 *
 * @param value - Description.
 * @returns Description.
 * @throws {TypeError} When `value` is not …
 *
 * @example
 * myFunction('hello'); // => 'HELLO'
 */
export function myFunction(value: string): string {
    // implementation
}
```

See [docs/STYLE_GUIDE.md](docs/STYLE_GUIDE.md) for the full JSDoc contract, naming rules, and error-handling policy.

### 3. Export from the domain barrel

Add to `src/<domain>/index.ts`:

```ts
export * from './<function-name-in-kebab-case>.js';
```

> Use the `.js` extension — the project uses ESM (`"type": "module"`) with `"module": "nodenext"`.

### 4. Verify the build

```bash
npm test -- --runInBand
npm run build
```

Tests and build must pass without errors.

---

## Pull Request Checklist

- [ ] File is named in `kebab-case` and placed in the correct domain folder.
- [ ] Function is named in `camelCase` and is a named export (no default exports).
- [ ] Full JSDoc block present: summary, `@param`, `@returns`, at least one `@example`.
- [ ] Invalid inputs throw `TypeError` or `RangeError` with a descriptive message.
- [ ] Function is pure — no mutation of inputs, no side effects.
- [ ] `null`/`undefined` are not accepted unless explicitly part of the API contract.
- [ ] Domain barrel (`index.ts`) updated.
- [ ] `npm test -- --runInBand` passes cleanly.
- [ ] `npm run build` passes cleanly.

---

## What Does Not Belong Here

- Functions that read from the DOM, `process.env`, or any global state.
- Wrappers around third-party libraries (this library has zero runtime dependencies by design).
- Functions that mutate their arguments.
