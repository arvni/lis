import { Box, Chip, Paper, Typography } from '@mui/material';
import { PlaylistAddCheck } from '@mui/icons-material';

const PanelInfoBar = ({ panel, itemCount }) => (
    <Paper variant="outlined" sx={{ p: 2, borderRadius: 1.5, bgcolor: 'secondary.50' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PlaylistAddCheck color="secondary" fontSize="small" />
                <Typography variant="subtitle2" fontWeight="bold">
                    {panel?.name}
                </Typography>
                <Chip
                    label={`${itemCount} tests`}
                    size="small"
                    color="secondary"
                    variant="outlined"
                />
            </Box>
            {panel?.price_type === 'Fix' && (
                <Typography variant="subtitle2" color="secondary.main" fontWeight="bold">
                    {panel.price} OMR
                </Typography>
            )}
        </Box>
    </Paper>
);

export default PanelInfoBar;
