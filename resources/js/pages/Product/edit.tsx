import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, Category, Group, Product } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

type ProductForm = {
    code: string;
    barcode: string;
    name: string;
    description: string;
    category_id: string;
    unit: string;
    cost_price: string;
    selling_price: string;
    tax_rate: string;
    low_stock_alert: string;
    is_active: boolean;
    group_id: string;
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Products',
        href: route('products.index'),
    },
    {
        title: 'Edit',
        href: '#',
    },
];

export default function ProductEdit({ product, categories, groups }: { product: Product; categories: Category[]; groups: Group[] }) {
    const { data, setData, patch, errors, processing } = useForm<ProductForm>({
        code: product.code,
        barcode: product.barcode || '',
        name: product.name,
        description: product.description || '',
        category_id: String(product.category_id),
        group_id: product.branch_stocks && product.branch_stocks.length > 0 ? String(product.branch_stocks[0].group_id || '') : '',
        unit: product.unit || 'pcs',
        cost_price: String(product.cost_price),
        selling_price: String(product.selling_price),
        tax_rate: String(product.tax_rate),
        low_stock_alert: String(product.low_stock_alert || 0),
        is_active: product.is_active ?? true,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        patch(route('products.update', { product: product.id }), {
            preserveScroll: true,
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit - ${product.name}`} />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <form onSubmit={submit} className="md:max-w-2xl">
                    <div className="space-y-6">
                        <div className="grid grid-cols-3 gap-4">
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
                                <Select value={data.group_id} onValueChange={(v) => setData('group_id', v)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select group" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {groups.map((group) => (
                                            <SelectItem key={group.id} value={String(group.id)}>
                                                {group.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
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
                                <Label htmlFor="cost_price">Default Cost Price*</Label>
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
                                <Label htmlFor="selling_price">Default Selling Price*</Label>
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
                            <Button type="submit" disabled={processing}>
                                Update
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
