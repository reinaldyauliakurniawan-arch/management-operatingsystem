import { usePage, router } from '@inertiajs/react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/Components/ui/dropdown-menu';
import { Button } from '@/Components/ui/button';
import { ChevronDown, Users } from 'lucide-react';

export default function TeamSwitcher() {
    const { auth } = usePage<any>().props;
    const teams = auth.userTeams || [];
    const activeTeamId = auth.activeTeamId;
    const activeTeam = teams.find((t: any) => t.id === activeTeamId);

    const switchTeam = (teamId: number) => {
        router.post(route('teams.switch'), { team_id: teamId });
    };

    if (teams.length === 0) return null;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-full justify-between px-2 font-semibold">
                    <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <span className="truncate">{activeTeam?.name || 'Select Team'}</span>
                    </div>
                    <ChevronDown className="h-4 w-4 opacity-50" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="start">
                <DropdownMenuLabel>My Teams</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {teams.map((team: any) => (
                    <DropdownMenuItem
                        key={team.id}
                        onClick={() => switchTeam(team.id)}
                        className="flex justify-between items-center cursor-pointer"
                    >
                        <span>{team.name}</span>
                        <span className="text-xs text-muted-foreground uppercase">{team.role}</span>
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
