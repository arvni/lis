import {styled} from '@mui/material/styles';
import MuiDrawer from '@mui/material/Drawer';

// Default width matched with AppBar component
const DEFAULT_DRAWER_WIDTH = 260;

/**
 * Enhanced Drawer component with improved transitions and customization options
 *
 * Features:
 * - Configurable width via props
 * - Smoother transitions with consistent timing
 * - Better collapse behavior with customizable collapsed width
 * - Improved overflow handling
 * - Responsive design adjustments
 */
const Drawer = styled(MuiDrawer, {
    shouldForwardProp: (prop) => !['open', 'drawerWidth', 'collapsedWidth'].includes(prop)
})(
    ({theme, open, drawerWidth = DEFAULT_DRAWER_WIDTH, collapsedWidth}) => {
        // Determine collapsed width based on screen size or provided prop
        const defaultCollapsedWidth = theme.spacing(7);
        const smCollapsedWidth = theme.breakpoints.up('sm') ? theme.spacing(9) : defaultCollapsedWidth;
        const finalCollapsedWidth = collapsedWidth || smCollapsedWidth;

        return {
            width: open ? drawerWidth : finalCollapsedWidth,
            flexShrink: 0,
            whiteSpace: 'nowrap',
            boxSizing: 'border-box',

            '& .MuiDrawer-paper': {
                position: 'fixed',
                height: "100dvh",
                width: drawerWidth,
                backgroundColor: theme.palette.mode === 'light'
                    ? '#ffffff'
                    : theme.palette.background.paper,
                borderRight: `1px solid ${
                    theme.palette.mode === 'light'
                        ? theme.palette.grey[200]
                        : theme.palette.divider
                }`,
                transition: theme.transitions.create('width', {
                    easing: theme.transitions.easing.easeInOut,
                    duration: theme.transitions.duration.standard,
                }),
                overflowX: 'hidden',
                boxSizing: 'border-box',
                boxShadow: open
                    ? '0px 3px 5px -1px rgba(0,0,0,0.04), 0px 5px 8px 0px rgba(0,0,0,0.02), 0px 1px 14px 0px rgba(0,0,0,0.01)'
                    : 'none',

                // Collapsed state styling
                ...(!open && {
                    width: finalCollapsedWidth,
                    transition: theme.transitions.create('width', {
                        easing: theme.transitions.easing.easeInOut,
                        duration: theme.transitions.duration.standard,
                    }),
                    overflowX: 'hidden',

                    // Adjust icon and text display in collapsed state
                    '& .MuiListItemIcon-root': {
                        minWidth: 0,
                        marginRight: 'auto',
                        marginLeft: 'auto',
                        justifyContent: 'center',
                    },
                    '& .MuiListItemText-root': {
                        opacity: 0,
                    },
                    '& .MuiListItemText-primary': {
                        opacity: 0,
                        transition: theme.transitions.create(['opacity'], {
                            duration: theme.transitions.duration.shortest,
                        }),
                    },
                }),

                // When drawer is open, improve text transitions
                ...(open && {
                    '& .MuiListItemText-root': {
                        opacity: 1,
                        transition: theme.transitions.create(['opacity'], {
                            duration: theme.transitions.duration.standard,
                            delay: 100, // Slight delay for better visual effect
                        }),
                    },
                    '& .MuiListItemText-primary': {
                        opacity: 1,
                        transition: theme.transitions.create(['opacity'], {
                            duration: theme.transitions.duration.standard,
                            delay: 100,
                        }),
                    },
                }),

                // Responsive adjustments
                [theme.breakpoints.down('sm')]: {
                    position: open ? 'fixed' : 'absolute',
                    height: '100%',
                    zIndex: theme.zIndex.drawer,
                },
            },
        };
    }
);

export default Drawer;
