import countries from '@/Data/Countries.js';

export const isEmpty = (v) => v === null || v === undefined || v === '';

export const avatarUrl = (value, gender) =>
    value || `/images/${['male', 'female'].includes(gender) ? gender : 'unknown'}.png`;

const formatAge = (date) => {
    const now = new Date();
    let years = now.getFullYear() - date.getFullYear();
    let months = now.getMonth() - date.getMonth();
    let days = now.getDate() - date.getDate();
    if (days < 0) months -= 1;
    if (months < 0) {
        years -= 1;
        months += 12;
    }
    if (years >= 1) return `${years} Y`;
    if (months >= 1) return `${months} M`;
    return `${Math.max(0, Math.round((now - date) / 86400000))} D`;
};

const formatDob = (value) => {
    if (isEmpty(value)) return '—';
    const d = new Date(value);
    if (isNaN(d.getTime())) return String(value);
    const date = new Intl.DateTimeFormat('en-GB', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    }).format(d);
    return `${date} (${formatAge(d)})`;
};

export const displayValue = (field, value) => {
    if (isEmpty(value)) return '—';
    if (field === 'dateOfBirth') return formatDob(value);
    if (field === 'nationality') return countries.find((c) => c.code === value)?.label ?? value;
    return String(value);
};

export const displayMetaValue = (field, value) => {
    if (field === 'maritalStatus') {
        if (value === 1 || value === '1') return 'Married';
        if (value === 0 || value === '0') return 'Single';
        return 'Unknown';
    }
    if (isEmpty(value)) return '—';
    return String(value);
};

// Default value source per key: the kept patient's value, falling back to the
// other patient only when the kept value is empty.
export const smartDefaults = (keys, bucket, data, keepSide) => {
    const other = keepSide === 'first' ? 'second' : 'first';
    const next = {};
    keys.forEach((key) => {
        next[key] = isEmpty(data[keepSide][bucket][key]) ? other : keepSide;
    });
    return next;
};
