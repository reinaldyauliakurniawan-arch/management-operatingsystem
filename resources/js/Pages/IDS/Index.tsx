import { useState } from "react";
import { useForm, Head, usePage, router } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";

interface Issue {
    id: number; title: string; description: string;
    priority: number; status: "open" | "resolved";
    owner: { id: number; name: string } | null;
}

const S: Record<string, any> = {
    label: { fontSize: 12, fontWeight: 500, color: "#6b6b6b", marginBottom: 6, letterSpacing: "0.02em" },
    input: { width: "100%", background: "#f0f0f0", border: "1px solid #e4e4e4", borderRadius: 8, padding: "8px 12px", fontSize: 14, color: "#1a1a1a", outline: "none" },
    select: { width: "100%", background: "#f0f0f0", border: "1px solid #e4e4e4", borderRadius: 8, padding: "8px 12px", fontSize: 14, color: "#1a1a1a", outline: "none", appearance: "none" as const },
    textarea: { width: "100%", background: "#f0f0f0", border: "1px solid #e4e4e4", borderRadius: 8, padding: "8px 12px", fontSize: 14, color: "#1a1a1a", outline: "none", resize: "vertical" as const, fontFamily: "inherit" },
    btnPrimary: { background: "#1a5c41", color: "#ffffff", border: "none", borderRadius: 9999, padding: "8px 20px", fontSize: 14, fontWeight: 500, cursor: "pointer" },
    btnSecondary: { background: "#f0f0f0", color: "#1a1a1a", border: "1px solid #e4e4e4", borderRadius: 8, padding: "8px 16px", fontSize: 14, cursor: "pointer" },
    btnDanger: { background: "#fef2f2", color: "#991b1b", border: "none", borderRadius: 8, padding: "4px 10px", fontSize: 12, cursor: "pointer" },
};

function Modal({ open, onClose, title, children }: any) {
    if (!open) return null;
    return (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={onClose}>
            <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)" }} />
            <div style={{ position: "relative", background: "#fff", borderRadius: 18, boxShadow: "0 8px 24px rgba(0,0,0,0.10)", width: "100%", maxWidth: 520, margin: 24 }} onClick={e => e.stopPropagation()}>
                <div style={{ padding: "20px 24px", borderBottom: "1px solid #e4e4e4" }}>
                    <h2 style={{ fontSize: 16, fontWeight: 600, color: "#1a1a1a", margin: 0, letterSpacing: "-0.01em" }}>{title}</h2>
                </div>
                <div style={{ padding: 24 }}>{children}</div>
            </div>
        </div>
    );
}

