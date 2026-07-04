import { Box, Typography } from '@mui/material';

const StepLabel = ({ number, children }) => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
        <Box
            sx={{
                width: 22,
                height: 22,
                borderRadius: '50%',
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 11,
                fontWeight: 800,
                flexShrink: 0,
            }}
        >
            {number}
        </Box>
        <Typography
            variant="caption"
            fontWeight={700}
            color="text.secondary"
            sx={{ letterSpacing: '0.1em', textTransform: 'uppercase' }}
        >
            {children}
        </Typography>
    </Box>
);

export default StepLabel;
