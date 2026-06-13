import { useState } from "react";
import { useForm, Head, usePage, router } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { PageHeader } from "@/Components/ui/page-header";
import { Button } from "@/Components/ui/button";
import { Badge } from "@/Components/ui/badge";
import { Card, CardContent } from "@/Components/ui/card";
import {
    Table,
    TableHeader,
    TableBody,
    TableHead,
    TableRow,
    TableCell,
} from "@/Components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogBody,
    DialogFooter,
} from "@/Components/ui/dialog";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import { Select } from "@/Components/ui/select";
import { EmptyState } from "@/Components/ui/empty-state";
import { ConfirmDialog } from "@/Components/ui/confirm-dialog";
import { Checkbox } from "@/Components/ui/checkbox";

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
    is_overdue: boolean;
}

export default function ToDoIndex({
    todos,
    users,
}: {
    todos: { data: ToDo[] };
    users: User[];
}) {
    const { auth } = usePage().props as any;
    const isLeader = auth.teamRole === "leader";
    const userId = auth.user.id;
    const [createOpen, setCreateOpen] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);

    const { data, setData, post, processing, reset, errors } = useForm({
        title: "",
        owner_id: users[0]?.id || "",
        due_date: new Date().toISOString().split("T")[0],
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route("todos.store"), {
            onSuccess: () => {
                setCreateOpen(false);
                reset();
            },
        });
    };

    const toggle = (id: number) =>
        router.patch(route("todos.toggle", id), {}, { preserveScroll: true });

    const destroy = (id: number) => {
        router.delete(route("todos.destroy", id), {
            preserveScroll: true,
            onSuccess: () => setDeleteId(null),
        });
    };

    const carryForward = () =>
        router.post(route("todos.carryForward"), {}, { preserveScroll: true });

    const todoList = todos.data;
    const pending = todoList.filter((t) => !t.is_completed);
    const overdue = pending.filter((t) => t.is_overdue);
    const done = todoList.filter((t) => t.is_completed);

    const canDelete = (todo: ToDo) => isLeader || todo.owner.id === userId;

    return (
        <AuthenticatedLayout>
            <Head title="To-Do" />

            <PageHeader
                title="To-Do"
                subtitle="Weekly action items tim"
                action={
                    <div className="flex items-center gap-sm">
                        {isLeader && (
                            <Button variant="secondary" onClick={carryForward}>
                                Carry Forward
                            </Button>
                        )}
                        <Button onClick={() => setCreateOpen(true)}>
                            + Tambah To-Do
                        </Button>
                    </div>
                }
            />

            {/* Stats */}
            <div className="mb-xl grid grid-cols-3 gap-lg">
                {[
                    {
                        label: "Pending",
                        value: pending.length,
                        valueClass: "text-[#1a1a1a]",
                    },
                    {
                        label: "Overdue",
                        value: overdue.length,
                        valueClass: "text-[#991b1b]",
                    },
                    {
                        label: "Done",
                        value: done.length,
                        valueClass: "text-[#1a5c41]",
                    },
                ].map((stat) => (
                    <Card key={stat.label}>
                        <CardContent className="pt-xl">
                            <p className="mb-sm text-[12px] font-medium tracking-wide text-text-muted uppercase">
                                {stat.label}
                            </p>
                            <p
                                className={`text-[32px] font-semibold tracking-tight leading-none ${stat.valueClass}`}
                            >
                                {stat.value}
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Table>
                <TableHeader>
                    <TableRow>
                        {["", "To-Do", "Owner", "Due Date", "Status", ""].map(
                            (h, i) => (
                                <TableHead key={i}>{h}</TableHead>
                            ),
                        )}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {todoList.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={6}>
                                <EmptyState
                                    title="Belum ada to-do"
                                    description="Tambah to-do pertama untuk team ini."
                                />
                            </TableCell>
                        </TableRow>
                    )}
                    {todoList.map((todo) => (
                        <TableRow
                            key={todo.id}
                            className={todo.is_completed ? "opacity-50" : ""}
                        >
                            <TableCell className="w-10">
                                <Checkbox
                                    checked={todo.is_completed}
                                    onCheckedChange={() => toggle(todo.id)}
                                />
                            </TableCell>
                            <TableCell>
                                <span
                                    className={`text-[13px] font-medium text-text-primary ${todo.is_completed ? "line-through" : ""}`}
                                >
                                    {todo.title}
                                </span>
                            </TableCell>
                            <TableCell className="text-text-secondary">
                                {todo.owner.name}
                            </TableCell>
                            <TableCell>
                                <span
                                    className={
                                        todo.is_overdue
                                            ? "font-medium text-error-text"
                                            : "text-text-secondary"
                                    }
                                >
                                    {todo.due_date}
                                    {todo.is_overdue && " ⚠"}
                                </span>
                            </TableCell>
                            <TableCell>
                                {todo.is_completed ? (
                                    <Badge variant="success">Done</Badge>
                                ) : todo.is_overdue ? (
                                    <Badge variant="error">Overdue</Badge>
                                ) : (
                                    <Badge variant="neutral">Pending</Badge>
                                )}
                            </TableCell>
                            <TableCell className="text-right">
                                {canDelete(todo) && (
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => setDeleteId(todo.id)}
                                    >
                                        Hapus
                                    </Button>
                                )}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>

            {/* Create Modal */}
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogContent size="md">
                    <DialogHeader>
                        <DialogTitle>Tambah To-Do</DialogTitle>
                    </DialogHeader>
                    <DialogBody>
                        <form
                            onSubmit={submit}
                            className="flex flex-col gap-lg"
                        >
                            <div className="flex flex-col gap-xs">
                                <Label htmlFor="todo-title">To-Do *</Label>
                                <Input
                                    id="todo-title"
                                    value={data.title}
                                    onChange={(e) =>
                                        setData("title", e.target.value)
                                    }
                                    placeholder="Apa yang perlu dikerjakan?"
                                    aria-invalid={!!errors.title}
                                    required
                                />
                                {errors.title && (
                                    <p className="text-[12px] text-error-text">
                                        {errors.title}
                                    </p>
                                )}
                            </div>
                            <div className="grid grid-cols-2 gap-md">
                                <div className="flex flex-col gap-xs">
                                    <Label htmlFor="todo-owner">Owner *</Label>
                                    <Select
                                        id="todo-owner"
                                        value={data.owner_id}
                                        onChange={(e) =>
                                            setData("owner_id", e.target.value)
                                        }
                                    >
                                        {users.map((u) => (
                                            <option key={u.id} value={u.id}>
                                                {u.name}
                                            </option>
                                        ))}
                                    </Select>
                                </div>
                                <div className="flex flex-col gap-xs">
                                    <Label htmlFor="todo-due">Due Date *</Label>
                                    <Input
                                        id="todo-due"
                                        type="date"
                                        value={data.due_date}
                                        onChange={(e) =>
                                            setData("due_date", e.target.value)
                                        }
                                        required
                                    />
                                </div>
                            </div>
                        </form>
                    </DialogBody>
                    <DialogFooter>
                        <Button
                            variant="secondary"
                            onClick={() => setCreateOpen(false)}
                        >
                            Batal
                        </Button>
                        <Button onClick={submit} disabled={processing}>
                            {processing ? "Menyimpan…" : "Simpan"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                open={deleteId !== null}
                onOpenChange={(open) => !open && setDeleteId(null)}
                title="Hapus To-Do"
                description="To-do ini akan dihapus."
                onConfirm={() => deleteId && destroy(deleteId)}
            />
        </AuthenticatedLayout>
    );
}
