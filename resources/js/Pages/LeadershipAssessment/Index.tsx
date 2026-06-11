import { Head, useForm, usePage, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/ui/table';

export default function Index({ cycles, assignments, users, types }: any) {
    const { auth } = usePage<any>().props;
    const isLeadership = auth.user.roles?.some((r: any) => r.name === 'leadership_team');

    const cycleForm = useForm({ name: '' });
    const assignForm = useForm({ cycle_id: '', user_id: '', leadership_type_id: '' });

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-semibold leading-tight">Leadership Assessment</h2>}>
            <Head title="Leadership Assessment" />
            <div className="py-12 space-y-8">
                {isLeadership && (
                    <>
                    <Card>
                        <CardHeader><CardTitle>Create Assessment Cycle</CardTitle></CardHeader>
                        <CardContent>
                            <form onSubmit={e => { e.preventDefault(); cycleForm.post(route('leadership.cycles.store'), { onSuccess: () => cycleForm.reset() }) }} className="flex gap-4">
                                <Input placeholder="Cycle Name" value={cycleForm.data.name} onChange={e => cycleForm.setData('name', e.target.value)} />
                                <Button disabled={cycleForm.processing}>Start Cycle</Button>
                            </form>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader><CardTitle>Assign Assessment</CardTitle></CardHeader>
                        <CardContent>
                            <form onSubmit={e => { e.preventDefault(); assignForm.post(route('leadership.assignments.store'), { onSuccess: () => assignForm.reset() }) }} className="grid grid-cols-4 gap-4">
                                <select className="border rounded p-2" value={assignForm.data.cycle_id} onChange={e => assignForm.setData('cycle_id', e.target.value)}>
                                    <option value="">Cycle</option>
                                    {cycles.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                                <select className="border rounded p-2" value={assignForm.data.user_id} onChange={e => assignForm.setData('user_id', e.target.value)}>
                                    <option value="">User</option>
                                    {users.map((u: any) => <option key={u.id} value={u.id}>{u.name}</option>)}
                                </select>
                                <select className="border rounded p-2" value={assignForm.data.leadership_type_id} onChange={e => assignForm.setData('leadership_type_id', e.target.value)}>
                                    <option value="">Type</option>
                                    {types.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
                                </select>
                                <Button disabled={assignForm.processing}>Assign</Button>
                            </form>
                        </CardContent>
                    </Card>
                    </>
                )}

                <Card>
                    <CardHeader><CardTitle>Open Assessments</CardTitle></CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Cycle</TableHead>
                                    <TableHead>Assessee</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {assignments.map((a: any) => (
                                    <TableRow key={a.id}>
                                        <TableCell>{cycles.find((c: any) => c.id === a.cycle_id)?.name}</TableCell>
                                        <TableCell>{a.user.name}</TableCell>
                                        <TableCell>{a.type.name}</TableCell>
                                        <TableCell>
                                            <Link href={route('leadership.take', { cycle: a.cycle_id, user: a.user_id })}>
                                                <Button variant="outline">Assess</Button>
                                            </Link>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </AuthenticatedLayout>
    );
}
