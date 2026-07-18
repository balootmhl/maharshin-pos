import { PropsWithChildren } from 'react';

export function FormGrid({
    children,
    title,
    description,
}: PropsWithChildren<{
    title: string;
    description?: string;
}>) {
    return (
        <div className="flex flex-col justify-between gap-4 md:flex-row">
            <div className="max-w-md space-y-4">
                <h3 className="text-lg">{title}</h3>
                {description && <p className="text-sm text-gray-500">{description}</p>}
            </div>
            <div className="max-w-xl grow md:max-w-2xl">{children}</div>
        </div>
    );
}
