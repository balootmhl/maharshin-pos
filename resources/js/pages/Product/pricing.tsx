// import { ActionFunction } from '@/types'; // Assuming this is needed or just keep existing imports
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import QuickAdjustDialog from '@/pages/StockAdjustment/QuickAdjustDialog';
import { Branch, BreadcrumbItem, Category, Product } from '@/types';
import { Head, router } from '@inertiajs/react';
import { Edit2, Save, Search } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Products', href: route('products.index') },
    { title: 'Product Pricing', href: '#' },
];

interface PriceChange {
    product_id: number;
    cost_price: number | string | null;
    selling_price: number | string | null;
    [key: string]: number | string | null;
}

// const formatCurrency = (value: number) =>
//     new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value);

export default function ProductPricing({
    products,
    branches,
    categories,
    selectedBranchId,
    filters,
    adjustmentReasons,
}: {
    products: Product[];
    branches: Branch[];
    categories: Category[];
    selectedBranchId: number;
    filters: { search?: string; category_id?: string };
    adjustmentReasons: Record<string, string>;
}) {
    const [search, setSearch] = useState(filters.search || '');
    const [categoryFilter, setCategoryFilter] = useState<string>(filters.category_id || 'all');
    const [changes, setChanges] = useState<Map<number, PriceChange>>(new Map());
    const [processing, setProcessing] = useState(false);

    // Quick Adjust State
    const [quickAdjustProduct, setQuickAdjustProduct] = useState<Product | null>(null);
    const [quickAdjustOpen, setQuickAdjustOpen] = useState(false);

    // Debounced filter update
    useEffect(() => {
        const timeout = setTimeout(() => {
            const currentSearch = search;
            const currentCategory = categoryFilter === 'all' ? null : categoryFilter;
            const initialSearch = filters.search || '';
            const initialCategory = filters.category_id || null;

            if (currentSearch !== initialSearch || currentCategory !== initialCategory) {
                router.get(
                    route('products.pricing'),
                    {
                        branch_id: selectedBranchId,
                        search: currentSearch,
                        category_id: currentCategory,
                    },
                    {
                        preserveState: true,
                        preserveScroll: true,
                        replace: true,
                    },
                );
            }
        }, 300);
        return () => clearTimeout(timeout);
    }, [search, categoryFilter, filters, selectedBranchId]);

    const handleCategoryChange = (val: string) => {
        setCategoryFilter(val);
    };

    // Filtered products logic removed; products prop is now filtered from backend
    const filteredProducts = products;

    // Get branch stock for a product
    const getBranchStock = useCallback(
        (product: Product) => {
            return product.branch_stocks?.find((bs) => bs.branch_id === selectedBranchId);
        },
        [selectedBranchId],
    );

    // Get effective price (changed > branch stock > product default)
    const getEffectivePrice = useCallback(
        (product: Product, field: 'cost_price' | 'selling_price') => {
            const change = changes.get(product.id);
            if (change && change[field] !== null && change[field] !== undefined) {
                return change[field];
            }
            const bs = getBranchStock(product);
            if (bs && bs[field] !== null && bs[field] !== undefined) {
                return bs[field];
            }
            return null;
        },
        [changes, getBranchStock],
    );

    const handlePriceChange = (productId: number, field: 'cost_price' | 'selling_price', value: string) => {
        setChanges((prev) => {
            const next = new Map(prev);
            const existing = next.get(productId) || {
                product_id: productId,
                cost_price: getBranchStock(products.find((p) => p.id === productId)!)?.cost_price ?? null,
                selling_price: getBranchStock(products.find((p) => p.id === productId)!)?.selling_price ?? null,
            };
            existing[field] = value === '' ? null : Number(value);
            next.set(productId, existing);
            return next;
        });
    };

    const handleSave = () => {
        if (changes.size === 0) return;
        setProcessing(true);

        router.post(
            route('products.pricing.update'),
            {
                branch_id: selectedBranchId,
                prices: Array.from(changes.values()),
            },
            {
                preserveScroll: true,
                onFinish: () => {
                    setProcessing(false);
                    setChanges(new Map());
                },
            },
        );
    };

    const handleBranchChange = (branchId: string) => {
        router.get(
            route('products.pricing'),
            { 
                branch_id: branchId,
                search: search,
                category_id: categoryFilter === 'all' ? null : categoryFilter,
            },
            { preserveState: false },
        );
    };

    const handleQuickAdjustSuccess = () => {
        // Refresh products to reflect stock changes
        router.reload({ only: ['products'] });
        setQuickAdjustProduct(null);
    };

    // const selectedBranch = branches.find((b) => b.id === selectedBranchId);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Product Pricing" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-semibold">Product Pricing</h2>
                        <p className="text-muted-foreground text-sm">
                            Set branch-specific prices. Empty fields use the product's default price.
                        </p>
                    </div>
                    <Button onClick={handleSave} disabled={changes.size === 0 || processing}>
                        <Save className="mr-2 h-4 w-4" />
                        Save Changes {changes.size > 0 && `(${changes.size})`}
                    </Button>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-3">
                    <Select value={String(selectedBranchId)} onValueChange={handleBranchChange}>
                        <SelectTrigger className="w-[250px]">
                            <SelectValue placeholder="Select branch" />
                        </SelectTrigger>
                        <SelectContent>
                            {branches.map((b) => (
                                <SelectItem key={b.id} value={String(b.id)}>
                                    {b.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <div className="relative">
                        <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                        <Input
                            placeholder="Search code or name..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-[250px] pl-9"
                        />
                    </div>

                    <Select value={categoryFilter} onValueChange={handleCategoryChange}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="All Categories" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Categories</SelectItem>
                            {categories.map((cat) => (
                                <SelectItem key={cat.id} value={String(cat.id)}>
                                    {cat.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <span className="text-muted-foreground ml-auto text-sm">
                        {filteredProducts.length} products
                    </span>
                </div>

                {/* Table */}
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[120px]">Code</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead className="w-[100px]">Group</TableHead>
                                <TableHead className="w-[100px]">Category</TableHead>
                                <TableHead className="w-[80px] text-right">Stock</TableHead>
                                <TableHead className="w-[60px]">Unit</TableHead>
                                {/* <TableHead className="w-[120px] text-right">Default Cost</TableHead>
                                <TableHead className="w-[120px] text-right">Default Sell</TableHead> */}
                                <TableHead className="w-[150px] text-right">
                                    {/* {selectedBranch?.name ?? 'Branch'} Cost */}
                                    Cost Price
                                </TableHead>
                                <TableHead className="w-[150px] text-right">
                                    {/* {selectedBranch?.name ?? 'Branch'} Sell */}
                                    Sell Price
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredProducts.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-24 text-center">
                                        {!search && categoryFilter === 'all'
                                            ? 'Enter a search term or select a category to view pricing.'
                                            : 'No products found matching your criteria.'}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredProducts.map((product, index) => {
                                    const branchCost = getEffectivePrice(product, 'cost_price');
                                    const branchSell = getEffectivePrice(product, 'selling_price');
                                    const hasChange = changes.has(product.id);
                                    const bs = getBranchStock(product);

                                    return (

                                        <TableRow
                                            key={product.id}
                                            className={`${index % 2 === 1 ? 'bg-muted/30' : ''} ${hasChange ? 'bg-yellow-50 dark:bg-yellow-950/20' : ''}`}
                                        >
                                            <TableCell className="font-mono font-bold text-sm">{product.code}</TableCell>
                                            <TableCell className="text-xs font-small">{product.name}</TableCell>
                                            <TableCell className="text-muted-foreground text-xs">
                                                {bs?.group?.name}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground text-xs">
                                                {product.category?.name}
                                            </TableCell>
                                            <TableCell className="text-right font-mono text-sm">
                                                <div className="flex items-center justify-end gap-2">
                                                    <span>{bs?.quantity ?? 0}</span>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-6 w-6"
                                                        onClick={() => {
                                                            setQuickAdjustProduct(product);
                                                            setQuickAdjustOpen(true);
                                                        }}
                                                    >
                                                        <Edit2 className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground text-xs">{product.unit}</TableCell>
                                            {/* <TableCell className="text-muted-foreground text-right font-mono text-sm">
                                                {formatCurrency(product.cost_price)} Ks
                                            </TableCell>
                                            <TableCell className="text-muted-foreground text-right font-mono text-sm">
                                                {formatCurrency(product.selling_price)} Ks
                                            </TableCell> */}
                                            <TableCell className="text-right">
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    placeholder={String(product.cost_price)}
                                                    value={branchCost ?? ''}
                                                    onChange={(e) =>
                                                        handlePriceChange(product.id, 'cost_price', e.target.value)
                                                    }
                                                    className="ml-auto h-8 w-[120px] text-right font-mono text-sm"
                                                />
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    placeholder={String(product.selling_price)}
                                                    value={branchSell ?? ''}
                                                    onChange={(e) =>
                                                        handlePriceChange(product.id, 'selling_price', e.target.value)
                                                    }
                                                    className="ml-auto h-8 w-[120px] text-right font-mono text-sm"
                                                />
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </div>

                {changes.size > 0 && (
                    <div className="bg-primary/10 border-primary/20 flex items-center justify-between rounded-lg border p-3">
                        <span className="text-sm font-medium">
                            {changes.size} product(s) modified — unsaved changes
                        </span>
                        <Button size="sm" onClick={handleSave} disabled={processing}>
                            <Save className="mr-2 h-4 w-4" />
                            Save Changes
                        </Button>
                    </div>
                )}

                {/* Quick Adjust Dialog */}
                {quickAdjustProduct && (
                    <QuickAdjustDialog
                        product={quickAdjustProduct}
                        branchId={selectedBranchId}
                        currentStock={getBranchStock(quickAdjustProduct)?.quantity ?? 0}
                        reasons={adjustmentReasons}
                        open={quickAdjustOpen}
                        onOpenChange={(open) => {
                            setQuickAdjustOpen(open);
                            if (!open) setQuickAdjustProduct(null);
                        }}
                        onSuccess={handleQuickAdjustSuccess}
                    />
                )}
            </div>
        </AppLayout>
    );
}
