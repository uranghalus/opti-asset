export const MAX_FILE_BYTES = 1024 * 1024;

const MAX_DIMENSION = 1600;

const JPEG_QUALITIES = [0.85, 0.7, 0.55, 0.4];

export function formatBytes(bytes: number): string {
    if (bytes < 1024) {
        return `${bytes} B`;
    }

    if (bytes < MAX_FILE_BYTES) {
        return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / MAX_FILE_BYTES).toFixed(2)} MB`;
}

function loadImage(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(file);
        const img = new Image();

        img.onload = () => {
            URL.revokeObjectURL(url);
            resolve(img);
        };
        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error('Gambar tidak dapat dibaca.'));
        };
        img.src = url;
    });
}

function toJpegFile(
    canvas: HTMLCanvasElement,
    quality: number,
    originalName: string,
): Promise<File> {
    return new Promise((resolve, reject) => {
        canvas.toBlob(
            (blob) => {
                if (!blob) {
                    reject(new Error('Gambar tidak dapat dikompres.'));

                    return;
                }

                const base = originalName.replace(/\.[^/.]+$/, '');

                resolve(
                    new File([blob], `${base}.jpg`, { type: 'image/jpeg' }),
                );
            },
            'image/jpeg',
            quality,
        );
    });
}

/**
 * Kompres gambar menjadi JPEG ≤ 1 MB. Gambar yang sudah ≤ 1 MB
 * (atau bukan format yang bisa digambar ke canvas) dikembalikan apa adanya.
 */
export async function compressImage(file: File): Promise<File> {
    if (!file.type.startsWith('image/') || file.size <= MAX_FILE_BYTES) {
        return file;
    }

    let img: HTMLImageElement;

    try {
        img = await loadImage(file);
    } catch {
        return file;
    }

    const scale = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height));
    const canvas = document.createElement('canvas');

    canvas.width = Math.max(1, Math.round(img.width * scale));
    canvas.height = Math.max(1, Math.round(img.height * scale));

    const ctx = canvas.getContext('2d');

    if (!ctx) {
        return file;
    }

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    for (const quality of JPEG_QUALITIES) {
        const output = await toJpegFile(canvas, quality, file.name);

        if (output.size <= MAX_FILE_BYTES) {
            return output;
        }
    }

    return toJpegFile(canvas, 0.35, file.name);
}
