import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Building2, Edit, Mail, MapPin, Phone } from 'lucide-react';

type Branch = {
    id: number;
    code: string;
    name: string;
    address?: string;
    phone?: string;
    email?: string;
    is_active: boolean;
    logo_url?: string | null;
    thumb_url?: string | null;
    created_at?: string;
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Branches',
        href: route('branches.index'),
    },
    {
        title: 'Details',
        href: '#',
    },
];

export default function BranchShow({ branch }: { branch: Branch }) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={branch.name} />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <Card className="mx-auto w-full max-w-4xl">
                    <CardHeader>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className="size-16 shrink-0 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-center shadow-xs">
                                    {branch.logo_url ? (
                                        <img
                                            src={branch.logo_url}
                                            alt={branch.name}
                                            className="size-full object-contain p-1"
                                        />
                                    ) : (
                                        <Building2 className="size-8 text-slate-400" />
                                    )}
                                </div>
                                <div>
                                    <CardTitle className="flex items-center gap-2 text-xl font-bold">
                                        {branch.name}
                                        <Badge variant={branch.is_active ? 'default' : 'secondary'}>{branch.is_active ? 'Active' : 'Inactive'}</Badge>
                                    </CardTitle>
                                    <CardDescription className="font-mono mt-0.5">{branch.code}</CardDescription>
                                </div>
                            </div>
                            <Button asChild>
                                <Link href={route('branches.edit', { branch: branch.id })}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit
                                </Link>
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {branch.phone && (
                            <div className="flex items-center gap-2">
                                <Phone className="text-muted-foreground h-4 w-4" />
                                <span>{branch.phone}</span>
                            </div>
                        )}
                        {branch.email && (
                            <div className="flex items-center gap-2">
                                <Mail className="text-muted-foreground h-4 w-4" />
                                <span>{branch.email}</span>
                            </div>
                        )}
                        {branch.address && (
                            <div className="flex items-start gap-2">
                                <MapPin className="text-muted-foreground mt-1 h-4 w-4" />
                                <span className="whitespace-pre-wrap">{branch.address}</span>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
