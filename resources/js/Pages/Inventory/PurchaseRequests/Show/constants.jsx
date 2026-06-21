import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import PaymentIcon from '@mui/icons-material/Payment';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import MoveToInboxIcon from '@mui/icons-material/MoveToInbox';
import SendIcon from '@mui/icons-material/Send';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutlined';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import AccountTreeIcon from '@mui/icons-material/AccountTree';

export const STATUS_COLORS = {
    DRAFT: 'default',
    SUBMITTED: 'info',
    APPROVED: 'success',
    ORDERED: 'warning',
    PAID: 'secondary',
    SHIPPED: 'info',
    PARTIALLY_RECEIVED: 'warning',
    RECEIVED: 'success',
    CANCELLED: 'error',
};

export const EVENT_META = {
    CREATED: { label: 'Created', color: 'grey', icon: <AddCircleOutlineIcon fontSize="small" /> },
    SUBMITTED: { label: 'Submitted', color: 'info', icon: <SendIcon fontSize="small" /> },
    APPROVED: { label: 'Approved', color: 'success', icon: <CheckCircleIcon fontSize="small" /> },
    ORDERED: {
        label: 'PO Issued',
        color: 'warning',
        icon: <AssignmentTurnedInIcon fontSize="small" />,
    },
    PAID: { label: 'Payment Recorded', color: 'secondary', icon: <PaymentIcon fontSize="small" /> },
    SHIPPED: { label: 'Shipped', color: 'info', icon: <LocalShippingIcon fontSize="small" /> },
    RECEIVED_PARTIAL: {
        label: 'Partially Received',
        color: 'warning',
        icon: <MoveToInboxIcon fontSize="small" />,
    },
    RECEIVED: {
        label: 'Fully Received',
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
    RESUBMITTED: { label: 'Re-submitted', color: 'info', icon: <SendIcon fontSize="small" /> },
    STEP_DELEGATED: {
        label: 'Step Delegated',
        color: 'secondary',
        icon: <AccountTreeIcon fontSize="small" />,
    },
};

export const APPROVAL_COLORS = { PENDING: 'warning', APPROVED: 'success', REJECTED: 'error' };

export const canCancel = (status) => !['RECEIVED', 'CANCELLED'].includes(status);
export const canReceive = (status) => ['SHIPPED', 'PARTIALLY_RECEIVED'].includes(status);
