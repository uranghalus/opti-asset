import { useCallback, useState } from 'react';

/**
 * State yang bertahan antar kunjungan (localStorage, aman untuk SSR).
 * Nilai di-cache saat mount agar render pertama server/klien konsisten,
 * lalu efek membaca preferensi tersimpan setelah hidrasi.
 */
export function useLocalStorage<T extends string>(
    key: string,
    initialValue: T,
): [T, (value: T) => void] {
    const [value, setValue] = useState<T>(initialValue);
    const [hydrated, setHydrated] = useState(false);
    const [cached, setCached] = useState(initialValue);

    const set = useCallback(
        (next: T) => {
            setValue(next);
            // Cache dibawa juga, kalau tidak render membaca nilai lama
            // sampai reload (bug toggle Tabel/Kartu yang pernah dilaporkan).
            setCached(next);

            try {
                window.localStorage.setItem(key, next);
            } catch {
                // Storage penuh / diblokir — state sesi tetap berlaku.
            }
        },
        [key],
    );

    if (typeof window !== 'undefined' && !hydrated) {
        setHydrated(true);
        setCached((readValue(key) as T) ?? initialValue);
    }

    return [hydrated ? cached : value, set];
}

function readValue(key: string): string | null {
    try {
        return window.localStorage.getItem(key);
    } catch {
        return null;
    }
}
