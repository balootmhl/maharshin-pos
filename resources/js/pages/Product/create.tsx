import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import { type BreadcrumbItem, Category, Group } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { AlertTriangle, ArrowLeft, Check, ChevronsUpDown, Coins, FileText, FolderOpen, Layers, Package, Percent, Tag } from 'lucide-react';
import { FormEventHandler, useState } from 'react';

type ProductForm = {
    code: string;
    barcode: string;
    name: string;
    description: string;
    category_id: string;
    group_id: string;
    unit: string;
    cost_price: string;
    selling_price: string;
    tax_rate: string;
    low_stock_alert: string;
    is_active: boolean;
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Products',
        href: route('products.index'),
    },
    {
        title: 'Create',
        href: '#',
    },
];

export default function ProductCreate({ categories, groups }: { categories: Category[]; groups: Group[] }) {
    const [openGroup, setOpenGroup] = useState(false);
    const { data, setData, post, reset, errors, processing } = useForm<ProductForm>({
        code: '',
        barcode: '',
        name: '',
        description: '',
        category_id: '',
        group_id: '',
        unit: 'pcs',
        cost_price: '0',
        selling_price: '0',
        tax_rate: '0',
        low_stock_alert: '10',
        is_active: true,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('products.store'), {
            preserveScroll: true,
            onSuccess: () => {
                reset();
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Product" />
            <div className="w-full space-y-6 p-4 pb-12">
                {/* Header Actions */}
                <div className="flex items-center justify-between">
                    <Button variant="ghost" asChild className="text-muted-foreground hover:text-foreground gap-2 p-0">
                        <Link href={route('products.index')}>
                            <ArrowLeft className="h-4 w-4" />
                            Back to Products
                        </Link>
                    </Button>
                </div>

                <form onSubmit={submit}>
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                        {/* Left Card: Core Details */}
                        <div className="space-y-6 lg:col-span-7">
                            <Card className="flex h-full flex-col justify-between border border-slate-200 shadow-xs dark:border-slate-800">
                                <CardHeader className="pb-6">
                                    <CardTitle className="flex items-center gap-2 text-xl font-bold">
                                        <Package className="h-5 w-5 text-indigo-500" />
                                        Core Specifications
                                    </CardTitle>
                                    <CardDescription>Configure primary codes, category mappings, and basic descriptions.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-5">
                                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="code" className="font-semibold">
                                                Product Code*
                                            </Label>
                                            <div className="relative">
                                                <Input
                                                    id="code"
                                                    value={data.code}
                                                    onChange={(e) => setData('code', e.target.value)}
                                                    required
                                                    placeholder="PRD-001"
                                                    autoFocus={true}
                                                    className="pl-9"
                                                />
                                                <span className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2 animate-pulse font-mono text-xs font-bold">
                                                    #
                                                </span>
                                            </div>
                                            <InputError className="mt-1" message={errors.code} />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="barcode" className="font-semibold">
                                                Barcode (EAN/UPC)
                                            </Label>
                                            <div className="relative">
                                                <Input
                                                    id="barcode"
                                                    value={data.barcode}
                                                    onChange={(e) => setData('barcode', e.target.value)}
                                                    placeholder="1234567890123"
                                                    className="pl-9"
                                                />
                                                <Tag className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                                            </div>
                                            <InputError className="mt-1" message={errors.barcode} />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="category_id" className="font-semibold">
                                                Category*
                                            </Label>
                                            <div className="relative">
                                                <Select value={data.category_id} onValueChange={(v) => setData('category_id', v)}>
                                                    <SelectTrigger className="pl-9">
                                                        <SelectValue placeholder="Select category" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {categories.map((cat) => (
                                                            <SelectItem key={cat.id} value={String(cat.id)}>
                                                                {cat.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FolderOpen className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                                            </div>
                                            <InputError className="mt-1" message={errors.category_id} />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="group_id" className="font-semibold">
                                                Group / Collection
                                            </Label>
                                            <div className="relative">
                                                <Popover open={openGroup} onOpenChange={setOpenGroup}>
                                                    <PopoverTrigger asChild>
                                                        <Button
                                                            variant="outline"
                                                            role="combobox"
                                                            aria-expanded={openGroup}
                                                            className={cn(
                                                                'w-full justify-between pr-3 pl-9 font-normal',
                                                                !data.group_id && 'text-muted-foreground',
                                                            )}
                                                        >
                                                            {data.group_id
                                                                ? groups.find((group) => String(group.id) === data.group_id)?.name
                                                                : 'Select group...'}
                                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-[300px] p-0" align="start">
                                                        <Command>
                                                            <CommandInput placeholder="Search group..." />
                                                            <CommandList>
                                                                <CommandEmpty>No group found.</CommandEmpty>
                                                                <CommandGroup>
                                                                    {groups.map((group) => (
                                                                        <CommandItem
                                                                            key={group.id}
                                                                            value={group.name}
                                                                            onSelect={() => {
                                                                                setData(
                                                                                    'group_id',
                                                                                    String(group.id) === data.group_id ? '' : String(group.id),
                                                                                );
                                                                                setOpenGroup(false);
                                                                            }}
                                                                        >
                                                                            <Check
                                                                                className={cn(
                                                                                    'mr-2 h-4 w-4',
                                                                                    data.group_id === String(group.id) ? 'opacity-100' : 'opacity-0',
                                                                                )}
                                                                            />
                                                                            {group.name}
                                                                        </CommandItem>
                                                                    ))}
                                                                </CommandGroup>
                                                            </CommandList>
                                                        </Command>
                                                    </PopoverContent>
                                                </Popover>
                                                <Layers className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                                            </div>
                                            <InputError className="mt-1" message={errors.group_id} />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="name" className="font-semibold">
                                            Product Name*
                                        </Label>
                                        <Input
                                            id="name"
                                            value={data.name}
                                            onChange={(e) => setData('name', e.target.value)}
                                            required
                                            placeholder="Enter descriptive product title"
                                        />
                                        <InputError className="mt-1" message={errors.name} />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="description" className="font-semibold">
                                            Detailed Description
                                        </Label>
                                        <div className="relative">
                                            <Textarea
                                                id="description"
                                                value={data.description}
                                                onChange={(e) => setData('description', e.target.value)}
                                                placeholder="Describe item attributes, usage guidelines, and features"
                                                rows={2}
                                                className="pt-2.5 pl-9"
                                            />
                                            <FileText className="text-muted-foreground absolute top-3 left-3 h-4 w-4" />
                                        </div>
                                        <InputError className="mt-1" message={errors.description} />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Right Card: Pricing & Inventory */}
                        <div className="space-y-6 lg:col-span-5">
                            <Card className="flex h-full flex-col justify-between border border-slate-200 shadow-xs dark:border-slate-800">
                                <CardHeader className="pb-6">
                                    <CardTitle className="flex items-center gap-2 text-xl font-bold">
                                        <Coins className="h-5 w-5 text-amber-500" />
                                        Pricing & Stock Alerts
                                    </CardTitle>
                                    <CardDescription>
                                        Control standard cost structures, selling prices, tax policies, and inventory thresholds.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-5">
                                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="unit" className="font-semibold">
                                                Stock Unit*
                                            </Label>
                                            <div className="relative">
                                                <Input
                                                    id="unit"
                                                    value={data.unit}
                                                    onChange={(e) => setData('unit', e.target.value)}
                                                    required
                                                    placeholder="pcs"
                                                    className="pl-9"
                                                />
                                                <Package className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                                            </div>
                                            <InputError className="mt-1" message={errors.unit} />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="tax_rate" className="font-semibold">
                                                Tax Rate (%)
                                            </Label>
                                            <div className="relative">
                                                <Input
                                                    id="tax_rate"
                                                    type="number"
                                                    step="0.01"
                                                    value={data.tax_rate}
                                                    onChange={(e) => setData('tax_rate', e.target.value)}
                                                    className="pl-9"
                                                />
                                                <Percent className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                                            </div>
                                            <InputError className="mt-1" message={errors.tax_rate} />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="cost_price" className="font-semibold">
                                                Cost Price* (Ks)
                                            </Label>
                                            <div className="relative">
                                                <Input
                                                    id="cost_price"
                                                    type="number"
                                                    step="0.01"
                                                    value={data.cost_price}
                                                    onChange={(e) => setData('cost_price', e.target.value)}
                                                    required
                                                    className="pl-9"
                                                />
                                                <Coins className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                                            </div>
                                            <InputError className="mt-1" message={errors.cost_price} />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="selling_price" className="font-semibold">
                                                Selling Price* (Ks)
                                            </Label>
                                            <div className="relative">
                                                <Input
                                                    id="selling_price"
                                                    type="number"
                                                    step="0.01"
                                                    value={data.selling_price}
                                                    onChange={(e) => setData('selling_price', e.target.value)}
                                                    required
                                                    className="pl-9"
                                                />
                                                <Coins className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                                            </div>
                                            <InputError className="mt-1" message={errors.selling_price} />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="low_stock_alert" className="font-semibold">
                                            Low Stock Warning Threshold
                                        </Label>
                                        <div className="relative">
                                            <Input
                                                id="low_stock_alert"
                                                type="number"
                                                value={data.low_stock_alert}
                                                onChange={(e) => setData('low_stock_alert', e.target.value)}
                                                className="pl-9"
                                            />
                                            <AlertTriangle className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                                        </div>
                                        <InputError className="mt-1" message={errors.low_stock_alert} />
                                    </div>

                                    <div className="flex items-center space-x-3 rounded-lg border border-slate-100 p-3 dark:border-slate-800">
                                        <Switch
                                            id="is_active"
                                            checked={data.is_active}
                                            onCheckedChange={(checked) => setData('is_active', checked)}
                                        />
                                        <div className="space-y-0.5">
                                            <Label htmlFor="is_active" className="cursor-pointer text-sm font-semibold">
                                                Active Listing
                                            </Label>
                                            <p className="text-muted-foreground text-[10px]">Inactive items will be hidden from cash registers.</p>
                                        </div>
                                    </div>
                                </CardContent>
                                <CardContent className="pt-0">
                                    <div className="flex justify-end gap-3 border-t pt-5">
                                        <Button variant="outline" asChild>
                                            <Link href={route('products.index')}>Cancel</Link>
                                        </Button>
                                        <Button variant="secondary" type="button" onClick={() => reset()} disabled={processing}>
                                            Reset
                                        </Button>
                                        <Button type="submit" disabled={processing} className="min-w-[80px]">
                                            Save
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
