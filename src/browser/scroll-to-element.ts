/**
 * Scrolls the page to a target element by id.
 *
 * Does nothing and returns `false` when the element id is invalid, the element
 * does not exist, or when running outside a browser environment.
 *
 * @param elementId - The id of the target element.
 * @param options - Optional `scrollIntoView` behavior settings.
 * @returns `true` when scrolling was triggered; otherwise `false`.
 *
 * @example
 * scrollToElement('top', { behavior: 'smooth', block: 'start' }); // => true
 */
export function scrollToElement(
    elementId: string | null | undefined,
    options?: ScrollIntoViewOptions
): boolean {
    if (typeof elementId !== 'string' || elementId.trim().length === 0) return false;
    if (typeof document === 'undefined') return false;

    const element = document.getElementById(elementId.trim());
    if (element == null) return false;

    element.scrollIntoView(options);
    return true;
}