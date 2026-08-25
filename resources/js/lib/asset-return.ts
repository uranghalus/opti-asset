/**
 * Remember-the-list helpers for the assets module.
 *
 * The asset list saves its full URL (page + filters) to sessionStorage so
 * Edit/Show/Create pages can send users back to the exact state they left,
 * and can hand a sanitized `return_to` target to the backend redirects.
 */
const STORAGE_KEY = 'assets:list-url';

export function rememberAssetListUrl(): void {
    try {
        sessionStorage.setItem(
            STORAGE_KEY,
            window.location.pathname + window.location.search,
        );
    } catch {
        // sessionStorage unavailable (private mode) — fall back silently.
    }
}

export function assetListUrl(): string {
    try {
        const saved = sessionStorage.getItem(STORAGE_KEY);

        if (
            saved !== null &&
            saved.startsWith('/') &&
            !saved.startsWith('//')
        ) {
            return saved;
        }
    } catch {
        // ignore
    }

    return '/assets';
}

/** Append the remembered list URL as a safe `return_to` query param. */
export function withReturnTo(url: string): string {
    const separator = url.includes('?') ? '&' : '?';

    return `${url}${separator}return_to=${encodeURIComponent(assetListUrl())}`;
}

/** Sanitized `return_to` from the current page URL, or null when absent/unsafe. */
export function currentReturnTo(): string | null {
    const value = new URLSearchParams(window.location.search).get('return_to');

    if (
        value === null ||
        !value.startsWith('/') ||
        value.startsWith('//') ||
        value.startsWith('/\\')
    ) {
        return null;
    }

    return value;
}
