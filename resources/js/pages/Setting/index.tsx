import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

type Settings = {
    company_name?: string;
    company_address?: string;
    company_phone?: string;
    company_email?: string;
    currency_symbol?: string;
    tax_rate?: string;
    invoice_prefix?: string;
    purchase_prefix?: string;
    [key: string]: string | undefined;
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Settings',
        href: route('settings.index'),
    },
];

export default function SettingIndex({ settings }: { settings: Settings }) {
    const { data, setData, post, processing } = useForm({
        company_name: settings.company_name || '',
        company_address: settings.company_address || '',
        company_phone: settings.company_phone || '',
        company_email: settings.company_email || '',
        currency_symbol: settings.currency_symbol || 'Ks',
        tax_rate: settings.tax_rate || '0',
        invoice_prefix: settings.invoice_prefix || 'INV-',
        purchase_prefix: settings.purchase_prefix || 'PO-',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('settings.index'), {
            preserveScroll: true,
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Settings" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <form onSubmit={submit} className="space-y-6">
                    <Card className="mx-auto w-full max-w-4xl">
                        <CardHeader>
                            <CardTitle>Company Information</CardTitle>
                            <CardDescription>Basic details about your company</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="company_name">Company Name</Label>
                                    <Input
                                        id="company_name"
                                        value={data.company_name}
                                        onChange={(e) => setData('company_name', e.target.value)}
                                        placeholder="Your Company Name"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="company_phone">Phone</Label>
                                    <Input
                                        id="company_phone"
                                        value={data.company_phone}
                                        onChange={(e) => setData('company_phone', e.target.value)}
                                        placeholder="+95 9 xxx xxx xxx"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="company_email">Email</Label>
                                <Input
                                    id="company_email"
                                    type="email"
                                    value={data.company_email}
                                    onChange={(e) => setData('company_email', e.target.value)}
                                    placeholder="info@company.com"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="company_address">Address</Label>
                                <Input
                                    id="company_address"
                                    value={data.company_address}
                                    onChange={(e) => setData('company_address', e.target.value)}
                                    placeholder="Company address"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="mx-auto w-full max-w-4xl">
                        <CardHeader>
                            <CardTitle>Sales Configuration</CardTitle>
                            <CardDescription>Invoice and tax settings</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="currency_symbol">Currency Symbol</Label>
                                    <Input
                                        id="currency_symbol"
                                        value={data.currency_symbol}
                                        onChange={(e) => setData('currency_symbol', e.target.value)}
                                        placeholder="Ks"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="tax_rate">Default Tax Rate (%)</Label>
                                    <Input
                                        id="tax_rate"
                                        type="number"
                                        step="0.01"
                                        value={data.tax_rate}
                                        onChange={(e) => setData('tax_rate', e.target.value)}
                                        placeholder="0"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="invoice_prefix">Invoice Prefix</Label>
                                    <Input
                                        id="invoice_prefix"
                                        value={data.invoice_prefix}
                                        onChange={(e) => setData('invoice_prefix', e.target.value)}
                                        placeholder="INV-"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="purchase_prefix">Purchase Order Prefix</Label>
                                    <Input
                                        id="purchase_prefix"
                                        value={data.purchase_prefix}
                                        onChange={(e) => setData('purchase_prefix', e.target.value)}
                                        placeholder="PO-"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="mx-auto flex w-full max-w-4xl justify-end">
                        <Button type="submit" disabled={processing}>
                            Save Settings
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
