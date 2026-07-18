import InputError from '@/components/input-error';
import { PurchaseSuccessDialog } from '@/components/purchase-success-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverAnchor, PopoverContent } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { useDirectPrint } from '@/hooks/use-direct-print';
import { useProductSearch } from '@/hooks/use-product-search';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, Branch, Product, SharedData, Supplier } from '@/types';
import { Head, useForm, usePage } from '@inertiajs/react';
import { Minus, Package, Plus, Trash2, X } from 'lucide-react';
import { FormEventHandler, useCallback, useEffect, useMemo, useRef, useState } from 'react';

type CartItem = {
    product_id: number;
    product: Product;
    quantity: number;
    unit_cost: number;
    tax_rate: number;
    tax_amount: number;
    subtotal: number;
};

type PurchaseForm = {
    branch_id: string;
    supplier_id: string;
    purchase_date: string;
    subtotal: number;
    tax_amount: number;
    total_amount: number;
    payment_status: string;
    paid_amount: number;
    notes: string;
    items: {
        product_id: number;
        quantity: number;
        unit_cost: number;
        tax_rate: number;
        tax_amount: number;
        subtotal: number;
    }[];
};

type CompletedPurchase = {
    id: number;
    purchase_no: string;
    total_amount: number;
    paid_amount: number;
    payment_status: string;
    supplier?: {
        id: number;
        name: string;
    };
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Purchases', href: route('purchases.index') },
    { title: 'New Purchase', href: '#' },
];

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
};

