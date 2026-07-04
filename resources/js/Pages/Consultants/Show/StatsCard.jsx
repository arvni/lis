import { alpha, Box, Paper, Stack, Typography, useTheme } from '@mui/material';
import { AccessTime, Assignment, CalendarMonth } from '@mui/icons-material';

const StatsCard = ({ consultant }) => {
    const theme = useTheme();
    const stats = [
        {
            label: 'Total Consultations',
            value: consultant.consultations_count || 0,
            color: theme.palette.primary.main,
            icon: <Assignment />,
        },
        {
            label: 'Upcoming Times',
            value: consultant.upcoming_times_count || 0,
            color: theme.palette.success.main,
            icon: <AccessTime />,
        },
        {
            label: 'Upcoming Consultations',
            value: consultant.upcoming_consultations_count || 0,
            color: theme.palette.secondary.main,
            icon: <CalendarMonth />,
        },
    ];

    return (
        <Paper elevation={2} sx={{ borderRadius: 3, p: 2.5 }}>
            <Typography variant="overline" color="text.secondary" display="block" sx={{ mb: 2 }}>
                Statistics
            </Typography>
            <Stack spacing={1.5}>
                {stats.map((stat, i) => (
                    <Box
                        key={i}
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 2,
                            p: 1.5,
                            borderRadius: 2,
                            bgcolor: alpha(stat.color, 0.06),
                        }}
                    >
                        <Box
                            sx={{
                                width: 42,
                                height: 42,
                                borderRadius: 1.5,
                                flexShrink: 0,
                                bgcolor: alpha(stat.color, 0.15),
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: stat.color,
                            }}
                        >
                            {stat.icon}
                        </Box>
                        <Box>
                            <Typography variant="caption" color="text.secondary" display="block">
                                {stat.label}
                            </Typography>
                            <Typography variant="h6" fontWeight="bold" color={stat.color}>
                                {stat.value}
                            </Typography>
                        </Box>
                    </Box>
                ))}
            </Stack>
        </Paper>
    );
};

export default StatsCard;
