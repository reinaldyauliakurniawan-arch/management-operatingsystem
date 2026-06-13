import { useState } from "react";
import { Head, router, useForm, usePage } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { PageHeader } from "@/Components/ui/page-header";
import { Button } from "@/Components/ui/button";
import { Badge } from "@/Components/ui/badge";
import { Card, CardContent } from "@/Components/ui/card";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import { Textarea } from "@/Components/ui/textarea";

interface Attendee {
    id: number;
    name: string;
}
interface Rock {
    id: number;
    title: string;
    status: string;
    owner: string;
}
interface Metric {
    id: number;
    name: string;
    goal: number | null;
    actual: number | null;
    status: string;
    owner: string;
}
interface Todo {
    id: number;
    title: string;
    assignee: string;
    due_date: string | null;
    done: boolean;
    owner_id?: number;
}
interface Issue {
    id: number;
    title: string;
    priority: string;
    status: string;
}
interface Meeting {
    id: number;
    title: string | null;
    scheduled_at: string | null;
    started_at: string | null;
    ended_at: string | null;
    rating: number | null;
    segue_notes: string | null;
    conclude_notes: string | null;
    attendees: Attendee[];
    rocks: Rock[];
    metrics: Metric[];
    todos: Todo[];
    issues: Issue[];
}

const SECTIONS = [
    "Segue",
    "Scorecard",
    "Rock Review",
    "Headlines",
    "To-Do Review",
    "IDS",
    "Conclude",
] as const;
type Section = (typeof SECTIONS)[number];

const statusBadge = (s: string) => {
    if (s === "on_track" || s === "done" || s === "green")
        return (
            <Badge variant="success">
                {s === "on_track"
                    ? "On Track"
                    : s === "done"
                      ? "Done"
                      : "Green"}
            </Badge>
        );
    if (s === "at_risk" || s === "yellow")
        return (
            <Badge variant="warning">
                {s === "at_risk" ? "At Risk" : "Yellow"}
            </Badge>
        );
    if (s === "off_track" || s === "red")
        return (
            <Badge variant="error">
                {s === "off_track" ? "Off Track" : "Red"}
            </Badge>
        );
    return <Badge variant="neutral">{s}</Badge>;
};

const fmt = (s: string | null) =>
    s
        ? new Date(s).toLocaleString("id-ID", {
              day: "numeric",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
          })
        : "—";

