import InputError from '@/components/input-error';
import { SaleSuccessDialog } from '@/components/sale-success-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverAnchor, PopoverContent } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useDirectPrint } from '@/hooks/use-direct-print';
import { useProductSearch } from '@/hooks/use-product-search';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, Branch, Customer, Product, SharedData } from '@/types';
import { Head, useForm, usePage } from '@inertiajs/react';
import { AlertTriangle, Barcode, Minus, Package, Pause, Play, Plus, Search, ShoppingCart, Trash2, X } from 'lucide-react';
import { FormEventHandler, useCallback, useEffect, useMemo, useRef, useState } from 'react';

type CartItem = {
    product_id: number;
    product: Product;
    quantity: number;
    unit_price: number;
    tax_rate: number;
    tax_amount: number;
    subtotal: number;
};

type HeldSale = {
    id: string;
    cart: CartItem[];
    timestamp: Date;
    note: string;
};

type SaleForm = {
    branch_id: string;
    customer_id: string;
    sale_date: string;
    subtotal: number;
    tax_amount: number;
    discount_amount: number;
    total_amount: number;
    payment_status: string;
    payment_method: string;
    paid_amount: number;
    credit_amount: number;
    notes: string;
    price_type: string;
    items: {
        product_id: number;
        quantity: number;
        unit_price: number;
        tax_rate: number;
        tax_amount: number;
        subtotal: number;
    }[];
};

const breadcrumbs: BreadcrumbItem[] = [{ title: 'POS', href: route('sales.create') }];

const formatCurrency = (value: number | string | null | undefined) => {
    const num = Number(value) || 0;
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(num);
};

const paymentMethods = ['Cash', 'KBZ Pay', 'Wave Money', 'Bank Transfer', 'Card'];

type CompletedSale = {
    id: number;
    invoice_no: string;
    total_amount: number;
    paid_amount: number;
    credit_amount: number;
    payment_status: string;
    customer?: {
        id: number;
        name: string;
    };
};

