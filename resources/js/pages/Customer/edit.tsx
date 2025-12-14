import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

type Customer = {
    id: number;
    code: string;
    name: string;
    phone?: string;
    email?: string;
    address?: string;
    credit_limit: number;
    current_balance: number;
    is_active: boolean;
};

type CustomerForm = {
    code: string;
    name: string;
    phone: string;
    email: string;
    address: string;
    credit_limit: string;
    current_balance: string;
    is_active: boolean;
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Customers',
        href: route('customers.index'),
    },
    {
        title: 'Edit',
        href: '#',
    },
];

export default function CustomerEdit({ customer }: { customer: Customer }) {
    const { data, setData, patch, errors, processing } = useForm<CustomerForm>({
        code: customer.code,
        name: customer.name,
        phone: customer.phone || '',
        email: customer.email || '',
        address: customer.address || '',
        credit_limit: String(customer.credit_limit),
        current_balance: String(customer.current_balance),
        is_active: customer.is_active,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        patch(route('customers.update', { customer: customer.id }), {
            preserveScroll: true,
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit - ${customer.name}`} />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <form onSubmit={submit} className="md:max-w-xl">
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid grid-flow-row gap-2">
                                <Label htmlFor="code">Customer Code*</Label>
                                <Input
                                    id="code"
                                    value={data.code}
                                    onChange={(e) => setData('code', e.target.value)}
                                    required
                                    placeholder="CUS-001"
                                    autoFocus={true}
                                />
                                <InputError className="mt-2" message={errors.code} />
                            </div>
                            <div className="grid grid-flow-row gap-2">
                                <Label htmlFor="name">Customer Name*</Label>
                                <Input
                                    id="name"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    required
                                    placeholder="John Doe"
                                />
                                <InputError className="mt-2" message={errors.name} />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid grid-flow-row gap-2">
                                <Label htmlFor="phone">Phone</Label>
                                <Input
                                    id="phone"
                                    value={data.phone}
                                    onChange={(e) => setData('phone', e.target.value)}
                                    placeholder="+95 9 123 456 789"
                                />
                                <InputError className="mt-2" message={errors.phone} />
                            </div>
                            <div className="grid grid-flow-row gap-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    placeholder="customer@example.com"
                                />
                                <InputError className="mt-2" message={errors.email} />
                            </div>
                        </div>
                        <div className="grid grid-flow-row gap-2">
                            <Label htmlFor="address">Address</Label>
                            <Textarea
                                id="address"
                                value={data.address}
                                onChange={(e) => setData('address', e.target.value)}
                                placeholder="Enter customer address"
                                rows={2}
                            />
                            <InputError className="mt-2" message={errors.address} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid grid-flow-row gap-2">
                                <Label htmlFor="credit_limit">Credit Limit (Ks)</Label>
                                <Input
                                    id="credit_limit"
                                    type="number"
                                    value={data.credit_limit}
                                    onChange={(e) => setData('credit_limit', e.target.value)}
                                />
                                <InputError className="mt-2" message={errors.credit_limit} />
                            </div>
                            <div className="grid grid-flow-row gap-2">
                                <Label htmlFor="current_balance">Current Balance (Ks)</Label>
                                <Input
                                    id="current_balance"
                                    type="number"
                                    value={data.current_balance}
                                    onChange={(e) => setData('current_balance', e.target.value)}
                                />
                                <InputError className="mt-2" message={errors.current_balance} />
                            </div>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Switch id="is_active" checked={data.is_active} onCheckedChange={(checked) => setData('is_active', checked)} />
                            <Label htmlFor="is_active">Active</Label>
                        </div>
                        <div className="flex justify-end gap-3">
                            <Button variant="outline" asChild>
                                <Link href={route('customers.index')}>Cancel</Link>
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
