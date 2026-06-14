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
    priority: number;
    status: "open" | "resolved";
    owner: { id: number; name: string } | null;
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
    const [deleteId, setDeleteId] = useState<number | null>(null);

    const { data, setData, post, processing, reset, errors } = useForm({
        title: "",
        description: "",
        priority: 5,
        owner_id: "",
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route("ids.store"), {
            onSuccess: () => {
                setCreateOpen(false);
                reset();
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
            <div className="mb-xl grid max-w-md grid-cols-2 gap-lg">
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
                        {[
                            { key: "priority", label: "P" },
                            { key: "issue", label: "Issue" },
                            { key: "owner", label: "Owner" },
                            { key: "status", label: "Status" },
                            { key: "actions", label: "" },
                        ].map((h) => (
                            <TableHead key={h.key}>{h.label}</TableHead>
                        ))}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {issueList.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={5}>
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
                                issue.status === "resolved" ? "opacity-50" : ""
                            }
                        >
                            <TableCell className="w-12">
                                <span
                                    className={`text-[13px] font-semibold ${priorityClass(issue.priority)}`}
                                >
                                    {issue.priority}
                                </span>
                            </TableCell>
                            <TableCell>
                                <p className="text-[13px] font-medium text-text-primary">
                                    {issue.title}
                                </p>
                                {issue.description && (
                                    <p className="mt-0.5 text-[12px] text-text-muted">
                                        {issue.description.slice(0, 80)}
                                        {issue.description.length > 80
                                            ? "…"
                                            : ""}
                                    </p>
                                )}
                            </TableCell>
                            <TableCell className="text-text-secondary">
                                {issue.owner?.name ?? "—"}
                            </TableCell>
                            <TableCell>
                                {issue.status === "open" ? (
                                    <Badge variant="error">Open</Badge>
                                ) : (
                                    <Badge variant="success">Resolved</Badge>
                                )}
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center justify-end gap-sm">
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

            {/* Create Modal */}
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogContent size="md">
                    <DialogHeader>
                        <DialogTitle>Identify Issue</DialogTitle>
                    </DialogHeader>
                    <DialogBody>
                        <form
                            id="ids-form"
                            onSubmit={submit}
                            className="flex flex-col gap-lg"
                        >
                            <div className="flex flex-col gap-xs">
                                <Label htmlFor="issue-title">Issue *</Label>
                                <Input
                                    id="issue-title"
                                    value={data.title}
                                    onChange={(e) =>
                                        setData("title", e.target.value)
                                    }
                                    placeholder="Apa masalahnya?"
                                    aria-invalid={!!errors.title}
                                    required
                                />
                                {errors.title && (
                                    <p className="text-[12px] text-error-text">
                                        {errors.title}
                                    </p>
                                )}
                            </div>
                            <div className="flex flex-col gap-xs">
                                <Label htmlFor="issue-desc">Deskripsi</Label>
                                <Textarea
                                    id="issue-desc"
                                    value={data.description}
                                    onChange={(e) =>
                                        setData("description", e.target.value)
                                    }
                                    placeholder="Detail masalah..."
                                    rows={3}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-md">
                                <div className="flex flex-col gap-xs">
                                    <Label htmlFor="issue-priority">
                                        Priority (0–10)
                                    </Label>
                                    <Input
                                        id="issue-priority"
                                        type="number"
                                        min={0}
                                        max={10}
                                        value={data.priority}
                                        onChange={(e) =>
                                            setData(
                                                "priority",
                                                parseInt(e.target.value),
                                            )
                                        }
                                    />
                                </div>
                                <div className="flex flex-col gap-xs">
                                    <Label htmlFor="issue-owner">Owner</Label>
                                    <Select
                                        id="issue-owner"
                                        value={data.owner_id}
                                        onChange={(e) =>
                                            setData("owner_id", e.target.value)
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
                            form="ids-form"
                            disabled={processing}
                        >
                            {processing ? "Menyimpan…" : "Identify"}
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
