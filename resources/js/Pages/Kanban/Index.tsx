import { useState, useEffect } from "react";
import { Head, router, useForm } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { PageHeader } from "@/Components/ui/page-header";
import { Button } from "@/Components/ui/button";
import { Card, CardContent } from "@/Components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogBody,
    DialogFooter,
} from "@/Components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
} from "@/Components/ui/dropdown-menu";
import { Input } from "@/Components/ui/input";
import { Textarea } from "@/Components/ui/textarea";
import { Label } from "@/Components/ui/label";
import { EmptyState } from "@/Components/ui/empty-state";
import { ConfirmDialog } from "@/Components/ui/confirm-dialog";
import { Checkbox } from "@/Components/ui/checkbox";
import { Plus, ChevronDown, Trash2, X } from "lucide-react";

interface Step {
    id: number;
    title: string;
    is_done: boolean;
}
interface KanbanCard {
    id: number;
    title: string;
    description: string | null;
    responsible: string | null;
    accountable: string | null;
    consulted: string | null;
    informed: string | null;
    definition_of_done: string | null;
    outcome: string | null;
    due_date: string | null;
    sort_order: number;
    steps: Step[];
}
interface Column {
    id: number;
    title: string;
    sort_order: number;
    cards: KanbanCard[];
}
interface Board {
    id: number;
    title: string;
    columns: Column[];
}

