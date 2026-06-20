import * as React from 'react';
import { useRef, useEffect, useCallback } from 'react';
import { Bold, Italic, Underline, List } from 'lucide-react';
import { sanitizeHtml } from '@/Lib/sanitize-html';

interface RichTextEditorProps {
    value: string;
    onChange: (html: string) => void;
    placeholder?: string;
    minHeight?: number;
}

function ToolbarButton({
    onClick,
    label,
    children,
}: {
    onClick: () => void;
    label: string;
    children: React.ReactNode;
}) {
    return (
        <button
            type="button"
            aria-label={label}
            title={label}
            onMouseDown={(e) => e.preventDefault()}
            onClick={onClick}
            className="flex items-center justify-center size-7 rounded-sm text-text-secondary hover:bg-surface-overlay hover:text-text-primary transition-colors"
        >
            {children}
        </button>
    );
}

export function RichTextEditor({
    value,
    onChange,
    placeholder,
    minHeight = 80,
}: RichTextEditorProps) {
    const editorRef = useRef<HTMLDivElement>(null);
    const isTypingRef = useRef(false);

    // ponytail: only sync external `value` into the DOM when the user is NOT
    // currently typing. Previous version reset innerHTML on every prop change,
    // which threw the caret to position 0 mid-typing because the browser
    // normalizes tag casing/attributes differently from the prop string.
    useEffect(() => {
        if (!editorRef.current || isTypingRef.current) return;
        const sanitized = sanitizeHtml(value || '');
        if (editorRef.current.innerHTML !== sanitized) {
            editorRef.current.innerHTML = sanitized;
        }
    }, [value]);

    const exec = useCallback(
        (command: string) => {
            document.execCommand(command, false);
            if (editorRef.current) {
                onChange(sanitizeHtml(editorRef.current.innerHTML));
            }
            editorRef.current?.focus();
        },
        [onChange],
    );

    const handleInput = () => {
        isTypingRef.current = true;
        if (editorRef.current) {
            onChange(sanitizeHtml(editorRef.current.innerHTML));
        }
        // Reset shortly after so external value updates (e.g. form reset) can
        // re-sync. 0ms timeout — just break out of the current event loop.
        setTimeout(() => { isTypingRef.current = false; }, 0);
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
        // ponytail: never let raw pasted HTML reach the editor — only plain text.
        e.preventDefault();
        const text = e.clipboardData.getData('text/plain');
        document.execCommand('insertText', false, text);
    };

    const isEmpty = !value || value === '<br>' || value === '<div><br></div>';

    return (
        <div className="rounded-sm border border-border bg-surface-raised focus-within:border-primary focus-within:ring-[3px] focus-within:ring-primary/12 transition-colors">
            <div className="flex items-center gap-0.5 border-b border-border px-1.5 py-1">
                <ToolbarButton label="Bold" onClick={() => exec('bold')}>
                    <Bold className="size-3.5" />
                </ToolbarButton>
                <ToolbarButton label="Italic" onClick={() => exec('italic')}>
                    <Italic className="size-3.5" />
                </ToolbarButton>
                <ToolbarButton label="Underline" onClick={() => exec('underline')}>
                    <Underline className="size-3.5" />
                </ToolbarButton>
                <ToolbarButton label="Bullet list" onClick={() => exec('insertUnorderedList')}>
                    <List className="size-3.5" />
                </ToolbarButton>
            </div>
            <div className="relative">
                {isEmpty && placeholder && (
                    <span className="pointer-events-none absolute left-3 top-2 text-sm text-text-muted">
                        {placeholder}
                    </span>
                )}
                <div
                    ref={editorRef}
                    contentEditable
                    suppressContentEditableWarning
                    onInput={handleInput}
                    onPaste={handlePaste}
                    className="rich-text-content px-3 py-2 text-sm text-text-primary outline-none"
                    style={{ minHeight }}
                />
            </div>
        </div>
    );
}
