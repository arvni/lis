import { describe, it, expect } from 'vitest';
import { formatFileTypes, validateFile } from './helpers';

const MB = 1024 * 1024;

// Mimics a browser File for the pure validator (only name/size/type are read).
const fakeFile = ({ name, size = 0, type = '' }) => ({ name, size, type });

describe('formatFileTypes', () => {
    it('returns "All files" when accept is empty/undefined', () => {
        expect(formatFileTypes('')).toBe('All files');
        expect(formatFileTypes('   ')).toBe('All files');
        expect(formatFileTypes(undefined)).toBe('All files');
    });

    it('maps known MIME/extension patterns to friendly labels and de-dupes', () => {
        expect(formatFileTypes('image/*')).toBe('Images');
        expect(formatFileTypes('application/pdf')).toBe('PDF');
        expect(formatFileTypes('.pdf, .pdf')).toBe('PDF');
        expect(formatFileTypes('.png, image/*')).toBe('PNG, Images');
    });
});

describe('validateFile', () => {
    const cfg = {
        accept: '.pdf,image/*',
        acceptedFileTypes: 'PDF, Images',
        maxSizeBytes: 5 * MB,
        maxFileSize: 5,
    };

    it('returns null for a valid, accepted, in-size file (extension match)', () => {
        expect(validateFile(fakeFile({ name: 'report.pdf', size: 1 * MB }), cfg)).toBeNull();
    });

    it('accepts wildcard MIME matches (image/*)', () => {
        expect(
            validateFile(fakeFile({ name: 'scan.png', size: 1 * MB, type: 'image/png' }), cfg),
        ).toBeNull();
    });

    it('flags an oversized file', () => {
        const result = validateFile(fakeFile({ name: 'big.pdf', size: 9 * MB }), cfg);
        expect(result).not.toBeNull();
        expect(result.filename).toBe('big.pdf');
        expect(result.messages[0]).toContain('too large');
    });

    it('flags a disallowed file type', () => {
        const result = validateFile(
            fakeFile({ name: 'notes.txt', size: 1 * MB, type: 'text/plain' }),
            cfg,
        );
        expect(result).not.toBeNull();
        expect(result.messages[0]).toContain('not accepted');
    });

    it('reports both size and type problems at once', () => {
        const result = validateFile(
            fakeFile({ name: 'huge.txt', size: 9 * MB, type: 'text/plain' }),
            cfg,
        );
        expect(result.messages).toHaveLength(2);
    });

    it('skips type validation entirely when accept is empty', () => {
        const noAccept = { accept: '', acceptedFileTypes: 'All files', maxSizeBytes: 5 * MB, maxFileSize: 5 };
        expect(
            validateFile(fakeFile({ name: 'anything.xyz', size: 1 * MB }), noAccept),
        ).toBeNull();
    });
});
