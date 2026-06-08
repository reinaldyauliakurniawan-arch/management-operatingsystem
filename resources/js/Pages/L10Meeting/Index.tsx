import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/ui/table';

export default function Index({ meetings }: any) {
    return (
        <AuthenticatedLayout
            header={<h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">L10 Meetings</h2>}
        >
            <Head title="Meetings" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8 space-y-6">
                    <div className="flex justify-end">
                        <Link href={route('l10.create')}>
                            <Button>Start New L10</Button>
                        </Link>
                    </div>

                    <Card className="glass" className="glass" className="glass">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Rating</TableHead>
                                    <TableHead>Attendees</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {meetings.data.map((m: any) => (
                                    <TableRow key={m.id}>
                                        <TableCell>{m.started_at}</TableCell>
                                        <TableCell>{m.rating || '-'}</TableCell>
                                        <TableCell>
                                            {m.attendees.map((a: any) => a.name).join(', ')}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Link href={route('l10.workspace', m.id)}>
                                                <Button variant="ghost">View</Button>
                                            </Link>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Card>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

