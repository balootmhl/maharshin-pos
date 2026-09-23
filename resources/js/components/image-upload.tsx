import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { ImagePlus, Trash2, UploadCloud, X } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

interface ImageUploadProps {
    label?: string;
    description?: string;
    value?: File | null;
    initialUrl?: string | null;
    onChange: (file: File | null) => void;
    onRemove?: () => void;
    error?: string;
    className?: string;
    maxSizeMB?: number;
}

export default function ImageUpload({
    label = 'Branch Logo',
    description = 'Square 1:1 format recommended. PNG, JPG, WebP or SVG up to 2MB.',
    value,
    initialUrl,
    onChange,
    onRemove,
    error,
    className,
    maxSizeMB = 2,
}: ImageUploadProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(initialUrl || null);
    const [isDragging, setIsDragging] = useState(false);
    const [localError, setLocalError] = useState<string | null>(null);

    // Sync preview with initialUrl or value
    useEffect(() => {
        if (value) {
            const objectUrl = URL.createObjectURL(value);
            setPreviewUrl(objectUrl);
            return () => URL.revokeObjectURL(objectUrl);
        } else if (initialUrl) {
            setPreviewUrl(initialUrl);
        } else {
            setPreviewUrl(null);
        }
    }, [value, initialUrl]);

    const handleFileValidation = (file: File): boolean => {
        setLocalError(null);

        if (!file.type.startsWith('image/')) {
            setLocalError('Please upload an image file (PNG, JPG, WebP, SVG).');
            return false;
        }

        if (file.size > maxSizeMB * 1024 * 1024) {
            setLocalError(`File size must be less than ${maxSizeMB}MB.`);
            return false;
        }

        return true;
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && handleFileValidation(file)) {
            onChange(file);
        }
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);

        const file = e.dataTransfer.files?.[0];
        if (file && handleFileValidation(file)) {
            onChange(file);
        }
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        setPreviewUrl(null);
        setLocalError(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        onChange(null);
        if (onRemove) {
            onRemove();
        }
    };

    const triggerUpload = () => {
        fileInputRef.current?.click();
    };

    const displayError = error || localError;

    return (
        <div className={cn('space-y-2', className)}>
            {label && <Label className="text-sm font-semibold">{label}</Label>}

            <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                className="hidden"
                onChange={handleFileChange}
            />

            {previewUrl ? (
                /* Preview State */
                <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                    <div className="relative group size-24 sm:size-28 shrink-0 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 shadow-xs flex items-center justify-center">
                        <img
                            src={previewUrl}
                            alt="Logo preview"
                            className="size-full object-contain p-1 transition-transform duration-200 group-hover:scale-105"
                        />
                    </div>

                    <div className="flex-1 text-center sm:text-left space-y-1">
                        <div className="text-sm font-medium text-slate-800 dark:text-slate-200">
                            {value ? value.name : 'Branch Logo'}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {value ? `${(value.size / 1024).toFixed(1)} KB` : 'Active Logo Image'}
                        </p>

                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={triggerUpload}
                                className="h-8 gap-1.5 text-xs font-medium"
                            >
                                <ImagePlus className="h-3.5 w-3.5" />
                                Change Photo
                            </Button>
                            <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                onClick={handleClear}
                                className="h-8 gap-1.5 text-xs font-medium"
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                                Remove
                            </Button>
                        </div>
                    </div>
                </div>
            ) : (
                /* Dropzone / Upload state */
                <div
                    onClick={triggerUpload}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    className={cn(
                        'cursor-pointer group relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition-all duration-200',
                        isDragging
                            ? 'border-primary bg-primary/5 scale-[0.99]'
                            : 'border-slate-200 dark:border-slate-800 bg-slate-50/30 hover:bg-slate-50 dark:bg-slate-900/20 dark:hover:bg-slate-900/40 hover:border-slate-300 dark:hover:border-slate-700',
                        displayError && 'border-destructive/60 bg-destructive/5'
                    )}
                >
                    <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 transition-transform duration-200 group-hover:scale-110 dark:bg-indigo-950/50 dark:text-indigo-400">
                        <UploadCloud className="size-6" />
                    </div>
                    <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                        Click to upload or drag and drop
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground max-w-xs">{description}</p>
                </div>
            )}

            {displayError && <p className="text-destructive text-xs font-medium">{displayError}</p>}
        </div>
    );
}
