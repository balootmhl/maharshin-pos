import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, Branch, Customer } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { CreditCard, Download, Edit, FileText, Mail, MapPin, Phone, Plus } from 'lucide-react';

type CreditLedgerEntry = {
    id: number;
    transaction_date: string;
    transaction_type: string;
    reference_no?: string;
    branch?: Branch;
    debit: number;
    credit: number;
    balance: number;
    description?: string;
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Customers',
        href: route('customers.index'),
    },
    {
        title: 'Details',
        href: '#',
    },
];

const formatCurrency = (value: number | null | undefined) => {
    if (value === null || value === undefined || isNaN(value)) {
        return '0';
    }
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
};

const getTransactionTypeVariant = (type: string) => {
    switch (type) {
        case 'credit':
            return 'destructive';
        case 'payment':
            return 'default';
        case 'refund':
            return 'outline';
        default:
            return 'secondary';
    }
};

export default function CustomerShow({ customer, creditLedger = [] }: { customer: Customer; creditLedger: CreditLedgerEntry[] }) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={customer.name} />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                {/* Customer Info Card */}
                <Card className="mx-auto w-full max-w-4xl">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    {customer.name}
                                    <Badge variant={customer.is_active ? 'default' : 'secondary'}>{customer.is_active ? 'Active' : 'Inactive'}</Badge>
                                </CardTitle>
                                <CardDescription className="font-mono">{customer.code}</CardDescription>
                            </div>
                            <Button asChild>
                                <Link href={route('customers.edit', { customer: customer.id })}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit
                                </Link>
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {customer.phone && (
                            <div className="flex items-center gap-2">
                                <Phone className="text-muted-foreground h-4 w-4" />
                                <span>{customer.phone}</span>
                            </div>
                        )}
                        {customer.email && (
                            <div className="flex items-center gap-2">
                                <Mail className="text-muted-foreground h-4 w-4" />
                                <span>{customer.email}</span>
                            </div>
                        )}
                        {customer.address && (
                            <div className="flex items-start gap-2">
                                <MapPin className="text-muted-foreground mt-1 h-4 w-4" />
                                <span className="whitespace-pre-wrap">{customer.address}</span>
                            </div>
                        )}
                        <div className="grid grid-cols-2 gap-4 border-t pt-4">
                            <div>
                                <div className="flex items-center gap-2">
                                    <CreditCard className="text-muted-foreground h-4 w-4" />
                                    <span className="text-muted-foreground text-sm">Credit Limit</span>
                                </div>
                                <p className="font-mono text-lg font-bold">{formatCurrency(customer.credit_limit)} Ks</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground text-sm">Current Balance</p>
                                <p className={`font-mono text-lg font-bold ${customer.current_balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                    {formatCurrency(customer.current_balance)} Ks
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Credit Ledger Card */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <FileText className="h-5 w-5" />
                                    Credit Ledger
                                </CardTitle>
                                <CardDescription>Transaction history for this customer</CardDescription>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" asChild>
                                    <a href={route('customers.credit-ledger.export', { customer: customer.id, format: 'csv' })}>
                                        <Download className="mr-2 h-4 w-4" />
                                        Export CSV
                                    </a>
                                </Button>
                                <Button variant="outline" asChild>
                                    <a href={route('customers.credit-ledger.export', { customer: customer.id, format: 'excel' })}>
                                        <Download className="mr-2 h-4 w-4" />
                                        Export Excel
                                    </a>
                                </Button>
                                <Button asChild>
                                    <Link href={route('customer-payments.create')}>
                                        <Plus className="mr-2 h-4 w-4" />
                                        Record Payment
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {creditLedger.length === 0 ? (
                            <div className="text-muted-foreground py-8 text-center">No credit transactions found for this customer.</div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Reference</TableHead>
                                        <TableHead>Branch</TableHead>
                                        <TableHead className="text-right">Debit</TableHead>
                                        <TableHead className="text-right">Credit</TableHead>
                                        <TableHead className="text-right">Balance</TableHead>
                                        <TableHead>Description</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {creditLedger.map((entry) => (
                                        <TableRow key={entry.id}>
                                            <TableCell className="text-sm">{entry.transaction_date}</TableCell>
                                            <TableCell>
                                                <Badge variant={getTransactionTypeVariant(entry.transaction_type)}>
                                                    {entry.transaction_type.charAt(0).toUpperCase() + entry.transaction_type.slice(1)}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="font-mono text-xs">{entry.reference_no || '-'}</TableCell>
                                            <TableCell className="text-sm">{entry.branch?.name || '-'}</TableCell>
                                            <TableCell className="text-right font-mono text-red-600">
                                                {Number(entry.debit) > 0 ? formatCurrency(Number(entry.debit)) : '-'}
                                            </TableCell>
                                            <TableCell className="text-right font-mono text-green-600">
                                                {Number(entry.credit) > 0 ? formatCurrency(Number(entry.credit)) : '-'}
                                            </TableCell>
                                            <TableCell
                                                className={`text-right font-mono font-medium ${Number(entry.balance) > 0 ? 'text-red-600' : ''}`}
                                            >
                                                {formatCurrency(Number(entry.balance))} Ks
                                            </TableCell>
                                            <TableCell className="text-muted-foreground max-w-xs truncate text-sm">
                                                {entry.description || '-'}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
