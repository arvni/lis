import { describe, it, expect } from 'vitest';
import sanitizeDocxHtml from '@/Components/sanitizeDocxHtml';

describe('sanitizeDocxHtml', () => {
    it('keeps the normal document markup', () => {
        const html =
            '<h1>Report</h1><p>Result: <strong>negative</strong></p><table><tbody><tr><td>A</td></tr></tbody></table>';
        expect(sanitizeDocxHtml(html)).toBe(html);
    });

    it('keeps web and mail links and opens them in a new tab', () => {
        const out = sanitizeDocxHtml(
            '<a href="https://bion.om">site</a><a href="mailto:lab@bion.om">mail</a>',
        );
        expect(out).toContain('href="https://bion.om"');
        expect(out).toContain('href="mailto:lab@bion.om"');
        expect(out).toContain('rel="noopener noreferrer"');
    });

    it('drops javascript: links, even disguised', () => {
        const out = sanitizeDocxHtml(
            '<a href="  JavaScript:alert(1)">x</a><a href="vbscript:x">y</a>',
        );
        expect(out).not.toMatch(/script:/i);
        expect(out).toContain('>x</a>');
    });

    it('keeps embedded raster images and drops other sources', () => {
        const out = sanitizeDocxHtml(
            '<img src="data:image/png;base64,AAAA"><img src="data:image/svg+xml;base64,AAAA"><img src="https://evil.example/t.gif">',
        );
        expect(out).toContain('data:image/png;base64,AAAA');
        expect(out).not.toContain('svg+xml');
        expect(out).not.toContain('evil.example');
    });

    it('removes script-bearing tags and event handlers', () => {
        const out = sanitizeDocxHtml(
            '<p onclick="alert(1)">a</p><script>alert(2)</script><iframe src="x"></iframe><svg onload="alert(3)"></svg>',
        );
        expect(out).toBe('<p>a</p>');
    });
});
