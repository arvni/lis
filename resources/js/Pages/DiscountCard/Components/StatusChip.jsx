import React from 'react';
import { Chip, Tooltip } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import BlockIcon from '@mui/icons-material/Block';
import PauseCircleIcon from '@mui/icons-material/PauseCircle';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import EventBusyIcon from '@mui/icons-material/EventBusy';

// Expiry is derived from the date rather than stored, so it wins over the
// stored status when both would apply.
const CONFIG = {
    Active: { color: 'success', icon: <CheckCircleIcon />, hint: 'Redeemable' },
    Inactive: { color: 'default', icon: <HourglassEmptyIcon />, hint: 'Not handed out yet' },
    Suspended: { color: 'warning', icon: <PauseCircleIcon />, hint: 'Temporarily blocked' },
    Revoked: { color: 'error', icon: <BlockIcon />, hint: 'Permanently dead' },
};

const StatusChip = ({ status, expired = false }) => {
    if (expired) {
        return (
            <Tooltip title="Past its expiry date">
                <Chip
                    icon={<EventBusyIcon />}
                    label="Expired"
                    size="small"
                    color="error"
                    variant="outlined"
                />
            </Tooltip>
        );
    }

    const config = CONFIG[status] ?? CONFIG.Inactive;

    return (
        <Tooltip title={config.hint}>
            <Chip
                icon={config.icon}
                label={status}
                size="small"
                color={config.color}
                variant="outlined"
            />
        </Tooltip>
    );
};

export default StatusChip;
