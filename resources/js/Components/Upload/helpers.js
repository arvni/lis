// --- Helper Functions ---
export const generateTempId = () =>
    `temp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

export const formatFileTypes = (accept) => {
    // If accept is empty, undefined, or null, return "All files"
    if (!accept || accept.trim() === '') {
        return 'All files';
    }
    return accept
        .split(',')
        .map((type) => type.trim())
        .map((type) => {
            if (type === 'image/*') return 'Images';
            if (type.includes('pdf')) return 'PDF';
            if (type.includes('doc') || type.includes('word')) return 'Word';
            if (type.startsWith('.')) return type.substring(1).toUpperCase();
            if (type.includes('/')) return type.split('/')[1]; // Basic MIME type part
            return type;
        })
        .filter((value, index, self) => self.indexOf(value) === index) // Unique types
        .join(', ');
};

/**
 * Validate a single File against size/type constraints.
 * Pure function (no React) so it can be unit-tested in isolation.
 *
 * @returns {{filename: string, messages: string[]}|null} null when the file is valid.
 */
export const validateFile = (file, { accept, acceptedFileTypes, maxSizeBytes, maxFileSize }) => {
    const errors = [];

    // Check file size
    if (file.size > maxSizeBytes) {
        errors.push(`File "${file.name}" is too large (max ${maxFileSize}MB).`);
    }

    // Check file type only if accept prop is provided and not empty
    if (accept && accept.trim() !== '') {
        const fileType = file.type;
        const fileExtension = `.${file.name.split('.').pop()?.toLowerCase()}`;
        const acceptList = accept.split(',').map((a) => a.trim().toLowerCase());

        const isAccepted = acceptList.some((type) => {
            if (type.startsWith('.')) {
                return fileExtension === type;
            }
            if (type.endsWith('/*')) {
                return fileType.startsWith(type.slice(0, -1));
            }
            return fileType === type;
        });

        if (!isAccepted) {
            errors.push(
                `File type for "${file.name}" is not accepted (allowed: ${acceptedFileTypes}).`,
            );
        }
    }
    // If accept is empty/undefined, skip file type validation entirely

    return errors.length > 0 ? { filename: file.name, messages: errors } : null;
};
