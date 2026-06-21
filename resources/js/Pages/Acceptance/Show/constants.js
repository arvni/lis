import {
    Print,
    Sms,
    WhatsApp,
    FlashOn as FlashOnIcon,
    PriorityHigh as PriorityHighIcon,
} from '@mui/icons-material';

export const PRIORITY_CONFIG = {
    stat: { label: 'STAT', color: 'error', icon: FlashOnIcon },
    urgent: { label: 'Urgent', color: 'warning', icon: PriorityHighIcon },
    routine: { label: 'Routine', color: 'default', icon: null },
};

// Mapping of report methods to their display components
export const methodConfig = {
    print: {
        icon: Print,
        label: 'Print',
    },
    sms: {
        icon: Sms,
        label: 'SMS',
    },
    whatsapp: {
        icon: WhatsApp,
        label: 'WhatsApp',
    },
};
