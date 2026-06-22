import React, { useState, useEffect, useCallback } from "react";
import { Head, usePage } from "@inertiajs/react";
import axios from "axios";
import {
    ReactFlow,
    ReactFlowProvider,
    Node,
    Edge,
    Background,
    Controls,
    MiniMap,
    useNodesState,
    useEdgesState,
    Handle,
    Position,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
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
import { Input } from "@/Components/ui/input";
import { Textarea } from "@/Components/ui/textarea";
import { Label } from "@/Components/ui/label";
import { Select } from "@/Components/ui/select";
import { EmptyState } from "@/Components/ui/empty-state";
import { ConfirmDialog } from "@/Components/ui/confirm-dialog";

interface Seat {
    id: number;
    title: string;
    responsibilities: string[];
    user: { id: number; name: string } | null;
    parent_id: number | null;
    team_id: number;
    children: Seat[];
}

interface User {
    id: number;
    name: string;
}

const NODE_W = 220;
const NODE_H = 80;
const GAP_X = 40;
const GAP_Y = 100;

function measureSubtreeWidth(seat: Seat): number {
    if (!seat.children || seat.children.length === 0) return NODE_W;
    const childrenWidth = seat.children.reduce(
        (sum, child) => sum + measureSubtreeWidth(child) + GAP_X,
        -GAP_X,
    );
    return Math.max(NODE_W, childrenWidth);
}

function buildNodesEdges(
    seat: Seat,
    x: number,
    y: number,
    nodes: Node[],
    edges: Edge[],
    isEditable: boolean,
) {
    const subtreeW = measureSubtreeWidth(seat);
    const cx = x + subtreeW / 2 - NODE_W / 2;

    nodes.push({
        id: String(seat.id),
        type: "seatNode",
        position: { x: cx, y },
        data: { seat, isEditable },
        style: { width: NODE_W, cursor: "default" },
        draggable: false,
        selectable: true,
        focusable: false,
    });

    if (seat.children && seat.children.length > 0) {
        let childX = x;
        for (const child of seat.children) {
            const childW = measureSubtreeWidth(child);
            edges.push({
                id: `e${seat.id}-${child.id}`,
                source: String(seat.id),
                target: String(child.id),
                type: "smoothstep",
                style: { stroke: "#94a3b8", strokeWidth: 2 },
            });
            buildNodesEdges(
                child,
                childX,
                y + NODE_H + GAP_Y,
                nodes,
                edges,
                isEditable,
            );
            childX += childW + GAP_X;
        }
    }
}

function seatsToFlow(
    seats: Seat[],
    isEditable: boolean,
): { nodes: Node[]; edges: Edge[] } {
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    let x = 0;
    for (const seat of seats) {
        const w = measureSubtreeWidth(seat);
        buildNodesEdges(seat, x, 0, nodes, edges, isEditable);
        x += w + GAP_X * 2;
    }
    return { nodes, edges };
}

const seatCallbacksRef = {
    onEdit: (_seat: Seat) => {},
    onDelete: (_id: number) => {},
};

function SeatNode({ data }: { data: any }) {
    const { seat, isEditable } = data as { seat: Seat; isEditable: boolean };
    return (
        <div
            className="rounded-lg border border-border bg-surface p-4 shadow-sm hover:border-primary hover:bg-surface-subtle transition-all"
            style={{ width: NODE_W, minHeight: NODE_H }}
        >
            <Handle
                type="target"
                position={Position.Top}
                style={{ opacity: 0 }}
            />
            <Handle
                type="source"
                position={Position.Bottom}
                style={{ opacity: 0 }}
            />
            <div className="flex items-start justify-between mb-1">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-primary opacity-60">
                    {seat.title || "—"}
                </span>
                {isEditable && (
                    <div className="flex gap-1">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                seatCallbacksRef.onEdit(seat);
                            }}
                            className="rounded px-1.5 py-0.5 text-[11px] font-medium text-text-secondary hover:bg-surface-overlay hover:text-text-primary"
                        >
                            Edit
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                seatCallbacksRef.onDelete(seat.id);
                            }}
                            className="rounded px-1.5 py-0.5 text-[11px] font-medium text-error hover:bg-error-subtle"
                        >
                            Hapus
                        </button>
                    </div>
                )}
            </div>
            {seat.user ? (
                <p className="text-sm font-medium text-text-primary">
                    {seat.user.name}
                </p>
            ) : (
                <p className="text-sm italic text-text-muted">Belum terisi</p>
            )}
            {seat.responsibilities && seat.responsibilities.length > 0 && (
                <ul className="mt-2 space-y-1 border-t border-border pt-2">
                    {seat.responsibilities.map((r, i) => (
                        <li
                            key={i}
                            className="flex items-start gap-1.5 text-[11px] text-text-secondary leading-snug"
                        >
                            <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-primary" />
                            {r}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

const nodeTypes = { seatNode: SeatNode };

function ExistingUserForm({
    title,
    setTitle,
    responsibilities,
    setResponsibilities,
    userId,
    setUserId,
    parentId,
    setParentId,
    users,
    allSeats,
    editSeatId,
    errors,
}: {
    title: string;
    setTitle: (v: string) => void;
    responsibilities: string;
    setResponsibilities: (v: string) => void;
    userId: string;
    setUserId: (v: string) => void;
    parentId: string;
    setParentId: (v: string) => void;
    users: User[];
    allSeats: Seat[];
    editSeatId?: number;
    errors: Record<string, string>;
}) {
    return (
        <div className="flex flex-col gap-lg">
            <div className="flex flex-col gap-xs">
                <Label>Nama Seat / Posisi *</Label>
                <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Misal: Head of Marketing"
                    aria-invalid={!!errors.title}
                />
                {errors.title && (
                    <p className="text-[var(--font-base)] text-error-text">
                        {errors.title}
                    </p>
                )}
            </div>
            <div className="flex flex-col gap-xs">
                <Label>Responsibilities (satu per baris)</Label>
                <Textarea
                    value={responsibilities}
                    onChange={(e) => setResponsibilities(e.target.value)}
                    placeholder={
                        "Contoh:\nManage marketing budget\nLead campaign strategy"
                    }
                    rows={3}
                />
            </div>
            <div className="flex flex-col gap-xs">
                <Label>User (opsional)</Label>
                <Select
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                >
                    <option value="">— Belum terisi —</option>
                    {users.map((u) => (
                        <option key={u.id} value={u.id.toString()}>
                            {u.name}
                        </option>
                    ))}
                </Select>
            </div>
            <div className="flex flex-col gap-xs">
                <Label>Parent Seat (opsional)</Label>
                <Select
                    value={parentId}
                    onChange={(e) => setParentId(e.target.value)}
                >
                    <option value="">— Root —</option>
                    {allSeats
                        .filter((s) => s.id !== editSeatId)
                        .map((s) => (
                            <option key={s.id} value={s.id}>
                                {s.title}
                            </option>
                        ))}
                </Select>
            </div>
        </div>
    );
}

function NewUserForm({
    title,
    setTitle,
    newName,
    setNewName,
    newEmail,
    setNewEmail,
    newRole,
    setNewRole,
    parentId,
    setParentId,
    allSeats,
    errors,
}: {
    title: string;
    setTitle: (v: string) => void;
    newName: string;
    setNewName: (v: string) => void;
    newEmail: string;
    setNewEmail: (v: string) => void;
    newRole: string;
    setNewRole: (v: string) => void;
    parentId: string;
    setParentId: (v: string) => void;
    allSeats: Seat[];
    errors: Record<string, string>;
}) {
    return (
        <div className="flex flex-col gap-lg">
            <div className="rounded-sm bg-info-subtle px-md py-sm text-[var(--font-base)] text-info-text">
                User baru akan dibuat dengan password default{" "}
                <strong>member123</strong>.
            </div>
            <div className="flex flex-col gap-xs">
                <Label>Nama Lengkap *</Label>
                <Input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Nama lengkap"
                    aria-invalid={!!errors.new_user_name}
                />
                {errors.new_user_name && (
                    <p className="text-[var(--font-base)] text-error-text">
                        {errors.new_user_name}
                    </p>
                )}
            </div>
            <div className="flex flex-col gap-xs">
                <Label>Email *</Label>
                <Input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="email@perusahaan.com"
                    aria-invalid={!!errors.new_user_email}
                />
                {errors.new_user_email && (
                    <p className="text-[var(--font-base)] text-error-text">
                        {errors.new_user_email}
                    </p>
                )}
            </div>
            <div className="flex flex-col gap-xs">
                <Label>Role di Team *</Label>
                <Select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                >
                    <option value="member">Member</option>
                    <option value="tutor">Tutor</option>
                    <option value="leader">Leader</option>
                </Select>
            </div>
            <div className="flex flex-col gap-xs">
                <Label>Nama Seat / Posisi *</Label>
                <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Misal: Head of Marketing"
                    aria-invalid={!!errors.title}
                />
                {errors.title && (
                    <p className="text-[var(--font-base)] text-error-text">
                        {errors.title}
                    </p>
                )}
            </div>
            <div className="flex flex-col gap-xs">
                <Label>Parent Seat (opsional)</Label>
                <Select
                    value={parentId}
                    onChange={(e) => setParentId(e.target.value)}
                >
                    <option value="">— Root —</option>
                    {allSeats.map((s) => (
                        <option key={s.id} value={s.id}>
                            {s.title}
                        </option>
                    ))}
                </Select>
            </div>
        </div>
    );
}

function FlowCanvas({
    rootSeats,
    isEditable,
}: {
    rootSeats: Seat[];
    isEditable: boolean;
}) {
    const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

    useEffect(() => {
        const { nodes: n, edges: e } = seatsToFlow(rootSeats, isEditable);
        setNodes(n);
        setEdges(e);
    }, [rootSeats, isEditable]);

    return (
        <div style={{ width: "100%", height: "100%" }}>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                nodeTypes={nodeTypes}
                fitView
                fitViewOptions={{ padding: 0.2 }}
                nodesDraggable={false}
                nodesConnectable={false}
                elementsSelectable={false}
                panOnDrag={true}
                zoomOnScroll={true}
            >
                <Background color="#e2e8f0" gap={20} />
                <Controls showInteractive={false} />
                <MiniMap nodeStrokeWidth={3} zoomable pannable />
            </ReactFlow>
        </div>
    );
}

export default function AccountabilityChartIndex() {
    const { auth } = usePage().props as any;
    const isLeader = auth.teamRole === "leader";
    const isOrgAdmin = auth.isOrgAdmin;
    const isEditable = isLeader || isOrgAdmin;

    const [seats, setSeats] = useState<Seat[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    const [createOpen, setCreateOpen] = useState(false);
    const [editSeat, setEditSeat] = useState<Seat | null>(null);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [tab, setTab] = useState<"existing" | "new">("existing");
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const [fTitle, setFTitle] = useState("");
    const [fResp, setFResp] = useState("");
    const [fUserId, setFUserId] = useState("");
    const [fParentId, setFParentId] = useState("");
    const [fNewName, setFNewName] = useState("");
    const [fNewEmail, setFNewEmail] = useState("");
    const [fNewRole, setFNewRole] = useState("member");

    const openEdit = useCallback((seat: Seat) => {
        setFTitle(seat.title);
        setFResp(seat.responsibilities?.join("\n") ?? "");
        setFUserId(seat.user?.id?.toString() ?? "");
        setFParentId(seat.parent_id?.toString() ?? "");
        setErrors({});
        setEditSeat(seat);
    }, []);

    const handleDelete = useCallback((id: number) => {
        setDeleteId(id);
    }, []);

    seatCallbacksRef.onEdit = openEdit;
    seatCallbacksRef.onDelete = handleDelete;

    const fetchSeats = useCallback(async () => {
        try {
            const res = await axios.get(`/api/accountability-chart/seats?_t=${Date.now()}`);
            setSeats(res.data.seats);
        } catch (err) {
            console.error("Failed to fetch seats", err);
        }
    }, []);

    const fetchUsers = useCallback(async () => {
        try {
            const res = await axios.get(`/api/accountability-chart/users?_t=${Date.now()}`);
            setUsers(res.data.users);
        } catch (e) {
            console.error("Failed to fetch users", e);
        }
    }, []);

    useEffect(() => {
        setLoading(true);
        Promise.all([fetchSeats(), fetchUsers()]).finally(() =>
            setLoading(false),
        );
    }, [fetchSeats, fetchUsers]);

    const allSeats = (function flatten(list: Seat[] = []): Seat[] {
        return list.flatMap((s) => [s, ...flatten(s.children ?? [])]);
    })(seats);

    const rootSeats = seats.filter((s) => s.parent_id === null);

    const resetForm = () => {
        setFTitle("");
        setFResp("");
        setFUserId("");
        setFParentId("");
        setFNewName("");
        setFNewEmail("");
        setFNewRole("member");
        setErrors({});
    };

    const openCreate = () => {
        resetForm();
        setTab("existing");
        setCreateOpen(true);
    };

    const submitCreate = async () => {
        setProcessing(true);
        setErrors({});
        try {
            const payload =
                tab === "new"
                    ? {
                          create_new_user: true,
                          new_user_name: fNewName,
                          new_user_email: fNewEmail,
                          new_user_role: fNewRole,
                          title: fTitle,
                          parent_id: fParentId || null,
                          responsibilities: fResp
                              ? fResp
                                    .split("\n")
                                    .map((s) => s.trim())
                                    .filter(Boolean)
                              : [],
                      }
                    : {
                          create_new_user: false,
                          title: fTitle,
                          responsibilities: fResp
                              ? fResp
                                    .split("\n")
                                    .map((s) => s.trim())
                                    .filter(Boolean)
                              : [],
                          user_id: fUserId || null,
                          parent_id: fParentId || null,
                      };
            await axios.post("/api/accountability-chart", payload);
            setCreateOpen(false);
            resetForm();
            await fetchSeats();
        } catch (e: any) {
            if (e.response?.data?.errors) setErrors(e.response.data.errors);
        } finally {
            setProcessing(false);
        }
    };

    const submitEdit = async () => {
        if (!editSeat) return;
        setProcessing(true);
        setErrors({});
        try {
            await axios.patch(`/api/accountability-chart/${editSeat.id}`, {
                title: fTitle,
                responsibilities: fResp
                    ? fResp
                          .split("\n")
                          .map((s) => s.trim())
                          .filter(Boolean)
                    : [],
                user_id: fUserId || null,
                parent_id: fParentId || null,
            });
            setEditSeat(null);
            resetForm();
            await fetchSeats();
        } catch (e: any) {
            if (e.response?.data?.errors) setErrors(e.response.data.errors);
        } finally {
            setProcessing(false);
        }
    };

    const destroy = async (id: number) => {
        try {
            await axios.delete(`/api/accountability-chart/${id}`);
            setDeleteId(null);
            // ponytail: optimistic update — remove seat from local state immediately
            // so UI updates without waiting for fetchSeats (which may get cached response).
            setSeats(prev => {
                const removeSeat = (list: Seat[]): Seat[] =>
                    list.filter(s => s.id !== id).map(s => ({
                        ...s,
                        children: s.children ? removeSeat(s.children) : s.children,
                    }));
                return removeSeat(prev);
            });
            // Also re-fetch to sync with server (with cache-buster).
            await fetchSeats();
        } catch (e) {
            console.error("Delete failed", e);
            // If delete failed, re-fetch to restore correct state.
            await fetchSeats();
        }
    };

    const generateFromTeams = async () => {
        try {
            await axios.post("/api/accountability-chart/generate-from-teams");
            await fetchSeats();
        } catch (e) {
            console.error("Generate failed", e);
        }
    };

    return (
        <AuthenticatedLayout>
            <Head title="Accountability Chart" />
            <PageHeader
                title="Accountability Chart"
                subtitle="Struktur organisasi — siapa di seat apa"
                action={
                    isEditable ? (
                        <div className="flex items-center gap-sm">
                            <Button
                                variant="secondary"
                                onClick={generateFromTeams}
                            >
                                Generate dari Tim
                            </Button>
                            <Button onClick={openCreate}>+ Tambah Seat</Button>
                        </div>
                    ) : undefined
                }
            />

            {loading ? (
                <Card>
                    <CardContent className="py-16 text-center text-text-secondary">
                        Memuat chart…
                    </CardContent>
                </Card>
            ) : rootSeats.length === 0 ? (
                <Card>
                    <CardContent className="py-16">
                        <EmptyState
                            title="Belum ada chart"
                            description={
                                isEditable
                                    ? "Tambah seat pertama atau generate dari data tim."
                                    : "Struktur belum dibuat oleh leader."
                            }
                        />
                    </CardContent>
                </Card>
            ) : (
                <div
                    style={{ height: "70vh" }}
                    className="rounded-[var(--radius-lg)] border border-border overflow-hidden"
                >
                    <ReactFlowProvider>
                        <FlowCanvas
                            rootSeats={rootSeats}
                            isEditable={isEditable}
                        />
                    </ReactFlowProvider>
                </div>
            )}

            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogContent size="md">
                    <DialogHeader>
                        <DialogTitle>Tambah Seat</DialogTitle>
                    </DialogHeader>
                    <DialogBody>
                        <div className="mb-lg flex rounded-sm border border-border overflow-hidden">
                            <button
                                type="button"
                                onClick={() => setTab("existing")}
                                className={`flex-1 py-xs text-[var(--font-base)] font-medium transition-colors ${tab === "existing" ? "bg-primary text-text-inverse" : "bg-surface text-text-secondary hover:bg-surface-overlay"}`}
                            >
                                User yang Ada
                            </button>
                            <button
                                type="button"
                                onClick={() => setTab("new")}
                                className={`flex-1 py-xs text-[var(--font-base)] font-medium transition-colors ${tab === "new" ? "bg-primary text-text-inverse" : "bg-surface text-text-secondary hover:bg-surface-overlay"}`}
                            >
                                Buat User Baru
                            </button>
                        </div>
                        {tab === "existing" ? (
                            <ExistingUserForm
                                title={fTitle}
                                setTitle={setFTitle}
                                responsibilities={fResp}
                                setResponsibilities={setFResp}
                                userId={fUserId}
                                setUserId={setFUserId}
                                parentId={fParentId}
                                setParentId={setFParentId}
                                users={users}
                                allSeats={allSeats}
                                errors={errors}
                            />
                        ) : (
                            <NewUserForm
                                title={fTitle}
                                setTitle={setFTitle}
                                newName={fNewName}
                                setNewName={setFNewName}
                                newEmail={fNewEmail}
                                setNewEmail={setFNewEmail}
                                newRole={fNewRole}
                                setNewRole={setFNewRole}
                                parentId={fParentId}
                                setParentId={setFParentId}
                                allSeats={allSeats}
                                errors={errors}
                            />
                        )}
                    </DialogBody>
                    <DialogFooter>
                        <Button
                            variant="secondary"
                            onClick={() => setCreateOpen(false)}
                        >
                            Batal
                        </Button>
                        <Button onClick={submitCreate} disabled={processing}>
                            {processing
                                ? "Menyimpan…"
                                : tab === "new"
                                  ? "Buat User & Seat"
                                  : "Simpan Seat"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog
                open={!!editSeat}
                onOpenChange={(open) => !open && setEditSeat(null)}
            >
                <DialogContent size="md">
                    <DialogHeader>
                        <DialogTitle>Edit Seat</DialogTitle>
                    </DialogHeader>
                    <DialogBody>
                        <ExistingUserForm
                            title={fTitle}
                            setTitle={setFTitle}
                            responsibilities={fResp}
                            setResponsibilities={setFResp}
                            userId={fUserId}
                            setUserId={setFUserId}
                            parentId={fParentId}
                            setParentId={setFParentId}
                            users={users}
                            allSeats={allSeats}
                            editSeatId={editSeat?.id}
                            errors={errors}
                        />
                    </DialogBody>
                    <DialogFooter>
                        <Button
                            variant="secondary"
                            onClick={() => setEditSeat(null)}
                        >
                            Batal
                        </Button>
                        <Button onClick={submitEdit} disabled={processing}>
                            {processing ? "Menyimpan…" : "Update"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                open={deleteId !== null}
                onOpenChange={(open) => !open && setDeleteId(null)}
                title="Hapus Seat"
                description="Seat ini akan dihapus. Anggota yang terhubung tidak ikut terhapus."
                onConfirm={() => deleteId && destroy(deleteId)}
            />
        </AuthenticatedLayout>
    );
}
