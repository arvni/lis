// Format date function with enhanced formatting
export const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

// Selectable fields for the barcode-view label. `text: false` fields (the barcode image) have no
// font size. Order here is the order fields stack on the label.
export const FIELDS = [
    { key: 'barcodeImage', label: 'Barcode', text: false },
    { key: 'barcodeNumber', label: 'Barcode number', text: true },
    { key: 'expireDate', label: 'Expire date', text: true },
    { key: 'createdDate', label: 'Created date', text: true },
    { key: 'sampleType', label: 'Sample type', text: true },
    { key: 'manufacturedDate', label: 'Manufactured date', text: true },
    { key: 'tubeSeries', label: 'Tube series', text: true },
    { key: 'packingSeries', label: 'Packing series', text: true },
];

// Text fields with how to read their value off a material. Drives the stacked text on the label.
export const TEXT_FIELDS = [
    { key: 'barcodeNumber', getValue: (m) => m.barcode },
    { key: 'expireDate', getValue: (m) => formatDate(m.expire_date || m.created_at) },
    { key: 'createdDate', getValue: (m) => formatDate(m.created_at) },
    { key: 'sampleType', getValue: (m) => m.sample_type_name },
    { key: 'manufacturedDate', getValue: (m) => formatDate(m.manufactured_date) },
    { key: 'tubeSeries', getValue: (m) => m.tube_series },
    { key: 'packingSeries', getValue: (m) => m.packing_series },
];

// Font-size presets multiply the base label text size. 'md' = original default.
export const FONT_SCALES = {
    sm: 0.85,
    md: 1,
    lg: 1.2,
    xl: 1.4,
};

export const SIZE_OPTIONS = [
    { value: 'sm', short: 'S', label: 'Small' },
    { value: 'md', short: 'M', label: 'Medium' },
    { value: 'lg', short: 'L', label: 'Large' },
    { value: 'xl', short: 'XL', label: 'X-Large' },
];

export const MIN_REPEAT = 1;
export const MAX_REPEAT = 9;

export const clampRepeat = (value) => {
    const n = Number.parseInt(value, 10);
    if (Number.isNaN(n)) return MIN_REPEAT;
    return Math.min(MAX_REPEAT, Math.max(MIN_REPEAT, n));
};

// Per-field config: whether it shows, how many times it repeats (stacked lines), and its font size.
export const DEFAULT_FIELDS = {
    barcodeImage: { show: true, repeat: 1, size: 'md' },
    barcodeNumber: { show: true, repeat: 1, size: 'md' },
    expireDate: { show: true, repeat: 1, size: 'md' },
    createdDate: { show: false, repeat: 1, size: 'md' },
    sampleType: { show: true, repeat: 1, size: 'md' },
    manufacturedDate: { show: false, repeat: 1, size: 'md' },
    tubeSeries: { show: false, repeat: 1, size: 'md' },
    packingSeries: { show: false, repeat: 1, size: 'md' },
};

// Persist the user's print preferences across visits.
const STORAGE_KEY = 'materials.barcodes.printPrefs';

// Normalize a saved field entry into the current shape. Supports the legacy boolean format
// (`fieldKey: true/false`) alongside a legacy global font size.
const normalizeField = (saved, fallback, legacySize) => {
    if (typeof saved === 'boolean') {
        return { ...fallback, show: saved, size: legacySize ?? fallback.size };
    }
    if (saved && typeof saved === 'object') {
        return {
            show: typeof saved.show === 'boolean' ? saved.show : fallback.show,
            repeat: clampRepeat(saved.repeat ?? fallback.repeat),
            size: saved.size in FONT_SCALES ? saved.size : fallback.size,
        };
    }
    return { ...fallback, size: legacySize ?? fallback.size };
};

export const loadPrefs = () => {
    try {
        const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY)) || {};
        const savedFields = saved.fields || {};
        // Legacy prefs stored one global font size; use it as the migration default.
        const legacySize = saved.fontSize in FONT_SCALES ? saved.fontSize : null;
        const fields = Object.fromEntries(
            Object.entries(DEFAULT_FIELDS).map(([key, def]) => [
                key,
                normalizeField(savedFields[key], def, legacySize),
            ]),
        );
        return { fields };
    } catch (_) {
        return { fields: DEFAULT_FIELDS };
    }
};

export const savePrefs = (prefs) => {
    try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ fields: prefs.fields }));
    } catch (_) {
        /* ignore storage write errors (private mode, quota) */
    }
};
