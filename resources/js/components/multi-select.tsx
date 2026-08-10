import { Check, ChevronsUpDown, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export type MultiSelectOption = {
    value: string;
    label: string;
};

type MultiSelectProps = {
    options: MultiSelectOption[];
    value: string[];
    onChange: (value: string[]) => void;
    placeholder?: string;
    searchPlaceholder?: string;
    emptyText?: string;
    disabled?: boolean;
    icon?: React.ReactNode;
};

export function MultiSelect({
    options,
    value,
    onChange,
    placeholder = 'Pilih...',
    searchPlaceholder = 'Cari...',
    emptyText = 'Tidak ditemukan.',
    disabled,
    icon,
}: MultiSelectProps) {
    const [open, setOpen] = useState(false);

    const selected = options.filter((option) => value.includes(option.value));

    const toggle = (optionValue: string) => {
        onChange(
            value.includes(optionValue)
                ? value.filter((item) => item !== optionValue)
                : [...value, optionValue],
        );
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    disabled={disabled}
                    className="h-auto min-h-10 w-full justify-start rounded-xl border-border/70 bg-card/70 px-3 py-2 text-left font-normal shadow-sm backdrop-blur-xl"
                >
                    {icon ? (
                        <span className="mr-2 shrink-0 text-muted-foreground">
                            {icon}
                        </span>
                    ) : null}
                    {selected.length > 0 ? (
                        <span className="flex flex-1 flex-wrap gap-1.5">
                            {selected.map((option) => (
                                <span
                                    key={option.value}
                                    className="inline-flex items-center gap-1 rounded-md border border-primary/20 bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
                                >
                                    {option.label}
                                    <button
                                        type="button"
                                        aria-label={`Hapus ${option.label}`}
                                        className="text-primary/70 transition-colors hover:text-primary"
                                        onClick={(event) => {
                                            event.stopPropagation();
                                            toggle(option.value);
                                        }}
                                    >
                                        <X className="size-3" />
                                    </button>
                                </span>
                            ))}
                        </span>
                    ) : (
                        <span className="flex-1 text-sm text-muted-foreground">
                            {placeholder}
                        </span>
                    )}
                    <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent
                className="w-[var(--radix-popover-trigger-width)] p-0"
                align="start"
            >
                <Command>
                    <CommandInput
                        placeholder={searchPlaceholder}
                        className="h-9"
                    />
                    <CommandList>
                        <CommandEmpty>{emptyText}</CommandEmpty>
                        <CommandGroup>
                            {options.map((option) => (
                                <CommandItem
                                    key={option.value}
                                    value={option.value}
                                    onSelect={() => toggle(option.value)}
                                >
                                    {option.label}
                                    <Check
                                        className={cn(
                                            'ml-auto size-4',
                                            value.includes(option.value)
                                                ? 'opacity-100'
                                                : 'opacity-0',
                                        )}
                                    />
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
