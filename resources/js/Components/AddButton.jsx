import React from 'react';
import { Fab, Tooltip, Zoom, useTheme } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";

/**
 * Enhanced AddButton component with improved styling and interactions
 *
 * @param {Function} onClick - Click handler function
 * @param {string} title - Button title for tooltip and aria-label
 * @param {string} color - Button color (primary, secondary, success, error, info, warning)
 * @param {Object} position - Custom position object with bottom, right, left, top values
 * @param {boolean} showTooltip - Whether to show tooltip (defaults to true)
 * @param {React.ReactNode} icon - Custom icon (defaults to AddIcon)
 * @param {Object} sx - Additional style props to apply
 */
const AddButton = ({
                       onClick,
                       title,
                       color = "primary",
                       position = { bottom: 16, right: 16 },
                       showTooltip = true,
                       icon = <AddIcon />,
                       sx = {},
                   }) => {
    const theme = useTheme();

    // Default position styles
    const positionStyles = {
        position: 'fixed',
        zIndex: theme.zIndex.speedDial,
        ...position
    };

    // Button with conditional tooltip
    const button = (
        <Fab
            onClick={onClick}
            aria-label={title}
            color={color}
            sx={{
                ...positionStyles,
                boxShadow: theme.shadows[4],
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                    transform: 'scale(1.05)',
                    boxShadow: theme.shadows[6],
                },
                '&:active': {
                    transform: 'scale(0.95)',
                },
                ...sx
            }}
            size="large"
        >
            {icon}
        </Fab>
    );

    // Return with or without tooltip
    return showTooltip ? (
        <Tooltip
            title={title}
            placement="left"
            arrow
            TransitionComponent={Zoom}
            enterDelay={500}
        >
            {button}
        </Tooltip>
    ) : button;
};

export default AddButton;
