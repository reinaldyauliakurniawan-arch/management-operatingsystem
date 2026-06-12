import { useState } from "react";
import { useForm, Head, usePage, router } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";

interface ToDo {
    id: number;
    title: string;
    owner: { id: number; name: string };
    due_date: string;
    is_completed: boolean;
    is_overdue: boolean;
}

const S: Record<string, any> = {
    label: {
        fontSize: 12,
        fontWeight: 500,
        color: "#6b6b6b",
        marginBottom: 6,
        letterSpacing: "0.02em",
    },
    input: {
        width: "100%",
        background: "#f0f0f0",
        border: "1px solid #e4e4e4",
        borderRadius: 8,
        padding: "8px 12px",
        fontSize: 14,
        color: "#1a1a1a",
        outline: "none",
    },
    select: {
        width: "100%",
        background: "#f0f0f0",
        border: "1px solid #e4e4e4",
        borderRadius: 8,
        padding: "8px 12px",
        fontSize: 14,
        color: "#1a1a1a",
        outline: "none",
        appearance: "none" as const,
    },
    btnPrimary: {
        background: "#1a5c41",
        color: "#ffffff",
        border: "none",
        borderRadius: 9999,
        padding: "8px 20px",
        fontSize: 14,
        fontWeight: 500,
        cursor: "pointer",
    },
    btnSecondary: {
        background: "#f0f0f0",
        color: "#1a1a1a",
        border: "1px solid #e4e4e4",
        borderRadius: 8,
        padding: "8px 16px",
        fontSize: 14,
        cursor: "pointer",
    },
    btnDanger: {
        background: "#fef2f2",
        color: "#991b1b",
        border: "none",
        borderRadius: 8,
        padding: "4px 10px",
        fontSize: 12,
        cursor: "pointer",
    },
};

function Modal({ open, onClose, title, children }: any) {
    if (!open) return null;
    return (
        <div
            style={{
                position: "fixed",
                inset: 0,
                zIndex: 50,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
            }}
            onClick={onClose}
        >
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    background: "rgba(0,0,0,0.4)",
                }}
            />
            <div
                style={{
                    position: "relative",
                    background: "#fff",
                    borderRadius: 18,
                    boxShadow: "0 8px 24px rgba(0,0,0,0.10)",
                    width: "100%",
                    maxWidth: 480,
                    margin: 24,
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <div
                    style={{
                        padding: "20px 24px",
                        borderBottom: "1px solid #e4e4e4",
                    }}
                >
                    <h2
                        style={{
                            fontSize: 16,
                            fontWeight: 600,
                            color: "#1a1a1a",
                            margin: 0,
                            letterSpacing: "-0.01em",
                        }}
                    >
                        {title}
                    </h2>
                </div>
                <div style={{ padding: 24 }}>{children}</div>
            </div>
        </div>
    );
}

