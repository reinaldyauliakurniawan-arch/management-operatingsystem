import { Config } from 'ziggy-js';

export interface User {
    id: number;
    name: string;
    email: string;
    email_verified_at?: string;
    is_org_admin?: boolean;
}

export interface TeamSummary {
    id: number;
    name: string;
    type?: string;
    role?: string;
}

export type PageProps<
    T extends Record<string, unknown> = Record<string, unknown>,
> = T & {
    auth: {
        user: User;
        userTeams: TeamSummary[];
        activeTeamId: number | null;
        teamRole: string | null;
        isOrgAdmin: boolean;
    };
    ziggy: Config & { location: string };
};
