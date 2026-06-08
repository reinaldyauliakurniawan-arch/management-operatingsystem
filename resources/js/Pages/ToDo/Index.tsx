import { useState } from 'react';
import { useForm, Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/Components/ui/dialog';
import { Checkbox } from '@/Components/ui/checkbox';

interface User {
    id: number;
    name: string;
}

interface ToDo {
    id: number;
    title: string;
    owner: { id: number; name: string };
    due_date: string;
    is_completed: boolean;
}

export default function Index({ todos, users }: { todos: { data: ToDo[] }, users: User[] }) {
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const { data, setData, post, processing, reset } = useForm({
        title: '',
        owner_id: users[0]?.id || '',
        due_date: new Date().toISOString().split('T')[0],
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('todos.store'), {
            onSuccess: () => {
                setIsCreateOpen(false);
                reset();
            },
        });
    };

    const toggleTodo = (id: number) => {
        router.patch(route('todos.toggle', id), {}, { preserveScroll: true });
    };

    const carryForward = () => {
        router.post(route('todos.carryForward'), {}, { preserveScroll: true });
    };

    return (
        <AuthenticatedLayout
            header={<h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">To-Do List</h2>}
        >
            <Head title="To-Do List" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8 space-y-6">
                    <div className="flex justify-between">
                        <Button variant="outline" onClick={carryForward}>Carry Forward Incomplete</Button>
                        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                            <DialogTrigger asChild>
                                <Button>Add To-Do</Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Add New To-Do</DialogTitle>
                                </DialogHeader>
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div>
                                        <Label>Title</Label>
                                        <Input value={data.title} onChange={e => setData('title', e.target.value)} required />
                                    </div>
                                    <div>
                                        <Label>Owner</Label>
                                        <select
                                            className="w-full border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 rounded-md"
                                            value={data.owner_id}
                                            onChange={e => setData('owner_id', e.target.value)}
                                        >
                                            {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <Label>Due Date</Label>
                                        <Input type="date" value={data.due_date} onChange={e => setData('due_date', e.target.value)} required />
                                    </div>
                                    <Button type="submit" disabled={processing} className="w-full">Save To-Do</Button>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>

                    <Card className="glass" className="glass" className="glass">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-12"></TableHead>
                                    <TableHead>Title</TableHead>
                                    <TableHead>Owner</TableHead>
                                    <TableHead>Due Date</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {todos.data.map((todo) => (
                                    <TableRow key={todo.id} className={todo.is_completed ? 'opacity-50 line-through' : ''}>
                                        <TableCell>
                                            <Checkbox
                                                checked={todo.is_completed}
                                                onCheckedChange={() => toggleTodo(todo.id)}
                                            />
                                        </TableCell>
                                        <TableCell className="font-medium">{todo.title}</TableCell>
                                        <TableCell>{todo.owner.name}</TableCell>
                                        <TableCell>
                                            <span className={new Date(todo.due_date) < new Date() && !todo.is_completed ? 'text-red-500 font-bold' : ''}>
                                                {todo.due_date}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="sm" onClick={() => router.delete(route('todos.destroy', todo.id))}>Delete</Button>
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

