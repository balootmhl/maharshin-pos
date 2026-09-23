import { Button } from '@/components/ui/button';
import { type Appearance, useAppearance } from '@/hooks/use-appearance';
import { Monitor, Moon, Sun } from 'lucide-react';
import { HTMLAttributes } from 'react';
import { toast } from 'sonner';

export default function AppearanceToggleDropdown({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
    const { appearance, updateAppearance } = useAppearance();

    const cycleTheme = () => {
        const rotationMap: Record<Appearance, Appearance> = {
            light: 'dark',
            dark: 'system',
            system: 'light',
        };

        const nextTheme = rotationMap[appearance] || 'light';
        updateAppearance(nextTheme);

        switch (nextTheme) {
            case 'light':
                toast.success('Switched to Light mode', {
                    description: 'Bright theme enabled',
                    duration: 2000,
                });
                break;
            case 'dark':
                toast.success('Switched to Dark mode', {
                    description: 'Dark theme enabled',
                    duration: 2000,
                });
                break;
            case 'system':
                toast.info('Switched to System theme', {
                    description: 'Syncing with system preferences',
                    duration: 2000,
                });
                break;
        }
    };

    const getCurrentIcon = () => {
        switch (appearance) {
            case 'dark':
                return <Moon className="h-4 w-4 transition-transform duration-200" />;
            case 'light':
                return <Sun className="h-4 w-4 transition-transform duration-200" />;
            default:
                return <Monitor className="h-4 w-4 transition-transform duration-200" />;
        }
    };

    const getTooltip = () => {
        switch (appearance) {
            case 'light':
                return 'Theme: Light (Click for Dark)';
            case 'dark':
                return 'Theme: Dark (Click for System)';
            default:
                return 'Theme: System (Click for Light)';
        }
    };

    return (
        <div className={className} {...props}>
            <Button
                variant="ghost"
                size="icon"
                type="button"
                onClick={cycleTheme}
                title={getTooltip()}
                className="h-9 w-9 rounded-md transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
                {getCurrentIcon()}
                <span className="sr-only">Toggle theme</span>
            </Button>
        </div>
    );
}