export default function PurchaseCreate({ branches, suppliers, purchaseNo }: { branches: Branch[]; suppliers: Supplier[]; purchaseNo: string }) {
    const { auth, flash } = usePage<SharedData & { flash: { completedPurchase?: CompletedPurchase } }>().props;

    // Success dialog state
    const [successDialogOpen, setSuccessDialogOpen] = useState(false);
    const [completedPurchase, setCompletedPurchase] = useState<CompletedPurchase | null>(null);

    // Open dialog when flash data contains completed purchase
    useEffect(() => {
        if (flash?.completedPurchase) {
            setCompletedPurchase(flash.completedPurchase);
            setSuccessDialogOpen(true);
        }
    }, [flash?.completedPurchase]);

    const today = new Date().toISOString().split('T')[0];
    const [cart, setCart] = useState<CartItem[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchOpen, setSearchOpen] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const barcodeInputRef = useRef<HTMLInputElement>(null);
    const paidAmountInputRef = useRef<HTMLInputElement>(null);

    const defaultBranchId = auth.user.is_super_admin ? branches[0]?.id?.toString() || '' : auth.user.branch_id?.toString() || '';

    const { data, setData, post, errors, processing, reset } = useForm<PurchaseForm>({
        branch_id: defaultBranchId,
        supplier_id: 'none',
        purchase_date: today,
        subtotal: 0,
        tax_amount: 0,
        total_amount: 0,
        payment_status: 'unpaid',
        paid_amount: 0,
        notes: '',
        items: [],
    });

    // Server-side product search
    const {
        products: searchResults,
        search: searchProducts,
        lookupBarcode,
    } = useProductSearch({
        branchId: data.branch_id,
        context: 'purchase',
    });

    // Helper to get product details based on selected branch
    const getProductDetails = useCallback(
        (product: Product) => {
            const branchId = parseInt(data.branch_id);
            // If no branch selected or no branch stocks loaded, fallback to default
            if (!branchId || !product.branch_stocks) {
                return {
                    stock: product.stock ?? 0,
                    cost: Number(product.cost_price),
                };
            }
            const stock = product.branch_stocks.find((bs) => bs.branch_id === branchId);
            return {
                stock: stock?.quantity ?? 0,
                cost: stock?.cost_price ? Number(stock.cost_price) : Number(product.cost_price),
            };
        },
        [data.branch_id],
    );

    // Clear cart when branch changes to avoid price/stock mismatches
    useEffect(() => {
        setCart([]);
    }, [data.branch_id]);

    // Calculate totals when cart changes
    const cartTotals = useMemo(() => {
        const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
        const taxAmount = cart.reduce((sum, item) => sum + item.tax_amount, 0);
        const total = subtotal + taxAmount;
        return { subtotal, taxAmount, total };
    }, [cart]);

    // Update form data when cart or totals change
    useEffect(() => {
        const items = cart.map((item) => ({
            product_id: item.product_id,
            quantity: item.quantity,
            unit_cost: item.unit_cost,
            tax_rate: item.tax_rate,
            tax_amount: item.tax_amount,
            subtotal: item.subtotal,
        }));

        setData((prev) => ({
            ...prev,
            items,
            subtotal: cartTotals.subtotal,
            tax_amount: cartTotals.taxAmount,
            total_amount: cartTotals.total,
        }));
    }, [cart, cartTotals, setData]);

    // Update payment status when paid amount changes
    useEffect(() => {
        const status = data.paid_amount >= cartTotals.total ? 'paid' : data.paid_amount > 0 ? 'partial' : 'unpaid';
        setData((prev) => ({ ...prev, payment_status: status }));
    }, [data.paid_amount, cartTotals.total, setData]);

    const addToCart = useCallback(
        (product: Product) => {
            setCart((prev) => {
                const existing = prev.find((item) => item.product_id === product.id);
                if (existing) {
                    return prev.map((item) =>
                        item.product_id === product.id
                            ? {
                                  ...item,
                                  quantity: item.quantity + 1,
                                  tax_amount: (item.quantity + 1) * item.unit_cost * (item.tax_rate / 100),
                                  subtotal: (item.quantity + 1) * item.unit_cost,
                              }
                            : item,
                    );
                }
                const details = getProductDetails(product);
                const newItem: CartItem = {
                    product_id: product.id,
                    product,
                    quantity: 1,
                    unit_cost: details.cost,
                    tax_rate: Number(product.tax_rate),
                    tax_amount: details.cost * (Number(product.tax_rate) / 100),
                    subtotal: details.cost,
                };
                return [...prev, newItem];
            });
            setSearchQuery('');
            searchInputRef.current?.focus();
        },
        [getProductDetails],
    );

    const updateQuantity = (productId: number, delta: number) => {
        setCart((prev) =>
            prev
                .map((item) => {
                    if (item.product_id === productId) {
                        const newQty = Math.max(0, item.quantity + delta);
                        return {
                            ...item,
                            quantity: newQty,
                            tax_amount: newQty * item.unit_cost * (item.tax_rate / 100),
                            subtotal: newQty * item.unit_cost,
                        };
                    }
                    return item;
                })
                .filter((item) => item.quantity > 0),
        );
    };

    const setQuantity = (productId: number, quantity: number) => {
        if (quantity <= 0) {
            removeFromCart(productId);
            return;
        }
        setCart((prev) =>
            prev.map((item) => {
                if (item.product_id === productId) {
                    return {
                        ...item,
                        quantity: quantity,
                        tax_amount: quantity * item.unit_cost * (item.tax_rate / 100),
                        subtotal: quantity * item.unit_cost,
                    };
                }
                return item;
            }),
        );
    };

    const updateUnitCost = (productId: number, cost: number) => {
        setCart((prev) =>
            prev.map((item) => {
                if (item.product_id === productId) {
                    return {
                        ...item,
                        unit_cost: cost,
                        tax_amount: item.quantity * cost * (item.tax_rate / 100),
                        subtotal: item.quantity * cost,
                    };
                }
                return item;
            }),
        );
    };

    const removeFromCart = (productId: number) => {
        setCart((prev) => prev.filter((item) => item.product_id !== productId));
    };

    const clearCart = useCallback(() => {
        setCart([]);
        setData((prev) => ({ ...prev, paid_amount: 0 }));
    }, [setData]);

    const handleBarcodeInput = async (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            const barcode = (e.target as HTMLInputElement).value.trim();
            if (!barcode) return;
            const product = await lookupBarcode(barcode);
            if (product) {
                addToCart(product);
                (e.target as HTMLInputElement).value = '';
            }
        }
    };

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // F1 - Focus search
            if (e.key === 'F1') {
                e.preventDefault();
                searchInputRef.current?.focus();
            }
            // F2 - Focus barcode
            if (e.key === 'F2') {
                e.preventDefault();
                barcodeInputRef.current?.focus();
            }
            // F12 or Ctrl+Enter - Complete purchase
            if (e.key === 'F12' || (e.ctrlKey && e.key === 'Enter')) {
                e.preventDefault();
                if (cart.length > 0 && !processing) {
                    document.getElementById('complete-purchase-btn')?.click();
                }
            }
            // Escape - Clear search
            if (e.key === 'Escape') {
                setSearchQuery('');
                searchInputRef.current?.blur();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [cart.length, processing]);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('purchases.store'), {
            preserveScroll: true,
        });
    };

    const { printUrl } = useDirectPrint();

    // Handle print action from success dialog
    const handlePrint = (format: 'a4' | 'a5' | 'thermal') => {
        if (!completedPurchase) return;
        printUrl(route('purchases.print', { purchase: completedPurchase.id, format }));
    };

    // Handle new purchase action from success dialog
    const handleNewPurchase = () => {
        reset();
        setCart([]);
        setCompletedPurchase(null);
        searchInputRef.current?.focus();
    };

    return (
        <>
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="New Purchase" />
                <form
                    onSubmit={submit}
                    className="grid h-auto grid-cols-1 gap-2 p-2 lg:h-[calc(100vh-110px)] lg:grid-cols-[1fr_340px] lg:overflow-hidden xl:grid-cols-[1fr_minmax(400px,450px)]"
                >
                    {/* Left: Product Selection and Cart */}
                    <div className="flex h-auto flex-col gap-2 lg:h-full lg:min-h-0 lg:overflow-hidden">
                        {/* Keyboard-First Product Search */}
                        <div className="flex gap-4">
                            <Popover open={searchOpen} onOpenChange={setSearchOpen}>
                                <PopoverAnchor asChild>
                                    <div className="relative flex-1">
                                        <Input
                                            ref={searchInputRef}
                                            placeholder="Search products (F1)... ↑↓ to navigate, Enter to add"
                                            value={searchQuery}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                setSearchQuery(val);
                                                setSearchOpen(val.length > 0);
                                                setSelectedIndex(0);
                                                searchProducts(val);
                                            }}
                                            onFocus={() => setSearchOpen(searchQuery.length > 0)}
                                            onKeyDown={(e) => {
                                                const maxIndex = Math.min(searchResults.length, 10) - 1;

                                                if (e.key === 'ArrowDown' && searchOpen) {
                                                    e.preventDefault();
                                                    setSelectedIndex((prev) => Math.min(prev + 1, maxIndex));
                                                }
                                                if (e.key === 'ArrowUp' && searchOpen) {
                                                    e.preventDefault();
                                                    setSelectedIndex((prev) => Math.max(prev - 1, 0));
                                                }
                                                if (e.key === 'Enter' && searchResults.length > 0) {
                                                    e.preventDefault();
                                                    const selectedProduct = searchResults[selectedIndex];
                                                    if (selectedProduct) {
                                                        addToCart(selectedProduct);
                                                        setSearchQuery('');
                                                        setSearchOpen(false);
                                                        setSelectedIndex(0);
                                                        setTimeout(() => searchInputRef.current?.focus(), 0);
                                                    }
                                                }
                                                if (e.key === 'Escape') {
                                                    setSearchOpen(false);
                                                    setSelectedIndex(0);
                                                }
                                            }}
                                            autoFocus
                                            tabIndex={1}
                                            className="h-10"
                                        />
                                    </div>
                                </PopoverAnchor>
                                <PopoverContent
                                    className="w-[var(--radix-popover-trigger-width)] p-0"
                                    align="start"
                                    onOpenAutoFocus={(e) => e.preventDefault()}
                                    onInteractOutside={(e) => {
                                        if ((e.target as HTMLElement).closest('input')) {
                                            e.preventDefault();
                                        }
                                    }}
                                >
                                    <Command shouldFilter={false}>
                                        <CommandList className="max-h-[300px]">
                                            <CommandEmpty>No products found. Try a different search.</CommandEmpty>
                                            <CommandGroup>
                                                {searchResults.slice(0, 10).map((product, index) => (
                                                    <CommandItem
                                                        key={product.id}
                                                        value={product.id.toString()}
                                                        onSelect={() => {
                                                            addToCart(product);
                                                            setSearchQuery('');
                                                            setSearchOpen(false);
                                                            setSelectedIndex(0);
                                                            setTimeout(() => searchInputRef.current?.focus(), 0);
                                                        }}
                                                        className={`flex cursor-pointer items-center justify-between gap-2 ${
                                                            index === selectedIndex ? 'bg-accent text-accent-foreground' : ''
                                                        }`}
                                                    >
                                                        <div className="flex flex-col">
                                                            <span className="font-small font-mono">{product.code}</span>
                                                            <span className="text-muted-foreground text-xs">
                                                                {product.name}
                                                                {product.barcode && ` • ${product.barcode}`}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-primary font-mono font-bold">
                                                                {formatCurrency(getProductDetails(product).cost)}
                                                            </span>
                                                            <Badge variant="secondary" className="text-xs">
                                                                <Package className="mr-1 h-3 w-3" />
                                                                {getProductDetails(product).stock}
                                                            </Badge>
                                                        </div>
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                            <Input
                                ref={barcodeInputRef}
                                placeholder="Scan barcode (F2)..."
                                onKeyDown={handleBarcodeInput}
                                className="w-48"
                                tabIndex={2}
                            />
                        </div>

                        {/* Header with Branch, Supplier, Date */}
                        <Card className="py-1">
                            <CardContent className="grid grid-cols-2 gap-1 px-3 pt-0 lg:grid-cols-4">
                                <div className="space-y-2">
                                    <Label>Branch*</Label>
                                    <Select
                                        value={data.branch_id}
                                        onValueChange={(v) => setData('branch_id', v)}
                                        disabled={!auth.user.is_super_admin}
                                    >
                                        <SelectTrigger tabIndex={3}>
                                            <SelectValue placeholder="Select branch" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {branches.map((b) => (
                                                <SelectItem key={b.id} value={b.id.toString()}>
                                                    {b.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.branch_id} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Supplier</Label>
                                    <Select value={data.supplier_id} onValueChange={(v) => setData('supplier_id', v)}>
                                        <SelectTrigger tabIndex={4}>
                                            <SelectValue placeholder="Select supplier" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">No supplier</SelectItem>
                                            {suppliers.map((s) => (
                                                <SelectItem key={s.id} value={s.id.toString()}>
                                                    {s.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Purchase Date</Label>
                                    <Input
                                        type="date"
                                        value={data.purchase_date}
                                        onChange={(e) => setData('purchase_date', e.target.value)}
                                        tabIndex={5}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>PO Number</Label>
                                    <Input value={purchaseNo} disabled className="font-mono" />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Cart Items */}
                        <Card className="flex h-auto min-h-[300px] flex-col gap-2 py-2 lg:h-0 lg:min-h-0 lg:grow">
                            <CardHeader className="flex flex-row items-center justify-between px-3 py-0">
                                <div className="flex items-center gap-2">
                                    <Package className="h-5 w-5" />
                                    <CardTitle className="text-lg">Items</CardTitle>
                                    <Badge variant="secondary">{cart.length} items</Badge>
                                </div>
                                {cart.length > 0 && (
                                    <Button type="button" variant="ghost" size="sm" onClick={clearCart} tabIndex={-1}>
                                        <X className="mr-1 h-4 w-4" />
                                        Clear
                                    </Button>
                                )}
                            </CardHeader>
                            <CardContent className="h-auto p-2 lg:h-0 lg:grow lg:overflow-y-auto">
                                {cart.length === 0 ? (
                                    <div className="text-muted-foreground flex h-full items-center justify-center py-8">Add products to continue</div>
                                ) : (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Product</TableHead>
                                                <TableHead className="w-28 text-center">Qty</TableHead>
                                                <TableHead className="w-28">Unit Cost</TableHead>
                                                <TableHead className="text-right">Total</TableHead>
                                                <TableHead className="w-10"></TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {cart.map((item) => (
                                                <TableRow key={item.product_id}>
                                                    <TableCell>
                                                        <div className="font-small font-mono">{item.product.code}</div>
                                                        <div className="text-muted-foreground text-xs">{item.product.name}</div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center justify-center gap-1">
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                size="icon"
                                                                className="h-7 w-7"
                                                                onClick={() => updateQuantity(item.product_id, -1)}
                                                                tabIndex={-1}
                                                            >
                                                                <Minus className="h-3 w-3" />
                                                            </Button>
                                                            <input
                                                                type="number"
                                                                min="1"
                                                                value={item.quantity}
                                                                onChange={(e) => {
                                                                    const val = parseInt(e.target.value) || 0;
                                                                    setQuantity(item.product_id, val);
                                                                }}
                                                                className="h-7 w-14 [appearance:textfield] rounded border text-center font-mono [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                                                tabIndex={6}
                                                            />
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                size="icon"
                                                                className="h-7 w-7"
                                                                onClick={() => updateQuantity(item.product_id, 1)}
                                                                tabIndex={-1}
                                                            >
                                                                <Plus className="h-3 w-3" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Input
                                                            type="number"
                                                            value={item.unit_cost}
                                                            onChange={(e) => updateUnitCost(item.product_id, Number(e.target.value))}
                                                            className="h-8 w-24 text-right font-mono"
                                                            min={0}
                                                            tabIndex={7}
                                                        />
                                                    </TableCell>
                                                    <TableCell className="text-right font-mono font-medium">
                                                        {formatCurrency(item.subtotal)}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            className="text-destructive hover:text-destructive h-7 w-7"
                                                            onClick={() => removeFromCart(item.product_id)}
                                                            tabIndex={-1}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right: Totals and Payment */}
                    <div className="flex h-auto flex-col gap-2 lg:h-full">
                        {/* Totals and Payment */}
                        <Card className="gap-1 py-3">
                            <CardContent className="space-y-3 px-3">
                                <div className="flex justify-between text-sm">
                                    <span>Subtotal</span>
                                    <span className="font-mono">{formatCurrency(cartTotals.subtotal)} Ks</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span>Tax</span>
                                    <span className="font-mono">{formatCurrency(cartTotals.taxAmount)} Ks</span>
                                </div>
                                <Separator />
                                <div className="flex justify-between text-lg font-bold">
                                    <span>Total</span>
                                    <span className="text-primary font-mono">{formatCurrency(cartTotals.total)} Ks</span>
                                </div>
                                <Separator />
                                <div className="space-y-1">
                                    <Label className="text-xs">Amount Paid</Label>
                                    <Input
                                        ref={paidAmountInputRef}
                                        type="text"
                                        inputMode="numeric"
                                        value={data.paid_amount || ''}
                                        onChange={(e) => {
                                            const val = e.target.value.replace(/[^0-9]/g, '');
                                            setData('paid_amount', val === '' ? 0 : parseInt(val, 10));
                                        }}
                                        onKeyDown={(e) => {
                                            // E key sets exact amount
                                            if (e.key === 'e' || e.key === 'E') {
                                                e.preventDefault();
                                                setData('paid_amount', cartTotals.total);
                                            }
                                            // Enter moves to complete button
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                document.getElementById('complete-purchase-btn')?.focus();
                                            }
                                        }}
                                        className="h-9 font-mono"
                                        tabIndex={8}
                                    />
                                </div>
                                {/* Quick Amount Buttons */}
                                <div className="flex flex-wrap gap-2">
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => setData('paid_amount', cartTotals.total)}
                                        className="flex-1"
                                        tabIndex={-1}
                                    >
                                        Pay Full (E)
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setData('paid_amount', 0)}
                                        className="flex-1"
                                        tabIndex={-1}
                                    >
                                        Clear
                                    </Button>
                                </div>
                                {/* Balance Display */}
                                {data.paid_amount > 0 && data.paid_amount < cartTotals.total && (
                                    <div className="flex justify-between text-sm text-orange-600">
                                        <span>Balance Due</span>
                                        <span className="font-mono font-bold">{formatCurrency(cartTotals.total - data.paid_amount)} Ks</span>
                                    </div>
                                )}
                                <div className="space-y-1">
                                    <Label className="text-xs">Notes</Label>
                                    <Textarea
                                        value={data.notes}
                                        onChange={(e) => setData('notes', e.target.value)}
                                        rows={2}
                                        placeholder="Optional notes..."
                                        tabIndex={9}
                                    />
                                </div>
                                <InputError message={errors.items} />
                                <Button
                                    id="complete-purchase-btn"
                                    type="submit"
                                    className="h-12 w-full text-lg"
                                    disabled={processing || cart.length === 0}
                                    tabIndex={10}
                                >
                                    {processing ? 'Processing...' : `Record Purchase (F12) - ${formatCurrency(cartTotals.total)} Ks`}
                                </Button>
                                {/* Keyboard Shortcuts Help */}
                                <div className="text-muted-foreground text-center text-xs">
                                    F1: Search • F2: Barcode • E: Pay Full • Enter/F12: Complete
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </form>
            </AppLayout>

            {/* Success Dialog */}
            <PurchaseSuccessDialog
                open={successDialogOpen}
                onOpenChange={setSuccessDialogOpen}
                purchase={completedPurchase}
                onNewPurchase={handleNewPurchase}
                onPrint={handlePrint}
            />
        </>
    );
}
