import { useState } from "react";
import { Head, usePage, router, useForm } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { PageHeader } from "@/Components/ui/page-header";
import { Button } from "@/Components/ui/button";
import { Badge } from "@/Components/ui/badge";
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
import { ConfirmDialog } from "@/Components/ui/confirm-dialog";
import { Zap, CalendarDays, List, ChevronDown, ChevronUp } from "lucide-react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";

// ─── Types ────────────────────────────────────────────────────────────
interface AgendaItem {
    title: string;
    duration?: number;
    desc?: string;
}

interface Attendee {
    id: number;
    name: string;
    attended: boolean;
}

interface Event {
    id: number;
    name: string;
    type: string;
    custom_type: string | null;
    type_label: string;
    event_date: string;
    description: string | null;
    agenda: AgendaItem[];
    attendees: Attendee[];
    has_attended: boolean;
    is_generated: boolean;
}

interface Suggestion {
    type: string;
    name: string;
    event_date: string;
    agenda: AgendaItem[];
    description: string;
}

// ─── Constants ────────────────────────────────────────────────────────
const EVENT_TYPES = [
    { value: "l10",       label: "L10 Meeting"      },
    { value: "quarterly", label: "Quarterly Meeting" },
    { value: "annual",    label: "Annual Meeting"    },
    { value: "training",  label: "Training"          },
    { value: "townhall",  label: "Townhall"          },
    { value: "custom",    label: "Custom…"           },
] as const;

// Warna per tipe — pakai CSS variable dari theme
const TYPE_COLOR: Record<string, string> = {
    l10:       "#1e3a5f", // info
    quarterly: "#92400e", // warning
    annual:    "#991b1b", // error/danger
    training:  "#1a5c41", // success/primary
    townhall:  "#6b6b6b", // neutral
    custom:    "#6b6b6b",
};

const DEFAULT_AGENDA: Record<string, AgendaItem[]> = {
    l10: [
        { title: "Segue",        duration: 5,  desc: "Check-in singkat, good news personal & bisnis." },
        { title: "Scorecard",    duration: 5,  desc: "Review angka mingguan tim." },
        { title: "Rock Review",  duration: 5,  desc: "Status rock per orang: on-track / off-track." },
        { title: "Headlines",    duration: 5,  desc: "Customer & employee headlines." },
        { title: "To-Do Review", duration: 5,  desc: "Review to-do minggu lalu. Target 90% completion." },
        { title: "IDS",          duration: 60, desc: "Identify-Discuss-Solve. Selesaikan isu terpenting." },
        { title: "Conclude",     duration: 5,  desc: "Recap to-do, cascade messages, rating meeting 1-10." },
    ],
    quarterly: [
        { title: "Check-in",               duration: 30, desc: "Good news personal & bisnis." },
        { title: "Review V/TO",            duration: 60, desc: "Apakah Vision/Traction masih selaras?" },
        { title: "Review Rocks Lalu",      duration: 30, desc: "Done / not done. Jujur." },
        { title: "Review P&L & Data",      duration: 30, desc: "Kesehatan bisnis: revenue, profit, pipeline." },
        { title: "People Review",          duration: 30, desc: "GWC check: siapa yang perlu diperhatikan?" },
        { title: "SWOT / Issues Identify", duration: 60, desc: "List isu & opportunities. Prioritaskan top 3-5." },
        { title: "Set Rocks Quarter Baru", duration: 60, desc: "Tiap rock SMART. Max 3-7 rock per orang." },
        { title: "Conclude",               duration: 30, desc: "Recap rocks & to-do. Rating meeting." },
    ],
    annual: [
        { title: "Day 1 — Check-in & Review",   duration: 60, desc: "Review tahun lalu: pencapaian & kegagalan." },
        { title: "Day 1 — Core Values",         duration: 90, desc: "Masih relevan? Siapa hidup / tidak?" },
        { title: "Day 1 — Core Focus",          duration: 60, desc: "Review Purpose, Niche, Economic Engine." },
        { title: "Day 1 — 10-Year Target",      duration: 60, desc: "Masih inspire? Perlu diperbarui?" },
        { title: "Day 1 — Marketing Strategy",  duration: 90, desc: "Target Market, 3 Uniques, Proven Process, Guarantee." },
        { title: "Day 2 — 3-Year Picture",      duration: 60, desc: "Seperti apa bisnis 3 tahun lagi?" },
        { title: "Day 2 — 1-Year Plan",         duration: 60, desc: "Revenue, profit, 3-7 Goals tahun ini." },
        { title: "Day 2 — Rocks Q1",            duration: 60, desc: "Set rocks untuk Q1. Prioritas mutlak." },
        { title: "Day 2 — Issues & IDS",        duration: 90, desc: "Selesaikan isu besar yang memblokir 1-year plan." },
        { title: "Day 2 — Conclude",            duration: 30, desc: "Recap, cascade, rating meeting." },
    ],
};

