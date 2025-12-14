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
                className={`flex items-center justify-center overflow-hidden rounded-2xl border border-white/40 bg-white/30 shadow-[0_8px_32px_0_rgba(139,92,246,0.37)] backdrop-blur-xl dark:border-white/20 dark:bg-white/10 ${isCollapsed ? 'size-14 p-1' : 'size-14 p-1.5'}`}
                style={{
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.4) 0%, rgba(139,92,246,0.2) 50%, rgba(167,139,250,0.3) 100%)',
                }}
            >
                <img src="/logo.png" alt="App Logo" className="h-full w-full object-contain drop-shadow-sm" />
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
