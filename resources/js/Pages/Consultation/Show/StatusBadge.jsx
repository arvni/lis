import React from 'react';
import { Chip } from '@mui/material';

// Status badge component with appropriate colors
const StatusBadge = ({ status }) => {
    const getColor = () => {
        switch (status?.toLowerCase()) {
            case 'waiting':
                return 'warning';
            case 'started':
                return 'info';
            case 'done':
                return 'success';
            default:
                return 'default';
        }
    };

    return (
        <Chip
            label={status || 'Unknown'}
            color={getColor()}
            size="medium"
            sx={{
                textTransform: 'capitalize',
                fontWeight: 500,
                px: 1,
                borderRadius: 2,
            }}
        />
    );
};

export default StatusBadge;
