import React from 'react';
import { Box, Typography, LinearProgress, Stack, Skeleton, alpha } from '@mui/material';
import { TableRows as TableRowsIcon } from '@mui/icons-material';

/**
 * Enhanced empty data overlay with better visuals and clearer messaging
 */
export const CustomNoRowsOverlay = () => {
    return (
        <Stack sx={{ height: '100%', alignItems: 'center', justifyContent: 'center', py: 5 }}>
            <TableRowsIcon sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.4, mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
                No Records Found
            </Typography>
            <Typography
                variant="body2"
                color="text.disabled"
                align="center"
                sx={{ maxWidth: 300, mx: 'auto' }}
            >
                Try adjusting your search or filter criteria to find what you&apos;re looking for
            </Typography>
        </Stack>
    );
};

/**
 * Improved loading overlay with better visual feedback
 */
export const CustomLoadingOverlay = () => {
    return (
        <Box
            sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                bgcolor: alpha('#fff', 0.7),
                zIndex: 2,
            }}
        >
            <Box sx={{ position: 'sticky', top: 0, width: '100%' }}>
                <LinearProgress color="primary" />
            </Box>
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                }}
            >
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        p: 3,
                        borderRadius: 2,
                        minWidth: 200,
                    }}
                >
                    <Box sx={{ mb: 2 }}>
                        <Skeleton variant="circular" width={40} height={40} />
                    </Box>
                    <Skeleton variant="text" width={120} height={24} />
                    <Skeleton variant="text" width={160} height={18} />
                </Box>
            </Box>
        </Box>
    );
};
