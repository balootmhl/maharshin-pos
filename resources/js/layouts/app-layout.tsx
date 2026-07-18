import AppLayoutTemplate from '@/layouts/app/app-sidebar-layout';
import { type BreadcrumbItem, SharedData } from '@/types';
import { usePage } from '@inertiajs/react';
import { type ReactNode, useEffect } from 'react';
import { toast } from 'sonner';

interface AppLayoutProps {
    children: ReactNode;
    breadcrumbs?: BreadcrumbItem[];
}

export default function AppLayout({ children, breadcrumbs, ...props }: AppLayoutProps) {
    const { flash } = usePage<SharedData>().props;

    useEffect(() => {
        if (flash.success) {
            setTimeout(() => toast.success(flash.success), 100);
        }
        if (flash.error) {
            setTimeout(() => toast.error(flash.error), 100);
        }
        if (flash.info) {
            setTimeout(() => toast.info(flash.info), 100);
        }
        if (flash.warning) {
            setTimeout(() => toast.warning(flash.warning), 100);
        }
    }, [flash.success, flash.error, flash.info, flash.warning]);

    return (
        <AppLayoutTemplate breadcrumbs={breadcrumbs} {...props}>
            {children}
        </AppLayoutTemplate>
    );
}
