import { useSidebar } from '@/components/ui/sidebar';
import { SharedData } from '@/types';
import { usePage } from '@inertiajs/react';

interface AppLogoProps {
    variant?: 'sidebar' | 'header';
}

export default function AppLogo({ variant = 'sidebar' }: AppLogoProps) {
    const page = usePage<SharedData>();
    const { name, auth } = page.props;
    const { state } = useSidebar();
    const isCollapsed = state === 'collapsed';

    const branch = auth?.user?.branch;
    const logoSrc = branch?.logo_url || '/logo.png?v=2';
    const displayName = branch?.name || name;

    if (isCollapsed) {
        return (
            <div className="flex items-center justify-center w-full py-1">
                <div className="group relative flex size-14 sm:size-16 shrink-0 items-center justify-center transition-transform duration-200 hover:scale-105">
                    <img
                        src={logoSrc}
                        alt={displayName}
                        className="size-full object-contain drop-shadow-md transition-transform duration-200 group-hover:scale-105"
                    />
                </div>
            </div>
        );
    }

    if (variant === 'header') {
        return (
            <div className="flex items-center gap-3">
                <div
                    className="flex size-11 items-center justify-center overflow-hidden rounded-xl border border-white/40 bg-white/30 shadow-xs backdrop-blur-xl dark:border-white/20 dark:bg-white/10 p-1"
                    style={{
                        background: 'linear-gradient(135deg, rgba(255,255,255,0.4) 0%, rgba(139,92,246,0.2) 50%, rgba(167,139,250,0.3) 100%)',
                    }}
                >
                    <img src={logoSrc} alt={displayName} className="size-full object-contain drop-shadow-xs" />
                </div>
            </div>
        );
    }

    // Left-aligned Super Massive Sidebar Logo
    return (
        <div className="w-full flex items-center justify-start py-2 px-1">
            <div className="group relative flex size-32 sm:size-36 md:size-40 shrink-0 items-center justify-start transition-transform duration-300 hover:scale-105">
                <img
                    src={logoSrc}
                    alt={displayName}
                    className="size-full object-contain object-left drop-shadow-md transition-transform duration-300 group-hover:scale-105"
                />
            </div>
        </div>
    );
}
