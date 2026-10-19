import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, Branch, Category, Group } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import {
    AlertCircle,
    ArrowDown,
    ArrowRight,
    ArrowUp,
    CheckCircle2,
    Layers,
    Loader2,
    Percent,
    RefreshCw,
    Sparkles,
    Store,
    Tag,
    TrendingDown,
    TrendingUp,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

interface PreviewItem {
    id: number;
    code: string;
    name: string;
    category_name: string;
    unit: string;
    current_cost_price: number;
    new_cost_price: number;
    cost_diff: number;
    current_selling_price: number;
    new_selling_price: number;
    selling_diff: number;
}

interface PreviewResponse {
    total_count: number;
    sample_items: PreviewItem[];
}

interface BatchPricingProps {
    branches: Branch[];
    categories: Category[];
    groups: Group[];
    selectedBranchId: string;
    isSuperAdmin: boolean;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Products', href: route('products.index') },
    { title: 'Product Pricing', href: route('products.pricing') },
    { title: 'Batch Price Changer', href: '#' },
];

const formatCurrency = (val: number | null | undefined): string => {
    if (val === null || val === undefined || isNaN(val)) return '0';
    return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(val);
};

export default function BatchPricing({
    branches = [],
    categories = [],
    groups = [],
    selectedBranchId: initialBranchId,
    isSuperAdmin,
}: BatchPricingProps) {
    // Form state
    const [branchId, setBranchId] = useState<string>(initialBranchId);
    const [scopeType, setScopeType] = useState<'all' | 'category' | 'group'>('all');
    const [scopeId, setScopeId] = useState<string>('');
    const [targetField, setTargetField] = useState<'selling_price' | 'cost_price' | 'both'>('selling_price');
    const [percentage, setPercentage] = useState<string>('10');
    const [rounding, setRounding] = useState<string>('nearest_100');
    const [customNote, setCustomNote] = useState<string>('');

    // Preview state
    const [previewLoading, setPreviewLoading] = useState<boolean>(false);
    const [previewData, setPreviewData] = useState<PreviewResponse | null>(null);

    // Confirmation dialog & submission state
    const [confirmModalOpen, setConfirmModalOpen] = useState<boolean>(false);
    const [submitting, setSubmitting] = useState<boolean>(false);

    // Filter available groups based on selected branch
    const availableGroups = useMemo(() => {
        if (!isSuperAdmin || branchId === 'all') {
            return groups;
        }
        return groups.filter((g) => g.branch_id?.toString() === branchId);
    }, [groups, branchId, isSuperAdmin]);

    // Fetch live preview
    const fetchPreview = useCallback(() => {
        const pct = parseFloat(percentage);
        if (isNaN(pct) || pct < -100 || pct > 1000) {
            setPreviewData(null);
            return;
        }

        if (scopeType !== 'all' && !scopeId) {
            setPreviewData(null);
            return;
        }

        setPreviewLoading(true);

        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

        fetch(route('products.batch-pricing.preview'), {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                ...(csrfToken ? { 'X-CSRF-TOKEN': csrfToken } : {}),
            },
            body: JSON.stringify({
                branch_id: branchId,
                scope_type: scopeType,
                scope_id: scopeId ? parseInt(scopeId, 10) : null,
                target_field: targetField,
                percentage: pct,
                rounding: rounding,
            }),
        })
            .then((res) => {
                if (!res.ok) throw new Error('Preview request failed');
                return res.json();
            })
            .then((data: PreviewResponse) => {
                setPreviewData(data);
                setPreviewLoading(false);
            })
            .catch(() => {
                setPreviewLoading(false);
            });
    }, [branchId, scopeType, scopeId, targetField, percentage, rounding]);

    // Auto-fetch preview when parameters change (debounced)
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchPreview();
        }, 300);

        return () => clearTimeout(timer);
    }, [fetchPreview]);

    // Apply Batch Update
    const handleApply = () => {
        setSubmitting(true);

        router.post(
            route('products.batch-pricing.apply'),
            {
                branch_id: branchId,
                scope_type: scopeType,
                scope_id: scopeId ? parseInt(scopeId, 10) : null,
                target_field: targetField,
                percentage: parseFloat(percentage),
                rounding: rounding,
                custom_note: customNote,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setConfirmModalOpen(false);
                    setSubmitting(false);
                    fetchPreview();
                    toast.success('Batch price update applied successfully.');
                },
                onError: (errors) => {
                    setSubmitting(false);
                    const msg = Object.values(errors)[0] || 'Failed to apply batch update.';
                    toast.error(msg);
                },
            }
        );
    };

    // Label helpers for confirmation modal
    const branchName = useMemo(() => {
        if (branchId === 'all') return 'All Active Branches';
        const b = branches.find((item) => item.id.toString() === branchId);
        return b ? `${b.name} (${b.code})` : 'Selected Branch';
    }, [branchId, branches]);

    const scopeLabel = useMemo(() => {
        if (scopeType === 'all') return 'All Products';
        if (scopeType === 'category') {
            const cat = categories.find((c) => c.id.toString() === scopeId);
            return `Category: ${cat?.name ?? 'Selected'}`;
        }
        if (scopeType === 'group') {
            const grp = groups.find((g) => g.id.toString() === scopeId);
            return `Group: ${grp?.name ?? 'Selected'}`;
        }
        return 'All Products';
    }, [scopeType, scopeId, categories, groups]);

    const targetLabel = useMemo(() => {
        switch (targetField) {
            case 'selling_price':
                return 'Selling Price Only';
            case 'cost_price':
                return 'Cost Price Only';
            case 'both':
                return 'Both Cost & Selling Price';
        }
    }, [targetField]);

    const pctNum = parseFloat(percentage) || 0;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Batch Product Price Changer" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6 max-w-7xl mx-auto w-full">
                {/* Header */}
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Batch Product Price Changer</h1>
                        <p className="text-sm text-muted-foreground">
                            Safely adjust product prices across categories, groups, or whole branches in chunks without server strain.
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Link href={route('products.pricing')}>
                            <Button variant="outline" size="sm" className="gap-1.5">
                                <Tag className="h-4 w-4" />
                                Single Product Pricing
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Main Grid: Controls (Left) & Live Preview (Right) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* Controls Card */}
                    <Card className="lg:col-span-5 shadow-sm border">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Sparkles className="h-5 w-5 text-primary" />
                                Formula & Scope Settings
                            </CardTitle>
                            <CardDescription>
                                Configure the percentage adjustment, target price fields, and product scope.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-5">
                            {/* Branch Selection */}
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                    <Store className="h-3.5 w-3.5" />
                                    Target Branch
                                </Label>
                                {isSuperAdmin ? (
                                    <Select value={branchId} onValueChange={(val) => setBranchId(val)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Branch" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">🌐 All Active Branches</SelectItem>
                                            {branches.map((b) => (
                                                <SelectItem key={b.id} value={b.id.toString()}>
                                                    {b.name} ({b.code})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                ) : (
                                    <div className="flex items-center gap-2 p-2.5 rounded-md bg-muted/50 border text-sm font-medium">
                                        <Store className="h-4 w-4 text-muted-foreground" />
                                        <span>{branches[0]?.name ?? 'Your Branch'}</span>
                                        <Badge variant="secondary" className="ml-auto text-xs">
                                            Assigned Branch
                                        </Badge>
                                    </div>
                                )}
                            </div>

                            {/* Scope Selector */}
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                    <Layers className="h-3.5 w-3.5" />
                                    Product Scope
                                </Label>
                                <div className="grid grid-cols-3 gap-2">
                                    <Button
                                        type="button"
                                        variant={scopeType === 'all' ? 'default' : 'outline'}
                                        size="sm"
                                        className="text-xs"
                                        onClick={() => {
                                            setScopeType('all');
                                            setScopeId('');
                                        }}
                                    >
                                        All Products
                                    </Button>
                                    <Button
                                        type="button"
                                        variant={scopeType === 'category' ? 'default' : 'outline'}
                                        size="sm"
                                        className="text-xs"
                                        onClick={() => {
                                            setScopeType('category');
                                            setScopeId(categories[0]?.id?.toString() || '');
                                        }}
                                    >
                                        Category
                                    </Button>
                                    <Button
                                        type="button"
                                        variant={scopeType === 'group' ? 'default' : 'outline'}
                                        size="sm"
                                        className="text-xs"
                                        onClick={() => {
                                            setScopeType('group');
                                            setScopeId(availableGroups[0]?.id?.toString() || '');
                                        }}
                                    >
                                        Group
                                    </Button>
                                </div>

                                {/* Conditional Category Dropdown */}
                                {scopeType === 'category' && (
                                    <div className="pt-2">
                                        <Select value={scopeId} onValueChange={(val) => setScopeId(val)}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select Category" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {categories.map((c) => (
                                                    <SelectItem key={c.id} value={c.id.toString()}>
                                                        {c.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}

                                {/* Conditional Group Dropdown */}
                                {scopeType === 'group' && (
                                    <div className="pt-2">
                                        <Select value={scopeId} onValueChange={(val) => setScopeId(val)}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select Group" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {availableGroups.length === 0 ? (
                                                    <SelectItem value="none" disabled>
                                                        No groups found
                                                    </SelectItem>
                                                ) : (
                                                    availableGroups.map((g) => (
                                                        <SelectItem key={g.id} value={g.id.toString()}>
                                                            {g.name} ({g.code})
                                                        </SelectItem>
                                                    ))
                                                )}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}
                            </div>

                            {/* Target Price Field */}
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                    Target Price Field
                                </Label>
                                <Select
                                    value={targetField}
                                    onValueChange={(val: 'selling_price' | 'cost_price' | 'both') => setTargetField(val)}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="selling_price">Selling Price Only</SelectItem>
                                        <SelectItem value="cost_price">Cost Price Only</SelectItem>
                                        <SelectItem value="both">Both Selling & Cost Price</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Percentage Adjustment */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                        <Percent className="h-3.5 w-3.5" />
                                        Percentage Adjustment (%)
                                    </Label>
                                    <span
                                        className={`text-xs font-semibold font-mono ${
                                            pctNum > 0 ? 'text-emerald-600' : pctNum < 0 ? 'text-red-600' : 'text-muted-foreground'
                                        }`}
                                    >
                                        {pctNum > 0 ? `+${pctNum}% Increase` : pctNum < 0 ? `${pctNum}% Decrease` : '0% No Change'}
                                    </span>
                                </div>
                                <div className="relative">
                                    <Input
                                        type="number"
                                        step="0.5"
                                        min="-100"
                                        max="1000"
                                        placeholder="e.g. 10 or -5"
                                        value={percentage}
                                        onChange={(e) => setPercentage(e.target.value)}
                                        className="font-mono text-base pr-8"
                                    />
                                    <span className="absolute right-3 top-2.5 text-sm text-muted-foreground font-mono">%</span>
                                </div>

                                {/* Preset Buttons */}
                                <div className="flex flex-wrap gap-1.5 pt-1">
                                    {['5', '10', '15', '20', '-5', '-10'].map((preset) => (
                                        <Button
                                            key={preset}
                                            type="button"
                                            variant="secondary"
                                            size="sm"
                                            className="h-7 text-xs font-mono px-2"
                                            onClick={() => setPercentage(preset)}
                                        >
                                            {parseFloat(preset) > 0 ? `+${preset}%` : `${preset}%`}
                                        </Button>
                                    ))}
                                </div>
                            </div>

                            {/* Rounding Rule */}
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                    Rounding Rule
                                </Label>
                                <Select value={rounding} onValueChange={(val) => setRounding(val)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">No Rounding (Standard Decimals)</SelectItem>
                                        <SelectItem value="nearest_50">Nearest 50 MMK</SelectItem>
                                        <SelectItem value="nearest_100">Nearest 100 MMK (Recommended)</SelectItem>
                                        <SelectItem value="round_up_100">Round Up to 100 MMK</SelectItem>
                                        <SelectItem value="round_down_100">Round Down to 100 MMK</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Custom Note for Audit */}
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                    Audit Reason Note (Optional)
                                </Label>
                                <Input
                                    placeholder="e.g. Summer promotion markup, Currency hike"
                                    value={customNote}
                                    onChange={(e) => setCustomNote(e.target.value)}
                                    maxLength={200}
                                />
                                <p className="text-[11px] text-muted-foreground">
                                    Will be appended to the automatic price history audit trail.
                                </p>
                            </div>

                            {/* Action Button */}
                            <Button
                                className="w-full gap-2 mt-2"
                                size="lg"
                                disabled={
                                    previewLoading ||
                                    submitting ||
                                    !previewData ||
                                    previewData.total_count === 0 ||
                                    pctNum === 0
                                }
                                onClick={() => setConfirmModalOpen(true)}
                            >
                                {pctNum > 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                                Review & Apply Batch Change
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Live Preview Card */}
                    <Card className="lg:col-span-7 shadow-sm border">
                        <CardHeader className="pb-4">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                <div>
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        Live Calculation Preview
                                        {previewLoading && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                                    </CardTitle>
                                    <CardDescription>
                                        Preview the impact before applying updates to the database.
                                    </CardDescription>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 gap-1 self-start sm:self-auto"
                                    onClick={fetchPreview}
                                    disabled={previewLoading}
                                >
                                    <RefreshCw className={`h-3.5 w-3.5 ${previewLoading ? 'animate-spin' : ''}`} />
                                    Refresh
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Stat Highlights */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                <div className="p-3 rounded-lg border bg-card text-card-foreground">
                                    <span className="text-xs text-muted-foreground">Affected Items</span>
                                    <div className="text-2xl font-bold font-mono mt-0.5 text-primary">
                                        {previewLoading ? '...' : formatCurrency(previewData?.total_count ?? 0)}
                                    </div>
                                </div>
                                <div className="p-3 rounded-lg border bg-card text-card-foreground">
                                    <span className="text-xs text-muted-foreground">Adjustment</span>
                                    <div
                                        className={`text-xl font-bold font-mono mt-1 ${
                                            pctNum > 0 ? 'text-emerald-600' : pctNum < 0 ? 'text-red-600' : 'text-muted-foreground'
                                        }`}
                                    >
                                        {pctNum > 0 ? `+${pctNum}%` : `${pctNum}%`}
                                    </div>
                                </div>
                                <div className="p-3 rounded-lg border bg-card text-card-foreground col-span-2 sm:col-span-1">
                                    <span className="text-xs text-muted-foreground">Target Field</span>
                                    <div className="text-xs font-semibold mt-1.5 truncate">
                                        {targetLabel}
                                    </div>
                                </div>
                            </div>

                            {/* Safe Resource Warning / Notice */}
                            <Alert className="bg-muted/40 border">
                                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                <AlertTitle className="text-xs font-semibold">Zero-Overload Architecture</AlertTitle>
                                <AlertDescription className="text-xs text-muted-foreground">
                                    Only 10 sample products are loaded for preview. When applied, updates are performed in background chunks of 250 rows to keep server memory well below limits.
                                </AlertDescription>
                            </Alert>

                            {/* Sample Table */}
                            <div className="rounded-md border overflow-hidden">
                                <Table>
                                    <TableHeader className="bg-muted/50">
                                        <TableRow>
                                            <TableHead className="w-[180px]">Product</TableHead>
                                            {(targetField === 'cost_price' || targetField === 'both') && (
                                                <TableHead>Cost Price</TableHead>
                                            )}
                                            {(targetField === 'selling_price' || targetField === 'both') && (
                                                <TableHead>Selling Price</TableHead>
                                            )}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {previewLoading ? (
                                            <TableRow>
                                                <TableCell
                                                    colSpan={targetField === 'both' ? 3 : 2}
                                                    className="h-32 text-center text-muted-foreground"
                                                >
                                                    <div className="flex flex-col items-center justify-center gap-2">
                                                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                                        <span className="text-xs">Calculating preview...</span>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ) : !previewData || previewData.sample_items.length === 0 ? (
                                            <TableRow>
                                                <TableCell
                                                    colSpan={targetField === 'both' ? 3 : 2}
                                                    className="h-32 text-center text-muted-foreground"
                                                >
                                                    <div className="flex flex-col items-center justify-center gap-1.5">
                                                        <AlertCircle className="h-5 w-5 text-muted-foreground/60" />
                                                        <p className="text-sm font-medium">No products match current criteria</p>
                                                        <p className="text-xs">Try selecting a different branch, category, or group.</p>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            previewData.sample_items.map((item) => (
                                                <TableRow key={item.id} className="text-xs">
                                                    <TableCell className="font-medium">
                                                        <div className="font-semibold text-foreground truncate max-w-[170px]" title={item.name}>
                                                            {item.name}
                                                        </div>
                                                        <div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                                                            <span className="font-mono">{item.code}</span>
                                                            <span>•</span>
                                                            <span className="truncate">{item.category_name}</span>
                                                        </div>
                                                    </TableCell>

                                                    {/* Cost Price Column */}
                                                    {(targetField === 'cost_price' || targetField === 'both') && (
                                                        <TableCell>
                                                            <div className="flex flex-col gap-0.5">
                                                                <div className="flex items-center gap-1 font-mono">
                                                                    <span className="text-muted-foreground">{formatCurrency(item.current_cost_price)}</span>
                                                                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                                                                    <span className="font-bold">{formatCurrency(item.new_cost_price)}</span>
                                                                </div>
                                                                {Math.abs(item.cost_diff) > 0.001 && (
                                                                    <span
                                                                        className={`inline-flex items-center text-[10px] font-mono ${
                                                                            item.cost_diff > 0 ? 'text-emerald-600' : 'text-red-600'
                                                                        }`}
                                                                    >
                                                                        {item.cost_diff > 0 ? (
                                                                            <ArrowUp className="h-2.5 w-2.5 mr-0.5" />
                                                                        ) : (
                                                                            <ArrowDown className="h-2.5 w-2.5 mr-0.5" />
                                                                        )}
                                                                        {item.cost_diff > 0 ? '+' : ''}
                                                                        {formatCurrency(item.cost_diff)} MMK
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </TableCell>
                                                    )}

                                                    {/* Selling Price Column */}
                                                    {(targetField === 'selling_price' || targetField === 'both') && (
                                                        <TableCell>
                                                            <div className="flex flex-col gap-0.5">
                                                                <div className="flex items-center gap-1 font-mono">
                                                                    <span className="text-muted-foreground">{formatCurrency(item.current_selling_price)}</span>
                                                                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                                                                    <span className="font-bold">{formatCurrency(item.new_selling_price)}</span>
                                                                </div>
                                                                {Math.abs(item.selling_diff) > 0.001 && (
                                                                    <span
                                                                        className={`inline-flex items-center text-[10px] font-mono ${
                                                                            item.selling_diff > 0 ? 'text-emerald-600' : 'text-red-600'
                                                                        }`}
                                                                    >
                                                                        {item.selling_diff > 0 ? (
                                                                            <ArrowUp className="h-2.5 w-2.5 mr-0.5" />
                                                                        ) : (
                                                                            <ArrowDown className="h-2.5 w-2.5 mr-0.5" />
                                                                        )}
                                                                        {item.selling_diff > 0 ? '+' : ''}
                                                                        {formatCurrency(item.selling_diff)} MMK
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </TableCell>
                                                    )}
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>

                            {previewData && previewData.total_count > 10 && (
                                <p className="text-[11px] text-center text-muted-foreground">
                                    Showing first 10 sample items out of {formatCurrency(previewData.total_count)} total matching products.
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Confirmation Dialog */}
            <Dialog open={confirmModalOpen} onOpenChange={setConfirmModalOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-primary" />
                            Confirm Batch Price Change
                        </DialogTitle>
                        <DialogDescription>
                            Please review the summary below before executing this price modification.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-3 py-2 text-xs">
                        <div className="flex justify-between py-1.5 border-b">
                            <span className="text-muted-foreground">Branch:</span>
                            <span className="font-semibold">{branchName}</span>
                        </div>
                        <div className="flex justify-between py-1.5 border-b">
                            <span className="text-muted-foreground">Scope:</span>
                            <span className="font-semibold">{scopeLabel}</span>
                        </div>
                        <div className="flex justify-between py-1.5 border-b">
                            <span className="text-muted-foreground">Target Field:</span>
                            <span className="font-semibold">{targetLabel}</span>
                        </div>
                        <div className="flex justify-between py-1.5 border-b">
                            <span className="text-muted-foreground">Adjustment Formula:</span>
                            <span className="font-mono font-bold text-primary">
                                {pctNum > 0 ? `+${pctNum}%` : `${pctNum}%`} ({rounding.replace(/_/g, ' ')})
                            </span>
                        </div>
                        <div className="flex justify-between py-1.5 border-b">
                            <span className="text-muted-foreground">Total Affected Products:</span>
                            <span className="font-mono font-bold text-emerald-600 text-sm">
                                {formatCurrency(previewData?.total_count ?? 0)} Products
                            </span>
                        </div>
                        {customNote && (
                            <div className="flex flex-col gap-1 py-1.5 border-b">
                                <span className="text-muted-foreground">Note:</span>
                                <span className="italic text-foreground">{customNote}</span>
                            </div>
                        )}
                        <p className="text-[11px] text-muted-foreground pt-1">
                            An immutable audit record will be logged in <strong>Product Price History</strong> for each affected product.
                        </p>
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setConfirmModalOpen(false)}
                            disabled={submitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            onClick={handleApply}
                            disabled={submitting}
                            className="gap-2"
                        >
                            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                            {submitting ? 'Updating in chunks...' : 'Confirm & Apply'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
