// Sanitizer ringan tanpa dependency eksternal.
// Hanya mengizinkan tag dasar yang dihasilkan oleh RichTextEditor:
// bold, italic, underline, bullet list, dan pemisah baris.

const ALLOWED_TAGS = new Set([
    "B",
    "STRONG",
    "I",
    "EM",
    "U",
    "UL",
    "OL",
    "LI",
    "BR",
    "DIV",
    "P",
    "SPAN",
]);

function sanitizeNode(node: Node): void {
    const children = Array.from(node.childNodes);
    for (const child of children) {
        if (child.nodeType === Node.ELEMENT_NODE) {
            const el = child as HTMLElement;
            sanitizeNode(el);
            if (!ALLOWED_TAGS.has(el.tagName)) {
                while (el.firstChild) {
                    node.insertBefore(el.firstChild, el);
                }
                node.removeChild(el);
            } else {
                while (el.attributes.length > 0) {
                    el.removeAttribute(el.attributes[0].name);
                }
            }
        } else if (child.nodeType === Node.COMMENT_NODE) {
            node.removeChild(child);
        }
    }
}

// Fallback untuk environment tanpa DOMParser (mis. proses SSR di Node).
// Tidak selengkap versi DOMParser, tapi cukup untuk mencegah crash & tag berbahaya dasar.
function fallbackSanitize(html: string): string {
    return html
        .replace(/<script[\s\S]*?<\/script>/gi, "")
        .replace(/<style[\s\S]*?<\/style>/gi, "")
        .replace(/ on\w+="[^"]*"/gi, "")
        .replace(/ on\w+='[^']*'/gi, "")
        .replace(
            /<(?!\/?(b|strong|i|em|u|ul|ol|li|br|div|p|span)\b)[^>]+>/gi,
            "",
        );
}

export function sanitizeHtml(html: string | null | undefined): string {
    if (!html) return "";
    if (typeof DOMParser === "undefined") {
        return fallbackSanitize(html);
    }
    const doc = new DOMParser().parseFromString(html, "text/html");
    sanitizeNode(doc.body);
    return doc.body.innerHTML;
}

export function isHtmlEmpty(html: string | null | undefined): boolean {
    const text = sanitizeHtml(html)
        .replace(/<br\s*\/?>/gi, "")
        .replace(/<[^>]+>/g, "")
        .trim();
    return text.length === 0;
}
