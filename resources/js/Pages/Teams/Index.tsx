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
import { Label } from "@/Components/ui/label";
import { Select } from "@/Components/ui/select";
import { EmptyState } from "@/Components/ui/empty-state";
import { ConfirmDialog } from "@/Components/ui/confirm-dialog";
import {
    Users,
    ChevronDown,
    ChevronUp,
    ShieldCheck,
    MoreHorizontal,
    Pencil,
    KeyRound,
    Trash2,
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
} from "@/Components/ui/dropdown-menu";

interface Member {
    id: number;
    user_id: number;
    name: string;
    email: string;
    role: "leader" | "member" | "tutor";
    is_integrator: boolean;
}

interface Team {
    id: number;
    name: string;
    type: "leadership" | "departmental" | "project";
    parent_team_id: number | null;
    member_count: number;
    leaders: { id: number; name: string }[];
}

interface User {
    id: number;
    name: string;
    email: string;
}

interface SystemUser extends User {
    is_org_admin: boolean;
    created_at: string;
}

const typeLabel: Record<Team["type"], string> = {
    leadership: "Leadership",
    departmental: "Departmental",
    project: "Project",
};

const roleBadge: Record<Member["role"], "success" | "neutral" | "warning"> = {
    leader: "success",
    member: "neutral",
    tutor: "warning",
};

