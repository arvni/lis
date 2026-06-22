import { Avatar, Box, Chip, Paper, Stack, Typography, alpha, useTheme } from '@mui/material';
import { CheckCircle } from '@mui/icons-material';

const PartyCard = ({
    title,
    icon,
    color = 'primary',
    name,
    lines = [],
    selected,
    onSelect,
    selectable,
}) => {
    const theme = useTheme();
    const borderColor = selected ? `${color}.main` : 'divider';
    const bg = selected ? alpha(theme.palette[color].main, 0.06) : 'background.paper';

    return (
        <Paper
            variant="outlined"
            onClick={selectable ? onSelect : undefined}
            sx={{
                p: 2,
                borderRadius: 2,
                borderColor,
                backgroundColor: bg,
                cursor: selectable ? 'pointer' : 'default',
                position: 'relative',
                transition: 'all 0.15s',
                height: '100%',
                '&:hover': selectable ? { borderColor: `${color}.main` } : {},
            }}
        >
            {selected && selectable && (
                <Chip
                    icon={<CheckCircle fontSize="small" />}
                    label="Owner"
                    color={color}
                    size="small"
                    sx={{ position: 'absolute', top: 8, right: 8 }}
                />
            )}
            <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1.5 }}>
                <Avatar sx={{ bgcolor: `${color}.main`, width: 40, height: 40 }}>{icon}</Avatar>
                <Box>
                    <Typography variant="overline" color="text.secondary" sx={{ lineHeight: 1 }}>
                        {title}
                    </Typography>
                    <Typography variant="subtitle1" fontWeight="medium">
                        {name || '—'}
                    </Typography>
                </Box>
            </Stack>
            <Stack spacing={0.5}>
                {lines
                    .filter((l) => l && l.value)
                    .map((l) => (
                        <Box
                            key={l.label}
                            sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}
                        >
                            <Typography variant="caption" color="text.secondary">
                                {l.label}
                            </Typography>
                            <Typography
                                variant="caption"
                                fontWeight="medium"
                                sx={{ textAlign: 'right' }}
                            >
                                {l.value}
                            </Typography>
                        </Box>
                    ))}
            </Stack>
        </Paper>
    );
};

export default PartyCard;
