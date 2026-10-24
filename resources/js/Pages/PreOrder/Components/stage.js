// Shared look of a pre-order stage across the queue and the detail page.

export const OWNER_LABEL = {
    center: 'Center',
    bion: 'BION',
    none: '—',
};

export const ownerColor = (owner) =>
    owner === 'center' ? 'warning' : owner === 'bion' ? 'primary' : 'default';

/** Days since a date, for "days in stage". */
export const daysSince = (iso) => {
    if (!iso) return null;
    return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86400000));
};

/** SLA colour for days in stage: fine, getting old, overdue. */
export const ageColor = (days) =>
    days === null ? 'default' : days >= 5 ? 'error' : days >= 2 ? 'warning' : 'success';

export const patientName = (preOrder, ref) =>
    (preOrder.patients || []).find((p) => p.ref === ref)?.fullName ?? ref ?? '—';
