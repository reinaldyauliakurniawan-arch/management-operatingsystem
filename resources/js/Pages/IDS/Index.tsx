import { useState } from 'react';
import { useForm, Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Badge } from '@/Components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/Components/ui/dialog';
import { Textarea } from '@/Components/ui/textarea';

interface Issue {
    id: number;
    title: string;
    description: string;
    priority: number;
    status: 'open' | 'resolved';
    owner: { id: number; name: string } | null;
}

export default function Index({ issues, users }: { issues: { data: Issue[] }, users: any[] }) {
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const { data, setData, post, processing, reset } = useForm({
        title: '',
        description: '',
        priority: 0,
        owner_id: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('ids.store'), {
            onSuccess: () => {
                setIsCreateOpen(false);
                reset();
            },
        });
    };

    return (
        <AuthenticatedLayout
            header={<h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">IDS (Issues List)</h2>}
        >
            <Head title="IDS" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8 space-y-6">
                    <div className="flex justify-end">
                        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                            <DialogTrigger asChild>
                                <Button>Identify New Issue</Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Identify Issue</DialogTitle>
                                </DialogHeader>
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div>
                                        <Label>Title</Label>
                                        <Input value={data.title} onChange={e => setData('title', e.target.value)} required />
                                    </div>
                                    <div>
                                        <Label>Description</Label>
                                        <Textarea value={data.description} onChange={e => setData('description', e.target.value)} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label>Priority (Higher = More Urgent)</Label>
                                            <Input type="number" value={data.priority} onChange={e => setData('priority', parseInt(e.target.value))} />
                                        </div>
                                        <div>
                                            <Label>Owner (Optional)</Label>
                                            <select
                                                className="w-full border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 rounded-md"
                                                value={data.owner_id}
                                                onChange={e => setData('owner_id', e.target.value)}
                                            >
                                                <option value="">No Owner</option>
                                                {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <Button type="submit" disabled={processing} className="w-full">Save Issue</Button>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>

                    <Card className="glass" className="glass" className="glass">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-16 text-center">Priority</TableHead>
                                    <TableHead>Title</TableHead>
                                    <TableHead>Owner</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {issues.data.map((issue) => (
                                    <TableRow key={issue.id} className={issue.status === 'resolved' ? 'opacity-50' : ''}>
                                        <TableCell className="text-center font-bold">{issue.priority}</TableCell>
                                        <TableCell>
                                            <div className="font-medium">{issue.title}</div>
                                            {issue.description && <div className="text-sm text-gray-500">{issue.description}</div>}
                                        </TableCell>
                                        <TableCell>{issue.owner?.name || '-'}</TableCell>
                                        <TableCell>
                                            <Badge variant={issue.status === 'resolved' ? 'secondary' : 'default'}>
                                                {issue.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right space-x-2">
                                            {issue.status === 'open' && (
                                                <Button variant="outline" size="sm" onClick={() => router.patch(route('ids.resolve', issue.id))}>Solve</Button>
                                            )}
                                            <Button variant="ghost" size="sm" onClick={() => router.delete(route('ids.destroy', issue.id))}>Delete</Button>
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
