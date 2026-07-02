import { useState, useEffect } from "react";
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
    quarterTarget,
    filters,
}: {
    rocks: { data: Rock[] };
    users: User[];
    quarterTarget: {
        quarter_date: string | null;
        quarter_revenue: string | null;
        quarter_profit: string | null;
        quarter_measurables: string | null;
    } | null;
    filters: { quarter: number; year: number };
}) {
    const { auth } = usePage().props as any;
    const isLeader = auth.teamRole === "leader";
    const [createOpen, setCreateOpen] = useState(false);
    const [detailRock, setDetailRock] = useState<Rock | null>(null);
    const [milestoneTitle, setMilestoneTitle] = useState("");
    const [deleteRockId, setDeleteRockId] = useState<number | null>(null);

    useEffect(() => {
        if (detailRock) {
            const updated = rocks.data.find((r) => r.id === detailRock.id);
            if (updated) setDetailRock(updated);
        }
    }, [rocks]);

    const { data, setData, post, processing, reset, errors } = useForm({
        title: "",
        description: "",
        owner_id: users[0]?.id || "",
        quarter: "Q1",
        year: new Date().getFullYear(),
        due_date: "",
    });

    const [editOpen, setEditOpen] = useState(false);
    const {
        data: editData,
        setData: setEditData,
        patch,
        processing: editProcessing,
        errors: editErrors,
    } = useForm({
        title: "",
        description: "",
        owner_id: "" as number | string,
        quarter: "Q1",
        year: new Date().getFullYear(),
        due_date: "",
    });

    const openEdit = (rock: Rock) => {
        setEditData({
            title: rock.title,
            description: rock.description ?? "",
            owner_id: rock.owner.id,
            quarter: rock.quarter,
            year: rock.year,
            due_date: rock.due_date ?? "",
        });
        setEditOpen(true);
    };

    const submitEdit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!detailRock) return;
        patch(route("rocks.update", detailRock.id), {
            preserveScroll: true,
            onSuccess: () => setEditOpen(false),
        });
    };

    const [qtOpen, setQtOpen] = useState(false);
    const { data: qtData, setData: setQtData } = useForm({
        quarter_date: quarterTarget?.quarter_date ?? "",
        quarter_revenue: quarterTarget?.quarter_revenue ?? "",
        quarter_profit: quarterTarget?.quarter_profit ?? "",
        quarter_measurables: quarterTarget?.quarter_measurables ?? "",
    });

    const submitQuarterTarget = (e: React.FormEvent) => {
        e.preventDefault();
        router.post(route("vto.update"), qtData, {
            preserveScroll: true,
            onSuccess: () => setQtOpen(false),
        });
    };

    const goToPeriod = (quarter: number, year: number) => {
        router.get(
            route("rocks.index"),
            { quarter, year },
            { preserveState: true },
        );
    };

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
                    <div className="flex items-center gap-sm">
                        <Select
                            value={String(filters.year)}
                            onChange={(e) =>
                                goToPeriod(
                                    filters.quarter,
                                    parseInt(e.target.value),
                                )
                            }
                            className="h-9 w-auto"
                        >
                            {[
                                filters.year - 1,
                                filters.year,
                                filters.year + 1,
                            ].map((y) => (
                                <option key={y} value={y}>
                                    {y}
                                </option>
                            ))}
                        </Select>
                        <Select
                            value={String(filters.quarter)}
                            onChange={(e) =>
                                goToPeriod(
                                    parseInt(e.target.value),
                                    filters.year,
                                )
                            }
                            className="h-9 w-auto"
                        >
                            <option value={1}>Q1</option>
                            <option value={2}>Q2</option>
                            <option value={3}>Q3</option>
                            <option value={4}>Q4</option>
                        </Select>
                        {isLeader && (
                            <Button onClick={() => setCreateOpen(true)}>
                                + Tambah Rock
                            </Button>
                        )}
                    </div>
                }
            />

            {/* Quarter Target */}
            <Card className="mb-6">
                <CardContent>
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-xs font-medium uppercase tracking-wider text-text-muted">
                            Target Quarter Ini
                        </p>
                        {isLeader && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setQtOpen(true)}
                            >
                                Edit
                            </Button>
                        )}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-[13px]">
                        <div>
                            <p className="text-text-muted mb-1">Future Date</p>
                            <p className="text-text-primary font-medium">
                                {quarterTarget?.quarter_date ?? "—"}
                            </p>
                        </div>
                        <div>
                            <p className="text-text-muted mb-1">Revenue</p>
                            <p className="text-text-primary font-medium">
                                {quarterTarget?.quarter_revenue ?? "—"}
                            </p>
                        </div>
                        <div>
                            <p className="text-text-muted mb-1">Profit</p>
                            <p className="text-text-primary font-medium">
                                {quarterTarget?.quarter_profit ?? "—"}
                            </p>
                        </div>
                        <div>
                            <p className="text-text-muted mb-1">Measurables</p>
                            <p className="text-text-primary font-medium">
                                {quarterTarget?.quarter_measurables ?? "—"}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Stats */}
            <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                    {
                        label: "Total",
                        value: total,
                        valueClass: "text-text-primary",
                    },
                    {
                        label: "On Track",
                        value: onTrack,
                        valueClass: "text-primary",
                    },
                    {
                        label: "Off Track",
                        value: offTrack,
                        valueClass:
                            offTrack > 0
                                ? "text-error-text"
                                : "text-text-primary",
                    },
                    {
                        label: "Done",
                        value: done,
                        valueClass: "text-text-secondary",
                    },
                ].map((stat) => (
                    <Card key={stat.label}>
                        <CardContent>
                            <p className="mb-1.5 text-xs font-medium uppercase tracking-wider text-text-muted">
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
                                            <p className="mt-0.5 text-[13px] text-text-muted">
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
                                        variant={
                                            statusBadgeVariant[rock.status]
                                        }
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
                                                <option value="done">
                                                    Done
                                                </option>
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
                                                variant="danger"
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
            </div>

            {/* Create Modal */}
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogContent size="md">
                    <DialogHeader>
                        <DialogTitle>Tambah Rock</DialogTitle>
                    </DialogHeader>
                    <DialogBody>
                        <form
                            id="rock-form"
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
                                    <p className="text-[var(--font-base)] text-error-text">
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
                            type="submit"
                            form="rock-form"
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
                                    <span className="text-[var(--font-base)] text-text-muted">
                                        {detailRock.owner.name} ·{" "}
                                        {detailRock.quarter} {detailRock.year}
                                    </span>
                                    {detailRock.due_date && (
                                        <span className="text-[var(--font-base)] text-text-muted">
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
                                    <p className="mb-md text-[length:var(--font-md)] font-semibold text-primary">
                                        Milestones
                                    </p>
                                    <div className="flex flex-col gap-sm">
                                        {detailRock.milestones.length === 0 && (
                                            <p className="text-[var(--font-base)] text-text-muted">
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
                                                    disabled={
                                                        !isLeader &&
                                                        detailRock.owner.id !==
                                                            auth.user.id
                                                    }
                                                    onCheckedChange={() =>
                                                        toggleMilestone(m.id)
                                                    }
                                                />
                                                <span
                                                    className={`flex-1 text-[var(--font-base)] ${m.is_done ? "text-text-muted line-through" : "text-text-primary"}`}
                                                >
                                                    {m.title}
                                                </span>
                                                {m.due_date && (
                                                    <span className="text-[var(--font-sm)] text-text-muted">
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
                                    {(isLeader ||
                                        detailRock.owner.id ===
                                            auth.user.id) && (
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
                            {(isLeader ||
                                detailRock.owner.id === auth.user.id) && (
                                <DialogFooter>
                                    <Button
                                        variant="secondary"
                                        onClick={() => openEdit(detailRock)}
                                    >
                                        Edit Rock
                                    </Button>
                                    {isLeader && (
                                        <Button
                                            variant="danger"
                                            onClick={() =>
                                                setDeleteRockId(detailRock.id)
                                            }
                                        >
                                            Hapus Rock
                                        </Button>
                                    )}
                                </DialogFooter>
                            )}
                        </>
                    )}
                </DialogContent>
            </Dialog>

            {/* Edit Rock Modal */}
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogContent size="md">
                    <DialogHeader>
                        <DialogTitle>Edit Rock</DialogTitle>
                    </DialogHeader>
                    <DialogBody>
                        <form
                            id="rock-edit-form"
                            onSubmit={submitEdit}
                            className="flex flex-col gap-lg"
                        >
                            <div className="flex flex-col gap-xs">
                                <Label htmlFor="edit-title">Judul Rock *</Label>
                                <Input
                                    id="edit-title"
                                    value={editData.title}
                                    onChange={(e) =>
                                        setEditData("title", e.target.value)
                                    }
                                    aria-invalid={!!editErrors.title}
                                />
                                {editErrors.title && (
                                    <p className="text-[var(--font-base)] text-error-text">
                                        {editErrors.title}
                                    </p>
                                )}
                            </div>
                            <div className="flex flex-col gap-xs">
                                <Label htmlFor="edit-desc">Deskripsi</Label>
                                <Textarea
                                    id="edit-desc"
                                    value={editData.description}
                                    onChange={(e) =>
                                        setEditData(
                                            "description",
                                            e.target.value,
                                        )
                                    }
                                    rows={3}
                                />
                            </div>
                            <div className="flex flex-col gap-xs">
                                <Label htmlFor="edit-owner">Owner *</Label>
                                <Select
                                    id="edit-owner"
                                    value={editData.owner_id}
                                    onChange={(e) =>
                                        setEditData("owner_id", e.target.value)
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
                                    <Label htmlFor="edit-quarter">
                                        Quarter *
                                    </Label>
                                    <Select
                                        id="edit-quarter"
                                        value={editData.quarter}
                                        onChange={(e) =>
                                            setEditData(
                                                "quarter",
                                                e.target.value,
                                            )
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
                                    <Label htmlFor="edit-year">Year *</Label>
                                    <Input
                                        id="edit-year"
                                        type="number"
                                        value={editData.year}
                                        onChange={(e) =>
                                            setEditData(
                                                "year",
                                                parseInt(e.target.value),
                                            )
                                        }
                                    />
                                </div>
                                <div className="flex flex-col gap-xs">
                                    <Label htmlFor="edit-due">Due Date</Label>
                                    <Input
                                        id="edit-due"
                                        type="date"
                                        value={editData.due_date}
                                        onChange={(e) =>
                                            setEditData(
                                                "due_date",
                                                e.target.value,
                                            )
                                        }
                                    />
                                </div>
                            </div>
                        </form>
                    </DialogBody>
                    <DialogFooter>
                        <Button
                            variant="secondary"
                            onClick={() => setEditOpen(false)}
                        >
                            Batal
                        </Button>
                        <Button
                            type="submit"
                            form="rock-edit-form"
                            disabled={editProcessing}
                        >
                            {editProcessing ? "Menyimpan…" : "Simpan"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Quarter Target Modal */}
            <Dialog open={qtOpen} onOpenChange={setQtOpen}>
                <DialogContent size="md">
                    <DialogHeader>
                        <DialogTitle>Edit Target Quarter</DialogTitle>
                    </DialogHeader>
                    <DialogBody>
                        <form
                            id="qt-form"
                            onSubmit={submitQuarterTarget}
                            className="flex flex-col gap-lg"
                        >
                            <div className="flex flex-col gap-xs">
                                <Label htmlFor="qt-date">Future Date</Label>
                                <Input
                                    id="qt-date"
                                    type="date"
                                    value={qtData.quarter_date}
                                    onChange={(e) =>
                                        setQtData(
                                            "quarter_date",
                                            e.target.value,
                                        )
                                    }
                                />
                            </div>
                            <div className="flex flex-col gap-xs">
                                <Label htmlFor="qt-revenue">Revenue</Label>
                                <Input
                                    id="qt-revenue"
                                    value={qtData.quarter_revenue}
                                    onChange={(e) =>
                                        setQtData(
                                            "quarter_revenue",
                                            e.target.value,
                                        )
                                    }
                                />
                            </div>
                            <div className="flex flex-col gap-xs">
                                <Label htmlFor="qt-profit">Profit</Label>
                                <Input
                                    id="qt-profit"
                                    value={qtData.quarter_profit}
                                    onChange={(e) =>
                                        setQtData(
                                            "quarter_profit",
                                            e.target.value,
                                        )
                                    }
                                />
                            </div>
                            <div className="flex flex-col gap-xs">
                                <Label htmlFor="qt-measurables">
                                    Measurables
                                </Label>
                                <Textarea
                                    id="qt-measurables"
                                    value={qtData.quarter_measurables}
                                    onChange={(e) =>
                                        setQtData(
                                            "quarter_measurables",
                                            e.target.value,
                                        )
                                    }
                                    rows={3}
                                />
                            </div>
                        </form>
                    </DialogBody>
                    <DialogFooter>
                        <Button
                            variant="secondary"
                            onClick={() => setQtOpen(false)}
                        >
                            Batal
                        </Button>
                        <Button type="submit" form="qt-form">
                            Simpan
                        </Button>
                    </DialogFooter>
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
