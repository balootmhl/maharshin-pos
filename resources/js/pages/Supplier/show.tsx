import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, Supplier } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Edit, Mail, MapPin, Phone, User } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Suppliers',
        href: route('suppliers.index'),
    },
    {
        title: 'Details',
        href: '#',
    },
];

export default function SupplierShow({ supplier }: { supplier: Supplier }) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={supplier.name} />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <Card className="mx-auto w-full max-w-4xl">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    {supplier.name}
                                    <Badge variant={supplier.is_active ? 'default' : 'secondary'}>{supplier.is_active ? 'Active' : 'Inactive'}</Badge>
                                </CardTitle>
                                <CardDescription className="font-mono">{supplier.code}</CardDescription>
                            </div>
                            <Button asChild>
                                <Link href={route('suppliers.edit', { supplier: supplier.id })}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit
                                </Link>
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {supplier.contact_person && (
                            <div className="flex items-center gap-2">
                                <User className="text-muted-foreground h-4 w-4" />
                                <span>{supplier.contact_person}</span>
                            </div>
                        )}
                        {supplier.phone && (
                            <div className="flex items-center gap-2">
                                <Phone className="text-muted-foreground h-4 w-4" />
                                <span>{supplier.phone}</span>
                            </div>
                        )}
                        {supplier.email && (
                            <div className="flex items-center gap-2">
                                <Mail className="text-muted-foreground h-4 w-4" />
                                <span>{supplier.email}</span>
                            </div>
                        )}
                        {supplier.address && (
                            <div className="flex items-start gap-2">
                                <MapPin className="text-muted-foreground mt-1 h-4 w-4" />
                                <span className="whitespace-pre-wrap">{supplier.address}</span>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
