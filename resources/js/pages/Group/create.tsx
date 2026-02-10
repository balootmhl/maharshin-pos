import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, Branch } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

type GroupForm = {
    code: string;
    name: string;
    branch_id: string;
    description: string;
    is_active: boolean;
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Groups',
        href: route('groups.index'),
    },
    {
        title: 'Create',
        href: '#',
    },
];

export default function GroupCreate({ branches }: { branches: Branch[] }) {
    const { data, setData, post, reset, errors, processing } = useForm<GroupForm>({
        code: '',
        name: '',
        branch_id: branches[0]?.id?.toString() || '',
        description: '',
        is_active: true,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('groups.store'), {
            preserveScroll: true,
            onSuccess: () => {
                reset();
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Group" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <form onSubmit={submit} className="md:max-w-xl">
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid grid-flow-row gap-2">
                                <Label htmlFor="code">Group Code*</Label>
                                <Input
                                    id="code"
                                    value={data.code}
                                    onChange={(e) => setData('code', e.target.value)}
                                    required
                                    placeholder="GRP-001"
                                    autoFocus={true}
                                />
                                <InputError className="mt-2" message={errors.code} />
                            </div>
                            <div className="grid grid-flow-row gap-2">
                                <Label htmlFor="name">Group Name*</Label>
                                <Input
                                    id="name"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    required
                                    placeholder="Shelf A"
                                />
                                <InputError className="mt-2" message={errors.name} />
                            </div>
                        </div>
                        <div className="grid grid-flow-row gap-2">
                            <Label htmlFor="branch_id">Branch*</Label>
                            <Select value={data.branch_id} onValueChange={(v) => setData('branch_id', v)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select branch" />
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
                        <div className="grid grid-flow-row gap-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                value={data.description}
                                onChange={(e) => setData('description', e.target.value)}
                                placeholder="Enter shelf/location description"
                                rows={3}
                            />
                            <InputError className="mt-2" message={errors.description} />
                        </div>
                        <div className="flex items-center space-x-2">
                            <Switch id="is_active" checked={data.is_active} onCheckedChange={(checked) => setData('is_active', checked)} />
                            <Label htmlFor="is_active">Active</Label>
                        </div>
                        <div className="flex justify-end gap-3">
                            <Button variant="outline" asChild>
                                <Link href={route('groups.index')}>Cancel</Link>
                            </Button>
                            <Button variant="secondary" type="button" onClick={() => reset()} disabled={processing}>
                                Reset
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