export default function ToDoIndex({
    todos,
    users,
}: {
    todos: { data: ToDo[] };
    users: any[];
}) {
    const { auth } = usePage().props as any;
    const isLeader = auth.teamRole === "leader";
    const userId = auth.user.id;
    const [createOpen, setCreateOpen] = useState(false);
    const { data, setData, post, processing, reset, errors } = useForm({
        title: "",
        owner_id: users[0]?.id || "",
        due_date: new Date().toISOString().split("T")[0],
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route("todos.store"), {
            onSuccess: () => {
                setCreateOpen(false);
                reset();
            },
        });
    };

    const toggle = (id: number) =>
        router.patch(route("todos.toggle", id), {}, { preserveScroll: true });
    const destroy = (id: number) => {
        if (!confirm("Hapus to-do ini?")) return;
        router.delete(route("todos.destroy", id), { preserveScroll: true });
    };
    const carryForward = () =>
        router.post(route("todos.carryForward"), {}, { preserveScroll: true });

    const todoList = todos.data;
    const pending = todoList.filter((t) => !t.is_completed);
    const overdue = pending.filter((t) => t.is_overdue);
    const done = todoList.filter((t) => t.is_completed);

    const canDelete = (todo: ToDo) => isLeader || todo.owner.id === userId;

    return (
        <AuthenticatedLayout>
            <Head title="To-Do" />

            {/* Header */}
            <div
                style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    borderBottom: "1px solid #e4e4e4",
                    paddingBottom: 24,
                    marginBottom: 24,
                }}
            >
                <div>
                    <h1
                        style={{
                            fontSize: 24,
                            fontWeight: 600,
                            color: "#1a1a1a",
                            margin: 0,
                            letterSpacing: "-0.02em",
                        }}
                    >
                        To-Do
                    </h1>
                    <p
                        style={{
                            fontSize: 14,
                            color: "#6b6b6b",
                            margin: "4px 0 0",
                        }}
                    >
                        Weekly action items tim
                    </p>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                    {isLeader && (
                        <button onClick={carryForward} style={S.btnSecondary}>
                            Carry Forward
                        </button>
                    )}
                    <button
                        onClick={() => setCreateOpen(true)}
                        style={S.btnPrimary}
                    >
                        + Tambah To-Do
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: 16,
                    marginBottom: 24,
                }}
            >
                {[
                    {
                        label: "Pending",
                        value: pending.length,
                        color: "#1a1a1a",
                    },
                    {
                        label: "Overdue",
                        value: overdue.length,
                        color: "#991b1b",
                    },
                    { label: "Done", value: done.length, color: "#1a5c41" },
                ].map((s) => (
                    <div
                        key={s.label}
                        style={{
                            background: "#ffffff",
                            border: "1px solid #e4e4e4",
                            borderRadius: 18,
                            padding: 24,
                        }}
                    >
                        <p
                            style={{
                                fontSize: 12,
                                fontWeight: 500,
                                color: "#999999",
                                letterSpacing: "0.02em",
                                marginBottom: 8,
                            }}
                        >
                            {s.label}
                        </p>
                        <p
                            style={{
                                fontSize: 32,
                                fontWeight: 600,
                                color: s.color,
                                margin: 0,
                                letterSpacing: "-0.02em",
                            }}
                        >
                            {s.value}
                        </p>
                    </div>
                ))}
            </div>

            {/* List */}
            <div
                style={{
                    background: "#ffffff",
                    border: "1px solid #e4e4e4",
                    borderRadius: 18,
                    overflow: "hidden",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                }}
            >
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                        <tr style={{ background: "#f5f5f5" }}>
                            {[
                                "",
                                "To-Do",
                                "Owner",
                                "Due Date",
                                "Status",
                                "",
                            ].map((h, i) => (
                                <th
                                    key={i}
                                    style={{
                                        padding: "12px 16px",
                                        textAlign: "left",
                                        fontSize: 12,
                                        fontWeight: 500,
                                        color: "#6b6b6b",
                                        textTransform: "uppercase",
                                        letterSpacing: "0.04em",
                                    }}
                                >
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {todoList.length === 0 && (
                            <tr>
                                <td
                                    colSpan={6}
                                    style={{
                                        padding: "48px 16px",
                                        textAlign: "center",
                                        color: "#999999",
                                        fontSize: 14,
                                    }}
                                >
                                    Belum ada to-do.
                                </td>
                            </tr>
                        )}
                        {todoList.map((todo, i) => (
                            <tr
                                key={todo.id}
                                style={{
                                    borderTop:
                                        i === 0 ? "none" : "1px solid #e4e4e4",
                                    opacity: todo.is_completed ? 0.5 : 1,
                                }}
                                onMouseEnter={(e) =>
                                    ((
                                        e.currentTarget as HTMLElement
                                    ).style.background = "#f5f5f5")
                                }
                                onMouseLeave={(e) =>
                                    ((
                                        e.currentTarget as HTMLElement
                                    ).style.background = "transparent")
                                }
                            >
                                <td style={{ padding: "12px 16px", width: 40 }}>
                                    <input
                                        type="checkbox"
                                        checked={todo.is_completed}
                                        onChange={() => toggle(todo.id)}
                                        style={{
                                            width: 16,
                                            height: 16,
                                            accentColor: "#1a5c41",
                                            cursor: "pointer",
                                        }}
                                    />
                                </td>
                                <td style={{ padding: "12px 16px" }}>
                                    <span
                                        style={{
                                            fontSize: 13,
                                            fontWeight: 500,
                                            color: "#1a1a1a",
                                            textDecoration: todo.is_completed
                                                ? "line-through"
                                                : "none",
                                        }}
                                    >
                                        {todo.title}
                                    </span>
                                </td>
                                <td
                                    style={{
                                        padding: "12px 16px",
                                        fontSize: 13,
                                        color: "#6b6b6b",
                                    }}
                                >
                                    {todo.owner.name}
                                </td>
                                <td
                                    style={{
                                        padding: "12px 16px",
                                        fontSize: 13,
                                        whiteSpace: "nowrap",
                                    }}
                                >
                                    <span
                                        style={{
                                            color: todo.is_overdue
                                                ? "#991b1b"
                                                : "#6b6b6b",
                                            fontWeight: todo.is_overdue
                                                ? 500
                                                : 400,
                                        }}
                                    >
                                        {todo.due_date}
                                        {todo.is_overdue && " ⚠"}
                                    </span>
                                </td>
                                <td style={{ padding: "12px 16px" }}>
                                    {todo.is_completed ? (
                                        <span
                                            style={{
                                                fontSize: 12,
                                                fontWeight: 500,
                                                background: "#e8f0ec",
                                                color: "#1a5c41",
                                                padding: "2px 8px",
                                                borderRadius: 4,
                                            }}
                                        >
                                            Done
                                        </span>
                                    ) : todo.is_overdue ? (
                                        <span
                                            style={{
                                                fontSize: 12,
                                                fontWeight: 500,
                                                background: "#fef2f2",
                                                color: "#991b1b",
                                                padding: "2px 8px",
                                                borderRadius: 4,
                                            }}
                                        >
                                            Overdue
                                        </span>
                                    ) : (
                                        <span
                                            style={{
                                                fontSize: 12,
                                                fontWeight: 500,
                                                background: "#f0f0f0",
                                                color: "#6b6b6b",
                                                padding: "2px 8px",
                                                borderRadius: 4,
                                            }}
                                        >
                                            Pending
                                        </span>
                                    )}
                                </td>
                                <td
                                    style={{
                                        padding: "12px 16px",
                                        textAlign: "right",
                                    }}
                                >
                                    {canDelete(todo) && (
                                        <button
                                            onClick={() => destroy(todo.id)}
                                            style={S.btnDanger}
                                        >
                                            Hapus
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Modal
                open={createOpen}
                onClose={() => setCreateOpen(false)}
                title="Tambah To-Do"
            >
                <form
                    onSubmit={submit}
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 16,
                    }}
                >
                    <div>
                        <p style={S.label}>To-Do *</p>
                        <input
                            value={data.title}
                            onChange={(e) => setData("title", e.target.value)}
                            placeholder="Apa yang perlu dikerjakan?"
                            style={S.input}
                            required
                        />
                        {errors.title && (
                            <p
                                style={{
                                    fontSize: 12,
                                    color: "#991b1b",
                                    marginTop: 4,
                                }}
                            >
                                {errors.title}
                            </p>
                        )}
                    </div>
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: 12,
                        }}
                    >
                        <div>
                            <p style={S.label}>Owner *</p>
                            <select
                                value={data.owner_id}
                                onChange={(e) =>
                                    setData("owner_id", e.target.value)
                                }
                                style={S.select}
                            >
                                {users.map((u) => (
                                    <option key={u.id} value={u.id}>
                                        {u.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <p style={S.label}>Due Date *</p>
                            <input
                                type="date"
                                value={data.due_date}
                                onChange={(e) =>
                                    setData("due_date", e.target.value)
                                }
                                style={S.input}
                                required
                            />
                        </div>
                    </div>
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "flex-end",
                            gap: 8,
                            paddingTop: 8,
                            borderTop: "1px solid #e4e4e4",
                        }}
                    >
                        <button
                            type="button"
                            onClick={() => setCreateOpen(false)}
                            style={S.btnSecondary}
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={processing}
                            style={{
                                ...S.btnPrimary,
                                opacity: processing ? 0.6 : 1,
                            }}
                        >
                            {processing ? "Menyimpan…" : "Simpan"}
                        </button>
                    </div>
                </form>
            </Modal>
        </AuthenticatedLayout>
    );
}
