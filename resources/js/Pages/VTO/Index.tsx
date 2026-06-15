import { useState } from "react";
import { Head, useForm, usePage, router } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { PageHeader } from "@/Components/ui/page-header";
import { Button } from "@/Components/ui/button";
import { Card, CardContent } from "@/Components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogBody,
    DialogFooter,
} from "@/Components/ui/dialog";
import { Input } from "@/Components/ui/input";
import { Textarea } from "@/Components/ui/textarea";
import { Label } from "@/Components/ui/label";

interface VTO {
    id: number;
    core_values: string[];
    core_focus: string | null;
    ten_year_target: string | null;
    marketing_strategy: string | null;
    three_year_picture: string | null;
    one_year_plan: string | null;
    rocks_summary: string | null;
    issues_summary: string | null;
}

function Section({
    title,
    value,
    isEditor,
    onEdit,
}: {
    title: string;
    value: string | null;
    isEditor: boolean;
    onEdit: () => void;
}) {
    return (
        <Card>
            <CardContent>
                <div className="mb-md flex items-center justify-between">
                    <p className="text-[12px] font-medium uppercase tracking-wider text-text-muted">
                        {title}
                    </p>
                    {isEditor && (
                        <Button variant="ghost" size="sm" onClick={onEdit}>
                            Edit
                        </Button>
                    )}
                </div>
                {value ? (
                    <p className="whitespace-pre-wrap text-[14px] leading-relaxed text-text-primary">
                        {value}
                    </p>
                ) : (
                    <p className="text-[13px] italic text-text-muted">
                        Belum diisi.
                        {isEditor && " Klik Edit untuk menambahkan."}
                    </p>
                )}
            </CardContent>
        </Card>
    );
}

export default function VTOIndex({ vto }: { vto: VTO | null }) {
    const { auth } = usePage().props as any;
    const isOrgAdmin = auth.user?.is_org_admin;
    const isLeader = auth.teamRole === "leader";
    const canEdit = isOrgAdmin || isLeader;

    const [editField, setEditField] = useState<string | null>(null);
    const [editValue, setEditValue] = useState("");
    const [coreValuesInput, setCoreValuesInput] = useState(
        vto?.core_values?.join("\n") ?? "",
    );

    const { patch, processing } = useForm({});

    const openEdit = (field: string, current: string | null) => {
        setEditField(field);
        setEditValue(current ?? "");
    };

    const saveField = () => {
        if (!editField || !vto) return;
        const payload =
            editField === "core_values"
                ? { core_values: coreValuesInput.split("\n").filter(Boolean) }
                : { [editField]: editValue };

        router.patch(route("vto.update", vto.id), payload, {
            preserveScroll: true,
            onSuccess: () => setEditField(null),
        });
    };

    const sections: { key: string; title: string; value: string | null }[] = [
        {
            key: "core_focus",
            title: "Core Focus",
            value: vto?.core_focus ?? null,
        },
        {
            key: "ten_year_target",
            title: "10-Year Target",
            value: vto?.ten_year_target ?? null,
        },
        {
            key: "marketing_strategy",
            title: "Marketing Strategy",
            value: vto?.marketing_strategy ?? null,
        },
        {
            key: "three_year_picture",
            title: "3-Year Picture",
            value: vto?.three_year_picture ?? null,
        },
        {
            key: "one_year_plan",
            title: "1-Year Plan",
            value: vto?.one_year_plan ?? null,
        },
    ];

    return (
        <AuthenticatedLayout>
            <Head title="VTO" />

            <PageHeader
                title="Vision / VTO"
                subtitle="Vision Traction Organizer — dokumen visi organisasi"
            />

            {!vto ? (
                <Card>
                    <CardContent className="py-16 text-center">
                        <p className="text-[14px] text-text-muted">
                            VTO belum dibuat.{" "}
                            {isOrgAdmin &&
                                "Hubungi org admin untuk menginisiasi VTO."}
                        </p>
                        {isOrgAdmin && (
                            <Button
                                className="mt-lg"
                                onClick={() =>
                                    router.post(route("vto.store"), {})
                                }
                            >
                                Inisiasi VTO
                            </Button>
                        )}
                    </CardContent>
                </Card>
            ) : (
                <div className="flex flex-col gap-lg">
                    {/* Core Values */}
                    <Card>
                        <CardContent>
                            <div className="mb-md flex items-center justify-between">
                                <p className="text-[12px] font-medium uppercase tracking-wider text-text-muted">
                                    Core Values
                                </p>
                                {canEdit && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() =>
                                            openEdit(
                                                "core_values",
                                                (vto.core_values ?? []).join(
                                                    "\n",
                                                ),
                                            )
                                        }
                                    >
                                        Edit
                                    </Button>
                                )}
                            </div>
                            {(vto.core_values ?? []).length > 0 ? (
                                <ul className="flex flex-col gap-xs">
                                    {(vto.core_values ?? []).map((cv, i) => (
                                        <li
                                            key={i}
                                            className="flex items-center gap-sm text-[14px] text-text-primary"
                                        >
                                            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                                            {cv}
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-[13px] italic text-text-muted">
                                    Belum diisi.
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Other sections */}
                    {sections.map((s) => (
                        <Section
                            key={s.key}
                            title={s.title}
                            value={s.value}
                            isEditor={canEdit}
                            onEdit={() => openEdit(s.key, s.value)}
                        />
                    ))}
                </div>
            )}

            {/* Edit Modal */}
            <Dialog
                open={!!editField}
                onOpenChange={(open) => !open && setEditField(null)}
            >
                <DialogContent size="md">
                    <DialogHeader>
                        <DialogTitle>
                            Edit{" "}
                            {editField === "core_values"
                                ? "Core Values"
                                : sections.find((s) => s.key === editField)
                                      ?.title}
                        </DialogTitle>
                    </DialogHeader>
                    <DialogBody>
                        {editField === "core_values" ? (
                            <div className="flex flex-col gap-xs">
                                <Label>Core Values (satu per baris)</Label>
                                <Textarea
                                    value={coreValuesInput}
                                    onChange={(e) =>
                                        setCoreValuesInput(e.target.value)
                                    }
                                    rows={6}
                                    placeholder="Integrity&#10;Growth Mindset&#10;Teamwork"
                                />
                            </div>
                        ) : (
                            <div className="flex flex-col gap-xs">
                                <Label>
                                    {
                                        sections.find(
                                            (s) => s.key === editField,
                                        )?.title
                                    }
                                </Label>
                                <Textarea
                                    value={editValue}
                                    onChange={(e) =>
                                        setEditValue(e.target.value)
                                    }
                                    rows={6}
                                    placeholder="Isi konten..."
                                />
                            </div>
                        )}
                    </DialogBody>
                    <DialogFooter>
                        <Button
                            variant="secondary"
                            onClick={() => setEditField(null)}
                        >
                            Batal
                        </Button>
                        <Button onClick={saveField} disabled={processing}>
                            {processing ? "Menyimpan…" : "Simpan"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AuthenticatedLayout>
    );
}
