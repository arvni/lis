import { useEffect, useState, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { ThemeProvider, alpha } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import {
    Box,
    Toolbar,
    Typography,
    Container,
    Paper,
    Backdrop,
    CircularProgress,
    useMediaQuery,
    Drawer as MuiDrawer,
    Fade,
} from '@mui/material';
import {
    Logout as LogoutIcon,
    VpnKey as VpnKeyIcon,
    Person as PersonIcon,
    Brightness4 as DarkModeIcon,
    Brightness7 as LightModeIcon,
    Settings as SettingsIcon,
} from '@mui/icons-material';
import { Link, router, useRemember, Head, usePage } from '@inertiajs/react';

import routesFunction from '@/routes';
import ChangePassword from '@/Pages/User/Components/ChangePassword';
import Drawer from './Components/Drawer';
import Copyright from './Components/Copyright';
import ConnectionCheck from './Components/ConnectionCheck';
import ErrorBoundary from '@/Components/ErrorBoundary';
import createAppTheme from './Components/createAppTheme';
import DrawerContent from './Components/DrawerContent';
import TopAppBar from './Components/TopAppBar';

// Progress bar is configured via createInertiaApp's `progress` option in app.jsx
// (Inertia 2 built-in), so the legacy @inertiajs/progress init is not needed.

const Authenticated = ({ auth, breadcrumbs, children, title }) => {
    // Theme state
    const [darkMode, setDarkMode] = useRemember(false, 'dark-mode');
    const [theme, setTheme] = useState(() => createAppTheme(darkMode ? 'dark' : 'light'));

    useEffect(() => {
        setTheme(createAppTheme(darkMode ? 'dark' : 'light'));
    }, [darkMode]);

    // State Management
    const [anchorEl, setAnchorEl] = useState(null);
    const [drawerOpen, setDrawerOpen] = useRemember(true, 'drawer-open');
    const [changePasswordOpen, setChangePasswordOpen] = useRemember(false, 'change-password-open');
    const [routes, setRoutes] = useState([]);
    const [loading, setLoading] = useState(false);
    const sections = usePage().props.sectionRoutes;
    const reorderAlertCount = usePage().props.reorderAlertCount ?? 0;
    const currentRoute = usePage().url;
    const [mobileOpen, setMobileOpen] = useState(false);
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    // User permissions (for MenuItem)
    const userPermissions = useMemo(() => auth.permissions || [], [auth.permissions]);

    // Fetch routes
    const fetchRoutes = useCallback(() => {
        const fetchedRoutes = routesFunction(sections);
        // Inject badge count into Reorder Alerts nav item
        const patched = fetchedRoutes.map((group) => ({
            ...group,
            child: (group.child ?? []).map((item) =>
                item.route === 'inventory.reorder-alerts.index' && reorderAlertCount > 0
                    ? { ...item, badge: reorderAlertCount }
                    : item,
            ),
        }));
        setRoutes(patched);
    }, [sections, reorderAlertCount]);

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
        // Mount-only: register Inertia load listeners once and build the initial routes.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Handle drawer based on screen size
    useEffect(() => {
        if (isMobile) {
            setDrawerOpen(false);
        } else {
            setMobileOpen(false);
        }
    }, [isMobile, setDrawerOpen, setMobileOpen]);

    // Menu Handlers
    const handleMenuOpen = (event) => setAnchorEl(event.currentTarget);
    const handleMenuClose = () => setAnchorEl(null);
    const toggleDrawer = () => setDrawerOpen(!drawerOpen);
    const toggleMobileDrawer = () => setMobileOpen(!mobileOpen);
    const handleVisit = (addr) => () => {
        const url = URL.parse(addr);
        const current = URL.parse(origin + currentRoute);
        if (url.pathname !== current.pathname) router.visit(addr, { preserveState: false });
    };
    const handleChangePassword = () => {
        handleMenuClose();
        setChangePasswordOpen(true);
    };

    const toggleDarkMode = () => {
        setDarkMode(!darkMode);
    };

    const toggleActiveDrawer = isMobile ? toggleMobileDrawer : toggleDrawer;

    // User menu items with icons
    const userMenuItems = [
        {
            label: auth.user.name,
            icon: <PersonIcon fontSize="small" />,
            onClick: handleMenuClose,
            divider: true,
        },
        {
            label: 'Account Settings',
            icon: <SettingsIcon fontSize="small" />,
            onClick: () => {
                handleMenuClose();
                router.visit(route('settings.index'));
            },
        },
        {
            label: 'Change Password',
            icon: <VpnKeyIcon fontSize="small" />,
            onClick: handleChangePassword,
            divider: true,
        },
        {
            label: darkMode ? 'Light Mode' : 'Dark Mode',
            icon: darkMode ? <LightModeIcon fontSize="small" /> : <DarkModeIcon fontSize="small" />,
            onClick: () => {
                toggleDarkMode();
                handleMenuClose();
            },
            divider: true,
        },
        {
            label: 'Logout',
            icon: <LogoutIcon fontSize="small" />,
            component: Link,
            href: route('logout'),
            method: 'post',
        },
    ];

    const drawerContent = (
        <DrawerContent
            theme={theme}
            drawerOpen={drawerOpen}
            onToggle={toggleActiveDrawer}
            routes={routes}
            userPermissions={userPermissions}
            onNavigate={handleVisit}
            darkMode={darkMode}
            onToggleDarkMode={toggleDarkMode}
            auth={auth}
        />
    );

    return (
        <ThemeProvider theme={theme}>
            <ConnectionCheck>
                {title && <Head title={title} />}
                <Box sx={{ display: 'flex' }}>
                    <CssBaseline />
                    <TopAppBar
                        drawerOpen={drawerOpen}
                        isMobile={isMobile}
                        onToggleDrawer={toggleActiveDrawer}
                        breadcrumbs={breadcrumbs}
                        darkMode={darkMode}
                        onToggleDarkMode={toggleDarkMode}
                        auth={auth}
                        anchorEl={anchorEl}
                        onMenuOpen={handleMenuOpen}
                        onMenuClose={handleMenuClose}
                        userMenuItems={userMenuItems}
                    />

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
                                display: { xs: 'block', md: 'none' },
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
                        sx={{ display: { xs: 'none', md: 'block' } }}
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
                            transition: 'all 0.3s ease',
                        }}
                    >
                        <Toolbar />
                        <Container maxWidth={false} sx={{ py: 3 }}>
                            <Fade in={true} timeout={500}>
                                <Paper
                                    elevation={1}
                                    sx={{
                                        p: { xs: 2, sm: 3 },
                                        borderRadius: 3,
                                        my: 2,
                                        transition: 'all 0.3s ease',
                                        overflow: 'hidden', // Prevent content overflow
                                    }}
                                >
                                    {/* Isolate page render errors to the content region so an
                                        uncaught throw in one page doesn't white-screen the whole
                                        app; resetKeys={[currentRoute]} recovers on navigation. */}
                                    <ErrorBoundary variant="inline" resetKeys={[currentRoute]}>
                                        {children}
                                    </ErrorBoundary>
                                </Paper>
                            </Fade>
                        </Container>
                    </Box>
                </Box>

                <Copyright sx={{ pt: 4, pb: 4, opacity: 0.8 }} />

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
                        <CircularProgress color="primary" size={48} thickness={4} />
                        <Typography variant="body2" color="text.secondary">
                            Loading...
                        </Typography>
                    </Box>
                </Backdrop>
            </ConnectionCheck>
        </ThemeProvider>
    );
};

// PropTypes for Type Safety
Authenticated.propTypes = {
    auth: PropTypes.shape({
        user: PropTypes.shape({
            name: PropTypes.string.isRequired,
        }).isRequired,
        permissions: PropTypes.arrayOf(PropTypes.string),
    }).isRequired,
    breadcrumbs: PropTypes.array,
    children: PropTypes.node.isRequired,
    title: PropTypes.string,
};

export default Authenticated;
