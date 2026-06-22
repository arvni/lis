import { createTheme, alpha } from '@mui/material/styles';

// Create a responsive theme
const createAppTheme = (mode = 'light') =>
    createTheme({
        palette: {
            mode,
            primary: {
                main: '#2563eb', // A deeper blue for better contrast
            },
            secondary: {
                main: mode === 'light' ? '#4f46e5' : '#818cf8', // Indigo that works in both modes
            },
            background: {
                default: mode === 'light' ? '#f8fafc' : '#0f172a',
                paper: mode === 'light' ? '#ffffff' : '#1e293b',
            },
            text: {
                primary: mode === 'light' ? '#334155' : '#e2e8f0',
                secondary: mode === 'light' ? '#64748b' : '#94a3b8',
            },
            divider: mode === 'light' ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.08)',
        },
        typography: {
            fontFamily: [
                'Inter',
                '-apple-system',
                'BlinkMacSystemFont',
                'Segoe UI',
                'Roboto',
                'Helvetica Neue',
                'Arial',
                'sans-serif',
            ].join(','),
            h5: {
                fontWeight: 600,
            },
            h6: {
                fontWeight: 600,
            },
            subtitle1: {
                fontWeight: 500,
            },
            body1: {
                fontSize: '0.9375rem',
            },
        },
        components: {
            MuiPaper: {
                styleOverrides: {
                    elevation1: {
                        boxShadow:
                            mode === 'light'
                                ? '0px 1px 3px rgba(0,0,0,0.05), 0px 1px 2px rgba(0,0,0,0.07)'
                                : '0px 1px 3px rgba(0,0,0,0.2), 0px 1px 2px rgba(0,0,0,0.15)',
                    },
                    elevation12: {
                        boxShadow:
                            mode === 'light'
                                ? '0px 6px 16px -8px rgba(0,0,0,0.08), 0px 9px 28px 0px rgba(0,0,0,0.05), 0px 12px 48px 16px rgba(0,0,0,0.03)'
                                : '0px 6px 16px -8px rgba(0,0,0,0.12), 0px 9px 28px 0px rgba(0,0,0,0.12), 0px 12px 48px 16px rgba(0,0,0,0.12)',
                    },
                },
            },
            MuiListItemButton: {
                styleOverrides: {
                    root: {
                        borderRadius: '8px',
                        margin: '4px 8px',
                        transition: 'all 0.2s ease',
                        '&.Mui-selected': {
                            backgroundColor: alpha(mode === 'light' ? '#2563eb' : '#3b82f6', 0.12),
                            '&:hover': {
                                backgroundColor: alpha(
                                    mode === 'light' ? '#2563eb' : '#3b82f6',
                                    0.18,
                                ),
                            },
                            '& .MuiListItemIcon-root': {
                                color: mode === 'light' ? '#2563eb' : '#60a5fa',
                            },
                            '& .MuiTypography-root': {
                                fontWeight: 500,
                                color: mode === 'light' ? '#2563eb' : '#60a5fa',
                            },
                        },
                    },
                },
            },
            MuiIconButton: {
                styleOverrides: {
                    root: {
                        transition: 'all 0.2s ease',
                        '&:hover': {
                            backgroundColor: alpha(mode === 'light' ? '#2563eb' : '#3b82f6', 0.08),
                        },
                    },
                },
            },
            MuiButton: {
                styleOverrides: {
                    root: {
                        borderRadius: '8px',
                        textTransform: 'none',
                        fontWeight: 500,
                        boxShadow: 'none',
                        '&:hover': {
                            boxShadow: 'none',
                        },
                    },
                },
            },
            MuiDrawer: {
                styleOverrides: {
                    paper: {
                        boxShadow:
                            mode === 'light'
                                ? '4px 0px 10px rgba(0, 0, 0, 0.05)'
                                : '4px 0px 10px rgba(0, 0, 0, 0.3)',
                    },
                },
            },
            MuiAppBar: {
                styleOverrides: {
                    root: {
                        boxShadow:
                            mode === 'light'
                                ? '0px 1px 3px rgba(0, 0, 0, 0.08)'
                                : '0px 1px 3px rgba(0, 0, 0, 0.2)',
                    },
                },
            },
            MuiAvatar: {
                styleOverrides: {
                    root: {
                        transition: 'all 0.2s ease',
                    },
                },
            },
            MuiListItemIcon: {
                styleOverrides: {
                    root: {
                        minWidth: 40,
                    },
                },
            },
            MuiBackdrop: {
                styleOverrides: {
                    root: {
                        backgroundColor:
                            mode === 'light' ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.7)',
                        backdropFilter: 'blur(4px)',
                    },
                },
            },
            MuiDivider: {
                styleOverrides: {
                    root: {
                        borderColor:
                            mode === 'light' ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.06)',
                    },
                },
            },
        },
        shape: {
            borderRadius: 8,
        },
        shadows: [
            'none',
            '0px 1px 2px rgba(0,0,0,0.06), 0px 1px 3px rgba(0,0,0,0.1)',
            '0px 1px 5px rgba(0,0,0,0.08), 0px 2px 2px rgba(0,0,0,0.05), 0px 3px 1px -2px rgba(0,0,0,0.04)',
            ...Array(22)
                .fill()
                .map((_, i) =>
                    i > 1
                        ? `0px ${i}px ${i * 2}px rgba(0,0,0,${mode === 'light' ? 0.06 : 0.1}), 0px ${i + 2}px ${i * 3}px rgba(0,0,0,${mode === 'light' ? 0.04 : 0.12})`
                        : 'none',
                ),
        ],
    });

export default createAppTheme;
