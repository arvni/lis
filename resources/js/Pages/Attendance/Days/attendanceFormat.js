export const STATUS_COLORS = {
    PRESENT: 'success',
    INCOMPLETE: 'warning',
    ABSENT: 'error',
    OFF: 'default',
    HOLIDAY: 'info',
    LEAVE: 'secondary',
};

export const formatMinutes = (minutes) => {
    if (!minutes) return '—';
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    if (!hours) return `${rest} m`;

    return rest ? `${hours} h ${rest} m` : `${hours} h`;
};
