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
import { Textarea } from "@/Components/ui/textarea";
import { Label } from "@/Components/ui/label";
import { Select } from "@/Components/ui/select";
import { EmptyState } from "@/Components/ui/empty-state";
import { ConfirmDialog } from "@/Components/ui/confirm-dialog";

interface User {
    id: number;
    name: string;
}
interface Issue {
    id: number;
    title: string;
    description: string;
    root_cause: string;
    solution: string;
    priority: number;
    status: "open" | "resolved";
    owner: { id: number; name: string } | null;
    todo_count: number;
}

function priorityClass(priority: number) {
    if (priority >= 7) return "text-error-text";
    if (priority >= 4) return "text-warning-text";
    return "text-text-secondary";
}

export default function IDSIndex({
    issues,
    users,
}: {
    issues: { data: Issue[] };
    users: User[];
}) {
    const { auth } = usePage().props as any;
    const isLeader = auth.teamRole === "leader";
    const isMember = auth.teamRole === "member";
    const [createOpen, setCreateOpen] = useState(false);
    const [editIssue, setEditIssue] = useState<Issue | null>(null);
    const [deleteId, setDeleteId] = useState<number | null>(null);

    // Create form
    const createForm = useForm({
        title: "",
        description: "",
        root_cause: "",
        solution: "",
        priority: 5,
        owner_id: "",
    });

    // Edit form
    const editForm = useForm({
        title: "",
        description: "",
        root_cause: "",
        solution: "",
        priority: 5,
        owner_id: "",
    });

    const submitCreate = (e: React.FormEvent) => {
        e.preventDefault();
        createForm.post(route("ids.store"), {
            onSuccess: () => {
                setCreateOpen(false);
                createForm.reset();
            },
        });
    };

    const openEdit = (issue: Issue) => {
        setEditIssue(issue);
        editForm.setData({
            title: issue.title,
            description: issue.description ?? "",
            root_cause: issue.root_cause ?? "",
            solution: issue.solution ?? "",
            priority: issue.priority,
            owner_id: issue.owner ? String(issue.owner.id) : "",
        });
    };

    const submitEdit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editIssue) return;
        editForm.patch(route("ids.update", editIssue.id), {
            onSuccess: () => {
                setEditIssue(null);
                editForm.reset();
            },
        });
    };

    const resolve = (id: number) =>
        router.patch(route("ids.resolve", id), {}, { preserveScroll: true });

    const destroy = (id: number) => {
        router.delete(route("ids.destroy", id), {
            preserveScroll: true,
            onSuccess: () => setDeleteId(null),
        });
    };

    const issueList = issues.data;
    const open = issueList.filter((i) => i.status === "open").length;
    const resolved = issueList.filter((i) => i.status === "resolved").length;

    return (
        <AuthenticatedLayout>
            <Head title="Issues / IDS" />

            <PageHeader
                title="Issues / IDS"
                subtitle="Identify · Discuss · Solve"
                action={
                    <Button onClick={() => setCreateOpen(true)}>
                        + Identify Issue
                    </Button>
                }
            />

            {/* Stats */}
            <div className="mb-xl grid grid-cols-2 max-w-md gap-lg">
                {[
                    {
                        label: "Open",
                        value: open,
                        valueClass:
                            open > 0 ? "text-error-text" : "text-text-primary",
                    },
                    {
                        label: "Resolved",
                        value: resolved,
                        valueClass: "text-primary",
                    },
                ].map((stat) => (
                    <Card key={stat.label}>
                        <CardContent>
                            <p className="mb-sm text-xs font-medium uppercase tracking-wider text-text-muted">
                                {stat.label}
                            </p>
                            <p
                                className={`text-3xl font-semibold tracking-tight leading-none tabular-nums ${stat.valueClass}`}
                            >
                                {stat.value}
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-12">Skala</TableHead>
                            <TableHead className="min-w-[200px]">
                                Issue
                            </TableHead>
                            <TableHead className="min-w-[140px]">
                                Akar Masalah
                            </TableHead>
                            <TableHead className="min-w-[140px]">
                                Solusi
                            </TableHead>
                            <TableHead className="w-16 text-center">
                                To-Dos
                            </TableHead>
                            <TableHead className="min-w-[100px]">
                                Owner
                            </TableHead>
                            <TableHead className="min-w-[80px]">
                                Status
                            </TableHead>
                            <TableHead className="w-[180px]" />
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {issueList.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={8}>
                                    <EmptyState
                                        title="Tidak ada issue"
                                        description="Semua aman! Belum ada issue yang di-identify."
                                    />
                                </TableCell>
                            </TableRow>
                        )}
                        {issueList.map((issue) => (
                            <TableRow
                                key={issue.id}
                                className={
                                    issue.status === "resolved"
                                        ? "opacity-50"
                                        : ""
                                }
                            >
                                <TableCell className="w-12">
                                    <span
                                        className={`text-[var(--font-base)] font-semibold ${priorityClass(issue.priority)}`}
                                    >
                                        {issue.priority}
                                    </span>
                                </TableCell>
                                <TableCell className="min-w-[200px] max-w-[280px]">
                                    <p className="text-[13px] font-medium text-text-primary break-words">
                                        {issue.title}
                                    </p>
                                    {issue.description && (
                                        <p
                                            className="mt-0.5 text-[13px] text-text-muted line-clamp-2 cursor-help"
                                            title={issue.description}
                                        >
                                            {issue.description}
                                        </p>
                                    )}
                                </TableCell>
                                <TableCell className="min-w-[140px] max-w-[200px] text-text-secondary">
                                    {issue.root_cause ? (
                                        <span
                                            className="line-clamp-2 cursor-help"
                                            title={issue.root_cause}
                                        >
                                            {issue.root_cause}
                                        </span>
                                    ) : (
                                        <span className="text-text-muted">
                                            —
                                        </span>
                                    )}
                                </TableCell>
                                <TableCell className="min-w-[140px] max-w-[200px] text-text-secondary">
                                    {issue.solution ? (
                                        <span
                                            className="line-clamp-2 cursor-help"
                                            title={issue.solution}
                                        >
                                            {issue.solution}
                                        </span>
                                    ) : (
                                        <span className="text-text-muted">
                                            —
                                        </span>
                                    )}
                                </TableCell>
                                <TableCell className="text-text-secondary text-center">
                                    {issue.todo_count > 0 ? (
                                        <span className="inline-flex items-center justify-center rounded-full bg-primary-subtle px-sm py-xs text-[var(--font-sm)] font-medium text-primary-text">
                                            {issue.todo_count}
                                        </span>
                                    ) : (
                                        <span className="text-text-muted">
                                            —
                                        </span>
                                    )}
                                </TableCell>
                                <TableCell className="text-text-secondary">
                                    {issue.owner?.name ?? "—"}
                                </TableCell>
                                <TableCell>
                                    {issue.status === "open" ? (
                                        <Badge variant="error">Open</Badge>
                                    ) : (
                                        <Badge variant="success">
                                            Resolved
                                        </Badge>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center justify-end gap-sm">
                                        {(isLeader || isMember) && (
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                onClick={() => openEdit(issue)}
                                            >
                                                Edit
                                            </Button>
                                        )}
                                        {issue.status === "open" &&
                                            (isLeader || isMember) && (
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    onClick={() =>
                                                        resolve(issue.id)
                                                    }
                                                >
                                                    Solve
                                                </Button>
                                            )}
                                        {isLeader && (
                                            <Button
                                                variant="danger"
                                                size="sm"
                                                onClick={() =>
                                                    setDeleteId(issue.id)
                                                }
                                            >
                                                Hapus
                                            </Button>
                                        )}
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {/* Create Modal */}
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogContent size="md">
                    <DialogHeader>
                        <DialogTitle>Identify Issue</DialogTitle>
                    </DialogHeader>
                    <DialogBody>
                        <form
                            id="ids-create-form"
                            onSubmit={submitCreate}
                            className="flex flex-col gap-lg"
                        >
                            <div className="flex flex-col gap-xs">
                                <Label htmlFor="c-title">Issue *</Label>
                                <Input
                                    id="c-title"
                                    value={createForm.data.title}
                                    onChange={(e) =>
                                        createForm.setData(
                                            "title",
                                            e.target.value,
                                        )
                                    }
                                    placeholder="Apa masalahnya?"
                                    aria-invalid={!!createForm.errors.title}
                                    required
                                />
                                {createForm.errors.title && (
                                    <p className="text-[var(--font-base)] text-error-text">
                                        {createForm.errors.title}
                                    </p>
                                )}
                            </div>
                            <div className="flex flex-col gap-xs">
                                <Label htmlFor="c-desc">
                                    Deskripsi Masalah
                                </Label>
                                <Textarea
                                    id="c-desc"
                                    value={createForm.data.description}
                                    onChange={(e) =>
                                        createForm.setData(
                                            "description",
                                            e.target.value,
                                        )
                                    }
                                    placeholder="Detail masalah..."
                                    rows={3}
                                />
                            </div>
                            <div className="flex flex-col gap-xs">
                                <Label htmlFor="c-root">
                                    Akar Masalah (Root Cause)
                                </Label>
                                <Textarea
                                    id="c-root"
                                    value={createForm.data.root_cause}
                                    onChange={(e) =>
                                        createForm.setData(
                                            "root_cause",
                                            e.target.value,
                                        )
                                    }
                                    placeholder="Apa penyebab utamanya?"
                                    rows={2}
                                />
                            </div>
                            <div className="flex flex-col gap-xs">
                                <Label htmlFor="c-sol">Solusi</Label>
                                <Textarea
                                    id="c-sol"
                                    value={createForm.data.solution}
                                    onChange={(e) =>
                                        createForm.setData(
                                            "solution",
                                            e.target.value,
                                        )
                                    }
                                    placeholder="Solusi yang direncanakan..."
                                    rows={2}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-md">
                                <div className="flex flex-col gap-xs">
                                    <Label htmlFor="c-priority">
                                        Priority (0–10)
                                    </Label>
                                    <Input
                                        id="c-priority"
                                        type="number"
                                        min={0}
                                        max={10}
                                        value={createForm.data.priority}
                                        onChange={(e) =>
                                            createForm.setData(
                                                "priority",
                                                parseInt(e.target.value),
                                            )
                                        }
                                    />
                                </div>
                                <div className="flex flex-col gap-xs">
                                    <Label htmlFor="c-owner">Owner</Label>
                                    <Select
                                        id="c-owner"
                                        value={createForm.data.owner_id}
                                        onChange={(e) =>
                                            createForm.setData(
                                                "owner_id",
                                                e.target.value,
                                            )
                                        }
                                    >
                                        <option value="">— Tidak ada —</option>
                                        {users.map((u) => (
                                            <option key={u.id} value={u.id}>
                                                {u.name}
                                            </option>
                                        ))}
                                    </Select>
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
                        <Button
                            type="submit"
                            form="ids-create-form"
                            disabled={createForm.processing}
                        >
                            {createForm.processing ? "Menyimpan…" : "Identify"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Modal */}
            <Dialog
                open={editIssue !== null}
                onOpenChange={(o) => !o && setEditIssue(null)}
            >
                <DialogContent size="md">
                    <DialogHeader>
                        <DialogTitle>Edit Issue</DialogTitle>
                    </DialogHeader>
                    <DialogBody>
                        <form
                            id="ids-edit-form"
                            onSubmit={submitEdit}
                            className="flex flex-col gap-lg"
                        >
                            <div className="flex flex-col gap-xs">
                                <Label htmlFor="e-title">Issue *</Label>
                                <Input
                                    id="e-title"
                                    value={editForm.data.title}
                                    onChange={(e) =>
                                        editForm.setData(
                                            "title",
                                            e.target.value,
                                        )
                                    }
                                    placeholder="Apa masalahnya?"
                                    required
                                />
                                {editForm.errors.title && (
                                    <p className="text-[var(--font-base)] text-error-text">
                                        {editForm.errors.title}
                                    </p>
                                )}
                            </div>
                            <div className="flex flex-col gap-xs">
                                <Label htmlFor="e-desc">
                                    Deskripsi Masalah
                                </Label>
                                <Textarea
                                    id="e-desc"
                                    value={editForm.data.description}
                                    onChange={(e) =>
                                        editForm.setData(
                                            "description",
                                            e.target.value,
                                        )
                                    }
                                    placeholder="Detail masalah..."
                                    rows={3}
                                />
                            </div>
                            <div className="flex flex-col gap-xs">
                                <Label htmlFor="e-root">
                                    Akar Masalah (Root Cause)
                                </Label>
                                <Textarea
                                    id="e-root"
                                    value={editForm.data.root_cause}
                                    onChange={(e) =>
                                        editForm.setData(
                                            "root_cause",
                                            e.target.value,
                                        )
                                    }
                                    placeholder="Apa penyebab utamanya?"
                                    rows={2}
                                />
                            </div>
                            <div className="flex flex-col gap-xs">
                                <Label htmlFor="e-sol">Solusi</Label>
                                <Textarea
                                    id="e-sol"
                                    value={editForm.data.solution}
                                    onChange={(e) =>
                                        editForm.setData(
                                            "solution",
                                            e.target.value,
                                        )
                                    }
                                    placeholder="Solusi yang direncanakan..."
                                    rows={2}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-md">
                                <div className="flex flex-col gap-xs">
                                    <Label htmlFor="e-priority">
                                        Priority (0–10)
                                    </Label>
                                    <Input
                                        id="e-priority"
                                        type="number"
                                        min={0}
                                        max={10}
                                        value={editForm.data.priority}
                                        onChange={(e) =>
                                            editForm.setData(
                                                "priority",
                                                parseInt(e.target.value),
                                            )
                                        }
                                    />
                                </div>
                                <div className="flex flex-col gap-xs">
                                    <Label htmlFor="e-owner">Owner</Label>
                                    <Select
                                        id="e-owner"
                                        value={editForm.data.owner_id}
                                        onChange={(e) =>
                                            editForm.setData(
                                                "owner_id",
                                                e.target.value,
                                            )
                                        }
                                    >
                                        <option value="">— Tidak ada —</option>
                                        {users.map((u) => (
                                            <option key={u.id} value={u.id}>
                                                {u.name}
                                            </option>
                                        ))}
                                    </Select>
                                </div>
                            </div>
                        </form>
                    </DialogBody>
                    <DialogFooter>
                        <Button
                            variant="secondary"
                            onClick={() => setEditIssue(null)}
                        >
                            Batal
                        </Button>
                        <Button
                            type="submit"
                            form="ids-edit-form"
                            disabled={editForm.processing}
                        >
                            {editForm.processing ? "Menyimpan…" : "Simpan"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                open={deleteId !== null}
                onOpenChange={(open) => !open && setDeleteId(null)}
                title="Hapus Issue"
                description="Issue ini akan dihapus (soft delete)."
                onConfirm={() => deleteId && destroy(deleteId)}
            />
        </AuthenticatedLayout>
    );
}
