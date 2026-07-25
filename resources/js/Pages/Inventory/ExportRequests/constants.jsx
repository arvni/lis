import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import MoveToInboxIcon from '@mui/icons-material/MoveToInbox';
import SendIcon from '@mui/icons-material/Send';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutlined';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import AccountTreeIcon from '@mui/icons-material/AccountTree';

export const EXPORT_REQUEST_STATUSES = [
    'DRAFT',
    'SUBMITTED',
    'APPROVED',
    'PARTIALLY_FULFILLED',
    'FULFILLED',
    'CANCELLED',
];

export const STATUS_COLORS = {
    DRAFT: 'default',
    SUBMITTED: 'info',
    APPROVED: 'success',
    PARTIALLY_FULFILLED: 'warning',
    FULFILLED: 'success',
    CANCELLED: 'error',
};

export const EVENT_META = {
    CREATED: { label: 'Created', color: 'grey', icon: <AddCircleOutlineIcon fontSize="small" /> },
    SUBMITTED: { label: 'Submitted', color: 'info', icon: <SendIcon fontSize="small" /> },
    RESUBMITTED: { label: 'Re-submitted', color: 'info', icon: <SendIcon fontSize="small" /> },
    APPROVED: { label: 'Approved', color: 'success', icon: <CheckCircleIcon fontSize="small" /> },
    FULFILLED_PARTIAL: {
        label: 'Partially Fulfilled',
        color: 'warning',
        icon: <MoveToInboxIcon fontSize="small" />,
    },
    FULFILLED: {
        label: 'Fully Fulfilled',
        color: 'success',
        icon: <MoveToInboxIcon fontSize="small" />,
    },
    CANCELLED: { label: 'Cancelled', color: 'error', icon: <CancelIcon fontSize="small" /> },
    STEP_APPROVED: {
        label: 'Step Approved',
        color: 'success',
        icon: <ThumbUpIcon fontSize="small" />,
    },
    REJECTED: { label: 'Step Rejected', color: 'error', icon: <ThumbDownIcon fontSize="small" /> },
    RECALLED: {
        label: 'Recalled by Requester',
        color: 'warning',
        icon: <CancelIcon fontSize="small" />,
    },
    STEP_DELEGATED: {
        label: 'Step Delegated',
        color: 'secondary',
        icon: <AccountTreeIcon fontSize="small" />,
    },
};

export const APPROVAL_COLORS = { PENDING: 'warning', APPROVED: 'success', REJECTED: 'error' };

export const canCancel = (status) => !['FULFILLED', 'CANCELLED'].includes(status);
export const canFulfill = (status) => ['APPROVED', 'PARTIALLY_FULFILLED'].includes(status);