export default function L10Workspace({ meeting }: { meeting: Meeting }) {
    const { auth } = usePage().props as any;
    const isLeader = auth.teamRole === "leader";
    const isReadOnly = !!meeting.ended_at;

    const [activeSection, setActiveSection] = useState<Section>("Segue");

    const segueForm = useForm({ segue_notes: meeting.segue_notes ?? "" });
    const concludeForm = useForm({
        conclude_notes: meeting.conclude_notes ?? "",
        rating: meeting.rating?.toString() ?? "",
    });
    const issueForm = useForm({ title: "", priority: "medium" });
    const todoForm = useForm({ title: "", assignee_id: "", due_date: "" });

    const startMeeting = () =>
        router.post(
            route("l10.start", meeting.id),
            {},
            { preserveScroll: true },
        );
    const endMeeting = () =>
        router.post(
            route("l10.finish", meeting.id),
            {
                conclude_notes: concludeForm.data.conclude_notes,
                rating: concludeForm.data.rating || null,
            },
            { preserveScroll: true },
        );

    const saveSegue = () =>
        segueForm.patch(route("l10.segue", meeting.id), {
            preserveScroll: true,
        });
    const saveConclude = () =>
        concludeForm.patch(route("l10.conclude", meeting.id), {
            preserveScroll: true,
        });

    const addIssue = (e: React.FormEvent) => {
        e.preventDefault();
        issueForm.post(route("l10.issues.store", meeting.id), {
            preserveScroll: true,
            onSuccess: () => issueForm.reset(),
        });
    };

    const addTodo = (e: React.FormEvent) => {
        e.preventDefault();
        todoForm.post(route("l10.todos.store", meeting.id), {
            preserveScroll: true,
            onSuccess: () => todoForm.reset(),
        });
    };

    const toggleTodo = (id: number) =>
        router.patch(route("todos.toggle", id), {}, { preserveScroll: true });

    return (
        <AuthenticatedLayout>
            <Head title={`Workspace — ${meeting.title ?? "L10 Meeting"}`} />

            <PageHeader
                title={meeting.title ?? "L10 Meeting"}
                subtitle={`Jadwal: ${fmt(meeting.scheduled_at)}`}
                action={
                    isLeader && !isReadOnly ? (
                        !meeting.started_at ? (
                            <Button onClick={startMeeting}>
                                Mulai Meeting
                            </Button>
                        ) : (
                            <Button variant="destructive" onClick={endMeeting}>
                                Akhiri Meeting
                            </Button>
                        )
                    ) : isReadOnly ? (
                        <Badge variant="neutral">Selesai</Badge>
                    ) : undefined
                }
            />

            {/* Section nav */}
            <div className="mb-xl flex gap-xs overflow-x-auto pb-xs">
                {SECTIONS.map((s) => (
                    <button
                        key={s}
                        onClick={() => setActiveSection(s)}
                        className={`shrink-0 rounded-sm px-md py-xs text-[13px] font-medium transition-colors ${
                            activeSection === s
                                ? "bg-primary-subtle text-primary-text"
                                : "text-text-secondary hover:bg-surface-overlay"
                        }`}
                    >
                        {s}
                    </button>
                ))}
            </div>

            {/* Attendees strip */}
            <div className="mb-xl flex flex-wrap gap-xs">
                {meeting.attendees.map((a) => (
                    <span
                        key={a.id}
                        className="rounded-xs bg-surface-raised px-sm py-xs text-[12px] text-text-secondary"
                    >
                        {a.name}
                    </span>
                ))}
            </div>

            {/* SEGUE */}
            {activeSection === "Segue" && (
                <Card>
                    <CardContent className="pt-xl flex flex-col gap-lg">
                        <div>
                            <p className="mb-xs text-[12px] font-medium uppercase tracking-wider text-text-muted">
                                Segue (5 menit)
                            </p>
                            <p className="text-[13px] text-text-secondary">
                                Share kabar baik personal atau profesional
                                singkat.
                            </p>
                        </div>
                        {!isReadOnly && (
                            <div className="flex flex-col gap-xs">
                                <Label>Catatan Segue</Label>
                                <Textarea
                                    rows={4}
                                    value={segueForm.data.segue_notes}
                                    onChange={(e) =>
                                        segueForm.setData(
                                            "segue_notes",
                                            e.target.value,
                                        )
                                    }
                                    placeholder="Catatan segue..."
                                />
                                <div className="flex justify-end">
                                    <Button
                                        size="sm"
                                        variant="secondary"
                                        onClick={saveSegue}
                                        disabled={segueForm.processing}
                                    >
                                        Simpan
                                    </Button>
                                </div>
                            </div>
                        )}
                        {meeting.segue_notes && isReadOnly && (
                            <p className="text-[13px] text-text-primary whitespace-pre-line">
                                {meeting.segue_notes}
                            </p>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* SCORECARD */}
            {activeSection === "Scorecard" && (
                <Card>
                    <CardContent className="pt-xl">
                        <p className="mb-lg text-[12px] font-medium uppercase tracking-wider text-text-muted">
                            Scorecard Review
                        </p>
                        {meeting.metrics.length === 0 ? (
                            <p className="text-[13px] text-text-muted">
                                Tidak ada metric di scorecard.
                            </p>
                        ) : (
                            <div className="flex flex-col divide-y divide-border">
                                {meeting.metrics.map((m) => (
                                    <div
                                        key={m.id}
                                        className="flex items-center justify-between py-md"
                                    >
                                        <div>
                                            <p className="text-[13px] font-medium text-text-primary">
                                                {m.name}
                                            </p>
                                            <p className="text-[12px] text-text-muted">
                                                {m.owner}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-lg">
                                            <span className="text-[13px] text-text-secondary">
                                                Goal: {m.goal ?? "—"}
                                            </span>
                                            <span className="text-[13px] text-text-secondary">
                                                Actual: {m.actual ?? "—"}
                                            </span>
                                            {statusBadge(m.status)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* ROCK REVIEW */}
            {activeSection === "Rock Review" && (
                <Card>
                    <CardContent className="pt-xl">
                        <p className="mb-lg text-[12px] font-medium uppercase tracking-wider text-text-muted">
                            Rock Review
                        </p>
                        {meeting.rocks.length === 0 ? (
                            <p className="text-[13px] text-text-muted">
                                Tidak ada rocks aktif.
                            </p>
                        ) : (
                            <div className="flex flex-col divide-y divide-border">
                                {meeting.rocks.map((r) => (
                                    <div
                                        key={r.id}
                                        className="flex items-center justify-between py-md"
                                    >
                                        <div>
                                            <p className="text-[13px] font-medium text-text-primary">
                                                {r.title}
                                            </p>
                                            <p className="text-[12px] text-text-muted">
                                                {r.owner}
                                            </p>
                                        </div>
                                        {statusBadge(r.status)}
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* HEADLINES */}
            {activeSection === "Headlines" && (
                <Card>
                    <CardContent className="pt-xl">
                        <p className="mb-sm text-[12px] font-medium uppercase tracking-wider text-text-muted">
                            Headlines
                        </p>
                        <p className="text-[13px] text-text-secondary">
                            Customer dan employee headlines — update singkat
                            good news / bad news.
                        </p>
                    </CardContent>
                </Card>
            )}

            {/* TO-DO REVIEW */}
            {activeSection === "To-Do Review" && (
                <div className="flex flex-col gap-lg">
                    <Card>
                        <CardContent className="pt-xl">
                            <p className="mb-lg text-[12px] font-medium uppercase tracking-wider text-text-muted">
                                To-Do Review
                            </p>
                            {meeting.todos.length === 0 ? (
                                <p className="text-[13px] text-text-muted">
                                    Tidak ada to-do aktif.
                                </p>
                            ) : (
                                <div className="flex flex-col divide-y divide-border">
                                    {meeting.todos.map((t) => {
                                        const canToggle =
                                            !isReadOnly &&
                                            (isLeader ||
                                                t.owner_id === auth.user.id);

                                        return (
                                        <div
                                            key={t.id}
                                            className="flex items-center gap-md py-md"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={t.done}
                                                onChange={() =>
                                                    canToggle && toggleTodo(t.id)
                                                }
                                                disabled={!canToggle}
                                                className="h-4 w-4 rounded accent-primary"
                                            />
                                            <div className="flex-1">
                                                <p
                                                    className={`text-[13px] ${t.done ? "line-through text-text-muted" : "text-text-primary"}`}
                                                >
                                                    {t.title}
                                                </p>
                                                <p className="text-[12px] text-text-muted">
                                                    {t.assignee} ·{" "}
                                                    {t.due_date ?? "—"}
                                                </p>
                                            </div>
                                        </div>
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {!isReadOnly && (
                        <Card>
                            <CardContent className="pt-xl">
                                <p className="mb-md text-[13px] font-medium text-text-primary">
                                    Tambah To-Do dari Meeting
                                </p>
                                <form
                                    onSubmit={addTodo}
                                    className="flex flex-col gap-md"
                                >
                                    <div className="flex flex-col gap-xs">
                                        <Label>To-Do</Label>
                                        <Input
                                            value={todoForm.data.title}
                                            onChange={(e) =>
                                                todoForm.setData(
                                                    "title",
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="Misal: Follow up ke vendor..."
                                        />
                                    </div>
                                    <div className="flex gap-md">
                                        <div className="flex flex-1 flex-col gap-xs">
                                            <Label>Assignee</Label>
                                            <select
                                                value={
                                                    todoForm.data.assignee_id
                                                }
                                                onChange={(e) =>
                                                    todoForm.setData(
                                                        "assignee_id",
                                                        e.target.value,
                                                    )
                                                }
                                                className="bg-[#f0f0f0] border border-[#e4e4e4] rounded-lg px-3 py-2 text-sm text-[#1a1a1a] focus:outline-none focus:border-[#1a5c41] focus:ring-2 focus:ring-[#1a5c41]/10 transition-colors appearance-none"
                                            >
                                                <option value="">
                                                    — Pilih —
                                                </option>
                                                {meeting.attendees.map((a) => (
                                                    <option
                                                        key={a.id}
                                                        value={a.id}
                                                    >
                                                        {a.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="flex flex-1 flex-col gap-xs">
                                            <Label>Due Date</Label>
                                            <Input
                                                type="date"
                                                value={todoForm.data.due_date}
                                                onChange={(e) =>
                                                    todoForm.setData(
                                                        "due_date",
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                        </div>
                                    </div>
                                    <div className="flex justify-end">
                                        <Button
                                            size="sm"
                                            type="submit"
                                            disabled={todoForm.processing}
                                        >
                                            Tambah
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}

            {/* IDS */}
            {activeSection === "IDS" && (
                <div className="flex flex-col gap-lg">
                    <Card>
                        <CardContent className="pt-xl">
                            <p className="mb-lg text-[12px] font-medium uppercase tracking-wider text-text-muted">
                                Issues — Identify, Discuss, Solve
                            </p>
                            {meeting.issues.length === 0 ? (
                                <p className="text-[13px] text-text-muted">
                                    Belum ada issue di meeting ini.
                                </p>
                            ) : (
                                <div className="flex flex-col divide-y divide-border">
                                    {meeting.issues.map((i) => (
                                        <div
                                            key={i.id}
                                            className="flex items-center justify-between py-md"
                                        >
                                            <p className="text-[13px] text-text-primary">
                                                {i.title}
                                            </p>
                                            <div className="flex items-center gap-sm">
                                                <Badge
                                                    variant={
                                                        i.priority === "high"
                                                            ? "error"
                                                            : i.priority ===
                                                                "medium"
                                                              ? "warning"
                                                              : "neutral"
                                                    }
                                                >
                                                    {i.priority}
                                                </Badge>
                                                {statusBadge(i.status)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {!isReadOnly && (
                        <Card>
                            <CardContent className="pt-xl">
                                <p className="mb-md text-[13px] font-medium text-text-primary">
                                    Tambah Issue
                                </p>
                                <form
                                    onSubmit={addIssue}
                                    className="flex flex-col gap-md"
                                >
                                    <div className="flex flex-col gap-xs">
                                        <Label>Issue</Label>
                                        <Input
                                            value={issueForm.data.title}
                                            onChange={(e) =>
                                                issueForm.setData(
                                                    "title",
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="Deskripsi issue..."
                                        />
                                    </div>
                                    <div className="flex flex-col gap-xs">
                                        <Label>Priority</Label>
                                        <select
                                            value={issueForm.data.priority}
                                            onChange={(e) =>
                                                issueForm.setData(
                                                    "priority",
                                                    e.target.value,
                                                )
                                            }
                                            className="bg-[#f0f0f0] border border-[#e4e4e4] rounded-lg px-3 py-2 text-sm text-[#1a1a1a] focus:outline-none focus:border-[#1a5c41] focus:ring-2 focus:ring-[#1a5c41]/10 transition-colors appearance-none"
                                        >
                                            <option value="low">Low</option>
                                            <option value="medium">
                                                Medium
                                            </option>
                                            <option value="high">High</option>
                                        </select>
                                    </div>
                                    <div className="flex justify-end">
                                        <Button
                                            size="sm"
                                            type="submit"
                                            disabled={issueForm.processing}
                                        >
                                            Tambah
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}

            {/* CONCLUDE */}
            {activeSection === "Conclude" && (
                <Card>
                    <CardContent className="pt-xl flex flex-col gap-lg">
                        <div>
                            <p className="mb-xs text-[12px] font-medium uppercase tracking-wider text-text-muted">
                                Conclude
                            </p>
                            <p className="text-[13px] text-text-secondary">
                                Cascading messages, recap to-do baru, rating
                                meeting.
                            </p>
                        </div>
                        {!isReadOnly ? (
                            <>
                                <div className="flex flex-col gap-xs">
                                    <Label>Catatan Penutup</Label>
                                    <Textarea
                                        rows={4}
                                        value={concludeForm.data.conclude_notes}
                                        onChange={(e) =>
                                            concludeForm.setData(
                                                "conclude_notes",
                                                e.target.value,
                                            )
                                        }
                                        placeholder="Cascading messages, keputusan utama..."
                                    />
                                </div>
                                <div className="flex flex-col gap-xs">
                                    <Label>Rating Meeting (1–10)</Label>
                                    <Input
                                        type="number"
                                        min="1"
                                        max="10"
                                        value={concludeForm.data.rating}
                                        onChange={(e) =>
                                            concludeForm.setData(
                                                "rating",
                                                e.target.value,
                                            )
                                        }
                                        placeholder="8"
                                    />
                                </div>
                                <div className="flex justify-end gap-sm">
                                    <Button
                                        size="sm"
                                        variant="secondary"
                                        onClick={saveConclude}
                                        disabled={concludeForm.processing}
                                    >
                                        Simpan
                                    </Button>
                                    {isLeader && meeting.started_at && (
                                        <Button
                                            variant="destructive"
                                            onClick={endMeeting}
                                        >
                                            Akhiri Meeting
                                        </Button>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-col gap-md">
                                {meeting.conclude_notes && (
                                    <p className="text-[13px] text-text-primary whitespace-pre-line">
                                        {meeting.conclude_notes}
                                    </p>
                                )}
                                {meeting.rating && (
                                    <p className="text-[13px] text-text-secondary">
                                        Rating:{" "}
                                        <span className="font-semibold text-primary-text">
                                            {meeting.rating}/10
                                        </span>
                                    </p>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}
        </AuthenticatedLayout>
    );
}
