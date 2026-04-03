import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, Category, Group } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

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
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <form onSubmit={submit} className="max-w-4xl mx-auto w-full">
                    <div className="space-y-6">
                        <div className="grid grid-cols-4 gap-4">
                            <div className="grid grid-flow-row gap-2">
                                <Label htmlFor="code">Product Code*</Label>
                                <Input
                                    id="code"
                                    value={data.code}
                                    onChange={(e) => setData('code', e.target.value)}
                                    required
                                    placeholder="PRD-001"
                                    autoFocus={true}
                                />
                                <InputError className="mt-2" message={errors.code} />
                            </div>
                            <div className="grid grid-flow-row gap-2">
                                <Label htmlFor="barcode">Barcode</Label>
                                <Input
                                    id="barcode"
                                    value={data.barcode}
                                    onChange={(e) => setData('barcode', e.target.value)}
                                    placeholder="1234567890123"
                                />
                                <InputError className="mt-2" message={errors.barcode} />
                            </div>
                            <div className="grid grid-flow-row gap-2">
                                <Label htmlFor="category_id">Category*</Label>
                                <Select value={data.category_id} onValueChange={(v) => setData('category_id', v)}>
                                    <SelectTrigger>
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
                                <InputError className="mt-2" message={errors.category_id} />
                            </div>
                            <div className="grid grid-flow-row gap-2">
                                <Label htmlFor="group_id">Group</Label>
                                <Popover open={openGroup} onOpenChange={setOpenGroup}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            aria-expanded={openGroup}
                                            className={cn("w-full justify-between font-normal", !data.group_id && "text-muted-foreground")}
                                        >
                                            {data.group_id
                                                ? groups.find((group) => String(group.id) === data.group_id)?.name
                                                : "Select group..."}
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
                                                                setData('group_id', String(group.id) === data.group_id ? "" : String(group.id));
                                                                setOpenGroup(false);
                                                            }}
                                                        >
                                                            <Check
                                                                className={cn(
                                                                    "mr-2 h-4 w-4",
                                                                    data.group_id === String(group.id) ? "opacity-100" : "opacity-0"
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
                                <InputError className="mt-2" message={errors.group_id} />
                            </div>
                        </div>
                        <div className="grid grid-flow-row gap-2">
                            <Label htmlFor="name">Product Name*</Label>
                            <Input
                                id="name"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                required
                                placeholder="Product Name"
                            />
                            <InputError className="mt-2" message={errors.name} />
                        </div>
                        <div className="grid grid-flow-row gap-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                value={data.description}
                                onChange={(e) => setData('description', e.target.value)}
                                placeholder="Enter product description"
                                rows={2}
                            />
                            <InputError className="mt-2" message={errors.description} />
                        </div>
                        <div className="grid grid-cols-4 gap-4">
                            <div className="grid grid-flow-row gap-2">
                                <Label htmlFor="unit">Unit*</Label>
                                <Input id="unit" value={data.unit} onChange={(e) => setData('unit', e.target.value)} required placeholder="pcs" />
                                <InputError className="mt-2" message={errors.unit} />
                            </div>
                            <div className="grid grid-flow-row gap-2">
                                <Label htmlFor="cost_price">Cost Price*</Label>
                                <Input
                                    id="cost_price"
                                    type="number"
                                    step="0.01"
                                    value={data.cost_price}
                                    onChange={(e) => setData('cost_price', e.target.value)}
                                    required
                                />
                                <InputError className="mt-2" message={errors.cost_price} />
                            </div>
                            <div className="grid grid-flow-row gap-2">
                                <Label htmlFor="selling_price">Selling Price*</Label>
                                <Input
                                    id="selling_price"
                                    type="number"
                                    step="0.01"
                                    value={data.selling_price}
                                    onChange={(e) => setData('selling_price', e.target.value)}
                                    required
                                />
                                <InputError className="mt-2" message={errors.selling_price} />
                            </div>
                            <div className="grid grid-flow-row gap-2">
                                <Label htmlFor="tax_rate">Tax Rate (%)</Label>
                                <Input
                                    id="tax_rate"
                                    type="number"
                                    step="0.01"
                                    value={data.tax_rate}
                                    onChange={(e) => setData('tax_rate', e.target.value)}
                                />
                                <InputError className="mt-2" message={errors.tax_rate} />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid grid-flow-row gap-2">
                                <Label htmlFor="low_stock_alert">Low Stock Alert</Label>
                                <Input
                                    id="low_stock_alert"
                                    type="number"
                                    value={data.low_stock_alert}
                                    onChange={(e) => setData('low_stock_alert', e.target.value)}
                                />
                                <InputError className="mt-2" message={errors.low_stock_alert} />
                            </div>
                            <div className="flex items-end pb-2">
                                <div className="flex items-center space-x-2">
                                    <Switch id="is_active" checked={data.is_active} onCheckedChange={(checked) => setData('is_active', checked)} />
                                    <Label htmlFor="is_active">Active</Label>
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3">
                            <Button variant="outline" asChild>
                                <Link href={route('products.index')}>Cancel</Link>
                            </Button>
                            <Button variant="secondary" type="button" onClick={() => reset()} disabled={processing}>
                                Reset
                            </Button>
                            <Button type="submit" disabled={processing}>
                                Save
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
