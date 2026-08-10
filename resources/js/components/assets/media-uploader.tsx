import {
    CheckCircle2,
    CircleAlert,
    FileText,
    ImagePlus,
    Loader2,
    Trash2,
    UploadCloud,
} from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
    compressImage,
    formatBytes,
    MAX_FILE_BYTES,
} from '@/lib/image-compression';
import { cn } from '@/lib/utils';
import { upload as uploadRoute } from '@/routes/assets';

const ALLOWED_PHOTOS = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_DOCS = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv',
    'text/plain',
];

type PendingItem = {
    id: string;
    name: string;
    status: 'compressing' | 'uploading' | 'done' | 'error';
    progress: number;
    originalSize?: number;
    compressedSize?: number;
    url?: string;
    error?: string;
    xhr?: XMLHttpRequest;
    previewUrl?: string;
};

type MediaUploaderProps = {
    type: 'photo' | 'document';
    value: string[];
    onChange: (urls: string[]) => void;
    maxFiles?: number;
    onBusyChange?: (busy: boolean) => void;
};

function uploadFile(
    url: string,
    file: File,
    onProgress: (ratio: number) => void,
): Promise<{ url: string }> {
    return new Promise((resolve, reject) => {
        const formData = new FormData();

        formData.append('file', file);

        const token = decodeURIComponent(
            document.cookie.match(/(?:^|; )XSRF-TOKEN=([^;]+)/)?.[1] ?? '',
        );
        const xhr = new XMLHttpRequest();

        xhr.open('POST', url);
        xhr.setRequestHeader('Accept', 'application/json');
        xhr.setRequestHeader('X-XSRF-TOKEN', token);
        xhr.responseType = 'json';
        xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
                onProgress(event.loaded / event.total);
            }
        };
        xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                resolve(xhr.response as { url: string });

                return;
            }

            const data = xhr.response as
                | { errors?: Record<string, string[]>; message?: string }
                | undefined;
            const firstError = data?.errors
                ? Object.values(data.errors).flat()[0]
                : undefined;

            reject(new Error(firstError ?? data?.message ?? 'Upload gagal.'));
        };
        xhr.onerror = () => {
            reject(new Error('Gagal terhubung ke server.'));
        };
        xhr.onabort = () => {
            reject(new Error('Upload dibatalkan.'));
        };

        xhr.send(formData);
    });
}

