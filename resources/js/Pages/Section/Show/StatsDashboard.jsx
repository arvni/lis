import { Box, Grid as Grid, Paper, Typography, useTheme } from '@mui/material';
import {
    AccessTimeOutlined as AccessTimeIcon,
    CheckCircleOutlined as CheckCircleIcon,
    ErrorOutlined as ErrorOutlineIcon,
    HourglassEmpty as HourglassEmptyIcon,
    Dashboard as DashboardIcon,
} from '@mui/icons-material';

const StatCard = ({ label, value, palette, valueColor, icon }) => {
    const theme = useTheme();

    return (
        <Grid size={{ xs: 12, md: 6, lg: 2.4 }}>
            <Paper
                elevation={1}
                sx={{
                    p: 2,
                    borderRadius: 2,
                    borderLeft: `4px solid ${theme.palette[palette].main}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}
            >
                <Box>
                    <Typography variant="body2" color="text.secondary">
                        {label}
                    </Typography>
                    <Typography variant="h4" fontWeight="bold" color={valueColor}>
                        {value}
                    </Typography>
                </Box>
                <Box
                    sx={{
                        p: 1,
                        borderRadius: '50%',
                        backgroundColor: theme.palette[palette].light,
                        display: 'flex',
                    }}
                >
                    {icon}
                </Box>
            </Paper>
        </Grid>
    );
};

const StatsDashboard = ({ stats }) => {
    const cards = [
        {
            label: 'Total Samples',
            value: stats.total,
            palette: 'primary',
            icon: <DashboardIcon fontSize="large" sx={{ color: 'white' }} />,
        },
        {
            label: 'Completed',
            value: stats.finished || 0,
            palette: 'success',
            valueColor: 'success.main',
            icon: <CheckCircleIcon fontSize="large" sx={{ color: 'white' }} />,
        },
        {
            label: 'In Progress',
            value: stats.processing || 0,
            palette: 'info',
            valueColor: 'info.main',
            icon: <AccessTimeIcon fontSize="large" sx={{ color: 'white' }} />,
        },
        {
            label: 'Waiting',
            value: stats.waiting || 0,
            palette: 'warning',
            valueColor: 'warning.main',
            icon: <HourglassEmptyIcon fontSize="large" sx={{ color: 'white' }} />,
        },
        {
            label: 'Rejected',
            value: stats.rejected || 0,
            palette: 'error',
            valueColor: 'error.main',
            icon: <ErrorOutlineIcon fontSize="large" sx={{ color: 'white' }} />,
        },
    ];

    return (
        <Grid container spacing={2} sx={{ mb: 3 }}>
            {cards.map((card) => (
                <StatCard key={card.label} {...card} />
            ))}
        </Grid>
    );
};

export default StatsDashboard;
