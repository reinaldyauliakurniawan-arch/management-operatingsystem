import { useState, useMemo } from 'react';
import { useForm, Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Badge } from '@/Components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/Components/ui/dialog';
import { router } from '@inertiajs/react';

interface User {
    id: number;
    name: string;
}

interface Rock {
    id: number;
    title: string;
    description: string;
    owner: { id: number; name: string };
    quarter: string;
    year: number;
    status: 'on_track' | 'off_track' | 'done';
}

export default function Index({ rocks, users }: { rocks: { data: Rock[] }, users: User[] }) {
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const { data, setData, post, processing, reset, errors } = useForm({
        title: '',
        description: '',
        owner_id: users[0]?.id || '',
        quarter: 'Q1',
        year: new Date().getFullYear(),
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('rocks.store'), {
            onSuccess: () => {
                setIsCreateOpen(false);
                reset();
            },
        });
    };

    const updateStatus = (id: number, status: string) => {
        router.patch(route('rocks.updateStatus', id), { status }, {
            preserveScroll: true,
        });
    };

    const deleteRock = (id: number) => {
        if (confirm('Are you sure?')) {
            router.delete(route('rocks.destroy', id), {
                preserveScroll: true,
            });
        }
    };

    return (
        <AuthenticatedLayout
            header={<h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">Rocks (Quarterly Goals)</h2>}
        >
            <Head title="Rocks" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8 space-y-6">
                    <div className="flex justify-end">
                        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                            <DialogTrigger asChild>
                                <Button>Add Rock</Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Add New Rock</DialogTitle>
                                </DialogHeader>
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div>
                                        <Label>Title</Label>
                                        <Input value={data.title} onChange={e => setData('title', e.target.value)} required />
                                    </div>
                                    <div>
                                        <Label>Owner</Label>
                                        <select
                                            className="w-full border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 focus:border-indigo-500 dark:focus:border-indigo-600 focus:ring-indigo-500 dark:focus:ring-indigo-600 rounded-md shadow-sm"
                                            value={data.owner_id}
                                            onChange={e => setData('owner_id', e.target.value)}
                                        >
                                            {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label>Quarter</Label>
                                            <select
                                                className="w-full border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 focus:border-indigo-500 dark:focus:border-indigo-600 focus:ring-indigo-500 dark:focus:ring-indigo-600 rounded-md shadow-sm"
                                                value={data.quarter}
                                                onChange={e => setData('quarter', e.target.value)}
                                            >
                                                <option value="Q1">Q1</option>
                                                <option value="Q2">Q2</option>
                                                <option value="Q3">Q3</option>
                                                <option value="Q4">Q4</option>
                                            </select>
                                        </div>
                                        <div>
                                            <Label>Year</Label>
                                            <Input type="number" value={data.year} onChange={e => setData('year', parseInt(e.target.value))} />
                                        </div>
                                    </div>
                                    <Button type="submit" disabled={processing} className="w-full">Save Rock</Button>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>

                    <Card className="glass" className="glass" className="glass">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Title</TableHead>
                                    <TableHead>Owner</TableHead>
                                    <TableHead>Period</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {rocks.data.map((rock) => (
                                    <TableRow key={rock.id}>
                                        <TableCell className="font-medium">{rock.title}</TableCell>
                                        <TableCell>{rock.owner.name}</TableCell>
                                        <TableCell>{rock.quarter} {rock.year}</TableCell>
                                        <TableCell>
                                            <Badge variant={rock.status === 'done' ? 'default' : rock.status === 'off_track' ? 'destructive' : 'secondary'}>
                                                {rock.status.replace('_', ' ')}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right space-x-2">
                                            <select
                                                className="text-sm border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 rounded-md"
                                                value={rock.status}
                                                onChange={(e) => updateStatus(rock.id, e.target.value)}
                                            >
                                                <option value="on_track">On Track</option>
                                                <option value="off_track">Off Track</option>
                                                <option value="done">Done</option>
                                            </select>
                                            <Button variant="ghost" size="sm" onClick={() => deleteRock(rock.id)}>Delete</Button>
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

