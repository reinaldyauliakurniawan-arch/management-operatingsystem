import { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/Components/ui/tabs';
import { Badge } from '@/Components/ui/badge';
import { Input } from '@/Components/ui/input';

export default function Workspace({ meeting, rocks, metrics, todos, issues }: any) {
    const [timer, setTimer] = useState(0);
    const [rating, setRating] = useState(10);

    useEffect(() => {
        const interval = setInterval(() => setTimer(t => t + 1), 1000);
        return () => clearInterval(interval);
    }, []);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const finishMeeting = () => {
        router.post(route('l10.finish', meeting.data.id), { rating });
    };

    const agenda = [
        { id: 'segue', title: 'Segue', time: '5:00' },
        { id: 'scorecard', title: 'Scorecard', time: '5:00' },
        { id: 'rocks', title: 'Rock Review', time: '5:00' },
        { id: 'headlines', title: 'Headlines', time: '5:00' },
        { id: 'todos', title: 'To-Do List', time: '5:00' },
        { id: 'ids', title: 'IDS', time: '60:00' },
        { id: 'conclude', title: 'Conclude', time: '5:00' },
    ];

    return (
        <AuthenticatedLayout
            header={
                <div className="flex justify-between items-center w-full">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
                        L10 Meeting Workspace
                    </h2>
                    <div className="text-2xl font-mono tabular-nums">
                        {formatTime(timer)}
                    </div>
                </div>
            }
        >
            <Head title="L10 Meeting" />

            <div className="py-6">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <Tabs defaultValue="segue" className="flex flex-col md:flex-row gap-6">
                        <TabsList className="flex flex-col h-auto bg-transparent border-r rounded-none items-start gap-2 p-0 min-w-[200px]">
                            {agenda.map(item => (
                                <TabsTrigger
                                    key={item.id}
                                    value={item.id}
                                    className="w-full justify-between data-[state=active]:bg-muted"
                                >
                                    <span>{item.title}</span>
                                    <Badge variant="outline">{item.time}</Badge>
                                </TabsTrigger>
                            ))}
                        </TabsList>

                        <div className="flex-1">
                            <TabsContent value="segue" className="mt-0">
                                <Card className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass">
                                    <Card className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass"Header><Card className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass"Title>Segue (5 min)</CardTitle></CardHeader>
                                    <Card className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass"Content>
                                        <p>Share best news (Personal & Professional)</p>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="scorecard" className="mt-0">
                                <Card className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass">
                                    <Card className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass"Header><Card className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass"Title>Scorecard (5 min)</CardTitle></CardHeader>
                                    <Card className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass"Content>
                                        <ul className="space-y-2">
                                            {metrics.map((m: any) => (
                                                <li key={m.id} className="flex justify-between border-b pb-1">
                                                    <span>{m.title}</span>
                                                    <span className="font-mono">{m.goal_value}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="rocks" className="mt-0">
                                <Card className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass">
                                    <Card className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass"Header><Card className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass"Title>Rock Review (5 min)</CardTitle></CardHeader>
                                    <Card className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass"Content>
                                        <ul className="space-y-2">
                                            {rocks.map((r: any) => (
                                                <li key={r.id} className="flex justify-between border-b pb-1">
                                                    <span>{r.title}</span>
                                                    <Badge>{r.status}</Badge>
                                                </li>
                                            ))}
                                        </ul>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="todos" className="mt-0">
                                <Card className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass">
                                    <Card className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass"Header><Card className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass"Title>To-Do List (5 min)</CardTitle></CardHeader>
                                    <Card className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass"Content>
                                        <ul className="space-y-2">
                                            {todos.map((t: any) => (
                                                <li key={t.id} className="border-b pb-1">{t.title}</li>
                                            ))}
                                        </ul>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="ids" className="mt-0">
                                <Card className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass">
                                    <Card className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass"Header><Card className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass"Title>IDS (60 min)</CardTitle></CardHeader>
                                    <Card className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass"Content>
                                        <ul className="space-y-2">
                                            {issues.map((i: any) => (
                                                <li key={i.id} className="flex justify-between border-b pb-1">
                                                    <span>{i.title}</span>
                                                    <span className="text-muted-foreground">{i.priority}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="conclude" className="mt-0">
                                <Card className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass">
                                    <Card className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass"Header><Card className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass"Title>Conclude (5 min)</CardTitle></CardHeader>
                                    <Card className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass"Content className="space-y-4">
                                        <p>Rate the meeting (1-10)</p>
                                        <Input
                                            type="number"
                                            min="1" max="10"
                                            value={rating}
                                            onChange={e => setRating(parseInt(e.target.value))}
                                        />
                                        <Button onClick={finishMeeting} className="w-full">Finish Meeting</Button>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </div>
                    </Tabs>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
