import { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/Components/ui/dialog';
import { Textarea } from '@/Components/ui/textarea';

export default function Index({ seats, users }: any) {
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const { data, setData, post, processing, reset } = useForm({
        title: '',
        user_id: '',
        parent_id: '',
        responsibilities: [] as string[],
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('accountability.store'), {
            onSuccess: () => {
                setIsCreateOpen(false);
                reset();
            },
        });
    };

    return (
        <AuthenticatedLayout
            header={<h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">Accountability Chart</h2>}
        >
            <Head title="Accountability Chart" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8 space-y-6">
                    <div className="flex justify-end">
                        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                            <DialogTrigger asChild>
                                <Button>Add New Seat</Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Add Seat</DialogTitle>
                                </DialogHeader>
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div>
                                        <Label>Title</Label>
                                        <Input value={data.title} onChange={e => setData('title', e.target.value)} required />
                                    </div>
                                    <div>
                                        <Label>Person</Label>
                                        <select
                                            className="w-full border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 rounded-md"
                                            value={data.user_id}
                                            onChange={e => setData('user_id', e.target.value)}
                                        >
                                            <option value="">Vacant</option>
                                            {users.map((u: any) => <option key={u.id} value={u.id}>{u.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <Label>Reports To (Parent Seat)</Label>
                                        <select
                                            className="w-full border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 rounded-md"
                                            value={data.parent_id}
                                            onChange={e => setData('parent_id', e.target.value)}
                                        >
                                            <option value="">None (Top Level)</option>
                                            {seats.data.map((s: any) => <option key={s.id} value={s.id}>{s.title}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <Label>Responsibilities (One per line)</Label>
                                        <Textarea
                                            onChange={e => setData('responsibilities', e.target.value.split('\n'))}
                                        />
                                    </div>
                                    <Button type="submit" disabled={processing} className="w-full">Save Seat</Button>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {seats.data.map((seat: any) => (
                            <Card className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" key={seat.id}>
                                <Card className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass"Header>
                                    <Card className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass"Title>{seat.title}</CardTitle>
                                    <p className="text-sm text-muted-foreground">{seat.user?.name || 'Vacant'}</p>
                                </CardHeader>
                                <Card className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass"Content>
                                    <ul className="text-sm list-disc pl-4 space-y-1">
                                        {seat.responsibilities.map((r: string, idx: number) => (
                                            <li key={idx}>{r}</li>
                                        ))}
                                    </ul>
                                    <div className="mt-4 flex justify-end">
                                        <Button variant="ghost" size="sm" onClick={() => router.delete(route('accountability.destroy', seat.id))}>Delete</Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
