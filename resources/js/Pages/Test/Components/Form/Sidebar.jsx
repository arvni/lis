import React from 'react';
import { Box, Button, Divider, Paper, Typography } from '@mui/material';
import { Cancel, CheckCircle, Error as ErrorIcon } from '@mui/icons-material';

export default function Sidebar({ meta, steps, step, setStep, data, stepHasError, cancel }) {
    const { Icon, label: typeLabel, color } = meta;
    return (
        <Paper elevation={0} variant="outlined" sx={{ overflow: 'hidden', position: 'sticky', top: 24 }}>
            {/* live test preview */}
            <Box sx={{ p: 2.5, bgcolor: `${color}.main`, color: `${color}.contrastText` }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75 }}>
                    <Icon sx={{ fontSize: 16, opacity: 0.9 }} />
                    <Typography
                        variant="caption"
                        fontWeight={700}
                        sx={{ textTransform: 'uppercase', letterSpacing: 1, opacity: 0.85 }}
                    >
                        {typeLabel}
                    </Typography>
                </Box>
                <Typography
                    variant="body1"
                    fontWeight={600}
                    sx={{ wordBreak: 'break-word', lineHeight: 1.3 }}
                >
                    {data.fullName || (
                        <span style={{ opacity: 0.5, fontStyle: 'italic' }}>Untitled</span>
                    )}
                </Typography>
                {(data.name || data.code) && (
                    <Typography variant="caption" sx={{ opacity: 0.75, mt: 0.5, display: 'block' }}>
                        {[data.name, data.code].filter(Boolean).join(' · ')}
                    </Typography>
                )}
            </Box>

            {/* step list */}
            <Box sx={{ py: 1 }}>
                {steps.map((s, idx) => {
                    const hasError = stepHasError(s);
                    const isActive = idx === step;
                    const isDone = idx < step && !hasError;

                    return (
                        <Box
                            key={s.key}
                            onClick={() => setStep(idx)}
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1.5,
                                px: 2,
                                py: 1.25,
                                cursor: 'pointer',
                                bgcolor: isActive ? `${color}.50` : 'transparent',
                                borderLeft: '3px solid',
                                borderLeftColor: isActive ? `${color}.main` : 'transparent',
                                color: isActive
                                    ? `${color}.main`
                                    : hasError
                                      ? 'error.main'
                                      : 'text.primary',
                                '&:hover': {
                                    bgcolor: isActive ? `${color}.50` : 'action.hover',
                                },
                                transition: 'all 0.15s',
                            }}
                        >
                            <Box
                                sx={{
                                    width: 26,
                                    height: 26,
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0,
                                    bgcolor: isActive
                                        ? `${color}.main`
                                        : hasError
                                          ? 'error.light'
                                          : isDone
                                            ? 'success.light'
                                            : 'grey.100',
                                    color: isActive
                                        ? 'white'
                                        : hasError
                                          ? 'error.main'
                                          : isDone
                                            ? 'success.main'
                                            : 'text.disabled',
                                }}
                            >
                                {hasError ? (
                                    <ErrorIcon sx={{ fontSize: 14 }} />
                                ) : isDone ? (
                                    <CheckCircle sx={{ fontSize: 14 }} />
                                ) : (
                                    React.cloneElement(s.icon, { style: { fontSize: 14 } })
                                )}
                            </Box>
                            <Typography variant="body2" fontWeight={isActive ? 600 : 400}>
                                {s.label}
                            </Typography>
                        </Box>
                    );
                })}
            </Box>

            <Divider />
            <Box sx={{ p: 1.5 }}>
                <Button
                    fullWidth
                    size="small"
                    color="inherit"
                    startIcon={<Cancel />}
                    onClick={cancel}
                >
                    Cancel
                </Button>
            </Box>
        </Paper>
    );
}
