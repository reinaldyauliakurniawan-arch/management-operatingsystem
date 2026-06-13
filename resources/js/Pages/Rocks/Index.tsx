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
import { Checkbox } from "@/Components/ui/checkbox";

interface User {
    id: number;
    name: string;
}
interface Milestone {
    id: number;
    title: string;
    due_date: string | null;
    is_done: boolean;
    sort_order: number;
}
interface Rock {
    id: number;
    title: string;
    description: string;
    owner: { id: number; name: string };
    quarter: string;
    year: number;
    due_date: string | null;
    status: "on_track" | "off_track" | "done";
    milestones: Milestone[];
}

const statusBadgeVariant: Record<
    Rock["status"],
    "success" | "error" | "neutral"
> = {
    on_track: "success",
    off_track: "error",
    done: "neutral",
};
const statusLabel: Record<Rock["status"], string> = {
    on_track: "On Track",
    off_track: "Off Track",
    done: "Done",
};

export default function RocksIndex({
    rocks,
    users,
}: {
    rocks: { data: Rock[] };
    users: User[];
}) {
    const { auth } = usePage().props as any;
    const isLeader = auth.teamRole === "leader";
    const [createOpen, setCreateOpen] = useState(false);
    const [detailRock, setDetailRock] = useState<Rock | null>(null);
    const [milestoneTitle, setMilestoneTitle] = useState("");
    const [deleteRockId, setDeleteRockId] = useState<number | null>(null);

    const { data, setData, post, processing, reset, errors } = useForm({
        title: "",
        description: "",
        owner_id: users[0]?.id || "",
        quarter: "Q1",
        year: new Date().getFullYear(),
        due_date: "",
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route("rocks.store"), {
            onSuccess: () => {
                setCreateOpen(false);
                reset();
            },
        });
    };

    const updateStatus = (id: number, status: string) =>
        router.patch(
            route("rocks.updateStatus", id),
            { status },
            { preserveScroll: true },
        );

    const deleteRock = (id: number) => {
        router.delete(route("rocks.destroy", id), {
            preserveScroll: true,
            onSuccess: () => {
                setDetailRock(null);
                setDeleteRockId(null);
            },
        });
    };

    const addMilestone = (rockId: number) => {
        if (!milestoneTitle.trim()) return;
        router.post(
            route("rocks.milestones.store", rockId),
            { title: milestoneTitle },
            {
                preserveScroll: true,
                onSuccess: () => setMilestoneTitle(""),
            },
        );
    };

    const toggleMilestone = (milestoneId: number) =>
        router.patch(
            route("rocks.milestones.toggle", milestoneId),
            {},
            { preserveScroll: true },
        );

    const deleteMilestone = (milestoneId: number) =>
        router.delete(route("rocks.milestones.destroy", milestoneId), {
            preserveScroll: true,
        });

    const rockList = rocks.data;
    const total = rockList.length;
    const onTrack = rockList.filter((r) => r.status === "on_track").length;
    const offTrack = rockList.filter((r) => r.status === "off_track").length;
    const done = rockList.filter((r) => r.status === "done").length;

    return (
        <AuthenticatedLayout>
            <Head title="Rocks" />

            <PageHeader
                title="Rocks"
                subtitle="90-day priorities tim"
                action={
                    isLeader ? (
                        <Button onClick={() => setCreateOpen(true)}>
                            + Tambah Rock
                        </Button>
                    ) : undefined
                }
            />

            {/* Stats */}
            <div className="mb-xl grid grid-cols-4 gap-lg">
                {[
                    {
                        label: "Total",
                        value: total,
                        valueClass: "text-[#1a1a1a]",
                    },
                    {
                        label: "On Track",
                        value: onTrack,
                        valueClass: "text-[#1a5c41]",
                    },
                    {
                        label: "Off Track",
                        value: offTrack,
                        valueClass: "text-[#991b1b]",
                    },
                    {
                        label: "Done",
                        value: done,
                        valueClass: "text-[#6b6b6b]",
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
                            "Rock",
                            "Owner",
                            "Periode",
                            "Due Date",
                            "Status",
                            "",
                        ].map((h) => (
                            <TableHead key={h}>{h}</TableHead>
                        ))}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {rockList.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={6}>
                                <EmptyState
                                    title="Belum ada rock"
                                    description={
                                        isLeader
                                            ? "Tambah rock pertama untuk team ini."
                                            : "Belum ada rock yang ditambahkan untuk team ini."
                                    }
                                />
                            </TableCell>
                        </TableRow>
                    )}
                    {rockList.map((rock) => (
                        <TableRow key={rock.id}>
                            <TableCell>
                                <button
                                    onClick={() => setDetailRock(rock)}
                                    className="cursor-pointer text-left"
                                >
                                    <p className="text-[13px] font-medium text-text-primary">
                                        {rock.title}
                                    </p>
                                    {rock.description && (
                                        <p className="mt-0.5 text-[12px] text-text-muted">
                                            {rock.description.slice(0, 60)}
                                            {rock.description.length > 60
                                                ? "…"
                                                : ""}
                                        </p>
                                    )}
                                </button>
                            </TableCell>
                            <TableCell className="text-text-secondary">
                                {rock.owner.name}
                            </TableCell>
                            <TableCell className="text-text-secondary">
                                {rock.quarter} {rock.year}
                            </TableCell>
                            <TableCell className="text-text-secondary">
                                {rock.due_date ?? "—"}
                            </TableCell>
                            <TableCell>
                                <Badge
                                    variant={statusBadgeVariant[rock.status]}
                                >
                                    {statusLabel[rock.status]}
                                </Badge>
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center justify-end gap-sm">
                                    {isLeader && (
                                        <Select
                                            value={rock.status}
                                            onChange={(e) =>
                                                updateStatus(
                                                    rock.id,
                                                    e.target.value,
                                                )
                                            }
                                            className="h-7 w-auto pr-7 text-xs"
                                        >
                                            <option value="on_track">
                                                On Track
                                            </option>
                                            <option value="off_track">
                                                Off Track
                                            </option>
                                            <option value="done">Done</option>
                                        </Select>
                                    )}
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setDetailRock(rock)}
                                    >
                                        Detail
                                    </Button>
                                    {isLeader && (
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={() =>
                                                setDeleteRockId(rock.id)
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
                        <DialogTitle>Tambah Rock</DialogTitle>
                    </DialogHeader>
                    <DialogBody>
                        <form
                            onSubmit={submit}
                            className="flex flex-col gap-lg"
                        >
                            <div className="flex flex-col gap-xs">
                                <Label htmlFor="rock-title">Judul Rock *</Label>
                                <Input
                                    id="rock-title"
                                    value={data.title}
                                    onChange={(e) =>
                                        setData("title", e.target.value)
                                    }
                                    placeholder="Judul rock..."
                                    aria-invalid={!!errors.title}
                                />
                                {errors.title && (
                                    <p className="text-[12px] text-error-text">
                                        {errors.title}
                                    </p>
                                )}
                            </div>
                            <div className="flex flex-col gap-xs">
                                <Label htmlFor="rock-desc">Deskripsi</Label>
                                <Textarea
                                    id="rock-desc"
                                    value={data.description}
                                    onChange={(e) =>
                                        setData("description", e.target.value)
                                    }
                                    placeholder="Deskripsi opsional..."
                                    rows={3}
                                />
                            </div>
                            <div className="flex flex-col gap-xs">
                                <Label htmlFor="rock-owner">Owner *</Label>
                                <Select
                                    id="rock-owner"
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
                            <div className="grid grid-cols-3 gap-md">
                                <div className="flex flex-col gap-xs">
                                    <Label htmlFor="rock-quarter">
                                        Quarter *
                                    </Label>
                                    <Select
                                        id="rock-quarter"
                                        value={data.quarter}
                                        onChange={(e) =>
                                            setData("quarter", e.target.value)
                                        }
                                    >
                                        {["Q1", "Q2", "Q3", "Q4"].map((q) => (
                                            <option key={q} value={q}>
                                                {q}
                                            </option>
                                        ))}
                                    </Select>
                                </div>
                                <div className="flex flex-col gap-xs">
                                    <Label htmlFor="rock-year">Year *</Label>
                                    <Input
                                        id="rock-year"
                                        type="number"
                                        value={data.year}
                                        onChange={(e) =>
                                            setData(
                                                "year",
                                                parseInt(e.target.value),
                                            )
                                        }
                                    />
                                </div>
                                <div className="flex flex-col gap-xs">
                                    <Label htmlFor="rock-due">Due Date</Label>
                                    <Input
                                        id="rock-due"
                                        type="date"
                                        value={data.due_date}
                                        onChange={(e) =>
                                            setData("due_date", e.target.value)
                                        }
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
                        <Button
                            onClick={submit}
                            disabled={processing || users.length === 0}
                        >
                            {processing ? "Menyimpan…" : "Simpan Rock"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Detail / Milestone Modal */}
            <Dialog
                open={!!detailRock}
                onOpenChange={(open) => !open && setDetailRock(null)}
            >
                <DialogContent size="md">
                    <DialogHeader>
                        <DialogTitle>{detailRock?.title ?? ""}</DialogTitle>
                    </DialogHeader>
                    {detailRock && (
                        <>
                            <DialogBody className="flex flex-col gap-xl">
                                <div className="flex flex-wrap items-center gap-md">
                                    <Badge
                                        variant={
                                            statusBadgeVariant[
                                                detailRock.status
                                            ]
                                        }
                                    >
                                        {statusLabel[detailRock.status]}
                                    </Badge>
                                    <span className="text-[12px] text-text-muted">
                                        {detailRock.owner.name} ·{" "}
                                        {detailRock.quarter} {detailRock.year}
                                    </span>
                                    {detailRock.due_date && (
                                        <span className="text-[12px] text-text-muted">
                                            Due: {detailRock.due_date}
                                        </span>
                                    )}
                                </div>
                                {detailRock.description && (
                                    <p className="text-sm text-text-secondary">
                                        {detailRock.description}
                                    </p>
                                )}

                                {/* Milestones */}
                                <div>
                                    <p className="mb-md text-[12px] font-medium uppercase tracking-wider text-text-muted">
                                        Milestones
                                    </p>
                                    <div className="flex flex-col gap-sm">
                                        {detailRock.milestones.length === 0 && (
                                            <p className="text-[13px] text-text-muted">
                                                Belum ada milestone.
                                            </p>
                                        )}
                                        {detailRock.milestones.map((m) => (
                                            <div
                                                key={m.id}
                                                className="flex items-center gap-md rounded-sm bg-surface-subtle px-md py-sm"
                                            >
                                                <Checkbox
                                                    checked={m.is_done}
                                                    onCheckedChange={() =>
                                                        toggleMilestone(m.id)
                                                    }
                                                />
                                                <span
                                                    className={`flex-1 text-[13px] ${m.is_done ? "text-text-muted line-through" : "text-text-primary"}`}
                                                >
                                                    {m.title}
                                                </span>
                                                {m.due_date && (
                                                    <span className="text-[11px] text-text-muted">
                                                        {m.due_date}
                                                    </span>
                                                )}
                                                {isLeader && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon-xs"
                                                        onClick={() =>
                                                            deleteMilestone(
                                                                m.id,
                                                            )
                                                        }
                                                        className="text-text-muted hover:text-error-text"
                                                    >
                                                        ✕
                                                    </Button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                    {isLeader && (
                                        <div className="mt-md flex gap-sm">
                                            <Input
                                                value={milestoneTitle}
                                                onChange={(e) =>
                                                    setMilestoneTitle(
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder="Tambah milestone..."
                                                onKeyDown={(e) =>
                                                    e.key === "Enter" &&
                                                    addMilestone(detailRock.id)
                                                }
                                                className="flex-1"
                                            />
                                            <Button
                                                onClick={() =>
                                                    addMilestone(detailRock.id)
                                                }
                                            >
                                                Tambah
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </DialogBody>
                            {isLeader && (
                                <DialogFooter>
                                    <Button
                                        variant="destructive"
                                        onClick={() =>
                                            setDeleteRockId(detailRock.id)
                                        }
                                    >
                                        Hapus Rock
                                    </Button>
                                </DialogFooter>
                            )}
                        </>
                    )}
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                open={deleteRockId !== null}
                onOpenChange={(open) => !open && setDeleteRockId(null)}
                title="Hapus Rock"
                description="Rock ini akan dihapus (soft delete). Data historis tetap tersimpan."
                onConfirm={() => deleteRockId && deleteRock(deleteRockId)}
            />
        </AuthenticatedLayout>
    );
}
