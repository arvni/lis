/**
 * Validates a from/to date pair. Returns an error message, or '' when valid.
 * Pass `today` (ISO yyyy-mm-dd) to also reject future dates — the registered
 * and published ranges cap at today, the est. report range does not.
 */
export function dateRangeError(from, to, today = null) {
    if (!from || !to) return '';

    const fromDate = new Date(from);
    const toDate = new Date(to);

    if (fromDate > toDate) return 'Start date cannot be after end date';
    if (today) {
        if (fromDate > new Date(today)) return 'Start date cannot be in the future';
        if (toDate > new Date(today)) return 'End date cannot be in the future';
    }
    return '';
}

/**
 * Counts filled filter entries: non-empty arrays, true booleans, and any
 * other value that isn't '', null, or undefined.
 */
export function countActiveFilters(filter) {
    return Object.values(filter || {}).filter((value) => {
        if (Array.isArray(value)) return value.length > 0;
        if (typeof value === 'boolean') return value === true;
        return value !== '' && value !== null && value !== undefined;
    }).length;
}
