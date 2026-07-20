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
import { Plus, ChevronDown, Trash2, X, CalendarDays, Columns3, Network } from "lucide-react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import {
    ReactFlow,
    ReactFlowProvider,
    Node,
    Edge,
    Background,
    Controls,
    Handle,
    Position,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Select } from "@/Components/ui/select";

interface CalendarEvent {
    id: number;
    title: string;
    description: string | null;
    responsible: string | null;
    start_date: string;
    end_date: string | null;
}
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
interface BoardSeat {
    id: number;
    title: string;
    parent_id: number | null;
    user: { id: number; name: string } | null;
    responsibilities: string[];
}
interface Board {
    id: number;
    title: string;
    columns: Column[];
    calendarEvents: CalendarEvent[];
    boardSeats: BoardSeat[];
}

// ponytail: reused tree-layout math from AccountabilityChart/Index.tsx —
// same algorithm, board-scoped seats instead of org-wide seats
const SEAT_W = 200;
const SEAT_H = 72;
const SEAT_GAP_X = 32;
const SEAT_GAP_Y = 80;

type SeatTree = BoardSeat & { children: SeatTree[] };

function buildSeatTree(seats: BoardSeat[]): SeatTree[] {
    const byId = new Map<number, SeatTree>(seats.map((s) => [s.id, { ...s, children: [] }]));
    const roots: SeatTree[] = [];
    byId.forEach((seat) => {
        if (seat.parent_id && byId.has(seat.parent_id)) {
            byId.get(seat.parent_id)!.children.push(seat);
        } else {
            roots.push(seat);
        }
    });
    return roots;
}

function measureSeatWidth(seat: SeatTree): number {
    if (seat.children.length === 0) return SEAT_W;
    const w = seat.children.reduce((sum, c) => sum + measureSeatWidth(c) + SEAT_GAP_X, -SEAT_GAP_X);
    return Math.max(SEAT_W, w);
}

function buildSeatFlow(roots: SeatTree[]): { nodes: Node[]; edges: Edge[] } {
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    let x = 0;
    const place = (seat: SeatTree, sx: number, y: number) => {
        const subtreeW = measureSeatWidth(seat);
        const cx = sx + subtreeW / 2 - SEAT_W / 2;
        nodes.push({
            id: String(seat.id),
            type: "boardSeatNode",
            position: { x: cx, y },
            data: { seat },
            style: { width: SEAT_W, cursor: "default" },
            draggable: false,
            selectable: true,
            focusable: false,
        });
        let childX = sx;
        for (const child of seat.children) {
            const childW = measureSeatWidth(child);
            edges.push({
                id: `e${seat.id}-${child.id}`,
                source: String(seat.id),
                target: String(child.id),
                type: "smoothstep",
                style: { stroke: "#94a3b8", strokeWidth: 2 },
            });
            place(child, childX, y + SEAT_H + SEAT_GAP_Y);
            childX += childW + SEAT_GAP_X;
        }
    };
    for (const root of roots) {
        const w = measureSeatWidth(root);
        place(root, x, 0);
        x += w + SEAT_GAP_X * 2;
    }
    return { nodes, edges };
}

const boardSeatCallbacksRef = {
    onEdit: (_seat: BoardSeat) => {},
    onDelete: (_id: number) => {},
};

function BoardSeatNode({ data }: { data: any }) {
    const { seat } = data as { seat: BoardSeat };
    return (
        <div
            className="rounded-lg border border-border bg-surface-raised p-3 shadow-sm hover:border-primary transition-all"
            style={{ width: SEAT_W, minHeight: SEAT_H }}
        >
            <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
            <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
            <div className="flex items-start justify-between mb-1">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-primary opacity-60">
                    {seat.title || "—"}
                </span>
                <div className="flex gap-1">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            boardSeatCallbacksRef.onEdit(seat);
                        }}
                        className="rounded px-1 py-0.5 text-[10px] font-medium text-text-secondary hover:bg-surface-overlay"
                    >
                        Edit
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            boardSeatCallbacksRef.onDelete(seat.id);
                        }}
                        className="rounded px-1 py-0.5 text-[10px] font-medium text-error hover:bg-error-subtle"
                    >
                        Hapus
                    </button>
                </div>
            </div>
            {seat.user ? (
                <p className="text-xs font-medium text-text-primary">{seat.user.name}</p>
            ) : (
                <p className="text-xs italic text-text-muted">Belum terisi</p>
            )}
        </div>
    );
}

