const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;

export const MenuProps = {
    slotProps: {
        paper: {
            style: {
                maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
                width: 280,
            },
        },
    },
};

/**
 * Mirrors App\Domains\Referrer\Enums\ReferrerOrderStatus — keep the two in sync.
 */
export const REFERRER_ORDER_STATUSES = [
    { value: 'waiting', label: 'Waiting' },
    { value: 'processing', label: 'Processing' },
    { value: 'waiting for financial approval', label: 'Waiting for Financial Approval' },
    { value: 'reported', label: 'Reported' },
    { value: 'downloaded', label: 'Downloaded' },
];

const STATUS_COLORS = {
    waiting: 'default',
    processing: 'info',
    'waiting for financial approval': 'warning',
    reported: 'success',
    downloaded: 'secondary',
};

export const getReferrerOrderStatusColor = (status) =>
    STATUS_COLORS[status?.toLowerCase()] ?? 'default';

export const getReferrerOrderStatusLabel = (status) =>
    REFERRER_ORDER_STATUSES.find((option) => option.value === status?.toLowerCase())?.label ??
    status ??
    'Unknown';