export function MediaUploader({
    type,
    value,
    onChange,
    maxFiles = 10,
    onBusyChange,
}: MediaUploaderProps) {
    const inputId = useId();
    const inputRef = useRef<HTMLInputElement>(null);
    const valueRef = useRef(value);
    const [items, setItems] = useState<PendingItem[]>([]);
    const [dragging, setDragging] = useState(false);

    useEffect(() => {
        valueRef.current = value;
    });

    const isImage = type === 'photo';
    const acceptedTypes = isImage ? ALLOWED_PHOTOS : ALLOWED_DOCS;
    const accept = isImage
        ? 'image/jpeg,image/png,image/webp,image/gif'
        : '.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt';

    const busy = items.some(
        (item) => item.status === 'compressing' || item.status === 'uploading',
    );

    useEffect(() => {
        onBusyChange?.(busy);
    }, [busy, onBusyChange]);

    const updateItem = (id: string, patch: Partial<PendingItem>) => {
        setItems((prev) =>
            prev.map((item) => (item.id === id ? { ...item, ...patch } : item)),
        );
    };

    const uploadItem = (item: PendingItem, file: File) => {
        const run = async () => {
            try {
                const toUpload = isImage ? await compressImage(file) : file;

                updateItem(item.id, {
                    status: 'uploading',
                    progress: 0,
                    compressedSize: toUpload.size,
                });

                const { url } = await uploadFile(
                    uploadRoute().url,
                    toUpload,
                    (ratio) => updateItem(item.id, { progress: ratio }),
                );

                updateItem(item.id, { status: 'done', progress: 1, url });

                if (item.previewUrl) {
                    URL.revokeObjectURL(item.previewUrl);
                }

                onChange([...(valueRef.current ?? []), url]);
            } catch (error) {
                updateItem(item.id, {
                    status: 'error',
                    error:
                        error instanceof Error
                            ? error.message
                            : 'Upload gagal.',
                });
            }
        };

        void run();
    };

    const handleFiles = (files: File[]) => {
        const remaining = maxFiles - (valueRef.current.length + items.length);

        if (remaining <= 0) {
            toast.error(
                `Maksimal ${maxFiles} ${isImage ? 'foto' : 'dokumen'} per aset.`,
            );

            return;
        }

        const selected = files.slice(0, remaining);
        const newItems = selected
            .filter((file) => {
                if (!acceptedTypes.includes(file.type)) {
                    toast.error(`Format "${file.name}" tidak didukung.`);

                    return false;
                }

                if (!isImage && file.size > MAX_FILE_BYTES) {
                    toast.error(
                        `"${file.name}" melebihi 1 MB. Kompres file terlebih dahulu.`,
                    );

                    return false;
                }

                return true;
            })
            .map<PendingItem>((file) => ({
                id: crypto.randomUUID(),
                name: file.name,
                status: isImage ? 'compressing' : 'uploading',
                progress: 0,
                originalSize: file.size,
                previewUrl: isImage ? URL.createObjectURL(file) : undefined,
            }));

        setItems((prev) => [...prev, ...newItems]);

        selected.forEach((file, index) => {
            const item = newItems[index];

            if (item) {
                uploadItem(item, file);
            }
        });
    };

    const removeItem = (id: string) => {
        const item = items.find((i) => i.id === id);

        if (item?.status === 'uploading') {
            item.xhr?.abort();
        }

        if (item?.previewUrl) {
            URL.revokeObjectURL(item.previewUrl);
        }

        if (item?.url) {
            onChange(
                (valueRef.current ?? []).filter((url) => url !== item.url),
            );
        }

        setItems((prev) => prev.filter((i) => i.id !== id));
    };

    return (
        <div className="space-y-3">
            <div
                role="button"
                tabIndex={0}
                aria-label={`Unggah ${isImage ? 'foto' : 'dokumen'}`}
                onClick={() => inputRef.current?.click()}
                onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                        inputRef.current?.click();
                    }
                }}
                onDragOver={(event) => {
                    event.preventDefault();
                    setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(event) => {
                    event.preventDefault();
                    setDragging(false);
                    handleFiles(Array.from(event.dataTransfer.files));
                }}
                className={cn(
                    'group flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-7 text-center transition-all duration-200',
                    dragging
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/40 hover:bg-accent/40',
                    busy && 'pointer-events-none opacity-60',
                )}
            >
                <span
                    className={cn(
                        'flex size-11 items-center justify-center rounded-xl border shadow-sm transition-all duration-200 group-hover:scale-105',
                        dragging
                            ? 'border-primary/30 bg-primary/15 text-primary'
                            : 'border-primary/20 bg-primary/10 text-primary',
                    )}
                >
                    {isImage ? (
                        <ImagePlus className="size-5" strokeWidth={1.75} />
                    ) : (
                        <UploadCloud className="size-5" strokeWidth={1.75} />
                    )}
                </span>
                <p className="text-sm font-semibold text-foreground">
                    {isImage
                        ? 'Seret & lepas foto di sini, atau klik untuk memilih'
                        : 'Seret & lepas dokumen di sini, atau klik untuk memilih'}
                </p>
                <p className="text-xs text-muted-foreground">
                    {isImage
                        ? `JPG, PNG, WEBP, GIF · maks. ${maxFiles} foto · kompres otomatis ≤ 1 MB`
                        : 'PDF, DOC, DOCX, XLS, XLSX, CSV, TXT · maks. 1 MB per file'}
                </p>
                <input
                    ref={inputRef}
                    id={inputId}
                    type="file"
                    accept={accept}
                    multiple
                    className="hidden"
                    onChange={(event) => {
                        handleFiles(Array.from(event.target.files ?? []));
                        event.target.value = '';
                    }}
                />
            </div>

            {value.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {value.map((url) => (
                        <CommittedItem
                            key={url}
                            url={url}
                            isImage={isImage}
                            onRemove={() =>
                                onChange(
                                    (valueRef.current ?? []).filter(
                                        (u) => u !== url,
                                    ),
                                )
                            }
                        />
                    ))}
                </div>
            )}

            {items.length > 0 && (
                <ul className="space-y-2">
                    {items.map((item) => (
                        <PendingRow
                            key={item.id}
                            item={item}
                            onRemove={removeItem}
                        />
                    ))}
                </ul>
            )}
        </div>
    );
}

