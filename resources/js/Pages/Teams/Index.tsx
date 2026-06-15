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
import { Users, ChevronDown, ChevronUp } from "lucide-react";

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
}: {
    teams: Team[];
    allUsers: User[];
}) {
    const { auth } = usePage().props as any;
    const isOrgAdmin = auth.user?.is_org_admin;
    const activeTeamId = auth.activeTeamId;

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

    const toggleExpand = (teamId: number) => {
        if (expandedTeam === teamId) {
            setExpandedTeam(null);
            return;
        }
        setExpandedTeam(teamId);
        if (!teamMembers[teamId]) {
            setLoadingTeam(teamId);
            router.get(
                route("teams.members.index"),
                { team_id: teamId },
                {
                    preserveState: true,
                    onSuccess: (page: any) => {
                        setTeamMembers((prev) => ({
                            ...prev,
                            [teamId]: page.props.members ?? [],
                        }));
                        setLoadingTeam(null);
                    },
                },
            );
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
                // Refresh member list
                setTeamMembers((prev) => {
                    const updated = { ...prev };
                    if (expandedTeam) delete updated[expandedTeam];
                    return updated;
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
                    const updated = { ...prev };
                    if (expandedTeam) delete updated[expandedTeam];
                    return updated;
                });
            },
        });
    };

    const destroyMember = (memberId: number) => {
        router.delete(route("teams.members.destroy", memberId), {
            preserveScroll: true,
            onSuccess: () => {
                setDeleteMemberId(null);
                setTeamMembers((prev) => {
                    const updated = { ...prev };
                    if (expandedTeam) delete updated[expandedTeam];
                    return updated;
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
                title="Manajemen Team"
                subtitle="Kelola team dan anggota dalam organisasi."
                action={
                    isOrgAdmin && (
                        <Button onClick={() => setCreateTeamOpen(true)}>
                            + Buat Team
                        </Button>
                    )
                }
            />

            {teams.length === 0 ? (
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
                                {/* Team header row */}
                                <div className="flex items-center justify-between px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <Users className="size-4 text-text-muted" />
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[15px] font-semibold text-text-primary">
                                                    {team.name}
                                                </span>
                                                {team.id === activeTeamId && (
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
                                                onClick={() =>
                                                    setDeleteTeamId(team.id)
                                                }
                                                className="text-error hover:bg-error-subtle"
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

                                {/* Expanded member list */}
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
                                                                    colSpan={4}
                                                                    className="text-center text-[13px] text-text-muted py-6"
                                                                >
                                                                    Belum ada
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
                                                                    key={m.id}
                                                                >
                                                                    <TableCell className="font-medium">
                                                                        {m.name}
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
            )}

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
