import {
    AccessTimeOutlined as AccessTimeIcon,
    CheckCircleOutlined as CheckCircleIcon,
    ErrorOutlined as ErrorOutlineIcon,
    HourglassEmpty as HourglassEmptyIcon,
} from '@mui/icons-material';

// Status configurations with icons and colors
export const STATUS_CONFIG = {
    rejected: {
        icon: <ErrorOutlineIcon fontSize="small" />,
        label: 'Rejected',
        color: 'error',
        chipColor: 'error',
    },
    finished: {
        icon: <CheckCircleIcon fontSize="small" />,
        label: 'Finished',
        color: 'success',
        chipColor: 'success',
    },
    processing: {
        icon: <AccessTimeIcon fontSize="small" />,
        label: 'Processing',
        color: 'info',
        chipColor: 'info',
    },
    waiting: {
        icon: <HourglassEmptyIcon fontSize="small" />,
        label: 'Waiting',
        color: 'warning',
        chipColor: 'warning',
    },
};

export const ACCEPTANCE_ITEM_STATES_STATUS = {
    REJECTED: 'rejected',
    FINISHED: 'finished',
    PROCESSING: 'processing',
    WAITING: 'waiting',
};

export const formatDateTime = (dateTimeStr) => {
    if (!dateTimeStr) return '-';
    if (typeof dateTimeStr === 'string') return dateTimeStr;

    try {
        const date = new Date(dateTimeStr);
        return new Intl.DateTimeFormat('default', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
        }).format(date);
    } catch (e) {
        return dateTimeStr;
    }
};

export const getNestedParents = (sectionGroup) => {
    if (sectionGroup.parent) {
        return [
            ...getNestedParents(sectionGroup.parent),
            {
                title: sectionGroup.name,
                link: route('sectionGroups.show', sectionGroup.id),
                icon: null,
            },
        ];
    }
    return [
        {
            title: sectionGroup.name,
            link: route('sectionGroups.show', sectionGroup.id),
            icon: null,
        },
    ];
};
