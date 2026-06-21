import {
    Cancel as CancelIcon,
    CheckCircle as CheckCircleIcon,
    Science as ScienceIcon,
    Input as InputIcon,
    Settings as SettingsIcon,
    Assignment as AssignmentIcon,
    HourglassEmpty as HourglassEmptyIcon,
    Warning as WarningIcon,
    MergeType as MergeTypeIcon,
} from '@mui/icons-material';

// Format currency amounts
export const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'OMR',
        minimumFractionDigits: 2,
    }).format(amount);
};

// Get status info based on status text
export const getStatusInfo = (status) => {
    const statusMap = {
        'waiting for payment': {
            color: 'warning',
            icon: <HourglassEmptyIcon />,
            label: 'Waiting for Payment',
        },
        sampling: {
            color: 'info',
            icon: <ScienceIcon />,
            label: 'Sampling',
        },
        pooling: {
            color: 'secondary',
            icon: <MergeTypeIcon />,
            label: 'Pooling',
        },
        'waiting for entering': {
            color: 'warning',
            icon: <InputIcon />,
            label: 'Waiting for Entry',
        },
        processing: {
            color: 'info',
            icon: <SettingsIcon />,
            label: 'Processing',
        },
        reported: {
            color: 'success',
            icon: <AssignmentIcon />,
            label: 'Reported',
        },
        canceled: {
            color: 'error',
            icon: <CancelIcon />,
            label: 'Canceled',
        },
    };

    // Default case for backward compatibility
    if (!statusMap[status?.toLowerCase()]) {
        if (status === 'Completed')
            return { color: 'success', icon: <CheckCircleIcon />, label: status };
        if (status === 'Pending')
            return { color: 'warning', icon: <HourglassEmptyIcon />, label: status };
        if (status === 'In Progress')
            return { color: 'info', icon: <SettingsIcon />, label: status };
        return { color: 'default', icon: <WarningIcon />, label: status || 'Unknown' };
    }

    return statusMap[status.toLowerCase()];
};

export const getBarcodeChipColor = (index) => {
    // Cycle through colors for visual distinction
    const colors = ['primary', 'secondary', 'success', 'warning', 'info'];
    return colors[index % colors.length];
};

export const getRowClassName = (params) => {
    const status = params.row.status?.toLowerCase();

    if (status === 'canceled') {
        return 'canceled-row';
    }

    if (status === 'reported') {
        return 'reported-row';
    }

    return '';
};
