import { Check, ChevronsUpDown } from 'lucide-react';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Option } from '@/types';

export interface SmartSelectProps {
    options: Option[];
    item?: Option | undefined;
    setItem?: (item: Option | undefined) => void;
    value?: string;
    onValueChange?: (value: string) => void;
    placeholder?: string;
    searchPlaceholder?: string;
    emptyMessage?: string;
    className?: string;
    disabled?: boolean;
    tabIndex?: number;
    clearable?: boolean;
}

export default function SmartSelect({
    options,
    item,
    setItem,
    value,
    onValueChange,
    placeholder = 'Select item...',
    searchPlaceholder = 'Search item...',
    emptyMessage = 'No item found.',
    className,
    disabled = false,
    tabIndex,
    clearable = false,
}: SmartSelectProps) {
    const [open, setOpen] = React.useState(false);

    const currentItem = React.useMemo(() => {
        if (item !== undefined) {
            return item;
        }
        if (value !== undefined) {
            return options.find((option) => option.value === value);
        }
        return undefined;
    }, [item, value, options]);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    disabled={disabled}
                    tabIndex={tabIndex}
                    className={cn('w-full justify-between font-normal', className)}
                >
                    <span className="truncate">{currentItem ? currentItem.label : placeholder}</span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] min-w-[240px] p-0" align="start">
                <Command>
                    <CommandInput
                        placeholder={searchPlaceholder}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.stopPropagation();
                            }
                        }}
                    />
                    <CommandList>
                        <CommandEmpty>{emptyMessage}</CommandEmpty>
                        <CommandGroup>
                            {options.map((option) => {
                                const isSelected = currentItem?.value === option.value;
                                return (
                                    <CommandItem
                                        className="flex cursor-pointer items-center justify-between py-2 text-sm"
                                        key={option.value}
                                        value={`${option.label} ${option.description || ''} ${option.value}`}
                                        onSelect={() => {
                                            if (clearable && isSelected) {
                                                setItem?.(undefined);
                                                onValueChange?.('');
                                            } else {
                                                setItem?.(option);
                                                onValueChange?.(option.value);
                                            }
                                            setOpen(false);
                                        }}
                                    >
                                        <div className="flex items-center gap-2 truncate">
                                            <Check className={cn('h-4 w-4 shrink-0', isSelected ? 'opacity-100' : 'opacity-0')} />
                                            <div className="flex flex-col truncate">
                                                <span className="truncate">{option.label}</span>
                                                {option.description && (
                                                    <span className="text-muted-foreground truncate text-xs">{option.description}</span>
                                                )}
                                            </div>
                                        </div>
                                    </CommandItem>
                                );
                            })}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
