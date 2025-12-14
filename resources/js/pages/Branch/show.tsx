import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Edit, Mail, MapPin, Phone } from 'lucide-react';

type Branch = {
    id: number;
    code: string;
    name: string;
    address?: string;
    phone?: string;
    email?: string;
    is_active: boolean;
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
                <Card className="md:max-w-2xl">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    {branch.name}
                                    <Badge variant={branch.is_active ? 'default' : 'secondary'}>{branch.is_active ? 'Active' : 'Inactive'}</Badge>
                                </CardTitle>
                                <CardDescription className="font-mono">{branch.code}</CardDescription>
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
