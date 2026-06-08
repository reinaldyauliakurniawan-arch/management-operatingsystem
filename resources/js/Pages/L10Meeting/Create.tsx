import { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Label } from '@/Components/ui/label';
import { Checkbox } from '@/Components/ui/checkbox';

export default function Create({ users }: { users: any[] }) {
    const { data, setData, post, processing } = useForm({
        attendee_ids: [] as number[],
    });

    const toggleAttendee = (id: number) => {
        if (data.attendee_ids.includes(id)) {
            setData('attendee_ids', data.attendee_ids.filter(aid => aid !== id));
        } else {
            setData('attendee_ids', [...data.attendee_ids, id]);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('l10.store'));
    };

    return (
        <AuthenticatedLayout
            header={<h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">Start L10 Meeting</h2>}
        >
            <Head title="Start Meeting" />

            <div className="py-12">
                <div className="mx-auto max-w-md sm:px-6 lg:px-8">
                    <Card className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass">
                        <Card className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass"Header>
                            <Card className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass"Title>Who is attending?</CardTitle>
                        </CardHeader>
                        <Card className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass" className="glass"Content>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-2">
                                    {users.map(user => (
                                        <div key={user.id} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={`user-${user.id}`}
                                                checked={data.attendee_ids.includes(user.id)}
                                                onCheckedChange={() => toggleAttendee(user.id)}
                                            />
                                            <Label htmlFor={`user-${user.id}`}>{user.name}</Label>
                                        </div>
                                    ))}
                                </div>

                                <Button type="submit" disabled={processing} className="w-full">
                                    Start Meeting
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
