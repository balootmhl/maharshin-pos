import { DeleteBtn } from '@/components/buttons/delete-btn';
import { EditBtn } from '@/components/buttons/edit-btn';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { CalendarDays, KeyRound, Mail, Shield, User2 } from 'lucide-react';
import React from 'react';

// Dummy interface
// Update your types file and import from it
type User = {
    id?: number;
    name: string;
    email: string;
    main_role: string;
    can_do: string[];
    created_at?: string;
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'User',
        href: route('users.index'),
    },
    {
        title: 'Detail',
        href: '#',
    },
];

function InfoRow({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
    return (
        <div className="flex items-start gap-4 py-3">
            <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">{icon}</div>
            <div className="min-w-0 flex-1">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
                <div className="text-sm font-medium text-foreground">{children}</div>
            </div>
        </div>
    );
}

export default function UserShow({ user, isDelete }: { user: User; isDelete: boolean }) {
    const [openDelete, setOpenDelete] = React.useState(isDelete);

    const roleColorMap: Record<string, string> = {
        god: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900',
        manager: 'bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-950/40 dark:text-violet-400 dark:border-violet-900',
        cashier: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900',
    };
    const roleClass = roleColorMap[user.main_role] ?? 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700';

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Detail - User" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 lg:p-6">
                {/* Page Header */}
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-950/50">
                        <User2 className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight">{user.name}</h1>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                    <div className="ml-auto">
                        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${roleClass}`}>
                            {user.main_role}
                        </span>
                    </div>
                </div>

                <Card className="border-slate-200 shadow-xs dark:border-slate-800">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base font-semibold">User Information</CardTitle>
                    </CardHeader>
                    <Separator />
                    <CardContent className="divide-y divide-border px-4 pt-0">
                        <InfoRow icon={<User2 className="h-4 w-4" />} label="Name">
                            {user.name}
                        </InfoRow>
                        <InfoRow icon={<Mail className="h-4 w-4" />} label="Email">
                            {user.email}
                        </InfoRow>
                        <InfoRow icon={<Shield className="h-4 w-4" />} label="Role">
                            <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${roleClass}`}>
                                {user.main_role}
                            </span>
                        </InfoRow>
                        <InfoRow icon={<KeyRound className="h-4 w-4" />} label="Permissions">
                            <div className="flex flex-wrap gap-1.5">
                                {user.can_do.map((perm) => (
                                    <Badge key={perm} variant="secondary" className="text-xs capitalize">
                                        {perm}
                                    </Badge>
                                ))}
                            </div>
                        </InfoRow>
                        <InfoRow icon={<CalendarDays className="h-4 w-4" />} label="Created At">
                            {user.created_at ? new Date(user.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                        </InfoRow>
                    </CardContent>
                    <Separator />
                    <CardFooter className="flex flex-row justify-between px-4 py-3">
                        <EditBtn
                            route={route('users.edit', {
                                user: user,
                            })}
                        />
                        <DeleteBtn
                            route={route('users.destroy', {
                                user: user,
                            })}
                            item={user.name}
                            open={openDelete}
                            setOpen={setOpenDelete}
                        />
                    </CardFooter>
                </Card>
            </div>
        </AppLayout>
    );
}
