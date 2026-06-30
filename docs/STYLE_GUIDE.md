# Internal Style Guide

This guide defines the conventions for every utility written in this library.
Copilot-generated functions **must** follow these rules before being committed.

---

## 1. File & Folder Layout

- One function per file.
- Filename: `kebab-case`, matching the exported function name.
  - `randomNumber` → `random-number.ts`
  - `capitalize` → `capitalize.ts`
- Domain folders live under `src/` (`array/`, `number/`, `string/`, …).
- Every domain folder has an `index.ts` that re-exports with `export * from`.
- The root `src/index.ts` re-exports all domain barrels.

---

## 2. Naming

| Thing | Convention | Example |
|---|---|---|
| Files | kebab-case | `clamp-number.ts` |
| Exported functions | camelCase | `clampNumber` |
| Types / interfaces | PascalCase | `ClampOptions` |
| Boolean parameters | prefix with `is` / `has` / `should` | `isSorted` |

- **No default exports.** Every export is named.
- Function names are verbs or verb-phrases that describe what is returned or done:
  `capitalize`, `randomNumber`, `chunkArray`, `clampNumber`.

---

## 3. TypeScript

- All parameters and return types must be **explicitly annotated** — rely on inference only inside function bodies.
- Prefer the narrowest type that is correct. Avoid `any`; use `unknown` when the type is genuinely unknown.
- Use `readonly` arrays (`readonly T[]`) for parameters that are not mutated.
- Use union types instead of overloads when the logic does not actually branch on types.
- Enable `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes` (already set in `tsconfig.json`).

---

## 4. JSDoc

Every exported function requires a JSDoc block with:

```ts
/**
 * One-sentence description — what the function returns or does.
 *
 * @param paramName - Description of the parameter.
 * @returns Description of the return value.
 * @throws {TypeError} When `paramName` is not of the expected type.
 * @throws {RangeError} When a numeric argument is outside an acceptable range.
 *
 * @example
 * functionName(arg1, arg2); // => expectedOutput
 */
```

Rules:
- The summary line must start with a capital letter and end with a period.
- `@param` lines use the format `@param name - description` (dash after the name).
- Include at least one `@example` that demonstrates the happy path.
- Add a second `@example` for non-obvious edge cases when helpful.
- Do **not** document `@returns` as `void`.
- JSDoc lives directly above the `export function` — no blank line between them.

---

## 5. Error & Edge-Case Handling

### When to throw

| Situation | Error type |
|---|---|
| Wrong argument type at runtime | `TypeError` |
| Numeric argument out of acceptable range | `RangeError` |
| Logically invalid combination of arguments | `RangeError` |

Throw with a descriptive message that names the parameter and states the constraint:

```ts
throw new RangeError('`min` must be less than or equal to `max`.');
throw new TypeError('`value` must be a non-empty string.');
```

### When NOT to throw

- Do not throw for predictable, non-error outcomes (e.g. an empty array returning `undefined`).
- Do not add guards for things TypeScript already prevents at compile time.

### Silent vs. strict

This library is **strict by default**: invalid input throws rather than silently returning a fallback.
If a lenient variant is needed, create a separate `*OrDefault` / `*OrNull` function and document the difference.

---

## 6. Null & Undefined Handling

- Functions accept `null` or `undefined` **only when it is explicitly part of the intended API**.
- When a parameter must not be `null`/`undefined`, TypeScript's strict types enforce this — do not add
  extra runtime `!= null` guards.
- When a function can legitimately produce "no result", return `T | undefined` (not `T | null`).
  Use `null` only when interoperating with APIs that require it.
- Never widen the return type to `T | undefined` just to avoid throwing — throw instead (see §5).

---

## 7. Purity & Side Effects

- All utilities must be **pure functions**: same inputs → same outputs, no side effects.
- Do not read from `process.env`, global state, or the DOM.
- Do not mutate input arguments. Return new values.

---

## 8. Code Style

- 4-space indentation (matches existing code).
- Single quotes for strings.
- No trailing commas in function parameter lists.
- Prefer `const` over `let`; never use `var`.
- Keep functions short. If a helper is needed inside the file, prefix it with `_` and do not export it.
