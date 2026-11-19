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
// errorFields: every request field a step edits, so a server error lands on its step.

const BASIC_FIELDS = [
    'fullName',
    'name',
    'code',
    'type',
    'status',
    'can_merge',
    'test_groups',
    'request_form',
    'consent_form',
    'instruction',
];

export const STEPS = {
    TEST: [
        {
            key: 'basic',
            label: 'Basic Info',
            icon: <Assignment fontSize="small" />,
            errorFields: [...BASIC_FIELDS, 'report_templates'],
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
            errorFields: ['description'],
        },
    ],
    SERVICE: [
        {
            key: 'basic',
            label: 'Basic Info',
            icon: <Assignment fontSize="small" />,
            errorFields: BASIC_FIELDS,
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
            errorFields: ['description'],
        },
    ],
    PANEL: [
        {
            key: 'basic',
            label: 'Basic Info',
            icon: <Assignment fontSize="small" />,
            errorFields: BASIC_FIELDS,
        },
        {
            key: 'pricing',
            label: 'Pricing',
            icon: <Money fontSize="small" />,
            errorFields: [
                'price',
                'referrer_price',
                'price_type',
                'referrer_price_type',
                'extra',
                'referrer_extra',
            ],
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
            errorFields: ['description'],
        },
    ],
};

export const TYPE_META = {
    TEST: { label: 'Test', Icon: Science, color: 'primary' },
    SERVICE: { label: 'Service', Icon: ReceiptLong, color: 'secondary' },
    PANEL: { label: 'Panel', Icon: ViewInAr, color: 'info' },
};