export default function KanbanIndex({
    boards,
    activeBoard,
}: {
    boards: { id: number; title: string }[];
    activeBoard: Board | null;
}) {
    const [newBoardOpen, setNewBoardOpen] = useState(false);
    const [newColumnOpen, setNewColumnOpen] = useState(false);
    const [newCardColumnId, setNewCardColumnId] = useState<number | null>(null);
    const [detailCard, setDetailCard] = useState<KanbanCard | null>(null);
    const [newStepTitle, setNewStepTitle] = useState("");
    const [deleteCardId, setDeleteCardId] = useState<number | null>(null);
    const [deleteBoardId, setDeleteBoardId] = useState<number | null>(null);
    const [draggedCardId, setDraggedCardId] = useState<number | null>(null);

    useEffect(() => {
        if (detailCard && activeBoard) {
            const updated = activeBoard.columns
                .flatMap((c) => c.cards)
                .find((c) => c.id === detailCard.id);
            if (updated) setDetailCard(updated);
        }
    }, [activeBoard]);

    const { data: boardData, setData: setBoardData, post: postBoard, reset: resetBoard } = useForm({ title: "" });
    const { data: colData, setData: setColData, post: postColumn, reset: resetColumn } = useForm({ title: "" });
    const { data: cardData, setData: setCardData, post: postCard, reset: resetCard } = useForm({ title: "" });

    const submitNewBoard = (e: React.FormEvent) => {
        e.preventDefault();
        postBoard(route("kanban.boards.store"), {
            preserveScroll: true,
            onSuccess: () => {
                setNewBoardOpen(false);
                resetBoard();
            },
        });
    };

    const submitNewColumn = (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeBoard) return;
        postColumn(route("kanban.columns.store", activeBoard.id), {
            preserveScroll: true,
            onSuccess: () => {
                setNewColumnOpen(false);
                resetColumn();
            },
        });
    };

    const submitNewCard = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCardColumnId) return;
        postCard(route("kanban.cards.store", newCardColumnId), {
            preserveScroll: true,
            onSuccess: () => {
                setNewCardColumnId(null);
                resetCard();
            },
        });
    };

    const switchBoard = (id: number) => {
        router.get(route("kanban.index"), { board: id }, { preserveState: true });
    };

    const deleteColumn = (id: number) => {
        router.delete(route("kanban.columns.destroy", id), { preserveScroll: true });
    };

    // ponytail: native HTML5 drag-drop — zero dependency, works on any host
    const onDrop = (columnId: number, dropIndex: number) => {
        if (draggedCardId === null) return;
        router.patch(
            route("kanban.cards.move", draggedCardId),
            { column_id: columnId, sort_order: dropIndex },
            { preserveScroll: true, preserveState: true },
        );
        setDraggedCardId(null);
    };

    const {
        data: editData,
        setData: setEditData,
        patch: patchCard,
    } = useForm({
        title: "",
        description: "",
        responsible: "",
        accountable: "",
        consulted: "",
        informed: "",
        definition_of_done: "",
        outcome: "",
        due_date: "",
    });

    const openDetail = (card: KanbanCard) => {
        setEditData({
            title: card.title,
            description: card.description ?? "",
            responsible: card.responsible ?? "",
            accountable: card.accountable ?? "",
            consulted: card.consulted ?? "",
            informed: card.informed ?? "",
            definition_of_done: card.definition_of_done ?? "",
            outcome: card.outcome ?? "",
            due_date: card.due_date ?? "",
        });
        setDetailCard(card);
    };

    const saveDetail = () => {
        if (!detailCard) return;
        patchCard(route("kanban.cards.update", detailCard.id), { preserveScroll: true });
    };

    const addStep = () => {
        if (!detailCard || !newStepTitle.trim()) return;
        router.post(
            route("kanban.steps.store", detailCard.id),
            { title: newStepTitle },
            { preserveScroll: true, onSuccess: () => setNewStepTitle("") },
        );
    };

    const toggleStep = (stepId: number) => {
        router.patch(route("kanban.steps.toggle", stepId), {}, { preserveScroll: true, preserveState: true });
    };

    const deleteStep = (stepId: number) => {
        router.delete(route("kanban.steps.destroy", stepId), { preserveScroll: true });
    };

    const confirmDeleteCard = () => {
        if (!deleteCardId) return;
        router.delete(route("kanban.cards.destroy", deleteCardId), {
            preserveScroll: true,
            onSuccess: () => {
                setDeleteCardId(null);
                setDetailCard(null);
            },
        });
    };

    const confirmDeleteBoard = () => {
        if (!deleteBoardId) return;
        router.delete(route("kanban.boards.destroy", deleteBoardId), {
            preserveScroll: true,
            onSuccess: () => setDeleteBoardId(null),
        });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Kanban" />
            <PageHeader
                title="Kanban"
                action={
                    <div className="flex items-center gap-2">
                        <DropdownMenu>
                            <DropdownMenuTrigger
                                render={
                                    <Button variant="secondary">
                                        {activeBoard?.title ?? "Pilih Board"}
                                        <ChevronDown className="h-4 w-4 ml-1" />
                                    </Button>
                                }
                            />
                            <DropdownMenuContent>
                                {boards.map((b) => (
                                    <DropdownMenuItem
                                        key={b.id}
                                        onClick={() => switchBoard(b.id)}
                                        className="flex items-center justify-between gap-4"
                                    >
                                        {b.title}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setDeleteBoardId(b.id);
                                            }}
                                            className="text-text-secondary hover:text-red-600"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <Button onClick={() => setNewBoardOpen(true)}>
                            <Plus className="h-4 w-4 mr-1" /> New Board
                        </Button>
                        {activeBoard && (
                            <Button variant="secondary" onClick={() => setNewColumnOpen(true)}>
                                <Plus className="h-4 w-4 mr-1" /> Column
                            </Button>
                        )}
                    </div>
                }
            />

            <ConfirmDialog
                open={deleteBoardId !== null}
                onOpenChange={(open) => !open && setDeleteBoardId(null)}
                title="Hapus Board?"
                description="Semua kolom dan card di board ini akan dihapus permanen."
                onConfirm={confirmDeleteBoard}
            />

            {!activeBoard ? (
                <EmptyState
                    title="Belum ada board"
                    description="Buat board pertama untuk mulai tracking."
                />
            ) : (
                <div className="flex gap-4 overflow-x-auto pb-4">
                    {activeBoard.columns.map((column) => (
                        <div
                            key={column.id}
                            className="w-72 shrink-0 bg-gray-50 rounded-lg p-3"
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={() => onDrop(column.id, column.cards.length)}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <span className="font-medium text-sm">{column.title}</span>
                                <button onClick={() => deleteColumn(column.id)} className="text-text-secondary hover:text-red-600">
                                    <Trash2 className="h-3.5 w-3.5" />
                                </button>
                            </div>

                            <div className="space-y-2">
                                {column.cards.map((card, idx) => (
                                    <div
                                        key={card.id}
                                        draggable
                                        onDragStart={() => setDraggedCardId(card.id)}
                                        onDragOver={(e) => e.preventDefault()}
                                        onDrop={(e) => {
                                            e.stopPropagation();
                                            onDrop(column.id, idx);
                                        }}
                                    >
                                        <Card
                                            className="cursor-pointer hover:shadow-md transition-shadow"
                                            onClick={() => openDetail(card)}
                                        >
                                            <CardContent className="p-3">
                                                <p className="text-sm font-medium">{card.title}</p>
                                                {card.responsible && (
                                                    <p className="text-xs text-text-secondary mt-1">R: {card.responsible}</p>
                                                )}
                                                {card.steps.length > 0 && (
                                                    <p className="text-xs text-text-secondary mt-1">
                                                        ☑ {card.steps.filter((s) => s.is_done).length}/{card.steps.length} steps
                                                    </p>
                                                )}
                                                {card.due_date && (
                                                    <p className="text-xs text-text-secondary mt-1">🗓 {card.due_date}</p>
                                                )}
                                            </CardContent>
                                        </Card>
                                    </div>
                                ))}
                            </div>

                            <button
                                className="text-xs text-text-secondary hover:text-text-primary mt-2 flex items-center gap-1"
                                onClick={() => setNewCardColumnId(column.id)}
                            >
                                <Plus className="h-3 w-3" /> Add card
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* New Board */}
            <Dialog open={newBoardOpen} onOpenChange={setNewBoardOpen}>
                <DialogContent size="sm">
                    <DialogHeader>
                        <DialogTitle>Board Baru</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={submitNewBoard}>
                        <DialogBody>
                            <Label htmlFor="board-title">Nama Board</Label>
                            <Input
                                id="board-title"
                                value={boardData.title}
                                onChange={(e) => setBoardData("title", e.target.value)}
                                autoFocus
                            />
                        </DialogBody>
                        <DialogFooter showCloseButton>
                            <Button type="submit">Simpan</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* New Column */}
            <Dialog open={newColumnOpen} onOpenChange={setNewColumnOpen}>
                <DialogContent size="sm">
                    <DialogHeader>
                        <DialogTitle>Kolom Baru</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={submitNewColumn}>
                        <DialogBody>
                            <Label htmlFor="col-title">Nama Kolom</Label>
                            <Input
                                id="col-title"
                                value={colData.title}
                                onChange={(e) => setColData("title", e.target.value)}
                                autoFocus
                            />
                        </DialogBody>
                        <DialogFooter showCloseButton>
                            <Button type="submit">Simpan</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* New Card */}
            <Dialog open={newCardColumnId !== null} onOpenChange={(open) => !open && setNewCardColumnId(null)}>
                <DialogContent size="sm">
                    <DialogHeader>
                        <DialogTitle>Card Baru</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={submitNewCard}>
                        <DialogBody>
                            <Label htmlFor="card-title">Judul Card</Label>
                            <Input
                                id="card-title"
                                value={cardData.title}
                                onChange={(e) => setCardData("title", e.target.value)}
                                autoFocus
                            />
                        </DialogBody>
                        <DialogFooter showCloseButton>
                            <Button type="submit">Simpan</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Card Detail */}
            <Dialog open={detailCard !== null} onOpenChange={(open) => !open && setDetailCard(null)}>
                <DialogContent size="lg">
                    <DialogHeader>
                        <DialogTitle>Detail Card</DialogTitle>
                    </DialogHeader>
                    <DialogBody className="space-y-4">
                        <div>
                            <Label>Title</Label>
                            <Input value={editData.title} onChange={(e) => setEditData("title", e.target.value)} />
                        </div>
                        <div>
                            <Label>Description</Label>
                            <Textarea value={editData.description} onChange={(e) => setEditData("description", e.target.value)} />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label>Responsible</Label>
                                <Input value={editData.responsible} onChange={(e) => setEditData("responsible", e.target.value)} />
                            </div>
                            <div>
                                <Label>Accountable</Label>
                                <Input value={editData.accountable} onChange={(e) => setEditData("accountable", e.target.value)} />
                            </div>
                            <div>
                                <Label>Consulted</Label>
                                <Input value={editData.consulted} onChange={(e) => setEditData("consulted", e.target.value)} />
                            </div>
                            <div>
                                <Label>Informed</Label>
                                <Input value={editData.informed} onChange={(e) => setEditData("informed", e.target.value)} />
                            </div>
                        </div>

                        <div>
                            <Label>Steps</Label>
                            <div className="space-y-1 mt-1">
                                {detailCard?.steps.map((step) => (
                                    <div key={step.id} className="flex items-center gap-2">
                                        <Checkbox checked={step.is_done} onCheckedChange={() => toggleStep(step.id)} />
                                        <span className={`text-sm flex-1 ${step.is_done ? "line-through text-text-secondary" : ""}`}>
                                            {step.title}
                                        </span>
                                        <button onClick={() => deleteStep(step.id)} className="text-text-secondary hover:text-red-600">
                                            <X className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <div className="flex gap-2 mt-2">
                                <Input
                                    placeholder="Tambah step..."
                                    value={newStepTitle}
                                    onChange={(e) => setNewStepTitle(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addStep())}
                                />
                                <Button type="button" variant="secondary" onClick={addStep}>Add</Button>
                            </div>
                        </div>

                        <div>
                            <Label>Definition of Done</Label>
                            <Textarea
                                value={editData.definition_of_done}
                                onChange={(e) => setEditData("definition_of_done", e.target.value)}
                            />
                        </div>
                        <div>
                            <Label>Outcome</Label>
                            <Textarea value={editData.outcome} onChange={(e) => setEditData("outcome", e.target.value)} />
                        </div>
                        <div>
                            <Label>Due Date</Label>
                            <Input type="date" value={editData.due_date} onChange={(e) => setEditData("due_date", e.target.value)} />
                        </div>
                    </DialogBody>
                    <DialogFooter>
                        <Button
                            variant="destructive"
                            type="button"
                            onClick={() => detailCard && setDeleteCardId(detailCard.id)}
                        >
                            Delete
                        </Button>
                        <Button variant="secondary" type="button" onClick={() => setDetailCard(null)}>
                            Cancel
                        </Button>
                        <Button type="button" onClick={saveDetail}>Save</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                open={deleteCardId !== null}
                onOpenChange={(open) => !open && setDeleteCardId(null)}
                title="Hapus Card?"
                description="Card dan semua step di dalamnya akan dihapus permanen."
                onConfirm={confirmDeleteCard}
            />
        </AuthenticatedLayout>
    );
}
