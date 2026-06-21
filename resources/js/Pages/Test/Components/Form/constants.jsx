import React from 'react';
import {
    Assignment,
    Biotech,
    Description,
    Money,
    ReceiptLong,
    Science,
    ViewInAr,
} from '@mui/icons-material';

// ─── step config per type ─────────────────────────────────────────────────────

export const STEPS = {
    TEST: [
        {
            key: 'basic',
            label: 'Basic Info',
            icon: <Assignment fontSize="small" />,
            errorFields: ['fullName', 'name', 'code', 'report_templates'],
        },
        {
            key: 'samples',
            label: 'Sample Types',
            icon: <Biotech fontSize="small" />,
            errorFields: ['sample_type_tests'],
        },
        {
            key: 'methods',
            label: 'Methods',
            icon: <Science fontSize="small" />,
            errorFields: ['method_tests'],
        },
        {
            key: 'description',
            label: 'Description',
            icon: <Description fontSize="small" />,
            errorFields: [],
        },
    ],
    SERVICE: [
        {
            key: 'basic',
            label: 'Basic Info',
            icon: <Assignment fontSize="small" />,
            errorFields: ['fullName', 'name', 'code'],
        },
        {
            key: 'methods',
            label: 'Methods',
            icon: <ReceiptLong fontSize="small" />,
            errorFields: ['method_tests'],
        },
        {
            key: 'description',
            label: 'Description',
            icon: <Description fontSize="small" />,
            errorFields: [],
        },
    ],
    PANEL: [
        {
            key: 'basic',
            label: 'Basic Info',
            icon: <Assignment fontSize="small" />,
            errorFields: ['fullName', 'name', 'code'],
        },
        {
            key: 'pricing',
            label: 'Pricing',
            icon: <Money fontSize="small" />,
            errorFields: ['price', 'referrer_price'],
        },
        {
            key: 'methods',
            label: 'Tests',
            icon: <ViewInAr fontSize="small" />,
            errorFields: ['method_tests'],
        },
        {
            key: 'description',
            label: 'Description',
            icon: <Description fontSize="small" />,
            errorFields: [],
        },
    ],
};

export const TYPE_META = {
    TEST: { label: 'Test', Icon: Science, color: 'primary' },
    SERVICE: { label: 'Service', Icon: ReceiptLong, color: 'secondary' },
    PANEL: { label: 'Panel', Icon: ViewInAr, color: 'info' },
};