export default function TeamsIndex({
    teams,
    allUsers,
    allSystemUsers = [],
    defaultTab = "teams",
}: {
    teams: Team[];
    allUsers: User[];
    allSystemUsers?: SystemUser[];
    defaultTab?: "teams" | "users";
}) {
    const { auth } = usePage().props as any;
    const isOrgAdmin = auth.user?.is_org_admin;
    const activeTeamId = auth.activeTeamId;
    const currentUserId = auth.user?.id;

    const [tab, setTab] = useState<"teams" | "users">(defaultTab);

    // Teams state
    const [expandedTeam, setExpandedTeam] = useState<number | null>(null);
    const [teamMembers, setTeamMembers] = useState<Record<number, Member[]>>(
        {},
    );
    const [loadingTeam, setLoadingTeam] = useState<number | null>(null);
    const [createTeamOpen, setCreateTeamOpen] = useState(false);
    const [addMemberOpen, setAddMemberOpen] = useState(false);
    const [editMember, setEditMember] = useState<Member | null>(null);
    const [deleteMemberId, setDeleteMemberId] = useState<number | null>(null);
    const [deleteTeamId, setDeleteTeamId] = useState<number | null>(null);

    // Users state
    const [createUserOpen, setCreateUserOpen] = useState(false);
    const [editUserOpen, setEditUserOpen] = useState(false);
    const [resetPasswordOpen, setResetPasswordOpen] = useState(false);
    const [deleteUserId, setDeleteUserId] = useState<number | null>(null);
    const [selectedUser, setSelectedUser] = useState<SystemUser | null>(null);

    const teamForm = useForm({
        name: "",
        type: "departmental" as Team["type"],
        parent_team_id: "" as string | number,
        leader_user_id: "" as string | number,
    });

    const memberForm = useForm({
        user_id: "" as string | number,
        role: "member" as Member["role"],
        is_integrator: false,
    });

    const editMemberForm = useForm({
        role: "member" as Member["role"],
        is_integrator: false,
    });

    const userForm = useForm({
        name: "",
        email: "",
        password: "",
        is_org_admin: false,
        team_id: "" as string | number,
        role: "member" as Member["role"],
    });

    const editUserForm = useForm({
        name: "",
        email: "",
        is_org_admin: false,
    });

    const resetPasswordForm = useForm({
        password: "",
    });

    const toggleExpand = async (teamId: number) => {
        if (expandedTeam === teamId) {
            setExpandedTeam(null);
            return;
        }
        setExpandedTeam(teamId);
        if (!teamMembers[teamId]) {
            setLoadingTeam(teamId);
            try {
                const res = await fetch(
                    route("teams.members.index") + "?team_id=" + teamId,
                    { headers: { Accept: "application/json" } },
                );
                const data = await res.json();
                setTeamMembers((prev) => ({
                    ...prev,
                    [teamId]: data.members ?? [],
                }));
            } catch (e) {
                console.error(e);
            } finally {
                setLoadingTeam(null);
            }
        }
    };

    const submitTeam = (e: React.FormEvent) => {
        e.preventDefault();
        teamForm.post(route("teams.store"), {
            onSuccess: () => {
                setCreateTeamOpen(false);
                teamForm.reset();
            },
        });
    };

    const submitMember = (e: React.FormEvent) => {
        e.preventDefault();
        memberForm.post(route("teams.members.store"), {
            onSuccess: () => {
                setAddMemberOpen(false);
                memberForm.reset();
                setTeamMembers((prev) => {
                    const u = { ...prev };
                    if (expandedTeam) delete u[expandedTeam];
                    return u;
                });
            },
        });
    };

    const submitEditMember = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editMember) return;
        editMemberForm.patch(route("teams.members.update", editMember.id), {
            onSuccess: () => {
                setEditMember(null);
                setTeamMembers((prev) => {
                    const u = { ...prev };
                    if (expandedTeam) delete u[expandedTeam];
                    return u;
                });
            },
        });
    };

    const submitUser = (e: React.FormEvent) => {
        e.preventDefault();
        userForm.post(route("users.store"), {
            onSuccess: () => {
                setCreateUserOpen(false);
                userForm.reset();
            },
        });
    };

    const submitEditUser = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUser) return;
        editUserForm.patch(route("users.update", selectedUser.id), {
            onSuccess: () => {
                setEditUserOpen(false);
                setSelectedUser(null);
            },
        });
    };

    const submitResetPassword = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUser) return;
        resetPasswordForm.patch(route("users.resetPassword", selectedUser.id), {
            onSuccess: () => {
                setResetPasswordOpen(false);
                resetPasswordForm.reset();
                setSelectedUser(null);
            },
        });
    };

    const destroyUser = (userId: number) => {
        router.delete(route("users.destroy", userId), {
            preserveScroll: true,
            onSuccess: () => setDeleteUserId(null),
        });
    };

    const destroyMember = (memberId: number) => {
        router.delete(route("teams.members.destroy", memberId), {
            preserveScroll: true,
            onSuccess: () => {
                setDeleteMemberId(null);
                setTeamMembers((prev) => {
                    const u = { ...prev };
                    if (expandedTeam) delete u[expandedTeam];
                    return u;
                });
            },
        });
    };

    const destroyTeam = (teamId: number) => {
        router.delete(route("teams.destroy", teamId), {
            preserveScroll: true,
            onSuccess: () => setDeleteTeamId(null),
        });
    };

    const switchTeam = (teamId: number) => {
        router.post(route("teams.switch"), { team_id: teamId });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Teams" />

            <PageHeader
                title="Manajemen Team & User"
                subtitle="Kelola team, anggota, dan akun user dalam organisasi."
                action={
                    isOrgAdmin && (
                        <div className="flex gap-2">
                            {tab === "teams" && (
                                <Button onClick={() => setCreateTeamOpen(true)}>
                                    + Buat Team
                                </Button>
                            )}
                            {tab === "users" && (
                                <Button onClick={() => setCreateUserOpen(true)}>
                                    + Buat User
                                </Button>
                            )}
                        </div>
                    )
                }
            />

            {/* Tab toggle */}
            <div className="flex gap-1 mb-4 border-b border-border">
                <button
                    onClick={() => setTab("teams")}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                        tab === "teams"
                            ? "border-primary text-primary"
                            : "border-transparent text-text-muted hover:text-text-primary"
                    }`}
                >
                    Teams
                </button>
                <button
                    onClick={() => setTab("users")}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                        tab === "users"
                            ? "border-primary text-primary"
                            : "border-transparent text-text-muted hover:text-text-primary"
                    }`}
                >
                    Users
                </button>
            </div>

            {/* ── TAB TEAMS ── */}
            {tab === "teams" &&
                (teams.length === 0 ? (
                    <Card>
                        <CardContent className="py-16">
                            <EmptyState
                                title="Belum ada team"
                                description="Buat team pertama untuk mulai mengelola anggota."
                            />
                        </CardContent>
                    </Card>
                ) : (
                    <div className="flex flex-col gap-4">
                        {teams.map((team) => (
                            <Card key={team.id}>
                                <CardContent className="p-0">
                                    <div className="flex items-center justify-between px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <Users className="size-4 text-text-muted" />
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[15px] font-semibold text-text-primary">
                                                        {team.name}
                                                    </span>
                                                    {team.id ===
                                                        activeTeamId && (
                                                        <Badge variant="success">
                                                            Aktif
                                                        </Badge>
                                                    )}
                                                    <Badge variant="neutral">
                                                        {typeLabel[team.type]}
                                                    </Badge>
                                                </div>
                                                <p className="text-[12px] text-text-muted mt-0.5">
                                                    {team.member_count} anggota
                                                    {team.leaders.length > 0 &&
                                                        ` · Leader: ${team.leaders.map((l) => l.name).join(", ")}`}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {team.id !== activeTeamId && (
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    onClick={() =>
                                                        switchTeam(team.id)
                                                    }
                                                >
                                                    Switch ke Team Ini
                                                </Button>
                                            )}
                                            {isOrgAdmin && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-error hover:bg-error-subtle"
                                                    onClick={() =>
                                                        setDeleteTeamId(team.id)
                                                    }
                                                >
                                                    Hapus
                                                </Button>
                                            )}
                                            <button
                                                onClick={() =>
                                                    toggleExpand(team.id)
                                                }
                                                className="p-1 text-text-muted hover:text-text-primary"
                                            >
                                                {expandedTeam === team.id ? (
                                                    <ChevronUp className="size-4" />
                                                ) : (
                                                    <ChevronDown className="size-4" />
                                                )}
                                            </button>
                                        </div>
                                    </div>

                                    {expandedTeam === team.id && (
                                        <div className="border-t border-border">
                                            {loadingTeam === team.id ? (
                                                <p className="px-6 py-4 text-[13px] text-text-muted">
                                                    Memuat anggota...
                                                </p>
                                            ) : (
                                                <>
                                                    <Table>
                                                        <TableHeader>
                                                            <TableRow>
                                                                <TableHead>
                                                                    Nama
                                                                </TableHead>
                                                                <TableHead>
                                                                    Email
                                                                </TableHead>
                                                                <TableHead>
                                                                    Role
                                                                </TableHead>
                                                                <TableHead />
                                                            </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                            {(
                                                                teamMembers[
                                                                    team.id
                                                                ] ?? []
                                                            ).length === 0 ? (
                                                                <TableRow>
                                                                    <TableCell
                                                                        colSpan={
                                                                            4
                                                                        }
                                                                        className="text-center text-[13px] text-text-muted py-6"
                                                                    >
                                                                        Belum
                                                                        ada
                                                                        anggota.
                                                                    </TableCell>
                                                                </TableRow>
                                                            ) : (
                                                                (
                                                                    teamMembers[
                                                                        team.id
                                                                    ] ?? []
                                                                ).map((m) => (
                                                                    <TableRow
                                                                        key={
                                                                            m.id
                                                                        }
                                                                    >
                                                                        <TableCell className="font-medium">
                                                                            {
                                                                                m.name
                                                                            }
                                                                        </TableCell>
                                                                        <TableCell className="text-text-secondary">
                                                                            {
                                                                                m.email
                                                                            }
                                                                        </TableCell>
                                                                        <TableCell>
                                                                            <Badge
                                                                                variant={
                                                                                    roleBadge[
                                                                                        m
                                                                                            .role
                                                                                    ]
                                                                                }
                                                                            >
                                                                                {
                                                                                    m.role
                                                                                }
                                                                            </Badge>
                                                                        </TableCell>
                                                                        <TableCell className="text-right">
                                                                            {isOrgAdmin && (
                                                                                <div className="flex justify-end gap-1">
                                                                                    <Button
                                                                                        variant="ghost"
                                                                                        size="sm"
                                                                                        onClick={() => {
                                                                                            setEditMember(
                                                                                                m,
                                                                                            );
                                                                                            editMemberForm.setData(
                                                                                                {
                                                                                                    role: m.role,
                                                                                                    is_integrator:
                                                                                                        m.is_integrator,
                                                                                                },
                                                                                            );
                                                                                        }}
                                                                                    >
                                                                                        Edit
                                                                                        Role
                                                                                    </Button>
                                                                                    <Button
                                                                                        variant="ghost"
                                                                                        size="sm"
                                                                                        className="text-error hover:bg-error-subtle"
                                                                                        onClick={() =>
                                                                                            setDeleteMemberId(
                                                                                                m.id,
                                                                                            )
                                                                                        }
                                                                                    >
                                                                                        Hapus
                                                                                    </Button>
                                                                                </div>
                                                                            )}
                                                                        </TableCell>
                                                                    </TableRow>
                                                                ))
                                                            )}
                                                        </TableBody>
                                                    </Table>
                                                    {isOrgAdmin && (
                                                        <div className="px-6 py-3 border-t border-border">
                                                            <Button
                                                                variant="secondary"
                                                                size="sm"
                                                                onClick={() =>
                                                                    setAddMemberOpen(
                                                                        true,
                                                                    )
                                                                }
                                                            >
                                                                + Tambah Anggota
                                                            </Button>
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ))}

            {/* ── TAB USERS ── */}
            {tab === "users" &&
                (allSystemUsers.length === 0 ? (
                    <Card>
                        <CardContent className="py-16">
                            <EmptyState
                                title="Belum ada user"
                                description="Buat user pertama untuk mulai mengelola akses."
                            />
                        </CardContent>
                    </Card>
                ) : (
                    <Card>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Nama</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Role</TableHead>
                                        <TableHead>Dibuat</TableHead>
                                        <TableHead />
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {allSystemUsers.map((u) => (
                                        <TableRow key={u.id}>
                                            <TableCell className="font-medium">
                                                {u.name}
                                            </TableCell>
                                            <TableCell className="text-text-secondary">
                                                {u.email}
                                            </TableCell>
                                            <TableCell>
                                                {u.is_org_admin ? (
                                                    <Badge variant="success">
                                                        <ShieldCheck className="size-3 mr-1 inline" />
                                                        Org Admin
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="neutral">
                                                        Member
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-text-muted text-[13px]">
                                                {new Date(
                                                    u.created_at,
                                                ).toLocaleDateString("id-ID", {
                                                    day: "numeric",
                                                    month: "short",
                                                    year: "numeric",
                                                })}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger className="inline-flex items-center justify-center h-7 w-7 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                                                        <MoreHorizontal className="size-4 text-text-muted" />
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem
                                                            onClick={() => {
                                                                setSelectedUser(
                                                                    u,
                                                                );
                                                                editUserForm.setData(
                                                                    {
                                                                        name: u.name,
                                                                        email: u.email,
                                                                        is_org_admin:
                                                                            u.is_org_admin,
                                                                    },
                                                                );
                                                                setEditUserOpen(
                                                                    true,
                                                                );
                                                            }}
                                                        >
                                                            <Pencil className="size-4 mr-2" />
                                                            Edit
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => {
                                                                setSelectedUser(
                                                                    u,
                                                                );
                                                                resetPasswordForm.reset();
                                                                setResetPasswordOpen(
                                                                    true,
                                                                );
                                                            }}
                                                        >
                                                            <KeyRound className="size-4 mr-2" />
                                                            Reset Password
                                                        </DropdownMenuItem>
                                                        {u.id !==
                                                            currentUserId && (
                                                            <>
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem
                                                                    className="text-error"
                                                                    onClick={() =>
                                                                        setDeleteUserId(
                                                                            u.id,
                                                                        )
                                                                    }
                                                                >
                                                                    <Trash2 className="size-4 mr-2" />
                                                                    Hapus
                                                                </DropdownMenuItem>
                                                            </>
                                                        )}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                ))}

            {/* Modal Buat Team */}
            <Dialog open={createTeamOpen} onOpenChange={setCreateTeamOpen}>
                <DialogContent size="md">
                    <DialogHeader>
                        <DialogTitle>Buat Team Baru</DialogTitle>
                    </DialogHeader>
                    <DialogBody>
                        <form
                            id="team-create-form"
                            onSubmit={submitTeam}
                            className="flex flex-col gap-md"
                        >
                            <div className="flex flex-col gap-xs">
                                <Label>Nama Team *</Label>
                                <Input
                                    value={teamForm.data.name}
                                    onChange={(e) =>
                                        teamForm.setData("name", e.target.value)
                                    }
                                    placeholder="Misal: Marketing Team"
                                    aria-invalid={!!teamForm.errors.name}
                                />
                                {teamForm.errors.name && (
                                    <p className="text-[12px] text-error-text">
                                        {teamForm.errors.name}
                                    </p>
                                )}
                            </div>
                            <div className="flex flex-col gap-xs">
                                <Label>Tipe Team *</Label>
                                <Select
                                    value={teamForm.data.type}
                                    onChange={(e) =>
                                        teamForm.setData(
                                            "type",
                                            e.target.value as Team["type"],
                                        )
                                    }
                                >
                                    <option value="leadership">
                                        Leadership
                                    </option>
                                    <option value="departmental">
                                        Departmental
                                    </option>
                                    <option value="project">Project</option>
                                </Select>
                            </div>
                            <div className="flex flex-col gap-xs">
                                <Label>Leader *</Label>
                                <Select
                                    value={teamForm.data.leader_user_id}
                                    onChange={(e) =>
                                        teamForm.setData(
                                            "leader_user_id",
                                            e.target.value,
                                        )
                                    }
                                    aria-invalid={
                                        !!teamForm.errors.leader_user_id
                                    }
                                >
                                    <option value="">— Pilih Leader —</option>
                                    {allUsers.map((u) => (
                                        <option key={u.id} value={u.id}>
                                            {u.name}
                                        </option>
                                    ))}
                                </Select>
                                {teamForm.errors.leader_user_id && (
                                    <p className="text-[12px] text-error-text">
                                        {teamForm.errors.leader_user_id}
                                    </p>
                                )}
                            </div>
                            <div className="flex flex-col gap-xs">
                                <Label>Parent Team (opsional)</Label>
                                <Select
                                    value={teamForm.data.parent_team_id}
                                    onChange={(e) =>
                                        teamForm.setData(
                                            "parent_team_id",
                                            e.target.value,
                                        )
                                    }
                                >
                                    <option value="">— Tidak ada —</option>
                                    {teams.map((t) => (
                                        <option key={t.id} value={t.id}>
                                            {t.name}
                                        </option>
                                    ))}
                                </Select>
                            </div>
                        </form>
                    </DialogBody>
                    <DialogFooter>
                        <Button
                            variant="secondary"
                            onClick={() => setCreateTeamOpen(false)}
                        >
                            Batal
                        </Button>
                        <Button
                            type="submit"
                            form="team-create-form"
                            disabled={teamForm.processing}
                        >
                            {teamForm.processing ? "Menyimpan…" : "Buat Team"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal Tambah Anggota */}
            <Dialog open={addMemberOpen} onOpenChange={setAddMemberOpen}>
                <DialogContent size="sm">
                    <DialogHeader>
                        <DialogTitle>Tambah Anggota</DialogTitle>
                    </DialogHeader>
                    <DialogBody>
                        <form
                            id="member-add-form"
                            onSubmit={submitMember}
                            className="flex flex-col gap-md"
                        >
                            <div className="flex flex-col gap-xs">
                                <Label>User *</Label>
                                <Select
                                    value={memberForm.data.user_id}
                                    onChange={(e) =>
                                        memberForm.setData(
                                            "user_id",
                                            e.target.value,
                                        )
                                    }
                                    aria-invalid={!!memberForm.errors.user_id}
                                >
                                    <option value="">— Pilih User —</option>
                                    {allUsers.map((u) => (
                                        <option key={u.id} value={u.id}>
                                            {u.name} ({u.email})
                                        </option>
                                    ))}
                                </Select>
                                {memberForm.errors.user_id && (
                                    <p className="text-[12px] text-error-text">
                                        {memberForm.errors.user_id}
                                    </p>
                                )}
                            </div>
                            <div className="flex flex-col gap-xs">
                                <Label>Role *</Label>
                                <Select
                                    value={memberForm.data.role}
                                    onChange={(e) =>
                                        memberForm.setData(
                                            "role",
                                            e.target.value as Member["role"],
                                        )
                                    }
                                >
                                    <option value="member">Member</option>
                                    <option value="tutor">Tutor</option>
                                    <option value="leader">Leader</option>
                                </Select>
                            </div>
                        </form>
                    </DialogBody>
                    <DialogFooter>
                        <Button
                            variant="secondary"
                            onClick={() => setAddMemberOpen(false)}
                        >
                            Batal
                        </Button>
                        <Button
                            type="submit"
                            form="member-add-form"
                            disabled={memberForm.processing}
                        >
                            {memberForm.processing
                                ? "Menyimpan…"
                                : "Tambah Anggota"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal Edit Role */}
            <Dialog
                open={!!editMember}
                onOpenChange={(open) => !open && setEditMember(null)}
            >
                <DialogContent size="sm">
                    <DialogHeader>
                        <DialogTitle>
                            Edit Role — {editMember?.name}
                        </DialogTitle>
                    </DialogHeader>
                    <DialogBody>
                        <form
                            id="member-edit-form"
                            onSubmit={submitEditMember}
                            className="flex flex-col gap-md"
                        >
                            <div className="flex flex-col gap-xs">
                                <Label>Role *</Label>
                                <Select
                                    value={editMemberForm.data.role}
                                    onChange={(e) =>
                                        editMemberForm.setData(
                                            "role",
                                            e.target.value as Member["role"],
                                        )
                                    }
                                >
                                    <option value="member">Member</option>
                                    <option value="tutor">Tutor</option>
                                    <option value="leader">Leader</option>
                                </Select>
                            </div>
                        </form>
                    </DialogBody>
                    <DialogFooter>
                        <Button
                            variant="secondary"
                            onClick={() => setEditMember(null)}
                        >
                            Batal
                        </Button>
                        <Button
                            type="submit"
                            form="member-edit-form"
                            disabled={editMemberForm.processing}
                        >
                            {editMemberForm.processing
                                ? "Menyimpan…"
                                : "Update"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal Buat User */}
            <Dialog open={createUserOpen} onOpenChange={setCreateUserOpen}>
                <DialogContent size="sm">
                    <DialogHeader>
                        <DialogTitle>Buat User Baru</DialogTitle>
                    </DialogHeader>
                    <DialogBody>
                        <form
                            id="user-create-form"
                            onSubmit={submitUser}
                            className="flex flex-col gap-md"
                        >
                            <div className="flex flex-col gap-xs">
                                <Label>Nama *</Label>
                                <Input
                                    value={userForm.data.name}
                                    onChange={(e) =>
                                        userForm.setData("name", e.target.value)
                                    }
                                    placeholder="John Doe"
                                    aria-invalid={!!userForm.errors.name}
                                />
                                {userForm.errors.name && (
                                    <p className="text-[12px] text-error-text">
                                        {userForm.errors.name}
                                    </p>
                                )}
                            </div>
                            <div className="flex flex-col gap-xs">
                                <Label>Email *</Label>
                                <Input
                                    type="email"
                                    value={userForm.data.email}
                                    onChange={(e) =>
                                        userForm.setData(
                                            "email",
                                            e.target.value,
                                        )
                                    }
                                    placeholder="john@example.com"
                                    aria-invalid={!!userForm.errors.email}
                                />
                                {userForm.errors.email && (
                                    <p className="text-[12px] text-error-text">
                                        {userForm.errors.email}
                                    </p>
                                )}
                            </div>
                            <div className="flex flex-col gap-xs">
                                <Label>Password *</Label>
                                <Input
                                    type="password"
                                    value={userForm.data.password}
                                    onChange={(e) =>
                                        userForm.setData(
                                            "password",
                                            e.target.value,
                                        )
                                    }
                                    placeholder="Min. 8 karakter"
                                    aria-invalid={!!userForm.errors.password}
                                />
                                {userForm.errors.password && (
                                    <p className="text-[12px] text-error-text">
                                        {userForm.errors.password}
                                    </p>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="is_org_admin"
                                    checked={userForm.data.is_org_admin}
                                    onChange={(e) =>
                                        userForm.setData(
                                            "is_org_admin",
                                            e.target.checked,
                                        )
                                    }
                                    className="rounded"
                                />
                                <Label htmlFor="is_org_admin">
                                    Jadikan Org Admin
                                </Label>
                            </div>
                            <div className="flex flex-col gap-xs">
                                <Label>
                                    Assign ke Team{" "}
                                    <span className="text-text-muted font-normal">
                                        (opsional)
                                    </span>
                                </Label>
                                <Select
                                    value={userForm.data.team_id}
                                    onChange={(e) =>
                                        userForm.setData(
                                            "team_id",
                                            e.target.value,
                                        )
                                    }
                                >
                                    <option value="">
                                        — Tidak di-assign —
                                    </option>
                                    {teams.map((t) => (
                                        <option key={t.id} value={t.id}>
                                            {t.name}
                                        </option>
                                    ))}
                                </Select>
                            </div>
                            {userForm.data.team_id && (
                                <div className="flex flex-col gap-xs">
                                    <Label>Role di Team *</Label>
                                    <Select
                                        value={userForm.data.role}
                                        onChange={(e) =>
                                            userForm.setData(
                                                "role",
                                                e.target
                                                    .value as Member["role"],
                                            )
                                        }
                                    >
                                        <option value="member">Member</option>
                                        <option value="tutor">Tutor</option>
                                        <option value="leader">Leader</option>
                                    </Select>
                                </div>
                            )}
                        </form>
                    </DialogBody>
                    <DialogFooter>
                        <Button
                            variant="secondary"
                            onClick={() => setCreateUserOpen(false)}
                        >
                            Batal
                        </Button>
                        <Button
                            type="submit"
                            form="user-create-form"
                            disabled={userForm.processing}
                        >
                            {userForm.processing ? "Menyimpan…" : "Buat User"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal Edit User */}
            <Dialog open={editUserOpen} onOpenChange={setEditUserOpen}>
                <DialogContent size="sm">
                    <DialogHeader>
                        <DialogTitle>
                            Edit User — {selectedUser?.name}
                        </DialogTitle>
                    </DialogHeader>
                    <DialogBody>
                        <form
                            id="user-edit-form"
                            onSubmit={submitEditUser}
                            className="flex flex-col gap-md"
                        >
                            <div className="flex flex-col gap-xs">
                                <Label>Nama *</Label>
                                <Input
                                    value={editUserForm.data.name}
                                    onChange={(e) =>
                                        editUserForm.setData(
                                            "name",
                                            e.target.value,
                                        )
                                    }
                                    aria-invalid={!!editUserForm.errors.name}
                                />
                                {editUserForm.errors.name && (
                                    <p className="text-[12px] text-error-text">
                                        {editUserForm.errors.name}
                                    </p>
                                )}
                            </div>
                            <div className="flex flex-col gap-xs">
                                <Label>Email *</Label>
                                <Input
                                    type="email"
                                    value={editUserForm.data.email}
                                    onChange={(e) =>
                                        editUserForm.setData(
                                            "email",
                                            e.target.value,
                                        )
                                    }
                                    aria-invalid={!!editUserForm.errors.email}
                                />
                                {editUserForm.errors.email && (
                                    <p className="text-[12px] text-error-text">
                                        {editUserForm.errors.email}
                                    </p>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="edit_is_org_admin"
                                    checked={editUserForm.data.is_org_admin}
                                    onChange={(e) =>
                                        editUserForm.setData(
                                            "is_org_admin",
                                            e.target.checked,
                                        )
                                    }
                                    className="rounded"
                                />
                                <Label htmlFor="edit_is_org_admin">
                                    Org Admin
                                </Label>
                            </div>
                        </form>
                    </DialogBody>
                    <DialogFooter>
                        <Button
                            variant="secondary"
                            onClick={() => setEditUserOpen(false)}
                        >
                            Batal
                        </Button>
                        <Button
                            type="submit"
                            form="user-edit-form"
                            disabled={editUserForm.processing}
                        >
                            {editUserForm.processing ? "Menyimpan…" : "Simpan"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal Reset Password */}
            <Dialog
                open={resetPasswordOpen}
                onOpenChange={setResetPasswordOpen}
            >
                <DialogContent size="sm">
                    <DialogHeader>
                        <DialogTitle>
                            Reset Password — {selectedUser?.name}
                        </DialogTitle>
                    </DialogHeader>
                    <DialogBody>
                        <form
                            id="reset-password-form"
                            onSubmit={submitResetPassword}
                            className="flex flex-col gap-md"
                        >
                            <div className="flex flex-col gap-xs">
                                <Label>Password Baru *</Label>
                                <Input
                                    type="password"
                                    value={resetPasswordForm.data.password}
                                    onChange={(e) =>
                                        resetPasswordForm.setData(
                                            "password",
                                            e.target.value,
                                        )
                                    }
                                    placeholder="Min. 8 karakter"
                                    aria-invalid={
                                        !!resetPasswordForm.errors.password
                                    }
                                />
                                {resetPasswordForm.errors.password && (
                                    <p className="text-[12px] text-error-text">
                                        {resetPasswordForm.errors.password}
                                    </p>
                                )}
                            </div>
                        </form>
                    </DialogBody>
                    <DialogFooter>
                        <Button
                            variant="secondary"
                            onClick={() => setResetPasswordOpen(false)}
                        >
                            Batal
                        </Button>
                        <Button
                            type="submit"
                            form="reset-password-form"
                            disabled={resetPasswordForm.processing}
                        >
                            {resetPasswordForm.processing
                                ? "Menyimpan…"
                                : "Reset Password"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Confirm hapus user */}
            <ConfirmDialog
                open={deleteUserId !== null}
                onOpenChange={(open) => !open && setDeleteUserId(null)}
                title="Hapus User"
                description="Akun user ini akan dihapus permanen. Tindakan ini tidak bisa dibatalkan."
                onConfirm={() => deleteUserId && destroyUser(deleteUserId)}
            />

            {/* Confirm hapus member */}
            <ConfirmDialog
                open={deleteMemberId !== null}
                onOpenChange={(open) => !open && setDeleteMemberId(null)}
                title="Keluarkan Anggota"
                description="Anggota ini akan dikeluarkan dari team. Akun mereka tidak ikut terhapus."
                onConfirm={() =>
                    deleteMemberId && destroyMember(deleteMemberId)
                }
            />

            {/* Confirm hapus team */}
            <ConfirmDialog
                open={deleteTeamId !== null}
                onOpenChange={(open) => !open && setDeleteTeamId(null)}
                title="Hapus Team"
                description="Team ini akan dihapus beserta seluruh keanggotaannya."
                onConfirm={() => deleteTeamId && destroyTeam(deleteTeamId)}
            />
        </AuthenticatedLayout>
    );
}
