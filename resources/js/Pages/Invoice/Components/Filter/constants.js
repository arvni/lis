export const DATE_PRESETS = [
    { key: 'today', label: 'Today' },
    { key: 'yesterday', label: 'Yesterday' },
    { key: 'thisWeek', label: 'This Week' },
    { key: 'lastWeek', label: 'Last Week' },
    { key: 'thisMonth', label: 'This Month' },
    { key: 'lastMonth', label: 'Last Month' },
    { key: 'thisYear', label: 'This Year' },
    { key: 'lastYear', label: 'Last Year' },
];

// Pure date math for a quick preset → { fromDate, toDate } (or null for unknown)
export const getPresetRange = (preset) => {
    const today = new Date();
    let fromDate = new Date();
    let toDate = new Date();

    switch (preset) {
        case 'today':
            fromDate = new Date(today);
            toDate = new Date(today);
            break;
        case 'yesterday':
            fromDate = new Date(today);
            fromDate.setDate(fromDate.getDate() - 1);
            toDate = new Date(fromDate);
            break;
        case 'thisWeek':
            fromDate = new Date(today);
            fromDate.setDate(fromDate.getDate() - fromDate.getDay());
            toDate = new Date(today);
            break;
        case 'lastWeek':
            fromDate = new Date(today);
            fromDate.setDate(fromDate.getDate() - fromDate.getDay() - 7);
            toDate = new Date(fromDate);
            toDate.setDate(toDate.getDate() + 6);
            break;
        case 'thisMonth':
            fromDate = new Date(today.getFullYear(), today.getMonth(), 1);
            toDate = new Date(today);
            break;
        case 'lastMonth':
            fromDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
            toDate = new Date(today.getFullYear(), today.getMonth(), 0);
            break;
        case 'thisYear':
            fromDate = new Date(today.getFullYear(), 0, 1);
            toDate = new Date(today);
            break;
        case 'lastYear':
            fromDate = new Date(today.getFullYear() - 1, 0, 1);
            toDate = new Date(today.getFullYear() - 1, 11, 31);
            break;
        default:
            return null;
    }

    return { fromDate, toDate };
};

// Format date as YYYY-MM-DD to avoid timezone issues
export const formatDateForBackend = (date) => {
    if (!date) return null;
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};
