import { Box, Typography } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import UndoIcon from '@mui/icons-material/Undo';
import BuildIcon from '@mui/icons-material/Build';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutlined';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import BlockIcon from '@mui/icons-material/Block';

export const STATUS_COLORS = {
    DRAFT: 'default',
    PENDING_APPROVAL: 'warning',
    APPROVED: 'success',
    CANCELLED: 'error',
};

export const TYPE_COLORS = {
    ENTRY: 'success',
    EXPORT: 'error',
    ADJUST: 'warning',
    TRANSFER: 'info',
    RETURN: 'secondary',
    EXPIRED_REMOVAL: 'error',
};

export const EVENT_META = {
    CREATED: { label: 'Created', color: 'grey', icon: <AddCircleOutlineIcon fontSize="small" /> },
    SUBMITTED: {
        label: 'Submitted for approval',
        color: 'info',
        icon: <SendIcon fontSize="small" />,
    },
    RETURNED: {
        label: 'Returned to requester',
        color: 'warning',
        icon: <UndoIcon fontSize="small" />,
    },
    REVISED: {
        label: 'Revised by requester',
        color: 'primary',
        icon: <BuildIcon fontSize="small" />,
    },
    APPROVED: { label: 'Approved', color: 'success', icon: <TaskAltIcon fontSize="small" /> },
    CANCELLED: { label: 'Cancelled', color: 'error', icon: <BlockIcon fontSize="small" /> },
};

export const InfoRow = ({ label, children }) => (
    <Box
        sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            py: 0.75,
        }}
    >
        <Typography variant="body2" color="text.secondary" sx={{ minWidth: 110 }}>
            {label}
        </Typography>
        <Typography variant="body2" fontWeight={500} align="right">
            {children || '—'}
        </Typography>
    </Box>
);