export default function IDSIndex({ issues, users }: { issues: { data: Issue[] }; users: any[] }) {
    const { auth } = usePage().props as any;
    const isLeader = auth.teamRole === "leader";
    const isMember = auth.teamRole === "member";
    const [createOpen, setCreateOpen] = useState(false);
    const { data, setData, post, processing, reset, errors } = useForm({
        title: "", description: "", priority: 5, owner_id: "",
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route("ids.store"), { onSuccess: () => { setCreateOpen(false); reset(); } });
    };

    const resolve = (id: number) => router.patch(route("ids.resolve", id), {}, { preserveScroll: true });
    const destroy = (id: number) => {
        if (!confirm("Hapus issue ini?")) return;
        router.delete(route("ids.destroy", id), { preserveScroll: true });
    };

    const issueList = issues.data;
    const open = issueList.filter(i => i.status === "open").length;
    const resolved = issueList.filter(i => i.status === "resolved").length;

    return (
        <AuthenticatedLayout>
            <Head title="Issues / IDS" />

            {/* Header */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", borderBottom: "1px solid #e4e4e4", paddingBottom: 24, marginBottom: 24 }}>
                <div>
                    <h1 style={{ fontSize: 24, fontWeight: 600, color: "#1a1a1a", margin: 0, letterSpacing: "-0.02em" }}>Issues / IDS</h1>
                    <p style={{ fontSize: 14, color: "#6b6b6b", margin: "4px 0 0" }}>Identify · Discuss · Solve</p>
                </div>
                <button onClick={() => setCreateOpen(true)} style={S.btnPrimary}>+ Identify Issue</button>
            </div>

            {/* Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16, marginBottom: 24, maxWidth: 400 }}>
                {[
                    { label: "Open", value: open, color: "#991b1b", bg: "#fef2f2" },
                    { label: "Resolved", value: resolved, color: "#1a5c41", bg: "#e8f0ec" },
                ].map(s => (
                    <div key={s.label} style={{ background: "#ffffff", border: "1px solid #e4e4e4", borderRadius: 18, padding: 24 }}>
                        <p style={{ fontSize: 12, fontWeight: 500, color: "#999999", letterSpacing: "0.02em", marginBottom: 8 }}>{s.label}</p>
                        <p style={{ fontSize: 32, fontWeight: 600, color: s.color, margin: 0, letterSpacing: "-0.02em" }}>{s.value}</p>
                    </div>
                ))}
            </div>

            {/* Table */}
            <div style={{ background: "#ffffff", border: "1px solid #e4e4e4", borderRadius: 18, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                        <tr style={{ background: "#f5f5f5" }}>
                            {["P", "Issue", "Owner", "Status", ""].map((h, i) => (
                                <th key={i} style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 500, color: "#6b6b6b", textTransform: "uppercase", letterSpacing: "0.04em" }}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {issueList.length === 0 && (
                            <tr><td colSpan={5} style={{ padding: "48px 16px", textAlign: "center", color: "#999999", fontSize: 14 }}>Tidak ada issue. Semua aman! 🎉</td></tr>
                        )}
                        {issueList.map((issue, i) => (
                            <tr key={issue.id} style={{ borderTop: i === 0 ? "none" : "1px solid #e4e4e4", opacity: issue.status === "resolved" ? 0.5 : 1 }}
                                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "#f5f5f5"}
                                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}>
                                <td style={{ padding: "12px 16px", width: 48 }}>
                                    <span style={{ fontSize: 13, fontWeight: 600, color: issue.priority >= 7 ? "#991b1b" : issue.priority >= 4 ? "#92400e" : "#6b6b6b" }}>{issue.priority}</span>
                                </td>
                                <td style={{ padding: "12px 16px" }}>
                                    <p style={{ fontSize: 13, fontWeight: 500, color: "#1a1a1a", margin: 0 }}>{issue.title}</p>
                                    {issue.description && <p style={{ fontSize: 12, color: "#999999", margin: "2px 0 0" }}>{issue.description.slice(0, 80)}{issue.description.length > 80 ? "…" : ""}</p>}
                                </td>
                                <td style={{ padding: "12px 16px", fontSize: 13, color: "#6b6b6b" }}>{issue.owner?.name ?? "—"}</td>
                                <td style={{ padding: "12px 16px" }}>
                                    {issue.status === "open"
                                        ? <span style={{ fontSize: 12, fontWeight: 500, background: "#fef2f2", color: "#991b1b", padding: "2px 8px", borderRadius: 4 }}>Open</span>
                                        : <span style={{ fontSize: 12, fontWeight: 500, background: "#e8f0ec", color: "#1a5c41", padding: "2px 8px", borderRadius: 4 }}>Resolved</span>}
                                </td>
                                <td style={{ padding: "12px 16px" }}>
                                    <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                                        {issue.status === "open" && (isLeader || isMember) && (
                                            <button onClick={() => resolve(issue.id)} style={{ background: "#e8f0ec", color: "#1a5c41", border: "none", borderRadius: 8, padding: "4px 10px", fontSize: 12, cursor: "pointer" }}>
                                                Solve
                                            </button>
                                        )}
                                        {isLeader && (
                                            <button onClick={() => destroy(issue.id)} style={S.btnDanger}>Hapus</button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Identify Issue">
                <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <div>
                        <p style={S.label}>Issue *</p>
                        <input value={data.title} onChange={e => setData("title", e.target.value)} placeholder="Apa masalahnya?" style={S.input} required />
                        {errors.title && <p style={{ fontSize: 12, color: "#991b1b", marginTop: 4 }}>{errors.title}</p>}
                    </div>
                    <div>
                        <p style={S.label}>Deskripsi</p>
                        <textarea value={data.description} onChange={e => setData("description", e.target.value)} placeholder="Detail masalah..." rows={3} style={S.textarea} />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                        <div>
                            <p style={S.label}>Priority (0–10)</p>
                            <input type="number" min={0} max={10} value={data.priority} onChange={e => setData("priority", parseInt(e.target.value))} style={S.input} />
                        </div>
                        <div>
                            <p style={S.label}>Owner</p>
                            <select value={data.owner_id} onChange={e => setData("owner_id", e.target.value)} style={S.select}>
                                <option value="">— Tidak ada —</option>
                                {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                            </select>
                        </div>
                    </div>
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, paddingTop: 8, borderTop: "1px solid #e4e4e4" }}>
                        <button type="button" onClick={() => setCreateOpen(false)} style={S.btnSecondary}>Batal</button>
                        <button type="submit" disabled={processing} style={{ ...S.btnPrimary, opacity: processing ? 0.6 : 1 }}>
                            {processing ? "Menyimpan…" : "Identify"}
                        </button>
                    </div>
                </form>
            </Modal>
        </AuthenticatedLayout>
    );
}
