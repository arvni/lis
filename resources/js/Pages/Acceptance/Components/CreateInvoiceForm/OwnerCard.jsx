import { Box, Paper, Radio, FormControlLabel, Chip, Typography, alpha } from '@mui/material';
import { CheckCircle } from '@mui/icons-material';
import { getOwnerAvatar } from './helpers';

/**
 * Selectable invoice-owner card (patient or referrer). The two variants are
 * identical apart from the theme color, label, icon and any extra detail row.
 */
const OwnerCard = ({ theme, type, color, selected, owner, title, label, labelIcon, extra }) => (
    <Paper
        variant={selected ? 'elevation' : 'outlined'}
        elevation={selected ? 3 : 0}
        sx={{
            p: 2,
            borderRadius: 2,
            flex: 1,
            borderColor: selected ? `${color}.main` : 'divider',
            backgroundColor: selected
                ? alpha(theme.palette[color].main, 0.05)
                : 'background.paper',
            transition: 'all 0.2s',
            position: 'relative',
            overflow: 'hidden',
        }}
    >
        {selected && (
            <Chip
                icon={<CheckCircle fontSize="small" />}
                label="Selected"
                color={color}
                size="small"
                sx={{ position: 'absolute', top: 8, right: 8 }}
            />
        )}

        <FormControlLabel
            value={type}
            control={<Radio color={color} sx={{ mr: 1 }} />}
            label=""
            sx={{ m: 0, width: '100%', alignItems: 'flex-start' }}
        />

        <Box sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
            {getOwnerAvatar(type, owner)}

            <Box sx={{ ml: 2 }}>
                <Typography variant="subtitle1" fontWeight="medium">
                    {title}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                    <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ display: 'flex', alignItems: 'center' }}
                    >
                        {labelIcon}
                        {label}
                    </Typography>
                    {extra}
                </Box>
            </Box>
        </Box>
    </Paper>
);

export default OwnerCard;
