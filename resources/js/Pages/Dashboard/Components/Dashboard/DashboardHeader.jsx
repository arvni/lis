import React from 'react';
import { AppBar, Badge, Box, Chip, Toolbar, Typography } from '@mui/material';
import {
    Timeline,
    Dashboard as DashboardIcon,
    NotificationsActive,
} from '@mui/icons-material';

const DashboardHeader = ({ title, showSystemHealth, totalAlerts, systemHealth }) => (
    <AppBar
        position="static"
        elevation={0}
        sx={{ bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider' }}
    >
        <Toolbar>
            <DashboardIcon sx={{ color: 'primary.main', mr: 2 }} />
            <Typography variant="h6" sx={{ flexGrow: 1, color: 'text.primary' }}>
                {title}
            </Typography>

            {showSystemHealth && totalAlerts > 0 && (
                <Badge badgeContent={totalAlerts} color="error" sx={{ mr: 2 }}>
                    <NotificationsActive color="action" />
                </Badge>
            )}

            {showSystemHealth && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip
                        icon={<Timeline />}
                        label={
                            systemHealth === 'good'
                                ? 'All Systems Operational'
                                : 'System Issues Detected'
                        }
                        color={systemHealth === 'good' ? 'success' : 'warning'}
                        variant="outlined"
                        size="small"
                    />
                </Box>
            )}
        </Toolbar>
    </AppBar>
);

export default DashboardHeader;
