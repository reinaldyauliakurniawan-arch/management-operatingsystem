import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogClose,
} from "@/Components/ui/dialog";
import { Button } from "@/Components/ui/button";

interface ConfirmDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm: () => void;
    processing?: boolean;
}

function ConfirmDialog({
    open,
    onOpenChange,
    title,
    description,
    confirmLabel = "Hapus",
    cancelLabel = "Batal",
    onConfirm,
    processing = false,
}: ConfirmDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent size="sm">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    {description && (
                        <DialogDescription>{description}</DialogDescription>
                    )}
                </DialogHeader>
                <DialogFooter>
                    <DialogClose render={<Button variant="secondary" />}>
                        {cancelLabel}
                    </DialogClose>
                    <Button
                        variant="destructive"
                        onClick={onConfirm}
                        disabled={processing}
                    >
                        {confirmLabel}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export { ConfirmDialog };