function typeBadgeVariant(type: string): "info" | "warning" | "danger" | "success" | "neutral" {
    const map: Record<string, any> = {
        l10: "info", quarterly: "warning", annual: "danger",
        training: "success", townhall: "neutral", custom: "neutral",
    };
    return map[type] ?? "neutral";
}

const fmt = (s: string) =>
    new Date(s).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });

// ─── Agenda display ───────────────────────────────────────────────────
function AgendaList({ agenda }: { agenda: AgendaItem[] }) {
    if (!agenda?.length) return null;
    const total = agenda.reduce((s, a) => s + (a.duration ?? 0), 0);
    return (
        <div className="mt-xl">
            <p className="mb-sm text-[var(--font-base)] font-medium uppercase tracking-wider text-text-muted">
                Agenda {total > 0 && <span className="normal-case font-normal">({total} menit)</span>}
            </p>
            <ol className="flex flex-col gap-xs">
                {agenda.map((item, i) => (
                    <li key={i} className="flex gap-md rounded-sm bg-surface-subtle px-md py-sm">
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
                            {i + 1}
                        </span>
                        <div className="flex-1">
                            <p className="text-[var(--font-base)] font-medium text-text-primary">
                                {item.title}
                                {item.duration && (
                                    <span className="ml-2 text-[var(--font-sm)] font-normal text-text-muted">
                                        {item.duration} mnt
                                    </span>
                                )}
                            </p>
                            {item.desc && (
                                <p className="text-[var(--font-sm)] text-text-muted">{item.desc}</p>
                            )}
                        </div>
                    </li>
                ))}
            </ol>
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────
export default function EventIndex({
    events,
    users,
    suggestions,
}: {
    events: Event[];
    users: { id: number; name: string }[];
    suggestions: Suggestion[];
}) {
    const { auth } = usePage().props as any;
    const isLeader = auth.teamRole === "leader";

    const [view, setView]                 = useState<"calendar" | "list">("calendar");
    const [createOpen, setCreateOpen]     = useState(false);
    const [detailEvent, setDetailEvent]   = useState<Event | null>(null);
    const [deleteId, setDeleteId]         = useState<number | null>(null);
    const [suggestOpen, setSuggestOpen]   = useState(false);
    const [selectedSugs, setSelectedSugs] = useState<number[]>([]);
    const [agendaOpen, setAgendaOpen]     = useState(false);

    const { data, setData, post, processing, reset, errors } = useForm({
        name:              "",
        type:              "l10" as string,
        custom_type:       "",
        event_date:        "",
        description:       "",
        agenda:            [] as AgendaItem[],
        assigned_user_ids: [] as number[],
    });

    const handleTypeChange = (val: string) => {
        setData("type", val);
        setData("agenda", DEFAULT_AGENDA[val] ?? []);
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route("events.store"), {
            onSuccess: () => { setCreateOpen(false); reset(); },
        });
    };

    const bulkGenerate = () => {
        const toCreate = suggestions.filter((_, i) => selectedSugs.includes(i));
        router.post(route("events.bulk"), { events: toCreate }, {
            onSuccess: () => { setSuggestOpen(false); setSelectedSugs([]); },
        });
    };

    const markAttended = (id: number) =>
        router.post(route("events.attend", id), {}, { preserveScroll: true });

    const destroy = (id: number) => {
        router.delete(route("events.destroy", id), {
            preserveScroll: true,
            onSuccess: () => setDeleteId(null),
        });
    };

    const overrideAttendance = (eventId: number, userId: number) =>
        router.post(route("events.override", { event: eventId, user: userId }), {}, { preserveScroll: true });

    const toggleAssignedUser = (uid: number) =>
        setData("assigned_user_ids",
            data.assigned_user_ids.includes(uid)
                ? data.assigned_user_ids.filter((id) => id !== uid)
                : [...data.assigned_user_ids, uid]
        );

    const toggleSug = (i: number) =>
        setSelectedSugs((prev) => prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]);

    // FullCalendar event objects
    const calendarEvents = events.map((ev) => ({
        id:              String(ev.id),
        title:           ev.name,
        date:            ev.event_date,
        backgroundColor: TYPE_COLOR[ev.type] ?? TYPE_COLOR.custom,
        borderColor:     TYPE_COLOR[ev.type] ?? TYPE_COLOR.custom,
        textColor:       "#ffffff",
        extendedProps:   { eventId: ev.id },
    }));

    const handleCalendarEventClick = (info: any) => {
        const ev = events.find((e) => e.id === info.event.extendedProps.eventId);
        if (ev) setDetailEvent(ev);
    };

    const upcoming = events.filter((e) => new Date(e.event_date) >= new Date()).length;
    const past     = events.filter((e) => new Date(e.event_date) < new Date()).length;

    return (
        <AuthenticatedLayout>
            <Head title="Event" />

            <PageHeader
                title="Event"
                subtitle="L10, Quarterly, Annual, Training & Townhall tim"
                action={
                    isLeader ? (
                        <div className="flex gap-sm">
                            {suggestions.length > 0 && (
                                <Button variant="secondary" onClick={() => setSuggestOpen(true)}>
                                    <Zap className="mr-1.5 h-4 w-4" />
                                    Generate Otomatis ({suggestions.length})
                                </Button>
                            )}
                            <Button onClick={() => { handleTypeChange("l10"); setCreateOpen(true); }}>
                                + Tambah Event
                            </Button>
                        </div>
                    ) : undefined
                }
            />

            {/* Stats + Legend + Toggle */}
            <div className="mb-xl flex flex-col gap-lg sm:flex-row sm:items-start sm:justify-between">
                <div className="grid grid-cols-2 max-w-xs gap-lg">
                    {[
                        { label: "Mendatang", value: upcoming, cls: "text-info-text" },
                        { label: "Selesai",   value: past,     cls: "text-text-secondary" },
                    ].map((s) => (
                        <Card key={s.label}>
                            <CardContent>
                                <p className="mb-sm text-[length:var(--font-md)] font-semibold text-primary">{s.label}</p>
                                <p className={`text-[var(--font-2xl)] font-semibold leading-none tracking-tight ${s.cls}`}>{s.value}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <div className="flex flex-col gap-md items-end">
                    {/* View toggle */}
                    <div className="flex rounded-full border border-border bg-surface-subtle p-1 gap-1">
                        <button
                            type="button"
                            onClick={() => setView("calendar")}
                            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[var(--font-base)] font-medium transition-all ${view === "calendar" ? "bg-surface shadow-[var(--shadow-xs)] text-primary" : "text-text-secondary hover:text-text-primary"}`}
                        >
                            <CalendarDays className="h-3.5 w-3.5" /> Kalender
                        </button>
                        <button
                            type="button"
                            onClick={() => setView("list")}
                            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[var(--font-base)] font-medium transition-all ${view === "list" ? "bg-surface shadow-[var(--shadow-xs)] text-primary" : "text-text-secondary hover:text-text-primary"}`}
                        >
                            <List className="h-3.5 w-3.5" /> List
                        </button>
                    </div>

                    {/* Legend */}
                    <div className="flex flex-wrap gap-x-md gap-y-xs">
                        {[
                            { type: "l10",       label: "L10" },
                            { type: "quarterly", label: "Quarterly" },
                            { type: "annual",    label: "Annual" },
                            { type: "training",  label: "Training" },
                            { type: "townhall",  label: "Townhall" },
                        ].map((t) => (
                            <span key={t.type} className="flex items-center gap-1 text-[var(--font-sm)] text-text-secondary">
                                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: TYPE_COLOR[t.type] }} />
                                {t.label}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Calendar View ──────────────────────────────────────── */}
            {view === "calendar" && (
                <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-4 overflow-hidden fc-theme-custom">
                    <FullCalendar
                        plugins={[dayGridPlugin, interactionPlugin, listPlugin]}
                        initialView="dayGridMonth"
                        locale="id"
                        headerToolbar={{
                            left:   "prev,next today",
                            center: "title",
                            right:  "dayGridMonth,listMonth",
                        }}
                        buttonText={{
                            today:     "Hari Ini",
                            month:     "Bulan",
                            list:      "List",
                        }}
                        events={calendarEvents}
                        eventClick={handleCalendarEventClick}
                        height="auto"
                        dayMaxEvents={3}
                        eventDisplay="block"
                        eventClassNames="cursor-pointer rounded-xs px-1 text-[var(--font-sm)] font-medium"
                    />
                </div>
            )}

            {/* ── List View ──────────────────────────────────────────── */}
            {view === "list" && (
                <div className="flex flex-col gap-sm">
                    {events.length === 0 && (
                        <div className="rounded-[var(--radius-lg)] border border-border bg-surface py-16 text-center text-text-muted">
                            Belum ada event.{isLeader && " Generate otomatis atau tambah manual."}
                        </div>
                    )}
                    {events
                        .slice()
                        .sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime())
                        .map((ev) => {
                            const isPast = new Date(ev.event_date) < new Date();
                            const attended = ev.attendees.filter((a) => a.attended).length;
                            return (
                                <div
                                    key={ev.id}
                                    className={`flex items-center gap-md rounded-[var(--radius-lg)] border bg-surface px-lg py-md transition-colors hover:bg-surface-subtle ${isPast ? "border-border opacity-60" : "border-border"}`}
                                >
                                    {/* Color strip */}
                                    <div className="w-1 self-stretch rounded-full shrink-0" style={{ backgroundColor: TYPE_COLOR[ev.type] ?? TYPE_COLOR.custom }} />

                                    <div className="flex-1 min-w-0">
                                        <p className="text-[var(--font-base)] font-semibold text-text-primary truncate">{ev.name}</p>
                                        <p className="text-[var(--font-sm)] text-text-muted">{fmt(ev.event_date)}</p>
                                    </div>

                                    <Badge variant={typeBadgeVariant(ev.type)}>{ev.type_label}</Badge>

                                    <span className="text-[var(--font-sm)] text-text-muted shrink-0">
                                        {attended}/{ev.attendees.length} hadir
                                    </span>

                                    <div className="flex items-center gap-sm shrink-0">
                                        {!isPast && !ev.has_attended && (
                                            <Button size="sm" className="bg-primary-subtle text-primary-text hover:bg-primary-subtle/70" onClick={() => markAttended(ev.id)}>
                                                Hadir
                                            </Button>
                                        )}
                                        {ev.has_attended && <Badge variant="success">Hadir ✓</Badge>}
                                        <Button variant="ghost" size="sm" onClick={() => setDetailEvent(ev)}>Detail</Button>
                                        {isLeader && (
                                            <Button variant="danger" size="sm" onClick={() => setDeleteId(ev.id)}>Hapus</Button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                </div>
            )}

            {/* ── Generate Otomatis Modal ─────────────────────────────── */}
            <Dialog open={suggestOpen} onOpenChange={setSuggestOpen}>
                <DialogContent size="lg">
                    <DialogHeader>
                        <DialogTitle>Generate Event Otomatis</DialogTitle>
                    </DialogHeader>
                    <DialogBody className="flex flex-col gap-md">
                        <p className="text-[var(--font-base)] text-text-secondary">
                            Event berikut dihitung dari pengaturan tim (scorecard day & Q1 start date). Pilih yang ingin dibuat.
                        </p>
                        <div className="flex flex-col gap-sm">
                            {suggestions.map((s, i) => (
                                <button
                                    type="button"
                                    key={i}
                                    onClick={() => toggleSug(i)}
                                    className={`flex items-start gap-md rounded-sm border px-md py-sm text-left transition-colors ${selectedSugs.includes(i) ? "border-primary bg-primary-subtle" : "border-border bg-surface-subtle"}`}
                                >
                                    <span className={`mt-0.5 h-4 w-4 shrink-0 rounded border-2 ${selectedSugs.includes(i) ? "border-primary bg-primary" : "border-border"}`} />
                                    <div className="flex-1">
                                        <p className="text-[var(--font-base)] font-medium text-text-primary">{s.name}</p>
                                        <p className="text-[var(--font-sm)] text-text-muted">
                                            {fmt(s.event_date)}
                                            <Badge variant={typeBadgeVariant(s.type)} className="ml-2">{s.type}</Badge>
                                        </p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </DialogBody>
                    <DialogFooter>
                        <Button variant="secondary" onClick={() => setSelectedSugs(suggestions.map((_, i) => i))}>
                            Pilih Semua
                        </Button>
                        <Button variant="ghost" onClick={() => setSuggestOpen(false)}>Batal</Button>
                        <Button onClick={bulkGenerate} disabled={selectedSugs.length === 0}>
                            Generate {selectedSugs.length > 0 ? `(${selectedSugs.length})` : ""}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ── Create Modal ───────────────────────────────────────── */}
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogContent size="md">
                    <DialogHeader>
                        <DialogTitle>Tambah Event</DialogTitle>
                    </DialogHeader>
                    <DialogBody>
                        <form id="event-form" onSubmit={submit} className="flex flex-col gap-lg">
                            <div className="flex flex-col gap-xs">
                                <Label htmlFor="ev-name">Nama Event *</Label>
                                <Input
                                    id="ev-name"
                                    value={data.name}
                                    onChange={(e) => setData("name", e.target.value)}
                                    placeholder="Nama event..."
                                    aria-invalid={!!errors.name}
                                />
                                {errors.name && <p className="text-[var(--font-base)] text-error-text">{errors.name}</p>}
                            </div>

                            <div className="grid grid-cols-2 gap-md">
                                <div className="flex flex-col gap-xs">
                                    <Label htmlFor="ev-type">Tipe *</Label>
                                    <Select id="ev-type" value={data.type} onChange={(e) => handleTypeChange(e.target.value)}>
                                        {EVENT_TYPES.map((t) => (
                                            <option key={t.value} value={t.value}>{t.label}</option>
                                        ))}
                                    </Select>
                                </div>
                                <div className="flex flex-col gap-xs">
                                    <Label htmlFor="ev-date">Tanggal *</Label>
                                    <Input
                                        id="ev-date"
                                        type="date"
                                        value={data.event_date}
                                        onChange={(e) => setData("event_date", e.target.value)}
                                        aria-invalid={!!errors.event_date}
                                    />
                                    {errors.event_date && <p className="text-[var(--font-base)] text-error-text">{errors.event_date}</p>}
                                </div>
                            </div>

                            {data.type === "custom" && (
                                <div className="flex flex-col gap-xs">
                                    <Label>Nama Tipe Custom *</Label>
                                    <Input
                                        value={data.custom_type}
                                        onChange={(e) => setData("custom_type", e.target.value)}
                                        placeholder="Misal: Workshop, 1-on-1, Coaching..."
                                    />
                                </div>
                            )}

                            <div className="flex flex-col gap-xs">
                                <Label htmlFor="ev-desc">Deskripsi</Label>
                                <Textarea
                                    id="ev-desc"
                                    value={data.description}
                                    onChange={(e) => setData("description", e.target.value)}
                                    placeholder="Detail event..."
                                    rows={3}
                                />
                            </div>

                            {data.agenda.length > 0 && (
                                <div>
                                    <button
                                        type="button"
                                        className="flex items-center gap-1 text-[var(--font-sm)] font-medium text-text-secondary hover:text-text-primary"
                                        onClick={() => setAgendaOpen(!agendaOpen)}
                                    >
                                        {agendaOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                                        Agenda ({data.agenda.length} sesi) — auto dari tipe
                                    </button>
                                    {agendaOpen && (
                                        <ol className="mt-sm flex flex-col gap-xs">
                                            {data.agenda.map((a, i) => (
                                                <li key={i} className="flex gap-sm rounded-xs bg-surface-subtle px-sm py-1 text-[var(--font-sm)]">
                                                    <span className="text-text-muted">{i + 1}.</span>
                                                    <span className="font-medium text-text-primary">{a.title}</span>
                                                    {a.duration && <span className="text-text-muted">{a.duration} mnt</span>}
                                                </li>
                                            ))}
                                        </ol>
                                    )}
                                </div>
                            )}

                            <div className="flex flex-col gap-xs">
                                <Label>Assign ke User (opsional)</Label>
                                <div className="flex flex-wrap gap-sm">
                                    {users.map((u) => (
                                        <button
                                            type="button"
                                            key={u.id}
                                            onClick={() => toggleAssignedUser(u.id)}
                                            className={
                                                data.assigned_user_ids.includes(u.id)
                                                    ? "rounded-xs bg-primary-subtle px-2 py-0.5 text-[var(--font-base)] font-medium text-primary-text"
                                                    : "rounded-xs bg-surface-raised px-2 py-0.5 text-[var(--font-base)] font-medium text-text-secondary"
                                            }
                                        >
                                            {u.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </form>
                    </DialogBody>
                    <DialogFooter>
                        <Button variant="secondary" onClick={() => setCreateOpen(false)}>Batal</Button>
                        <Button type="submit" form="event-form" disabled={processing}>
                            {processing ? "Menyimpan…" : "Simpan Event"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ── Detail Modal ───────────────────────────────────────── */}
            <Dialog open={!!detailEvent} onOpenChange={(open) => !open && setDetailEvent(null)}>
                <DialogContent size="md">
                    <DialogHeader>
                        <DialogTitle>{detailEvent?.name ?? ""}</DialogTitle>
                    </DialogHeader>
                    {detailEvent && (
                        <DialogBody className="flex flex-col gap-xl">
                            <div className="flex flex-wrap items-center gap-md">
                                <Badge variant={typeBadgeVariant(detailEvent.type)}>{detailEvent.type_label}</Badge>
                                <span className="text-[var(--font-base)] text-text-muted">{fmt(detailEvent.event_date)}</span>
                            </div>

                            {detailEvent.description && (
                                <p className="text-sm text-text-secondary">{detailEvent.description}</p>
                            )}

                            <AgendaList agenda={detailEvent.agenda} />

                            <div>
                                <p className="mb-md text-[var(--font-base)] font-medium uppercase tracking-wider text-text-muted">
                                    Daftar Peserta
                                </p>
                                <div className="flex flex-col gap-sm">
                                    {detailEvent.attendees.length === 0 && (
                                        <p className="text-[var(--font-base)] text-text-muted">Belum ada peserta.</p>
                                    )}
                                    {detailEvent.attendees.map((a) => (
                                        <div key={a.id} className="flex items-center gap-md rounded-sm bg-surface-subtle px-md py-sm">
                                            <span className="flex-1 text-[var(--font-base)] text-text-primary">{a.name}</span>
                                            {a.attended ? <Badge variant="success">Hadir</Badge> : <Badge variant="neutral">Belum</Badge>}
                                            {isLeader && !a.attended && (
                                                <Button variant="ghost" size="sm" onClick={() => overrideAttendance(detailEvent.id, a.id)} className="text-[var(--font-sm)]">
                                                    Override
                                                </Button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {isLeader && (
                                <div className="flex justify-end gap-sm border-t border-border pt-md">
                                    <Button variant="danger" size="sm" onClick={() => { setDetailEvent(null); setDeleteId(detailEvent.id); }}>
                                        Hapus Event
                                    </Button>
                                </div>
                            )}
                        </DialogBody>
                    )}
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                open={deleteId !== null}
                onOpenChange={(open) => !open && setDeleteId(null)}
                title="Hapus Event"
                description="Event ini akan dihapus (soft delete)."
                onConfirm={() => deleteId && destroy(deleteId)}
            />
        </AuthenticatedLayout>
    );
}
