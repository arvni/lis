import React, {useEffect, useState, useCallback, useMemo} from 'react';
import PropTypes from 'prop-types';
import {createTheme, ThemeProvider, alpha} from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import {
    Box, Toolbar, List, Typography, Divider, IconButton, Container,
    Menu, MenuItem as MuiMenuItem, Paper, Backdrop, CircularProgress,
    Avatar, Tooltip, Switch, ListItemIcon, ListItemText,
    useMediaQuery, Drawer as MuiDrawer, Fade
} from '@mui/material';
import {
    Menu as MenuIcon,
    ChevronLeft as ChevronLeftIcon,
    Dashboard as DashboardIcon,
    Logout as LogoutIcon,
    VpnKey as VpnKeyIcon,
    Person as PersonIcon,
    Brightness4 as DarkModeIcon,
    Brightness7 as LightModeIcon,
    Settings as SettingsIcon,
    Help as HelpIcon
} from '@mui/icons-material';
import {Link, router, useRemember, Head, usePage} from '@inertiajs/react';
import {InertiaProgress} from '@inertiajs/progress';

import routesFunction from '@/routes';
import ChangePassword from '@/Pages/User/Components/ChangePassword';
import MenuItem from './Components/MenuItem';
import AppBar from './Components/AppBar';
import Drawer from './Components/Drawer';
import Copyright from './Components/Copyright';
import Header from './Components/Header';
import Notification from './Components/Notification';

// Initialize Inertia Progress Bar
InertiaProgress.init({
    delay: 100,
    color: '#29d',
    includeCSS: true,
    showSpinner: true
});

// Create a responsive theme
const createAppTheme = (mode = 'light') => createTheme({
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
                    boxShadow: mode === 'light'
                        ? '0px 1px 3px rgba(0,0,0,0.05), 0px 1px 2px rgba(0,0,0,0.07)'
                        : '0px 1px 3px rgba(0,0,0,0.2), 0px 1px 2px rgba(0,0,0,0.15)'
                },
                elevation12: {
                    boxShadow: mode === 'light'
                        ? '0px 6px 16px -8px rgba(0,0,0,0.08), 0px 9px 28px 0px rgba(0,0,0,0.05), 0px 12px 48px 16px rgba(0,0,0,0.03)'
                        : '0px 6px 16px -8px rgba(0,0,0,0.12), 0px 9px 28px 0px rgba(0,0,0,0.12), 0px 12px 48px 16px rgba(0,0,0,0.12)'
                }
            }
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
                            backgroundColor: alpha(mode === 'light' ? '#2563eb' : '#3b82f6', 0.18),
                        },
                        '& .MuiListItemIcon-root': {
                            color: mode === 'light' ? '#2563eb' : '#60a5fa',
                        },
                        '& .MuiTypography-root': {
                            fontWeight: 500,
                            color: mode === 'light' ? '#2563eb' : '#60a5fa',
                        }
                    }
                }
            }
        },
        MuiIconButton: {
            styleOverrides: {
                root: {
                    transition: 'all 0.2s ease',
                    '&:hover': {
                        backgroundColor: alpha(mode === 'light' ? '#2563eb' : '#3b82f6', 0.08),
                    }
                }
            }
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
                    }
                }
            }
        },
        MuiDrawer: {
            styleOverrides: {
                paper: {
                    boxShadow: mode === 'light'
                        ? '4px 0px 10px rgba(0, 0, 0, 0.05)'
                        : '4px 0px 10px rgba(0, 0, 0, 0.3)'
                }
            }
        },
        MuiAppBar: {
            styleOverrides: {
                root: {
                    boxShadow: mode === 'light'
                        ? '0px 1px 3px rgba(0, 0, 0, 0.08)'
                        : '0px 1px 3px rgba(0, 0, 0, 0.2)'
                }
            }
        },
        MuiAvatar: {
            styleOverrides: {
                root: {
                    transition: 'all 0.2s ease',
                }
            }
        },
        MuiListItemIcon: {
            styleOverrides: {
                root: {
                    minWidth: 40,
                }
            }
        },
        MuiBackdrop: {
            styleOverrides: {
                root: {
                    backgroundColor: mode === 'light'
                        ? 'rgba(255, 255, 255, 0.5)'
                        : 'rgba(0, 0, 0, 0.7)',
                    backdropFilter: 'blur(4px)',
                }
            }
        },
        MuiDivider: {
            styleOverrides: {
                root: {
                    borderColor: mode === 'light' ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.06)',
                }
            }
        }
    },
    shape: {
        borderRadius: 8,
    },
    shadows: [
        'none',
        '0px 1px 2px rgba(0,0,0,0.06), 0px 1px 3px rgba(0,0,0,0.1)',
        '0px 1px 5px rgba(0,0,0,0.08), 0px 2px 2px rgba(0,0,0,0.05), 0px 3px 1px -2px rgba(0,0,0,0.04)',
        ...(Array(22).fill().map((_, i) => i > 1
            ? `0px ${i}px ${i * 2}px rgba(0,0,0,${mode === 'light' ? 0.06 : 0.1}), 0px ${i + 2}px ${i * 3}px rgba(0,0,0,${mode === 'light' ? 0.04 : 0.12})`
            : 'none'
        ))
    ],
});

