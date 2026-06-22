import {
    AccountBalance,
    CheckCircle,
    Close,
    CreditScore,
    PaymentRounded,
} from '@mui/icons-material';

// Backend enum values — must match App\Domains\Billing\Enums\InvoiceStatus.
export const STATUS_OPTIONS = [
    {
        value: 'Waiting',
        label: 'Waiting for Payment',
        color: 'info',
        icon: <AccountBalance fontSize="small" />,
    },
    { value: 'Paid', label: 'Paid', color: 'success', icon: <CheckCircle fontSize="small" /> },
    {
        value: 'Partially Paid',
        label: 'Partially Paid',
        color: 'warning',
        icon: <PaymentRounded fontSize="small" />,
    },
    {
        value: 'Credit Paid',
        label: 'Credit Paid',
        color: 'warning',
        icon: <CreditScore fontSize="small" />,
    },
    { value: 'Canceled', label: 'Canceled', color: 'error', icon: <Close fontSize="small" /> },
];

export const statusMeta = (status) =>
    STATUS_OPTIONS.find((s) => s.value === status) ?? STATUS_OPTIONS[0];

export const num = (v) => {
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : 0;
};

export const formatMoney = (v) => num(v).toFixed(3);
