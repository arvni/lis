import { Box, Toolbar, List, Typography, Divider, IconButton, Switch } from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
    ChevronLeft as ChevronLeftIcon,
    Dashboard as DashboardIcon,
} from '@mui/icons-material';
import MenuItem from './MenuItem';

const DrawerContent = ({
    theme,
    drawerOpen,
    onToggle,
    routes,
    userPermissions,
    onNavigate,
    darkMode,
    onToggleDarkMode,
    auth,
}) => (
    // Using display:flex and flex-direction:column for the entire drawer content
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100dvh' }}>
        <Toolbar
            sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                px: 2,
                py: 1.5,
            }}
        >
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <DashboardIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography
                    variant="h6"
                    color="primary"
                    sx={{
                        fontWeight: 600,
                        opacity: drawerOpen ? 1 : 0,
                        transition: 'opacity 0.3s ease',
                    }}
                >
                    Dashboard
                </Typography>
            </Box>
            <IconButton
                onClick={onToggle}
                sx={{
                    transition: 'transform 0.3s ease',
                    transform: drawerOpen ? 'rotate(0deg)' : 'rotate(180deg)',
                }}
            >
                <ChevronLeftIcon />
            </IconButton>
        </Toolbar>

        <Divider />

        {/* Scrollable routes list - using flex-grow to take available space */}
        <Box
            sx={{
                flex: 1,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                mt: 2,
            }}
        >
            <List
                sx={{
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
                    },
                }}
            >
                {routes.map((item, index) => (
                    <MenuItem
                        key={`menu-item-${index}`}
                        item={item}
                        permissions={userPermissions}
                        onNavigate={onNavigate}
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
                },
            }}
        >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                    {darkMode ? 'Dark' : 'Light'} Mode
                </Typography>
                <Switch
                    size="small"
                    checked={darkMode}
                    onChange={onToggleDarkMode}
                    color="primary"
                    sx={{ ml: 1 }}
                />
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
                {`Welcome back, ${auth.user.name}`}
            </Typography>
        </Box>
    </Box>
);

export default DrawerContent;
