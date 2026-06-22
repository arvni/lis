export const fmt = (n) =>
    new Intl.NumberFormat('en-US', { minimumFractionDigits: 3, maximumFractionDigits: 3 }).format(
        n ?? 0,
    );

export const METHOD_COLORS = {
    card: '#4f46e5',
    cash: '#16a34a',
    credit: '#dc2626',
    transfer: '#d97706',
};

export const METHOD_LABELS = {
    card: 'Card',
    cash: 'Cash',
    credit: 'Credit',
    transfer: 'Transfer',
};