const boardSeatNodeTypes = { boardSeatNode: BoardSeatNode };

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
    const [view, setView] = useState<"board" | "calendar" | "chart">("board");
    const [eventDialogDate, setEventDialogDate] = useState<string | null>(null);
    const [detailEvent, setDetailEvent] = useState<CalendarEvent | null>(null);
    const [seatDialogOpen, setSeatDialogOpen] = useState(false);
    const [editSeatId, setEditSeatId] = useState<number | null>(null);
    const [deleteSeatId, setDeleteSeatId] = useState<number | null>(null);
    const [boardUsers, setBoardUsers] = useState<{ id: number; name: string }[]>([]);

    useEffect(() => {
        boardSeatCallbacksRef.onEdit = (seat: BoardSeat) => {
            setSeatData({
                title: seat.title,
                parent_id: seat.parent_id ? String(seat.parent_id) : "",
                user_id: seat.user ? String(seat.user.id) : "",
                responsibilities: (seat.responsibilities ?? []).join("\n"),
            });
            setEditSeatId(seat.id);
            setSeatDialogOpen(true);
        };
        boardSeatCallbacksRef.onDelete = (id: number) => setDeleteSeatId(id);
    }, []);

    useEffect(() => {
        if (view === "chart" && activeBoard) {
            fetch(route("kanban.board-seats.users", activeBoard.id))
                .then((r) => r.json())
                .then((d) => setBoardUsers(d.users ?? []));
        }
    }, [view, activeBoard?.id]);

    const {
        data: seatData,
        setData: setSeatData,
        post: postSeat,
        patch: patchSeat,
        reset: resetSeat,
    } = useForm({
        title: "",
        parent_id: "",
        user_id: "",
        responsibilities: "",
    });

    const openNewSeat = () => {
        resetSeat();
        setEditSeatId(null);
        setSeatDialogOpen(true);
    };

    const submitSeat = (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeBoard) return;
        const onSuccess = () => {
            setSeatDialogOpen(false);
            setEditSeatId(null);
            resetSeat();
        };
        const options = {
            preserveScroll: true,
            onSuccess,
            transform: (data: any) => ({
                title: data.title,
                parent_id: data.parent_id || null,
                user_id: data.user_id || null,
                responsibilities: (data.responsibilities as string)
                    .split("\n")
                    .map((r: string) => r.trim())
                    .filter(Boolean),
            }),
        };
        if (editSeatId) {
            patchSeat(route("kanban.board-seats.update", editSeatId), options);
        } else {
            postSeat(route("kanban.board-seats.store", activeBoard.id), options);
        }
    };

    const confirmDeleteSeat = () => {
        if (!deleteSeatId) return;
        router.delete(route("kanban.board-seats.destroy", deleteSeatId), {
            preserveScroll: true,
            onSuccess: () => setDeleteSeatId(null),
        });
    };

    const seatFlow = activeBoard ? buildSeatFlow(buildSeatTree(activeBoard.boardSeats)) : { nodes: [], edges: [] };

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

    const {
        data: eventData,
        setData: setEventData,
        post: postEvent,
        patch: patchEvent,
        reset: resetEvent,
    } = useForm({
        title: "",
        description: "",
        responsible: "",
        start_date: "",
        end_date: "",
    });

    const openNewEvent = (dateStr: string) => {
        resetEvent();
        setEventData("start_date", dateStr);
        setEventDialogDate(dateStr);
    };

    const submitNewEvent = (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeBoard) return;
        postEvent(route("kanban.calendar-events.store", activeBoard.id), {
            preserveScroll: true,
            onSuccess: () => {
                setEventDialogDate(null);
                resetEvent();
            },
        });
    };

    const openEditEvent = (ev: CalendarEvent) => {
        setEventData({
            title: ev.title,
            description: ev.description ?? "",
            responsible: ev.responsible ?? "",
            start_date: ev.start_date,
            end_date: ev.end_date ?? "",
        });
        setDetailEvent(ev);
    };

    const saveEvent = () => {
        if (!detailEvent) return;
        patchEvent(route("kanban.calendar-events.update", detailEvent.id), {
            preserveScroll: true,
            onSuccess: () => setDetailEvent(null),
        });
    };

    const deleteEvent = () => {
        if (!detailEvent) return;
        router.delete(route("kanban.calendar-events.destroy", detailEvent.id), {
            preserveScroll: true,
            onSuccess: () => setDetailEvent(null),
        });
    };

    // ponytail: due_date card jadi titik 1 hari, agenda custom jadi bar (bisa multi-day) — beda warna
    const fcEvents = activeBoard
        ? [
              ...activeBoard.columns
                  .flatMap((c) => c.cards)
                  .filter((card) => card.due_date)
                  .map((card) => ({
                      id: `card-${card.id}`,
                      title: card.title,
                      date: card.due_date as string,
                      backgroundColor: "#6366f1",
                      borderColor: "#6366f1",
                      textColor: "#ffffff",
                      extendedProps: { kind: "card", cardId: card.id },
                  })),
              ...activeBoard.calendarEvents.map((ev) => ({
                  id: `event-${ev.id}`,
                  title: ev.title,
                  start: ev.start_date,
                  end: ev.end_date
                      ? new Date(new Date(ev.end_date).getTime() + 86400000).toISOString().slice(0, 10)
                      : undefined,
                  backgroundColor: "#f59e0b",
                  borderColor: "#f59e0b",
                  textColor: "#ffffff",
                  extendedProps: { kind: "event", eventId: ev.id },
              })),
          ]
        : [];

    const handleFcEventClick = (info: any) => {
        if (info.event.extendedProps.kind === "card") {
            const card = activeBoard?.columns
                .flatMap((c) => c.cards)
                .find((c) => c.id === info.event.extendedProps.cardId);
            if (card) openDetail(card);
        } else {
            const ev = activeBoard?.calendarEvents.find(
                (e) => e.id === info.event.extendedProps.eventId,
            );
            if (ev) openEditEvent(ev);
        }
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
                        {activeBoard && (
                            <div className="flex rounded-full border border-border bg-surface-subtle p-1 gap-1">
                                <button
                                    type="button"
                                    onClick={() => setView("board")}
                                    className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[var(--font-base)] font-medium transition-all ${view === "board" ? "bg-surface shadow-[var(--shadow-xs)] text-primary" : "text-text-secondary hover:text-text-primary"}`}
                                >
                                    <Columns3 className="h-3.5 w-3.5" /> Board
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setView("calendar")}
                                    className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[var(--font-base)] font-medium transition-all ${view === "calendar" ? "bg-surface shadow-[var(--shadow-xs)] text-primary" : "text-text-secondary hover:text-text-primary"}`}
                                >
                                    <CalendarDays className="h-3.5 w-3.5" /> Calendar
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setView("chart")}
                                    className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[var(--font-base)] font-medium transition-all ${view === "chart" ? "bg-surface shadow-[var(--shadow-xs)] text-primary" : "text-text-secondary hover:text-text-primary"}`}
                                >
                                    <Network className="h-3.5 w-3.5" /> Chart
                                </button>
                            </div>
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
            ) : view === "calendar" ? (
                <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-4 overflow-hidden fc-theme-custom">
                    <FullCalendar
                        plugins={[dayGridPlugin, interactionPlugin]}
                        initialView="dayGridMonth"
                        locale="id"
                        headerToolbar={{
                            left: "prev,next today",
                            center: "title",
                            right: "dayGridMonth",
                        }}
                        buttonText={{ today: "Hari Ini", month: "Bulan" }}
                        events={fcEvents}
                        eventClick={handleFcEventClick}
                        dateClick={(info) => openNewEvent(info.dateStr)}
                        height="auto"
                    />
                </div>
            ) : view === "chart" ? (
                <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-4">
                    <div className="flex justify-end mb-2">
                        <Button size="sm" onClick={openNewSeat}>
                            <Plus className="h-4 w-4 mr-1" /> Tambah Seat
                        </Button>
                    </div>
                    {activeBoard.boardSeats.length === 0 ? (
                        <EmptyState
                            title="Belum ada struktur"
                            description="Tambah seat pertama untuk membuat accountability chart khusus board ini."
                        />
                    ) : (
                        <div style={{ height: 480 }}>
                            <ReactFlowProvider>
                                <ReactFlow
                                    nodes={seatFlow.nodes}
                                    edges={seatFlow.edges}
                                    nodeTypes={boardSeatNodeTypes}
                                    fitView
                                    nodesDraggable={false}
                                    nodesConnectable={false}
                                    elementsSelectable={true}
                                >
                                    <Background />
                                    <Controls showInteractive={false} />
                                </ReactFlow>
                            </ReactFlowProvider>
                        </div>
                    )}
                </div>
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

                            <div className="space-y-2 max-h-[560px] overflow-y-auto pr-1">
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
                                            <CardContent className="p-2">
                                                <p className="text-xs font-medium leading-snug line-clamp-2">{card.title}</p>
                                                {(card.responsible || card.steps.length > 0 || card.due_date) && (
                                                    <div className="flex items-center gap-2 mt-1 text-[10px] text-text-secondary">
                                                        {card.responsible && <span className="truncate max-w-[6rem]">R: {card.responsible}</span>}
                                                        {card.steps.length > 0 && (
                                                            <span>☑ {card.steps.filter((s) => s.is_done).length}/{card.steps.length}</span>
                                                        )}
                                                        {card.due_date && <span>🗓 {card.due_date}</span>}
                                                    </div>
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

            {/* New/Edit Calendar Event */}
            <Dialog open={eventDialogDate !== null} onOpenChange={(open) => !open && setEventDialogDate(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Agenda Baru</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={submitNewEvent}>
                        <DialogBody className="space-y-3">
                            <div>
                                <Label>Judul</Label>
                                <Input value={eventData.title} onChange={(e) => setEventData("title", e.target.value)} required />
                            </div>
                            <div>
                                <Label>Deskripsi</Label>
                                <Textarea value={eventData.description} onChange={(e) => setEventData("description", e.target.value)} />
                            </div>
                            <div>
                                <Label>Responsible (opsional)</Label>
                                <Input value={eventData.responsible} onChange={(e) => setEventData("responsible", e.target.value)} />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <Label>Mulai</Label>
                                    <Input type="date" value={eventData.start_date} onChange={(e) => setEventData("start_date", e.target.value)} required />
                                </div>
                                <div>
                                    <Label>Selesai (opsional)</Label>
                                    <Input type="date" value={eventData.end_date} onChange={(e) => setEventData("end_date", e.target.value)} />
                                </div>
                            </div>
                        </DialogBody>
                        <DialogFooter>
                            <Button type="submit">Simpan</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={detailEvent !== null} onOpenChange={(open) => !open && setDetailEvent(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Agenda</DialogTitle>
                    </DialogHeader>
                    <DialogBody className="space-y-3">
                        <div>
                            <Label>Judul</Label>
                            <Input value={eventData.title} onChange={(e) => setEventData("title", e.target.value)} required />
                        </div>
                        <div>
                            <Label>Deskripsi</Label>
                            <Textarea value={eventData.description} onChange={(e) => setEventData("description", e.target.value)} />
                        </div>
                        <div>
                            <Label>Responsible (opsional)</Label>
                            <Input value={eventData.responsible} onChange={(e) => setEventData("responsible", e.target.value)} />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label>Mulai</Label>
                                <Input type="date" value={eventData.start_date} onChange={(e) => setEventData("start_date", e.target.value)} required />
                            </div>
                            <div>
                                <Label>Selesai (opsional)</Label>
                                <Input type="date" value={eventData.end_date} onChange={(e) => setEventData("end_date", e.target.value)} />
                            </div>
                        </div>
                    </DialogBody>
                    <DialogFooter>
                        <Button variant="destructive" onClick={deleteEvent}>
                            <Trash2 className="h-4 w-4 mr-1" /> Hapus
                        </Button>
                        <Button onClick={saveEvent}>Simpan</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

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

            {/* Board Seat Add/Edit */}
            <Dialog open={seatDialogOpen} onOpenChange={(open) => { setSeatDialogOpen(open); if (!open) setEditSeatId(null); }}>
                <DialogContent size="sm">
                    <DialogHeader>
                        <DialogTitle>{editSeatId ? "Edit Seat" : "Seat Baru"}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={submitSeat}>
                        <DialogBody className="space-y-3">
                            <div>
                                <Label>Nama Seat / Posisi</Label>
                                <Input value={seatData.title} onChange={(e) => setSeatData("title", e.target.value)} autoFocus required />
                            </div>
                            <div>
                                <Label>Responsibilities (satu per baris)</Label>
                                <Textarea value={seatData.responsibilities} onChange={(e) => setSeatData("responsibilities", e.target.value)} rows={3} />
                            </div>
                            <div>
                                <Label>User (opsional)</Label>
                                <Select value={seatData.user_id} onChange={(e) => setSeatData("user_id", e.target.value)}>
                                    <option value="">— Belum terisi —</option>
                                    {boardUsers.map((u) => (
                                        <option key={u.id} value={String(u.id)}>{u.name}</option>
                                    ))}
                                </Select>
                            </div>
                            <div>
                                <Label>Parent Seat (opsional)</Label>
                                <Select value={seatData.parent_id} onChange={(e) => setSeatData("parent_id", e.target.value)}>
                                    <option value="">— Root —</option>
                                    {(activeBoard?.boardSeats ?? [])
                                        .filter((s) => s.id !== editSeatId)
                                        .map((s) => (
                                            <option key={s.id} value={String(s.id)}>{s.title}</option>
                                        ))}
                                </Select>
                            </div>
                        </DialogBody>
                        <DialogFooter showCloseButton>
                            <Button type="submit">Simpan</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                open={deleteSeatId !== null}
                onOpenChange={(open) => !open && setDeleteSeatId(null)}
                title="Hapus Seat?"
                description="Seat ini dan posisinya di chart akan dihapus permanen."
                onConfirm={confirmDeleteSeat}
            />
        </AuthenticatedLayout>
    );
}
