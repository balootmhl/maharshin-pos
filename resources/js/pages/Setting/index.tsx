import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import { Building2, ChevronRight, FileText, Globe, Mail, Phone, Save, Settings2 } from 'lucide-react';
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

function FieldGroup({ children }: { children: React.ReactNode }) {
    return <div className="space-y-1.5">{children}</div>;
}

function FieldLabel({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
    return (
        <Label htmlFor={htmlFor} className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {children}
        </Label>
    );
}

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
            <div className="flex h-full flex-1 flex-col gap-6 p-4 lg:p-6">
                {/* Page Header */}
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-950/50">
                        <Settings2 className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight">General Settings</h1>
                        <p className="text-sm text-muted-foreground">Manage your business configuration</p>
                    </div>
                </div>

                <form onSubmit={submit} className="space-y-6">
                    {/* Company Information */}
                    <Card className="border-slate-200 shadow-xs dark:border-slate-800">
                        <CardHeader className="pb-3">
                            <div className="flex items-center gap-2">
                                <Building2 className="h-4 w-4 text-indigo-500" />
                                <CardTitle className="text-base font-semibold">Company Information</CardTitle>
                            </div>
                            <CardDescription className="mt-1 text-xs">Basic details about your company</CardDescription>
                        </CardHeader>
                        <Separator />
                        <CardContent className="space-y-4 pt-4">
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <FieldGroup>
                                    <FieldLabel htmlFor="company_name">Company Name</FieldLabel>
                                    <div className="relative">
                                        <Building2 className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                        <Input
                                            id="company_name"
                                            value={data.company_name}
                                            onChange={(e) => setData('company_name', e.target.value)}
                                            placeholder="Your Company Name"
                                            className="pl-9"
                                        />
                                    </div>
                                </FieldGroup>
                                <FieldGroup>
                                    <FieldLabel htmlFor="company_phone">Phone</FieldLabel>
                                    <div className="relative">
                                        <Phone className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                        <Input
                                            id="company_phone"
                                            value={data.company_phone}
                                            onChange={(e) => setData('company_phone', e.target.value)}
                                            placeholder="+95 9 xxx xxx xxx"
                                            className="pl-9"
                                        />
                                    </div>
                                </FieldGroup>
                            </div>
                            <FieldGroup>
                                <FieldLabel htmlFor="company_email">Email</FieldLabel>
                                <div className="relative">
                                    <Mail className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        id="company_email"
                                        type="email"
                                        value={data.company_email}
                                        onChange={(e) => setData('company_email', e.target.value)}
                                        placeholder="info@company.com"
                                        className="pl-9"
                                    />
                                </div>
                            </FieldGroup>
                            <FieldGroup>
                                <FieldLabel htmlFor="company_address">Address</FieldLabel>
                                <div className="relative">
                                    <Globe className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        id="company_address"
                                        value={data.company_address}
                                        onChange={(e) => setData('company_address', e.target.value)}
                                        placeholder="Company address"
                                        className="pl-9"
                                    />
                                </div>
                            </FieldGroup>
                        </CardContent>
                    </Card>

                    {/* Sales Configuration */}
                    <Card className="border-slate-200 shadow-xs dark:border-slate-800">
                        <CardHeader className="pb-3">
                            <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-indigo-500" />
                                <CardTitle className="text-base font-semibold">Sales Configuration</CardTitle>
                            </div>
                            <CardDescription className="mt-1 text-xs">Invoice and tax settings</CardDescription>
                        </CardHeader>
                        <Separator />
                        <CardContent className="space-y-4 pt-4">
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <FieldGroup>
                                    <FieldLabel htmlFor="currency_symbol">Currency Symbol</FieldLabel>
                                    <Input
                                        id="currency_symbol"
                                        value={data.currency_symbol}
                                        onChange={(e) => setData('currency_symbol', e.target.value)}
                                        placeholder="Ks"
                                        className="font-mono"
                                    />
                                </FieldGroup>
                                <FieldGroup>
                                    <FieldLabel htmlFor="tax_rate">Default Tax Rate (%)</FieldLabel>
                                    <Input
                                        id="tax_rate"
                                        type="number"
                                        step="0.01"
                                        value={data.tax_rate}
                                        onChange={(e) => setData('tax_rate', e.target.value)}
                                        placeholder="0"
                                        className="font-mono"
                                    />
                                </FieldGroup>
                            </div>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <FieldGroup>
                                    <FieldLabel htmlFor="invoice_prefix">Invoice Prefix</FieldLabel>
                                    <Input
                                        id="invoice_prefix"
                                        value={data.invoice_prefix}
                                        onChange={(e) => setData('invoice_prefix', e.target.value)}
                                        placeholder="INV-"
                                        className="font-mono"
                                    />
                                </FieldGroup>
                                <FieldGroup>
                                    <FieldLabel htmlFor="purchase_prefix">Purchase Order Prefix</FieldLabel>
                                    <Input
                                        id="purchase_prefix"
                                        value={data.purchase_prefix}
                                        onChange={(e) => setData('purchase_prefix', e.target.value)}
                                        placeholder="PO-"
                                        className="font-mono"
                                    />
                                </FieldGroup>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-900/50">
                        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <ChevronRight className="h-3 w-3" />
                            Changes apply immediately after saving
                        </span>
                        <Button type="submit" disabled={processing} className="bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800">
                            <Save className="mr-2 h-4 w-4" />
                            {processing ? 'Saving...' : 'Save Settings'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
