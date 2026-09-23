import AppearanceToggleDropdown from '@/components/appearance-dropdown';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { type BreadcrumbItem as BreadcrumbItemType, type SharedData } from '@/types';
import { usePage } from '@inertiajs/react';

export function AppSidebarHeader({ breadcrumbs = [] }: { breadcrumbs?: BreadcrumbItemType[] }) {
    const page = usePage<SharedData>();
    const branch = page.props.auth?.user?.branch;

    return (
        <header className="border-sidebar-border/50 flex h-12 shrink-0 items-center justify-between border-b px-3 sm:px-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
            <div className="flex items-center gap-2">
                <SidebarTrigger className="-ml-1" />
                <Breadcrumbs breadcrumbs={breadcrumbs} />
            </div>
            <div className="flex items-center gap-3">
                {branch && (
                    <div className="flex items-center gap-2 rounded-full border border-neutral-200/80 bg-neutral-100/70 dark:bg-neutral-800/60 dark:border-neutral-700/60 px-3.5 py-1 text-xs font-semibold text-neutral-800 dark:text-neutral-200 shadow-2xs">
                        <span className="flex size-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="font-bold text-sm tracking-tight text-neutral-900 dark:text-white">
                            {branch.name}
                        </span>
                        {branch.code && (
                            <span className="rounded-md bg-violet-100 px-2 py-0.5 font-mono text-[11px] font-bold text-violet-700 dark:bg-violet-950/80 dark:text-violet-300 border border-violet-200 dark:border-violet-800">
                                {branch.code}
                            </span>
                        )}
                    </div>
                )}
                <AppearanceToggleDropdown />
            </div>
        </header>
    );
}
