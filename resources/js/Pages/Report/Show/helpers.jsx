import { ThumbDownAlt, ThumbUpAlt, HistoryOutlined, Share } from '@mui/icons-material';

export const formatDate = (date) => {
    if (!date) return '';
    if (typeof date === 'string') date = new Date(date);
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    }).format(date);
};

// Get report status chip configuration
export const getStatusChip = (report, currentStep) => {
    if (!report.status) {
        return { label: 'Rejected', color: 'error', icon: <ThumbDownAlt fontSize="small" /> };
    }
    if (report.publisher) {
        return { label: 'Published', color: 'success', icon: <Share fontSize="small" /> };
    }
    if (report.approver) {
        return { label: 'Approved', color: 'primary', icon: <ThumbUpAlt fontSize="small" /> };
    }
    if (report.approval_status === 'in_approval' && currentStep) {
        return {
            label: `In Approval — ${currentStep.name}`,
            color: 'info',
            icon: <HistoryOutlined fontSize="small" />,
        };
    }
    return { label: 'Pending', color: 'warning', icon: <HistoryOutlined fontSize="small" /> };
};
