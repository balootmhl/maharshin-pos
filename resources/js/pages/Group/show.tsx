import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, Branch, Product } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Edit, Package } from 'lucide-react';

type BranchStock = {
    id: number;
    product_id: number;
    branch_id: number;
    group_id: number;
    quantity: number;
    product: Product;
};

type Group = {
    id: number;
    code: string;
    name: string;
    branch_id: number;
    description?: string;
    is_active: boolean;
    branch: Branch;
    branch_stocks: BranchStock[];
};

export default function GroupShow({ group }: { group: Group }) {
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Groups',
            href: route('groups.index'),
        },
        {
            title: group.name,
            href: '#',
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Group: ${group.name}`} />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">{group.name}</h1>
                        <p className="text-muted-foreground font-mono">{group.code}</p>
                    </div>
                    <Button asChild>
                        <Link href={route('groups.edit', { group: group.id })}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                        </Link>
                    </Button>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Branch</span>
                                <Badge variant="outline">{group.branch?.name}</Badge>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Status</span>
                                <Badge variant={group.is_active ? 'default' : 'secondary'}>{group.is_active ? 'Active' : 'Inactive'}</Badge>
                            </div>
                            {group.description && (
                                <div>
                                    <span className="text-muted-foreground">Description</span>
                                    <p className="mt-1">{group.description}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Package className="h-5 w-5" />
                                Products in this Group
                                <Badge variant="secondary">{group.branch_stocks?.length || 0}</Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {group.branch_stocks && group.branch_stocks.length > 0 ? (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Product</TableHead>
                                            <TableHead className="text-right">Stock</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {group.branch_stocks.map((stock) => (
                                            <TableRow key={stock.id}>
                                                <TableCell>
                                                    <div className="font-medium">{stock.product?.name}</div>
                                                    <div className="text-muted-foreground font-mono text-xs">{stock.product?.code}</div>
                                                </TableCell>
                                                <TableCell className="text-right font-mono">{stock.quantity}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            ) : (
                                <p className="text-muted-foreground py-8 text-center">No products assigned to this group yet.</p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
