// Selectable fields for the barcode-view label. Defaults match what prints today.
export const FIELDS = [
    { key: 'barcodeImage', label: 'Barcode' },
    { key: 'barcodeNumber', label: 'Barcode number' },
    { key: 'expireDate', label: 'Expire date' },
    { key: 'sampleType', label: 'Sample type' },
    { key: 'manufacturedDate', label: 'Manufactured date' },
    { key: 'tubeSeries', label: 'Tube series' },
    { key: 'packingSeries', label: 'Packing series' },
];

export const DEFAULT_FIELDS = {
    barcodeImage: true,
    barcodeNumber: true,
    expireDate: true,
    sampleType: true,
    manufacturedDate: false,
    tubeSeries: false,
    packingSeries: false,
};

// Font-size presets multiply the base label text size. 'md' = current default.
export const FONT_SCALES = {
    sm: 0.85,
    md: 1,
    lg: 1.2,
    xl: 1.4,
};

// Persist the user's print preferences across visits.
const STORAGE_KEY = 'materials.barcodes.printPrefs';

export const loadPrefs = () => {
    try {
        const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY)) || {};
        return {
            // Merge over defaults so newly-added fields keep their default visibility.
            fields: { ...DEFAULT_FIELDS, ...(saved.fields || {}) },
            fontSize: saved.fontSize in FONT_SCALES ? saved.fontSize : 'md',
        };
    } catch (_) {
        return { fields: DEFAULT_FIELDS, fontSize: 'md' };
    }
};

export const savePrefs = (prefs) => {
    try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch (_) {
        /* ignore storage write errors (private mode, quota) */
    }
};

// Format date function with enhanced formatting
export const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};
