import {
    AttachMoney as AttachMoneyIcon,
    CreditCard as CreditCardIcon,
    AccountBalance as AccountBalanceIcon,
} from '@mui/icons-material';

export const formatCurrency = (value) => Math.round((value + Number.EPSILON) * 100) / 100;

// Payment method icons mapper
export const PAYMENT_METHOD_ICONS = {
    cash: <AttachMoneyIcon color="success" />,
    card: <CreditCardIcon color="primary" />,
    credit: <AccountBalanceIcon color="warning" />,
};

export const PAYMENT_METHOD_LABELS = {
    cash: 'Cash',
    card: 'Card',
    credit: 'Credit',
};
