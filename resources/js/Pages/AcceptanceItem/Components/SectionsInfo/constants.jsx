import {
    AccessTime as AccessTimeIcon,
    CheckCircle,
    ErrorOutlined as ErrorOutline,
    HourglassEmpty,
} from '@mui/icons-material';

// Enhanced status configuration
export const workflowStatus = {
    waiting: {
        icon: <HourglassEmpty fontSize="small" />,
        color: 'warning',
        label: 'Waiting',
        description: 'This section is waiting to be processed',
    },
    processing: {
        icon: <AccessTimeIcon fontSize="small" />,
        color: 'info',
        label: 'Processing',
        description: 'This section is currently being processed',
    },
    finished: {
        icon: <CheckCircle fontSize="small" />,
        color: 'success',
        label: 'Finished',
        description: 'This section has been completed successfully',
    },
    rejected: {
        icon: <ErrorOutline fontSize="small" />,
        color: 'error',
        label: 'Rejected',
        description: 'This section was rejected and needs attention',
    },
};

// Format date string to be more readable
export const formatDateTime = (dateTimeStr) => {
    if (!dateTimeStr) return '-';

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
