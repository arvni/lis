import { lazy, Suspense } from 'react';
import { Box, Card, CardContent, Skeleton, Typography } from '@mui/material';

const CollectRequestChart = lazy(() => import('../CollectRequestChart'));

const Stat = ({ label, value, color }) => (
    <Box sx={{ textAlign: 'center' }}>
        <Typography variant="caption" color="text.secondary">
            {label}
        </Typography>
        <Typography variant="h6" color={color}>
            {value}
        </Typography>
    </Box>
);

const TemperatureCard = ({ temperatureData, temperatureStats }) => (
    <Card variant="outlined">
        <CardContent>
            <Typography variant="subtitle2" color="primary" gutterBottom>
                Temperature Monitoring
            </Typography>

            {temperatureStats && (
                <Box
                    sx={{
                        display: 'flex',
                        gap: 2,
                        mb: 2,
                        flexWrap: 'wrap',
                        justifyContent: 'space-around',
                    }}
                >
                    <Stat label="Min Temp" value={`${temperatureStats.min}°C`} color="primary" />
                    <Stat label="Max Temp" value={`${temperatureStats.max}°C`} color="error" />
                    <Stat
                        label="Avg Temp"
                        value={`${temperatureStats.avg}°C`}
                        color="success.main"
                    />
                    <Stat label="Total Readings" value={temperatureStats.count} />
                </Box>
            )}

            <Suspense
                fallback={
                    <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 1 }} />
                }
            >
                <CollectRequestChart temperatureData={temperatureData} />
            </Suspense>
        </CardContent>
    </Card>
);

export default TemperatureCard;
