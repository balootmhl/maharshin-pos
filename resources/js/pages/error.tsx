import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { Head, Link } from '@inertiajs/react';
import { FileQuestion, ServerCrash, ShieldAlert, Wrench } from 'lucide-react';

export default function ErrorPage({ status }: { status: number }) {
    const title =
        {
            503: '503: Service Unavailable',
            500: '500: Server Error',
            404: '404: Page Not Found',
            403: '403: Access Denied',
        }[status] || 'Error';

    const description =
        {
            503: 'Sorry, we are doing some maintenance. Please check back soon.',
            500: 'Whoops, something went wrong on our servers.',
            404: 'Sorry, the page you are looking for could not be found.',
            403: 'Sorry, you do not have permission to access this page.',
        }[status] || 'Something went wrong.';

    const Icon =
        {
            503: Wrench,
            500: ServerCrash,
            404: FileQuestion,
            403: ShieldAlert,
        }[status] || ShieldAlert;

    return (
        <AppLayout breadcrumbs={[{ title: title, href: '#' }]}>
            <Head title={title} />
            <div className="flex h-full flex-1 items-center justify-center rounded-xl p-4">
                <div className="flex flex-col items-center justify-center space-y-6 text-center">
                    <div className="rounded-full bg-muted p-8">
                        <Icon className="h-16 w-16 text-muted-foreground" />
                    </div>
                    <div className="space-y-2">
                        <h1 className="text-4xl font-bold tracking-tight text-foreground">{title}</h1>
                        <p className="mx-auto max-w-md text-lg text-muted-foreground">{description}</p>
                    </div>
                    <div className="pt-4">
                        <Button asChild size="lg">
                            <Link href="/dashboard">Back to Dashboard</Link>
                        </Button>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
