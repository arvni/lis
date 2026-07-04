import { Chip } from '@mui/material';

export const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(dateString));
};

export const getStatusChip = (status) => {
    const map = {
        pending: { label: 'Pending', color: 'warning' },
        completed: { label: 'Completed', color: 'success' },
        canceled: { label: 'Canceled', color: 'error' },
    };
    const cfg = map[status] ?? { label: status, color: 'default' };
    return <Chip size="small" label={cfg.label} color={cfg.color} />;
};
