import React from 'react';
import { Box, Card, CardContent, Typography, Divider, useTheme, alpha } from '@mui/material';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';

const PatientSummaryCard = ({ patient, stats, actions, tabs, pageProps }) => {
    const theme = useTheme();

    return (
        <Card
            elevation={0}
            sx={{
                mb: 3,
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 2,
                backgroundColor: alpha(theme.palette.primary.main, 0.03), // Use theme alpha
            }}
        >
            <CardContent>
                <Box
                    sx={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 3,
                        alignItems: 'center',
                        justifyContent: 'space-between',
                    }}
                >
                    {/* Patient Info */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar
                            src={patient.avatar} // Assuming patient object has avatar URL
                            alt={patient.fullName}
                            sx={{
                                bgcolor: 'primary.main', // Background color if no image
                                width: 56,
                                height: 56,
                            }}
                        >
                            {patient.fullName?.charAt(0).toUpperCase()} {/* Fallback initial */}
                        </Avatar>
                        <Box>
                            <Typography
                                variant="h6"
                                component="div"
                                color="primary.main"
                                sx={{ mb: 0.5 }}
                            >
                                {patient.fullName}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                ID: {patient.idNo || 'N/A'}
                            </Typography>
                            {/* Actions */}
                            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                                {actions.map((action, index) => (
                                    <Button
                                        key={index}
                                        variant="outlined"
                                        color={action.color}
                                        size="small"
                                        startIcon={action.icon}
                                        onClick={action.onClick}
                                    >
                                        {action.name}
                                    </Button>
                                ))}
                            </Box>
                        </Box>
                    </Box>

                    {/* Stats */}
                    <Box
                        sx={{
                            display: 'flex',
                            gap: { xs: 2, md: 3 },
                            flexWrap: 'wrap',
                            justifyContent: { xs: 'flex-start', md: 'flex-end' },
                        }}
                    >
                        {/* Use tabs array for consistency */}
                        {tabs.slice(1).map(
                            (
                                tab,
                                index, // Start from index 1 (skip Overview)
                            ) => (
                                <React.Fragment key={tab.label}>
                                    {index > 0 && <Divider orientation="vertical" flexItem />}
                                    <Box sx={{ textAlign: 'center' }}>
                                        <Typography
                                            variant="overline"
                                            color="text.secondary"
                                            sx={{ display: 'block', lineHeight: 1.2 }}
                                        >
                                            {tab.label}
                                        </Typography>
                                        <Typography variant="h6">
                                            {/* Use data from props directly for summary */}
                                            {pageProps[tab.dataKey]?.length ??
                                                stats?.[tab.dataKey] ??
                                                0}
                                        </Typography>
                                    </Box>
                                </React.Fragment>
                            ),
                        )}
                    </Box>
                </Box>
            </CardContent>
        </Card>
    );
};

export default PatientSummaryCard;
