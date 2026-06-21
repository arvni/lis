import React from 'react';
import { Box, Card, CardContent, Skeleton } from '@mui/material';

// Loading skeleton component
const MetricSkeleton = React.memo(() => (
    <Card sx={{ height: '100%', borderRadius: 2 }}>
        <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box sx={{ flex: 1, mr: 2 }}>
                    <Skeleton variant="text" width="70%" height={24} />
                    <Skeleton variant="text" width="50%" height={48} sx={{ my: 1 }} />
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Skeleton variant="rounded" width={80} height={24} />
                        <Skeleton variant="rounded" width={60} height={24} />
                    </Box>
                </Box>
                <Skeleton variant="circular" width={56} height={56} />
            </Box>
        </CardContent>
    </Card>
));
MetricSkeleton.displayName = 'MetricSkeleton';

export default MetricSkeleton;
