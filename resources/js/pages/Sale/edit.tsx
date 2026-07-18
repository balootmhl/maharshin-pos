import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverAnchor, PopoverContent } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { useProductSearch } from '@/hooks/use-product-search';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, Branch, Customer, Product, Sale, SharedData } from '@/types';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { AlertTriangle, ArrowLeft, Barcode, Loader2, Minus, Package, Plus, Save, Search, ShoppingCart, Trash2 } from 'lucide-react';
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

type SaleForm = {
    invoice_no: string;
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
    // Add missing field for validation if needed, though usually handled by backend auth
    creator_id?: number;
};

const formatCurrency = (value: number | string | null | undefined) => {
    const num = Number(value) || 0;
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(num);
};

export default function SaleEdit({ sale, branches, customers }: { sale: Sale; branches: Branch[]; customers: Customer[] }) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Sales', href: route('sales.index') },
        { title: `Edit ${sale.invoice_no}`, href: '#' },
    ];

    const { auth } = usePage<SharedData>().props;

    const [cart, setCart] = useState<CartItem[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchOpen, setSearchOpen] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [discountPercentage, setDiscountPercentage] = useState<string>(
        Number(sale.discount_amount) > 0 && Number(sale.subtotal) > 0
            ? parseFloat(((Number(sale.discount_amount) / Number(sale.subtotal)) * 100).toFixed(2)).toString()
            : '',
    );
    const [showNotes, setShowNotes] = useState(!!sale.notes);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const barcodeInputRef = useRef<HTMLInputElement>(null);
    const discountInputRef = useRef<HTMLInputElement>(null);
    const paidAmountInputRef = useRef<HTMLInputElement>(null);

    // Initialize Cart from Sale Items
    useEffect(() => {
        if (sale.sale_items) {
            const initialCart: CartItem[] = sale.sale_items.map((item) => ({
                product_id: item.product_id,
                product: item.product as Product, // Assumes product is loaded
                quantity: Number(item.quantity) || 0,
                unit_price: Number(item.unit_price) || 0,
                tax_rate: Number(item.tax_rate) || 0,
                tax_amount: Number(item.tax_amount) || 0,
                subtotal: Number(item.subtotal) || 0,
            }));
            setCart(initialCart);
        }
    }, [sale]);

    const { data, setData, put, errors, processing } = useForm<SaleForm>({
        invoice_no: sale.invoice_no,
        branch_id: sale.branch_id.toString(),
        customer_id: sale.customer_id ? sale.customer_id.toString() : 'walk-in',
        sale_date: sale.sale_date,
        subtotal: Number(sale.subtotal) || 0,
        tax_amount: Number(sale.tax_amount) || 0,
        discount_amount: Number(sale.discount_amount) || 0,
        total_amount: Number(sale.total_amount) || 0,
        payment_status: sale.payment_status,
        payment_method: sale.payment_method || 'Cash',
        paid_amount: Number(sale.paid_amount) || 0,
        credit_amount: Number(sale.credit_amount) || 0,
        notes: sale.notes || '',
        price_type: sale.price_type || 'selling_price',
        items: [],
        creator_id: sale.created_by,
    });

    // Server-side product search
    const {
        products: searchResults,
        search: searchProducts,
        lookupBarcode,
    } = useProductSearch({
        branchId: data.branch_id,
        context: 'sale',
    });

    // Helper to get product details based on selected branch
    // Note: detailed stock logic might be complex across branch changes
    const getProductDetails = useCallback(
        (product: Product) => {
            const branchId = parseInt(data.branch_id);
            if (!branchId || !product.branch_stocks) {
                return {
                    stock: product.stock ?? 0,
                    price: data.price_type === 'cost_price' ? Number(product.cost_price) : Number(product.selling_price),
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
            };
        },
        [data.branch_id, data.price_type],
    );

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

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        put(route('sales.update', sale.id), {
            preserveScroll: true,
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit ${sale.invoice_no}`} />
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
                                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Branch</Label>
                                <Select value={data.branch_id} onValueChange={(v) => setData('branch_id', v)} disabled={!auth.user.is_super_admin}>
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
                                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Customer</Label>
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
                                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Price Type</Label>
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

                    {/* Cart Items */}
                    <Card className="flex h-auto min-h-[300px] flex-col gap-2 border-slate-200 py-2 shadow-xs dark:border-slate-800 lg:h-0 lg:min-h-0 lg:grow">
                        <CardHeader className="flex flex-row items-center justify-between px-3 py-0">
                            <div className="flex items-center gap-2">
                                <ShoppingCart className="h-5 w-5 text-indigo-500" />
                                <CardTitle className="text-lg font-bold">Cart (Edit Mode)</CardTitle>
                                <Badge variant="secondary" className="font-mono">{cart.length} items</Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="h-auto p-2 lg:h-0 lg:grow lg:overflow-y-auto">
                            <Table>
                                <TableHeader className="bg-background sticky top-0 z-10 shadow-sm">
                                    <TableRow className="bg-muted/40">
                                        <TableHead className="font-semibold">Product</TableHead>
                                        <TableHead className="w-28 text-center font-semibold">Qty</TableHead>
                                        <TableHead className="text-right font-semibold">Total</TableHead>
                                        <TableHead className="w-10"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {cart.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-muted-foreground h-32 text-center">
                                                No items in cart
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        cart.map((item) => (
                                            <TableRow key={item.product_id} className="group hover:bg-muted/30 transition-colors">
                                                <TableCell>
                                                    <div className="line-clamp-1 font-mono text-sm font-semibold">{item.product.name}</div>
                                                    <div className="text-muted-foreground flex gap-2 text-xs">
                                                        <span className="font-medium">{item.product.code}</span>
                                                        {item.product.barcode && <span>· {item.product.barcode}</span>}
                                                        <span className="font-mono text-indigo-600 dark:text-indigo-400">· @ {formatCurrency(item.unit_price)} Ks</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center justify-center gap-1">
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="icon"
                                                            className="h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100"
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
                                                            className="focus:ring-ring h-7 w-12 [appearance:textfield] rounded border text-center font-mono text-sm focus:ring-1 focus:outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                                            tabIndex={2}
                                                        />
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="icon"
                                                            className="h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100"
                                                            onClick={() => updateQuantity(item.product_id, 1)}
                                                            tabIndex={-1}
                                                        >
                                                            <Plus className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right font-mono font-semibold text-foreground">{formatCurrency(item.subtotal)}</TableCell>
                                                <TableCell>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-destructive hover:bg-destructive/10 hover:text-destructive h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100"
                                                        onClick={() => removeFromCart(item.product_id)}
                                                        tabIndex={-1}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>

                {/* Right: Payment */}
                <div className="flex h-auto flex-col gap-2 pr-1 lg:h-full lg:overflow-y-auto">
                    <Card className="gap-1 border-slate-200 py-3 shadow-xs dark:border-slate-800">
                        <CardHeader className="flex items-center justify-between px-3 py-0">
                            <CardTitle className="text-lg">Payment</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 px-3">
                            <div className="space-y-2 overflow-hidden rounded-lg bg-slate-50 p-4 dark:bg-slate-900">
                                <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400">
                                    <span>Subtotal</span>
                                    <span className="font-mono">{formatCurrency(cartTotals.subtotal)} Ks</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-600 dark:text-slate-400">Tax</span>
                                    <span className="font-mono">{formatCurrency(cartTotals.taxAmount)} Ks</span>
                                </div>
                                <div className="group flex items-center justify-between text-sm">
                                    <span className="flex items-center gap-1 text-slate-600 dark:text-slate-400">Discount</span>
                                    <div className="flex w-[180px] items-center justify-end gap-2">
                                        <div className="relative w-16">
                                            <Input
                                                ref={discountInputRef}
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
                                                className="focus-visible:border-primary h-8 w-16 px-2 py-1 pr-5 text-right font-mono text-sm shadow-none focus-visible:ring-1"
                                                tabIndex={6}
                                            />
                                            <span className="text-muted-foreground pointer-events-none absolute top-1.5 right-1 text-[10px]">%</span>
                                        </div>
                                        <div className="relative flex-1 transition-all ease-in-out group-hover:block">
                                            <Input
                                                type="text"
                                                inputMode="numeric"
                                                value={data.discount_amount || ''}
                                                placeholder="Amount"
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
                                                className="focus-visible:border-primary h-8 w-full px-2 py-1 text-right font-mono text-sm shadow-none focus-visible:ring-1"
                                                tabIndex={7}
                                            />
                                            <span className="text-muted-foreground pointer-events-none absolute top-1.5 left-2 text-[10px]">Ks</span>
                                        </div>
                                    </div>
                                </div>
                                <Separator className="my-2 bg-slate-200 dark:bg-slate-800" />
                                <div className="flex items-end justify-between">
                                    <span className="text-base font-medium text-slate-800 dark:text-slate-200">Total</span>
                                    <span className="font-mono text-3xl font-bold tracking-tight text-indigo-600 dark:text-indigo-400">
                                        <span className="mr-1 font-sans text-xl font-normal text-indigo-400 dark:text-indigo-600">Ks</span>
                                        {formatCurrency(cartTotals.total)}
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label className="text-muted-foreground text-xs">Payment Method</Label>
                                    <Select value={data.payment_method} onValueChange={(v) => setData('payment_method', v)}>
                                        <SelectTrigger className="bg-background h-10 border-slate-200 text-sm" tabIndex={8}>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Cash">Cash</SelectItem>
                                            <SelectItem value="KBZ Pay">KBZ Pay</SelectItem>
                                            <SelectItem value="Wave Money">Wave Money</SelectItem>
                                            <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                                            <SelectItem value="Card">Card</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-muted-foreground text-xs">Invoice No</Label>
                                    <Input value={data.invoice_no} disabled className="bg-muted h-10 font-mono" />
                                </div>
                            </div>

                            <Separator />

                            <div className="space-y-2">
                                <Label className="text-sm font-medium">Paid Amount</Label>
                                <div className="relative">
                                    <span className="text-muted-foreground absolute top-2.5 left-3 font-mono">Ks</span>
                                    <Input
                                        ref={paidAmountInputRef}
                                        type="text"
                                        inputMode="numeric"
                                        value={data.paid_amount || ''}
                                        onChange={(e) => {
                                            const val = e.target.value.replace(/[^0-9]/g, '');
                                            setData('paid_amount', val === '' ? 0 : parseInt(val, 10));
                                        }}
                                        className="bg-background focus-visible:border-primary h-12 border-slate-300 pr-4 pl-10 text-right font-mono text-xl font-bold shadow-inner transition-colors focus-visible:bg-slate-50 disabled:opacity-100 dark:focus-visible:bg-slate-900"
                                        tabIndex={9}
                                    />
                                    {cartTotals.total > 0 && data.paid_amount !== cartTotals.total && (
                                        <div className="absolute top-14 right-0 left-0 flex justify-end gap-1 px-1">
                                            <button
                                                type="button"
                                                onClick={() => setData('paid_amount', cartTotals.total)}
                                                className="text-primary text-[10px] font-medium hover:underline"
                                                tabIndex={-1}
                                            >
                                                Full Payment
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {data.credit_amount > 0 && (
                                <div className="rounded border border-red-200 bg-red-50 p-3 dark:border-red-900 dark:bg-red-950/20">
                                    <div className="flex justify-between px-1 text-sm text-red-800 dark:text-red-400">
                                        <span className="font-medium">Credit Balance</span>
                                        <span className="font-mono">{formatCurrency(data.credit_amount)} Ks</span>
                                    </div>
                                    {data.customer_id === 'walk-in' && (
                                        <p className="mt-1 text-xs text-red-600 dark:text-red-500">Warning: Walk-in customers cannot have credit</p>
                                    )}
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4 pt-0">
                                <Button asChild variant="outline" className="w-full">
                                    <Link href={route('sales.index')}>
                                        <ArrowLeft className="mr-2 h-4 w-4" /> Back
                                    </Link>
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={processing || cart.length === 0 || (data.credit_amount > 0 && data.customer_id === 'walk-in')}
                                    className="w-full"
                                    onClick={() => {
                                        // Give focus back to barcode after clicking
                                        setTimeout(() => barcodeInputRef.current?.focus(), 100);
                                    }}
                                >
                                    {processing ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="mr-2 h-4 w-4" /> Update Sale
                                        </>
                                    )}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </form>
        </AppLayout>
    );
}
