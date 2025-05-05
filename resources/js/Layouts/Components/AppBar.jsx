import { styled } from '@mui/material/styles';
import MuiAppBar from '@mui/material/AppBar';

// Make drawer width configurable but provide a default value
const DEFAULT_DRAWER_WIDTH = 260;

/**
 * Enhanced AppBar component that adapts based on drawer state
 *
 * Features:
 * - Smoother transitions with customizable easing
 * - Configurable drawer width via props
 * - Responsive height adjustments
 * - Optional elevated state for scrolling
 * - Shadow customization
 */
const AppBar = styled(MuiAppBar, {
    shouldForwardProp: (prop) => !['open', 'drawerWidth', 'elevated'].includes(prop),
})(({ theme, open, drawerWidth = DEFAULT_DRAWER_WIDTH, elevated = false }) => ({
    // Base styles
    position: 'fixed',
    zIndex: theme.zIndex.drawer + 1,
    boxShadow: elevated
        ? '0px 2px 4px -1px rgba(0,0,0,0.1), 0px 4px 5px 0px rgba(0,0,0,0.07), 0px 1px 10px 0px rgba(0,0,0,0.06)'
        : 'none',
    backgroundColor: theme.palette.mode === 'light'
        ? theme.palette.primary.main
        : theme.palette.primary.dark,

    // Transition and sizing
    height: 64,
    transition: theme.transitions.create(['width', 'margin', 'box-shadow'], {
        easing: theme.transitions.easing.easeInOut, // Smoother easing
        duration: theme.transitions.duration.standard, // More appropriate duration
    }),

    // Default state (drawer closed)
    width: '100%',

    // Open state styles
    ...(open && {
        marginLeft: drawerWidth,
        width: `calc(100% - ${drawerWidth}px)`,
        transition: theme.transitions.create(['width', 'margin', 'box-shadow'], {
            easing: theme.transitions.easing.easeInOut,
            duration: theme.transitions.duration.standard,
        }),
    }),

    // Responsive adjustments
    [theme.breakpoints.down('sm')]: {
        height: 56, // Smaller height on mobile
        ...(open && {
            width: '100%',
            marginLeft: 0,
        }),
    },
}));

export default AppBar;
