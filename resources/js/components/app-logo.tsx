import { useSidebar } from '@/components/ui/sidebar';
import { SharedData } from '@/types';
import { usePage } from '@inertiajs/react';

export default function AppLogo() {
    const page = usePage<SharedData>();
    const { name } = page.props;
    const { state } = useSidebar();
    const isCollapsed = state === 'collapsed';

    return (
        <div className="flex items-center gap-3">
            <div
                className={`flex items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-violet-100 to-purple-200 shadow-lg ring-1 ring-violet-200 dark:from-violet-900/60 dark:to-purple-900/60 dark:ring-violet-800 ${isCollapsed ? 'size-14 p-1' : 'size-14 p-1.5'}`}
            >
                <img src="/logo.png" alt="App Logo" className="h-full w-full object-contain" />
            </div>
            {!isCollapsed && (
                <div className="grid flex-1 text-left">
                    <span className="truncate text-base leading-tight font-bold">{name}</span>
                    <span className="text-muted-foreground text-xs">Point of Sale</span>
                </div>
            )}
        </div>
    );
}
