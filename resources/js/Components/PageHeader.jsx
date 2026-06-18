import React from 'react';
import { Card, Paper, Stack, Box } from '@mui/material';
import Typography from '@mui/material/Typography';
import { Head } from '@inertiajs/react';
import PropTypes from 'prop-types';

const PageHeader = ({ title, actions, subtitle, icon }) => {
    return (
        <Card
            elevation={2}
            sx={{
                mb: 3,
                borderRadius: 2,
                overflow: 'hidden',
            }}
        >
            <Head title={typeof title === 'string' ? title : 'Dashboard'} />
            <Paper
                sx={{
                    pr: 2,
                    backgroundImage:
                        'linear-gradient(to right, rgba(0,0,0,0.02) 0%, rgba(0,0,0,0) 20%)',
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                }}
            >
                <Stack
                    direction="row"
                    spacing={2}
                    sx={{ justifyContent: 'space-between', alignItems: 'center' }}
                >
                    <Box sx={{ p: 2, pl: 3 }}>
                        {typeof title === 'string' ? (
                            <>
                                <Typography
                                    variant="h4"
                                    fontWeight={600}
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                    }}
                                >
                                    {icon && (
                                        <Box
                                            component="span"
                                            sx={{
                                                mr: 1.5,
                                                display: 'flex',
                                                color: 'primary.main',
                                            }}
                                        >
                                            {icon}
                                        </Box>
                                    )}
                                    {title}
                                </Typography>
                                {subtitle && (
                                    <Typography
                                        component="div"
                                        variant="body2"
                                        color="text.secondary"
                                        sx={{ mt: 0.5 }}
                                    >
                                        {subtitle}
                                    </Typography>
                                )}
                            </>
                        ) : (
                            title
                        )}
                    </Box>

                    {actions && (
                        <Stack
                            direction="row"
                            spacing={2}
                            sx={{ py: 1, flexWrap: 'wrap', alignItems: 'center' }}
                        >
                            {actions}
                        </Stack>
                    )}
                </Stack>
            </Paper>
        </Card>
    );
};

PageHeader.propTypes = {
    title: PropTypes.oneOfType([PropTypes.string, PropTypes.node]).isRequired,
    subtitle: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
    actions: PropTypes.node,
    icon: PropTypes.node,
};

export default PageHeader;
