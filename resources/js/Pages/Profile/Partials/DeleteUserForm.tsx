import { useForm } from "@inertiajs/react";
import { FormEventHandler, useRef, useState } from "react";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogBody,
    DialogFooter,
} from "@/Components/ui/dialog";

export default function DeleteUserForm({
    className = "",
}: {
    className?: string;
}) {
    const [open, setOpen] = useState(false);
    const passwordInput = useRef<HTMLInputElement>(null);

    const {
        data,
        setData,
        delete: destroy,
        processing,
        reset,
        errors,
        clearErrors,
    } = useForm({
        password: "",
    });

    const deleteUser: FormEventHandler = (e) => {
        e.preventDefault();
        destroy(route("profile.destroy"), {
            preserveScroll: true,
            onSuccess: () => setOpen(false),
            onError: () => passwordInput.current?.focus(),
            onFinish: () => reset(),
        });
    };

    const close = () => {
        setOpen(false);
        clearErrors();
        reset();
    };

    return (
        <section className={className}>
            <h2 className="mb-xs text-[14px] font-semibold tracking-tight text-text-primary">
                Hapus Akun
            </h2>
            <p className="mb-lg text-[13px] text-text-secondary">
                Setelah akun dihapus, semua data akan dihapus permanen. Pastikan
                kamu sudah mengunduh data yang diperlukan.
            </p>

            <Button variant="danger" onClick={() => setOpen(true)}>
                Hapus Akun
            </Button>

            <Dialog open={open} onOpenChange={(o) => !o && close()}>
                <DialogContent size="sm">
                    <DialogHeader>
                        <DialogTitle>Hapus Akun</DialogTitle>
                    </DialogHeader>
                    <DialogBody>
                        <p className="mb-lg text-[13px] text-text-secondary">
                            Aksi ini tidak bisa dibatalkan. Masukkan password
                            untuk konfirmasi.
                        </p>
                        <form
                            onSubmit={deleteUser}
                            className="flex flex-col gap-lg"
                        >
                            <div className="flex flex-col gap-xs">
                                <Label htmlFor="del-password">Password</Label>
                                <Input
                                    id="del-password"
                                    ref={passwordInput}
                                    type="password"
                                    value={data.password}
                                    onChange={(e) =>
                                        setData("password", e.target.value)
                                    }
                                    placeholder="Password kamu"
                                    aria-invalid={!!errors.password}
                                />
                                {errors.password && (
                                    <p className="text-[12px] text-error-text">
                                        {errors.password}
                                    </p>
                                )}
                            </div>
                        </form>
                    </DialogBody>
                    <DialogFooter>
                        <Button variant="secondary" onClick={close}>
                            Batal
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={deleteUser}
                            disabled={processing}
                        >
                            {processing ? "Menghapus…" : "Hapus Akun"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </section>
    );
}