const Authenticated = ({auth, breadcrumbs, children, title}) => {
    // Theme state
    const [darkMode, setDarkMode] = useRemember(false, "dark-mode");
    const [theme, setTheme] = useState(() => createAppTheme(darkMode ? 'dark' : 'light'));

    useEffect(() => {
        setTheme(createAppTheme(darkMode ? 'dark' : 'light'));
    }, [darkMode]);

    // State Management
    const [anchorEl, setAnchorEl] = useState(null);
    const [drawerOpen, setDrawerOpen] = useRemember(true, "drawer-open");
    const [changePasswordOpen, setChangePasswordOpen] = useRemember(false, "change-password-open");
    const [routes, setRoutes] = useState([]);
    const [loading, setLoading] = useState(false);
    const sections = usePage().props.sectionRoutes;
    const currentRoute = usePage().url;
    const [mobileOpen, setMobileOpen] = useState(false);
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    // User permissions (for MenuItem)
    const userPermissions = useMemo(() => auth.permissions || [], [auth.permissions]);

    // Fetch routes
    const fetchRoutes = useCallback(() => {
        const fetchedRoutes = routesFunction(sections);
        setRoutes(fetchedRoutes);
    }, [sections]);

    // Lifecycle: Fetch routes and manage loading state
    useEffect(() => {
        const handleStart = () => setLoading(true);
        const handleFinish = () => setLoading(false);

        document.addEventListener('inertia:start', handleStart);
        document.addEventListener('inertia:finish', handleFinish);
        fetchRoutes();

        return () => {
            document.removeEventListener('inertia:start', handleStart);
            document.removeEventListener('inertia:finish', handleFinish);
        };
    }, []);

    // Handle drawer based on screen size
    useEffect(() => {
        if (isMobile) {
            setDrawerOpen(false);
        } else {
            setMobileOpen(false);
        }
    }, [isMobile]);

    // Menu Handlers
    const handleMenuOpen = (event) => setAnchorEl(event.currentTarget);
    const handleMenuClose = () => setAnchorEl(null);
    const toggleDrawer = () => setDrawerOpen(!drawerOpen);
    const toggleMobileDrawer = () => setMobileOpen(!mobileOpen);
    const handleVisit = (addr) => () => {
        if (!addr.includes(currentRoute))
            router.visit(addr, {preserveState: false})
    };
    const handleChangePassword = () => {
        handleMenuClose();
        setChangePasswordOpen(true);
    };

    const toggleDarkMode = () => {
        setDarkMode(!darkMode);
    };

    // User menu items with icons
    const userMenuItems = [
        {
            label: auth.user.name,
            icon: <PersonIcon fontSize="small"/>,
            onClick: handleMenuClose,
            divider: true
        },
        {
            label: 'My Profile',
            icon: <PersonIcon fontSize="small"/>,
            onClick: () => {
                handleMenuClose();
                router.visit(route('profile.edit'));
            }
        },
        {
            label: 'Account Settings',
            icon: <SettingsIcon fontSize="small"/>,
            onClick: () => {
                handleMenuClose();
                router.visit(route('settings'));
            }
        },
        {
            label: 'Change Password',
            icon: <VpnKeyIcon fontSize="small"/>,
            onClick: handleChangePassword,
            divider: true
        },
        {
            label: darkMode ? 'Light Mode' : 'Dark Mode',
            icon: darkMode ? <LightModeIcon fontSize="small"/> : <DarkModeIcon fontSize="small"/>,
            onClick: () => {
                toggleDarkMode();
                handleMenuClose();
            },
            divider: true
        },
        {
            label: 'Help & Support',
            icon: <HelpIcon fontSize="small"/>,
            onClick: () => {
                handleMenuClose();
                router.visit(route('support'));
            },
            divider: true
        },
        {
            label: 'Logout',
            icon: <LogoutIcon fontSize="small"/>,
            component: Link,
            href: route('logout'),
            method: 'post'
        }
    ];

    const drawerContent = (
        // Using display:flex and flex-direction:column for the entire drawer content
        <Box sx={{display: 'flex', flexDirection: 'column', height: '100dvh'}}>
            <Toolbar
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    px: 2,
                    py: 1.5
                }}
            >
                <Box sx={{display: 'flex', alignItems: 'center'}}>
                    <DashboardIcon sx={{mr: 1, color: 'primary.main'}}/>
                    <Typography
                        variant="h6"
                        color="primary"
                        sx={{
                            fontWeight: 600,
                            opacity: drawerOpen ? 1 : 0,
                            transition: 'opacity 0.3s ease'
                        }}
                    >
                        Dashboard
                    </Typography>
                </Box>
                <IconButton onClick={isMobile ? toggleMobileDrawer : toggleDrawer} sx={{
                    transition: 'transform 0.3s ease',
                    transform: drawerOpen ? 'rotate(0deg)' : 'rotate(180deg)'
                }}>
                    <ChevronLeftIcon/>
                </IconButton>
            </Toolbar>

            <Divider/>

            {/* Removed search box */}

            {/* Scrollable routes list - using flex-grow to take available space */}
            <Box sx={{flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', mt: 2}}>
                <List sx={{
                    flex: 1,
                    overflow: 'auto',
                    '&::-webkit-scrollbar': {
                        width: '6px',
                    },
                    '&::-webkit-scrollbar-thumb': {
                        backgroundColor: alpha('#000', 0.1),
                        borderRadius: '3px',
                    },
                    '&::-webkit-scrollbar-track': {
                        backgroundColor: 'transparent',
                    }
                }}>
                    {routes.map((item, index) => (
                        <MenuItem
                            key={`menu-item-${index}`}
                            item={item}
                            permissions={userPermissions}
                            onNavigate={handleVisit}
                        />
                    ))}
                </List>
            </Box>

            {/* Dark Mode Toggle - fixed at the bottom */}
            <Box
                sx={{
                    m: 2,
                    p: 2,
                    borderRadius: 2,
                    backgroundColor: alpha(theme.palette.primary.main, 0.05),
                    display: drawerOpen ? 'flex' : 'none',
                    flexDirection: 'column',
                    alignItems: 'center',
                    opacity: 0.85,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                        opacity: 1,
                        backgroundColor: alpha(theme.palette.primary.main, 0.08),
                    }
                }}
            >
                <Box sx={{display: 'flex', alignItems: 'center', mb: 1}}>
                    <Typography variant="body2" color="text.secondary">
                        {darkMode ? 'Dark' : 'Light'} Mode
                    </Typography>
                    <Switch
                        size="small"
                        checked={darkMode}
                        onChange={toggleDarkMode}
                        color="primary"
                        sx={{ml: 1}}
                    />
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{textAlign: 'center'}}>
                    {`Welcome back, ${auth.user.name}`}
                </Typography>
            </Box>
        </Box>
    );

    return (
        <ThemeProvider theme={theme}>
            {title && <Head title={title}/>}
            <Box sx={{display: 'flex'}}>
                <CssBaseline/>
                <AppBar
                    position="absolute"
                    open={drawerOpen}
                    drawerWidth={260}
                    elevated={false}
                    elevation={1}>
                    <Toolbar sx={{pr: '24px'}}>
                        <IconButton
                            edge="start"
                            color="inherit"
                            aria-label="open drawer"
                            onClick={isMobile ? toggleMobileDrawer : toggleDrawer}
                            sx={{
                                marginRight: '36px',
                                display: drawerOpen && !isMobile ? 'none' : 'block',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            <MenuIcon/>
                        </IconButton>

                        <Typography
                            component="h1"
                            variant="h6"
                            color="inherit"
                            noWrap
                            sx={{flexGrow: 1}}
                        >
                            <Header breadcrumbs={breadcrumbs}/>
                        </Typography>

                        <Notification/>

                        {/* Dark Mode Toggle (visible only on desktop) */}
                        {!isMobile && (
                            <Tooltip title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}>
                                <IconButton color="inherit" onClick={toggleDarkMode} sx={{mr: 1}}>
                                    {darkMode ? <LightModeIcon/> : <DarkModeIcon/>}
                                </IconButton>
                            </Tooltip>
                        )}

                        {/* User Menu */}
                        <Tooltip title="Account menu">
                            <IconButton
                                size="large"
                                aria-label="account menu"
                                aria-controls="menu-appbar"
                                aria-haspopup="true"
                                onClick={handleMenuOpen}
                                color="inherit"
                            >
                                <Avatar
                                    sx={{
                                        width: 32,
                                        height: 32,
                                        bgcolor: 'primary.main',
                                        fontSize: '0.95rem',
                                        '&:hover': {
                                            bgcolor: 'primary.dark',
                                        }
                                    }}
                                >
                                    {auth.user.name.charAt(0).toUpperCase()}
                                </Avatar>
                            </IconButton>
                        </Tooltip>

                        <Menu
                            id="menu-appbar"
                            anchorEl={anchorEl}
                            anchorOrigin={{vertical: 'bottom', horizontal: 'right'}}
                            keepMounted
                            transformOrigin={{vertical: 'top', horizontal: 'right'}}
                            open={Boolean(anchorEl)}
                            onClose={handleMenuClose}
                            slotProps={{
                                Paper: {
                                    elevation: 3,
                                    sx: {
                                        minWidth: 200,
                                        mt: 1,
                                        borderRadius: 2,
                                        overflow: 'visible',
                                        '&:before': {
                                            content: '""',
                                            display: 'block',
                                            position: 'absolute',
                                            top: 0,
                                            right: 14,
                                            width: 10,
                                            height: 10,
                                            bgcolor: 'background.paper',
                                            transform: 'translateY(-50%) rotate(45deg)',
                                            zIndex: 0,
                                        },
                                    }
                                }
                            }}
                        >
                            {userMenuItems.map((item, index) => (
                                <React.Fragment key={index}>
                                    {item.component ? (
                                        <item.component
                                            href={item.href}
                                            method={item.method}
                                            as="div"
                                        >
                                            <MuiMenuItem onClick={item.onClick}>
                                                {item.icon && (
                                                    <ListItemIcon>
                                                        {item.icon}
                                                    </ListItemIcon>
                                                )}
                                                <ListItemText primary={item.label}/>
                                            </MuiMenuItem>
                                        </item.component>
                                    ) : (
                                        <MuiMenuItem onClick={item.onClick}>
                                            {item.icon && (
                                                <ListItemIcon>
                                                    {item.icon}
                                                </ListItemIcon>
                                            )}
                                            <ListItemText primary={item.label}/>
                                        </MuiMenuItem>
                                    )}
                                    {item.divider && <Divider/>}
                                </React.Fragment>
                            ))}
                        </Menu>
                    </Toolbar>
                </AppBar>

                {/* Mobile drawer */}
                {isMobile && (
                    <MuiDrawer
                        variant="temporary"
                        open={mobileOpen}
                        onClose={toggleMobileDrawer}
                        ModalProps={{
                            keepMounted: true, // Better mobile performance
                        }}
                        sx={{
                            display: {xs: 'block', md: 'none'},
                            '& .MuiDrawer-paper': {
                                boxSizing: 'border-box',
                                width: 240,
                            },
                        }}
                    >
                        {drawerContent}
                    </MuiDrawer>
                )}

                {/* Desktop drawer */}
                <Drawer
                    variant="permanent"
                    open={drawerOpen}
                    drawerWidth={260}
                    sx={{display: {xs: 'none', md: 'block'}}}
                >
                    {drawerContent}
                </Drawer>

                <Box
                    component="main"
                    sx={{
                        backgroundColor: (theme) => theme.palette.background.default,
                        flexGrow: 1,
                        minHeight: 'calc(100vh - 64px)',
                        overflow: 'auto',
                        transition: 'all 0.3s ease'
                    }}
                >
                    <Toolbar/>
                    <Container maxWidth={false} sx={{py: 3}}>
                        <Fade in={true} timeout={500}>
                            <Paper
                                elevation={1}
                                sx={{
                                    p: {xs: 2, sm: 3},
                                    borderRadius: 3,
                                    my: 2,
                                    transition: 'all 0.3s ease',
                                    overflow: 'hidden', // Prevent content overflow
                                }}
                            >
                                {children}
                            </Paper>
                        </Fade>
                    </Container>
                </Box>
            </Box>

            <Copyright sx={{pt: 4, pb: 4, opacity: 0.8}}/>

            <ChangePassword
                currentNeeded
                open={changePasswordOpen}
                onClose={() => setChangePasswordOpen(false)}
            />

            <Backdrop
                open={loading}
                sx={{
                    zIndex: theme.zIndex.modal + 1,
                }}
            >
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 2,
                        backgroundColor: alpha(theme.palette.background.paper, 0.75),
                        borderRadius: 2,
                        p: 3,
                        boxShadow: 3,
                    }}
                >
                    <CircularProgress color="primary" size={48} thickness={4}/>
                    <Typography variant="body2" color="text.secondary">
                        Loading...
                    </Typography>
                </Box>
            </Backdrop>
        </ThemeProvider>
    );
};

// PropTypes for Type Safety
Authenticated.propTypes = {
    auth: PropTypes.shape({
        user: PropTypes.shape({
            name: PropTypes.string.isRequired
        }).isRequired,
        permissions: PropTypes.arrayOf(PropTypes.string)
    }).isRequired,
    breadcrumbs: PropTypes.array,
    children: PropTypes.node.isRequired,
    title: PropTypes.string
};

export default Authenticated;
