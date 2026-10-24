// mammoth turns a .docx into HTML that DOCXViewer injects into the page. Text is
// escaped by mammoth, but hyperlink targets come straight from the document, so a
// crafted file could carry a `javascript:` link. Keep only safe URLs and drop
// anything that can run script.
const SAFE_HREF = /^(https?:|mailto:|tel:|#)/i;
const SAFE_SRC = /^data:image\/(png|jpe?g|gif|webp|bmp);/i;
const BLOCKED_TAGS = 'script, iframe, object, embed, link, meta, style, base, form, svg, math';

export default function sanitizeDocxHtml(html) {
    const doc = new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html');

    doc.querySelectorAll(BLOCKED_TAGS).forEach((el) => el.remove());

    doc.body.querySelectorAll('*').forEach((el) => {
        [...el.attributes].forEach(({ name, value }) => {
            const attr = name.toLowerCase();
            const url = value.trim();
            if (attr.startsWith('on') || attr === 'style' || attr === 'srcset') {
                el.removeAttribute(name);
            } else if (attr === 'href' && !SAFE_HREF.test(url)) {
                el.removeAttribute(name);
            } else if (attr === 'src' && !SAFE_SRC.test(url)) {
                el.removeAttribute(name);
            }
        });
        if (el.tagName === 'A' && el.hasAttribute('href')) {
            el.setAttribute('target', '_blank');
            el.setAttribute('rel', 'noopener noreferrer');
        }
    });

    return doc.body.innerHTML;
}