export default function SaleCreate({ branches, customers }: { branches: Branch[]; customers: Customer[]; invoiceNo: string }) {
    // Get flash and auth data
    const { auth, flash } = usePage<SharedData & { flash: { completedSale?: CompletedSale } }>().props;

    // Success dialog state
    const [successDialogOpen, setSuccessDialogOpen] = useState(false);
    const [completedSale, setCompletedSale] = useState<CompletedSale | null>(null);

    // Open dialog when flash data contains completed sale
    useEffect(() => {
        if (flash?.completedSale) {
            setCompletedSale(flash.completedSale);
            setSuccessDialogOpen(true);
        }
    }, [flash?.completedSale]);

    const today = new Date().toISOString().split('T')[0];
    const [cart, setCart] = useState<CartItem[]>([]);
    const [discountPercentage, setDiscountPercentage] = useState<string>('');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchOpen, setSearchOpen] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [heldSales, setHeldSales] = useState<HeldSale[]>([]);
    const [showNotes, setShowNotes] = useState(false);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const barcodeInputRef = useRef<HTMLInputElement>(null);
    const discountInputRef = useRef<HTMLInputElement>(null);
    const paidAmountInputRef = useRef<HTMLInputElement>(null);

    const defaultBranchId = auth.user.is_super_admin ? branches[0]?.id?.toString() || '' : auth.user.branch_id?.toString() || '';

    // Server-side product search
    const {
        products: searchResults,
        search: searchProducts,
        lookupBarcode,
    } = useProductSearch({
        branchId: defaultBranchId,
        context: 'sale',
    });

    const { data, setData, post, errors, processing, reset } = useForm<SaleForm>({
        branch_id: defaultBranchId,
        customer_id: 'walk-in',
        sale_date: today,
        subtotal: 0,
        tax_amount: 0,
        discount_amount: 0,
        total_amount: 0,
        payment_status: 'paid',
        payment_method: 'Cash',
        paid_amount: 0,
        credit_amount: 0,
        notes: '',
        price_type: 'selling_price',
        items: [],
    });

    // Helper to get product details based on selected branch
    const getProductDetails = useCallback(
        (product: Product) => {
            const branchId = parseInt(data.branch_id);
            // If no branch selected or no branch stocks loaded, fallback to default
            if (!branchId || !product.branch_stocks) {
                return {
                    stock: product.stock ?? 0,
                    price: data.price_type === 'cost_price' ? Number(product.cost_price) : Number(product.selling_price),
                    cost: Number(product.cost_price),
                };
            }
            const stock = product.branch_stocks.find((bs) => bs.branch_id === branchId);
            return {
                stock: stock?.quantity ?? 0,
                price:
                    data.price_type === 'cost_price'
                        ? stock?.cost_price
                            ? Number(stock.cost_price)
                            : Number(product.cost_price)
                        : stock?.selling_price
                          ? Number(stock.selling_price)
                          : Number(product.selling_price),
                cost: stock?.cost_price ? Number(stock.cost_price) : Number(product.cost_price),
                groupName: stock?.group?.name, // Add group name
            };
        },
        [data.branch_id, data.price_type],
    );

    // Clear cart when branch changes to avoid price/stock mismatches
    useEffect(() => {
        setCart([]);
    }, [data.branch_id]);

    // Calculate totals when cart changes
    const cartTotals = useMemo(() => {
        const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
        const taxAmount = cart.reduce((sum, item) => sum + item.tax_amount, 0);
        const total = subtotal + taxAmount - Number(data.discount_amount || 0);
        return { subtotal, taxAmount, total };
    }, [cart, data.discount_amount]);

    // Update form data when cart or totals change
    useEffect(() => {
        const items = cart.map((item) => ({
            product_id: item.product_id,
            quantity: item.quantity,
            unit_price: item.unit_price,
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

    // Update credit amount when paid amount changes
    useEffect(() => {
        const credit = Math.max(0, cartTotals.total - data.paid_amount);
        const status = credit === 0 ? 'paid' : credit < cartTotals.total ? 'partial' : 'unpaid';
        setData((prev) => ({
            ...prev,
            credit_amount: credit,
            payment_status: status,
        }));
    }, [data.paid_amount, cartTotals.total, setData]);

    // Recalculate discount if percentage is active
    useEffect(() => {
        if (discountPercentage && cartTotals.subtotal > 0) {
            const perc = parseFloat(discountPercentage);
            if (!isNaN(perc)) {
                setData('discount_amount', Math.round(cartTotals.subtotal * (perc / 100)));
            }
        }
    }, [cartTotals.subtotal, discountPercentage, setData]);

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
                                  tax_amount: (item.quantity + 1) * item.unit_price * (item.tax_rate / 100),
                                  subtotal: (item.quantity + 1) * item.unit_price,
                              }
                            : item,
                    );
                }
                const details = getProductDetails(product);
                const newItem: CartItem = {
                    product_id: product.id,
                    product,
                    quantity: 1,
                    unit_price: details.price,
                    tax_rate: Number(product.tax_rate),
                    tax_amount: details.price * (Number(product.tax_rate) / 100),
                    subtotal: details.price,
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
                            tax_amount: newQty * item.unit_price * (item.tax_rate / 100),
                            subtotal: newQty * item.unit_price,
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
                        tax_amount: quantity * item.unit_price * (item.tax_rate / 100),
                        subtotal: quantity * item.unit_price,
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
        setDiscountPercentage('');
        setData((prev) => ({ ...prev, paid_amount: 0, discount_amount: 0 }));
    }, [setData]);

    // Hold/Recall Sale functionality
    const holdSale = useCallback(() => {
        if (cart.length === 0) return;
        const heldSale: HeldSale = {
            id: Date.now().toString(),
            cart: [...cart],
            timestamp: new Date(),
            note: `${cart.length} items - ${formatCurrency(cartTotals.total)} Ks`,
        };
        setHeldSales((prev) => [...prev, heldSale]);
        clearCart();
    }, [cart, cartTotals.total, clearCart]);

    const recallSale = (id: string) => {
        const sale = heldSales.find((s) => s.id === id);
        if (sale) {
            setCart(sale.cart);
            setHeldSales((prev) => prev.filter((s) => s.id !== id));
        }
    };

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
            // F8 - Hold sale
            if (e.key === 'F8') {
                e.preventDefault();
                holdSale();
            }
            // F12 or Ctrl+Enter - Complete sale
            if (e.key === 'F12' || (e.ctrlKey && e.key === 'Enter')) {
                e.preventDefault();
                if (cart.length > 0 && !processing) {
                    document.getElementById('complete-sale-btn')?.click();
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
    }, [cart.length, processing, holdSale]);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('sales.store'), {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                setCart([]);
            },
        });
    };

    const selectedCustomer = data.customer_id !== 'walk-in' ? customers.find((c) => c.id.toString() === data.customer_id) : undefined;

    // Handle print action from success dialog
    const { printUrl } = useDirectPrint();

    // Handle print action from success dialog
    const handlePrint = (format: 'a4' | 'a5' | 'thermal') => {
        if (!completedSale) return;
        // Print directly using hidden iframe
        printUrl(route('sales.print', { sale: completedSale.id, format }));
    };

    // Handle new sale action from success dialog
    const handleNewSale = () => {
        reset();
        setCart([]);
        setCompletedSale(null);
        searchInputRef.current?.focus();
    };

    return (
        <>
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="POS - New Sale" />
                <form
                    onSubmit={submit}
                    className="grid h-auto grid-cols-1 gap-2 p-2 lg:h-[calc(100vh-110px)] lg:grid-cols-[1fr_340px] lg:overflow-hidden xl:grid-cols-[1fr_minmax(400px,450px)]"
                >
                    {/* Left: Product Selection */}
                    <div className="flex h-auto flex-col gap-2 lg:h-full lg:min-h-0 lg:overflow-hidden">
                        {/* Keyboard-First Product Search */}
                        <div className="flex gap-4">
                            <Popover open={searchOpen} onOpenChange={setSearchOpen}>
                                <PopoverAnchor asChild>
                                    <div className="relative flex-1">
                                        <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 z-10 h-4 w-4 -translate-y-1/2" />
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
                                                        // Prevent adding if out of stock
                                                        if (getProductDetails(selectedProduct).stock <= 0) return;

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
                                            className="h-10 pl-9 font-medium"
                                        />
                                    </div>
                                </PopoverAnchor>
                                <PopoverContent
                                    className="w-[var(--radix-popover-trigger-width)] p-0"
                                    align="start"
                                    onOpenAutoFocus={(e) => e.preventDefault()}
                                    onInteractOutside={(e) => {
                                        // Don't close if clicking inside the search input
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
                                                            if (getProductDetails(product).stock <= 0) return;
                                                            addToCart(product);
                                                            setSearchQuery('');
                                                            setSearchOpen(false);
                                                            setSelectedIndex(0);
                                                            // Keep focus in search for quick sequential entry
                                                            setTimeout(() => searchInputRef.current?.focus(), 0);
                                                        }}
                                                        disabled={getProductDetails(product).stock <= 0}
                                                        className={`flex items-center justify-between gap-2 ${
                                                            getProductDetails(product).stock <= 0 ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
                                                        } ${index === selectedIndex ? 'bg-accent text-accent-foreground' : ''}`}
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
                                                                {formatCurrency(getProductDetails(product).price)}
                                                            </span>
                                                            {getProductDetails(product).stock <= 10 ? (
                                                                <Badge variant="destructive" className="text-xs">
                                                                    <AlertTriangle className="mr-1 h-3 w-3" />
                                                                    {getProductDetails(product).stock}
                                                                </Badge>
                                                            ) : (
                                                                <Badge variant="secondary" className="text-xs">
                                                                    <Package className="mr-1 h-3 w-3" />
                                                                    {getProductDetails(product).stock}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                            <div className="relative w-48">
                                <Barcode className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                                <Input
                                    ref={barcodeInputRef}
                                    placeholder="Scan barcode (F2)..."
                                    onKeyDown={handleBarcodeInput}
                                    className="h-10 w-full pl-9"
                                    tabIndex={2}
                                />
                            </div>
                        </div>

                        {/* Header with Branch, Customer, and Price Type */}
                        <Card className="border-slate-200 py-2 shadow-xs dark:border-slate-800">
                            <CardContent className="grid grid-cols-1 gap-2 px-3 sm:grid-cols-3">
                                <div className="space-y-1.5">
                                    <Label className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">Branch</Label>
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
                                <div className="space-y-1.5">
                                    <Label className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">Customer</Label>
                                    <Select value={data.customer_id} onValueChange={(v) => setData('customer_id', v)}>
                                        <SelectTrigger tabIndex={4}>
                                            <SelectValue placeholder="Walk-in customer" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="walk-in">Walk-in Customer</SelectItem>
                                            {customers.map((c) => (
                                                <SelectItem key={c.id} value={c.id.toString()}>
                                                    {c.name} ({c.code})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">Price Type</Label>
                                    <Select
                                        value={data.price_type}
                                        onValueChange={(v) => {
                                            setData('price_type', v);
                                            // Recalculate cart prices instantly based on new price type
                                            setCart((prev) =>
                                                prev.map((item) => {
                                                    const product = item.product;
                                                    const branchId = parseInt(data.branch_id);
                                                    const stock = product.branch_stocks?.find((bs) => bs.branch_id === branchId);
                                                    const newPrice =
                                                        v === 'cost_price'
                                                            ? stock?.cost_price
                                                                ? Number(stock.cost_price)
                                                                : Number(product.cost_price)
                                                            : stock?.selling_price
                                                              ? Number(stock.selling_price)
                                                              : Number(product.selling_price);

                                                    return {
                                                        ...item,
                                                        unit_price: newPrice,
                                                        tax_amount: item.quantity * newPrice * (item.tax_rate / 100),
                                                        subtotal: newPrice * item.quantity,
                                                    };
                                                }),
                                            );
                                        }}
                                    >
                                        <SelectTrigger tabIndex={5}>
                                            <SelectValue placeholder="Select Price Type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="selling_price">Selling Price</SelectItem>
                                            <SelectItem value="cost_price">Cost Price</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                {showNotes ? (
                                    <div className="col-span-full space-y-1.5">
                                        <div className="flex items-center justify-between">
                                            <Label>Notes</Label>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setShowNotes(false);
                                                    setData('notes', '');
                                                }}
                                                className="text-destructive text-xs hover:underline"
                                            >
                                                Remove Notes
                                            </button>
                                        </div>
                                        <Textarea
                                            placeholder="Add sale notes..."
                                            value={data.notes}
                                            onChange={(e) => setData('notes', e.target.value)}
                                            className="min-h-[60px]"
                                            tabIndex={5}
                                        />
                                        <InputError message={errors.notes} />
                                    </div>
                                ) : (
                                    <div className="col-span-full">
                                        <button
                                            type="button"
                                            onClick={() => setShowNotes(true)}
                                            className="text-primary flex items-center gap-1 text-xs font-medium hover:underline"
                                        >
                                            + Add Notes
                                        </button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Held Sales */}
                        {heldSales.length > 0 && (
                            <Card className="border-orange-200 bg-orange-50 py-2 dark:border-orange-800 dark:bg-orange-950/20">
                                <CardContent className="py-0">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-orange-700 dark:text-orange-400">
                                            <Pause className="mr-1 inline h-4 w-4" />
                                            {heldSales.length} Held Sale(s)
                                        </span>
                                        <div className="flex gap-1">
                                            {heldSales.map((held, index) => (
                                                <Button
                                                    key={held.id}
                                                    type="button"
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => recallSale(held.id)}
                                                    className="text-xs"
                                                >
                                                    <Play className="mr-1 h-3 w-3" />#{index + 1}
                                                </Button>
                                            ))}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Cart Items */}
                        <Card className="flex h-auto min-h-[300px] flex-col gap-2 border-slate-200 py-2 shadow-xs lg:h-0 lg:min-h-0 lg:grow dark:border-slate-800">
                            <CardHeader className="flex flex-row items-center justify-between px-3 py-0">
                                <div className="flex items-center gap-2">
                                    <ShoppingCart className="h-5 w-5 text-indigo-500" />
                                    <CardTitle className="text-lg font-bold">Cart</CardTitle>
                                    <Badge variant="secondary" className="font-mono">
                                        {cart.length} items
                                    </Badge>
                                </div>
                                <div className="flex gap-1">
                                    {cart.length > 0 && (
                                        <>
                                            <Button type="button" variant="outline" size="sm" onClick={holdSale} tabIndex={-1}>
                                                <Pause className="mr-1 h-4 w-4" />
                                                Hold (F8)
                                            </Button>
                                            <Button type="button" variant="ghost" size="sm" onClick={clearCart} tabIndex={-1}>
                                                <X className="mr-1 h-4 w-4" />
                                                Clear
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent className="h-auto p-2 lg:h-0 lg:grow lg:overflow-y-auto">
                                {cart.length === 0 ? (
                                    <div className="text-muted-foreground flex h-full flex-col items-center justify-center gap-2 py-8">
                                        <ShoppingCart className="h-10 w-10 opacity-20" />
                                        <span className="text-sm">Cart is empty. Add products to start.</span>
                                    </div>
                                ) : (
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-muted/40">
                                                <TableHead className="font-semibold">Product</TableHead>
                                                <TableHead className="w-28 text-center font-semibold">Qty</TableHead>
                                                <TableHead className="text-right font-semibold">Total</TableHead>
                                                <TableHead className="w-10"></TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {cart.map((item) => (
                                                <TableRow key={item.product_id} className="hover:bg-muted/30 transition-colors">
                                                    <TableCell>
                                                        <div className="font-mono text-sm font-semibold">{item.product.code}</div>
                                                        <div className="text-muted-foreground text-xs">
                                                            {item.product.name}
                                                            <span className="text-muted-foreground/50 mx-1">·</span>
                                                            <span className="font-mono text-indigo-600 dark:text-indigo-400">
                                                                {formatCurrency(item.unit_price)} Ks
                                                            </span>
                                                            {/* Display Group Name if available */}
                                                            {getProductDetails(item.product).groupName && (
                                                                <span className="ml-2 inline-flex items-center rounded-md bg-blue-50 px-2 py-0 text-xs font-medium text-blue-700 ring-1 ring-blue-700/10 ring-inset dark:bg-blue-950/40 dark:text-blue-400">
                                                                    {getProductDetails(item.product).groupName}
                                                                </span>
                                                            )}
                                                        </div>
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
                                                                tabIndex={5}
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
                                                    <TableCell className="text-foreground text-right font-mono font-semibold">
                                                        {formatCurrency(item.subtotal)}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            className="text-destructive hover:text-destructive h-7 w-7"
                                                            onClick={() => removeFromCart(item.product_id)}
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
                        <Card className="gap-1 border-slate-200 py-3 shadow-xs dark:border-slate-800">
                            <CardContent className="space-y-3 px-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Subtotal</span>
                                    <span className="font-mono font-medium">{formatCurrency(cartTotals.subtotal)} Ks</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Tax</span>
                                    <span className="font-mono font-medium">{formatCurrency(cartTotals.taxAmount)} Ks</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Discount</span>
                                    <div className="flex items-center gap-2">
                                        <div className="relative">
                                            <Input
                                                type="text"
                                                inputMode="decimal"
                                                value={discountPercentage}
                                                placeholder="%"
                                                onChange={(e) => {
                                                    let val = e.target.value.replace(/[^0-9.]/g, '');
                                                    if (val.split('.').length > 2) val = val.substring(0, val.length - 1);
                                                    setDiscountPercentage(val);
                                                    if (val === '') {
                                                        setData('discount_amount', 0);
                                                    } else if (cartTotals.subtotal > 0) {
                                                        const perc = parseFloat(val);
                                                        if (!isNaN(perc)) {
                                                            setData('discount_amount', Math.round(cartTotals.subtotal * (perc / 100)));
                                                        }
                                                    }
                                                }}
                                                className="h-8 w-16 pr-6 text-right font-mono"
                                                tabIndex={6}
                                            />
                                            <span className="text-muted-foreground absolute top-1.5 right-2 text-xs">%</span>
                                        </div>
                                        <Input
                                            ref={discountInputRef}
                                            type="text"
                                            inputMode="numeric"
                                            value={data.discount_amount || ''}
                                            placeholder="Ks"
                                            onChange={(e) => {
                                                const val = e.target.value.replace(/[^0-9]/g, '');
                                                setData('discount_amount', val === '' ? 0 : parseInt(val, 10));
                                                setDiscountPercentage('');
                                            }}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    paidAmountInputRef.current?.focus();
                                                }
                                            }}
                                            className="h-8 w-24 text-right font-mono"
                                            tabIndex={7}
                                        />
                                    </div>
                                </div>
                                <Separator />
                                <div className="flex justify-between text-lg font-bold">
                                    <span>Total</span>
                                    <span className="font-mono text-indigo-600 dark:text-indigo-400">{formatCurrency(cartTotals.total)} Ks</span>
                                </div>
                                <Separator />
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <Label className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">Payment Method</Label>
                                        <Select value={data.payment_method} onValueChange={(v) => setData('payment_method', v)}>
                                            <SelectTrigger className="h-9" tabIndex={8}>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {paymentMethods.map((m) => (
                                                    <SelectItem key={m} value={m}>
                                                        {m}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">Paid Amount</Label>
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
                                                    document.getElementById('complete-sale-btn')?.focus();
                                                }
                                            }}
                                            className="h-9 font-mono"
                                            tabIndex={9}
                                        />
                                    </div>
                                </div>
                                {/* Quick Cash Buttons */}
                                <div className="flex flex-wrap gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setData('paid_amount', data.paid_amount + 1000)}
                                        className="flex-1"
                                        tabIndex={-1}
                                    >
                                        +1,000
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setData('paid_amount', data.paid_amount + 5000)}
                                        className="flex-1"
                                        tabIndex={-1}
                                    >
                                        +5,000
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setData('paid_amount', data.paid_amount + 10000)}
                                        className="flex-1"
                                        tabIndex={-1}
                                    >
                                        +10,000
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => setData('paid_amount', cartTotals.total)}
                                        className="flex-1"
                                        tabIndex={-1}
                                    >
                                        Exact (E)
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
                                {/* Change Display */}
                                {data.paid_amount > cartTotals.total && (
                                    <div className="flex justify-between rounded-lg bg-green-100 p-2 text-sm text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                        <span className="font-medium">Change</span>
                                        <span className="font-mono font-bold">{formatCurrency(data.paid_amount - cartTotals.total)} Ks</span>
                                    </div>
                                )}
                                {data.credit_amount > 0 && (
                                    <div className="flex justify-between text-sm text-red-600">
                                        <span>Credit Amount</span>
                                        <span className="font-mono font-bold">{formatCurrency(data.credit_amount)} Ks</span>
                                    </div>
                                )}
                                {selectedCustomer && data.credit_amount > 0 && (
                                    <div className="text-muted-foreground text-xs">
                                        Customer balance after: {formatCurrency(selectedCustomer.current_balance + data.credit_amount)} Ks (Limit:{' '}
                                        {formatCurrency(selectedCustomer.credit_limit)} Ks)
                                    </div>
                                )}
                                <InputError message={errors.items} />
                                <Button
                                    id="complete-sale-btn"
                                    type="submit"
                                    className="h-12 w-full bg-indigo-600 text-base font-bold tracking-wide hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50"
                                    disabled={processing || cart.length === 0}
                                    tabIndex={10}
                                >
                                    {processing ? 'Processing...' : `Complete Sale (F12) — ${formatCurrency(cartTotals.total)} Ks`}
                                </Button>
                                {/* Keyboard Shortcuts Help */}
                                <div className="text-muted-foreground/70 text-center text-[10px] tracking-wide">
                                    F1: Search &nbsp;·&nbsp; F2: Barcode &nbsp;·&nbsp; F8: Hold &nbsp;·&nbsp; E: Exact &nbsp;·&nbsp; Enter/F12:
                                    Complete
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </form>
            </AppLayout>

            {/* Success Dialog */}
            <SaleSuccessDialog
                open={successDialogOpen}
                onOpenChange={setSuccessDialogOpen}
                sale={completedSale}
                onNewSale={handleNewSale}
                onPrint={handlePrint}
            />
        </>
    );
}