function CommittedItem({
    url,
    isImage,
    onRemove,
}: {
    url: string;
    isImage: boolean;
    onRemove: () => void;
}) {
    const name = url.split('/').at(-1) ?? 'File';

    return (
        <li className="relative w-24">
            {isImage ? (
                <img
                    src={url}
                    alt={name}
                    className="aspect-square w-24 rounded-xl border border-border/70 object-cover shadow-sm"
                />
            ) : (
                <div className="flex aspect-square w-24 flex-col items-center justify-center gap-1.5 rounded-xl border border-border/70 bg-background/60 text-muted-foreground shadow-sm">
                    <FileText className="size-6" strokeWidth={1.5} />
                    <span className="w-full truncate px-1 text-center text-[9px]">
                        {name}
                    </span>
                </div>
            )}
            <button
                type="button"
                aria-label="Hapus file"
                onClick={onRemove}
                className="absolute -top-1.5 -right-1.5 flex size-6 items-center justify-center rounded-full border border-border bg-background text-muted-foreground shadow-md transition-colors hover:bg-destructive hover:text-destructive-foreground"
            >
                <Trash2 className="size-3" />
            </button>
        </li>
    );
}

function PendingRow({
    item,
    onRemove,
}: {
    item: PendingItem;
    onRemove: (id: string) => void;
}) {
    const isDone = item.status === 'done';
    const hasError = item.status === 'error';
    const saving = item.status === 'compressing' || item.status === 'uploading';

    return (
        <li
            className={cn(
                'flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors',
                hasError
                    ? 'border-destructive/40 bg-destructive/5'
                    : isDone
                      ? 'border-emerald-500/25 bg-emerald-500/5'
                      : 'border-border/70 bg-background/50',
            )}
        >
            {item.previewUrl ? (
                <img
                    src={item.previewUrl}
                    alt={item.name}
                    className="size-10 shrink-0 rounded-lg border border-border/60 object-cover"
                />
            ) : (
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
                    <FileText className="size-4.5" strokeWidth={1.75} />
                </span>
            )}

            <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-xs font-semibold text-foreground">
                        {item.name}
                    </p>
                    {item.originalSize ? (
                        <span className="shrink-0 text-[10px] text-muted-foreground tabular-nums">
                            {item.compressedSize !== undefined &&
                            item.compressedSize < item.originalSize
                                ? `${formatBytes(item.originalSize)} → ${formatBytes(item.compressedSize)}`
                                : formatBytes(item.originalSize)}
                        </span>
                    ) : null}
                </div>

                {saving ? (
                    <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-muted">
                        <div
                            className="h-full rounded-full bg-primary transition-all duration-200"
                            style={{
                                width: `${
                                    item.status === 'compressing'
                                        ? 10
                                        : Math.round(item.progress * 100)
                                }%`,
                            }}
                        />
                    </div>
                ) : hasError ? (
                    <p className="mt-1 flex items-center gap-1 text-[11px] font-medium text-destructive">
                        <CircleAlert className="size-3 shrink-0" />
                        {item.error}
                    </p>
                ) : (
                    <p className="mt-1 flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="size-3 shrink-0" />
                        Siap digunakan
                    </p>
                )}
            </div>

            <div className="flex shrink-0 items-center gap-2">
                {item.status === 'compressing' && (
                    <Loader2 className="size-4 animate-spin text-primary" />
                )}
                {item.status === 'uploading' && (
                    <span className="text-[10px] font-semibold text-muted-foreground tabular-nums">
                        {Math.round(item.progress * 100)}%
                    </span>
                )}
                {isDone && <CheckCircle2 className="size-4 text-emerald-600" />}
                {!saving && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-7"
                        aria-label="Hapus file"
                        onClick={() => onRemove(item.id)}
                    >
                        <Trash2 className="size-3.5" />
                    </Button>
                )}
            </div>
        </li>
    );
}
