const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;

export const MenuProps = {
    slotProps: {
        paper: {
            style: {
                maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
                width: 250,
            },
        },
    },
};

export const HOW_FOUND_OPTIONS = [
    { value: 'google', label: 'Google Search' },
    { value: 'instagram', label: 'Instagram' },
    { value: 'friends', label: 'Friends / Family' },
    { value: 'doctor', label: "Doctor's Recommendation" },
    { value: 'website', label: 'Website / Online Ad' },
    { value: 'walk_in', label: 'Walk-in / Signboard' },
];

export const STATUSES = [
    'pending',
    'waiting for payment',
    'sampling',
    'pooling',
    'waiting for entering',
    'processing',
    'waiting for publishing',
    'reported',
    'Canceled',
];

export const REGISTERED_PRESETS = [
    { key: 'today', label: 'Today' },
    { key: 'yesterday', label: 'Yesterday' },
    { key: 'thisWeek', label: 'This Week' },
    { key: 'lastWeek', label: 'Last Week' },
    { key: 'thisMonth', label: 'This Month' },
    { key: 'lastMonth', label: 'Last Month' },
];

export const REPORT_DATE_PRESETS = [
    { key: 'today', label: 'Today' },
    { key: 'tomorrow', label: 'Tomorrow' },
    { key: 'thisWeek', label: 'This Week' },
    { key: 'nextWeek', label: 'Next Week' },
    { key: 'thisMonth', label: 'This Month' },
    { key: 'nextMonth', label: 'Next Month' },
];

const iso = (date) => date.toISOString().split('T')[0];

/**
 * Computes an ISO {from, to} range for the registered/published-style presets.
 * Returns null for an unknown preset.
 */
export const rangePreset = (preset) => {
    const today = new Date();
    let fromDate = new Date();

    switch (preset) {
        case 'today':
            fromDate = new Date(today);
            break;
        case 'yesterday':
            fromDate = new Date(today);
            fromDate.setDate(fromDate.getDate() - 1);
            break;
        case 'thisWeek':
            fromDate = new Date(today);
            fromDate.setDate(fromDate.getDate() - fromDate.getDay());
            break;
        case 'lastWeek': {
            fromDate = new Date(today);
            fromDate.setDate(fromDate.getDate() - fromDate.getDay() - 7);
            const toDate = new Date(fromDate);
            toDate.setDate(toDate.getDate() + 6);
            return { from: iso(fromDate), to: iso(toDate) };
        }
        case 'thisMonth':
            fromDate = new Date(today.getFullYear(), today.getMonth(), 1);
            break;
        case 'lastMonth': {
            fromDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
            const lastDayLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
            return { from: iso(fromDate), to: iso(lastDayLastMonth) };
        }
        default:
            return null;
    }

    return { from: iso(fromDate), to: iso(today) };
};

/**
 * Computes an ISO {from, to} range for the est. report-date presets.
 * Returns null for an unknown preset.
 */
export const reportRangePreset = (preset) => {
    const today = new Date();
    let fromDate;
    let toDate;

    switch (preset) {
        case 'today':
            fromDate = new Date(today);
            toDate = new Date(today);
            break;
        case 'tomorrow':
            fromDate = new Date(today);
            fromDate.setDate(fromDate.getDate() + 1);
            toDate = new Date(fromDate);
            break;
        case 'thisWeek':
            fromDate = new Date(today);
            fromDate.setDate(fromDate.getDate() - fromDate.getDay() + 1);
            toDate = new Date(fromDate);
            toDate.setDate(toDate.getDate() + 6);
            break;
        case 'nextWeek':
            fromDate = new Date(today);
            fromDate.setDate(fromDate.getDate() - fromDate.getDay() + 8);
            toDate = new Date(fromDate);
            toDate.setDate(toDate.getDate() + 6);
            break;
        case 'thisMonth':
            fromDate = new Date(today.getFullYear(), today.getMonth(), 1);
            toDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
            break;
        case 'nextMonth':
            fromDate = new Date(today.getFullYear(), today.getMonth() + 1, 1);
            toDate = new Date(today.getFullYear(), today.getMonth() + 2, 0);
            break;
        default:
            return null;
    }

    return { from: iso(fromDate), to: iso(toDate) };
};
