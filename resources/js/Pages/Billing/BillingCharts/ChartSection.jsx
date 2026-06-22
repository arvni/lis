import { Box, CircularProgress, Paper, Skeleton, Typography, useTheme } from '@mui/material';

const ChartSection = ({ title, icon: Icon, loading, children }) => {
    const theme = useTheme();
    return (
        <Paper elevation={1} sx={{ borderRadius: 2, overflow: 'hidden', mb: 3 }}>
            <Box
                sx={{
                    p: 2,
                    borderBottom: `1px solid ${theme.palette.divider}`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                }}
            >
                <Icon fontSize="small" color="primary" />
                <Typography variant="subtitle1" fontWeight="bold">
                    {title}
                </Typography>
                {loading && <CircularProgress size={16} sx={{ ml: 1 }} />}
            </Box>
            <Box sx={{ p: 2 }}>
                {loading ? (
                    <Skeleton variant="rectangular" height={280} sx={{ borderRadius: 1 }} />
                ) : (
                    children
                )}
            </Box>
        </Paper>
    );
};

export default ChartSection;
