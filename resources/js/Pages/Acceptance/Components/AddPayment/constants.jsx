import React from 'react';
import { AccountBalance, AttachMoney, CreditCard, SwapHoriz } from '@mui/icons-material';

export const PAYMENT_METHOD_VALUES = ['cash', 'card', 'credit', 'transfer'];

/**
 * Payment methods configuration with enhanced visual cues.
 * Credit is disabled unless the payer is a referrer.
 */
export const buildPaymentMethods = (payerType) => [
    {
        value: 'cash',
        label: 'Cash',
        icon: <AttachMoney />,
        color: 'success',
        description: 'Pay with physical currency',
        disabled: false,
    },
    {
        value: 'card',
        label: 'Card',
        icon: <CreditCard />,
        color: 'primary',
        description: 'Pay with credit/debit card',
        disabled: false,
    },
    {
        value: 'transfer',
        label: 'Bank Transfer',
        icon: <SwapHoriz />,
        color: 'info',
        description: 'Pay via bank transfer',
        disabled: false,
    },
    {
        value: 'credit',
        label: 'Credit',
        icon: <AccountBalance />,
        color: 'warning',
        description: "Add to referrer's credit balance",
        disabled: payerType !== 'referrer',
    },
];
