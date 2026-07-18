import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, Customer } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Coins, Contact, CreditCard, Mail, MapPin, Phone } from 'lucide-react';
import { FormEventHandler } from 'react';

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
        is_active: customer.is_active ?? true,
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
            <div className="w-full space-y-6 p-4 pb-12">
                {/* Header Actions */}
                <div className="flex items-center justify-between">
                    <Button variant="ghost" asChild className="text-muted-foreground hover:text-foreground gap-2 p-0">
                        <Link href={route('customers.index')}>
                            <ArrowLeft className="h-4 w-4" />
                            Back to Customers
                        </Link>
                    </Button>
                </div>

                <form onSubmit={submit}>
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                        {/* Left Card: Customer Profile */}
                        <div className="space-y-6 lg:col-span-7">
                            <Card className="flex h-full flex-col border border-slate-200 shadow-xs dark:border-slate-800">
                                <CardHeader className="pb-6">
                                    <CardTitle className="flex items-center gap-2 text-xl font-bold">
                                        <Contact className="h-5 w-5 text-indigo-500" />
                                        Customer Profile
                                    </CardTitle>
                                    <CardDescription>Configure primary codes, names, phone numbers, and emails.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-5">
                                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="code" className="font-semibold">
                                                Customer Code*
                                            </Label>
                                            <div className="relative">
                                                <Input
                                                    id="code"
                                                    value={data.code}
                                                    onChange={(e) => setData('code', e.target.value)}
                                                    required
                                                    placeholder="CUS-001"
                                                    autoFocus={true}
                                                    className="pl-9"
                                                />
                                                <span className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2 font-mono text-xs font-bold">
                                                    #
                                                </span>
                                            </div>
                                            <InputError className="mt-1" message={errors.code} />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="name" className="font-semibold">
                                                Customer Name*
                                            </Label>
                                            <div className="relative">
                                                <Input
                                                    id="name"
                                                    value={data.name}
                                                    onChange={(e) => setData('name', e.target.value)}
                                                    required
                                                    placeholder="John Doe"
                                                    className="pl-9"
                                                />
                                                <Contact className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                                            </div>
                                            <InputError className="mt-1" message={errors.name} />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="phone" className="font-semibold">
                                            Phone Number
                                        </Label>
                                        <div className="relative">
                                            <Input
                                                id="phone"
                                                value={data.phone}
                                                onChange={(e) => setData('phone', e.target.value)}
                                                placeholder="+95 9 123 456 789"
                                                className="pl-9"
                                            />
                                            <Phone className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                                        </div>
                                        <InputError className="mt-1" message={errors.phone} />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="email" className="font-semibold">
                                            Email Address
                                        </Label>
                                        <div className="relative">
                                            <Input
                                                id="email"
                                                type="email"
                                                value={data.email}
                                                onChange={(e) => setData('email', e.target.value)}
                                                placeholder="customer@example.com"
                                                className="pl-9"
                                            />
                                            <Mail className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                                        </div>
                                        <InputError className="mt-1" message={errors.email} />
                                    </div>

                                    <div className="flex items-center space-x-3 rounded-lg border border-slate-100 p-3 dark:border-slate-800">
                                        <Switch
                                            id="is_active"
                                            checked={data.is_active}
                                            onCheckedChange={(checked) => setData('is_active', checked)}
                                        />
                                        <div className="space-y-0.5">
                                            <Label htmlFor="is_active" className="cursor-pointer text-sm font-semibold">
                                                Active Account
                                            </Label>
                                            <p className="text-muted-foreground text-[10px]">
                                                Inactive customers cannot be mapped to new checkout sales.
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Right Card: Financials & Address */}
                        <div className="space-y-6 lg:col-span-5">
                            <Card className="flex h-full flex-col border border-slate-200 shadow-xs dark:border-slate-800">
                                <CardHeader className="pb-6">
                                    <CardTitle className="flex items-center gap-2 text-xl font-bold">
                                        <Coins className="h-5 w-5 text-amber-500" />
                                        Credit & Address
                                    </CardTitle>
                                    <CardDescription>Manage customer billing credentials, credit rules, and current balance.</CardDescription>
                                </CardHeader>
                                <CardContent className="flex-1 space-y-5">
                                    <div className="space-y-2">
                                        <Label htmlFor="credit_limit" className="font-semibold">
                                            Credit Limit (Ks)
                                        </Label>
                                        <div className="relative">
                                            <Input
                                                id="credit_limit"
                                                type="number"
                                                value={data.credit_limit}
                                                onChange={(e) => setData('credit_limit', e.target.value)}
                                                className="pl-9"
                                            />
                                            <CreditCard className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                                        </div>
                                        <InputError className="mt-1" message={errors.credit_limit} />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="current_balance" className="font-semibold">
                                            Current Balance (Ks)
                                        </Label>
                                        <div className="relative">
                                            <Input
                                                id="current_balance"
                                                type="number"
                                                value={data.current_balance}
                                                onChange={(e) => setData('current_balance', e.target.value)}
                                                className="pl-9"
                                            />
                                            <Coins className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                                        </div>
                                        <InputError className="mt-1" message={errors.current_balance} />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="address" className="font-semibold">
                                            Contact Address
                                        </Label>
                                        <div className="relative">
                                            <Textarea
                                                id="address"
                                                value={data.address}
                                                onChange={(e) => setData('address', e.target.value)}
                                                placeholder="Enter contact address details"
                                                rows={2}
                                                className="pt-2.5 pl-9"
                                            />
                                            <MapPin className="text-muted-foreground absolute top-3 left-3 h-4 w-4" />
                                        </div>
                                        <InputError className="mt-1" message={errors.address} />
                                    </div>
                                </CardContent>
                                <CardContent className="pt-0">
                                    <div className="flex justify-end gap-3 border-t pt-5">
                                        <Button variant="outline" asChild>
                                            <Link href={route('customers.index')}>Cancel</Link>
                                        </Button>
                                        <Button type="submit" disabled={processing} className="min-w-[100px]">
                                            Update Customer
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
