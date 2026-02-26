import InputError from '@/components/input-error';
import { useProductSearch } from '@/hooks/use-product-search';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverAnchor, PopoverContent } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, Branch, Category, Customer, Product, Sale } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { AlertTriangle, Loader2, Minus, Package, Plus, ShoppingCart, Trash2, ArrowLeft, Save } from 'lucide-react';
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

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
};

export default function SaleEdit({
    sale,
    branches,
    customers,
    categories,
}: {
    sale: Sale;
    branches: Branch[];
    customers: Customer[];
    categories: Category[];
}) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Sales', href: route('sales.index') },
        { title: `Edit ${sale.invoice_no}`, href: '#' },
    ];

    const [cart, setCart] = useState<CartItem[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchOpen, setSearchOpen] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
    const [discountPercentage, setDiscountPercentage] = useState<string>(
        sale.discount_amount > 0 && sale.subtotal > 0
            ? parseFloat(((sale.discount_amount / sale.subtotal) * 100).toFixed(2)).toString()
            : ''
    );
    const searchInputRef = useRef<HTMLInputElement>(null);
    const barcodeInputRef = useRef<HTMLInputElement>(null);
    const discountInputRef = useRef<HTMLInputElement>(null);
    const paidAmountInputRef = useRef<HTMLInputElement>(null);

    // Initialize Cart from Sale Items
    useEffect(() => {
        if (sale.sale_items) {
            const initialCart: CartItem[] = sale.sale_items.map(item => ({
                product_id: item.product_id,
                product: item.product as Product, // Assumes product is loaded
                quantity: item.quantity,
                unit_price: item.unit_price,
                tax_rate: item.tax_rate ?? 0,
                tax_amount: item.tax_amount,
                subtotal: item.subtotal,
            }));
            setCart(initialCart);
        }
    }, [sale]);

    // Server-side product search
    const { products: searchResults, isLoading: isSearching, search: searchProducts, searchByCategory, lookupBarcode } = useProductSearch({
        branchId: sale.branch_id.toString(), // Use sale branch initially
        context: 'sale',
    });

    const { data, setData, put, errors, processing } = useForm<SaleForm>({
        invoice_no: sale.invoice_no,
        branch_id: sale.branch_id.toString(),
        customer_id: sale.customer_id ? sale.customer_id.toString() : 'walk-in',
        sale_date: sale.sale_date,
        subtotal: sale.subtotal,
        tax_amount: sale.tax_amount,
        discount_amount: sale.discount_amount,
        total_amount: sale.total_amount,
        payment_status: sale.payment_status,
        payment_method: sale.payment_method || 'Cash',
        paid_amount: sale.paid_amount,
        credit_amount: sale.credit_amount,
        notes: sale.notes || '',
        items: [],
        creator_id: sale.created_by,
    });

    // Helper to get product details based on selected branch
    // Note: detailed stock logic might be complex across branch changes
    const getProductDetails = useCallback((product: Product) => {
        const branchId = parseInt(data.branch_id);
        if (!branchId || !product.branch_stocks) {
             return {
                stock: product.stock ?? 0,
                price: Number(product.selling_price),
             };
        }
        const stock = product.branch_stocks.find(bs => bs.branch_id === branchId);
        return {
            stock: stock?.quantity ?? 0,
            price: stock?.selling_price ? Number(stock.selling_price) : Number(product.selling_price),
        };
    }, [data.branch_id]);

    // Calculate totals when cart changes
    const cartTotals = useMemo(() => {
        const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
        const taxAmount = cart.reduce((sum, item) => sum + item.tax_amount, 0);
        const total = subtotal + taxAmount - data.discount_amount;
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



    const addToCart = useCallback((product: Product) => {
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
    }, [getProductDetails]);

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
            <form onSubmit={submit} className="flex h-[calc(100vh-120px)] gap-4 p-4">
                {/* Left: Product Selection */}
                <div className="flex w-3/5 flex-col gap-4">
                    {/* Search */}
                    <div className="flex gap-4">
                        <Popover open={searchOpen} onOpenChange={setSearchOpen}>
                            <PopoverAnchor asChild>
                                <div className="relative flex-1">
                                    <Input
                                        ref={searchInputRef}
                                        placeholder="Search products (F1)..."
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
                            >
                                <Command shouldFilter={false}>
                                    <CommandList className="max-h-[300px]">
                                        <CommandEmpty>No products found.</CommandEmpty>
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
                                                        getProductDetails(product).stock <= 0 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
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
                         <Input
                            ref={barcodeInputRef}
                            placeholder="Scan barcode (F2)..."
                            onKeyDown={handleBarcodeInput}
                            className="w-48"
                            tabIndex={2}
                        />
                    </div>

                    {/* Category Filter */}
                     <div className="flex flex-wrap gap-2">
                        <Button
                            type="button"
                            variant={selectedCategory === null ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => { setSelectedCategory(null); searchByCategory(null); }}
                            tabIndex={-1}
                        >
                            All
                        </Button>
                        {categories.map((cat) => (
                            <Button
                                key={cat.id}
                                type="button"
                                variant={selectedCategory === cat.id ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => { setSelectedCategory(cat.id); searchByCategory(cat.id); }}
                                tabIndex={-1}
                            >
                                {cat.name}
                            </Button>
                        ))}
                    </div>

                    {/* Product Grid */}
                    <ScrollArea className="bg-card flex-1 rounded-lg border">
                         <div className="grid grid-cols-4 gap-2 p-3">
                            {isSearching && (
                                <div className="col-span-4 flex items-center justify-center py-8">
                                    <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
                                </div>
                            )}
                            {!isSearching && searchResults.map((product) => (
                                <button
                                    key={product.id}
                                    type="button"
                                    onClick={() => addToCart(product)}
                                    disabled={getProductDetails(product).stock <= 0}
                                    tabIndex={-1}
                                    className={`bg-background flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-colors ${
                                        getProductDetails(product).stock <= 0
                                            ? 'opacity-50 cursor-not-allowed'
                                            : 'hover:bg-accent hover:text-accent-foreground'
                                    }`}
                                >
                                    <span className="line-clamp-2 text-sm font-medium">{product.code}</span>
                                    <span className="text-muted-foreground font-mono text-xs">{product.name}</span>
                                    <div className="flex w-full items-center justify-between">
                                        <span className="text-primary font-mono font-bold">
                                            {formatCurrency(getProductDetails(product).price)}
                                        </span>
                                        <div className="flex items-center gap-1">
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
                                    </div>
                                </button>
                            ))}
                              {!isSearching && searchResults.length === 0 && (
                                <div className="text-muted-foreground col-span-4 py-8 text-center">
                                    {selectedCategory !== null ? 'No products in this category' : 'Search or select a category to browse products'}
                                </div>
                            )}
                         </div>
                    </ScrollArea>
                </div>

                {/* Right: Cart and Payment */}
                <div className="flex w-2/5 flex-col gap-4">
                     <Card>
                        <CardContent className="grid grid-cols-2 gap-4 pt-4">
                             <div className="space-y-2">
                                <Label>Branch</Label>
                                <Select value={data.branch_id} onValueChange={(v) => setData('branch_id', v)}>
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
                                <Label>Customer</Label>
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
                        </CardContent>
                    </Card>

                    {/* Cart */}
                    <Card className="flex flex-1 flex-col">
                        <CardHeader className="flex flex-row items-center justify-between py-3">
                             <div className="flex items-center gap-2">
                                <ShoppingCart className="h-5 w-5" />
                                <CardTitle className="text-lg">Cart (Edit Mode)</CardTitle>
                                <Badge variant="secondary">{cart.length} items</Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-hidden p-0">
                            <ScrollArea className="h-[200px]">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Product</TableHead>
                                            <TableHead className="w-28 text-center">Qty</TableHead>
                                            <TableHead className="text-right">Total</TableHead>
                                            <TableHead className="w-10"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {cart.map((item) => (
                                            <TableRow key={item.product_id}>
                                                <TableCell>
                                                    <div className="font-medium">{item.product.name}</div>
                                                    <div className="text-muted-foreground text-xs">
                                                        @ {formatCurrency(item.unit_price)} Ks
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
                                                            className="h-7 w-14 text-center font-mono border rounded [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
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
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </ScrollArea>
                        </CardContent>
                    </Card>

                    {/* Footer */}
                    <Card>
                        <CardContent className="space-y-3 pt-4">
                             <div className="flex justify-between text-sm">
                                <span>Subtotal</span>
                                <span className="font-mono">{formatCurrency(cartTotals.subtotal)} Ks</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span>Tax</span>
                                <span className="font-mono">{formatCurrency(cartTotals.taxAmount)} Ks</span>
                            </div>
                             <div className="flex items-center justify-between text-sm">
                                <span>Discount</span>
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
                                            className="h-8 w-16 text-right font-mono pr-6"
                                            tabIndex={6}
                                        />
                                        <span className="absolute right-2 top-1.5 text-xs text-muted-foreground">%</span>
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
                                <span className="text-primary font-mono">{formatCurrency(cartTotals.total)} Ks</span>
                            </div>
                            <Separator />
                             <div className="grid grid-cols-2 gap-3">
                                 <div className="space-y-1">
                                    <Label className="text-xs">Payment Method</Label>
                                    <Select value={data.payment_method} onValueChange={(v) => setData('payment_method', v)}>
                                        <SelectTrigger className="h-9" tabIndex={8}>
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
                                <div className="space-y-1">
                                    <Label className="text-xs">Invoice No</Label>
                                    <Input value={data.invoice_no} disabled className="h-9 font-mono bg-muted" />
                                </div>
                             </div>
                             <div className="space-y-1">
                                <Label className="text-xs">Paid Amount</Label>
                                <Input
                                    ref={paidAmountInputRef}
                                    type="text"
                                    inputMode="numeric"
                                    value={data.paid_amount || ''}
                                     onChange={(e) => {
                                        const val = e.target.value.replace(/[^0-9]/g, '');
                                        setData('paid_amount', val === '' ? 0 : parseInt(val, 10));
                                    }}
                                    className="h-10 text-right font-mono text-lg font-bold"
                                    tabIndex={9}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <Button asChild variant="outline" className="w-full">
                                    <Link href={route('sales.index')}>
                                        <ArrowLeft className="mr-2 h-4 w-4" /> Back
                                    </Link>
                                </Button>
                                <Button type="submit" disabled={processing || cart.length === 0} className="w-full">
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
