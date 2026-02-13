import { Link } from '@inertiajs/react';
import { type PropsWithChildren } from 'react';

interface AuthLayoutProps {
    name?: string;
    title?: string;
    description?: string;
}

export default function AuthSimpleLayout({ children, title, description }: PropsWithChildren<AuthLayoutProps>) {
    return (
        <div className="flex min-h-svh">
            {/* Left Panel - Brand showcase */}
            <div className="relative hidden w-1/2 overflow-hidden lg:flex">
                {/* Gradient background */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#1B2D5B] via-[#1e3a6e] to-[#0f1d3d]" />

                {/* Decorative shapes */}
                <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-[#F5941D]/10 blur-3xl" />
                <div className="absolute -right-32 -bottom-32 h-[500px] w-[500px] rounded-full bg-[#F5941D]/8 blur-3xl" />
                <div className="absolute top-1/4 right-1/4 h-64 w-64 rounded-full bg-white/5 blur-2xl" />

                {/* Content */}
                <div className="relative z-10 flex flex-col items-center justify-center w-full px-12">
                    {/* Logo */}
                    <div className="mb-8 flex items-center justify-center">
                        <div className="rounded-3xl bg-white/10 p-6 shadow-2xl ring-1 ring-white/20 backdrop-blur-sm">
                            <img src="/logo.png?v=2" alt="ZAP POS" className="h-40 w-40 object-contain drop-shadow-2xl" />
                        </div>
                    </div>

                    {/* Brand text */}
                    <h1 className="mb-3 text-3xl font-bold tracking-tight text-white">
                        Maharshin <span className="text-[#F5941D]">POS</span>
                    </h1>
                    <p className="max-w-xs text-center text-sm leading-relaxed text-white/60">
                        Streamline your business with our powerful point of sale system
                    </p>

                    {/* Decorative dots */}
                    <div className="mt-10 flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-[#F5941D]" />
                        <div className="h-2 w-6 rounded-full bg-[#F5941D]/60" />
                        <div className="h-2 w-2 rounded-full bg-[#F5941D]/30" />
                    </div>
                </div>

                {/* Bottom gradient fade */}
                <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#0f1d3d]/50 to-transparent" />
            </div>

            {/* Right Panel - Form */}
            <div className="bg-background flex w-full flex-col items-center justify-center p-6 md:p-10 lg:w-1/2">
                <div className="w-full max-w-md">
                    {/* Mobile logo */}
                    <div className="mb-8 flex flex-col items-center lg:hidden">
                        <Link href={route('home')} className="mb-4">
                            <img src="/logo.png?v=2" alt="Maharshin" className="h-20 w-20 object-contain" />
                        </Link>
                    </div>

                    {/* Form header */}
                    <div className="mb-8 space-y-2">
                        <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
                        <p className="text-muted-foreground text-sm">{description}</p>
                    </div>

                    {/* Form content */}
                    {children}
                </div>

                {/* Footer */}
                <div className="text-muted-foreground mt-12 text-center text-xs">
                    © {new Date().getFullYear()} Maharshin. All rights reserved.
                </div>
            </div>
        </div>
    );
}
