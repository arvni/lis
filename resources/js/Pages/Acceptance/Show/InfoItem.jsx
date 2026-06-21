import { Box } from '@mui/material';
import Typography from '@mui/material/Typography';

// Info Item component for consistent styling across information sections
const InfoItem = ({ label, value, icon, valueComponent }) => {
    const Icon = icon;
    return (
        <Box
            sx={{
                display: 'flex',
                gap: 1,
                alignItems: 'center',
                py: 0.5,
            }}
        >
            {icon && <Icon fontSize="small" color="action" />}
            <Typography fontWeight="bold" color="text.secondary" sx={{ minWidth: 120 }}>
                {label}:
            </Typography>
            {valueComponent || (
                <Typography sx={{ wordBreak: 'break-word' }}>{value || 'N/A'}</Typography>
            )}
        </Box>
    );
};

export default InfoItem;
