import { Link } from '@inertiajs/react';
import TeamSwitcher from '@/Components/TeamSwitcher';
import {
    LayoutDashboard,
    Target,
    Gem,
    BarChart3,
    CheckSquare,
    AlertCircle,
    Users,
    UserCheck,
    Calendar
} from 'lucide-react';
import { cn } from '@/Lib/utils';

const navigation = [
    { name: 'Dashboard', href: route('dashboard'), icon: LayoutDashboard, current: route().current('dashboard') },
    { name: 'V/TO', href: route('vto.index'), icon: Target, current: route().current('vto.*') },
    { name: 'Rocks', href: route('rocks.index'), icon: Gem, current: route().current('rocks.*') },
    { name: 'Scorecard', href: route('scorecard.index'), icon: BarChart3, current: route().current('scorecard.*') },
    { name: 'L10 Meetings', href: route('l10.index'), icon: Calendar, current: route().current('l10.*') },
    { name: 'IDS', href: route('ids.index'), icon: AlertCircle, current: route().current('ids.*') },
    { name: 'To-Do List', href: route('todos.index'), icon: CheckSquare, current: route().current('todos.*') },
    { name: 'Org Chart', href: route('accountability.index'), icon: Users, current: route().current('accountability.*') },
    { name: 'People Analyzer', href: route('people.index'), icon: UserCheck, current: route().current('people.*') },
];

export default function Sidebar() {
    return (
        <div className="flex grow flex-col gap-y-5 overflow-y-auto sidebar-glass px-6 pb-4">
            <div className="flex h-16 shrink-0 items-center">
                <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400">Harmonic System</span>
            </div>

            <div className="px-2">
                <TeamSwitcher />
            </div>

            <nav className="flex flex-1 flex-col">
                <ul role="list" className="flex flex-1 flex-col gap-y-7">
                    <li>
                        <ul role="list" className="-mx-2 space-y-1">
                            {navigation.map((item) => (
                                <li key={item.name}>
                                    <Link
                                        href={item.href}
                                        className={cn(
                                            item.current
                                                ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                                                : 'text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-50/50 dark:hover:bg-gray-900/50',
                                            'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold transition-all duration-200'
                                        )}
                                    >
                                        <item.icon
                                            className={cn(
                                                item.current ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400',
                                                'h-6 w-6 shrink-0'
                                            )}
                                            aria-hidden="true"
                                        />
                                        {item.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </li>
                </ul>
            </nav>
        </div>
    );
}
