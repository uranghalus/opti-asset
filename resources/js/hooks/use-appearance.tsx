import { useEffect, useState } from 'react';

export type ResolvedAppearance = 'light' | 'dark';
export type Appearance = ResolvedAppearance | 'system';

export type UseAppearanceReturn = {
    readonly appearance: Appearance;
    readonly resolvedAppearance: ResolvedAppearance;
    readonly updateAppearance: (mode: Appearance) => void;
};

const prefersDark = (): boolean => {
    if (typeof window === 'undefined') {
        return false;
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
};

const setCookie = (name: string, value: string, days = 365): void => {
    if (typeof document === 'undefined') {
        return;
    }
    const maxAge = days * 24 * 60 * 60;
    document.cookie = `${name}=${value};path=/;max-age=${maxAge};SameSite=Lax`;
};

const getStoredAppearance = (): Appearance => {
    if (typeof window === 'undefined') {
        return 'system';
    }
    return (localStorage.getItem('appearance') as Appearance) || 'system';
};

const isDarkMode = (appearance: Appearance): boolean => {
    return appearance === 'dark' || (appearance === 'system' && prefersDark());
};

const applyTheme = (appearance: Appearance): void => {
    if (typeof document === 'undefined') {
        return;
    }
    const isDark = isDarkMode(appearance);
    document.documentElement.classList.toggle('dark', isDark);
    document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
};

const mediaQuery = (): MediaQueryList | null => {
    if (typeof window === 'undefined') {
        return null;
    }
    return window.matchMedia('(prefers-color-scheme: dark)');
};

const handleSystemThemeChange = (): void => {
    // Handled via the appearance state update in the consuming component
};

export function initializeTheme(): void {
    if (typeof window === 'undefined') {
        return;
    }
    if (!localStorage.getItem('appearance')) {
        localStorage.setItem('appearance', 'light');
        setCookie('appearance', 'light');
    }
};

export function useAppearance(): UseAppearanceReturn {
    // Always default to 'light' on both server and client initial render
    // to avoid hydration mismatches. localStorage is applied in useEffect.
    const [appearance, setAppearance] = useState<Appearance>('light');
    const [resolvedAppearance, setResolvedAppearance] = useState<ResolvedAppearance>(
        isDarkMode(appearance) ? 'dark' : 'light'
    );

    useEffect(() => {
        const stored = (localStorage.getItem('appearance') as Appearance) || 'light';
        setAppearance(stored);
        setResolvedAppearance(isDarkMode(stored) ? 'dark' : 'light');
        applyTheme(stored);

        const mq = mediaQuery();
        mq?.addEventListener('change', handleSystemThemeChange);
        return () => mq?.removeEventListener('change', handleSystemThemeChange);
    }, []);

    const updateAppearance = (mode: Appearance): void => {
        setAppearance(mode);
        setResolvedAppearance(isDarkMode(mode) ? 'dark' : 'light');
        localStorage.setItem('appearance', mode);
        setCookie('appearance', mode);
        applyTheme(mode);
    };

    return { appearance, resolvedAppearance, updateAppearance } as const;
}
