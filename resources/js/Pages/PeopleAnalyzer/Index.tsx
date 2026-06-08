import { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/Components/ui/dialog';

export default function Index({ evaluations, users, coreValues }: any) {
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const { data, setData, post, processing, reset } = useForm({
        user_id: '',
        core_value_ratings: {} as any,
        gets_it: '',
        wants_it: '',
        capacity: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('people.store'), {
            onSuccess: () => {
                setIsCreateOpen(false);
                reset();
            },
        });
    };

    const RatingSelect = ({ value, onChange }: any) => (
        <select
            className="text-xs border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 rounded-md p-1"
            value={value || ''}
            onChange={e => onChange(e.target.value)}
        >
            <option value="">-</option>
            <option value="+">+</option>
            <option value="+/-">+/-</option>
            <option value="-">-</option>
        </select>
    );

    const YNSelect = ({ value, onChange }: any) => (
        <select
            className="text-xs border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 rounded-md p-1"
            value={value || ''}
            onChange={e => onChange(e.target.value)}
        >
            <option value="">-</option>
            <option value="y">Yes</option>
            <option value="n">No</option>
        </select>
    );

    return (
        <AuthenticatedLayout
            header={<h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">People Analyzer</h2>}
        >
            <Head title="People Analyzer" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8 space-y-6">
                    <div className="flex justify-end">
                        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                            <DialogTrigger asChild>
                                <Button>Evaluate Team Member</Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                    <DialogTitle>Evaluation</DialogTitle>
                                </DialogHeader>
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium">Team Member</label>
                                        <select
                                            className="w-full border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 rounded-md"
                                            value={data.user_id}
                                            onChange={e => setData('user_id', e.target.value)}
                                            required
                                        >
                                            <option value="">Select...</option>
                                            {users.map((u: any) => <option key={u.id} value={u.id}>{u.name}</option>)}
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium border-b pb-1">Core Values</label>
                                        {coreValues.map((cv: string, idx: number) => (
                                            <div key={idx} className="flex items-center justify-between">
                                                <span className="text-sm">{cv}</span>
                                                <RatingSelect
                                                    value={data.core_value_ratings[idx]}
                                                    onChange={(val: string) => setData('core_value_ratings', { ...data.core_value_ratings, [idx]: val })}
                                                />
                                            </div>
                                        ))}
                                    </div>

                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium border-b pb-1">GWC</label>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm">Gets it?</span>
                                            <YNSelect value={data.gets_it} onChange={(v: string) => setData('gets_it', v)} />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm">Wants it?</span>
                                            <YNSelect value={data.wants_it} onChange={(v: string) => setData('wants_it', v)} />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm">Capacity to do it?</span>
                                            <YNSelect value={data.capacity} onChange={(v: string) => setData('capacity', v)} />
                                        </div>
                                    </div>

                                    <Button type="submit" disabled={processing} className="w-full">Save Evaluation</Button>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>

                    <Card className="glass" className="glass" className="glass">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    {coreValues.map((cv: string, idx: number) => (
                                        <TableHead key={idx} className="text-center">{cv}</TableHead>
                                    ))}
                                    <TableHead className="text-center bg-muted/50">G</TableHead>
                                    <TableHead className="text-center bg-muted/50">W</TableHead>
                                    <TableHead className="text-center bg-muted/50">C</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {evaluations.data.map((evalItem: any) => (
                                    <TableRow key={evalItem.id}>
                                        <TableCell className="font-medium">{evalItem.user.name}</TableCell>
                                        {coreValues.map((_: string, idx: number) => (
                                            <TableCell key={idx} className="text-center">{evalItem.core_value_ratings[idx] || '-'}</TableCell>
                                        ))}
                                        <TableCell className="text-center bg-muted/20 uppercase">{evalItem.gets_it || '-'}</TableCell>
                                        <TableCell className="text-center bg-muted/20 uppercase">{evalItem.wants_it || '-'}</TableCell>
                                        <TableCell className="text-center bg-muted/20 uppercase">{evalItem.capacity || '-'}</TableCell>
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

