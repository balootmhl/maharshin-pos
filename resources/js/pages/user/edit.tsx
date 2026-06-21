import InputError from '@/components/input-error';
import SimpleSelect from '@/components/inputs/simple-select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, Branch, User } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

type UserForm = {
    name: string;
    email: string;
    main_role: string;
    branch_id: string;
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'User',
        href: route('users.index'),
    },
    {
        title: 'Edit',
        href: '#',
    },
];

export default function UserEdit({ user, roles, branches }: { user: User; roles: string[]; branches: Branch[] }) {
    const { data, setData, patch, reset, errors, processing } = useForm<UserForm>({
        name: user.name,
        email: user.email,
        main_role: user.main_role ?? '',
        branch_id: user.branch_id?.toString() ?? '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        patch(route('users.update', { user: user.id }), {
            preserveScroll: true,
            onSuccess: () => {
                reset();
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Edit - User" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <form onSubmit={submit} className="max-w-3xl mx-auto w-full">
                    <div className="space-y-6">
                        <div className="grid grid-flow-row gap-2">
                            <Label htmlFor="name">Name*</Label>
                            <Input
                                id="name"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                required
                                placeholder="Moe Moe"
                                autoFocus={true}
                            />
                            <InputError className="mt-2" message={errors.name} />
                        </div>
                        <div className="grid grid-flow-row gap-2">
                            <Label htmlFor="name">Email*</Label>
                            <Input
                                id="email"
                                type="email"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                required
                                pattern="^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
                                title="Please enter a valid email address with a dot in the domain (e.g. user@example.com)"
                                placeholder="moemoe@mail.com"
                            />
                            <InputError className="mt-2" message={errors.email} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid grid-flow-row gap-2">
                                <Label htmlFor="Role">Role*</Label>
                                <SimpleSelect options={roles} item={data.main_role} setItem={(v) => setData('main_role', v)} />
                                <InputError className="mt-2" message={errors.main_role} />
                            </div>
                            <div className="grid grid-flow-row gap-2">
                                <Label htmlFor="branch_id">Branch{data.main_role !== 'god' ? '*' : ''}</Label>
                                <Select value={data.branch_id} onValueChange={(v) => setData('branch_id', v)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder={data.main_role !== 'god' ? "Select branch" : "Select branch (optional)"} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {branches.map((branch) => (
                                            <SelectItem key={branch.id} value={branch.id.toString()}>
                                                {branch.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError className="mt-2" message={errors.branch_id} />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3">
                            <Button variant="outline" asChild>
                                <Link href={route('users.index')}>Cancel</Link>
                            </Button>
                            <Button type="submit" disabled={processing}>
                                Save
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
