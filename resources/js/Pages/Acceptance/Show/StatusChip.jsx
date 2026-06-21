import { Chip } from '@mui/material';

// Status chip component for better consistency
const StatusChip = ({ status }) => {
    const getStatusColor = () => {
        switch (status?.toLowerCase()) {
            case 'completed':
                return 'success';
            case 'pending':
                return 'warning';
            case 'cancelled':
                return 'error';
            default:
                return 'primary';
        }
    };

    return (
        <Chip
            label={status || 'Created'}
            color={getStatusColor()}
            variant="filled"
            sx={{
                fontWeight: 'bold',
                fontSize: '0.9rem',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            }}
        />
    );
};

export default StatusChip;
