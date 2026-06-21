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
