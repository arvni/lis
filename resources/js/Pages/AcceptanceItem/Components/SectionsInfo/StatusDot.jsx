import { Tooltip, useTheme } from '@mui/material';
import { TimelineDot } from '@mui/lab';
import { workflowStatus } from './constants.jsx';

// Enhanced status dot component
const StatusDot = ({ status }) => {
    const theme = useTheme();
    const statusConfig = workflowStatus[status];

    return (
        <Tooltip title={statusConfig.description} arrow placement="top">
            <TimelineDot
                color={statusConfig.color}
                sx={{
                    boxShadow: theme.shadows[3],
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                        transform: 'scale(1.15)',
                        boxShadow: theme.shadows[6],
                    },
                    cursor: 'pointer',
                }}
            >
                {statusConfig.icon}
            </TimelineDot>
        </Tooltip>
    );
};

export default StatusDot;
