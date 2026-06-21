import {
    AttachMoney,
    CreditCard,
    AccountBalance,
    SwapHoriz,
} from '@mui/icons-material';

// Mock data for demonstration
export const mockInvoice = {
    id: 1,
    status: 'Partially Paid',
    discount: 10,
    payments: [
        {
            id: 1,
            price: 150.0,
            paymentMethod: 'cash',
            cashier: { name: 'John Doe' },
            created_at: '2024-01-15T10:30:00Z',
            payer_type: 'patient',
            payer_id: 1,
            payer_name: 'Alice Johnson',
            information: {},
        },
        {
            id: 2,
            price: 75.5,
            paymentMethod: 'card',
            cashier: { name: 'Jane Smith' },
            created_at: '2024-01-16T14:20:00Z',
            payer_type: 'patient',
            payer_id: 1,
            payer_name: 'Alice Johnson',
            information: { receiptReferenceCode: 'REF123456' },
        },
    ],
};

export const mockAcceptanceItems = [
    { id: 1, name: 'Consultation', price: 100, discount: 0 },
    { id: 2, name: 'X-Ray', price: 150, discount: 10 },
    { id: 3, name: 'Lab Test', price: 75, discount: 5 },
];

export const mockPayers = [
    { type: 'patient', id: 1, name: 'Alice Johnson' },
    { type: 'referrer', id: 2, name: 'Dr. Smith Clinic' },
];

// Utility functions
export const formatCurrency = (value) => {
    return Math.round((value + Number.EPSILON) * 100) / 100;
};

export const sumAcceptanceItems = (items, field) => {
    if (Array.isArray(items))
        return items.reduce((total, item) => {
            return total + (parseFloat(item[field]) || 0);
        }, 0);
    return Object.keys(items).reduce((total, item) => {
        const itemTotal = items[item]?.reduce((a, b) => a + (parseFloat(b[field]) || 0), 0);

        return total + itemTotal;
    }, 0);
};

export const sumPayments = (items, field) => {
    return items.reduce((total, item) => total + (parseFloat(item[field]) || 0), 0);
};

// Payment method icons mapper
export const PAYMENT_METHOD_ICONS = {
    cash: <AttachMoney color="success" />,
    card: <CreditCard color="primary" />,
    credit: <AccountBalance color="warning" />,
    transfer: <SwapHoriz color="info" />,
};

// Payment method configuration
export const PAYMENT_METHODS = [
    {
        value: 'cash',
        label: 'Cash',
        icon: <AttachMoney />,
        color: 'success',
        description: 'Pay with physical currency',
    },
    {
        value: 'card',
        label: 'Card',
        icon: <CreditCard />,
        color: 'primary',
        description: 'Pay with credit/debit card',
    },
    {
        value: 'transfer',
        label: 'Bank Transfer',
        icon: <SwapHoriz />,
        color: 'info',
        description: 'Pay via bank transfer',
    },
    {
        value: 'credit',
        label: 'Credit',
        icon: <AccountBalance />,
        color: 'warning',
        description: "Add to referrer's credit balance",
    },
];
