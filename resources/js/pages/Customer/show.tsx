import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { CreditCard, Edit, Mail, MapPin, Phone } from 'lucide-react';

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
    created_at?: string;
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

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
};

export default function CustomerShow({ customer }: { customer: Customer }) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={customer.name} />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <Card className="md:max-w-2xl">
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
            </div>
        </AppLayout>
    );
}
