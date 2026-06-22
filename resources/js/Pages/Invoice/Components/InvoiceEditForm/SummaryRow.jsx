import { Box, Typography } from '@mui/material';

const SummaryRow = ({ label, value, valueColor = 'text.primary', strong }) => (
    <Box
        sx={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            gap: 2,
            py: 0.5,
        }}
    >
        <Typography
            variant={strong ? 'subtitle2' : 'body2'}
            color={strong ? 'text.primary' : 'text.secondary'}
        >
            {label}
        </Typography>
        <Typography
            variant={strong ? 'subtitle2' : 'body2'}
            color={valueColor}
            sx={{ fontVariantNumeric: 'tabular-nums' }}
        >
            {value}
        </Typography>
    </Box>
);

export default SummaryRow;
