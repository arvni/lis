export const STATUS_COLORS = {
    pending: 'warning',
    assigned: 'info',
    in_transit: 'secondary',
    completed: 'success',
    cancelled: 'error',
};

export function fmtDateTime(val) {
    if (!val) return '—';
    return new Date(val).toLocaleString([], {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export { buildCalendarDays, DAY_NAMES, MONTH_NAMES } from '@/Components/Calendar/monthGrid';
