import { Head, router } from "@inertiajs/react";
import GuestLayout from "@/Layouts/GuestLayout";
import { Badge } from "@/Components/ui/badge";

interface TeamOption {
    id: number;
    name: string;
    role: string;
}

export default function Pick({ teams }: { teams: TeamOption[] }) {
    const selectTeam = (teamId: number) => {
        router.post(
            "/teams/switch",
            { team_id: teamId },
            { preserveScroll: false },
        );
    };

    return (
        <GuestLayout>
            <Head title="Pilih Team" />

            <div>
                <h1 className="text-[20px] font-semibold tracking-tight text-text-primary">
                    Pilih Team
                </h1>
                <p className="mt-xs text-[14px] text-text-secondary">
                    Kamu terdaftar di beberapa team. Pilih team yang ingin
                    diakses.
                </p>

                <div className="mt-xl flex flex-col gap-sm">
                    {teams.map((team) => (
                        <button
                            key={team.id}
                            type="button"
                            onClick={() => selectTeam(team.id)}
                            className="flex w-full items-center justify-between rounded-lg border border-border bg-surface px-lg py-md text-left transition-colors hover:border-primary hover:bg-primary-subtle"
                        >
                            <span className="text-[14px] font-medium text-text-primary">
                                {team.name}
                            </span>
                            <Badge variant="info">{team.role}</Badge>
                        </button>
                    ))}
                </div>

                {teams.length === 0 && (
                    <p className="mt-lg text-[13px] text-text-muted">
                        Tidak ada team tersedia.
                    </p>
                )}
            </div>
        </GuestLayout>
    );
}
