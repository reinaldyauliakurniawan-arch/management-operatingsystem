import { useState } from "react";
import { Head, useForm, router } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { PageHeader } from "@/Components/ui/page-header";
import { Button } from "@/Components/ui/button";
import { Badge } from "@/Components/ui/badge";
import { Card, CardContent } from "@/Components/ui/card";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import { Textarea } from "@/Components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogBody,
    DialogFooter,
} from "@/Components/ui/dialog";
import { ConfirmDialog } from "@/Components/ui/confirm-dialog";
import { EmptyState } from "@/Components/ui/empty-state";

interface Rubric {
    id: number;
    level: number;
    description: string;
}
interface Item {
    id: number;
    title: string;
    rubrics: Rubric[];
}
interface LeadershipType {
    id: number;
    name: string;
    items: Item[];
}

export default function RubrikPage({ types }: { types: LeadershipType[] }) {
    // Type CRUD
    const [typeModalOpen, setTypeModalOpen] = useState(false);
    const [editType, setEditType] = useState<LeadershipType | null>(null);
    const [deleteTypeId, setDeleteTypeId] = useState<number | null>(null);
    const typeForm = useForm({ name: "" });

    // Item CRUD
    const [itemModal, setItemModal] = useState<{
        typeId: number;
        item?: Item;
    } | null>(null);
    const [deleteItemId, setDeleteItemId] = useState<number | null>(null);
    const itemForm = useForm({ title: "" });

    // Rubric CRUD
    const [rubricModal, setRubricModal] = useState<{
        itemId: number;
        rubric?: Rubric;
    } | null>(null);
    const rubricForm = useForm({ level: 1, description: "" });

    // ---- Type ----
    const submitType = (e: React.FormEvent) => {
        e.preventDefault();
        if (editType) {
            typeForm.patch(
                route("leadership-assessment.rubrik.types.update", editType.id),
                {
                    onSuccess: () => {
                        setEditType(null);
                        typeForm.reset();
                    },
                },
            );
        } else {
            typeForm.post(route("leadership-assessment.rubrik.types.store"), {
                onSuccess: () => {
                    setTypeModalOpen(false);
                    typeForm.reset();
                },
            });
        }
    };

    const openEditType = (t: LeadershipType) => {
        setEditType(t);
        typeForm.setData("name", t.name);
    };

    // ---- Item ----
    const submitItem = (e: React.FormEvent) => {
        e.preventDefault();
        if (!itemModal) return;
        if (itemModal.item) {
            itemForm.patch(
                route(
                    "leadership-assessment.rubrik.items.update",
                    itemModal.item.id,
                ),
                {
                    onSuccess: () => {
                        setItemModal(null);
                        itemForm.reset();
                    },
                },
            );
        } else {
            itemForm.post(
                route(
                    "leadership-assessment.rubrik.items.store",
                    itemModal.typeId,
                ),
                {
                    onSuccess: () => {
                        setItemModal(null);
                        itemForm.reset();
                    },
                },
            );
        }
    };

    const openItemModal = (typeId: number, item?: Item) => {
        itemForm.setData("title", item?.title ?? "");
        setItemModal({ typeId, item });
    };

    // ---- Rubric ----
    const submitRubric = (e: React.FormEvent) => {
        e.preventDefault();
        if (!rubricModal) return;
        if (rubricModal.rubric) {
            rubricForm.patch(
                route(
                    "leadership-assessment.rubrik.rubrics.update",
                    rubricModal.rubric.id,
                ),
                {
                    onSuccess: () => {
                        setRubricModal(null);
                        rubricForm.reset();
                    },
                },
            );
        } else {
            rubricForm.post(
                route(
                    "leadership-assessment.rubrik.rubrics.store",
                    rubricModal.itemId,
                ),
                {
                    onSuccess: () => {
                        setRubricModal(null);
                        rubricForm.reset();
                    },
                },
            );
        }
    };

    const openRubricModal = (itemId: number, rubric?: Rubric) => {
        rubricForm.setData({
            level: rubric?.level ?? 1,
            description: rubric?.description ?? "",
        });
        setRubricModal({ itemId, rubric });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Rubrik Penilaian Leadership" />
            <PageHeader
                title="Rubrik Penilaian Leadership"
                subtitle="Kelola tipe kepemimpinan, kompetensi, dan deskripsi level 1–5"
                action={
                    <Button
                        onClick={() => {
                            typeForm.reset();
                            setTypeModalOpen(true);
                        }}
                    >
                        + Tambah Tipe
                    </Button>
                }
            />

            {types.length === 0 ? (
                <Card>
                    <CardContent className="py-16">
                        <EmptyState
                            title="Belum ada tipe leadership"
                            description="Tambah tipe kepemimpinan pertama untuk mulai membangun rubrik."
                        />
                    </CardContent>
                </Card>
            ) : (
                <div className="flex flex-col gap-xl">
                    {types.map((type) => (
                        <Card key={type.id}>
                            <CardContent>
                                <div className="mb-lg flex items-center justify-between">
                                    <h2 className="text-[var(--font-base)] font-semibold text-text-primary">
                                        {type.name}
                                    </h2>
                                    <div className="flex gap-sm">
                                        <Button
                                            size="sm"
                                            variant="secondary"
                                            onClick={() =>
                                                openItemModal(type.id)
                                            }
                                        >
                                            + Item
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => openEditType(type)}
                                        >
                                            Edit
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="danger"
                                            onClick={() =>
                                                setDeleteTypeId(type.id)
                                            }
                                        >
                                            Hapus
                                        </Button>
                                    </div>
                                </div>

                                {type.items.length === 0 ? (
                                    <p className="text-[var(--font-base)] text-text-muted">
                                        Belum ada item kompetensi.
                                    </p>
                                ) : (
                                    <div className="flex flex-col gap-lg">
                                        {type.items.map((item) => (
                                            <div
                                                key={item.id}
                                                className="rounded-lg border border-border p-md"
                                            >
                                                <div className="mb-md flex items-start justify-between">
                                                    <p className="text-[var(--font-base)] font-medium text-text-primary">
                                                        {item.title}
                                                    </p>
                                                    <div className="flex gap-xs">
                                                        <Button
                                                            size="sm"
                                                            variant="secondary"
                                                            onClick={() =>
                                                                openRubricModal(
                                                                    item.id,
                                                                )
                                                            }
                                                        >
                                                            + Level
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() =>
                                                                openItemModal(
                                                                    type.id,
                                                                    item,
                                                                )
                                                            }
                                                        >
                                                            Edit
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="danger"
                                                            onClick={() =>
                                                                setDeleteItemId(
                                                                    item.id,
                                                                )
                                                            }
                                                        >
                                                            Hapus
                                                        </Button>
                                                    </div>
                                                </div>
                                                {item.rubrics.length === 0 ? (
                                                    <p className="text-[var(--font-sm)] text-text-muted">
                                                        Belum ada deskripsi
                                                        level.
                                                    </p>
                                                ) : (
                                                    <div className="flex flex-col gap-sm">
                                                        {item.rubrics.map(
                                                            (r) => (
                                                                <div
                                                                    key={r.id}
                                                                    className="flex items-start gap-md rounded-sm bg-surface-subtle px-md py-sm"
                                                                >
                                                                    <Badge
                                                                        variant="neutral"
                                                                        className="shrink-0"
                                                                    >
                                                                        L
                                                                        {
                                                                            r.level
                                                                        }
                                                                    </Badge>
                                                                    <p className="flex-1 text-[var(--font-base)] text-text-secondary">
                                                                        {
                                                                            r.description
                                                                        }
                                                                    </p>
                                                                    <div className="flex gap-xs">
                                                                        <button
                                                                            className="text-[var(--font-sm)] text-text-muted hover:text-text-primary"
                                                                            onClick={() =>
                                                                                openRubricModal(
                                                                                    item.id,
                                                                                    r,
                                                                                )
                                                                            }
                                                                        >
                                                                            Edit
                                                                        </button>
                                                                        <button
                                                                            className="text-[var(--font-sm)] text-text-muted hover:text-error-text"
                                                                            onClick={() =>
                                                                                router.delete(
                                                                                    route(
                                                                                        "leadership-assessment.rubrik.rubrics.destroy",
                                                                                        r.id,
                                                                                    ),
                                                                                    {
                                                                                        preserveScroll: true,
                                                                                    },
                                                                                )
                                                                            }
                                                                        >
                                                                            Hapus
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            ),
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Type Modal */}
            <Dialog
                open={typeModalOpen || !!editType}
                onOpenChange={(o) => {
                    if (!o) {
                        setTypeModalOpen(false);
                        setEditType(null);
                        typeForm.reset();
                    }
                }}
            >
                <DialogContent size="sm">
                    <DialogHeader>
                        <DialogTitle>
                            {editType ? "Edit Tipe" : "Tambah Tipe Leadership"}
                        </DialogTitle>
                    </DialogHeader>
                    <DialogBody>
                        <form
                            id="type-form"
                            onSubmit={submitType}
                            className="flex flex-col gap-md"
                        >
                            <div className="flex flex-col gap-xs">
                                <Label>Nama Tipe *</Label>
                                <Input
                                    value={typeForm.data.name}
                                    onChange={(e) =>
                                        typeForm.setData("name", e.target.value)
                                    }
                                    placeholder="Misal: Leading Self"
                                    required
                                />
                            </div>
                        </form>
                    </DialogBody>
                    <DialogFooter>
                        <Button
                            variant="secondary"
                            onClick={() => {
                                setTypeModalOpen(false);
                                setEditType(null);
                                typeForm.reset();
                            }}
                        >
                            Batal
                        </Button>
                        <Button
                            type="submit"
                            form="type-form"
                            disabled={typeForm.processing}
                        >
                            {typeForm.processing ? "Menyimpan…" : "Simpan"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Item Modal */}
            <Dialog
                open={!!itemModal}
                onOpenChange={(o) => {
                    if (!o) {
                        setItemModal(null);
                        itemForm.reset();
                    }
                }}
            >
                <DialogContent size="sm">
                    <DialogHeader>
                        <DialogTitle>
                            {itemModal?.item
                                ? "Edit Item"
                                : "Tambah Item Kompetensi"}
                        </DialogTitle>
                    </DialogHeader>
                    <DialogBody>
                        <form
                            id="item-form"
                            onSubmit={submitItem}
                            className="flex flex-col gap-md"
                        >
                            <div className="flex flex-col gap-xs">
                                <Label>Nama Kompetensi *</Label>
                                <Input
                                    value={itemForm.data.title}
                                    onChange={(e) =>
                                        itemForm.setData(
                                            "title",
                                            e.target.value,
                                        )
                                    }
                                    placeholder="Misal: Mampu mengatur emosi diri"
                                    required
                                />
                            </div>
                        </form>
                    </DialogBody>
                    <DialogFooter>
                        <Button
                            variant="secondary"
                            onClick={() => {
                                setItemModal(null);
                                itemForm.reset();
                            }}
                        >
                            Batal
                        </Button>
                        <Button
                            type="submit"
                            form="item-form"
                            disabled={itemForm.processing}
                        >
                            {itemForm.processing ? "Menyimpan…" : "Simpan"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Rubric Modal */}
            <Dialog
                open={!!rubricModal}
                onOpenChange={(o) => {
                    if (!o) {
                        setRubricModal(null);
                        rubricForm.reset();
                    }
                }}
            >
                <DialogContent size="sm">
                    <DialogHeader>
                        <DialogTitle>
                            {rubricModal?.rubric
                                ? "Edit Level Rubrik"
                                : "Tambah Level Rubrik"}
                        </DialogTitle>
                    </DialogHeader>
                    <DialogBody>
                        <form
                            id="rubric-form"
                            onSubmit={submitRubric}
                            className="flex flex-col gap-md"
                        >
                            <div className="flex flex-col gap-xs">
                                <Label>Level (1–5) *</Label>
                                <Input
                                    type="number"
                                    min={1}
                                    max={5}
                                    value={rubricForm.data.level}
                                    onChange={(e) =>
                                        rubricForm.setData(
                                            "level",
                                            parseInt(e.target.value),
                                        )
                                    }
                                    required
                                />
                            </div>
                            <div className="flex flex-col gap-xs">
                                <Label>Deskripsi Level *</Label>
                                <Textarea
                                    rows={4}
                                    value={rubricForm.data.description}
                                    onChange={(e) =>
                                        rubricForm.setData(
                                            "description",
                                            e.target.value,
                                        )
                                    }
                                    placeholder="Deskripsikan perilaku yang terlihat pada level ini..."
                                    required
                                />
                            </div>
                        </form>
                    </DialogBody>
                    <DialogFooter>
                        <Button
                            variant="secondary"
                            onClick={() => {
                                setRubricModal(null);
                                rubricForm.reset();
                            }}
                        >
                            Batal
                        </Button>
                        <Button
                            type="submit"
                            form="rubric-form"
                            disabled={rubricForm.processing}
                        >
                            {rubricForm.processing ? "Menyimpan…" : "Simpan"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Confirms */}
            <ConfirmDialog
                open={!!deleteTypeId}
                onOpenChange={(o) => !o && setDeleteTypeId(null)}
                title="Hapus Tipe Leadership"
                description="Semua item dan rubrik di tipe ini akan ikut terhapus."
                onConfirm={() =>
                    deleteTypeId &&
                    router.delete(
                        route(
                            "leadership-assessment.rubrik.types.destroy",
                            deleteTypeId,
                        ),
                        {
                            preserveScroll: true,
                            onSuccess: () => setDeleteTypeId(null),
                        },
                    )
                }
            />
            <ConfirmDialog
                open={!!deleteItemId}
                onOpenChange={(o) => !o && setDeleteItemId(null)}
                title="Hapus Item Kompetensi"
                description="Semua rubrik level di item ini akan ikut terhapus."
                onConfirm={() =>
                    deleteItemId &&
                    router.delete(
                        route(
                            "leadership-assessment.rubrik.items.destroy",
                            deleteItemId,
                        ),
                        {
                            preserveScroll: true,
                            onSuccess: () => setDeleteItemId(null),
                        },
                    )
                }
            />
        </AuthenticatedLayout>
    );
}
