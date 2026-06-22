import React from 'react';
import {
    Toolbar,
    Typography,
    Divider,
    IconButton,
    Menu,
    MenuItem as MuiMenuItem,
    Avatar,
    Tooltip,
    ListItemIcon,
    ListItemText,
} from '@mui/material';
import {
    Menu as MenuIcon,
    Brightness4 as DarkModeIcon,
    Brightness7 as LightModeIcon,
} from '@mui/icons-material';
import AppBar from './AppBar';
import Header from './Header';
import Notification from './Notification';

const TopAppBar = ({
    drawerOpen,
    isMobile,
    onToggleDrawer,
    breadcrumbs,
    darkMode,
    onToggleDarkMode,
    auth,
    anchorEl,
    onMenuOpen,
    onMenuClose,
    userMenuItems,
}) => (
    <AppBar position="absolute" open={drawerOpen} drawerWidth={260} elevated={false} elevation={1}>
        <Toolbar sx={{ pr: '24px' }}>
            <IconButton
                edge="start"
                color="inherit"
                aria-label="open drawer"
                onClick={onToggleDrawer}
                sx={{
                    marginRight: '36px',
                    display: drawerOpen && !isMobile ? 'none' : 'block',
                    transition: 'all 0.2s ease',
                }}
            >
                <MenuIcon />
            </IconButton>

            <Typography
                component="h1"
                variant="h6"
                color="inherit"
                noWrap
                sx={{ flexGrow: 1 }}
            >
                <Header breadcrumbs={breadcrumbs} />
            </Typography>

            <Notification />

            {/* Dark Mode Toggle (visible only on desktop) */}
            {!isMobile && (
                <Tooltip title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
                    <IconButton color="inherit" onClick={onToggleDarkMode} sx={{ mr: 1 }}>
                        {darkMode ? <LightModeIcon /> : <DarkModeIcon />}
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
                    onClick={onMenuOpen}
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
                            },
                        }}
                    >
                        {auth.user.name.charAt(0).toUpperCase()}
                    </Avatar>
                </IconButton>
            </Tooltip>

            <Menu
                id="menu-appbar"
                anchorEl={anchorEl}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                keepMounted
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                open={Boolean(anchorEl)}
                onClose={onMenuClose}
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
                        },
                    },
                }}
            >
                {userMenuItems.map((item, index) => (
                    <React.Fragment key={index}>
                        {item.component ? (
                            <item.component href={item.href} method={item.method} as="div">
                                <MuiMenuItem onClick={item.onClick}>
                                    {item.icon && <ListItemIcon>{item.icon}</ListItemIcon>}
                                    <ListItemText primary={item.label} />
                                </MuiMenuItem>
                            </item.component>
                        ) : (
                            <MuiMenuItem onClick={item.onClick}>
                                {item.icon && <ListItemIcon>{item.icon}</ListItemIcon>}
                                <ListItemText primary={item.label} />
                            </MuiMenuItem>
                        )}
                        {item.divider && <Divider />}
                    </React.Fragment>
                ))}
            </Menu>
        </Toolbar>
    </AppBar>
);

export default TopAppBar;
