import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Edit } from 'lucide-react';

type Category = {
    id: number;
    code: string;
    name: string;
    description?: string;
    is_active: boolean;
    created_at?: string;
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Categories',
        href: route('categories.index'),
    },
    {
        title: 'Details',
        href: '#',
    },
];

export default function CategoryShow({ category }: { category: Category }) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={category.name} />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <Card className="max-w-4xl mx-auto w-full">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    {category.name}
                                    <Badge variant={category.is_active ? 'default' : 'secondary'}>{category.is_active ? 'Active' : 'Inactive'}</Badge>
                                </CardTitle>
                                <CardDescription className="font-mono">{category.code}</CardDescription>
                            </div>
                            <Button asChild>
                                <Link href={route('categories.edit', { category: category.id })}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit
                                </Link>
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>{category.description && <p className="text-muted-foreground">{category.description}</p>}</CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
